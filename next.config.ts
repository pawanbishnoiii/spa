import type { NextConfig } from "next";
import path from "node:path";

const isSitesBuild = process.argv.some((argument) => argument.includes("vinext"));

const nextConfig: NextConfig = isSitesBuild
  ? {}
  : {
      turbopack: {
        resolveAlias: {
          "cloudflare:workers": "./lib/cloudflare-env-shim.ts",
        },
      },
      webpack(config) {
        config.resolve.alias["cloudflare:workers"] = path.resolve(
          process.cwd(),
          "lib/cloudflare-env-shim.ts",
        );
        return config;
      },
    };

export default nextConfig;
