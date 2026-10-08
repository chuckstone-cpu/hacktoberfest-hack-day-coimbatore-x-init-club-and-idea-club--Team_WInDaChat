"""newNectore: a local-first knowledge workspace."""

from html import escape
from pathlib import Path

import streamlit as st
import streamlit.components.v1 as components

from core import db
from core.config import OLLAMA_MODEL
from core.ollama import summarize_notes
from core.pipeline import save_note
from core.story import narrate, verify
from core.visualize import interactive_graph_html


st.set_page_config(page_title="newNectore", page_icon="✦", layout="wide", initial_sidebar_state="expanded")
db.init_db()

st.markdown(
    """
    <style>
      @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Inter:wght@400;500;600;700&display=swap');
      :root { --paper:#0a0e17; --card:#111827; --ink:#eef2ff; --soft:#9aa8c1; --line:#243047; --accent:#a78bfa; --accent-soft:#272044; }
      .stApp { background:var(--paper); color:var(--ink); font-family:Inter,Arial,sans-serif; }
      [data-testid='stSidebar'] { background:#070a12; border-right:1px solid var(--line); } [data-testid='stSidebar'] * { color:#f6f8ff; }
      [data-testid='stSidebar'] .stCaption { color:#8f9db6!important; } [data-testid='stSidebar'] code { background:#151d2d!important; color:#d7dfff!important; }
      .block-container { max-width:1420px; padding:2.1rem 2.5rem 3.2rem; }
      h1,h2,h3 { color:var(--ink)!important; letter-spacing:-.038em; } h1 { font-size:2rem!important; margin-bottom:.2rem!important; } h2 { font-size:1.38rem!important; }
      .app-brand { font-weight:700; font-size:1.25rem; letter-spacing:-.05em; margin-bottom:.2rem; } .app-brand span { color:#89d5a7; }
      .sidebar-copy { color:#b5bdb5; font-size:.82rem; line-height:1.5; margin-bottom:1.7rem; }
      .topline { display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--line); padding-bottom:1.15rem; margin-bottom:1.7rem; }
      .product-label { font:500 .72rem 'DM Mono',monospace; color:var(--soft); letter-spacing:.08em; text-transform:uppercase; }
      .status { background:var(--accent-soft); color:#c7b9ff; border-radius:999px; padding:.36rem .62rem; font:600 .7rem 'DM Mono',monospace; letter-spacing:.04em; }
      .intro { color:var(--soft); max-width:45rem; font-size:.96rem; line-height:1.6; margin:0 0 1.35rem; }
      .metric { border:1px solid var(--line); border-radius:13px; background:linear-gradient(145deg,#151d2c,#101624); padding:1rem 1.05rem; min-height:94px; }
      .metric-label { font:500 .67rem 'DM Mono',monospace; color:var(--soft); letter-spacing:.07em; text-transform:uppercase; } .metric-value { font-size:1.68rem; line-height:1.3; font-weight:700; margin-top:.18rem; } .metric-caption { color:var(--soft); font-size:.76rem; }
      [data-baseweb='tab-list'] { gap:1.25rem; border-bottom:1px solid var(--line); } [data-baseweb='tab'] { color:var(--soft); font-weight:600; padding:0 0 .8rem; } [aria-selected='true'] { color:var(--ink)!important; border-bottom:2px solid var(--accent)!important; }
      .section-kicker { color:var(--accent); font:600 .68rem 'DM Mono',monospace; letter-spacing:.08em; text-transform:uppercase; } .section-note { color:var(--soft); font-size:.87rem; line-height:1.55; }
      .quiet-card { background:#111827; border:1px solid var(--line); border-radius:13px; padding:1rem 1.05rem; margin-bottom:.55rem; } .note-number { font:500 .65rem 'DM Mono',monospace; color:#a78bfa; letter-spacing:.06em; } .note-title { font-weight:600; line-height:1.4; margin:.25rem 0; } .note-meta { color:var(--soft); font-size:.75rem; }
      .connection { border-left:3px solid #8b7ce8; background:#12182a; border-radius:0 10px 10px 0; padding:.85rem 1rem; margin:.6rem 0; } .connection-type { color:#b6a9ff; font:600 .67rem 'DM Mono',monospace; letter-spacing:.06em; text-transform:uppercase; } .connection-reason { margin-top:.3rem; font-size:.89rem; line-height:1.5; }
      .output { background:#111827; border:1px solid #2d3b57; border-radius:14px; padding:1.15rem 1.25rem; line-height:1.68; } .output h1,.output h2,.output h3 { font-size:1rem!important; }
      .stButton button { background:#eef2ff!important; color:#121827!important; border:0!important; border-radius:9px!important; font-weight:600!important; padding:.48rem .85rem!important; } .stButton button:hover { background:#c9bfff!important; }
      [data-testid='stTextArea'] textarea, [data-baseweb='select'] > div { background:#111827!important; border-color:#2d3b57!important; border-radius:10px!important; color:var(--ink)!important; }
      [data-testid='stExpander'] { border:1px solid var(--line); border-radius:10px; background:#111827; } [data-testid='stAlert'] { border-radius:10px; }
    </style>
    """,
    unsafe_allow_html=True,
)


