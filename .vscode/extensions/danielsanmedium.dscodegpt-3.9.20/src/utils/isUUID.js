function isUUID(s) {
  if (!s) return false
  if(typeof s !== 'string') s = String(s)
  s = s.toLowerCase()
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
  return regex.test(s)
}

module.exports = isUUID