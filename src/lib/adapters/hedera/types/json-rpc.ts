export interface EthFilter {
  address?: string
  topics?: Array<string | null>
  fromBlock?: string
  toBlock?: string
  blockHash?: string
}
