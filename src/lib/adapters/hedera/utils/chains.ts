import { CaipNetwork } from "@reown/appkit";
import { CaipNetworkId, ChainNamespace } from "@reown/appkit-common";
import { defineChain } from "@reown/appkit/networks";

export const hederaMainnetNative = defineChain({
  id: "mainnet",
  chainNamespace: "hedera" as ChainNamespace,
  caipNetworkId: "hedera:mainnet" as CaipNetworkId,
  name: "Hedera Mainnet",
  nativeCurrency: {
    symbol: "HBAR",
    name: "HBAR",
    decimals: 8,
  },
  rpcUrls: {
    default: {
      http: ["https://testnet.hashio.io/api"],
    },
  },
  blockExplorers: {
    default: {
      name: "Hashscan",
      url: "https://hashscan.io/mainnet",
    },
  },
  testnet: false,
});

export const hederaTestnetNative: CaipNetwork = {
  id: "testnet",
  chainNamespace: "hedera" as ChainNamespace,
  caipNetworkId: "hedera:testnet" as CaipNetworkId,
  name: "Hedera Testnet",
  nativeCurrency: {
    symbol: "HBAR",
    name: "HBAR",
    decimals: 8,
  },
  rpcUrls: {
    default: {
      http: ["https://testnet.hashio.io/api"],
    },
  },
  blockExplorers: {
    default: {
      name: "Hashscan",
      url: "https://hashscan.io/testnet",
    },
  },
  testnet: true,
};

export const hederaTestnetEvm: CaipNetwork = {
  id: 296,
  name: "Hedera Testnet Evm",
  chainNamespace: "eip155",
  caipNetworkId: "eip155:296",
  nativeCurrency: {
    symbol: "HBAR",
    name: "HBAR",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://testnet.hashio.io/api"],
    },
  },
  blockExplorers: {
    default: {
      name: "Hashscan",
      url: "https://hashscan.io/testnet",
    },
  },
  testnet: true,
};

export const hederaMainnetEvm: CaipNetwork = {
  id: 295,
  name: "Hedera Mainnet Evm",
  chainNamespace: "eip155",
  caipNetworkId: "eip155:295",
  nativeCurrency: {
    symbol: "HBAR",
    name: "HBAR",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://testnet.hashio.io/api"],
    },
  },
  blockExplorers: {
    default: {
      name: "Hashscan",
      url: "https://hashscan.io/testnet",
    },
  },
  testnet: false,
};
