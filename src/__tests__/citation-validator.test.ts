import { describe, it, expect } from "vitest";
import { CitationValidator } from "@/lib/services/citation-validator";
import { BriefingReport, SourceRecord } from "@/lib/types";

describe("CitationValidator", () => {
  const mockSources: SourceRecord[] = [
    {
      id: "S1",
      url: "https://example.com/quantum-battery",
      title: "Solid-State Advancements 2026",
      excerpt: "Solid state cells reached 450 Wh/kg in testing.",
      retrievedAt: new Date().toISOString(),
      provider: "tavily",
      sessionIds: ["sess-1"],
    },
    {
      id: "S2",
      url: "https://example.com/cost-analysis",
      title: "Battery Manufacturing Cost Curve",
      excerpt: "Current cost per kWh remains 30% higher than traditional NMC.",
      retrievedAt: new Date().toISOString(),
      provider: "tavily",
      sessionIds: ["sess-1"],
    },
  ];

  const mockBriefing: BriefingReport = {
    title: "Solid State Battery Status",
    executiveSummary: "Solid-state batteries are advancing.",
    keyFindings: [
      {
        id: "F1",
        claim: "Energy density exceeds 400 Wh/kg",
        synthesis: "Lab trials demonstrated 450 Wh/kg.",
        sourceIds: ["S1", "S99"], // S99 is invalid/hallucinated
        confidence: "high",
      },
      {
        id: "F2",
        claim: "Manufacturing cost remains premium",
        synthesis: "Cost is roughly 30% above legacy cells.",
        sourceIds: ["S2"],
        confidence: "moderate",
      },
      {
        id: "F3",
        claim: "Unverified commercial timeline claim",
        synthesis: "Commercialization within 6 months.",
        sourceIds: ["S999"], // completely invalid
        confidence: "low",
      },
    ],
    competingViewpoints: [
      {
        topic: "Production Timeline",
        perspectives: [
          { stance: "Optimistic 2027", sourceIds: ["S1", "S100"] },
          { stance: "Conservative 2030+", sourceIds: ["S2"] },
        ],
      },
    ],
    areasOfAgreement: ["Higher energy density is demonstrated in pilot runs."],
    contradictionsAndUncertainties: [
      {
        issue: "Scale timelines",
        explanation: "Automakers disagree on mass manufacturing dates.",
        sourceIds: ["S1", "S2", "S50"],
      },
    ],
    timelineAndDevelopments: [
      {
        dateOrPeriod: "Q1 2026",
        event: "Sample delivery to auto partners",
        sourceIds: ["S1"],
      },
    ],
    implicationsAndLimitations: ["Pilot testing does not equal automotive high-volume scale."],
    openQuestions: ["Will solid electrolytes withstand cold-weather cycling?"],
    suggestedNextSteps: ["Monitor pilot plant yields."],
  };

  it("strips nonexistent source IDs from key findings", () => {
    const result = CitationValidator.validateBriefing(mockBriefing, mockSources);

    const f1 = result.briefing.keyFindings.find((f) => f.id === "F1");
    expect(f1?.sourceIds).toEqual(["S1"]); // S99 removed

    const f2 = result.briefing.keyFindings.find((f) => f.id === "F2");
    expect(f2?.sourceIds).toEqual(["S2"]);

    const f3 = result.briefing.keyFindings.find((f) => f.id === "F3");
    expect(f3?.sourceIds).toEqual([]); // S999 removed, left empty
  });

  it("accurately records removed invalid citations and unsupported claims count", () => {
    const result = CitationValidator.validateBriefing(mockBriefing, mockSources);

    expect(result.invalidCitationsRemoved).toContain("S99");
    expect(result.invalidCitationsRemoved).toContain("S999");
    expect(result.invalidCitationsRemoved).toContain("S100");
    expect(result.invalidCitationsRemoved).toContain("S50");
    expect(result.unsupportedClaimsCount).toBe(1); // F3 had no valid sources
  });

  it("sanitizes competing viewpoints and uncertainties", () => {
    const result = CitationValidator.validateBriefing(mockBriefing, mockSources);

    const vp = result.briefing.competingViewpoints[0];
    expect(vp.perspectives[0].sourceIds).toEqual(["S1"]);

    const cu = result.briefing.contradictionsAndUncertainties[0];
    expect(cu.sourceIds).toEqual(["S1", "S2"]);
  });
});
