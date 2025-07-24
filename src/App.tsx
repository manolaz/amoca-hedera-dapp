import './App.css'
import { useState, useEffect } from 'react'
import { hederaTestnet } from '@reown/appkit/networks'
import { createAppKit, useDisconnect } from '@reown/appkit/react'
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

// Create modal
createAppKit({
  adapters: [nativeHederaAdapter, eip155HederaAdapter],
  universalProvider,
  defaultNetwork: hederaTestnet,
  projectId,
  metadata,
  networks,
  themeMode: 'light' as const,
  enableReconnect: true,
  features: {
    analytics: true,
    socials: false,
    swaps: false,
    onramp: false,
    email: false,
  },
})

export interface FunctionResult {
  functionName: string;
  result: string;
}

export function App() {
  const { disconnect } = useDisconnect()
  const [transactionHash, setTransactionHash] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [signedMsg, setSignedMsg] = useState('')
  const [nodes, setNodes] = useState<string[]>([])
  const [lastFunctionResult, setLastFunctionResult] = useState<FunctionResult | null>(null)

  useEffect(() => {
    const handleDisconnect = () => {
      if (universalProvider.session?.namespaces?.eip155) {
        disconnect().catch((err) => console.error('Failed to auto disconnect:', err))
      }
    }

    universalProvider.on('session_delete', handleDisconnect)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(universalProvider as any).core?.pairing.events?.on('pairing_delete', handleDisconnect as any)

    return () => {
      universalProvider.off('session_delete', handleDisconnect)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(universalProvider as any).core?.pairing.events?.off('pairing_delete', handleDisconnect as any)
    }
  }, [disconnect])

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
        sendNodeAddresses={setNodes}
        setLastFunctionResult={setLastFunctionResult}
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
        nodes={nodes}
        lastFunctionResult={lastFunctionResult}
      />
    </div>
  )
}

export default App