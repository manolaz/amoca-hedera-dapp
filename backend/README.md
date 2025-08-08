# Hedera Messaging Application

This application demonstrates a messaging system built on the Hedera network with custom token fees and AI-powered responses.

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A Hedera testnet account

## Setup

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Set up your environment variables:
   - Copy the `env.sample` file to create a new `.env` file:
   ```bash
   cp env.sample .env
   ```
   - Fill in your `.env` file with your credentials:
     - `OPERATOR_ADDRESS`: Your Hedera account address
     - `OPERATOR_KEY`: Your Hedera private key
     - `OPENAI_API_KEY`: Your OpenAI API key

## Running the Application

1. Start the main application to create a new topic:
```bash
node index.js
```
This will:
- Initialize a Hedera client
- Create a new fee collection account
- Create a mock USDC token
- Set up custom fees
- Create a new topic
- Start a message submission loop

Take note of the Topic ID that is created (it will be displayed in the console).

2. In a new terminal window, start the AI agent with the topic ID:
```bash
node agent.js <TOPIC_ID>
```
Replace `<TOPIC_ID>` with the Topic ID from step 1.

## Usage

- In the first terminal (running index.js), you can type messages that will be submitted to the Hedera network
- The agent (running in the second terminal) will receive these messages and respond with AI-generated content
- Type 'exit' in the message prompt to quit the application

## Notes

- The application uses the Hedera testnet
- Each message submission requires a fee of 5 mock USDC tokens
- The AI agent uses GPT-4 to generate responses to messages

## Environment Variables

```env
OPERATOR_ADDRESS=0x...      # Your Hedera account address
OPERATOR_KEY=0x...         # Your Hedera private key
OPENAI_API_KEY=sk...      # Your OpenAI API key
``` 