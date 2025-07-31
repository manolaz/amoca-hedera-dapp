import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Modal } from '../../src/components/Modal'
import type { FieldConfig } from '../../src/utils/methodConfigs'

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

  it('closes on Escape key press', () => {
    const handleClose = vi.fn()
    render(
      <Modal isOpen onClose={handleClose} onSubmit={() => {}} title="Test" fields={fields} />
    )
    
    // Simulate Escape key press
    fireEvent.keyDown(document, { key: 'Escape' })
    
    expect(handleClose).toHaveBeenCalled()
  })

  it('closes when clicking overlay', () => {
    const handleClose = vi.fn()
    render(
      <Modal isOpen onClose={handleClose} onSubmit={() => {}} title="Test" fields={fields} />
    )
    
    // Click on the overlay (outside the modal content)
    const overlay = screen.getByText('Test').closest('.modal-overlay')
    fireEvent.click(overlay!)
    
    expect(handleClose).toHaveBeenCalled()
  })

  it('uses empty string when no default value and no stored value', () => {
    const fieldsWithoutDefault: FieldConfig[] = [
      { name: 'amount', label: 'Amount', type: 'text', required: false }
    ]
    
    render(
      <Modal isOpen onClose={() => {}} onSubmit={() => {}} title="Test" fields={fieldsWithoutDefault} />
    )
    
    const input = screen.getByLabelText('Amount') as HTMLInputElement
    expect(input.value).toBe('')
  })

  it('renders number input for number type fields', () => {
    const numberFields: FieldConfig[] = [
      { name: 'amount', label: 'Amount', type: 'number', defaultValue: '100', required: true }
    ]
    
    render(
      <Modal isOpen onClose={() => {}} onSubmit={() => {}} title="Test" fields={numberFields} />
    )
    
    const input = screen.getByLabelText('Amount') as HTMLInputElement
    expect(input.type).toBe('number')
  })

  it('shows loading state', () => {
    render(
      <Modal isOpen onClose={() => {}} onSubmit={() => {}} title="Test" fields={fields} isLoading={true} />
    )
    
    // Submit button should show "Loading..."
    expect(screen.getByRole('button', { name: 'Loading...' })).toBeInTheDocument()
    
    // Buttons and inputs should be disabled
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    expect(screen.getByLabelText('Message')).toBeDisabled()
  })

  it('does not close when clicking modal content', () => {
    const handleClose = vi.fn()
    render(
      <Modal isOpen onClose={handleClose} onSubmit={() => {}} title="Test" fields={fields} />
    )
    
    // Click on the modal content (not the overlay)
    const modalContent = screen.getByText('Test').closest('.modal-content')
    fireEvent.click(modalContent!)
    
    expect(handleClose).not.toHaveBeenCalled()
  })
})
