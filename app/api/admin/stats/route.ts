import { NextRequest, NextResponse } from 'next/server'
import type { AdminStats } from '~/types/api/admin'
import {
  getCommentStats,
  getGalgameStats,
  getPatchResourceStats,
  getUserStats
} from './stats'

export const getAdminStats = async () => {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const [
    todayUserStats,
    yesterdayUserStats,
    todayGalgameStats,
    todayPatchResourceStats,
    todayComments,
    yesterdayComments
  ] = await Promise.all([
    getUserStats(today),
    getUserStats(yesterday),
    getGalgameStats(today),
    getPatchResourceStats(today),
    getCommentStats(today),
    getCommentStats(yesterday)
  ])

  const stats: AdminStats[] = [
    {
      title: 'user',
      value: todayUserStats.totalUsers.toString(),
      change: todayUserStats.newUsers
    },
    {
      title: 'active',
      value: todayUserStats.activeUsers.toString(),
      change: todayUserStats.activeUsers - yesterdayUserStats.activeUsers
    },
    {
      title: 'galgame',
      value: todayGalgameStats.totalGalgames.toString(),
      change: todayGalgameStats.newGalgames
    },
    {
      title: 'patch',
      value: todayPatchResourceStats.totalPatches.toString(),
      change: todayPatchResourceStats.newPatches
    },
    {
      title: 'comment',
      value: todayComments.toString(),
      change: todayComments - yesterdayComments
    }
  ]

  return stats
}

export async function GET(req: NextRequest) {
  const stats = await getAdminStats()
  return NextResponse.json(stats)
}
