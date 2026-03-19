export const BANGUMI_API_BASE = 'https://api.bgm.tv'

export const BANGUMI_USER_AGENT = 'touchgal/1.0 (https://www.touchgal.top)'

export const BANGUMI_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'User-Agent': BANGUMI_USER_AGENT,
  Authorization: `Bearer ${process.env.KUN_BANGUMI_TOKEN}`
}
