const dotenv = require('dotenv')
const getClient = require('./utils/client')
const { TopicMessageQuery } = require('@hashgraph/sdk')
const OpenAI = require('openai')

dotenv.config()

const main = async () => {
    // Get topic ID from command line argument
    const topicId = process.argv[2]
    if (!topicId) {
        console.error('Please provide a topic ID as a command line argument')
        console.error('Usage: node agent.js 0.0.1234')
        process.exit(1)
    }

    console.log('Initializing Hedera client...')
    const client = await getClient()

    // Initialize OpenAI client
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    })

    console.log(`Subscribing to topic ${topicId}...`)

    // Create a new topic message query
    new TopicMessageQuery()
        .setTopicId(topicId)
        .subscribe(client, async (message) => {
            try {
                // Convert message bytes to string
                const messageText = message.contents.toString()
                console.log(`Received message: ${messageText}`)

                // Generate response using OpenAI
                const completion = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "user", content: messageText }
                    ],
                })

                const response = completion.choices[0].message.content
                console.log(`AI Response: ${response}`)
            } catch (error) {
                console.error('Error processing message:', error)
            }
        })
}

main()
    .then(() => {
        // Keep the process running
        process.stdin.resume()
    })
    .catch(err => {
        console.error(err)
        process.exit(1)
    }) 