async function main() {
  const url = "https://internal-server.bento.fun/bento/auto-mint/mint";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "x-builder-api-key": "bnt_live_3bb11fd4_0fce953f5b872fba7f60ed75",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ userAddress: "0x3938493849384938493849384938493849384938" }),
      signal: controller.signal
    });
    clearTimeout(timeout);
    console.log(res.status, res.statusText);
    const text = await res.text();
    console.log(text);
  } catch (err) {
    console.error(err.message);
  }
}

main().catch(console.error);
