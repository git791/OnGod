const { createBentoSdk } = require("@bento.fun/sdk");

async function main() {
  const sdk = createBentoSdk({
    baseUrl: "http://localhost:9999",
    apiKey: "dummy",
    fetch: async () => {
      return new Response(
        JSON.stringify({ error: "Bento Builder API key is not configured on the server." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  });

  try {
    await sdk.public.externalLink.getLinkUrl({
      returnUrl: "http://localhost:3000/connect",
      state: "123",
    });
  } catch (err) {
    console.error("SDK threw:", err.message);
  }
}

main().catch(console.error);
