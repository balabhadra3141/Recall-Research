import { SourceRecord } from "@/lib/types";

interface TavilySearchResponse {
  query: string;
  answer?: string;
  results: Array<{
    title: string;
    url: string;
    content: string;
    score?: number;
    raw_content?: string;
    published_date?: string;
  }>;
}

export class TavilyService {
  private apiKey: string;
  private baseUrl = "https://api.tavily.com";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.TAVILY_API_KEY || "";
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  /**
   * Sanitizes text to neutralize potential prompt injections or formatting exploits
   */
  private sanitizeContent(text: string): string {
    if (!text) return "";
    return text
      .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, "")
      .replace(/SYSTEM:/gi, "SYS_REF:")
      .replace(/IGNORE PREVIOUS INSTRUCTIONS/gi, "[Filtered Directive]")
      .trim();
  }

  /**
   * Tests whether the provided or configured Tavily API key is valid
   */
  public async verifyCredentials(): Promise<{ valid: boolean; message: string }> {
    if (!this.isConfigured()) {
      return { valid: false, message: "TAVILY_API_KEY is not configured in the environment." };
    }

    try {
      const response = await fetch(`${this.baseUrl}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: this.apiKey,
          query: "ping",
          max_results: 1,
          search_depth: "basic",
        }),
      });

      if (response.status === 401 || response.status === 403) {
        return { valid: false, message: "Invalid Tavily API key (Unauthorized)." };
      }

      if (!response.ok) {
        const errorText = await response.text();
        return { valid: false, message: `Tavily API responded with status ${response.status}: ${errorText}` };
      }

      return { valid: true, message: "Tavily connection verified successfully." };
    } catch (err: any) {
      return { valid: false, message: `Failed to connect to Tavily: ${err?.message || String(err)}` };
    }
  }

  /**
   * Performs real web search using Tavily API and transforms results into grounded SourceRecords
   */
  public async search(
    query: string,
    options: { maxResults?: number; searchDepth?: "basic" | "advanced"; sessionId?: string } = {}
  ): Promise<{ sources: SourceRecord[]; rawAnswer?: string }> {
    if (!this.isConfigured()) {
      throw new Error(
        "Tavily search failed: TAVILY_API_KEY is not configured on the server. Please check your .env.local configuration."
      );
    }

    const { maxResults = 6, searchDepth = "advanced", sessionId = "" } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

    try {
      const response = await fetch(`${this.baseUrl}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: this.apiKey,
          query,
          search_depth: searchDepth,
          include_answer: true,
          include_raw_content: false,
          max_results: maxResults,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Tavily search API error (HTTP ${response.status}): ${errorText}`);
      }

      const data = (await response.json()) as TavilySearchResponse;

      if (!data.results || data.results.length === 0) {
        return { sources: [], rawAnswer: data.answer };
      }

      // Deduplicate by URL
      const seenUrls = new Set<string>();
      const sources: SourceRecord[] = [];
      const retrievedAt = new Date().toISOString();

      let index = 1;
      for (const item of data.results) {
        if (!item.url || seenUrls.has(item.url)) continue;
        seenUrls.add(item.url);

        const id = `S${index++}`;
        sources.push({
          id,
          url: item.url,
          title: this.sanitizeContent(item.title || "Untitled Source"),
          excerpt: this.sanitizeContent(item.content || ""),
          publishedAt: item.published_date,
          retrievedAt,
          provider: "tavily",
          relevanceScore: item.score,
          sessionIds: sessionId ? [sessionId] : [],
        });
      }

      return { sources, rawAnswer: data.answer };
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        throw new Error("Tavily search request timed out after 20 seconds.");
      }
      throw err;
    }
  }
}

export const tavilyService = new TavilyService();
