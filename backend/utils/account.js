const { AccountCreateTransaction, PrivateKey, Hbar } = require('@hashgraph/sdk')

const createAccount = async (client) => {
    // Create a new ECDSA private key
    const privateKey = PrivateKey.generateECDSA()

    // Create a new account with 20 HBAR
    const accountCreateTx = new AccountCreateTransaction()
        .setECDSAKeyWithAlias(privateKey)
        .setInitialBalance(new Hbar(20))
        .setMaxAutomaticTokenAssociations(-1) // Set to a high number for unlimited associations

    const accountCreateTxResponse = await accountCreateTx.execute(client)
    const accountCreateReceipt = await accountCreateTxResponse.getReceipt(client)
    const newAccountId = accountCreateReceipt.accountId

    return {
        accountId: newAccountId,
        privateKey: privateKey,
    }
}

module.exports = createAccount 