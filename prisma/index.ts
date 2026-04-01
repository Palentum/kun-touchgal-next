import 'dotenv/config'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/prisma/client'

const connectionString = `${process.env.KUN_DATABASE_URL}`

const pool = new pg.Pool({
  connectionString,
  max: 30,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

export { prisma }
