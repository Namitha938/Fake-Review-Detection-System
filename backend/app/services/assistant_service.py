import re
import httpx
from typing import Dict, Any, List, Optional, Tuple
from app.config import settings
from app.schemas.assistant import ChatMessage, AssistantChatResponse

VERIDEX_SYSTEM_PROMPT = """You are the Veridex AI Forensic Assistant — an elite, friendly expert in NLP fake review detection, opinion spam forensics, sentiment analysis, and e-commerce credibility auditing.
You help users understand why reviews were classified as Genuine, Suspicious, or Likely Fake, explain linguistic signals (hyperbole, rating dissonance, repetition), and advise on spotting deceptive marketing.
Always format your answers in clean, readable Markdown with bold headings and bullet points. Keep explanations crisp, actionable, and authoritative."""

async def generate_assistant_reply(
    message: str,
    context: Optional[Dict[str, Any]] = None,
    history: Optional[List[ChatMessage]] = None
) -> AssistantChatResponse:
    """
    Generate an intelligent forensic response using Gemini, OpenAI, Groq,
    or our built-in Veridex Expert Knowledge Engine as zero-dependency fallback.
    """
    query = message.strip()
    history = history or []

    # 1. Try Google Gemini API if configured
    if settings.GEMINI_API_KEY:
        try:
            return await _call_gemini_api(query, context, history)
        except Exception as e:
            print(f"[Assistant] Gemini API call error: {e}, falling back to built-in engine.")

    # 2. Try OpenAI API if configured
    if settings.OPENAI_API_KEY:
        try:
            return await _call_openai_api(query, context, history)
        except Exception as e:
            print(f"[Assistant] OpenAI API call error: {e}, falling back to built-in engine.")

    # 3. Try Groq API if configured
    if settings.GROQ_API_KEY:
        try:
            return await _call_groq_api(query, context, history)
        except Exception as e:
            print(f"[Assistant] Groq API call error: {e}, falling back to built-in engine.")

    # 4. Built-in Veridex Forensic Expert Engine (Deterministic & Real-Time)
    reply, suggestions = _generate_local_forensic_response(query, context)
    return AssistantChatResponse(
        reply=reply,
        suggested_prompts=suggestions,
        provider="veridex_forensic_engine"
    )

async def _call_gemini_api(
    message: str,
    context: Optional[Dict[str, Any]],
    history: List[ChatMessage]
) -> AssistantChatResponse:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
    
    context_str = ""
    if context:
        context_str = f"\n\nCURRENT REVIEW AUDIT CONTEXT:\n{_format_context_summary(context)}"

    contents = []
    # System instruction prepended
    contents.append({
        "role": "user",
        "parts": [{"text": f"{VERIDEX_SYSTEM_PROMPT}{context_str}"}]
    })
    contents.append({
        "role": "model",
        "parts": [{"text": "Understood. I am ready to assist with Veridex review forensics and analysis."}]
    })

    for h in history[-6:]:
        contents.append({
            "role": "user" if h.role == "user" else "model",
            "parts": [{"text": h.content}]
        })

    contents.append({
        "role": "user",
        "parts": [{"text": message}]
    })

    async with httpx.AsyncClient(timeout=15.0) as client:
        res = await client.post(url, json={"contents": contents})
        if res.status_code == 200:
            data = res.json()
            reply_text = data["candidates"][0]["content"]["parts"][0]["text"]
            return AssistantChatResponse(
                reply=reply_text,
                suggested_prompts=_get_contextual_suggestions(context),
                provider="gemini-1.5-flash"
            )
        else:
            raise Exception(f"Gemini API returned status {res.status_code}: {res.text}")

async def _call_openai_api(
    message: str,
    context: Optional[Dict[str, Any]],
    history: List[ChatMessage]
) -> AssistantChatResponse:
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }
    
    messages = [{"role": "system", "content": VERIDEX_SYSTEM_PROMPT}]
    if context:
        messages.append({
            "role": "system",
            "content": f"Active Review Analysis:\n{_format_context_summary(context)}"
        })

    for h in history[-6:]:
        messages.append({"role": h.role, "content": h.content})

    messages.append({"role": "user", "content": message})

    async with httpx.AsyncClient(timeout=15.0) as client:
        res = await client.post(url, headers=headers, json={
            "model": "gpt-4o-mini",
            "messages": messages,
            "temperature": 0.4
        })
        if res.status_code == 200:
            data = res.json()
            reply_text = data["choices"][0]["message"]["content"]
            return AssistantChatResponse(
                reply=reply_text,
                suggested_prompts=_get_contextual_suggestions(context),
                provider="openai-gpt-4o-mini"
            )
        else:
            raise Exception(f"OpenAI API status {res.status_code}: {res.text}")

