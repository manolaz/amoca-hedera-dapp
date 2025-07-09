import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Modal } from '../Modal'
import type { FieldConfig } from '../../utils/methodConfigs'

beforeEach(() => {
  localStorage.clear()
})

describe('Modal', () => {
  const fields: FieldConfig[] = [
    { name: 'message', label: 'Message', type: 'text', defaultValue: 'hello', required: true }
  ]

  it('renders default values when open', () => {
    render(
      <Modal isOpen onClose={() => {}} onSubmit={() => {}} title="Test" fields={fields} />
    )
    const input = screen.getByLabelText('Message') as HTMLInputElement
    expect(input.value).toBe('hello')
  })

  it('submits values and saves to localStorage', () => {
    const handleSubmit = vi.fn()
    render(
      <Modal isOpen onClose={() => {}} onSubmit={handleSubmit} title="Test" fields={fields} />
    )
    const input = screen.getByLabelText('Message')
    fireEvent.change(input, { target: { value: 'world' } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    expect(handleSubmit).toHaveBeenCalledWith({ message: 'world' })
    expect(localStorage.getItem('param_message')).toBe('world')
  })

  it('renders nothing when closed', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={() => {}} onSubmit={() => {}} title="Test" fields={fields} />
    )
    expect(container.firstChild).toBeNull()
  })
})
