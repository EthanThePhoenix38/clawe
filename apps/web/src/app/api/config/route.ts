import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readConfig, writeConfig } from "@/lib/config/server";
import type { ConfigResponse } from "@/lib/config/types";

const configSchema = z.object({
  convexUrl: z.string().superRefine((val, ctx) => {
    try {
      const url = new URL(val);
      if (!url.hostname.endsWith(".convex.cloud")) {
        ctx.addIssue({
          code: "custom",
          message: "Must be a .convex.cloud URL",
        });
      }
    } catch {
      ctx.addIssue({
        code: "custom",
        message: "Must be a valid URL",
      });
    }
  }),
});

/**
 * GET /api/config
 * Returns the current Clawe configuration.
 */
export async function GET(): Promise<NextResponse<ConfigResponse>> {
  const config = await readConfig();

  if (!config?.convexUrl) {
    return NextResponse.json({ configured: false });
  }

  return NextResponse.json({
    configured: true,
    config,
  });
}

/**
 * POST /api/config
 * Updates the Clawe configuration.
 */
export async function POST(
  request: NextRequest,
): Promise<NextResponse<{ ok: true } | { ok: false; error: string }>> {
  try {
    const body = await request.json();
    const parsed = configSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { ok: false, error: firstError?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const existingConfig = (await readConfig()) ?? {};
    await writeConfig({
      ...existingConfig,
      ...parsed.data,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to save configuration" },
      { status: 500 },
    );
  }
}
