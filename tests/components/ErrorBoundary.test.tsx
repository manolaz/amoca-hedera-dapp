import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ErrorBoundary from '../../src/components/ErrorBoundary'

function ProblemChild() {
  throw new Error('Test error')
  return null
}

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Child</div>
      </ErrorBoundary>
    )
    expect(screen.getByText('Child')).toBeInTheDocument()
  })

  it('displays fallback UI when child throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong.')
    ;(console.error as unknown as { mockRestore: () => void }).mockRestore()
  })
})
