import 'dotenv/config'
import pg, { type PoolClient } from 'pg'

const LEGACY_COLUMNS = [
  'storage',
  'size',
  'code',
  'password',
  'hash',
  'content'
] as const

type LegacyColumn = (typeof LEGACY_COLUMNS)[number]

interface LegacyPatchResourceRow {
  [key: string]: unknown
  id: number
  download: number
  storage: string | null
  size: string | null
  code: string | null
  password: string | null
  hash: string | null
  content: string | null
}

const ensurePatchResourceLinkTable = async (client: PoolClient) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS patch_resource_link (
      id SERIAL PRIMARY KEY,
      storage VARCHAR(107) NOT NULL,
      size VARCHAR(107) NOT NULL DEFAULT '',
      code VARCHAR(1007) NOT NULL DEFAULT '',
      password VARCHAR(1007) NOT NULL DEFAULT '',
      hash TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      download INTEGER NOT NULL DEFAULT 0,
      resource_id INTEGER NOT NULL REFERENCES patch_resource(id) ON DELETE CASCADE ON UPDATE NO ACTION,
      created TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await client.query(`
    CREATE INDEX IF NOT EXISTS patch_resource_link_resource_id_sort_order_idx
    ON patch_resource_link (resource_id, sort_order)
  `)
}

const getExistingLegacyColumns = async (client: PoolClient) => {
  const result = await client.query<{ column_name: string }>(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'patch_resource'
        AND column_name = ANY($1::text[])
    `,
    [LEGACY_COLUMNS]
  )

  return new Set(
    result.rows.map(
      (row: { column_name: string }) => row.column_name as LegacyColumn
    )
  )
}

const parseLegacyContents = (content: string | null) => {
  const links = (content ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  return links.length ? links : ['']
}

const dropLegacyColumns = async (client: PoolClient) => {
  for (const column of LEGACY_COLUMNS) {
    await client.query(`ALTER TABLE patch_resource DROP COLUMN ${column}`)
  }
}

async function migratePatchResourceLinks() {
  const connectionString = process.env.KUN_DATABASE_URL
  if (!connectionString) {
    throw new Error('缺少环境变量 KUN_DATABASE_URL')
  }

  const pool = new pg.Pool({ connectionString })
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    await ensurePatchResourceLinkTable(client)

    const existingLegacyColumns = await getExistingLegacyColumns(client)

    if (existingLegacyColumns.size === 0) {
      console.log('patch_resource 旧链接字段已不存在，本次无需迁移。')
      await client.query('COMMIT')
      return
    }

    if (existingLegacyColumns.size !== LEGACY_COLUMNS.length) {
      throw new Error(
        `patch_resource 旧字段不完整，当前仅检测到: ${Array.from(
          existingLegacyColumns
        ).join(', ')}`
      )
    }

    const resources = await client.query<LegacyPatchResourceRow>(`
      SELECT id, download, storage, size, code, password, hash, content
      FROM patch_resource
      ORDER BY id ASC
    `)

    const resourceIds = resources.rows.map(
      (row: LegacyPatchResourceRow) => row.id
    )
    if (resourceIds.length) {
      await client.query(
        `
          DELETE FROM patch_resource_link
          WHERE resource_id = ANY($1::int[])
        `,
        [resourceIds]
      )
    }

    let linkCount = 0
    let multiLinkResourceCount = 0
    let emptyLinkResourceCount = 0

    for (const resource of resources.rows) {
      const contents = parseLegacyContents(resource.content)
      if (contents.length > 1) {
        multiLinkResourceCount++
      }
      if (contents.length === 1 && !contents[0]) {
        emptyLinkResourceCount++
      }

      for (const [index, content] of contents.entries()) {
        await client.query(
          `
            INSERT INTO patch_resource_link (
              storage,
              size,
              code,
              password,
              hash,
              content,
              sort_order,
              download,
              resource_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `,
          [
            resource.storage ?? '',
            resource.size ?? '',
            resource.code ?? '',
            resource.password ?? '',
            resource.hash ?? '',
            content,
            index,
            0,
            resource.id
          ]
        )
        linkCount++
      }
    }

    await dropLegacyColumns(client)
    await client.query('COMMIT')

    console.log(`迁移完成:`)
    console.log(`  资源总数: ${resources.rowCount}`)
    console.log(`  创建链接数: ${linkCount}`)
    console.log(`  多链接资源数: ${multiLinkResourceCount}`)
    console.log(`  空链接资源数: ${emptyLinkResourceCount}`)
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

migratePatchResourceLinks().catch((error) => {
  console.error('Migration failed:', error)
  process.exitCode = 1
})
