import { GoogleGenAI, Type } from "@google/genai";
import { DailyReport } from "../types";

// Initialize Gemini Client
// NOTE: API Key must be set in environment variables in a real scenario.
// For this demo, we assume process.env.API_KEY is available.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Extracts keywords and checks report quality for a single user report.
 */
export const analyzeSingleReport = async (
  todayWork: string,
  problems: string,
  tomorrowPlan: string
): Promise<{ tags: string[]; feedback?: string }> => {
  const model = "gemini-2.5-flash";
  
  const prompt = `
    Analyze this daily report:
    TODAY: ${todayWork}
    PROBLEMS: ${problems}
    PLAN: ${tomorrowPlan}

    1. Extract 3-5 short technical or project-related tags/keywords.
    2. Check if the report is too vague (e.g., "Worked on stuff").
    
    Return JSON: { "tags": string[], "feedback": string | null }
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            feedback: { type: Type.STRING, nullable: true },
          },
        },
      },
    });

    const text = response.text;
    if (!text) return { tags: [], feedback: "Error parsing AI response" };
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Single Analysis Error:", error);
    return { tags: ["General"], feedback: null };
  }
};

/**
 * Generates the Team Summary based on the provided prompt structure.
 */
export const generateTeamSummary = async (
  reports: DailyReport[],
  date: string
): Promise<{
  summary: string;
  risks: string;
  recommendations: string;
  keywords: string[];
}> => {
  const model = "gemini-2.5-flash";

  // Format data for the prompt
  const reportsText = reports
    .map(
      (r) =>
        `[Member: ${r.userName || r.userId}]\n- Work: ${r.todayWork}\n- Issues: ${r.problems}\n- Plan: ${r.tomorrowPlan}`
    )
    .join("\n\n");

  const prompt = `
    You are an expert operations manager. I will give you all team members’ daily reports for ${date}.
    
    REPORTS DATA:
    ${reportsText}

    Please generate a structured daily summary including:
    1. 【Team Summary】
    2. 【Key Risks】
    3. 【Recommendations】
    4. 【Keywords Cloud】 (5–10 items, comma separated)

    Make the writing concise, professional, and suitable for internal reporting.
    Return the result as a JSON object with these exact keys: "summary", "risks", "recommendations", "keywords".
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            risks: { type: Type.STRING },
            recommendations: { type: Type.STRING },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Team Summary Error:", error);
    return {
      summary: "Failed to generate summary.",
      risks: "Unknown.",
      recommendations: "Check API logs.",
      keywords: [],
    };
  }
};
