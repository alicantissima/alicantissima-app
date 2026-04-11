


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

function collectText(part?: GmailPart): string[] {
  if (!part) return [];

  const out: string[] = [];

  if (part.mimeType === "text/plain" && part.body?.data) {
    out.push(decodeBase64Url(part.body.data));
  }

  if (part.parts?.length) {
    for (const child of part.parts) {
      out.push(...collectText(child));
    }
  }

  return out;
}

export function extractMessageText(message: any) {
  const payload = message?.payload;
  if (!payload) return "";

  const plainParts = collectText(payload).filter(Boolean);
  if (plainParts.length > 0) {
    return plainParts.join("\n");
  }

  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  return "";
}