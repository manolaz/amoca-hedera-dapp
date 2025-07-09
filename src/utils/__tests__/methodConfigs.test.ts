import { describe, it, expect } from 'vitest'
import { getMethodConfig, ethMethodConfigs, hederaMethodConfigs } from '../methodConfigs'

describe('getMethodConfig', () => {
  it('returns eth method configuration', () => {
    const config = getMethodConfig('eth_signTransaction')
    expect(config).toEqual(ethMethodConfigs.eth_signTransaction)
  })

  it('returns hedera method configuration', () => {
    const config = getMethodConfig('hedera_signTransaction')
    expect(config).toEqual(hederaMethodConfigs.hedera_signTransaction)
  })

  it('returns undefined for unknown method', () => {
    const config = getMethodConfig('unknown_method')
    expect(config).toBeUndefined()
  })
})
