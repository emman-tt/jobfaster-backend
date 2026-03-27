import { GoogleGenAI } from "@google/genai";
import { generateTailoringPrompt } from "../../prompts/tailorResume";

const ai = new GoogleGenAI({});

export async function talktoAi(resumeData: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: generateTailoringPrompt(resumeData),
    });

    // Check if response has text
    if (response?.text) {
      return response.text;
    }

    // Check if response has candidates
    if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return response.candidates[0].content.parts[0].text;
    }

    console.error(
      "Gemini response structure:",
      JSON.stringify(response, null, 2),
    );
    return "No response was generated";
  } catch (error) {
    console.error("Gemini API error:", error);
    throw error; // Let BullMQ handle retry
  }
}
