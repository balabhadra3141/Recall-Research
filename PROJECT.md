# PROJECT.md — Recall Research

## 1. Product overview

**Name:** Recall Research  
**Tagline:** Research that remembers. Evidence that evolves.  
**Category:** AI research analyst / persistent knowledge workspace  
**Hackathon:** Nebius x NVIDIA Global AI Hackathon  
**Target track:** Best Apps and Agents

Recall Research is a research workspace that searches the web, synthesizes source-backed briefings using NVIDIA Nemotron models hosted on Nebius, saves durable findings to user-controlled persistent memory, and compares fresh evidence against previous research.

It is not intended to be another generic chatbot. Its defining capability is **longitudinal research**: it remembers prior investigations and helps users understand what is new, corroborated, contradicted, or unresolved when a topic changes.

## 2. Problem

Research tools often treat each question as an isolated interaction. Users repeat searches, lose useful findings in chat history, struggle to recall why a conclusion was reached, and have difficulty distinguishing genuinely new developments from information they already reviewed.

Recall Research addresses this by connecting:
- Current web research.
- Source-backed synthesis.
- Persistent, structured memory.
- Research history and provenance.
- Evidence-based comparison over time.

## 3. Target users

- Students conducting technical or academic research.
- Developers investigating tools, frameworks, and emerging technologies.
- Analysts tracking evolving industries and technical topics.
- Builders who need a lightweight personal knowledge base grounded in web evidence.

The initial version is a single-user, local-first browser workspace. Multi-user collaboration and cross-device synchronization are out of scope unless deliberately implemented and tested.

## 4. Core user journey

### First session
1. The user enters a research question.
2. The server optionally uses Nemotron Nano to classify intent or improve the search plan.
3. The server calls Tavily for current web results.
4. The application selects relevant evidence and optionally extracts fuller page content.
5. Nemotron generates a structured briefing from the actual retrieved evidence.
6. The application validates citation IDs and renders source-linked findings.
7. The user saves selected findings or allows the product to suggest durable memories.
8. The user inspects and confirms which memories to keep.

### Later session
1. The user reopens Recall Research in the same browser profile.
2. IndexedDB restores prior sessions and saved memories.
3. The user asks a follow-up or selects **What changed?**
4. The application retrieves relevant prior findings and performs a fresh Tavily search.
5. Nemotron compares prior research with new evidence.
6. The application renders a comparison with separate citations for earlier and current evidence.
7. The new research version is saved without silently overwriting the old version.

## 5. Product principles

### Evidence before confidence
Briefings should be grounded in retrieved sources. Unsupported claims should be marked as uncertain or omitted.

### Memory with provenance
A saved finding should link to the source and research session that produced it whenever possible.

### User control
Users can inspect, edit, pin, delete, and export saved memory. Memory must not be a hidden, uneditable black box.

### Local-first by default
The initial memory library uses browser IndexedDB, allowing persistence across sessions in the same browser profile without a separate hosted database.

### Honest privacy
The application must disclose that research questions are sent to Tavily and that selected evidence and relevant memory may be sent to Nebius for inference. Do not claim that all data remains on the device or that there is zero third-party processing.

### Explicit uncertainty
The product must distinguish source observations, model interpretation, conflicting evidence, and unknowns.

### Efficient orchestration
Use deterministic code for persistence, sorting, deduplication, source validation, and comparison metadata. Call models only where model reasoning adds value.

## 6. Signature feature: Research Delta

**Research Delta** is the primary differentiator.

When a topic is revisited, compare the current research with prior saved findings and classify each relevant result as:

- **New:** supported by current evidence and not found in the previous research records examined.
- **Corroborated:** current evidence independently supports a previous finding.
- **Contradicted:** current evidence materially conflicts with a previous finding.
- **Unresolved:** the available evidence cannot establish a reliable conclusion.

These are evidence-comparison labels, not guarantees of truth. A result must not be labeled new solely because a memory-retrieval step missed an older record. The interface should disclose the comparison scope and link to the previous and current sources.

A good example is tracking solid-state battery commercialization, AI model releases, cloud service changes, cybersecurity developments, or the progress of an open-source project.

## 7. Required features

### 7.1 Research workspace
- Research question input.
- Optional topic or date scope.
- Ability to revisit a previous topic.
- Progress indicators for search, synthesis, and memory.
- Clear errors and retry actions.

