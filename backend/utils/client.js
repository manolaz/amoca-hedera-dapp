const { Client, AccountId, PrivateKey } = require("@hashgraph/sdk")

let client = null

const getClient = async () => {
  if (!process.env.OPERATOR_ADDRESS || !process.env.OPERATOR_KEY) {
    throw new Error("Set EVM Address and Private Key in .env")
  }
  if (client) return client
  const testnetClient = Client.forTestnet()
  const accountId = await AccountId.fromEvmAddress(0, 0, process.env.OPERATOR_ADDRESS).populateAccountNum(testnetClient)
  const privateKey = PrivateKey.fromStringECDSA(process.env.OPERATOR_KEY)
  client = testnetClient.setOperator(accountId, privateKey)
  return client
}

module.exports = getClient
