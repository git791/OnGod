import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    const apiKey = process.env.ANAKIN_IO_API_KEY || process.env.ANAKIN_API_KEY;

    if (!apiKey || !url) {
      return NextResponse.json({ markdown: null, generatedJson: null });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const res = await fetch("https://api.anakin.io/v1/url-scraper", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({ url, generateJson: true }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json({ markdown: null, generatedJson: null });
    }

    const data = await res.json();
    return NextResponse.json({
      markdown: data.markdown || null,
      generatedJson: data.generatedJson || null,
    });
  } catch (e: unknown) {
    console.debug("[Evidence Fetch] Failed or timed out", e);
    return NextResponse.json({ markdown: null, generatedJson: null });
  }
}
