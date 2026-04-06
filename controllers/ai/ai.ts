import { GoogleGenAI } from "@google/genai";
import { applyJobPrompt } from "../../prompts/jobPrompt";
import { uploadResumePrompt } from "../../prompts/extractPrompt";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});
const ai = new GoogleGenAI({});

interface Response {
  response: string;
  statusCode: number;
  message: string;
}

export async function talktoAi(
  resumeData: string,
  type: "JOB_APPLY" | "RESUME_UPLOAD",
): Promise<Response> {
  try {
    const prompt =
      type === "JOB_APPLY"
        ? applyJobPrompt(resumeData)
        : uploadResumePrompt(resumeData);

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const content = response.choices[0].message.content;
    console.log(content);
    return {
      statusCode: 200,
      response: content || "",
      message: "AI responded successfully",
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      response: "",
      message: error.message,
    };
  }
}

// export async function talktoAi(
//   resumeData: string,
//   type: "JOB_APPLY" | "RESUME_UPLOAD",
// ): Promise<Response> {
//   try {
//     const response = await ai.models.generateContent({
//       model: "gemma-3-27b",
//       contents:
//         type === "JOB_APPLY"
//           ? applyJobPrompt(resumeData)
//           : uploadResumePrompt(resumeData),
//     });

//     if (!response.text) {
//       return {
//         response: "",
//         statusCode: 404,
//         message: "Resource not found",
//       };
//     }

//     return {
//       response: response.text,
//       statusCode: 200,
//       message: "Ai responded succesfully",
//     };
//   } catch (error: any) {
//     console.error("Gemini API error:", error);
//     return {
//       response: "",
//       statusCode: error.code,
//       message: error.message,
//     };
//   }
// }
