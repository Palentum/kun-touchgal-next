import { kunMoyuMoe } from '~/config/moyu-moe'

interface IndexNow {
  host: string
  key: string
  keyLocation: string
  urlList: string[]
}

export const postToIndexNow = async (url: string) => {
  const requestData: IndexNow = {
    host: kunMoyuMoe.domain.main,
    key: process.env.KUN_VISUAL_NOVEL_INDEX_NOW_KEY || '',
    keyLocation: `${kunMoyuMoe.domain.main}/${process.env.KUN_VISUAL_NOVEL_INDEX_NOW_KEY}.txt`,
    urlList: [url]
  }

  await fetch('https://www.bing.com/indexnow', {
    method: 'POST',
    headers: { 'User-Agent': kunMoyuMoe.titleShort },
    body: JSON.stringify(requestData)
  })
}
