import './App.css'
import { useState } from 'react'
import { hederaTestnet } from '@reown/appkit/networks'
import { createAppKit } from '@reown/appkit/react'
import { ActionButtonList } from './components/ActionButtonList'
import { InfoList } from './components/InfoList'
import {
  projectId,
  metadata,
  networks,
  nativeHederaAdapter,
  eip155HederaAdapter,
  universalProvider,
} from './config'
// create an adapter

// Create modal
createAppKit({
  adapters: [nativeHederaAdapter, eip155HederaAdapter],
  // adapters: [new EthersAdapter()],
  //@ts-expect-error expected type error
  universalProvider,
  // defaultNetwork: HederaChainDefinition.EVM.Testnet,
  defaultNetwork: hederaTestnet,
  projectId,
  metadata,
  // networks: [hederaTestnet],
  networks,
  themeMode: 'light' as const,
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
    socials: false,
    swaps: false,
    onramp: false,
    email: false,
  },
})

export function App() {
  const [transactionHash, setTransactionHash] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [signedMsg, setSignedMsg] = useState('')
  const [balance, setBalance] = useState('')
  const [nodes, setNodes] = useState<string[]>([])

  return (
    <div className="pages">
      <div className="logos">
        <img src="/reown.svg" alt="Reown" style={{ width: '150px', height: '150px' }} />
        <img src="/hedera.svg" alt="Hedera" style={{ width: '90px', height: '90px' }} />
      </div>

      <h1>Hedera App Example using Reown AppKit and Hedera</h1>

      <ActionButtonList
        sendHash={setTransactionHash}
        ethTxHash={transactionHash}
        sendTxId={setTransactionId}
        sendSignMsg={setSignedMsg}
        sendBalance={setBalance}
        sendNodeAddresses={setNodes}
      />
      <div className="advice">
        <p>
          Go to{' '}
          <a
            href="https://cloud.reown.com"
            target="_blank"
            className="link-button"
            rel="Reown Cloud"
          >
            Reown Cloud
          </a>{' '}
          to get projectId.
        </p>
      </div>
      <InfoList
        hash={transactionHash}
        txId={transactionId}
        signedMsg={signedMsg}
        balance={balance}
        nodes={nodes}
      />
    </div>
  )
}

export default App
