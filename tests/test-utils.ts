// Test utility types and functions
export type MockFunction = jest.Mock<any, any[]>

export interface MockedHederaProvider {
  hedera_getNodeAddresses: MockFunction
  hedera_signMessage: MockFunction
  hedera_signTransaction: MockFunction
  hedera_executeTransaction: MockFunction
  hedera_signAndExecuteTransaction: MockFunction
  hedera_signAndExecuteQuery: MockFunction
  rpcProviders?: {
    eip155?: {
      httpProviders?: Record<number, { request: MockFunction }>
    }
  }
}

export interface MockedEthereumProvider {
  request: MockFunction
  send: MockFunction
  sendTransaction: MockFunction
  signMessage: MockFunction
  signTransaction: MockFunction
  signTypedData: MockFunction
  _signMessage?: MockFunction
}

export const createMockHederaProvider = (): MockedHederaProvider => ({
  hedera_getNodeAddresses: jest.fn(),
  hedera_signMessage: jest.fn(),
  hedera_signTransaction: jest.fn(),
  hedera_executeTransaction: jest.fn(),
  hedera_signAndExecuteTransaction: jest.fn(),
  hedera_signAndExecuteQuery: jest.fn(),
})

export const createMockEthereumProvider = (): MockedEthereumProvider => ({
  request: jest.fn(),
  send: jest.fn(),
  sendTransaction: jest.fn(),
  signMessage: jest.fn(),
  signTransaction: jest.fn(),
  signTypedData: jest.fn(),
  _signMessage: jest.fn(),
})