const { TokenCreateTransaction, Client, TokenId, TransferTransaction, AccountId } = require("@hashgraph/sdk");

/**
 * Creates a mock USDC token using the provided Hedera client.
 *
 * @param {Client} client - The Hedera Client instance used to execute the transaction.
 * @returns {Promise<TokenId>} The newly created Token
 */
const createMockUSDC = async (client) => {
  const tokenCreateTx = new TokenCreateTransaction()
    .setTokenName("Mock USDC")
    .setTokenSymbol("USDC")
    .setTreasuryAccountId(client.operatorAccountId)
    .setInitialSupply(1000)

  const executeTx = await tokenCreateTx.execute(client)
  const txReceipt = await executeTx.getReceipt(client)
  return txReceipt.tokenId
};

/**
 * Transfers tokens from one account to another
 * 
 * @param {Client} client - The Hedera Client instance used to execute the transaction
 * @param {TokenId} tokenId - The ID of the token to transfer
 * @param {AccountId} fromAccountId - The account ID to transfer tokens from
 * @param {AccountId} toAccountId - The account ID to transfer tokens to
 * @param {number} amount - The amount of tokens to transfer
 * @returns {Promise<void>}
 */
const transferTokens = async (client, tokenId, fromAccountId, toAccountId, amount) => {
  const transferTx = new TransferTransaction()
    .addTokenTransfer(tokenId, fromAccountId, -amount)
    .addTokenTransfer(tokenId, toAccountId, amount)

  const executeTx = await transferTx.execute(client)
  await executeTx.getReceipt(client)
}

module.exports = {
  createMockUSDC,
  transferTokens
}
