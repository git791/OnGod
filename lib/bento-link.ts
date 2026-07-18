import { bentoPublic } from "./bento";

const CONNECT_STATE_KEY = "ongod-bento-connect-state";

export async function startBentoConnect(nextPath: string): Promise<void> {
  const state = crypto.randomUUID();
  sessionStorage.setItem(CONNECT_STATE_KEY, state);

  const returnUrl = new URL("/connect", window.location.origin);
  returnUrl.searchParams.set("next", nextPath);

  const { url } = await bentoPublic.public.externalLink.getLinkUrl({
    returnUrl: returnUrl.toString(),
    state,
  });

  window.location.assign(url);
}

export function consumeBentoConnectState(state: string | null): boolean {
  const expectedState = sessionStorage.getItem(CONNECT_STATE_KEY);
  sessionStorage.removeItem(CONNECT_STATE_KEY);
  return Boolean(state && expectedState && state === expectedState);
}
