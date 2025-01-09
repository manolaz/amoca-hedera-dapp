import { AppKitNetwork } from "@reown/appkit/networks";

import {
  UniversalHederaAdapter,
  hederaMainnetNative,
  hederaTestnetNative,
  hederaMainnetEvm,
  hederaTestnetEvm,
} from "../lib/adapters/hedera";

// Get projectId from https://cloud.reown.com
export const projectId = import.meta.env.VITE_REOWN_PROJECT_ID;

if (!projectId) {
  throw new Error("Project ID is not defined");
}

export const metadata = {
  name: "Hedera EIP155 & HIP820 Example",
  description: "Hedera EIP155 & HIP820 Example",
  url: "https://github.com/hashgraph/hedera-wallet-connect/",
  icons: ["https://avatars.githubusercontent.com/u/31002956"],
};

export const networks = [
  hederaMainnetEvm,
  hederaTestnetEvm,
  hederaMainnetNative,
  hederaTestnetNative,
] as [AppKitNetwork, ...AppKitNetwork[]];

export const universalHederaAdapter = new UniversalHederaAdapter({ projectId });
