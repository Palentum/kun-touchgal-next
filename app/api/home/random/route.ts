import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '~/prisma/index'

export const getRandomUniqueId = async () => {
  const totalArticles = await prisma.patch.count()
  if (totalArticles === 0) {
    return '暂无文章'
  }

  const randomIndex = Math.floor(Math.random() * totalArticles)
  const randomArticle = await prisma.patch.findMany({
    take: 1,
    skip: randomIndex
  })
  if (randomArticle.length === 0) {
    return '未查询到文章'
  }

  return { uniqueId: randomArticle[0].unique_id }
}

export const GET = async (req: NextRequest) => {
  const response = await getRandomUniqueId()
  return NextResponse.json(response)
}
