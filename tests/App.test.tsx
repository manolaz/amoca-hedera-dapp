import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'

vi.mock('@reown/appkit/react', () => ({
  createAppKit: vi.fn(),
  useDisconnect: () => ({ disconnect: vi.fn() }),
}))

vi.mock('../src/components/ActionButtonList', () => ({
  ActionButtonList: () => <div data-testid="action-list" />,
}))

vi.mock('../src/components/InfoList', () => ({
  InfoList: () => <div data-testid="info-list" />,
}))

vi.mock('../src/config', () => {
  const events = { on: vi.fn(), off: vi.fn() }
  return {
    projectId: 'test',
    metadata: {},
    networks: [],
    nativeHederaAdapter: {},
    eip155HederaAdapter: {},
    universalProvider: { on: vi.fn(), off: vi.fn(), client: { core: { pairing: { events } } } },
  }
})

import App from '../src/App'

describe('App', () => {
  it('renders header', () => {
    render(<App />)
    expect(
      screen.getByRole('heading', {
        name: /Hedera App Example using Reown AppKit and Hedera/i,
      }),
    ).toBeInTheDocument()
  })
})
