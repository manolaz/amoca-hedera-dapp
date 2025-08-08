const readline = require('readline')

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

/**
 * Prompts the user for input and returns their response
 * @param {string} question - The question to ask the user
 * @returns {Promise<string>} The user's response
 */
const getUserInput = (question) => {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer)
        })
    })
}

/**
 * Closes the readline interface
 */
const closeReadline = () => {
    rl.close()
}

module.exports = {
    getUserInput,
    closeReadline
} 