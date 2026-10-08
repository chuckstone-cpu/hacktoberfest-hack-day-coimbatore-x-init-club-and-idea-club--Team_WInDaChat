def verify_checklist(extracted_facts: dict, simplified_text: str) -> list:
    """
    Checks if all items in the extracted_facts checklist are present in the simplified_text.
    Returns a list of warning messages for anything that is missing.
    """
    warnings = []
    simplified_lower = simplified_text.lower()

    # Check Entities (Numbers, Dates, etc.)
    for entity in extracted_facts.get("entities", []):
        if entity.lower() not in simplified_lower:
            warnings.append(f"WARNING (Deletion): The critical entity/number '{entity}' is missing.")

    # Check Negations
    for neg in extracted_facts.get("negations", []):
        if neg.lower() not in simplified_lower:
            warnings.append(f"CRITICAL WARNING (Negation): The negation '{neg}' was removed, which may reverse the meaning.")

    # Check Conditions
    for cond in extracted_facts.get("conditions", []):
        if cond.lower() not in simplified_lower:
            warnings.append(f"WARNING (Condition): The conditional clause containing '{cond}' was removed.")

    return warnings
