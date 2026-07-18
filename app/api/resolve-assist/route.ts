import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { claimText, deadline, evidence, fetchedMarkdown, fetchedJson } = await request.json();

    const combinedText = `
      ${evidence || ""}
      ${fetchedMarkdown || ""}
      ${fetchedJson ? JSON.stringify(fetchedJson) : ""}
    `.toLowerCase();

    if (!combinedText.trim()) {
      return NextResponse.json({ suggestedVerdict: null, justification: null });
    }

    const onGodKeywords = ["arrived", "confirmed", "happened", "yes", "true", "showed up", "won"];
    const capKeywords = ["no-show", "denied", "fake", "false", "cap", "didn't", "missed", "lost"];

    let onGodScore = 0;
    let capScore = 0;

    onGodKeywords.forEach(kw => { if (combinedText.includes(kw)) onGodScore++; });
    capKeywords.forEach(kw => { if (combinedText.includes(kw)) capScore++; });

    let suggestedVerdict: "on_god" | "cap" | null = null;
    let justification = "Based on the evidence provided.";

    if (onGodScore > capScore) {
      suggestedVerdict = "on_god";
      justification = "The evidence leans towards the claim being true (On God).";
    } else if (capScore > onGodScore) {
      suggestedVerdict = "cap";
      justification = "The evidence leans towards the claim being false (Cap).";
    } else if (onGodScore > 0 && onGodScore === capScore) {
      justification = "The evidence is mixed, it's a toss up.";
    } else {
       return NextResponse.json({ suggestedVerdict: null, justification: null });
    }

    return NextResponse.json({ suggestedVerdict, justification });
  } catch (e: unknown) {
    console.debug("[Resolve Assist] Failed", e);
    return NextResponse.json({ suggestedVerdict: null, justification: null });
  }
}
