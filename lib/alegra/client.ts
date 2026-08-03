


const ALEGRA_API_URL = "https://api.alegra.com/api/v1";

function getAlegraAuthorization() {
  const user = process.env.ALEGRA_API_USER;
  const token = process.env.ALEGRA_API_TOKEN;

  if (!user || !token) {
    throw new Error(
      "Missing ALEGRA_API_USER or ALEGRA_API_TOKEN environment variable."
    );
  }

  return `Basic ${Buffer.from(`${user}:${token}`).toString("base64")}`;
}

export async function alegraRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${ALEGRA_API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: getAlegraAuthorization(),
      Accept: "application/json",
      "Content-Type": "application/json",
      ...options.headers,
    },
    cache: "no-store",
  });

  const rawText = await response.text();

  let data: unknown = null;

  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = rawText;
    }
  }

  if (!response.ok) {
    throw new Error(
      `Alegra API error ${response.status}: ${
        typeof data === "string" ? data : JSON.stringify(data)
      }`
    );
  }

  return data as T;
}