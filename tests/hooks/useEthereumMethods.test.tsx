import React, { useEffect } from 'react'
import { render, act } from '@testing-library/react'
import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest'

vi.mock('ethers', () => {
  class BrowserProvider { constructor(_: any, __: any) {} }
  class JsonRpcProvider { constructor(_: any) {} }
  class JsonRpcSigner {
    constructor(_: any, __: any) {}
    async sendTransaction() { return { hash: 'rawHash' } }
    async signTransaction() { return 'signedTx' }
    async signMessage() { return 'signature' }
    async signTypedData() { return 'typedSignature' }
  }
  return {
    BrowserProvider,
    JsonRpcProvider,
    JsonRpcSigner,
    parseEther: () => 1n,
    formatEther: (v: any) => String(v),
    getBigInt: (v: any) => BigInt(v),
    hexlify: (v: any) => '0x' + String(v),
    toQuantity: (v: any) => v,
  }
})

const sendMock = vi.fn(async () => '0x5')
vi.mock('../../src/config', () => ({
  jsonRpcProvider: { send: sendMock },
}))

describe('useEthereumMethods', () => {
  let rpcProvider: any
  let walletProvider: any
  let sendHash: any
  let sendSignMsg: any
  let execute: any
  let useEthereumMethods: any

  async function setup() {
    const mod = await import('../../src/hooks/useEthereumMethods')
    useEthereumMethods = mod.useEthereumMethods
    function Wrapper({ onReady }: any) {
      const { executeEthMethod } = useEthereumMethods({
        walletProvider,
        chainId: 1,
        address: '0xabc',
        ethTxHash: '0x123',
        sendHash,
        sendSignMsg,
      })
      useEffect(() => { onReady(executeEthMethod) }, [executeEthMethod, onReady])
      return null
    }
    render(<Wrapper onReady={(fn: any) => { execute = fn }} />)
  }

  beforeEach(async () => {
    process.env.VITE_REOWN_PROJECT_ID = 'pid'
    sendHash = vi.fn()
    sendSignMsg = vi.fn()
    sendMock.mockClear()
    rpcProvider = {
      request: vi.fn(async ({ method }: any) => {
        switch (method) {
          case 'eth_getBalance':
            return '0x5'
          case 'eth_chainId':
            return '0x1'
          case 'eth_blockNumber':
            return '0x5'
          case 'eth_sendRawTransaction':
            return 'rawHash'
          case 'eth_getTransactionByHash':
            return undefined
          case 'eth_getTransactionReceipt':
            return undefined
          default:
            return '0x1'
        }
      })
    }
    walletProvider = { rpcProviders: { eip155: { httpProviders: { 1: rpcProvider } } } }
    await setup()
  })

  afterEach(() => {
    delete process.env.VITE_REOWN_PROJECT_ID
  })

  it('signs and sends a transaction', async () => {
    await act(async () => {
      await execute('eth_signTransaction', { to: '0x1', value: '1', gasLimit: '1' })
    })
    await act(async () => {
      const res = await execute('eth_sendRawTransaction', {})
      expect(res).toBe('rawHash')
    })
    expect(sendHash).toHaveBeenCalledWith('rawHash')
  })

  it('sends a transaction directly', async () => {
    await act(async () => {
      const res = await execute('eth_sendTransaction', { to: '0x1', value: '1', gasLimit: '1' })
      expect(res).toBe('rawHash')
    })
    expect(sendHash).toHaveBeenCalledWith('rawHash')
  })

  it('returns balance and handles missing tx', async () => {
    let balance: any
    await act(async () => {
      balance = await execute('eth_getBalance', { address: '0xabc' })
    })
    expect(balance).toBe('5')

    await act(async () => {
      const tx = await execute('eth_getTransactionByHash', { hash: '0x1' })
      expect(tx).toBe('Transaction not found')
    })

    await act(async () => {
      const rc = await execute('eth_getTransactionReceipt', { hash: '0x1' })
      expect(rc).toBe('Receipt not found')
    })
  })

  it('throws on unsupported method', async () => {
    await expect(execute('unknown', {})).rejects.toThrow('Unsupported Ethereum method')
  })

  it('executes various methods', async () => {
    const methods = [
      'eth_chainId',
      'eth_blockNumber',
      'eth_feeHistory',
      'eth_gasPrice',
      'eth_call',
      'eth_getCode',
      'eth_getStorageAt',
      'eth_getTransactionCount',
      'eth_maxPriorityFeePerGas',
      'eth_getBlockByHash',
      'eth_getBlockByNumber',
      'eth_getBlockTransactionCountByHash',
      'eth_getBlockTransactionCountByNumber',
      'eth_getFilterLogs',
      'eth_getFilterChanges',
      'eth_getTransactionByBlockHashAndIndex',
      'eth_getTransactionByBlockNumberAndIndex',
      'eth_getLogs',
      'eth_mining',
      'eth_newBlockFilter',
      'eth_newFilter',
      'eth_syncing',
      'eth_uninstallFilter',
      'net_listening',
      'net_version',
      'web3_clientVersion',
      'eth_signMessage',
      'eth_signTypedData',
    ]
    for (const name of methods) {
      await act(async () => {
        await execute(name, { address: '0x1', blockTag: 'latest', blockHash: 'b', index: '0', fromBlock: '0x1', toBlock: '0x2', filterId: '1', blockNumber: '0x1', data: '0x', message: 'm', to: '0x1', gasLimit: '1', value: '1', domain: 'd', version: '1', verifyingContract: '0x1', from_name: 'a', from_wallet: '0x1', to_name: 'b', to_wallet: '0x2', contents: 'c' })
      })
    }
    expect(sendSignMsg).toHaveBeenCalled()
  })

  it('handles missing signer and signed tx', async () => {
    const mod = await import('../../src/hooks/useEthereumMethods')
    let execFn: any
    function Wrapper({ onReady }: any) {
      const { executeEthMethod } = mod.useEthereumMethods({
        walletProvider: undefined,
        chainId: undefined,
        address: undefined,
        ethTxHash: '0x0',
        sendHash,
        sendSignMsg,
      })
      useEffect(() => { onReady(executeEthMethod) }, [executeEthMethod, onReady])
      return null
    }
    render(<Wrapper onReady={(fn: any) => { execFn = fn }} />)
    await expect(execFn('eth_sendTransaction', { to: '0x1', value: '1', gasLimit: '1' })).rejects.toThrow('Wallet not connected')
    await expect(execFn('eth_sendRawTransaction', {})).rejects.toThrow('Transaction not signed')
  })

  it('uses fallback jsonRpc provider', async () => {
    const mod = await import('../../src/hooks/useEthereumMethods')
    let execFn: any
    function Wrapper({ onReady }: any) {
      const { executeEthMethod } = mod.useEthereumMethods({
        walletProvider: undefined,
        chainId: undefined,
        address: '0xabc',
        ethTxHash: '0x0',
        sendHash,
        sendSignMsg,
      })
      useEffect(() => { onReady(executeEthMethod) }, [executeEthMethod, onReady])
      return null
    }
    render(<Wrapper onReady={(fn: any) => { execFn = fn }} />)
    await act(async () => {
      const res = await execFn('eth_getBalance', { address: '0xabc' })
      expect(res).toBe('5')
    })
    expect(sendMock).toHaveBeenCalledWith('eth_getBalance', ['0xabc', 'latest'])
  })
})
