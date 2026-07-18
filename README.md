# OnGod

OnGod is a prediction market and "callout" application that lets you challenge your friends, make claims, and bet on outcomes using the Bento network. When someone makes a bold claim, you can call it out, set a deadline, and use real-world evidence (links, tweets, etc.) to settle the bet.

## Features

- **Callouts (Duels):** Create prediction markets (duels) on the Bento testnet. Users can bet "Yes" or "No" on a specific claim.
- **Bento Network Integration:** Fully integrated with the `@bento.fun/sdk` for market creation, EOA (Externally Owned Account) authentication via burner wallets, and live odds tracking.
- **Anakin AI Evidence Scraper:** Users can submit URLs as evidence to resolve a callout. OnGod uses Anakin AI's URL scraper to fetch markdown and JSON data from the link to help verify the outcome automatically.
- **Next.js App Router:** Built on the robust Next.js App Router with server-side proxying for secure API key management.

## Integrations

### Bento 🍱
Bento powers the core prediction market engine of OnGod. 
- **Authentication:** OnGod creates a burner wallet for users (stored in `localStorage`) and authenticates them seamlessly via EOA login without requiring a separate crypto wallet extension.
- **Market Creation:** When a user creates a callout, the app uses `sdk.user.createDuel()` to deploy a private prediction market on the Bento testnet.
- **Live Sync:** Callout details and market odds are synchronized in real-time.

### Anakin AI 🤖
Anakin AI is used for processing evidence submitted by users.
- **URL Scraping:** When a user pastes a URL to prove their claim, the Next.js backend securely calls the `https://api.anakin.io/v1/url-scraper` endpoint.
- **Verification:** Anakin AI converts the webpage content into clean Markdown and structured JSON, which OnGod uses to settle the dispute.

## Local Setup

### 1. Clone & Install
Ensure you have Node.js installed, then install dependencies:
```bash
npm install
```

### 2. Environment Variables
Create a `.env.local` file in the root of the project by copying `.env.example`:
```bash
cp .env.example .env.local
```

Fill in your required keys:
- `NEXT_PUBLIC_BENTO_BUILDER_KEY`: Your Builder API Key from the Bento Developer Dashboard (https://app.bento.fun -> Settings -> Developer).
- `ANAKIN_API_KEY`: Your Anakin AI API key for the URL scraper feature (Optional, but required for evidence fetching).

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment (Vercel)

OnGod is optimized for deployment on Vercel.

1. Push your code to GitHub and import the project into Vercel.
2. In your Vercel Project Settings, navigate to **Environment Variables**.
3. Add the following keys:
   - `NEXT_PUBLIC_BENTO_BUILDER_KEY`
   - `ANAKIN_API_KEY` (if using)
4. Deploy!

> **Note on Bento Testnet:** If the Bento testnet is experiencing heavy load or outages, the app will gracefully fallback to a **Demo Mode**, allowing users to experience the UI without executing on-chain transactions.

## Architecture

- `app/` - Next.js App Router pages and API routes.
- `app/api/markets/[...path]/route.ts` - Secure proxy for Bento API requests to hide the Builder API Key from the client.
- `components/` - React components including callout cards and UI elements.
- `lib/bento.ts` - Bento SDK initialization and configuration.
- `lib/auth.ts` - EOA authentication logic using `viem` and burner wallets.
- `lib/store.ts` - Zustand global state management.
