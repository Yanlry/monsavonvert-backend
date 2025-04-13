function checkBody(body, requiredFields) {
  for (const field of requiredFields) {
    if (!body[field] || body[field].trim() === '') {
      return false;
    }
  }
  return true;
}

module.exports = { checkBody };