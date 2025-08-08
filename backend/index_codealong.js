const dotenv = require('dotenv')
const getClient = require('./utils/client')
const { TopicCreateTransaction, CustomFixedFee, Client, TopicMessageSubmitTransaction } = require('@hashgraph/sdk')
const { createMockUSDC, transferTokens } = require('./utils/token')
const createAccount = require('./utils/account')
const { getUserInput, closeReadline } = require('./utils/message')
dotenv.config()

const main = async () => {
  console.log('Initializing Hedera client...')
  const client = await getClient()

  console.log('Creating new account for fee payer...')
  const newAccount = await createAccount(client)
  console.log(`Created new fee payer account with ID: ${newAccount.accountId}`)

  console.log('Creating mock USDC token...')
  const mockUSDC = await createMockUSDC(client)
  console.log(`Mock USDC token created with ID: ${mockUSDC}`)

  // Transfer some tokens to the fee payer account
  console.log('Transferring tokens to fee payer account...')
  await transferTokens(client, mockUSDC, client.operatorAccountId, newAccount.accountId, 100)
  console.log('Transferred 100 tokens to fee payer account')

  console.log('Setting up custom fee configuration...')

  // 1. Create a custom fee configuration

  // 2. Create a new topic with the custom fee configuration

  console.log('\nMessage submission loop started. Type "exit" to quit.')
  console.log('----------------------------------------')

  while (true) {
    const message = await getUserInput('Enter your message (or "exit" to quit): ')

    if (message.toLowerCase() === 'exit') {
      console.log('Exiting message submission loop...')
      break
    }

    if (message.trim() === '') {
      console.log('Message cannot be empty. Please try again.')
      continue
    }

    try {
      // 3. Submit a message to the topic
    } catch (error) {
      console.error('Error submitting message:', error.message)
    }
  }

  // Close the readline interface
  closeReadline()
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
