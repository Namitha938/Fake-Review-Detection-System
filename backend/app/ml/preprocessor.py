import re
from typing import Dict, Any, List
import spacy

try:
    nlp = spacy.load("en_core_web_sm", disable=["parser", "ner"])
except Exception:
    nlp = spacy.blank("en")

def clean_text(text: str) -> str:
    """Standardize and clean text."""
    if not text:
        return ""
    # Remove HTML tags if any
    cleaned = re.sub(r"<[^>]+>", " ", text)
    # Normalize whitespaces
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned

def extract_linguistic_features(text: str) -> Dict[str, Any]:
    """Extract linguistic, stylistic, and structural patterns from review text."""
    if not text:
        return {
            "char_count": 0,
            "word_count": 0,
            "avg_word_length": 0.0,
            "exclamation_count": 0,
            "exclamation_ratio": 0.0,
            "uppercase_ratio": 0.0,
            "lexical_diversity": 0.0,
            "suspicious_patterns_score": 0.0
        }
    
    char_count = len(text)
    words = text.split()
    word_count = len(words)
    
    # Exclamation & question mark patterns
    exclamation_count = text.count("!")
    question_count = text.count("?")
    exclamation_ratio = round((exclamation_count / max(1, word_count)), 3)
    
    # Uppercase words count (SHOUTING)
    uppercase_words = [w for w in words if w.isupper() and len(w) > 1]
    uppercase_ratio = round(len(uppercase_words) / max(1, word_count), 3)
    
    # Average word length
    avg_word_len = round(sum(len(w) for w in words) / max(1, word_count), 2)
    
    # Lexical diversity (Type-Token Ratio)
    unique_words = set(w.lower() for w in words)
    lexical_diversity = round(len(unique_words) / max(1, word_count), 3)
    
    # Suspicious exaggeration cues (common deceptive markers in literature)
    superlatives = ["best ever", "worst ever", "greatest", "terrible", "god himself", "miracle", "poison", "scam", "100/10", "perfection"]
    lower_text = text.lower()
    superlative_matches = sum(1 for phrase in superlatives if phrase in lower_text)
    
    suspicious_patterns_score = min(1.0, round((exclamation_ratio * 0.3) + (uppercase_ratio * 0.4) + (superlative_matches * 0.15), 3))
    
    return {
        "char_count": char_count,
        "word_count": word_count,
        "avg_word_length": avg_word_len,
        "exclamation_count": exclamation_count,
        "exclamation_ratio": exclamation_ratio,
        "uppercase_ratio": uppercase_ratio,
        "lexical_diversity": lexical_diversity,
        "suspicious_patterns_score": suspicious_patterns_score
    }

def spacy_tokenize_lemmatize(text: str) -> List[str]:
    """Tokenize and lemmatize words using spaCy, excluding stopwords and punctuation."""
    doc = nlp(text.lower())
    tokens = [
        token.lemma_ for token in doc 
        if not token.is_stop and not token.is_punct and len(token.lemma_.strip()) > 1
    ]
    return tokens

