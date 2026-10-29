import { BriefingReport, MemoryRecord, ResearchDelta, ResearchSession, SourceRecord } from "@/lib/types";
import { nebiusService } from "./nebius";

export class ResearchDeltaEngine {
  /**
   * Compares prior research session/memories against current findings using NVIDIA Nemotron on Nebius.
   */
  public async computeDelta(params: {
    previousSession: ResearchSession;
    priorMemories?: MemoryRecord[];
    currentSessionId: string;
    currentBriefing: BriefingReport;
    currentSources: SourceRecord[];
    topic: string;
  }): Promise<ResearchDelta> {
    const {
      previousSession,
      priorMemories = [],
      currentSessionId,
      currentBriefing,
      currentSources,
      topic,
    } = params;

    // Build prior findings summary
    const priorFindings = previousSession.briefing?.keyFindings || [];
    const priorSources = previousSession.sources || [];

    const priorEvidenceText = priorFindings
      .map(
        (f) =>
          `[Prior Finding ID: ${f.id}]
Claim: ${f.claim}
Synthesis: ${f.synthesis}
Prior Sources Cited: ${f.sourceIds.join(", ")}`
      )
      .join("\n\n");

    const priorMemoryText = priorMemories.length
      ? "\nPrior Durable Memories:\n" +
        priorMemories.map((m) => `- [${m.type}] ${m.title}: ${m.content}`).join("\n")
      : "";

    // Build current findings summary
    const currentEvidenceText = currentBriefing.keyFindings
      .map(
        (f) =>
          `[Current Finding ID: ${f.id}]
Claim: ${f.claim}
Synthesis: ${f.synthesis}
Current Sources Cited: ${f.sourceIds.join(", ")}`
      )
      .join("\n\n");

    const currentSourcePool = currentSources
      .map((s) => `[${s.id}] ${s.title} (${s.url}) - Published: ${s.publishedAt || "N/A"}`)
      .join("\n");

    const systemPrompt = `You are the Research Delta Engine of Recall Research, running on NVIDIA Nemotron through Nebius Token Factory.
Your responsibility is longitudinal research comparison: identifying exactly how new evidence shifts, corroborates, or refutes prior knowledge.

Delta Classification Categories:
1. "New": Supported by current evidence and entirely absent in previous research records examined.
2. "Corroborated": Current evidence independently validates or reinforces an earlier finding.
3. "Contradicted": Current evidence materially conflicts with, refutes, or invalidates an earlier finding.
4. "Unresolved": The available evidence is ambiguous, contradictory, or insufficient to reach a settled conclusion.

Rules:
- Never label a finding as "new" simply because memory is short; base it on substantive advancement beyond the prior records provided.
- Preserve explicit links to both Prior Sources and Current Sources where applicable.
- State honest limitations of the comparison under "comparisonLimitations" (e.g., date coverage gaps, retrieval scope).
- Output must be strict JSON adhering to the schema.`;

    const userPrompt = `Topic: "${topic}"
Prior Session Date: ${previousSession.createdAt}
Current Session Date: ${new Date().toISOString()}

### PREVIOUS RESEARCH FINDINGS (Session ${previousSession.id}):
${priorEvidenceText || "None recorded"}
${priorMemoryText}

### CURRENT RESEARCH EVIDENCE (Session ${currentSessionId}):
${currentEvidenceText}

Current Source Pool:
${currentSourcePool}

Analyze the delta and return a JSON object with this exact structure:
{
  "overallDeltaSummary": "Executive summary of the major shifts, confirmations, or revisions discovered since the prior session.",
  "newFindings": [
    {
      "claim": "Direct statement of the genuinely new development",
      "explanation": "Why this represents new information relative to prior research records",
      "currentSourceIds": ["S1"]
    }
  ],
  "corroboratedFindings": [
    {
      "claim": "Claim that has been independently reaffirmed",
      "pastFindingSummary": "What was previously recorded",
      "currentEvidence": "How current sources confirm it",
      "priorSourceIds": ["S1"],
      "currentSourceIds": ["S2"]
    }
  ],
  "contradictedFindings": [
    {
      "claim": "Point of contention or refuted fact",
      "pastFindingSummary": "What was previously concluded",
      "conflictExplanation": "How the new evidence directly challenges or contradicts the past finding",
      "priorSourceIds": ["S1"],
      "currentSourceIds": ["S3"]
    }
  ],
  "unresolvedFindings": [
    {
      "claim": "Open controversy or inconclusive point",
      "unresolvedReason": "Why neither prior nor current evidence can definitively resolve this question",
      "sourceIds": ["S1"]
    }
  ],
  "comparisonLimitations": [
    "Specific scope boundary or potential blindspot in comparing these two time periods"
  ]
}`;

    const modelToUse = nebiusService.getEffectiveModel("super");
    const { content } = await nebiusService.chatCompletion({
      model: modelToUse,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1,
      maxTokens: 3500,
      jsonMode: true,
    });

    const parsed = nebiusService.parseJsonOutput<{
      overallDeltaSummary: string;
      newFindings: any[];
      corroboratedFindings: any[];
      contradictedFindings: any[];
      unresolvedFindings: any[];
      comparisonLimitations: string[];
    }>(content);

    // Validate current source IDs
    const validCurrentSourceIds = new Set(currentSources.map((s) => s.id));
    const sanitizeIds = (ids: string[]) => (Array.isArray(ids) ? ids.filter((id) => validCurrentSourceIds.has(id)) : []);

    const delta: ResearchDelta = {
      id: `delta-${previousSession.id}-${currentSessionId}`,
      previousSessionId: previousSession.id,
      currentSessionId,
      createdAt: new Date().toISOString(),
      topic,
      overallDeltaSummary: parsed.overallDeltaSummary || "Comparison completed across research sessions.",
      newFindings: (parsed.newFindings || []).map((item) => ({
        claim: item.claim,
        explanation: item.explanation,
        currentSourceIds: sanitizeIds(item.currentSourceIds),
      })),
      corroboratedFindings: (parsed.corroboratedFindings || []).map((item) => ({
        claim: item.claim,
        pastFindingSummary: item.pastFindingSummary,
        currentEvidence: item.currentEvidence,
        priorSourceIds: Array.isArray(item.priorSourceIds) ? item.priorSourceIds : [],
        currentSourceIds: sanitizeIds(item.currentSourceIds),
      })),
      contradictedFindings: (parsed.contradictedFindings || []).map((item) => ({
        claim: item.claim,
        pastFindingSummary: item.pastFindingSummary,
        conflictExplanation: item.conflictExplanation,
        priorSourceIds: Array.isArray(item.priorSourceIds) ? item.priorSourceIds : [],
        currentSourceIds: sanitizeIds(item.currentSourceIds),
      })),
      unresolvedFindings: (parsed.unresolvedFindings || []).map((item) => ({
        claim: item.claim,
        unresolvedReason: item.unresolvedReason,
        sourceIds: sanitizeIds(item.sourceIds),
      })),
      comparisonLimitations: Array.isArray(parsed.comparisonLimitations)
        ? parsed.comparisonLimitations
        : ["Comparison is limited to retrieved Tavily sources and preserved session records."],
    };

    return delta;
  }
}

export const researchDeltaEngine = new ResearchDeltaEngine();