def metric(label: str, value: int | str, caption: str) -> None:
    st.markdown(
        f"<div class='metric'><div class='metric-label'>{escape(label)}</div><div class='metric-value'>{escape(str(value))}</div><div class='metric-caption'>{escape(caption)}</div></div>",
        unsafe_allow_html=True,
    )


def thread_label(index: int, thread) -> str:
    return f"Thread {index + 1} · {len(thread)} notes · {thread[0]['summary'][:56]}"


notes = db.all_notes()
links = db.all_links()
threads = db.threads()

with st.sidebar:
    st.markdown("<div class='app-brand'>new<span>Nectore</span> ✦</div>", unsafe_allow_html=True)
    st.markdown("<div class='sidebar-copy'>A local-first place for thinking across the gaps between your notes.</div>", unsafe_allow_html=True)
    st.caption("LOCAL MODEL")
    st.code(OLLAMA_MODEL, language=None)
    st.divider()
    st.caption("WORKSPACE")
    st.markdown(f"**{len(notes)}** notes  ")
    st.markdown(f"**{len(links)}** explained links  ")
    st.markdown(f"**{len(threads)}** active threads")
    st.divider()
    st.caption("PRIVACY")
    st.markdown("Your notes and model calls stay on this machine through Ollama.")

st.markdown("<div class='topline'><div><div class='product-label'>Personal knowledge graph</div><h1>Make your notes talk to each other.</h1></div><div class='status'>● LOCAL & PRIVATE</div></div>", unsafe_allow_html=True)
st.markdown("<p class='intro'>Capture one idea at a time. newNectore identifies shared mechanisms, draws the relationships, and lets you generate grounded summaries when you need the bigger picture.</p>", unsafe_allow_html=True)

metrics = st.columns(4)
with metrics[0]: metric("Notes", len(notes), "in your library")
with metrics[1]: metric("Links", len(links), "high-confidence only")
with metrics[2]: metric("Threads", len(threads), "connected clusters")
with metrics[3]: metric("Mode", "Local", "Ollama + Gemma")

st.markdown("<br>", unsafe_allow_html=True)
map_tab, capture_tab, threads_tab, connections_tab, lab_tab = st.tabs(["Visualizer", "Capture", "Threads", "Connections", "KV Lab"])

with capture_tab:
    compose, library = st.columns([1.1, .9], gap="large")
    with compose:
        st.markdown("<div class='section-kicker'>Capture</div>", unsafe_allow_html=True)
        st.subheader("What are you thinking about?")
        st.markdown("<div class='section-note'>No filing required. Add a thought and let the system find its place.</div>", unsafe_allow_html=True)
        st.markdown("<br>", unsafe_allow_html=True)
        with st.form("new_note", clear_on_submit=True):
            content = st.text_area("New note", height=250, placeholder="Write a concept, observation, lecture note, or question…", label_visibility="collapsed")
            submitted = st.form_submit_button("Save note")
        if submitted:
            if not content.strip():
                st.warning("Write something first—one sentence is enough.")
            else:
                with st.spinner("Tagging this note and checking for meaningful connections…"):
                    try:
                        note_id = save_note(content.strip())
                        st.success(f"Saved note #{note_id}.")
                        st.rerun()
                    except Exception as exc:
                        st.error(f"Could not process the note. Check Ollama and `{OLLAMA_MODEL}`.\n\n{exc}")
    with library:
        st.markdown("<div class='section-kicker'>Recent notes</div>", unsafe_allow_html=True)
        st.subheader("Your latest thinking")
        if not notes:
            st.info("Your saved notes will appear here.")
        for note in notes[:6]:
            st.markdown(f"<div class='quiet-card'><div class='note-number'>NOTE #{note['id']}</div><div class='note-title'>{escape(note['summary'])}</div><div class='note-meta'>{escape(note['created_at'][:10])}</div></div>", unsafe_allow_html=True)
            with st.expander("Open note"):
                st.write(note["content"])

