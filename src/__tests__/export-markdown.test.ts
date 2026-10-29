import { describe, it, expect } from "vitest";
import { generateMarkdownReport } from "@/lib/utils/export-markdown";
import { ResearchSession } from "@/lib/types";

describe("generateMarkdownReport", () => {
  const session: ResearchSession = {
    id: "sess-test-1",
    question: "What is the state of Post-Quantum Cryptography in 2026?",
    topicKey: "post-quantum-cryptography",
    createdAt: "2026-03-01T12:00:00Z",
    updatedAt: "2026-03-01T12:05:00Z",
    status: "completed",
    modelUsed: "nvidia/nemotron-3-super-120b-a12b",
    sources: [
      {
        id: "S1",
        url: "https://csrc.nist.gov/pqc",
        title: "NIST PQC Standards FIPS 203, 204, 205",
        excerpt: "NIST finalized ML-KEM and ML-DSA standards.",
        retrievedAt: "2026-03-01T12:01:00Z",
        provider: "tavily",
        sessionIds: ["sess-test-1"],
      },
    ],
    sourceIds: ["S1"],
    memoryIds: ["mem-1"],
    briefing: {
      title: "Post-Quantum Cryptography Standards and Deployment",
      executiveSummary: "NIST has finalized core post-quantum standards.",
      keyFindings: [
        {
          id: "F1",
          claim: "NIST released FIPS 203 and 204 standards",
          synthesis: "ML-KEM and ML-DSA are officially standardized for general use.",
          sourceIds: ["S1"],
          confidence: "high",
        },
      ],
      competingViewpoints: [],
      areasOfAgreement: ["Migration must begin before cryptanalytically relevant quantum computers exist."],
      contradictionsAndUncertainties: [],
      timelineAndDevelopments: [
        {
          dateOrPeriod: "August 2024 - 2026",
          event: "Initial enterprise migration pilots launched.",
          sourceIds: ["S1"],
        },
      ],
      implicationsAndLimitations: ["Public key infrastructure overhaul takes years."],
      openQuestions: ["When will hybrid TLS become standard across all CDN providers?"],
      suggestedNextSteps: ["Audit internal cryptographic assets for quantum readiness."],
    },
    comparison: {
      id: "delta-1",
      previousSessionId: "sess-prior",
      currentSessionId: "sess-test-1",
      createdAt: "2026-03-01T12:04:00Z",
      topic: "post-quantum-cryptography",
      overallDeltaSummary: "Standards moved from draft status into final FIPS specifications.",
      newFindings: [
        {
          claim: "FIPS 203 officially published",
          explanation: "Prior session was during draft commentary phase.",
          currentSourceIds: ["S1"],
        },
      ],
      corroboratedFindings: [],
      contradictedFindings: [],
      unresolvedFindings: [],
      comparisonLimitations: ["Examines NIST standard releases only."],
    },
  };

  it("generates markdown with metadata, briefing sections, delta, and real sources", () => {
    const md = generateMarkdownReport(session);

    expect(md).toContain("# Research Briefing: Post-Quantum Cryptography Standards and Deployment");
    expect(md).toContain("nvidia/nemotron-3-super-120b-a12b");
    expect(md).toContain("## ⚡ Research Delta (Longitudinal Comparison)");
    expect(md).toContain("FIPS 203 officially published");
    expect(md).toContain("https://csrc.nist.gov/pqc");
    expect(md).toContain("[S1] NIST PQC Standards FIPS 203, 204, 205");
  });
});