async def _call_groq_api(
    message: str,
    context: Optional[Dict[str, Any]],
    history: List[ChatMessage]
) -> AssistantChatResponse:
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    
    messages = [{"role": "system", "content": VERIDEX_SYSTEM_PROMPT}]
    if context:
        messages.append({
            "role": "system",
            "content": f"Active Review Analysis:\n{_format_context_summary(context)}"
        })

    for h in history[-6:]:
        messages.append({"role": h.role, "content": h.content})

    messages.append({"role": "user", "content": message})

    async with httpx.AsyncClient(timeout=15.0) as client:
        res = await client.post(url, headers=headers, json={
            "model": "llama-3.1-8b-instant",
            "messages": messages,
            "temperature": 0.4
        })
        if res.status_code == 200:
            data = res.json()
            reply_text = data["choices"][0]["message"]["content"]
            return AssistantChatResponse(
                reply=reply_text,
                suggested_prompts=_get_contextual_suggestions(context),
                provider="groq-llama-3.1"
            )
        else:
            raise Exception(f"Groq API status {res.status_code}: {res.text}")

def _format_context_summary(context: Dict[str, Any]) -> str:
    text = context.get("review_text", "")
    rating = context.get("rating", "N/A")
    pred = context.get("prediction", "N/A")
    prob = context.get("fake_probability", 0)
    conf = context.get("confidence", 0)
    sent_label = context.get("sentiment_label", "N/A")
    sent_score = context.get("sentiment_score", 0)
    keywords = [k.get("word") for k in context.get("suspicious_keywords", []) if k.get("is_suspicious")]
    
    return f"""- Text: "{text}"
- Star Rating: {rating}/5
- Classification Verdict: {pred.upper()}
- Deception Probability: {prob * 100:.1f}% (Confidence: {conf:.1f}%)
- Sentiment: {sent_label} (Score: {sent_score})
- Flagged Keywords: {', '.join(keywords) if keywords else 'None'}"""

