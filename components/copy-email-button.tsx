


"use client";

import { useState } from "react";

export default function CopyEmailButton({
  email,
}: {
  email: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="text-left text-blue-700 hover:underline"
      title="Copy email"
    >
      {copied ? "Copied ✓" : email}
    </button>
  );
}