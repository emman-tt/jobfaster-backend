import { GoogleGenAI } from "@google/genai";
import { generateResumeAnalysisPrompt } from "../../prompts/tailor-level2";
import { aiQueue } from "../../models/worker";
import { generateTailoringPrompt } from "../../prompts/tailorResume";

const ai = new GoogleGenAI({});

export async function talktoAi(resumeData: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: generateTailoringPrompt(resumeData),
  });

  if (!response.text) {
    return "No response was generated";
  }

  return response.text;
}
