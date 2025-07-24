import { useState } from 'react'
import {
  BrowserProvider,
  formatEther,
  JsonRpcSigner,
  parseEther,
  getBigInt,
  hexlify,
  toQuantity,
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
  const rpcProvider =
    (walletProvider.rpcProviders as any)?.eip155?.httpProviders?.[chainId]

  const execute = async (methodName: string, params: Record<string, string>) => {
    switch (methodName) {
      case 'eth_getBalance': {
        const balance = await rpcProvider.request({
          method: 'eth_getBalance',
          params: [(params as any).address, 'latest'],
        })
        return formatEther(getBigInt(balance as any))
      }
      case 'eth_chainId': {
        return await rpcProvider.request({ method: 'eth_chainId', params: [] })
      }
      case 'eth_blockNumber': {
        const bn = await rpcProvider.request({
          method: 'eth_blockNumber',
          params: [],
        })
        return getBigInt(bn as any)
      }
      case 'eth_feeHistory': {
        const p = params as EthFeeHistoryParams
        const history = await rpcProvider.request({
          method: 'eth_feeHistory',
          params: [
            toQuantity(+p.blockCount),
            p.newestBlock,
            [] as number[],
          ],
        })
        return JSON.stringify(history)
      }
      case 'eth_gasPrice': {
        const price = (await rpcProvider.request({
          method: 'eth_gasPrice',
          params: [],
        })) as BigNumberish
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
        const txHash = await rpcProvider.request({
          method: 'eth_sendRawTransaction',
          params: [signedEthTx],
        })
        setSignedEthTx(undefined)
        sendHash(txHash as string)
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
        return rpcProvider.request({
          method: 'eth_call',
          params: [{ to: p.to, data: p.data }, 'latest'],
        })
      }
      case 'eth_getCode': {
        const p = params as EthGetCodeParams
        return rpcProvider.request({
          method: 'eth_getCode',
          params: [p.address, p.blockTag],
        })
      }
      case 'eth_getStorageAt': {
        const p = params as EthGetStorageAtParams
        return rpcProvider.request({
          method: 'eth_getStorageAt',
          params: [p.address, p.position, p.blockTag],
        })
      }
      case 'eth_getTransactionByHash': {
        const p = params as EthGetTransactionByHashParams
        const hash = p.hash || ethTxHash
        const tx = await rpcProvider.request({
          method: 'eth_getTransactionByHash',
          params: [hash],
        })
        return tx ? JSON.stringify(tx) : 'Transaction not found'
      }
      case 'eth_getTransactionCount': {
        const count = await rpcProvider.request({
          method: 'eth_getTransactionCount',
          params: [address, 'latest'],
        })
        return getBigInt(count as any)
      }
      case 'eth_getTransactionReceipt': {
        const p = params as EthGetTransactionByHashParams
        const hash = p.hash || ethTxHash
        const receipt = await rpcProvider.request({
          method: 'eth_getTransactionReceipt',
          params: [hash],
        })
        return receipt ? JSON.stringify(receipt) : 'Receipt not found'
      }
      case 'eth_maxPriorityFeePerGas': {
        const fee = await rpcProvider.request({
          method: 'eth_maxPriorityFeePerGas',
          params: [],
        })
        return getBigInt(fee as any)
      }
      case 'eth_getBlockByHash': {
        const p = params as EthGetBlockByHashParams
        return (
          (await rpcProvider.request({
            method: 'eth_getBlockByHash',
            params: [p.blockHash, p.includeTransactions === 'true'],
          })) || 'Block not found'
        )
      }
      case 'eth_getBlockByNumber': {
        const p = params as EthGetBlockByNumberParams
        return (
          (await rpcProvider.request({
            method: 'eth_getBlockByNumber',
            params: [p.blockTag, (p as any).includeTransactions === 'true'],
          })) || 'Block not found'
        )
      }
      case 'eth_getBlockTransactionCountByHash': {
        const p = params as EthGetBlockTransactionCountByHashParams
        const count = await rpcProvider.request({
          method: 'eth_getBlockTransactionCountByHash',
          params: [p.blockHash],
        })
        return getBigInt(count as any)
      }
      case 'eth_getBlockTransactionCountByNumber': {
        const p = params as EthGetBlockTransactionCountByNumberParams
        const count = await rpcProvider.request({
          method: 'eth_getBlockTransactionCountByNumber',
          params: [p.blockTag],
        })
        return getBigInt(count as any)
      }
      case 'eth_getFilterLogs': {
        const p = params as EthFilterParams
        const logs = await rpcProvider.request({
          method: 'eth_getFilterLogs',
          params: [p.filterId],
        })
        return JSON.stringify(logs)
      }
      case 'eth_getFilterChanges': {
        const p = params as EthFilterParams
        const changes = await rpcProvider.request({
          method: 'eth_getFilterChanges',
          params: [p.filterId],
        })
        return JSON.stringify(changes)
      }
      case 'eth_getTransactionByBlockHashAndIndex': {
        const p = params as EthGetTransactionByBlockHashAndIndexParams
        const tx = await rpcProvider.request({
          method: 'eth_getTransactionByBlockHashAndIndex',
          params: [p.blockHash, p.index],
        })
        return JSON.stringify(tx)
      }
      case 'eth_getTransactionByBlockNumberAndIndex': {
        const p = params as EthGetTransactionByBlockNumberAndIndexParams
        const tx = await rpcProvider.request({
          method: 'eth_getTransactionByBlockNumberAndIndex',
          params: [p.blockNumber, p.index],
        })
        return JSON.stringify(tx)
      }
      case 'eth_getLogs': {
        const p = params as EthGetLogsParams
        const filter = {
          address: hexlify(p.address),
          fromBlock: p.fromBlock,
          toBlock: p.toBlock,
        }
        return rpcProvider.request({ method: 'eth_getLogs', params: [filter] })
      }
      case 'eth_mining': {
        return rpcProvider.request({ method: 'eth_mining', params: [] })
      }
      case 'eth_newBlockFilter': {
        return rpcProvider.request({ method: 'eth_newBlockFilter', params: [] })
      }
      case 'eth_newFilter': {
        const p = params as EthNewFilterParams
        const filter = {
          address: hexlify(p.address),
          fromBlock: p.fromBlock,
          toBlock: p.toBlock,
        }
        return rpcProvider.request({ method: 'eth_newFilter', params: [filter] })
      }
      case 'eth_syncing': {
        return rpcProvider.request({ method: 'eth_syncing', params: [] })
      }
      case 'eth_uninstallFilter': {
        const p = params as EthUninstallFilterParams
        return rpcProvider.request({
          method: 'eth_uninstallFilter',
          params: [p.filterId],
        })
      }
      case 'net_listening': {
        return rpcProvider.request({ method: 'net_listening', params: [] })
      }
      case 'net_version': {
        return rpcProvider.request({ method: 'net_version', params: [] })
      }
      case 'web3_clientVersion': {
        return rpcProvider.request({ method: 'web3_clientVersion', params: [] })
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
