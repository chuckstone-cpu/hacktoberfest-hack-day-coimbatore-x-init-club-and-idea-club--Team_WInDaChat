"""Load a small local demo dataset."""

from core import db
from core.pipeline import save_note


NOTES = [
    "Negative feedback reduces error in a control system by comparing output with a reference.",
    "TCP congestion control reduces sending speed when packet loss indicates a network bottleneck.",
    "A central bank can raise interest rates to reduce demand and control inflation.",
]


if __name__ == "__main__":
    db.init_db()
    for note in NOTES:
        save_note(note)
    print(f"Seeded {len(NOTES)} notes")
