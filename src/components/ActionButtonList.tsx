import { useState } from 'react'
import { BrowserProvider, formatEther, JsonRpcSigner, parseEther, getBigInt, hexlify, BigNumberish } from 'ethers'
import { ChainNamespace } from '@reown/appkit-common'
import {
  useDisconnect,
  useAppKitAccount,
  useAppKitNetworkCore,
  useAppKitState,
  useAppKitProvider,
} from '@reown/appkit/react'
import {
  AccountInfo,
  AccountInfoQuery,
  Hbar,
  Transaction as HederaTransaction,
  TransactionId,
  TransferTransaction,
} from '@hashgraph/sdk'
import {
  queryToBase64String,
  SignAndExecuteQueryParams,
  SignMessageParams,
  transactionToBase64String,
  HederaProvider,
} from '@hashgraph/hedera-wallet-connect'
import { Modal } from './Modal'
import { getMethodConfig, FieldConfig } from '../utils/methodConfigs'
import { FunctionResult } from '../App'

// Example types for EIP-712
const types = {
  Person: [
    { name: 'name', type: 'string' },
    { name: 'wallet', type: 'address' },
  ],
  Mail: [
    { name: 'from', type: 'Person' },
    { name: 'to', type: 'Person' },
    { name: 'contents', type: 'string' },
  ],
}

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
  setLastFunctionResult
}: ActionButtonListProps) => {
  const { disconnect } = useDisconnect()
  const { chainId } = useAppKitNetworkCore()
  const { isConnected, address } = useAppKitAccount()
  const { activeChain } = useAppKitState()
  const [signedHederaTx, setSignedHederaTx] = useState<HederaTransaction>()
  const [signedEthTx, setSignedEthTx] = useState<string>()
  const { walletProvider } = useAppKitProvider(activeChain ?? ('hedera' as ChainNamespace))

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

  // --- Utility functions ---
  const getWalletProvider = () => {
    if (!walletProvider) throw Error('user is disconnected')
    return walletProvider as HederaProvider
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
        result: typeof result === 'object' ? JSON.stringify(result) : String(result || '')
      })
    } catch (error) {
      console.error(`Error executing ${methodName}:`, error)
      setLastFunctionResult({
        functionName: methodName,
        result: `Error: ${(error as Error).message}`
      })
    } finally {
      setIsLoading(false)
    }
  }

  // --- HIP-820 Methods ---
  const executeHederaMethod = async (methodName: string, params: Record<string, string>) => {
    const walletProvider = getWalletProvider()

    switch (methodName) {
      case 'hedera_getNodeAddresses': {
        const result = await walletProvider.hedera_getNodeAddresses()
        sendNodeAddresses(result.nodes)
        return result.nodes
      }

      case 'hedera_executeTransaction': {
        if (!signedHederaTx) {
          throw Error('Transaction not signed, use hedera_signTransaction first')
        }
        const transactionList = transactionToBase64String(signedHederaTx)
        const result = await walletProvider.hedera_executeTransaction({
          transactionList,
        })
        setSignedHederaTx(undefined)
        sendTxId(result.transactionId)
        return result.transactionId
      }

      case 'hedera_signMessage': {
        const message = params.message
        const signParams: SignMessageParams = {
          signerAccountId: 'hedera:testnet:' + address,
          message: message,
        }
        const { signatureMap } = await walletProvider.hedera_signMessage(signParams)
        sendSignMsg(signatureMap)
        return signatureMap
      }

      case 'hedera_signTransaction': {
        const accountId = address!
        const recipientId = params.recipientId
        const amount = params.amount 
        const maxFee = Number(params.maxFee)
        const hbarAmount = new Hbar(Number(amount))
        // Create a transaction to transfer HBAR
        const transaction = new TransferTransaction()
          .setTransactionId(TransactionId.generate(accountId))
          .addHbarTransfer(accountId, hbarAmount.negated())
          .addHbarTransfer(recipientId, hbarAmount)
          .setMaxTransactionFee(new Hbar(maxFee))
          .freezeWith(null)

        const transactionSigned = await walletProvider.hedera_signTransaction({
          signerAccountId: 'hedera:testnet:' + address,
          transactionBody: transaction,
        })

        setSignedHederaTx(transactionSigned as HederaTransaction)
        return 'Transaction signed successfully'
      }

      case 'hedera_signAndExecuteTransaction': {
        const accountId = address!
        const recipientId = params.recipientId
        const amount = params.amount
        const hbarAmount = new Hbar(Number(amount))

        // Create a transaction to transfer HBAR
        const transaction = new TransferTransaction()
          .setTransactionId(TransactionId.generate(accountId))
          .addHbarTransfer(accountId, hbarAmount.negated())
          .addHbarTransfer(recipientId, hbarAmount)

        // Sign and execute the transaction
        const result = await walletProvider.hedera_signAndExecuteTransaction({
          signerAccountId: 'hedera:testnet:' + accountId,
          transactionList: transactionToBase64String(transaction),
        })

        sendTxId(result.transactionId)
        return result.transactionId
      }

      case 'hedera_signAndExecuteQuery': {
        const accountId = address!
        const query = new AccountInfoQuery().setAccountId(accountId)
        const queryString = queryToBase64String(query)

        const queryParams: SignAndExecuteQueryParams = {
          signerAccountId: 'hedera:testnet:' + accountId,
          query: queryString,
        }

        const { response } = await walletProvider.hedera_signAndExecuteQuery(queryParams)
        const accountInfo = AccountInfo.fromBytes(Buffer.from(response, 'base64'))
  
        return JSON.stringify(accountInfo)
      }

      default:
        throw new Error(`Unsupported Hedera method: ${methodName}`)
    }
  }

  // --- Ethereum Methods ---
  const executeEthMethod = async (methodName: string, params: Record<string, string>) => {
    if (!address) throw Error('user is disconnected')

    const walletProvider = getWalletProvider()
    const browserProvider = new BrowserProvider(walletProvider, chainId)
    const signer = new JsonRpcSigner(browserProvider, address!)
    switch (methodName) {
      case 'eth_getBalance': {
        const browserProvider = new BrowserProvider(walletProvider, chainId)
        const balance = await browserProvider.getBalance(params.address)
        const formatted = formatEther(balance)
        return formatted
      }

      case 'eth_chainId': {
        return await walletProvider.eth_chainId()
      }

      case 'eth_blockNumber': {
        const bn = await walletProvider.eth_blockNumber()
        const decoded = getBigInt(bn)
        return decoded
      }

      case 'eth_feeHistory': {
        const history = await walletProvider.eth_feeHistory(+params.blockCount, params.newestBlock, [])
        return JSON.stringify(history)
      }

      case 'eth_gasPrice': {
        const price = await walletProvider.eth_gasPrice() as BigNumberish
        const decoded = getBigInt(price);
        return decoded
      }

      case 'eth_sendTransaction': {
        const tx = {
          to: params.to,
          value: parseEther(params.value),
          gasLimit: getBigInt(params.gasLimit),
        }
        const txResponse = await signer.sendTransaction(tx)
        sendHash(txResponse.hash)
        return txResponse.hash
      }

      case 'eth_signTransaction': {
        const tx = {
          to: params.to,
          value: parseEther(params.value),
          gasLimit: getBigInt(params.gasLimit),
        }
        const serializedTx = await signer.signTransaction(tx)
        setSignedEthTx(serializedTx)
        return serializedTx
      }

      case 'eth_sendRawTransaction': {
        if (!signedEthTx) {
          throw Error('Transaction not signed, use eth_signTransaction first')
        }
        const txHash = await browserProvider.send('eth_sendRawTransaction', [signedEthTx])

        setSignedEthTx(undefined)
        sendHash(txHash)
        return txHash
      }

      case 'eth_signMessage': {
        const message = params.message;
        const signature = await signer.signMessage(message)
        sendSignMsg(signature)
        return signature
      }

      case 'eth_call': {
        const result = await walletProvider.eth_call({
          to: params.to,
          data: params.data,
        })
        return result
      }

      case 'eth_getCode': {
        const code = await walletProvider.eth_getCode(params.address, params.blockTag)
        return code
      }

      case 'eth_getStorageAt': {
        const storage = await walletProvider.eth_getStorageAt(
          params.address,
          params.position,
          params.blockTag
        )
        return storage
      }

      case 'eth_getTransactionByHash': {
        if (!params.hash && !ethTxHash) {
          throw Error('Transaction hash required')
        }
        const hash = params.hash || ethTxHash
        const tx = await walletProvider.eth_getTransactionByHash(hash)
        return tx ? JSON.stringify(tx) : 'Transaction not found'
      }

      case 'eth_getTransactionCount': {
        const count = await walletProvider.eth_getTransactionCount(address!, 'latest')
        const decoded = getBigInt(count);
        return decoded
      }

      case 'eth_getTransactionReceipt': {
        if (!params.hash && !ethTxHash) {
          throw Error('Transaction hash required')
        }
        const hash = params.hash || ethTxHash
        const receipt = await walletProvider.eth_getTransactionReceipt(hash)
        return receipt ? JSON.stringify(receipt) : 'Receipt not found'
      }

      case 'eth_maxPriorityFeePerGas': {
        const fee = await walletProvider.eth_maxPriorityFeePerGas()
        const decoded = getBigInt(fee);
        return decoded
      }

      case 'eth_getBlockByHash': {
        const block = await walletProvider.eth_getBlockByHash(params.blockHash, params.includeTransactions == 'true')
        return block || 'Block not found'
      }

      case 'eth_getBlockByNumber': {
        const block = await walletProvider.eth_getBlockByNumber(params.blockTag, params.includeTransactions == 'true')
        return block || 'Block not found'
      }

      case 'eth_getBlockTransactionCountByHash': {
        const count = await walletProvider.eth_getBlockTransactionCountByHash(params.blockHash)
        const decoded = getBigInt(count)
        return decoded;
      }

      case 'eth_getBlockTransactionCountByNumber': {
        const count = await walletProvider.eth_getBlockTransactionCountByNumber(params.blockTag)
        const decoded = getBigInt(count)
        return decoded
      }

      case 'eth_getFilterLogs': {
        const logs = await walletProvider.eth_getFilterLogs(params.filterId)
        return JSON.stringify(logs)
      }

      case 'eth_getFilterChanges': {
        const changes = await walletProvider.eth_getFilterChanges(params.filterId)
        return JSON.stringify(changes)
      }

      case 'eth_getTransactionByBlockHashAndIndex': {
        const tx = await walletProvider.eth_getTransactionByBlockHashAndIndex(params.blockHash, params.index)
        return JSON.stringify(tx)
      }

      case 'eth_getTransactionByBlockNumberAndIndex': {
        const tx = await walletProvider.eth_getTransactionByBlockNumberAndIndex(params.blockNumber, params.index)
        return JSON.stringify(tx)
      }

      case 'eth_getLogs': {
        const filter = {
          address: hexlify(params.address),
          fromBlock: params.fromBlock,
          toBlock: params.toBlock,
        }
        const logs = await walletProvider.eth_getLogs(filter)
        return logs
      }

      case 'eth_mining': {
        const mining = await walletProvider.eth_mining()
        return mining
      }

      case 'eth_newBlockFilter': {
        const filterId = await walletProvider.eth_newBlockFilter()
        return filterId
      }

      case 'eth_newFilter': {
        const filter = {
          address: hexlify(params.address),
          fromBlock: params.fromBlock,
          toBlock: params.toBlock
        }
        const filterId = await walletProvider.eth_newFilter(filter)
        return filterId
      }

      case 'eth_syncing': {
        const syncing = await walletProvider.eth_syncing()
        return JSON.stringify(syncing)
      }

      case 'eth_uninstallFilter': {
        const syncing = await walletProvider.eth_uninstallFilter(params.filterId)
        return JSON.stringify(syncing)
      }

      case 'net_listening': {
        const listening = await walletProvider.net_listening()
        return listening
      }

      case 'net_version': {
        const version = await walletProvider.net_version()
        return version
      }

      case 'web3_clientVersion': {
        const version = await walletProvider.web3_clientVersion()
        return version
      }

      case 'eth_signTypedData': {
        
        const domain = {
          name: params.domain,
          version: params.version,
          chainId: chainId,
          verifyingContract: params.verifyingContract,
        }

        const value = {
          from: {
            name: params.from_name,
            wallet: params.from_wallet,
          },
          to: {
            name: params.to_name,
            wallet: params.to_wallet,
          },
          contents: params.contents,
        }

        const signature = await signer.signTypedData(domain, types, value)
        sendSignMsg(signature)
        return signature
      }

      default:
        throw new Error(`Unsupported Ethereum method: ${methodName}`)
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