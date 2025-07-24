import { useState } from 'react'
import {
  BrowserProvider,
  formatEther,
  JsonRpcSigner,
  parseEther,
  getBigInt,
  hexlify,
  BigNumberish,
} from 'ethers'
import { HederaProvider } from '@hashgraph/hedera-wallet-connect'
import { eip712Types } from '../utils/eip712'

export interface EthSendTransactionParams {
  to: string
  value: string
  gasLimit: string
}
export interface EthSignMessageParams {
  message: string
}
export interface EthCallParams {
  to: string
  data: string
}
export interface EthFeeHistoryParams {
  blockCount: string
  newestBlock: string
}
export interface EthGetCodeParams {
  address: string
  blockTag: string
}
export interface EthGetStorageAtParams {
  address: string
  position: string
  blockTag: string
}
export interface EthGetTransactionByHashParams {
  hash: string
}
export interface EthGetTransactionByBlockHashAndIndexParams {
  blockHash: string
  index: string
}
export interface EthGetTransactionByBlockNumberAndIndexParams {
  blockNumber: string
  index: string
}
export interface EthGetBlockByHashParams {
  blockHash: string
  includeTransactions: string
}
export interface EthGetLogsParams {
  address: string
  fromBlock: string
  toBlock: string
}
export interface EthNewFilterParams extends EthGetLogsParams {}
export interface EthUninstallFilterParams {
  filterId: string
}
export interface EthFilterParams {
  filterId: string
}
export interface EthSignTypedDataParams {
  domain: string
  version: string
  verifyingContract: string
  from_name: string
  from_wallet: string
  to_name: string
  to_wallet: string
  contents: string
}

export type EthMethodParams =
  | EthSendTransactionParams
  | EthSignMessageParams
  | EthCallParams
  | EthFeeHistoryParams
  | EthGetCodeParams
  | EthGetStorageAtParams
  | EthGetTransactionByHashParams
  | EthGetTransactionByBlockHashAndIndexParams
  | EthGetTransactionByBlockNumberAndIndexParams
  | EthGetBlockByHashParams
  | EthGetLogsParams
  | EthNewFilterParams
  | EthUninstallFilterParams
  | EthFilterParams
  | EthSignTypedDataParams
  | Record<string, string>

interface UseEthereumMethodsProps {
  walletProvider: HederaProvider
  chainId: number
  address: string
  ethTxHash: string
  sendHash: (hash: string) => void
  sendSignMsg: (msg: string) => void
}

