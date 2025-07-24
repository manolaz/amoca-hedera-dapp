import { render, fireEvent, waitFor, screen } from '@testing-library/react'
import { describe, it, beforeEach, expect, vi } from 'vitest'

let activeChain: string
let walletProvider: any

function createWalletProviderMock() {
  const httpProvider = { request: vi.fn(async ({ method }: any) => method + '_result') }
  return new Proxy({ rpcProviders: { eip155: { httpProviders: { 1: httpProvider } } } }, {
    get(target, prop: string) {
      if (!target[prop]) {
        if (prop === 'hedera_signAndExecuteQuery') {
          target[prop] = vi.fn(async () => ({ response: Buffer.from('data').toString('base64') }))
        } else if (prop === 'hedera_getNodeAddresses') {
          target[prop] = vi.fn(async () => ({ nodes: ['n1'] }))
        } else if (prop === 'hedera_executeTransaction' || prop === 'hedera_signAndExecuteTransaction') {
          target[prop] = vi.fn(async () => ({ transactionId: 'tid' }))
        } else {
          target[prop] = vi.fn(async () => prop + '_result')
        }
      }
      return target[prop]
    }
  })
}

vi.mock('ethers', () => {
  class BrowserProvider {
    constructor(_: any, __: any) {}
    async getBalance() { return 1n }
    async send() { return 'rawHash' }
  }
  class JsonRpcSigner {
    constructor(_: any, __: any) {}
    async sendTransaction() { return { hash: 'txHash' } }
    async signTransaction() { return 'signedTx' }
    async signMessage() { return 'signature' }
    async signTypedData() { return 'typedSignature' }
  }
  class JsonRpcProvider {
    constructor(_: any) {}
    async request({ method }: any) { return method + '_result' }
  }
  return {
    BrowserProvider,
    JsonRpcProvider,
    JsonRpcSigner,
    parseEther: () => 1n,
    formatEther: (v: any) => String(v),
    getBigInt: (v: any) => BigInt(v),
    hexlify: (v: any) => '0x' + String(v),
  }
})

vi.mock('@hashgraph/sdk', () => {
  class Hbar { constructor(_: number) {} negated() { return this } }
  class TransferTransaction { setTransactionId() { return this } addHbarTransfer() { return this } setMaxTransactionFee() { return this } freezeWith() { return this } }
  const TransactionId = { generate: () => 'tid' }
  class AccountInfoQuery { setAccountId() { return this } }
  const AccountInfo = { fromBytes: () => ({}) }
  class Transaction {}
  return { Hbar, TransferTransaction, TransactionId, AccountInfoQuery, AccountInfo, Transaction }
})

vi.mock('@hashgraph/hedera-wallet-connect', () => ({
  queryToBase64String: () => 'query',
  transactionToBase64String: () => 'tx',
  HederaProvider: { init: vi.fn().mockResolvedValue({}) },
  HederaAdapter: class {},
  HederaChainDefinition: {
    Native: { Mainnet: 'native-mainnet', Testnet: 'native-testnet' },
    EVM: { Mainnet: 'evm-mainnet', Testnet: 'evm-testnet' },
  },
  hederaNamespace: 'hedera',
}))

vi.mock('../../src/components/Modal', () => {
  const React = require('react')
  return {
    Modal: ({ isOpen, onSubmit, fields }: any) => {
      React.useEffect(() => {
        if (isOpen) {
          const params: Record<string, string> = {}
          fields.forEach((f: any) => {
            params[f.name] = f.defaultValue || '1'
          })
          onSubmit(params)
        }
      }, [isOpen])
      return null
    }
  }
})

vi.mock('@reown/appkit/react', () => ({
  useDisconnect: () => ({ disconnect: vi.fn() }),
  useAppKitAccount: () => ({ isConnected: true, address: '0xabc' }),
  useAppKitNetworkCore: () => ({ chainId: 1 }),
  useAppKitState: () => ({ activeChain }),
  useAppKitProvider: () => ({ walletProvider }),
}))

beforeEach(() => {
  vi.resetModules()
  process.env.VITE_REOWN_PROJECT_ID = 'test'
  activeChain = 'eip155'
  walletProvider = createWalletProviderMock()
  process.env.VITE_REOWN_PROJECT_ID = 'pid'
})

afterEach(() => {
  delete process.env.VITE_REOWN_PROJECT_ID
})

afterEach(() => {
  delete process.env.VITE_REOWN_PROJECT_ID
})

describe('ActionButtonList', () => {
  const props = {
    sendHash: vi.fn(),
    sendTxId: vi.fn(),
    sendSignMsg: vi.fn(),
    sendNodeAddresses: vi.fn(),
    ethTxHash: '0x123',
    setLastFunctionResult: vi.fn(),
  }

  it('executes all ethereum methods', async () => {
    const { ActionButtonList } = await import('../../src/components/ActionButtonList')
    render(<ActionButtonList {...props} />)

    const methods = [
      'eth_signMessage',
      'eth_signTransaction',
      'eth_sendRawTransaction',
      'eth_sendTransaction',
      'eth_signTypedData',
      'eth_getBalance',
      'eth_blockNumber',
      'eth_call',
      'eth_feeHistory',
      'eth_gasPrice',
      'eth_getCode',
      'eth_getBlockByHash',
      'eth_getBlockByNumber',
      'eth_getBlockTransactionCountByHash',
      'eth_getBlockTransactionCountByNumber',
      'eth_getFilterLogs',
      'eth_getFilterChanges',
      'eth_getLogs',
      'eth_getStorageAt',
      'eth_getTransactionByBlockHashAndIndex',
      'eth_getTransactionByBlockNumberAndIndex',
      'eth_getTransactionByHash',
      'eth_getTransactionCount',
      'eth_getTransactionReceipt',
      'eth_maxPriorityFeePerGas',
      'eth_mining',
      'eth_newBlockFilter',
      'eth_newFilter',
      'eth_syncing',
      'eth_uninstallFilter',
      'net_listening',
      'net_version',
      'web3_clientVersion',
      'eth_chainId',
    ]

    for (const m of methods) {
      fireEvent.click(screen.getByText(m))
    }

    await waitFor(() => {
      expect(props.setLastFunctionResult).toHaveBeenCalled()
    })
  })

  it('executes all hedera methods', async () => {
    activeChain = 'hedera'
    walletProvider = createWalletProviderMock()
    const { ActionButtonList } = await import('../../src/components/ActionButtonList')
    render(<ActionButtonList {...props} />)

    const methods = [
      'hedera_signTransaction',
      'hedera_executeTransaction',
      'hedera_signAndExecuteTransaction',
      'hedera_signAndExecuteQuery',
      'hedera_getNodeAddresses',
      'hedera_signMessage',
    ]

    for (const m of methods) {
      fireEvent.click(screen.getByText(m))
    }

    await waitFor(() => {
      expect(props.setLastFunctionResult).toHaveBeenCalled()
    })
  })
})