### 7.2 Tavily search
- Real server-side Tavily API requests.
- Query planning and reasonable result limits.
- Search result deduplication.
- Optional page extraction for important sources.
- Source title, URL, excerpt, available publication date, and retrieval timestamp.
- Search failures and missing evidence clearly reported.

### 7.3 Briefing generation
Generate a structured research report containing:
- Executive summary.
- Key findings.
- Evidence and citations.
- Competing viewpoints.
- Areas of agreement.
- Contradictions and uncertainties.
- Relevant dates and developments.
- Implications and limitations.
- Open questions.
- Suggested next research steps.

### 7.4 Citation integrity
- Every substantive claim should cite real retrieved sources where available.
- Validate source IDs against the evidence set.
- Keep source-reported statements distinguishable from model interpretation.
- Do not invent links, titles, quotes, dates, or source support.
- Preserve source excerpts used to support important findings where practical.

### 7.5 Persistent memory
Use IndexedDB in the initial browser-based product.

Memory types:
1. Research findings.
2. Source records.
3. Research sessions and briefing versions.
4. Explicit user preferences.
5. Unresolved questions.
6. Topic associations.

Useful fields may include:
- Stable ID.
- Record type.
- Title or claim.
- Summary or content.
- Topic/tags.
- Source IDs.
- Originating session ID.
- Confidence or uncertainty label.
- Created and updated timestamps.
- Pinned state.
- Optional superseded-by relation.

Avoid storing redundant copies of entire transcripts as the only memory strategy. Extract structured findings and preserve the original session separately.

### 7.6 Memory library
- Search and filter saved memories.
- Filter by topic and date.
- Pin important items.
- Inspect source provenance.
- Edit and delete saved items.
- Open the originating research session.
- Export memory or selected reports.
- Clearly indicate local browser storage and its limitations.

### 7.7 Research history
- List previous research sessions.
- Reopen a prior briefing.
- Preserve old versions.
- Link sessions to their sources and extracted memories.
- Show when research was created and when its sources were retrieved.

### 7.8 Markdown export
Export the question, report timestamp, key findings, evidence links, uncertainty, and comparison results. Preserve real URLs and avoid claiming that a source remains current after export.

### 7.9 Demo starter topics
Include clearly labeled sample prompts such as:
- “What are the latest developments in solid-state batteries?”
- “How has the open-source model ecosystem changed recently?”
- “What has changed in the latest major cloud platform announcements?”
- “Compare recent developments in post-quantum cryptography.”

Sample prompts are not a substitute for actual web search. The live workflow must query Tavily and call Nemotron.

## 8. Recommended architecture

### Frontend
- Next.js.
- TypeScript.
- Tailwind CSS.
- Accessible reusable components.
- Responsive research workspace, source explorer, memory library, history, and comparison view.

### Server-side services
- Nebius model client.
- Tavily search/extraction client.
- Research orchestration service.
- Structured synthesis and schema validation.
- Citation validation.
- Safe API routes with input validation, timeouts, and sensible limits.

### Client-side persistence
- IndexedDB for research sessions, source records, and memory.
- A storage abstraction so persistence can be tested and replaced.
- No dependency on an ephemeral server filesystem for user memory.

### AI model roles
- **Nemotron Nano:** optional query classification, query expansion, and structured memory extraction.
- **Nemotron Super:** evidence synthesis and nuanced research comparison.

Exact model IDs must be verified against the current Nebius account and endpoint. Keep model IDs configurable and do not silently switch providers.

### Deterministic application responsibilities
Use ordinary code for:
- IndexedDB persistence.
- Stable IDs.
- Source URL normalization.
- Deduplication.
- Citation-ID validation.
- Timestamp handling.
- Sorting and filtering.
- User-confirmed deletion.
- Export formatting.
- Comparison-record bookkeeping.

## 9. Suggested data model

The implementation can adapt this schema, but must preserve equivalent relationships.

### ResearchSession
- `id`
- `question`
- `topicKey`
- `createdAt`
- `updatedAt`
- `briefing`
- `sourceIds[]`
- `memoryIds[]`
- `previousSessionId?`
- `comparison?`
- `status`

### SourceRecord
- `id`
- `url`
- `canonicalUrl?`
- `title`
- `excerpt`
- `publishedAt?`
- `retrievedAt`
- `provider`
- `relevanceScore?`
- `sessionIds[]`