export const useEthereumMethods = ({
  walletProvider,
  chainId,
  address,
  ethTxHash,
  sendHash,
  sendSignMsg,
}: UseEthereumMethodsProps) => {
  const [signedEthTx, setSignedEthTx] = useState<string>()

  const browserProvider = new BrowserProvider(walletProvider, chainId)
  const signer = new JsonRpcSigner(browserProvider, address)

  const execute = async (methodName: string, params: Record<string, string>) => {
    switch (methodName) {
      case 'eth_getBalance': {
        const balance = await browserProvider.getBalance((params as any).address)
        return formatEther(balance)
      }
      case 'eth_chainId': {
        return await walletProvider.eth_chainId()
      }
      case 'eth_blockNumber': {
        const bn = await walletProvider.eth_blockNumber()
        return getBigInt(bn)
      }
      case 'eth_feeHistory': {
        const p = params as EthFeeHistoryParams
        const history = await walletProvider.eth_feeHistory(+p.blockCount, p.newestBlock, [])
        return JSON.stringify(history)
      }
      case 'eth_gasPrice': {
        const price = (await walletProvider.eth_gasPrice()) as BigNumberish
        return getBigInt(price)
      }
      case 'eth_sendTransaction': {
        const p = params as EthSendTransactionParams
        const tx = {
          to: p.to,
          value: parseEther(p.value),
          gasLimit: getBigInt(p.gasLimit),
        }
        const txResponse = await signer.sendTransaction(tx)
        sendHash(txResponse.hash)
        return txResponse.hash
      }
      case 'eth_signTransaction': {
        const p = params as EthSendTransactionParams
        const tx = {
          to: p.to,
          value: parseEther(p.value),
          gasLimit: getBigInt(p.gasLimit),
        }
        const serializedTx = await signer.signTransaction(tx)
        setSignedEthTx(serializedTx)
        return serializedTx
      }
      case 'eth_sendRawTransaction': {
        if (!signedEthTx) throw Error('Transaction not signed, use eth_signTransaction first')
        const txHash = await browserProvider.send('eth_sendRawTransaction', [signedEthTx])
        setSignedEthTx(undefined)
        sendHash(txHash)
        return txHash
      }
      case 'eth_signMessage': {
        const p = params as EthSignMessageParams
        const signature = await signer.signMessage(p.message)
        sendSignMsg(signature)
        return signature
      }
      case 'eth_call': {
        const p = params as EthCallParams
        return walletProvider.eth_call({ to: p.to, data: p.data })
      }
      case 'eth_getCode': {
        const p = params as EthGetCodeParams
        return walletProvider.eth_getCode(p.address, p.blockTag)
      }
      case 'eth_getStorageAt': {
        const p = params as EthGetStorageAtParams
        return walletProvider.eth_getStorageAt(p.address, p.position, p.blockTag)
      }
      case 'eth_getTransactionByHash': {
        const p = params as EthGetTransactionByHashParams
        const hash = p.hash || ethTxHash
        const tx = await walletProvider.eth_getTransactionByHash(hash)
        return tx ? JSON.stringify(tx) : 'Transaction not found'
      }
      case 'eth_getTransactionCount': {
        const count = await walletProvider.eth_getTransactionCount(address, 'latest')
        return getBigInt(count)
      }
      case 'eth_getTransactionReceipt': {
        const p = params as EthGetTransactionByHashParams
        const hash = p.hash || ethTxHash
        const receipt = await walletProvider.eth_getTransactionReceipt(hash)
        return receipt ? JSON.stringify(receipt) : 'Receipt not found'
      }
      case 'eth_maxPriorityFeePerGas': {
        const fee = await walletProvider.eth_maxPriorityFeePerGas()
        return getBigInt(fee)
      }
      case 'eth_getBlockByHash': {
        const p = params as EthGetBlockByHashParams
        return (
          (await walletProvider.eth_getBlockByHash(
            p.blockHash,
            p.includeTransactions === 'true',
          )) || 'Block not found'
        )
      }
      case 'eth_getBlockByNumber': {
        const p = params as EthGetBlockByNumberParams
        return (
          (await walletProvider.eth_getBlockByNumber(
            p.blockTag,
            (p as any).includeTransactions === 'true',
          )) || 'Block not found'
        )
      }
      case 'eth_getBlockTransactionCountByHash': {
        const p = params as EthGetBlockTransactionCountByHashParams
        const count = await walletProvider.eth_getBlockTransactionCountByHash(p.blockHash)
        return getBigInt(count)
      }
      case 'eth_getBlockTransactionCountByNumber': {
        const p = params as EthGetBlockTransactionCountByNumberParams
        const count = await walletProvider.eth_getBlockTransactionCountByNumber(p.blockTag)
        return getBigInt(count)
      }
      case 'eth_getFilterLogs': {
        const p = params as EthFilterParams
        const logs = await walletProvider.eth_getFilterLogs(p.filterId)
        return JSON.stringify(logs)
      }
      case 'eth_getFilterChanges': {
        const p = params as EthFilterParams
        const changes = await walletProvider.eth_getFilterChanges(p.filterId)
        return JSON.stringify(changes)
      }
      case 'eth_getTransactionByBlockHashAndIndex': {
        const p = params as EthGetTransactionByBlockHashAndIndexParams
        const tx = await walletProvider.eth_getTransactionByBlockHashAndIndex(
          p.blockHash,
          p.index,
        )
        return JSON.stringify(tx)
      }
      case 'eth_getTransactionByBlockNumberAndIndex': {
        const p = params as EthGetTransactionByBlockNumberAndIndexParams
        const tx = await walletProvider.eth_getTransactionByBlockNumberAndIndex(
          p.blockNumber,
          p.index,
        )
        return JSON.stringify(tx)
      }
      case 'eth_getLogs': {
        const p = params as EthGetLogsParams
        const filter = {
          address: hexlify(p.address),
          fromBlock: p.fromBlock,
          toBlock: p.toBlock,
        }
        return walletProvider.eth_getLogs(filter)
      }
      case 'eth_mining': {
        return walletProvider.eth_mining()
      }
      case 'eth_newBlockFilter': {
        return walletProvider.eth_newBlockFilter()
      }
      case 'eth_newFilter': {
        const p = params as EthNewFilterParams
        const filter = {
          address: hexlify(p.address),
          fromBlock: p.fromBlock,
          toBlock: p.toBlock,
        }
        return walletProvider.eth_newFilter(filter)
      }
      case 'eth_syncing': {
        return walletProvider.eth_syncing()
      }
      case 'eth_uninstallFilter': {
        const p = params as EthUninstallFilterParams
        return walletProvider.eth_uninstallFilter(p.filterId)
      }
      case 'net_listening': {
        return walletProvider.net_listening()
      }
      case 'net_version': {
        return walletProvider.net_version()
      }
      case 'web3_clientVersion': {
        return walletProvider.web3_clientVersion()
      }
      case 'eth_signTypedData': {
        const p = params as EthSignTypedDataParams
        const domain = {
          name: p.domain,
          version: p.version,
          chainId,
          verifyingContract: p.verifyingContract,
        }
        const value = {
          from: { name: p.from_name, wallet: p.from_wallet },
          to: { name: p.to_name, wallet: p.to_wallet },
          contents: p.contents,
        }
        const signature = await signer.signTypedData(domain, eip712Types, value)
        sendSignMsg(signature)
        return signature
      }
      default:
        throw new Error(`Unsupported Ethereum method: ${methodName}`)
    }
  }

  return { executeEthMethod: execute }
}