def _generate_local_forensic_response(
    query: str,
    context: Optional[Dict[str, Any]]
) -> Tuple[str, List[str]]:
    """
    Intelligent local knowledge engine with deep domain expertise in
    NLP forensics, SHAP attribution, deception detection, and text de-biasing.
    """
    q_lower = query.lower()

    # Case 1: Explain the active review or verdict
    if context and any(k in q_lower for k in ["why", "verdict", "explain", "flagged", "fake", "this review", "result", "suspicious"]):
        pred = context.get("prediction", "suspicious").upper()
        prob = context.get("fake_probability", 0.5) * 100
        conf = context.get("confidence", 50.0)
        text = context.get("review_text", "")
        rating = context.get("rating")
        sent_label = context.get("sentiment_label", "neutral")
        sent_score = context.get("sentiment_score", 0.0)
        feats = context.get("features", {})
        susp_kw = [k.get("word") for k in context.get("suspicious_keywords", []) if k.get("is_suspicious")]

        reply = f"""### 🔍 Forensic Breakdown for Current Review

**Determination**: **{pred}** ({prob:.1f}% Deception Probability • {conf:.1f}% Confidence)

Here is why the Veridex Multi-Modal NLP pipeline classified this review:

1. **Linguistic & Stylistic Signals**:
   - **Shouting / Uppercase Ratio**: `{feats.get('uppercase_ratio', 0) * 100:.1f}%` (Unusually high capitalization indicates astroturfing or coercive emotional pressure).
   - **Exclamation Marks**: `{feats.get('exclamation_count', 0)}` tokens ({feats.get('exclamation_ratio', 0) * 100:.1f}% of total words).
   - **Lexical Diversity**: `{feats.get('lexical_diversity', 0) * 100:.1f}%` (Measures unique vocabulary ratio. Low ratios suggest repetitive bot scripting).

2. **Sentiment & Star Concordance**:
   - Declared Rating: **★{rating if rating else 'None'}/5**
   - VADER Sentiment Polarity: **{sent_label.upper()}** (`{sent_score:+.2f}`)
   {"- **⚠️ Rating Dissonance Detected**: The star rating conflicts sharply with the text's emotional polarity, triggering an automatic risk penalty." if rating and ((rating >= 4 and sent_label == 'negative') or (rating <= 2 and sent_label == 'positive')) else "- Star rating and sentiment polarity are aligned."}

3. **Key Attribution Tokens**:
   {f"- Flagged Superlatives / Trigger Words: **{', '.join(susp_kw)}**" if susp_kw else "- No aggressive promotional or defamatory keywords detected."}

💡 **Recommendation**: {
"This review exhibits strong hallmarks of automated bot generation or incentivized astroturfing." if prob > 65 else
"This review contains borderline sensationalism; cross-reference with reviewer purchase history." if prob > 45 else
"This review shows authentic, balanced customer phrasing with grounded experiential details."
}"""
        suggestions = [
            "How can I rewrite this review to look authentic?",
            "What is rating-sentiment dissonance?",
            "How does Veridex calculate confidence score?"
        ]
        return reply, suggestions

    # Case 2: Rewrite review / make it authentic
    if any(k in q_lower for k in ["rewrite", "re-write", "make authentic", "improve", "fix review"]):
        raw_text = context.get("review_text") if context else query
        cleaned = re.sub(r"[!]{2,}", ".", raw_text)
        cleaned = re.sub(r"(?i)\b(best product ever|life changing|miracle cure|100%|buy now|scam artists|disaster)\b", "reliable item", cleaned)
        cleaned = cleaned.capitalize()

        reply = f"""### ✍️ Authentic Review Revision

Here is how you can transform sensationalist or astroturfed copy into a credible, verified-style customer review:

**Original Text**:
> *"{raw_text}"*

**De-biased Authentic Revision**:
> *"I have been using this item for about two weeks. The build quality meets expectations and setup was straightforward. While there is minor room for improvement in packaging, overall it performs as advertised and represents good value for the price point."*

**Key Authenticity Improvements Applied**:
- 🛑 Replaced extreme hyperbole (*"best ever"*, *"miracle"*) with measured experiential descriptions.
- 🛑 Eliminated aggressive exclamation points and full-capital shouting.
- ✅ Added temporal grounding (*"for about two weeks"*) which algorithmically boosts credibility scores."""
        suggestions = [
            "Audit this review again",
            "What words trigger the fake review filter?",
            "How do e-commerce sites detect bot farms?"
        ]
        return reply, suggestions

    # Case 3: How to spot fake reviews on Amazon / Google / Yelp
    if any(k in q_lower for k in ["spot", "identify", "tell if", "amazon", "google", "yelp", "ecommerce"]):
        reply = """### 🛡️ 5 Proven Ways to Spot Fake Reviews

1. **Extreme Polarized Language**:
   Fake positive reviews use exaggerated superlatives (*"life-changing"*, *"miracle"*, *"best in human history"*). Fake negative reviews use defamatory buzzwords (*"pure mafia scam"*, *"poison"*). Authentic reviews mention balanced trade-offs.

2. **Temporal Clustering (Review Velocity)**:
   A sudden flood of 5-star reviews posted within a 48-hour window on an unbranded product strongly signals an incentivized bot campaign.

3. **Missing Verifiable Specifics**:
   Genuine reviews reference specific product dimensions, battery hours, firmware versions, or customer support ticket turnaround. Bots stick to generic praise.

4. **Reviewer History Inspection**:
   Click on the reviewer profile. Accounts that only post 5-star reviews on random unbranded goods within the same week are typically burner accounts.

5. **Star Rating Dissonance**:
   A 5-star rating with text stating *"Arrived completely broken"* is a known manipulation tactic where sellers alter product listings or bots misfire."""
        suggestions = [
            "Why was my review flagged as suspicious?",
            "What is SHAP explainability?",
            "Explain rating-sentiment dissonance"
        ]
        return reply, suggestions

    # Case 4: Explanation of SHAP & NLP concepts
    if any(k in q_lower for k in ["shap", "tfidf", "tf-idf", "machine learning", "nlp", "lexical", "model"]):
        reply = """### 🧠 How Veridex Evaluates Reviews

Veridex uses a hybrid **Multi-Modal Forensics Pipeline**:

1. **TF-IDF + Classifier Ensemble**:
   - Evaluates word and n-gram frequency distributions against deceptive opinion corpora (Ott et al. Deceptive Review Dataset).
2. **SHAP (SHapley Additive exPlanations)**:
   - Measures the marginal mathematical contribution of each word towards the fake vs. genuine classification. Words with positive SHAP scores increase fake risk.
3. **VADER Sentiment & Star Dissonance**:
   - Computes normalized compound sentiment (-1.0 to +1.0) and penalizes 5-star reviews with negative tone or 1-star reviews with praise.
4. **spaCy Linguistic Profiling**:
   - Calculates lexical diversity (Type-Token Ratio), uppercase shouting ratio, and exclamation punctuation intensity."""
        suggestions = [
            "Test a sample astroturf review",
            "How to detect duplicate reviews?",
            "How does bulk analysis work?"
        ]
        return reply, suggestions

    # Default general response
    reply = f"""### 👋 Hello! I am your Veridex AI Forensic Co-Pilot.

I am equipped with real-time NLP diagnostics to help you audit customer reviews, explain deception probabilities, and evaluate online credibility.

**What I can do for you**:
- 🔍 **Audit Active Reviews**: Ask me why a specific review received its verdict.
- ✍️ **Re-write & De-bias**: Transform suspicious reviews into credible, compliant phrasing.
- 📊 **Explain Metrics**: Learn about SHAP attributions, VADER sentiment, or lexical diversity.
- 🛡️ **Spot Manipulation Tactics**: Strategies to detect competitor smear campaigns and astroturfing rings.

Try asking one of the suggestions below, or paste any review to analyze!"""
    suggestions = [
        "Why was my review flagged?",
        "How do I spot fake Amazon reviews?",
        "What is rating-sentiment dissonance?",
        "How can I rewrite a review to look authentic?"
    ]
    return reply, suggestions

def _get_contextual_suggestions(context: Optional[Dict[str, Any]]) -> List[str]:
    if not context:
        return [
            "Why was this review flagged?",
            "How to spot bot patterns in reviews?",
            "What is rating dissonance?"
        ]
    return [
        "Explain this review's SHAP keywords",
        "How to rewrite this review to look authentic?",
        "What does the confidence score mean?"
    ]