### MemoryRecord
- `id`
- `type`
- `title`
- `content`
- `topicKey`
- `tags[]`
- `sourceIds[]`
- `originSessionId?`
- `confidence?`
- `createdAt`
- `updatedAt`
- `pinned`
- `supersededBy?`

### ResearchDelta
- `id`
- `previousSessionId`
- `currentSessionId`
- `createdAt`
- `newFindingIds[]`
- `corroboratedFindingIds[]`
- `contradictedFindingIds[]`
- `unresolvedFindingIds[]`
- `comparisonLimitations[]`

These are conceptual records. Choose an IndexedDB implementation that supports transactions and schema migrations. Avoid storing API credentials in browser storage.

## 10. User interface direction

Aim for a premium, calm research workspace—not a generic chatbot and not a cluttered analytics dashboard.

Suggested navigation:
- Home
- Research
- Memory
- History
- Sources
- Settings

Suggested research layout:
- Left navigation for research history and saved topics.
- Central briefing canvas with readable typography and clear hierarchy.
- Right-side or expandable evidence inspector.
- Compact status indicators for search and synthesis.
- Distinct sections for key findings, competing viewpoints, uncertainty, and open questions.
- A prominent “What changed?” action when prior research exists.

Use restrained color, good spacing, clear contrast, useful empty states, and mobile-friendly layouts. Avoid decorative charts unless they communicate meaningful evidence.

## 11. Security, privacy, and trust

- API keys are server-side only.
- Do not expose secrets in client bundles or logs.
- Validate external and model-generated data.
- Treat webpages and extracted content as untrusted.
- Never execute instructions embedded in retrieved pages.
- Do not render untrusted source HTML directly.
- Disclose which services receive queries and selected evidence.
- Do not transmit all stored memory by default.
- Let users delete local memory and explain browser/device boundaries.
- Avoid claims that a model's confidence score is statistically calibrated unless calibration has actually been established.

## 12. Testing strategy

Test:
- Real Nebius inference and error handling.
- Real Tavily search and extraction.
- Citation/source-ID validation.
- Invalid model output.
- Memory extraction validation.
- IndexedDB create/read/update/delete.
- Persistence after reload.
- Memory retrieval and deduplication.
- Research-delta classification and evidence links.
- Markdown export.
- No-results and insufficient-evidence cases.
- Production build and deployed API behavior.

Use deterministic fixtures for automated tests, but label them as fixtures. The demo must include a live workflow with real provider calls.

## 13. Hackathon demo narrative

Aim for a public YouTube video under three minutes.

Suggested structure:
- **0:00–0:15:** Introduce Recall Research and the problem of research that gets forgotten.
- **0:15–0:45:** Submit a question and show real Tavily search.
- **0:45–1:10:** Show a real Nemotron-generated briefing and working citations.
- **1:10–1:30:** Save findings and show them in the memory library.
- **1:30–1:50:** Reload or reopen the app and show that memory persists.
- **1:50–2:30:** Revisit the topic, search for fresh evidence, and demonstrate Research Delta.
- **2:30–2:50:** Explain Nebius Token Factory, NVIDIA Nemotron, Tavily, and local-first memory.
- **2:50–3:00:** Closing and project identity.

Use real app footage. Do not show credentials or private data. Keep the video within the official limit.

## 14. Definition of done

The product is ready for submission only when:
- A real Nebius-hosted NVIDIA model powers synthesis.
- Real Tavily search runs from the application.
- Citations link to actual retrieved sources.
- Memory persists across reloads in the same browser profile.
- Research history is preserved.
- Research Delta compares previous and current evidence.
- Users can inspect and manage memory.
- Export works.
- Tests and production build results are recorded honestly.
- The public demo URL has been checked.
- The public repository includes a visible open-source license and complete setup instructions.
- The public YouTube demo is available and under three minutes.
- Devpost details and links are complete and accurate.

## 15. Explicit out-of-scope items for the first release

Do not spend the deadline building these unless all core requirements are already complete:
- Autonomous background research agents.
- Complex multi-agent frameworks.
- Vector databases or a dedicated embedding pipeline.
- Cross-device synchronization.
- Full user-account infrastructure.
- Team collaboration.
- Mobile-native apps.
- Automatic research emails or notifications.
- Claims of fully private processing when third-party APIs are used.

The priority is a reliable, coherent, evidence-driven product with a distinctive memory and research-comparison experience.