with map_tab:
    st.markdown("<div class='section-kicker'>Interactive visualizer</div>", unsafe_allow_html=True)
    st.subheader("Explore the shape of your ideas")
    st.markdown("<div class='section-note'>Pan, zoom, filter, and select a node. This is the actual connection graph—not a static decoration.</div>", unsafe_allow_html=True)
    st.markdown("<br>", unsafe_allow_html=True)
    if not notes:
        st.info("Add a note to begin your map.")
    else:
        components.html(interactive_graph_html(notes, links), height=650, scrolling=False)
        st.markdown("<br>", unsafe_allow_html=True)
        synopsis, result = st.columns([.95, 1.05], gap="large")
        with synopsis:
            st.markdown("<div class='section-kicker'>Synthesize</div>", unsafe_allow_html=True)
            st.subheader("Get the through-line")
            chosen_ids = st.multiselect(
                "Notes to include",
                [note["id"] for note in notes],
                default=[note["id"] for note in notes],
                format_func=lambda note_id: f"#{note_id} — {next(note['summary'] for note in notes if note['id'] == note_id)}",
                key="summary-notes",
            )
            if st.button("Generate summary"):
                if not chosen_ids:
                    st.warning("Choose at least one note.")
                else:
                    selected = [note for note in notes if note["id"] in chosen_ids]
                    with st.spinner("Building a source-grounded overview…"):
                        try:
                            st.session_state["knowledge-summary"] = summarize_notes([{"id": note["id"], "content": note["content"]} for note in selected])
                        except Exception as exc:
                            st.error(f"Could not create a summary. {exc}")
        with result:
            st.markdown("<div class='section-kicker'>Summary</div>", unsafe_allow_html=True)
            if summary := st.session_state.get("knowledge-summary"):
                st.markdown(f"<div class='output'>{escape(summary).replace(chr(10), '<br>')}</div>", unsafe_allow_html=True)
            else:
                st.markdown("<div class='output'>Select notes and generate a summary. It will only use the content in this workspace.</div>", unsafe_allow_html=True)

with threads_tab:
    st.markdown("<div class='section-kicker'>Threads</div>", unsafe_allow_html=True)
    st.subheader("Follow a connection into a story")
    if not threads:
        st.info("Threads appear after a strong connection is saved.")
    else:
        index = st.selectbox("Choose a thread", range(len(threads)), format_func=lambda item: thread_label(item, threads[item]))
        thread = threads[index]
        story_key = f"story-{index}"
        if st.button("Tell this story"):
            with st.spinner("Writing from your source notes…"):
                try:
                    st.session_state[story_key] = narrate(thread)
                except Exception as exc:
                    st.error(f"Could not generate a story. {exc}")
        if story := st.session_state.get(story_key):
            st.markdown(f"<div class='output'>{escape(story).replace(chr(10), '<br>')}</div>", unsafe_allow_html=True)
            if st.button("Check faithfulness", key=f"verify-{index}"):
                with st.spinner("Checking what survived from the source notes…"):
                    try:
                        st.session_state[f"report-{index}"] = verify(thread, story)
                    except Exception as exc:
                        st.error(f"Could not run the check. {exc}")
            if report := st.session_state.get(f"report-{index}"):
                st.markdown("<br><div class='section-kicker'>Evidence report</div>", unsafe_allow_html=True)
                for fact in report["facts"]:
                    marker = "Preserved" if fact["status"] == "appears_preserved" else "Review"
                    with st.expander(f"{marker} · {fact['fact']}"):
                        st.caption("Source evidence")
                        st.write(fact["source_span"])
                        st.caption("Question / story answer")
                        st.write(f"{fact['question']} — {fact['answer']}")

with connections_tab:
    st.markdown("<div class='section-kicker'>Connections</div>", unsafe_allow_html=True)
    st.subheader("Why your notes are linked")
    if not links:
        st.info("No strong connections have been saved yet.")
    for link in links:
        st.markdown(f"<div class='connection'><div class='connection-type'>#{link['source_id']} → #{link['target_id']} · {escape(link['relation'].replace('_', ' '))} · {link['strength']}/5</div><div class='connection-reason'>{escape(link['reason'])}</div></div>", unsafe_allow_html=True)

with lab_tab:
    st.markdown("<div class='section-kicker'>KV Cache Lab</div>", unsafe_allow_html=True)
    st.subheader("Measure the quality / memory trade-off")
    results_path = Path("lab/results/results.csv")
    if results_path.exists():
        st.code(results_path.read_text(encoding="utf-8"), language="csv")
    else:
        st.info("No measurements yet. Add a connected thread, stop the desktop Ollama service, then run `python -m core.lab.run_lab --model gemma4:e4b --ctx 32768`.")
    st.caption("Results come from this machine. The app does not invent benchmarks or claim a winner without a completed run.")
