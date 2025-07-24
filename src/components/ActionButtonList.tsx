import { useState } from 'react'
import { ChainNamespace } from '@reown/appkit-common'
import {
  useDisconnect,
  useAppKitAccount,
  useAppKitNetworkCore,
  useAppKitState,
  useAppKitProvider,
} from '@reown/appkit/react'
import { HederaProvider } from '@hashgraph/hedera-wallet-connect'
import { Modal } from './Modal'
import { getMethodConfig, FieldConfig } from '../utils/methodConfigs'
import { FunctionResult } from '../App'
import { useEthereumMethods } from '../hooks/useEthereumMethods'
import { useHederaMethods } from '../hooks/useHederaMethods'

interface ActionButtonListProps {
  sendHash: (hash: string) => void
  sendTxId: (id: string) => void
  sendSignMsg: (hash: string) => void
  sendNodeAddresses: (nodes: string[]) => void
  ethTxHash: string
  setLastFunctionResult: (result: FunctionResult | null) => void
}

export const ActionButtonList = ({
  sendHash,
  sendTxId,
  sendSignMsg,
  sendNodeAddresses,
  ethTxHash,
  setLastFunctionResult,
}: ActionButtonListProps) => {
  const { disconnect } = useDisconnect()
  const { chainId } = useAppKitNetworkCore()
  const { isConnected, address } = useAppKitAccount()
  const { activeChain } = useAppKitState()
  const { walletProvider } = useAppKitProvider(activeChain ?? ('hedera' as ChainNamespace))

  const { executeHederaMethod } = useHederaMethods(
    walletProvider as HederaProvider,
    address!,
    sendTxId,
    sendSignMsg,
    sendNodeAddresses,
  )

  const { executeEthMethod } = useEthereumMethods({
    walletProvider: walletProvider as HederaProvider,
    chainId,
    address: address!,
    ethTxHash,
    sendHash,
    sendSignMsg,
  })

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentMethod, setCurrentMethod] = useState('')
  const [modalFields, setModalFields] = useState<FieldConfig[]>([])
  const [modalTitle, setModalTitle] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleDisconnect = async () => {
    try {
      await disconnect()
    } catch (error) {
      console.error('Failed to disconnect:', error)
    }
  }

  const openModal = (methodName: string) => {
    const methodConfig = getMethodConfig(methodName)
    if (methodConfig) {
      setCurrentMethod(methodName)
      setModalFields(methodConfig.fields)
      setModalTitle(methodConfig.name)
      setIsModalOpen(true)
    } else {
      // Method doesn't need a modal, execute directly
      executeMethod(methodName, {})
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  const handleModalSubmit = (params: Record<string, string>) => {
    closeModal()
    executeMethod(currentMethod, params)
  }

  const executeMethod = async (methodName: string, params: Record<string, string>) => {
    setIsLoading(true)
    try {
      let result

      // Execute the method based on name
      if (methodName.startsWith('hedera_')) {
        result = await executeHederaMethod(methodName, params)
      } else {
        result = await executeEthMethod(methodName, params)
      }
      // Update last function result
      setLastFunctionResult({
        functionName: methodName,
        result: typeof result === 'object' ? JSON.stringify(result) : String(result || ''),
      })
    } catch (error) {
      console.error(`Error executing ${methodName}:`, error)
      setLastFunctionResult({
        functionName: methodName,
        result: `Error: ${(error as Error).message}`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Create buttons for supported methods
  const createMethodButton = (methodName: string) => (
    <button
      key={methodName}
      onClick={() => openModal(methodName)}
      disabled={!isConnected || isLoading}
      className="method-button"
    >
      {methodName}
    </button>
  )

  return (
    <div>
      <div className="appkit-buttons">
        <appkit-button />
        {isConnected && (
          <>
            <appkit-network-button />
            <button onClick={handleDisconnect}>Disconnect</button>
          </>
        )}
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleModalSubmit}
        title={modalTitle}
        fields={modalFields}
        isLoading={isLoading}
      />
      {isConnected ? (
        <>
          {activeChain === 'eip155' && (
            <>
              <div>
                <br />
                <strong>EIP-155 Methods (Wallet):</strong>
              </div>
              <div>
                {createMethodButton('eth_signMessage')}
                {createMethodButton('eth_signTransaction')}
                {createMethodButton('eth_sendTransaction')}
                {createMethodButton('eth_signTypedData')}
                {createMethodButton('eth_sendRawTransaction')}
              </div>
              <div>
                <br />
                <strong>EIP-155 Methods (JSON-RPC Relay):</strong>
              </div>
              <div>
                <div>
                  {createMethodButton('eth_getBalance')}
                  {createMethodButton('eth_blockNumber')}
                  {createMethodButton('eth_call')}
                  {createMethodButton('eth_feeHistory')}
                  {createMethodButton('eth_gasPrice')}
                  {createMethodButton('eth_getCode')}
                  {createMethodButton('eth_getBlockByHash')}
                  {createMethodButton('eth_getBlockByNumber')}
                  {createMethodButton('eth_getBlockTransactionCountByHash')}
                  {createMethodButton('eth_getBlockTransactionCountByNumber')}
                  {createMethodButton('eth_getFilterLogs')}
                  {createMethodButton('eth_getFilterChanges')}
                  {createMethodButton('eth_getLogs')}
                  {createMethodButton('eth_getStorageAt')}
                  {createMethodButton('eth_getTransactionByBlockHashAndIndex')}
                  {createMethodButton('eth_getTransactionByBlockNumberAndIndex')}
                  {createMethodButton('eth_getTransactionByHash')}
                  {createMethodButton('eth_getTransactionCount')}
                  {createMethodButton('eth_getTransactionReceipt')}
                  {createMethodButton('eth_maxPriorityFeePerGas')}
                  {createMethodButton('eth_mining')}
                  {createMethodButton('eth_newBlockFilter')}
                  {createMethodButton('eth_newFilter')}
                  {createMethodButton('eth_syncing')}
                  {createMethodButton('eth_uninstallFilter')}
                  {createMethodButton('net_listening')}
                  {createMethodButton('net_version')}
                  {createMethodButton('web3_clientVersion')}
                  {createMethodButton('eth_chainId')}
                </div>
              </div>
            </>
          )}
          {activeChain == ('hedera' as ChainNamespace) && (
            <>
              <div>
                <br />
                <strong>HIP-820 Methods:</strong>
              </div>
              <div>
                {createMethodButton('hedera_getNodeAddresses')}
                {createMethodButton('hedera_signMessage')}
                {createMethodButton('hedera_signTransaction')}
                {createMethodButton('hedera_executeTransaction')}
                {createMethodButton('hedera_signAndExecuteQuery')}
                {createMethodButton('hedera_signAndExecuteTransaction')}
              </div>
            </>
          )}
        </>
      ) : null}
    </div>
  )
}
