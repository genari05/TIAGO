
function createLogger (outputChannel) {
  return (message) => {
    const title = new Date().toLocaleTimeString()
    outputChannel.appendLine(`[${title}] ${message}`)
  }
}

module.exports = createLogger
