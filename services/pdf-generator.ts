import puppeteer from "puppeteer";
import { v2 as cloudinary } from "cloudinary";

function addPageBreaks(html: string): string {
  if (html.includes("page-break-before:")) return html;
  return html.replace(
    /<\/div>\s*(?=<div style="width:210mm)/g,
    '</div><div style="page-break-before: always; height: 0;"></div>',
  );
}

export async function generatePDFFromHTML(html: string, name: string): Promise<{
  url: string;
  downloadUrl: string;
  size: number;
}> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  const brokenHtml = addPageBreaks(html);

  const fullHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          html, body {
            margin: 0;
            padding: 0;
            width: 210mm;
            background: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page {
            size: A4;
            margin: 0;
          }
        </style>
      </head>
      <body>${brokenHtml}</body>
    </html>
  `;

  await page.setContent(fullHtml, {
    waitUntil: "networkidle0",
  });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  await browser.close();

  const uploadResult: any = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "Jobfaster",
        resource_type: "auto",
        public_id: `${Date.now()}-${name.replace(/[^a-zA-Z0-9]/g, "_")}`,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(pdfBuffer);
  });

  const downloadUrl = uploadResult.secure_url.replace(
    "/upload/",
    "/upload/fl_attachment/"
  );

  return {
    url: uploadResult.secure_url,
    downloadUrl,
    size: pdfBuffer.length,
  };
}