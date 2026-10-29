import { ResearchSession } from "@/lib/types";

export function generateMarkdownReport(session: ResearchSession): string {
  const briefing = session.briefing;
  const sources = session.sources || [];
  const delta = session.comparison;

  const lines: string[] = [];

  lines.push(`# Research Briefing: ${briefing?.title || session.question}`);
  lines.push(`**Generated:** ${new Date(session.createdAt).toUTCString()}`);
  lines.push(`**Model:** ${session.modelUsed || "NVIDIA Nemotron via Nebius Token Factory"}`);
  lines.push(`**Research Question:** ${session.question}`);
  lines.push(`**Topic Area:** ${session.topicKey}`);
  lines.push("");
  lines.push("> *Notice:* This report is grounded in web sources retrieved at the timestamp above. Source URLs were live at retrieval time; web availability and consensus may evolve.");
  lines.push("");

  if (briefing?.executiveSummary) {
    lines.push("## Executive Summary");
    lines.push(briefing.executiveSummary);
    lines.push("");
  }

  // Signature Research Delta if available
  if (delta) {
    lines.push("## ⚡ Research Delta (Longitudinal Comparison)");
    lines.push(`*Comparing against previous session \`${delta.previousSessionId}\`*`);
    lines.push("");
    lines.push(delta.overallDeltaSummary);
    lines.push("");

    if (delta.newFindings.length > 0) {
      lines.push("### 🆕 New Findings");
      for (const item of delta.newFindings) {
        lines.push(`- **${item.claim}**: ${item.explanation} *(Sources: ${item.currentSourceIds.join(", ")})*`);
      }
      lines.push("");
    }

    if (delta.corroboratedFindings.length > 0) {
      lines.push("### 🤝 Corroborated Findings");
      for (const item of delta.corroboratedFindings) {
        lines.push(`- **${item.claim}**`);
        lines.push(`  - *Prior:* ${item.pastFindingSummary} *(Prior Sources: ${item.priorSourceIds.join(", ")})*`);
        lines.push(`  - *Current:* ${item.currentEvidence} *(Current Sources: ${item.currentSourceIds.join(", ")})*`);
      }
      lines.push("");
    }

    if (delta.contradictedFindings.length > 0) {
      lines.push("### ⚠️ Contradicted Findings");
      for (const item of delta.contradictedFindings) {
        lines.push(`- **${item.claim}**`);
        lines.push(`  - *Previous Conclusion:* ${item.pastFindingSummary} *(Prior Sources: ${item.priorSourceIds.join(", ")})*`);
        lines.push(`  - *Current Conflict:* ${item.conflictExplanation} *(Current Sources: ${item.currentSourceIds.join(", ")})*`);
      }
      lines.push("");
    }

    if (delta.unresolvedFindings.length > 0) {
      lines.push("### ❓ Unresolved Findings");
      for (const item of delta.unresolvedFindings) {
        lines.push(`- **${item.claim}**: ${item.unresolvedReason} *(Sources: ${item.sourceIds.join(", ")})*`);
      }
      lines.push("");
    }

    if (delta.comparisonLimitations.length > 0) {
      lines.push("### ℹ️ Comparison Limitations");
      for (const lim of delta.comparisonLimitations) {
        lines.push(`- ${lim}`);
      }
      lines.push("");
    }
  }

  if (briefing?.keyFindings && briefing.keyFindings.length > 0) {
    lines.push("## Key Findings");
    for (const kf of briefing.keyFindings) {
      const confidenceTag = `\`Confidence: ${kf.confidence.toUpperCase()}\``;
      const citationTag = kf.sourceIds.length > 0 ? `[${kf.sourceIds.join(", ")}]` : "[Uncited]";
      lines.push(`### ${kf.id}: ${kf.claim} ${confidenceTag} ${citationTag}`);
      lines.push(kf.synthesis);
      lines.push("");
    }
  }

  if (briefing?.competingViewpoints && briefing.competingViewpoints.length > 0) {
    lines.push("## Competing Viewpoints");
    for (const cv of briefing.competingViewpoints) {
      lines.push(`### Focus: ${cv.topic}`);
      for (const p of cv.perspectives) {
        lines.push(`- **Perspective:** ${p.stance} *(Sources: ${p.sourceIds.join(", ")})*`);
      }
      lines.push("");
    }
  }

  if (briefing?.contradictionsAndUncertainties && briefing.contradictionsAndUncertainties.length > 0) {
    lines.push("## Contradictions & Uncertainties");
    for (const cu of briefing.contradictionsAndUncertainties) {
      lines.push(`- **${cu.issue}**: ${cu.explanation} *(Sources: ${cu.sourceIds.join(", ")})*`);
    }
    lines.push("");
  }

  if (briefing?.timelineAndDevelopments && briefing.timelineAndDevelopments.length > 0) {
    lines.push("## Chronology & Developments");
    for (const tl of briefing.timelineAndDevelopments) {
      lines.push(`- **${tl.dateOrPeriod}:** ${tl.event} *(Sources: ${tl.sourceIds.join(", ")})*`);
    }
    lines.push("");
  }

  if (briefing?.openQuestions && briefing.openQuestions.length > 0) {
    lines.push("## Open Questions");
    for (const oq of briefing.openQuestions) {
      lines.push(`- ${oq}`);
    }
    lines.push("");
  }

  if (sources.length > 0) {
    lines.push("## Retrieved Source Evidence");
    for (const s of sources) {
      lines.push(`### [${s.id}] ${s.title}`);
      lines.push(`- **URL:** [${s.url}](${s.url})`);
      lines.push(`- **Published:** ${s.publishedAt || "Not stated"}`);
      lines.push(`- **Retrieved:** ${new Date(s.retrievedAt).toLocaleString()}`);
      lines.push(`- **Excerpt:** *"${s.excerpt.replace(/\n+/g, " ")}"*`);
      lines.push("");
    }
  }

  lines.push("---");
  lines.push("Exported from **Recall Research** — *Research that remembers. Evidence that evolves.*");

  return lines.join("\n");
}
