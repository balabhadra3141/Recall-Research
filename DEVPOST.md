# Devpost Submission Package: Recall Research

## 1. Project Information
- **Project Name:** Recall Research
- **Tagline:** Research that remembers. Evidence that evolves.
- **Track:** Best Apps and Agents
- **Target Hackathon:** Nebius x NVIDIA Global AI Hackathon
- **License:** MIT License (Visible in repository root)
- **Repository:** https://github.com/balabhadra3141/Recall-Research
- **Live Demo URL:** https://recall-research.vercel.app *(Update with verified deployment URL)*
- **YouTube Demo URL:** https://youtu.be/your-demo-id *(Under 3 minutes)*

---

## 2. Inspiration & Problem Statement
When conducting deep technical investigations—whether tracking solid-state battery breakthroughs, monitoring open-source LLM advances, or evaluating post-quantum cryptography standards—researchers face a common frustration:
Every research session begins as an amnesiac blank slate.
Users repeat searches, lose track of why past conclusions were formed, and struggle to identify **what is genuinely new versus what was already corroborated or refuted**.

We built **Recall Research** to transform ephemeral web searches into a living, cumulative research workspace that remembers historical inquiries and explicitly analyzes evidence evolution over time.

---

## 3. What It Does
Recall Research is a full-stack research intelligence workspace:
1. **Intelligent Query Intake:** Users submit deep questions or select starter investigations.
2. **Real-time Grounded Web Research:** Calls Tavily API to gather live web documentation, preserving exact publication dates, URLs, and verbatim excerpts.
3. **NVIDIA Nemotron Synthesis via Nebius Token Factory:** Uses `nvidia/nemotron-3-super-120b-a12b` to synthesize structured briefings containing executive summaries, key findings, competing perspectives, timelines, uncertainties, and open questions.
4. **Deterministic Citation Integrity:** Validates every citation tag (e.g., `[S1]`, `[S2]`) against the retrieved evidence pool to guarantee zero hallucinated source references.
5. **Local-First Persistent Memory:** Automatically proposes durable memory candidates and saves them directly to browser IndexedDB (`RecallResearchDB`), surviving page reloads without leaking private notes to third-party databases.
6. **Signature Feature — Research Delta:** When revisiting a topic, the engine retrieves prior memories and sessions, performs fresh search, and computes an evidence-based comparison classifying developments into:
   - **🆕 New:** Findings supported by current evidence and absent in prior archives.
   - **🤝 Corroborated:** Prior conclusions independently reaffirmed by recent reporting.
   - **⚠️ Contradicted:** Recent evidence directly refuting an earlier conclusion.
   - **❓ Unresolved:** Open questions where evidence remains split or inconclusive.

---

## 4. How We Built It (Technical Stack & Architecture)
- **Framework:** Next.js 16 (App Router) with TypeScript and Tailwind CSS.
- **Model Hosting & Inference:** **Nebius Token Factory** (`https://api.tokenfactory.nebius.com/v1/`), strictly locked to NVIDIA open-source models:
  - `nvidia/nemotron-3-super-120b-a12b`: Heavyweight synthesis, nuanced dialectic comparisons, and Research Delta classification.
  - `nvidia/nemotron-3-nano-30b-a3b`: Lightweight intent classification and query extraction.
  - Zero fallback to proprietary or non-Nebius providers.
- **Live Search & Extraction:** **Tavily Search API v1**, retrieving live articles, computing relevance scores, and filtering prompt injection attempts.
- **Persistence:** Browser **IndexedDB** using the `idb` abstraction with typed stores for sessions, memories, sources, and deltas.
- **Auditing & Testing:** Vitest test suite running 9 automated tests for citation validation, parser resilience, and markdown generation.

---

## 5. Explicit Technology Roles

