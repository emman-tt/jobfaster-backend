import * as pdfjsLib from "pdfjs-dist";

interface FontStyle {
  family: string;
  size: number;
  isBold: boolean;
  isItalic: boolean;
  color: string | null;
}

interface TextStyle {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontId: string;
  style: FontStyle;
  page: number;
  lineIndex: number;
}

interface PageLayout {
  pageNumber: number;
  width: number;
  height: number;
  sections: LayoutSection[];
}

interface LayoutSection {
  y: number;
  items: TextStyle[];
}

interface ExtractionResult {
  rawText: string;
  fonts: Record<string, FontStyle>;
  pages: PageLayout[];
  metadata: {
    title: string | null;
    author: string | null;
    pageCount: number;
  };
}

async function getPageFonts(
  page: any,
  numPages: number,
): Promise<Record<string, FontStyle>> {
  const fonts: Record<string, FontStyle> = {};

  try {
    const commonObjs = page.commonObjs;
    const fontIds = commonObjs.keys();

    for (const fontId of fontIds) {
      const font = commonObjs.get(fontId);
      if (font && font.load) {
        const fontData = await font.load();
        fonts[fontId] = {
          family: fontData?.name || "Unknown",
          size: 12,
          isBold: false,
          isItalic: false,
          color: null,
        };
      }
    }
  } catch (error) {
    console.error("Error loading fonts:", error);
  }

  return fonts;
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(n * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export async function extractPdfTextAndPositions(
  pdfBuffer: Buffer,
): Promise<ExtractionResult> {
  try {
    const uint8Array = new Uint8Array(pdfBuffer);
    const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;

    const fonts: Record<string, FontStyle> = {};
    const pages: PageLayout[] = [];
    let rawText = "";

    const metadata = await pdf.getMetadata();
    const numPages = pdf.numPages;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.0 });

      const pageFonts = await getPageFonts(page, numPages);
      Object.assign(fonts, pageFonts);

      const textContent = await page.getTextContent();
      const items: TextStyle[] = [];

      textContent.items.forEach((item: any, index: number) => {
        if (item.str && item.str.trim()) {
          rawText += item.str + " ";

          const fontId = item.fontName || "F1";
          const font = fonts[fontId] || {
            family: "Unknown",
            size: item.height || 12,
            isBold: false,
            isItalic: false,
            color: null,
          };

          items.push({
            text: item.str,
            x: item.transform[4],
            y: item.transform[5],
            width: item.width,
            height: item.height,
            fontId,
            style: {
              family: font.family,
              size: Math.round(item.height * 10) / 10,
              isBold: font.isBold,
              isItalic: font.isItalic,
              color: font.color,
            },
            page: pageNum,
            lineIndex: index,
          });
        }
      });

      const sections = items.reduce((acc: LayoutSection[], item) => {
        const lastSection = acc[acc.length - 1];
        const yThreshold = 5;

        if (lastSection && Math.abs(lastSection.y - item.y) < yThreshold) {
          lastSection.items.push(item);
        } else {
          acc.push({ y: item.y, items: [item] });
        }
        return acc;
      }, []);

      pages.push({
        pageNumber: pageNum,
        width: viewport.width,
        height: viewport.height,
        sections,
      });
    }

    return {
      rawText: rawText.trim(),
      fonts,
      pages,
      metadata: {
        title: metadata?.info?.Title || null,
        author: metadata?.info?.Author || null,
        pageCount: numPages,
      },
    };
  } catch (error) {
    console.error("Error extracting PDF text:", error);
    throw error;
  }
}
