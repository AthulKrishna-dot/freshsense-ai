"""
FreshSense AI — Streamlit App
AI-Powered Food Expiry Detection & Freshness Prediction

Run locally:
    pip install -r requirements.txt
    streamlit run streamlit_app.py

The app uses Google's Gemini vision model to classify food freshness.
Set your key in Streamlit secrets (`.streamlit/secrets.toml`):

    GOOGLE_API_KEY = "your-gemini-api-key"

If no key is configured the app runs in DEMO mode with a deterministic
heuristic so the UI can be explored without an API key.
"""

from __future__ import annotations

import base64
import hashlib
import json
import random
from datetime import datetime

import streamlit as st
from PIL import Image

# ---------------------------------------------------------------------------
# Page config & theme
# ---------------------------------------------------------------------------

st.set_page_config(
    page_title="FreshSense AI — Food Freshness Prediction",
    page_icon="🥬",
    layout="wide",
    initial_sidebar_state="expanded",
)

DARK_GREEN_CSS = """
<style>
:root { --fs-green: #22c55e; }
.stApp { background: linear-gradient(160deg, #04120a 0%, #071a10 60%, #04120a 100%); }
section[data-testid="stSidebar"] { background: #05150d; border-right: 1px solid #123524; }
h1, h2, h3 { color: #e7f6ee; font-family: "Segoe UI", sans-serif; }
.fs-card {
    background: rgba(13, 40, 26, 0.65);
    border: 1px solid #1b4332;
    border-radius: 16px;
    padding: 1.25rem 1.5rem;
    margin-bottom: 1rem;
}
.fs-badge {
    display: inline-block; padding: 0.25rem 0.9rem; border-radius: 999px;
    font-weight: 600; font-size: 0.9rem;
}
.fs-fresh   { background: #14532d; color: #4ade80; border: 1px solid #22c55e; }
.fs-near    { background: #3f3005; color: #facc15; border: 1px solid #eab308; }
.fs-spoiled { background: #450a0a; color: #f87171; border: 1px solid #ef4444; }
.fs-metric-label { color: #9bbfae; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.08em; }
.fs-footer { color: #4d7a63; font-size: 0.8rem; text-align: center; margin-top: 3rem; }
</style>
"""
st.markdown(DARK_GREEN_CSS, unsafe_allow_html=True)

# ---------------------------------------------------------------------------
# Prediction pipeline
# ---------------------------------------------------------------------------

VALID_STATUSES = ("Fresh", "Near Expiry", "Spoiled")

PROMPT = """You are a food freshness expert. Look at this food image and respond with ONLY valid JSON (no markdown fences):
{
  "food_item": "<identified food>",
  "status": "Fresh" | "Near Expiry" | "Spoiled",
  "confidence": <0-100>,
  "estimated_shelf_life": "<human-readable, e.g. '3-5 days refrigerated'>",
  "storage_advice": "<one concise storage tip>",
  "notes": "<one sentence on visual cues>"
}"""


def _demo_predict(image_bytes: bytes) -> dict:
    """Deterministic demo prediction when no API key is configured."""
    seed = int(hashlib.sha256(image_bytes).hexdigest(), 16)
    rng = random.Random(seed)
    status = rng.choice(VALID_STATUSES)
    return {
        "food_item": "Food item (demo mode)",
        "status": status,
        "confidence": round(rng.uniform(72, 97), 1),
        "estimated_shelf_life": {"Fresh": "4-7 days refrigerated", "Near Expiry": "1-2 days", "Spoiled": "Do not consume"}[status],
        "storage_advice": "Store in an airtight container below 4°C.",
        "notes": "Demo mode — set GOOGLE_API_KEY in Streamlit secrets for real AI predictions.",
    }


def _gemini_predict(image_bytes: bytes, api_key: str) -> dict:
    """Call Gemini vision API (REST, no extra SDK dependency)."""
    import requests  # local import keeps startup fast

    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-2.5-flash:generateContent?key={api_key}"
    )
    payload = {
        "contents": [{
            "parts": [
                {"text": PROMPT},
                {"inline_data": {"mime_type": "image/jpeg", "data": base64.b64encode(image_bytes).decode()}},
            ]
        }],
        "generationConfig": {"response_mime_type": "application/json", "temperature": 0.2},
    }
    resp = requests.post(url, json=payload, timeout=60)
    resp.raise_for_status()
    text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
    data = json.loads(text)
    if data.get("status") not in VALID_STATUSES:
        data["status"] = "Near Expiry"
    data["confidence"] = max(0, min(100, float(data.get("confidence", 80))))
    return data


