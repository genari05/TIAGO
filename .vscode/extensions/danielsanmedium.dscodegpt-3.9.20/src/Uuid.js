let counter = 0
function nextId () {
  return `${counter++}`
}

module.exports = { nextId }
