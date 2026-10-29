import { BriefingReport, SourceRecord } from "@/lib/types";

export interface CitationValidationResult {
  briefing: BriefingReport;
  validCitationCount: number;
  invalidCitationsRemoved: string[];
  unsupportedClaimsCount: number;
}

export class CitationValidator {
  /**
   * Validates and purifies all citation IDs referenced throughout the briefing against the active source pool.
   * Strips hallucinated source IDs that do not exist in the retrieved evidence set.
   */
  public static validateBriefing(
    briefing: BriefingReport,
    sources: SourceRecord[]
  ): CitationValidationResult {
    const validSourceIdSet = new Set<string>(sources.map((s) => s.id));
    const invalidCitationsRemoved: string[] = [];
    let validCitationCount = 0;
    let unsupportedClaimsCount = 0;

    const sanitizeSourceIds = (ids: string[] = []): string[] => {
      const cleaned: string[] = [];
      for (const rawId of ids) {
        const id = rawId.trim();
        if (validSourceIdSet.has(id)) {
          if (!cleaned.includes(id)) {
            cleaned.push(id);
            validCitationCount++;
          }
        } else {
          invalidCitationsRemoved.push(id);
        }
      }
      return cleaned;
    };

    // 1. Sanitize Key Findings
    const validatedFindings = briefing.keyFindings.map((finding) => {
      const validIds = sanitizeSourceIds(finding.sourceIds);
      if (validIds.length === 0) {
        unsupportedClaimsCount++;
      }
      return {
        ...finding,
        sourceIds: validIds,
      };
    });

    // 2. Sanitize Competing Viewpoints
    const validatedViewpoints = briefing.competingViewpoints.map((vp) => ({
      ...vp,
      perspectives: vp.perspectives.map((p) => ({
        ...p,
        sourceIds: sanitizeSourceIds(p.sourceIds),
      })),
    }));

    // 3. Sanitize Contradictions and Uncertainties
    const validatedContradictions = briefing.contradictionsAndUncertainties.map((cu) => ({
      ...cu,
      sourceIds: sanitizeSourceIds(cu.sourceIds),
    }));

    // 4. Sanitize Timeline Items
    const validatedTimeline = briefing.timelineAndDevelopments.map((ti) => ({
      ...ti,
      sourceIds: sanitizeSourceIds(ti.sourceIds),
    }));

    const cleanedBriefing: BriefingReport = {
      ...briefing,
      keyFindings: validatedFindings,
      competingViewpoints: validatedViewpoints,
      contradictionsAndUncertainties: validatedContradictions,
      timelineAndDevelopments: validatedTimeline,
    };

    return {
      briefing: cleanedBriefing,
      validCitationCount,
      invalidCitationsRemoved,
      unsupportedClaimsCount,
    };
  }

  /**
   * Helper to resolve a citation ID to its full source record
   */
  public static resolveCitation(sourceId: string, sources: SourceRecord[]): SourceRecord | undefined {
    return sources.find((s) => s.id === sourceId);
  }
}
