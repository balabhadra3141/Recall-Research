import { BriefingReport, MemoryRecord, SourceRecord } from "@/lib/types";
import { nebiusService } from "./nebius";
import { CitationValidator } from "./citation-validator";

export class ResearchSynthesizer {
  /**
   * Generates an evidence-backed briefing using NVIDIA Nemotron on Nebius.
   */
  public async generateBriefing(params: {
    question: string;
    sources: SourceRecord[];
    priorMemories?: MemoryRecord[];
    topicKey?: string;
    sessionId: string;
  }): Promise<{ briefing: BriefingReport; candidateMemories: MemoryRecord[]; modelUsed: string }> {
    const { question, sources, priorMemories = [], topicKey = "general", sessionId } = params;

    if (sources.length === 0) {
      throw new Error("Cannot synthesize briefing without retrieved sources.");
    }

    // Format sources into evidence blocks
    const evidenceText = sources
      .map(
        (s) =>
          `[Source ID: ${s.id}]
Title: ${s.title}
URL: ${s.url}
Published: ${s.publishedAt || "Unknown date"}
Excerpt: ${s.excerpt}`
      )
      .join("\n\n---\n\n");

    // Format prior memories if any
    let priorMemoryText = "";
    if (priorMemories.length > 0) {
      priorMemoryText = `\n\n### Prior Saved Memories on this Topic:\n` +
        priorMemories
          .map((m) => `- [Memory ID: ${m.id}] (${m.type}): ${m.title} — ${m.content}`)
          .join("\n");
    }

    const systemPrompt = `You are Recall Research, a world-class investigative AI research analyst running on NVIDIA Nemotron through Nebius Token Factory.
Your core mission is to synthesize an authoritative, rigorously source-backed briefing from web evidence.

NON-NEGOTIABLE GROUNDING RULES:
1. Every key finding, perspective, and claim MUST reference only the provided Source IDs (e.g. ["S1", "S2"]). Never invent source IDs.
2. Ground all claims directly in the provided excerpts. Do NOT hallucinate dates, statistics, or announcements not present in the excerpts.
3. Clearly distinguish confirmed facts reported by sources from your analytical interpretation.
4. If the retrieved evidence is incomplete, conflicting, or inconclusive on any point, explicitly state this under contradictions and uncertainties.
5. You must output ONLY a valid JSON object matching the requested schema. No conversational filler.`;

    const userPrompt = `Research Question: "${question}"

### RETRIEVED WEB EVIDENCE:
${evidenceText}
${priorMemoryText}

Synthesize a thorough briefing and respond with a single JSON object with this exact structure:
{
  "title": "Comprehensive title reflecting the core finding",
  "executiveSummary": "2-3 dense, informative paragraphs summarizing the state of the topic based on current evidence.",
  "keyFindings": [
    {
      "id": "F1",
      "claim": "Direct, punchy statement of the finding",
      "synthesis": "Detailed evidence-backed explanation citing specific facts from sources.",
      "sourceIds": ["S1"],
      "confidence": "high" | "moderate" | "low",
      "isDurableMemoryCandidate": true | false
    }
  ],
  "competingViewpoints": [
    {
      "topic": "Specific point of contention or perspective difference",
      "perspectives": [
        {
          "stance": "Perspective description",
          "sourceIds": ["S1"]
        }
      ]
    }
  ],
  "areasOfAgreement": [
    "Consensus point shared across multiple sources"
  ],
  "contradictionsAndUncertainties": [
    {
      "issue": "Specific contradiction or gap in current evidence",
      "explanation": "Why this remains uncertain or disputed",
      "sourceIds": ["S1"]
    }
  ],
  "timelineAndDevelopments": [
    {
      "dateOrPeriod": "e.g. Q1 2026, or recent date",
      "event": "What occurred or was announced",
      "sourceIds": ["S1"]
    }
  ],
  "implicationsAndLimitations": [
    "Practical implications of these findings and research boundaries"
  ],
  "openQuestions": [
    "Key unanswered question that warrants follow-up investigation"
  ],
  "suggestedNextSteps": [
    "Recommended research query or action to probe further"
  ]
}`;

    const modelToUse = nebiusService.getEffectiveModel("super");
    const { content, model } = await nebiusService.chatCompletion({
      model: modelToUse,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.15,
      maxTokens: 4000,
      jsonMode: true,
    });

    const parsedJson = nebiusService.parseJsonOutput<BriefingReport>(content);

    // Validate and clean citations against the real sources
    const { briefing } = CitationValidator.validateBriefing(parsedJson, sources);

    // Extract durable memories from findings tagged as durable candidates
    const candidateMemories: MemoryRecord[] = briefing.keyFindings
      .filter((f) => f.isDurableMemoryCandidate !== false)
      .map((f, idx) => ({
        id: `mem-${sessionId}-${idx + 1}-${Date.now().toString(36)}`,
        type: "finding",
        title: f.claim,
        content: f.synthesis,
        topicKey,
        tags: [topicKey, "briefing-finding"],
        sourceIds: f.sourceIds,
        sourceUrls: f.sourceIds
          .map((id) => sources.find((s) => s.id === id)?.url)
          .filter(Boolean) as string[],
        originSessionId: sessionId,
        confidence: f.confidence,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pinned: false,
      }));

    return {
      briefing,
      candidateMemories,
      modelUsed: model,
    };
  }
}

export const researchSynthesizer = new ResearchSynthesizer();