def predict_freshness(image_bytes: bytes) -> dict:
    api_key = st.secrets.get("GOOGLE_API_KEY", "")
    if not api_key:
        return _demo_predict(image_bytes)
    try:
        return _gemini_predict(image_bytes, api_key)
    except Exception as exc:  # noqa: BLE001 — surface provider errors in UI
        st.warning(f"AI request failed ({exc}). Showing demo result instead.")
        return _demo_predict(image_bytes)


# ---------------------------------------------------------------------------
# Sidebar — history & stats
# ---------------------------------------------------------------------------

if "history" not in st.session_state:
    st.session_state.history = []

with st.sidebar:
    st.title("🥬 FreshSense AI")
    st.caption("AI-Powered Food Expiry Detection & Freshness Prediction")
    st.divider()

    hist = st.session_state.history
    st.subheader("📊 Session Stats")
    c1, c2 = st.columns(2)
    c1.metric("Scans", len(hist))
    fresh_pct = (sum(1 for h in hist if h["status"] == "Fresh") / len(hist) * 100) if hist else 0
    c2.metric("Fresh %", f"{fresh_pct:.0f}%")

    st.subheader("🕘 Recent Scans")
    if not hist:
        st.caption("No scans yet — upload a food photo.")
    for h in reversed(hist[-8:]):
        st.markdown(f"- **{h['food_item']}** · {h['status']} · `{h['time']}`")

    st.divider()
    st.caption("💡 Tip: use clear, well-lit photos of a single food item.")

# ---------------------------------------------------------------------------
# Main layout
# ---------------------------------------------------------------------------

st.title("Food Freshness Detection")
st.write("Upload a photo of any food item — the AI identifies it and predicts its freshness and remaining shelf life.")

upload_col, result_col = st.columns([1, 1], gap="large")

with upload_col:
    st.markdown('<div class="fs-card">', unsafe_allow_html=True)
    st.subheader("📤 Upload Food Image")
    tab_file, tab_cam = st.tabs(["Upload File", "Use Camera"])
    uploaded = tab_file.file_uploader("JPG or PNG", type=["jpg", "jpeg", "png"], label_visibility="collapsed")
    camera = tab_cam.camera_input("Take a photo")
    source = uploaded or camera
    if source:
        image_bytes = source.getvalue()
        st.image(Image.open(source), caption="Selected image", use_container_width=True)
        analyze = st.button("🔍 Predict Freshness", type="primary", use_container_width=True)
    else:
        analyze = False
        st.info("Upload an image or take a photo to begin.")
    st.markdown("</div>", unsafe_allow_html=True)

with result_col:
    st.markdown('<div class="fs-card">', unsafe_allow_html=True)
    st.subheader("🤖 AI Prediction Result")
    if source and analyze:
        with st.spinner("Analyzing freshness…"):
            result = predict_freshness(image_bytes)
        result["time"] = datetime.now().strftime("%H:%M")
        st.session_state.history.append(result)

        badge_cls = {"Fresh": "fs-fresh", "Near Expiry": "fs-near", "Spoiled": "fs-spoiled"}[result["status"]]
        st.markdown(f"**Detected:** {result['food_item']}")
        st.markdown(f'<span class="fs-badge {badge_cls}">{result["status"]}</span>', unsafe_allow_html=True)
        st.progress(int(result["confidence"]), text=f"Confidence: {result['confidence']}%")
        m1, m2 = st.columns(2)
        m1.metric("Shelf Life", result["estimated_shelf_life"])
        m2.metric("Status", result["status"])
        st.markdown(f"**🧊 Storage advice:** {result['storage_advice']}")
        st.markdown(f"**🔎 Visual cues:** {result['notes']}")
    elif st.session_state.history:
        last = st.session_state.history[-1]
        st.markdown(f"Last scan: **{last['food_item']}** — {last['status']} ({last['confidence']}%)")
        st.caption("Upload a new image and press Predict to scan again.")
    else:
        st.caption("Results will appear here after your first scan.")
    st.markdown("</div>", unsafe_allow_html=True)

st.markdown(
    '<p class="fs-footer">© 2026 AI-Powered Food Expiry Detection & Freshness Prediction<br>'
    "Built with Streamlit, Python, and Gemini Vision AI.</p>",
    unsafe_allow_html=True,
)
