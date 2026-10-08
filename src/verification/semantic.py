# Note for Member 3: You will import the actual model function from Member 2's code.
# For now, we mock the interface so you can build your logic.

try:
    # Assuming Member 2 builds this in src/inference/nli_model.py
    from src.inference.nli_model import check_entailment
except ImportError:
    # Mock function if Member 2 hasn't built it yet
    def check_entailment(premise: str, hypothesis: str) -> dict:
        print("Mock NLI Model: Returning fake scores for testing.")
        # Faking a result where the AI hallucinated/contradicted
        return {"entailment": 0.2, "contradiction": 0.7, "neutral": 0.1}

def verify_semantic_meaning(original_text: str, simplified_text: str) -> list:
    """
    Uses the NLI model to check if the simplified text contradicts the original text.
    """
    warnings = []
    
    # Get scores from Member 2's NLI model
    scores = check_entailment(original_text, simplified_text)
    
    contradiction_score = scores.get("contradiction", 0)
    entailment_score = scores.get("entailment", 0)

    # Threshold logic: If contradiction is > 50% or entailment is < 30%
    if contradiction_score > 0.5:
        warnings.append(f"CRITICAL WARNING (Semantic): High probability ({contradiction_score*100:.1f}%) that the new text CONTRADICTS the original.")
    elif entailment_score < 0.3:
        warnings.append(f"WARNING (Semantic): The new text has a low probability ({entailment_score*100:.1f}%) of matching the original meaning.")

    return warnings
