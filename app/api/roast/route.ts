import { NextResponse } from "next/server";

const ON_GOD_ROASTS = [
  "They hated, but you waited.",
  "Never doubt the prophet.",
  "The squad is in shambles.",
  "Absolute cinema.",
  "Bro read the script.",
  "Too easy for you.",
];

const CAP_ROASTS = [
  "Not even close buddy.",
  "Caught in 4K.",
  "Delusion is a disease.",
  "Bro was praying for a miracle.",
  "Better luck next time.",
  "The cap is astronomical.",
];

export async function POST(request: Request) {
  try {
    const { verdict } = await request.json();
    
    let line = "CALLED IT";
    if (verdict === "on_god") {
      line = ON_GOD_ROASTS[Math.floor(Math.random() * ON_GOD_ROASTS.length)];
    } else if (verdict === "cap") {
      line = CAP_ROASTS[Math.floor(Math.random() * CAP_ROASTS.length)];
    }

    return NextResponse.json({ line });
  } catch (e: unknown) {
    console.debug("[Local Roast] Failed", e);
    return NextResponse.json({ line: null });
  }
}
