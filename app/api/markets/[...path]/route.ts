import { NextRequest } from "next/server";

// Tell Vercel to allow up to 60 seconds for this route.
// Default is 10s which causes Bento on-chain transactions to time out.
export const maxDuration = 60;


const BENTO_BASE_URL = process.env.NEXT_PUBLIC_BENTO_BASE_URL ?? "https://internal-server.bento.fun";
const BUILDER_KEY = process.env.BENTO_BUILDER_API_KEY ?? process.env.NEXT_PUBLIC_BENTO_BUILDER_KEY;

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  if (!BUILDER_KEY) {
    return Response.json({ error: "Bento Builder API key is not configured on the server." }, { status: 500 });
  }

  const { path } = await context.params;
  const incomingUrl = new URL(request.url);
  const upstreamUrl = new URL(`${BENTO_BASE_URL}/${path.join("/")}`);
  upstreamUrl.search = incomingUrl.search;

  const headers = new Headers();
  if (request.headers.has("content-type")) {
    headers.set("content-type", request.headers.get("content-type")!);
  }
  if (request.headers.has("authorization")) {
    headers.set("authorization", request.headers.get("authorization")!);
  }
  headers.set("x-builder-api-key", BUILDER_KEY);

  const method = request.method;
  const body = method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();
  const upstream = await fetch(upstreamUrl, {
    method,
    headers,
    body,
    redirect: "manual",
  });

  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");
  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
