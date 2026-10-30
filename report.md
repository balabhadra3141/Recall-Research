# Recall Research — Project Report

> **Tagline:** Research that remembers. Evidence that evolves. Powered by NVIDIA Nemotron on Nebius Token Factory with persistent local memory and automatic Research Deltas.

---

## Inspiration

When conducting deep technical investigations - such as tracking solid-state battery breakthroughs, monitoring open-weight foundation model updates, or evaluating post-quantum cryptography standards - researchers face a fundamental frustration: **every search session starts as an amnesiac blank slate**.

Traditional search engines and AI wrappers treat every inquiry as if it were Day Zero. You search, read, synthesize, and close the tab. Weeks later, when returning to the same question:
- You repeat the same queries from scratch.
- You lose track of which sources you already evaluated and why specific conclusions were drawn.
- You cannot easily answer the most critical analytical question: **"What has genuinely changed since I last looked at this?"**

We built **Recall Research** to transform ephemeral search into a living, cumulative research workspace that remembers prior inquiries and explicitly measures how evidence evolves over time.

---

## What it does

Recall Research is an AI research analyst that combines live web exploration, strict citation grounding, local-first persistent memory, and longitudinal comparison:

1. **Live Grounded Investigation**: Gathers current web evidence via the Tavily Search API, extracting structured source metadata, titles, excerpts, and publication dates.
2. **Evidence-Backed Synthesis (NVIDIA Nemotron on Nebius)**: Synthesizes a structured briefing report exclusively using NVIDIA Nemotron models (`nvidia/nemotron-3-super-120b-a12b` and `nvidia/nemotron-3-nano-30b-a3b`) hosted on Nebius Token Factory. Every factual claim is bound to explicit citations (`[S1]`, `[S2]`) with verifiable provenance.
3. **Local-First Persistent Memory**: All briefings, sources, findings, and notes are persisted directly in the user's browser using IndexedDB (`RecallResearchDB`). No private research data is stored on third-party user databases.
4. **Signature Research Delta**: When revisiting a topic, Recall Research compares the latest web evidence against past session findings and automatically classifies findings into four analytical categories:
   - ⚡ **New Developments**: Breakthroughs or claims absent in previous records.
   - ✅ **Corroborated Findings**: Past claims reaffirmed by fresh, independent evidence.
   - ⚠️ **Contradicted / Refuted**: Prior conclusions challenged or disproven by newer data.
   - ❓ **Unresolved & Open Questions**: Inconclusive controversies requiring further investigation.
5. **Interactive Evidence Inspector & Export**: Users can inspect cited excerpts with smooth auto-scroll, pin durable findings to their Memory Library, and export comprehensive Markdown reports (`.md`) or complete JSON backups with a single click.

---

## How we built it

Recall Research was built from the ground up as a production-grade web application:

- **Frontend & Architecture**: Next.js 16 App Router, React 19, TypeScript, and Vanilla CSS/Tailwind CSS with custom glassmorphism, responsive data grids, and keyboard accessibility (`Ctrl+K` search focus).
- **Inference Engine (Provider Lock)**: Connected directly to **Nebius Token Factory** (`https://api.tokenfactory.nebius.com/v1/`) utilizing **NVIDIA Nemotron open models**:
  - `nvidia/nemotron-3-super-120b-a12b` for deep briefing synthesis, competing viewpoints analysis, and longitudinal delta computation.
  - `nvidia/nemotron-3-nano-30b-a3b` for fast classification and memory candidate extraction.
  - *Strict Provider Lock*: Zero commercial fallback to OpenAI, Anthropic, Gemini, or Ollama.
- **Web Retrieval**: Tavily Search API with advanced search depth, URL deduplication, and excerpt sanitization.
- **Citation Validation**: Custom deterministic parser verifying that every citation bracket maps to an existing source URL and excerpt.
- **Client Storage**: Browser IndexedDB managed via `idb` with a schema indexing sessions, source archives, durable memories, and calculated deltas.
- **Verification & Testing**: Built-in Diagnostics Modal testing live endpoints, alongside automated test coverage using Vitest (9/9 unit tests passing).

---

## Challenges we ran into

1. **Hallucination Prevention & Citation Integrity**: LLMs often hallucinate parenthetical citations or cite nonexistent sources. We solved this by enforcing a two-stage pipeline: Nemotron outputs strict JSON referencing internal source identifiers (`[S1]`, `[S2]`), followed by a deterministic server-side validator that verifies each citation before saving.
2. **Longitudinal Comparison Calibration**: Formulating prompt constraints for Nemotron to accurately differentiate between a *novel fact* vs. an *independently corroborated fact* without false conflicts required carefully structured few-shot comparison prompts and schema enforcement.
3. **IndexedDB Cross-Session Collisions**: Since each research session indexes sources locally from `S1` to `Sn`, saving global source archives caused key collisions. We upgraded to an IndexedDB v2 schema utilizing composite `storageId` keys, preserving both local citation brevity and global archive integrity.
4. **Resilient Local-First State**: Balancing instant UI updates with browser IndexedDB asynchronous transactions required reactive storage hooks, fallback states, and safe deletion confirmation modals to prevent accidental loss of user research.

---

## Accomplishments that we're proud of

- **True Longitudinal Research Delta**: Built a functioning, evidence-grounded delta engine that clearly highlights what changed, what was reaffirmed, and what was refuted over time.
- **100% Locked to NVIDIA Nemotron on Nebius**: Successfully executed all inference pipelines through Nebius Token Factory without falling back to any alternative model providers.
- **Zero-Compromise Local-First Privacy**: Users own their entire knowledge base in their browser profile, with the ability to export complete backups at any time.
- **Production-Ready Quality**: Complete with custom toast feedback, keyboard shortcuts, smooth citation auto-scrolling, responsive dark aesthetics, and 100% clean builds.

---

## What we learned

- **NVIDIA Nemotron Model Capabilities**: The Nemotron-3 open-weight models delivered remarkable structured extraction, synthesis nuance, and reasoning across complex technical topics.
- **Local-First Architecture for AI Agents**: Combining serverless inference with browser-native persistence creates a high-performance experience that respects user ownership of research data.
- **Designing for Evidence Evolution**: Structuring AI output into explicit classifications (corroborations, contradictions, deltas) provides vastly more utility to researchers than generic conversational summaries.

---

## What's next for Recall Research

- **Autonomous Deep Dive Subagents**: Multi-step recursive search to investigate identified contradictions and unresolved claims across multiple search iterations.
- **Scholarly & Document Ingestion**: Ingesting user-provided PDFs, ArXiv papers, and local Markdown notes alongside live Tavily web sources.
- **Sync with PKM Tools**: Bi-directional export and synchronization with personal knowledge management tools like Obsidian, Logseq, and Notion.
- **Topic Monitoring Alerts**: Scheduled background delta checks that notify researchers when significant new developments contradict or update existing pinned memories.
