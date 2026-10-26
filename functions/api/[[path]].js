export async function onRequest({ request, env }) {
  if (!env.API_ORIGIN) {
    return new Response('Server misconfiguration: API_ORIGIN is not set.', { status: 500 });
  }

  let apiOrigin;
  try {
    apiOrigin = new URL(env.API_ORIGIN);
  } catch {
    return new Response('Server misconfiguration: API_ORIGIN must be a valid HTTPS origin.', {
      status: 500
    });
  }

  if (apiOrigin.protocol !== 'https:' || apiOrigin.pathname !== '/' ||
    apiOrigin.search || apiOrigin.hash || apiOrigin.username || apiOrigin.password) {
    return new Response('Server misconfiguration: API_ORIGIN must be a valid HTTPS origin.', {
      status: 500
    });
  }

  const incomingUrl = new URL(request.url);
  const targetUrl = new URL(`${incomingUrl.pathname}${incomingUrl.search}`, apiOrigin.origin);
  return fetch(new Request(targetUrl, request));
}
