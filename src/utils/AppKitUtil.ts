import { createAppKit } from '@reown/appkit/react'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { hedera, hederaTestnet } from '@reown/appkit/networks'


export async function initAppKit() {

  const projectId = import.meta.env.VITE_REOWN_PROJECT_ID

  const metadata = {
    name: "Hedera EIP155 & HIP820 Example",
    description: "Hedera EIP155 & HIP820 Example",
    url: "https://github.com/hashgraph/hedera-wallet-connect/",
    icons: ["https://avatars.githubusercontent.com/u/31002956"],
  }

  // 4. Create a AppKit instance
  createAppKit({
    adapters: [new EthersAdapter()],
    networks: [
      hederaTestnet,
      // hedera
    ],
    metadata,
    projectId,
    features: {
      analytics: true // Optional - defaults to your Cloud configuration
    }
  })
}
