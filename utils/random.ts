export const randomNum = (lowerValue: number, upperValue: number) => {
  return Math.floor(Math.random() * (upperValue - lowerValue + 1) + lowerValue)
}

export const generateRandomString = (length: number) => {
  const charset = '023456789abcdefghjkmnopqrstuvwxyz'
  let code = ''
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length)
    code += charset[randomIndex]
  }
  return code.toUpperCase()
}
