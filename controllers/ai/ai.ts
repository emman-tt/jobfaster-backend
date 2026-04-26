import { GoogleGenAI } from "@google/genai";
import { applyJobPromptUpload } from "../../prompts/jobPrompt";
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

async function callAi(prompt: string): Promise<Response> {
  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 4000,
    });

    return {
      statusCode: 200,
      response: response.choices[0].message.content || "",
      message: "AI responded successfully",
    };
  } catch (error) {
    console.log(error);
    return {
      statusCode: 500,
      response: "",
      message: error.message,
    };
  }
}

interface ApplyJobData {
  resumeText: string;
  jobDescription: string;
  tone: string;
  includeCoverLetter: boolean;
  hiringManager?: string;
}

export async function jobApply(data: ApplyJobData): Promise<Response> {
  const promt = applyJobPromptUpload(data);
  return await callAi(promt);
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
