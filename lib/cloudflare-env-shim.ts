/**
 * Next/Vercel build shim. The live Sites worker supplies real D1/R2 bindings
 * through `cloudflare:workers`; a plain Node deployment receives no bindings.
 * Public pages still render from their safe defaults, while data APIs return a
 * clear 503 until equivalent persistent storage is connected.
 */
export const env = {} as Cloudflare.Env;
