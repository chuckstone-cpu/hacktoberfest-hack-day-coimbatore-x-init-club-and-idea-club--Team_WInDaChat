from extractor import extract_facts
from rules import verify_checklist
from semantic import verify_semantic_meaning

def run_test():
    print("--- Running Safety Verification Test ---")
    
    original_text = "The patient must not consume alcohol for 30 days unless prescribed by a doctor."
    
    # Simulating a dangerous mistake made by the AI text simplifier
    bad_ai_output = "The patient can consume alcohol."

    print(f"\n[1] Original Text: {original_text}")
    print(f"[2] Bad AI Output: {bad_ai_output}")

    # Step 1: Extract Facts
    facts = extract_facts(original_text)
    print(f"\n[3] Extracted Facts Checklist: {facts}")

    # Step 2: Rule-Based Check
    rule_warnings = verify_checklist(facts, bad_ai_output)
    print("\n[4] Rule-Based Warnings:")
    for w in rule_warnings:
        print(f" -> {w}")

    # Step 3: Semantic Check
    semantic_warnings = verify_semantic_meaning(original_text, bad_ai_output)
    print("\n[5] Semantic Warnings:")
    for w in semantic_warnings:
        print(f" -> {w}")

if __name__ == "__main__":
    run_test()
