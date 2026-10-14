from typing import List, Tuple, Optional, Dict, Any
from rapidfuzz import fuzz, process

def check_duplicate_review(
    text: str, 
    existing_reviews: List[Dict[str, Any]], 
    threshold: float = 85.0
) -> Tuple[bool, float, Optional[int]]:
    """
    Check if a given review text is a duplicate or near-duplicate of existing reviews.
    existing_reviews is a list of dicts: [{"id": 1, "text": "..."}]
    Returns: (is_duplicate: bool, similarity: float, matched_id: Optional[int])
    """
    if not text or not existing_reviews:
        return False, 0.0, None

    normalized_input = text.strip().lower()
    words = normalized_input.split()

    # Rule: Reviews with 5 words or fewer (e.g., short generic phrases) are not flagged as duplicates
    if len(words) <= 5:
        return False, 0.0, None

    highest_score = 0.0
    matched_id = None

    for item in existing_reviews:
        cand_text = item.get("text", "").strip().lower()
        if not cand_text:
            continue

        cand_words = cand_text.split()
        if len(cand_words) <= 5:
            continue

        # Fast direct check
        if cand_text == normalized_input:
            return True, 100.0, item.get("id")

        # Token sort ratio handles rearranged words and repetition
        score = fuzz.token_sort_ratio(normalized_input, cand_text)
        if score > highest_score:
            highest_score = score
            matched_id = item.get("id")

    is_dup = highest_score >= threshold
    return is_dup, round(highest_score, 1), (matched_id if is_dup else None)

def detect_batch_internal_duplicates(texts: List[str], threshold: float = 85.0) -> List[Dict[str, Any]]:
    """Detect duplicate copies among a batch of uploaded reviews."""
    results = []
    seen: List[Dict[str, Any]] = []
    
    for idx, t in enumerate(texts):
        is_dup, score, matched_idx = check_duplicate_review(t, seen, threshold)
        results.append({
            "is_duplicate": is_dup,
            "duplicate_similarity": score,
            "matched_index": matched_idx
        })
        seen.append({"id": idx, "text": t})
        
    return results

