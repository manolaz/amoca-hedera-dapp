import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'

vi.mock('@reown/appkit/react', () => ({
  createAppKit: vi.fn(),
  useDisconnect: () => ({ disconnect: vi.fn().mockRejectedValue(new TypeError('Mock disconnect error')) }),
}))

vi.mock('../src/components/ActionButtonList', () => ({
  ActionButtonList: () => <div data-testid="action-list" />,
}))

vi.mock('../src/components/InfoList', () => ({
  InfoList: () => <div data-testid="info-list" />,
}))

vi.mock('../src/config', () => ({
  projectId: 'test',
  metadata: {},
  networks: [],
  nativeHederaAdapter: {},
  eip155HederaAdapter: {},
  universalProvider: {
    on: vi.fn(),
    off: vi.fn(),
    client: { core: { pairing: { events: { on: vi.fn(), off: vi.fn() } } } },
    session: null as any,
  },
}))

import App from '../src/App'
import * as config from '../src/config'

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders header', () => {
    render(<App />)
    expect(
      screen.getByRole('heading', {
        name: /Hedera App Example using Reown AppKit and Hedera/i,
      }),
    ).toBeInTheDocument()
  })

  it('handles disconnect error when session has eip155 namespace', async () => {
    // Get the mocked universalProvider
    const mockUniversalProvider = (config as any).universalProvider
    
    // Setup: mock a session with eip155 namespace
    mockUniversalProvider.session = {
      namespaces: {
        eip155: {}
      }
    }
    
    // Setup: spy on console.error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    render(<App />)
    
    // Get the handleDisconnect function that was passed to the 'on' method
    const sessionDeleteHandler = mockUniversalProvider.on.mock.calls.find(
      (call: any) => call[0] === 'session_delete'
    )?.[1]
    
    expect(sessionDeleteHandler).toBeDefined()
    
    // Trigger the disconnect handler
    await sessionDeleteHandler()
    
    // Verify error was logged
    expect(consoleSpy).toHaveBeenCalledWith('Failed to auto disconnect:', expect.objectContaining({
      message: 'Mock disconnect error'
    }))
    
    consoleSpy.mockRestore()
  })
})
