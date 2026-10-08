import spacy
import re

# Load the English NLP model. 
# NOTE: Ensure you run `python -m spacy download en_core_web_sm` before running this.
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("Warning: spacy model 'en_core_web_sm' not found. Please install it.")
    nlp = None

# Hardcoded conditional phrases to look for using Regex
CONDITIONS_PATTERN = re.compile(r'\b(unless|provided that|if|except|as long as|subject to)\b', re.IGNORECASE)

def extract_facts(text: str) -> dict:
    """
    Parses the text and extracts immutable facts: numbers, dates, negations, and conditions.
    """
    facts = {
        "entities": [], # Stores Numbers, Dates, Money, etc.
        "negations": [],
        "conditions": []
    }
    
    if nlp is None:
        return facts

    doc = nlp(text)

    # 1. Extract Entities (Numbers, Dates, Time, Money, Percent)
    for ent in doc.ents:
        if ent.label_ in ["DATE", "TIME", "PERCENT", "MONEY", "QUANTITY", "ORDINAL", "CARDINAL"]:
            facts["entities"].append(ent.text)

    # 2. Extract Negations (using dependency parsing)
    for token in doc:
        if token.dep_ == "neg":
            facts["negations"].append(token.text)

    # 3. Extract Conditions (using Regex)
    conditions_found = CONDITIONS_PATTERN.findall(text)
    facts["conditions"].extend(conditions_found)

    # Clean up duplicates
    facts["entities"] = list(set(facts["entities"]))
    facts["negations"] = list(set(facts["negations"]))
    facts["conditions"] = list(set([c.lower() for c in facts["conditions"]]))

    return facts
