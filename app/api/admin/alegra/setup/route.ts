


import { NextRequest, NextResponse } from "next/server";
import { alegraRequest } from "@/lib/alegra/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const expectedSecret =
    process.env.ALEGRA_SETUP_SECRET?.trim();

  const receivedSecret =
    request.nextUrl.searchParams.get("secret")?.trim();

  if (!expectedSecret || receivedSecret !== expectedSecret) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized.",
      },
      { status: 401 }
    );
  }

  async function testEndpoint(
    name: string,
    path: string
  ) {
    try {
      const data = await alegraRequest<unknown>(path);

      return {
        name,
        path,
        ok: true,
        data,
      };
    } catch (error) {
      return {
        name,
        path,
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown Alegra API error.",
      };
    }
  }

  const results = [];

  results.push(
    await testEndpoint(
      "items",
      "/items?limit=30"
    )
  );

  results.push(
    await testEndpoint(
      "taxes",
      "/taxes?limit=30"
    )
  );

  results.push(
    await testEndpoint(
      "numberTemplates",
      "/number-templates?limit=30"
    )
  );

  results.push(
    await testEndpoint(
      "bankAccounts",
      "/bank-accounts?limit=30"
    )
  );

  results.push(
  await testEndpoint(
    "contacts",
    "/contacts?limit=5"
  )
);

results.push(
  await testEndpoint(
    "creditNoteNumberTemplates",
    "/number-templates?documentType=creditNote&limit=30"
  )
);

return NextResponse.json({
  ok: true,
  results,
});
}