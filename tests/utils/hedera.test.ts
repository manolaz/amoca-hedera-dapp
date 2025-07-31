import { describe, it, expect } from 'vitest'
import { toEvmAddress } from '../../src/utils/hedera'

describe('toEvmAddress', () => {
  it('converts account ID to evm address', () => {
    expect(toEvmAddress('0.0.42')).toBe('0x000000000000000000000000000000000000002a')
  })

  it('returns lowercase evm address as is', () => {
    expect(toEvmAddress('0xAbC')).toBe('0xabc')
  })

  it('returns input for invalid format', () => {
    expect(toEvmAddress('foo')).toBe('foo')
  })

  it('returns input when BigInt conversion fails', () => {
    expect(toEvmAddress('0.0.invalid')).toBe('0.0.invalid')
  })
})