### Nebius Token Factory & NVIDIA Nemotron
Nebius Token Factory provides high-throughput, low-latency OpenAI-compatible endpoints hosting NVIDIA's open-source Nemotron models. We leveraged Nemotron-3 Super's 120B parameter capacity for dense, dialectical synthesis that faithfully adheres to strict JSON schemas and evidence grounding without hallucination.

### Tavily Search API
Tavily serves as our real-time empirical sensory organ. Rather than relying on outdated static training weights, Tavily retrieves live web snippets, author metadata, and publication timestamps, ensuring that Research Delta comparisons operate on authentic temporal shifts.

---

## 6. Challenges Overcome
- **Preventing Citation Hallucination:** Large language models frequently invent source IDs when synthesizing multi-source documents. We built an active `CitationValidator` service that compares model output against the verified source array, stripping invalid references and tagging unsupported claims honestly.
- **Longitudinal Evidence Reconciliation:** Comparing two sets of evidence across time is non-trivial. We designed the Research Delta prompt schema to distinguish between truly *new* findings, *corroborated* consensus, and *contradicted* facts, while explicitly stating comparison scope limitations.
- **Local-First Privacy:** Balancing rich persistence with user privacy led us to browser IndexedDB, ensuring users own their research library locally without forced account creation.

---

## 7. Honest Limitations & Future Horizons
- **IndexedDB Profile Boundaries:** Browser storage is scoped to a single device and browser profile; cross-device sync will require an encrypted user-controlled relay.
- **Search Horizon:** Research Deltas depend on the quality of public web indexing; gated academic databases or internal corporate intranets require custom connector integration.

---

# 3-Minute Demo Video Script

**Target Duration:** 2 minutes 45 seconds (Under 3-minute hard limit)

### Scene 1: Introduction & The Problem (0:00 – 0:25)
- **Visual:** Open browser on Recall Research home canvas.
- **Voiceover:** *"Every time we use AI for research, we start from zero. We repeat the same searches, lose track of past insights, and have no easy way to know what has changed since our last investigation. This is Recall Research: an AI research analyst that remembers your research and highlights how evidence evolves over time."*

### Scene 2: Live Search & Nemotron Synthesis (0:25 – 0:55)
- **Visual:** Type query *"What are the latest developments in solid-state batteries?"* and click Research. Show real-time progress indicator.
- **Voiceover:** *"When we submit an investigation, Recall Research queries the Tavily API for live web sources. It then feeds the verified evidence into NVIDIA Nemotron Super hosted on Nebius Token Factory. Notice how every key finding links directly to a verified source pill like S1 or S2, audited by our citation validator."*

### Scene 3: Persistent Local-First Memory (0:55 – 1:30)
- **Visual:** Click *Save to Memory*. Navigate to *Memory Library* tab. Show saved records. Reload the browser page (`F5`) to prove persistence.
- **Voiceover:** *"With one click, durable findings are saved to our local-first IndexedDB library. When we reload the page or reopen our browser tomorrow, our research remains intact on our machine—safe, private, and searchable."*

### Scene 4: The Signature Feature — Research Delta (1:30 – 2:20)
- **Visual:** Click *What changed?* on the session. Watch the system perform a fresh Tavily search and render the *Research Delta* component.
- **Voiceover:** *"Here is where Recall Research shines: Research Delta. When we revisit an evolving topic, the engine retrieves our past findings, conducts a fresh search, and uses Nemotron Super to compare the evidence. It highlights brand-new developments in green, corroborated consensus in blue, and directly contradicted prior claims in red, complete with dual citations to both past and current evidence."*

### Scene 5: Nebius + NVIDIA Architecture & Closing (2:20 – 2:45)
- **Visual:** Open the *Diagnostics* modal showing Nebius Token Factory connectivity, active Nemotron model IDs, and export options.
- **Voiceover:** *"Recall Research is powered strictly by NVIDIA open models on Nebius Token Factory and Tavily web research. The entire code is open-source under the MIT license. Research that remembers. Evidence that evolves. Thank you!"*
