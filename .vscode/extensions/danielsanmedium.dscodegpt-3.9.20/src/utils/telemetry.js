const axios = require('axios')
const { v4: uuidv4 } = require('uuid')

async function sendEvent (event, data, userId, accessToken, signedDistinctId) {
  const body = [{
    event,
    properties: {
      ...data,
      source: 'vscode',
      time: Date.now(),
      distinct_id: userId,
      $insert_id: uuidv4()
    }
  }]

  const response = await axios.post('https://api.codegpt.co/api/v1/telemetry', body, {
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(signedDistinctId ? { 'X-Signed-Distinct-Id': signedDistinctId } : {})
    }
  }).catch((e) => {
    console.error(e)
  })
  return response.data
}

module.exports = { sendEvent }
