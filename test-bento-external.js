async function main() {
  const url = "https://internal-server.bento.fun/bento/user/external-link/token";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "x-builder-api-key": "bnt_live_3bb11fd4_0fce953f5b872fba7f60ed75",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ returnUrl: "http://127.0.0.1:3000/connect", state: "123" })
    });

    console.log(res.status, res.statusText);
    const text = await res.text();
    console.log(text);
  } catch (err) {
    console.error(err);
  }
}

main().catch(console.error);
