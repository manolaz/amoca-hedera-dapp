import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, beforeEach, expect, vi } from 'vitest'
import React from 'react'

let activeChain: string
let walletProvider: any

vi.mock('ethers', () => ({
  BrowserProvider: class {
    constructor(_: any, __: any) {}
    async getTransactionReceipt() { return { status: 1 } }
  }
}))

vi.mock('@reown/appkit/react', () => ({
  useAppKitTheme: () => ({ themeMode: 'light', themeVariables: { c: '1' } }),
  useAppKitState: () => ({ activeChain, loading: false, open: false, selectedNetworkId: 'hedera:testnet' }),
  useAppKitAccount: () => ({ address: '0xabc', caipAddress: 'eip155:1:0xabc', isConnected: true, status: 'connected' }),
  useAppKitProvider: () => ({ walletProvider }),
  useWalletInfo: () => ({ walletInfo: { name: 'wallet' } }),
  useAppKitNetworkCore: () => ({ chainId: 1 }),
}))

beforeEach(() => {
  activeChain = 'eip155'
  walletProvider = {}
})

describe('InfoList', () => {
  it('shows transaction status for eth tx', async () => {
    const { InfoList } = await import('../../src/components/InfoList')
    render(<InfoList hash="0x1" txId="" signedMsg="" nodes={[]} lastFunctionResult={null} />)
    await waitFor(() => {
      expect(screen.getByText(/Status: Success/)).toBeInTheDocument()
    })
  })

  it('shows nodes and last result', async () => {
    const { InfoList } = await import('../../src/components/InfoList')
    activeChain = 'hedera'
    render(<InfoList hash="" txId="tx" signedMsg="sig" nodes={["n1"]} lastFunctionResult={{ functionName: 'f', result: 'r' }} />)
    expect(screen.getByText('Last Function Result')).toBeInTheDocument()
    expect(screen.getByText('n1')).toBeInTheDocument()
  })
})
