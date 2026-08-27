


import { google } from "googleapis";

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }

  return value;
}

export function getGmailClient() {
  const clientEmail = getRequiredEnv(
    "GOOGLE_SERVICE_ACCOUNT_EMAIL"
  );

  const privateKey = getRequiredEnv(
    "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY"
  ).replace(/\\n/g, "\n");

  const impersonatedUser =
    process.env.GOOGLE_IMPERSONATED_USER ||
    "desk@alicantissima.es";

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: [
      "https://www.googleapis.com/auth/gmail.readonly",
    ],
    subject: impersonatedUser,
  });

  return google.gmail({
    version: "v1",
    auth,
  });
}

export function getGmailUserId() {
  return "me";
}