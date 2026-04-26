import puppeteer from "puppeteer";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

  const fullHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=794">
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          tailwind.config = {
            theme: {
              extend: {
                fontFamily: {
                  'satoshi': ['Inter', 'sans-serif'],
                  'IBM': ['Inter', 'sans-serif'],
                },
              },
            },
          }
        </script>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @page { size: A4; margin: 0; }
          body { font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        </style>
      </head>
      <body>${html}</body>
    </html>
  `;

  await page.setContent(fullHtml, {
    waitUntil: "networkidle0",
  });

  await page.waitForSelector("[style*='padding']", { timeout: 5000 }).catch(() => {});

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