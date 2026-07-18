# Anakin AI Setup for OnGod

OnGod uses **Anakin.ai** to power two optional intelligence features without touching the on-chain settlement logic:
1. **Resolver Assist**: Suggests an outcome (On God or Cap) based on the claim and evidence, giving the caller a second opinion before resolving the market.
2. **Roast Generator**: Generates a witty, customized 12-word roast for the final receipt stamp instead of the default text.

This feature is **100% optional**. If the API keys are missing or Anakin is down, OnGod fails open and falls back to manual resolution and default receipt stamps.

## 1. Create the Anakin Apps

Log into your Anakin.ai workspace and create **two Quick Apps** (not Chatbots).

### App 1: `ongod-resolver-assist`
- **Inputs**:
  - `claimText` (Text)
  - `deadline` (Text)
  - `evidence` (Text)
- **Prompt**:
  ```text
  You are an impartial judge for a friend-group prediction market. 
  Claim: {{claimText}}
  Deadline: {{deadline}}
  Evidence: {{evidence}}
  
  Decide if the claim happened ("on_god") or didn't happen ("cap").
  Return ONLY a valid JSON object matching this schema:
  {
    "suggestedVerdict": "on_god" | "cap",
    "justification": "A one-line reason (under 15 words)."
  }
  ```

### App 2: `ongod-roast`
- **Inputs**:
  - `claimText` (Text)
  - `openingOdds` (Text)
  - `closingOdds` (Text)
  - `verdict` (Text)
- **Prompt**:
  ```text
  You are roasting a prediction market outcome in Gen-Z slang.
  Claim: {{claimText}}
  Odds shifted from {{openingOdds}}% Yes to {{closingOdds}}% Yes.
  Final result: {{verdict}} ("on_god" means it happened, "cap" means it didn't).
  
  Write a savage or celebratory 1-line roast (MAX 12 words) to stamp on the receipt. No finance jargon.
  Return ONLY a valid JSON object matching this schema:
  {
    "line": "Your 12-word roast here"
  }
  ```

## 2. Get the API Key and App IDs

1. In Anakin, navigate to the **Integration** tab for each of your Quick Apps.
2. Copy the **App ID** from the Integration URL or snippet for both apps.
3. Generate an **API Key** from your Anakin workspace settings.

## 3. Configure Environment Variables

Add these to your `.env.local` (or Vercel deployment variables). Do NOT commit real values to version control.

```env
ANAKIN_API_KEY=your_anakin_api_key_here
ANAKIN_APP_ID_RESOLVER=your_resolver_app_id
ANAKIN_APP_ID_ROAST=your_roast_app_id
```

Restart your Next.js dev server, and the UI will automatically light up with Anakin's intelligence layer!
