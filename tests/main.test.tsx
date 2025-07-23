import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { StrictMode } from 'react'

let AppMock: () => JSX.Element
let ErrorBoundaryMock: ({ children }: { children: React.ReactNode }) => JSX.Element
let createRootMock: ReturnType<typeof vi.fn>
let renderMock: ReturnType<typeof vi.fn>

vi.mock('../src/App.tsx', () => {
  AppMock = () => <div data-testid="app" />
  return { __esModule: true, default: AppMock }
})

vi.mock('../src/components/ErrorBoundary', () => {
  ErrorBoundaryMock = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="error-boundary">{children}</div>
  )
  return { __esModule: true, default: ErrorBoundaryMock }
})

vi.mock('react-dom/client', () => ({
  createRoot: (...args: [HTMLElement]) => createRootMock(...args),
}))

describe('main entry', () => {
  const rootId = 'root'

  beforeEach(() => {
    document.body.innerHTML = `<div id="${rootId}"></div>`
    renderMock = vi.fn()
    createRootMock = vi.fn(() => ({ render: renderMock }))
  })

  afterEach(() => {
    vi.resetModules()
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('creates root and renders wrapped App', async () => {
    await import('../src/main')

    const rootElement = document.getElementById(rootId)
    expect(createRootMock).toHaveBeenCalledWith(rootElement)
    expect(renderMock).toHaveBeenCalledTimes(1)

    const element = renderMock.mock.calls[0][0]
    expect(element.type).toBe(StrictMode)

    const errorBoundaryElement = element.props.children
    expect(errorBoundaryElement.type).toBe(ErrorBoundaryMock)
    expect(errorBoundaryElement.props.children.type).toBe(AppMock)
  })
})
