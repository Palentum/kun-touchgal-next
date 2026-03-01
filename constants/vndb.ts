export const VNDB_API_BASE = 'https://vndbapi.arnebiae.com/kana'
export const VNDB_WEB_BASE = 'https://vndb.org'

export const VNDB_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

export const VNDB_HEADERS: Record<string, string> = {
  'User-Agent': VNDB_USER_AGENT,
  'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8,zh-CN;q=0.7,zh;q=0.6'
}

export const VNDB_API_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  ...VNDB_HEADERS
}
