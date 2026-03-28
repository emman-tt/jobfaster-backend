import { GoogleGenAI } from "@google/genai";
import { generateTailoringPrompt } from "../../prompts/tailorResume";
import { applyJobPrompt } from "../../prompts/jobPrompt";

const ai = new GoogleGenAI({});

export async function talktoAi(resumeData: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: applyJobPrompt(resumeData),
    });

    if (response?.text) {
      console.log(response.text);
      return response.text;
    }

    console.error(
      "Gemini response structure:",
      JSON.stringify(response, null, 2),
    );
    return "No response was generated";
  } catch (error) {
    console.error("Gemini API error:", error);
    throw error;
  }
}

