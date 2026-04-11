


import { convert } from "html-to-text";

type GmailPart = {
  mimeType?: string;
  body?: {
    data?: string;
  };
  parts?: GmailPart[];
};

function decodeBase64Url(input?: string) {
  if (!input) return "";
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf8");
}

function collectPartsByMimeType(part: GmailPart | undefined, mimeType: string): string[] {
  if (!part) return [];

  const out: string[] = [];

  if (part.mimeType === mimeType && part.body?.data) {
    out.push(decodeBase64Url(part.body.data));
  }

  if (part.parts?.length) {
    for (const child of part.parts) {
      out.push(...collectPartsByMimeType(child, mimeType));
    }
  }

  return out;
}

function cleanText(input: string) {
  return input
    .replace(/\r/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function htmlToReadableText(html: string) {
  return convert(html, {
    wordwrap: false,
    selectors: [
      { selector: "a", options: { hideLinkHrefIfSameAsText: false } },
      { selector: "img", format: "skip" },
    ],
  });
}

export function extractMessageText(message: any) {
  const payload = message?.payload;
  if (!payload) return "";

  const plainParts = collectPartsByMimeType(payload, "text/plain")
    .filter(Boolean)
    .map(cleanText);

  const combinedPlain = plainParts.join("\n").trim();

  if (combinedPlain && !combinedPlain.includes("</")) {
    return combinedPlain;
  }

  const htmlParts = collectPartsByMimeType(payload, "text/html").filter(Boolean);

  if (htmlParts.length > 0) {
    const combinedHtml = htmlParts.join("\n");
    const converted = htmlToReadableText(combinedHtml);
    return cleanText(converted);
  }

  if (payload.body?.data) {
    const decoded = decodeBase64Url(payload.body.data);

    if (decoded.includes("<html") || decoded.includes("<table") || decoded.includes("</td>")) {
      return cleanText(htmlToReadableText(decoded));
    }

    return cleanText(decoded);
  }

  return "";
}