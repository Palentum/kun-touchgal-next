export const verifyReCAPTCHA = async (recaptchaToken: string) => {
  try {
    const recaptchaResponse = await fetch(
      `https://www.recaptcha.net/recaptcha/api/siteverify?secret=${process.env.KUN_RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`,
      { method: 'POST' }
    )
    const recaptchaData = await recaptchaResponse.json()

    if (!recaptchaData.success || recaptchaData.score < 0.5) {
      return false
    }
    return true
  } catch (error) {
    return false
  }
}
