"""Run a repeatable story workload for each Ollama KV cache setting.

The runner owns only the Ollama processes that it starts. Stop a desktop
Ollama service before running it so the temporary server can bind port 11434.
"""

import argparse
import csv
import os
import subprocess
import time
from pathlib import Path

import requests

from core import db
from core.config import OLLAMA_HOST
from core.story import narrate, verify


RESULTS_PATH = Path("lab/results/results.csv")


def wait_for_server(timeout: int = 45):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        try:
            requests.get(f"{OLLAMA_HOST.rstrip('/')}/api/tags", timeout=2).raise_for_status()
            return
        except requests.RequestException:
            time.sleep(1)
    raise RuntimeError("Ollama did not start within the timeout.")


def memory_bytes(model: str) -> int | None:
    try:
        models = requests.get(f"{OLLAMA_HOST.rstrip('/')}/api/ps", timeout=10).json().get("models", [])
        return next((item.get("size_vram") or item.get("size") for item in models if item.get("name") == model), None)
    except requests.RequestException:
        return None


def run(cache_type: str, thread, model: str, ctx: int) -> dict:
    environment = os.environ.copy()
    environment["OLLAMA_KV_CACHE_TYPE"] = cache_type
    environment["OLLAMA_FLASH_ATTENTION"] = "1"
    environment["OLLAMA_MODEL"] = model
    environment["NUM_CTX"] = str(ctx)
    process = subprocess.Popen(["ollama", "serve"], env=environment)
    try:
        wait_for_server()
        started = time.monotonic()
        story = narrate(thread)
        elapsed = time.monotonic() - started
        report = verify(thread, story)
        facts = report["facts"]
        return {
            "kv_cache_type": cache_type,
            "context_tokens": ctx,
            "memory_bytes": memory_bytes(model),
            "story_seconds": round(elapsed, 2),
            "facts_total": len(facts),
            "facts_appears_preserved": sum(fact["status"] == "appears_preserved" for fact in facts),
        }
    finally:
        process.terminate()
        try:
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            process.kill()


def main():
    parser = argparse.ArgumentParser(description="Compare Ollama KV cache precisions.")
    parser.add_argument("--model", default=os.getenv("OLLAMA_MODEL", "gemma4:e4b"))
    parser.add_argument("--ctx", type=int, default=32768)
    parser.add_argument("--cache-types", nargs="+", default=["f16", "q8_0", "q4_0"])
    args = parser.parse_args()

    db.init_db()
    threads = db.threads()
    if not threads:
        raise SystemExit("Add at least one connected thread before running the lab.")
    thread = max(threads, key=len)
    RESULTS_PATH.parent.mkdir(parents=True, exist_ok=True)
    results = [run(cache_type, thread, args.model, args.ctx) for cache_type in args.cache_types]
    with RESULTS_PATH.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=results[0].keys())
        writer.writeheader()
        writer.writerows(results)
    print(f"Wrote {len(results)} results to {RESULTS_PATH}")


if __name__ == "__main__":
    main()
