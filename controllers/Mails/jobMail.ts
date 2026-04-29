import { NextFunction, Request, Response } from "express";
import { resend } from "../../services/email";
import { sendError } from "../../utils/sendError";
import { sendSuccess } from "../../utils/sendSuccess";

const formatEmailHtml = (
  greeting: string,
  body: string,
  callToAction: string,
  attachmentNote: string,
  signOff: string,
  userName: string,
) => {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; line-height: 1.6;">
      <p style="margin-bottom: 16px; font-size: 16px;">${greeting}</p>
      
      <p style="margin-bottom: 16px; font-size: 16px;">${body}</p>
      
      <p style="margin-bottom: 16px; font-size: 16px;">${callToAction}</p>
      
      <p style="margin-bottom: 24px; font-size: 14px; color: #666; font-style: italic;">${attachmentNote}</p>
      
      <div style="margin-top: 24px;">
        <p style="margin-bottom: 8px; font-size: 16px;">${signOff}</p>
        <p style="font-size: 16px; font-weight: 600; margin: 0;">${userName}</p>
      </div>
    </div>
  `;
};

interface MailOptions {
  to: string;
  userName: string;
  userEmail: string;
  subject: string;
  greeting: string;
  body: string;
  callToAction: string;
  attachmentNote?: string;
  signOff: string;
  pdfUrl?: string;
}

interface MailResponse {
  status: "failed" | "success";
  message: "JOB_MAIL_ERROR" | "JOB_MAIL_SUCCESS";
  data?: any;
  statusCode: number;
}

export async function sendJobMail(input: MailOptions): Promise<MailResponse> {
  try {
    const {
      to,
      userName,
      userEmail,
      subject,
      greeting,
      body,
      callToAction,
      attachmentNote,
      signOff,
      pdfUrl,
    } = input;

    const html = formatEmailHtml(
      greeting || "",
      body || "",
      callToAction || "",
      attachmentNote || "",
      signOff || "",
      userName || "",
    );

    const { data, error } = await resend.emails.send({
      from: `${userName} via JobFaster <applications@jobfaster.com>`,
      to: [to],
      subject: subject,
      replyTo: userEmail,
      html,
      attachments: pdfUrl
        ? [
            {
              filename: "resume.pdf",
              content: pdfUrl,
            },
          ]
        : undefined,
    });

    if (error) {
      console.log("email error", error);

      return {
        status: "failed",
        message: "JOB_MAIL_ERROR",
        data: error,
        statusCode: error.statusCode || 404,
      };
    }

    console.log(data);
    return {
      status: "success",
      message: "JOB_MAIL_SUCCESS",
      statusCode: 200,
      data: data,
    };
  } catch (error) {
    return {
      status: "failed",
      message: "JOB_MAIL_ERROR",
      data: error,
      statusCode: 500,
    };
  }
}
