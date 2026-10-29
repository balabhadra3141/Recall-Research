export type MemoryType = "finding" | "source" | "preference" | "question" | "topic";

export interface SourceRecord {
  id: string; // e.g. "S1", "S2"
  url: string;
  canonicalUrl?: string;
  title: string;
  excerpt: string;
  publishedAt?: string;
  retrievedAt: string;
  provider: "tavily";
  relevanceScore?: number;
  sessionIds: string[];
}

export interface KeyFinding {
  id: string;
  claim: string;
  synthesis: string;
  sourceIds: string[];
  confidence: "high" | "moderate" | "low";
  isDurableMemoryCandidate?: boolean;
}

export interface CompetingViewpoint {
  topic: string;
  perspectives: Array<{
    stance: string;
    sourceIds: string[];
  }>;
}

export interface ContradictionOrUncertainty {
  issue: string;
  explanation: string;
  sourceIds: string[];
}

export interface TimelineItem {
  dateOrPeriod: string;
  event: string;
  sourceIds: string[];
}

export interface BriefingReport {
  title: string;
  executiveSummary: string;
  keyFindings: KeyFinding[];
  competingViewpoints: CompetingViewpoint[];
  areasOfAgreement: string[];
  contradictionsAndUncertainties: ContradictionOrUncertainty[];
  timelineAndDevelopments: TimelineItem[];
  implicationsAndLimitations: string[];
  openQuestions: string[];
  suggestedNextSteps: string[];
}

export interface DeltaItemNew {
  claim: string;
  explanation: string;
  currentSourceIds: string[];
}

export interface DeltaItemCorroborated {
  claim: string;
  pastFindingSummary: string;
  currentEvidence: string;
  priorSourceIds: string[];
  currentSourceIds: string[];
}

export interface DeltaItemContradicted {
  claim: string;
  pastFindingSummary: string;
  conflictExplanation: string;
  priorSourceIds: string[];
  currentSourceIds: string[];
}

export interface DeltaItemUnresolved {
  claim: string;
  unresolvedReason: string;
  sourceIds: string[];
}

export interface ResearchDelta {
  id: string;
  previousSessionId: string;
  currentSessionId: string;
  createdAt: string;
  topic: string;
  overallDeltaSummary: string;
  newFindings: DeltaItemNew[];
  corroboratedFindings: DeltaItemCorroborated[];
  contradictedFindings: DeltaItemContradicted[];
  unresolvedFindings: DeltaItemUnresolved[];
  comparisonLimitations: string[];
}

export interface MemoryRecord {
  id: string;
  type: MemoryType;
  title: string;
  content: string;
  topicKey: string;
  tags: string[];
  sourceIds: string[];
  sourceUrls?: string[];
  originSessionId?: string;
  confidence?: "high" | "moderate" | "low";
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
  supersededBy?: string;
}

export interface ResearchSession {
  id: string;
  question: string;
  topicKey: string;
  createdAt: string;
  updatedAt: string;
  briefing: BriefingReport | null;
  sourceIds: string[];
  sources: SourceRecord[];
  memoryIds: string[];
  previousSessionId?: string;
  comparison?: ResearchDelta;
  status: "idle" | "searching" | "synthesizing" | "comparing" | "completed" | "failed";
  errorMessage?: string;
  modelUsed?: string;
}

export interface ResearchRequest {
  question: string;
  topicKey?: string;
  previousSessionId?: string;
  selectedMemoryIds?: string[];
}

export interface ResearchResponse {
  session: ResearchSession;
  briefing: BriefingReport;
  sources: SourceRecord[];
  delta?: ResearchDelta;
  extractedMemories: MemoryRecord[];
  modelUsed: string;
}
