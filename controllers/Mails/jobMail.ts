import { NextFunction, Request, Response } from "express";
import { resend } from "../../services/email";
import { sendError } from "../../utils/sendError";
import { sendSuccess } from "../../utils/sendSuccess";
export async function sendJobMail(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      to,
      userName,
      userEmail,
      subject,
      body,
      // pdfBuffer, // <-- The PDF buffer you generated with Puppeteer
      pdfUrl,
    } = req.body;

    const { data, error } = await resend.emails.send({
      from: `${userName} via JobFaster <applications@jobfaster.com>`,
      to: [to],
      subject: subject,
      replyTo: userEmail,
      html: `<div>${body}</div>`,
      attachments: [
        {
          filename: "resume.pdf",
          content: pdfUrl,
        },
      ],
    });

    if (error) {
      console.log("email error", error);

      return sendError(
        res,
        "EMAIL_ERROR",
        error.statusCode as number,
        "failed",
      );
    }

    console.log(data);
    sendSuccess(res, 200, "success", "EMAIL_SUCCESS", data);
  } catch (error) {
    console.log("email error", error);
    next(error);
  }
}
