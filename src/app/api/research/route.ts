import { NextRequest, NextResponse } from "next/server";
import { tavilyService } from "@/lib/services/tavily";
import { researchSynthesizer } from "@/lib/services/synthesizer";
import { researchDeltaEngine } from "@/lib/services/research-delta";
import { MemoryRecord, ResearchDelta, ResearchResponse, ResearchSession } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      question,
      topicKey: userTopicKey,
      previousSession,
      priorMemories = [],
    } = body as {
      question: string;
      topicKey?: string;
      previousSession?: ResearchSession;
      priorMemories?: MemoryRecord[];
    };

    if (!question || typeof question !== "string" || question.trim().length === 0) {
      return NextResponse.json({ error: "A research question is required." }, { status: 400 });
    }

    // Verify server-side credentials
    if (!tavilyService.isConfigured()) {
      return NextResponse.json(
        {
          error:
            "TAVILY_API_KEY is not configured on the server. Please add it to your environment variables or .env.local.",
        },
        { status: 503 }
      );
    }

    if (!nebiusServiceIsConfigured()) {
      return NextResponse.json(
        {
          error:
            "NEBIUS_API_KEY is not configured on the server. Please add it to your environment variables or .env.local to access NVIDIA Nemotron models.",
        },
        { status: 503 }
      );
    }

    const sessionId = `sess-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const topicKey = userTopicKey?.trim() || deriveTopicKey(question);

    // 1. Search with Tavily
    const searchResult = await tavilyService.search(question.trim(), {
      maxResults: 6,
      sessionId,
    });

    const sources = searchResult.sources;

    // Handle Insufficient Evidence edge case honestly
    if (sources.length === 0) {
      const emptySession: ResearchSession = {
        id: sessionId,
        question: question.trim(),
        topicKey,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        briefing: {
          title: `Inconclusive Evidence: ${question.trim()}`,
          executiveSummary:
            "Tavily search returned no verifiable public sources for this specific inquiry. To maintain citation integrity and prevent hallucination, synthesis was halted.",
          keyFindings: [],
          competingViewpoints: [],
          areasOfAgreement: [],
          contradictionsAndUncertainties: [
            {
              issue: "Absence of empirical source evidence",
              explanation: "No active web pages or articles were retrieved matching the search terms.",
              sourceIds: [],
            },
          ],
          timelineAndDevelopments: [],
          implicationsAndLimitations: [
            "Research inquiry may be too narrow, contain obscure terminology, or reference events not indexed publicly.",
          ],
          openQuestions: ["Can the query be rephrased with broader keywords?"],
          suggestedNextSteps: ["Broaden keywords or inspect spelling and try again."],
        },
        sourceIds: [],
        sources: [],
        memoryIds: [],
        status: "completed",
        modelUsed: "N/A (Search yielded no sources)",
      };

      return NextResponse.json({
        session: emptySession,
        briefing: emptySession.briefing!,
        sources: [],
        extractedMemories: [],
        modelUsed: "none",
      } satisfies ResearchResponse);
    }

    // 2. Synthesize Evidence-Backed Briefing using Nemotron Super on Nebius
    const synthesisResult = await researchSynthesizer.generateBriefing({
      question: question.trim(),
      sources,
      priorMemories,
      topicKey,
      sessionId,
    });

    // 3. Compute Longitudinal Research Delta if a previous session was provided
    let delta: ResearchDelta | undefined = undefined;
    if (previousSession && previousSession.briefing) {
      try {
        delta = await researchDeltaEngine.computeDelta({
          previousSession,
          priorMemories,
          currentSessionId: sessionId,
          currentBriefing: synthesisResult.briefing,
          currentSources: sources,
          topic: topicKey,
        });
      } catch (deltaErr: any) {
        console.error("Warning: Delta computation failed:", deltaErr);
        // Do not fail entire briefing if delta calculation encounters an error; attach limitation
      }
    }

    // Assemble completed session
    const completedSession: ResearchSession = {
      id: sessionId,
      question: question.trim(),
      topicKey,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      briefing: synthesisResult.briefing,
      sourceIds: sources.map((s) => s.id),
      sources,
      memoryIds: synthesisResult.candidateMemories.map((m) => m.id),
      previousSessionId: previousSession?.id,
      comparison: delta,
      status: "completed",
      modelUsed: synthesisResult.modelUsed,
    };

    return NextResponse.json({
      session: completedSession,
      briefing: synthesisResult.briefing,
      sources,
      delta,
      extractedMemories: synthesisResult.candidateMemories,
      modelUsed: synthesisResult.modelUsed,
    } satisfies ResearchResponse);
  } catch (error: any) {
    console.error("API /api/research error:", error);
    return NextResponse.json(
      {
        error: error?.message || "An unexpected error occurred during research execution.",
      },
      { status: 500 }
    );
  }
}

function nebiusServiceIsConfigured(): boolean {
  return Boolean(process.env.NEBIUS_API_KEY && process.env.NEBIUS_API_KEY.trim().length > 0);
}

function deriveTopicKey(question: string): string {
  const cleaned = question.toLowerCase().replace(/[^a-z0-9\s]/g, "");
  const words = cleaned.split(/\s+/).filter((w) => w.length > 3);
  return words.slice(0, 3).join("-") || "general-inquiry";
}
