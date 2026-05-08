import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { classifyPrompt } from "@/lib/ai-classifier";
import { creditsForCreationType } from "@/lib/ai-credits";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const body = await req.json().catch(() => null) as { prompt?: string } | null;
  const prompt = body?.prompt?.trim() ?? "";
  if (!prompt) return NextResponse.json({ error: "Please enter a prompt." }, { status: 400 });

  const creationType = await classifyPrompt(prompt);
  const credits = creditsForCreationType(creationType);
  return NextResponse.json({ creationType, credits });
}
