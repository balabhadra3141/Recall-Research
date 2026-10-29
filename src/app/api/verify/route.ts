import { NextResponse } from "next/server";
import { nebiusService } from "@/lib/services/nebius";
import { tavilyService } from "@/lib/services/tavily";

export async function GET() {
  const [nebiusStatus, tavilyStatus] = await Promise.all([
    nebiusService.verifyCredentials(),
    tavilyService.verifyCredentials(),
  ]);

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    nebius: {
      configured: nebiusService.isConfigured(),
      valid: nebiusStatus.valid,
      message: nebiusStatus.message,
      superModel: nebiusService.defaultSuperModel,
      nanoModel: nebiusService.defaultNanoModel,
      availableModels: nebiusStatus.availableModels || [],
    },
    tavily: {
      configured: tavilyService.isConfigured(),
      valid: tavilyStatus.valid,
      message: tavilyStatus.message,
    },
    readyForResearch: nebiusStatus.valid && tavilyStatus.valid,
  });
}
