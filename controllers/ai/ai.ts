import { GoogleGenAI } from "@google/genai";
import { generateTailoringPrompt } from "../../prompts/tailorResume";
import { applyJobPrompt } from "../../prompts/jobPrompt";

const ai = new GoogleGenAI({});

interface Response {
  response: string;
  statusCode: number;
  message: string;
}

export async function talktoAi(resumeData: string): Promise<Response> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: applyJobPrompt(resumeData),
    });

    if (!response.text) {
      return {
        response: "",
        statusCode: 404,
        message: "Resource not found",
      };
    }

    return {
      response: response.text,
      statusCode: 200,
      message: "Ai responded succesfully",
    };
  } catch (error: any) {
    console.error("Gemini API error:", error);
    return {
      response: "",
      statusCode: error.code,
      message: error.message,
    };
  }
}
