import { GoogleGenAI } from "@google/genai";
import { generateResumeAnalysisPrompt } from "../../prompts/tailor-level2";

const ai = new GoogleGenAI({});

export async function talktoAi(resumeText: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: generateResumeAnalysisPrompt(resumeText),
  });

  if (!response.text) {
    return "No response was generated";
  }

  return response.text;
}
