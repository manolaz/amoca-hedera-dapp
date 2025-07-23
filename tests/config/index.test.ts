import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const initSpy = vi.fn().mockResolvedValue({ id: 'provider' })
const constructorSpy = vi.fn()

vi.mock('@hashgraph/hedera-wallet-connect', () => {
  return {
    HederaProvider: { init: initSpy },
    HederaAdapter: class {
      constructor(options: any) {
        constructorSpy(options)
      }
    },
    HederaChainDefinition: {
      Native: { Mainnet: 'native-mainnet', Testnet: 'native-testnet' },
      EVM: { Mainnet: 'evm-mainnet', Testnet: 'evm-testnet' },
    },
    hederaNamespace: 'hedera',
  }
})

vi.mock('@reown/appkit/networks', () => ({ AppKitNetwork: {} }))

vi.mock('@walletconnect/universal-provider', () => ({ default: class UniversalProvider {} }))

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  delete process.env.VITE_REOWN_PROJECT_ID
})

afterEach(() => {
  delete process.env.VITE_REOWN_PROJECT_ID
})

describe('config module', () => {
  it('throws when projectId is missing', async () => {
    await expect(import('../../src/config/index')).rejects.toThrow('Project ID is not defined')
  })

  it('exports expected values', async () => {
    process.env.VITE_REOWN_PROJECT_ID = 'pid123'
    const config = await import('../../src/config/index')

    expect(config.projectId).toBe('pid123')
    expect(config.metadata).toEqual({
      name: 'Hedera EIP155 & HIP820 Example',
      description: 'Hedera EIP155 & HIP820 Example',
      url: 'https://github.com/hashgraph/hedera-wallet-connect/',
      icons: ['https://avatars.githubusercontent.com/u/31002956'],
    })
    expect(config.networks).toEqual([
      'native-mainnet',
      'native-testnet',
      'evm-mainnet',
      'evm-testnet',
    ])
    expect(constructorSpy).toHaveBeenCalledTimes(2)
    expect(constructorSpy).toHaveBeenNthCalledWith(1, {
      projectId: 'pid123',
      networks: ['native-mainnet', 'native-testnet'],
      namespace: 'hedera',
    })
    expect(constructorSpy).toHaveBeenNthCalledWith(2, {
      projectId: 'pid123',
      networks: ['evm-mainnet', 'evm-testnet'],
      namespace: 'eip155',
    })
    expect(initSpy).toHaveBeenCalledWith({
      projectId: 'pid123',
      metadata: config.metadata,
      logger: 'debug',
    })
    expect(config.universalProvider).toEqual({ id: 'provider' })
  })
})
