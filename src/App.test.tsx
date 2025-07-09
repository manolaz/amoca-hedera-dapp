import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'

vi.mock('@reown/appkit/react', () => ({
  createAppKit: vi.fn(),
}))

vi.mock('./components/ActionButtonList', () => ({
  ActionButtonList: () => <div data-testid="action-list" />,
}))

vi.mock('./components/InfoList', () => ({
  InfoList: () => <div data-testid="info-list" />,
}))

vi.mock('./config', () => ({
  projectId: 'test',
  metadata: {},
  networks: [],
  nativeHederaAdapter: {},
  eip155HederaAdapter: {},
  universalProvider: {},
}))

import App from './App'

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
