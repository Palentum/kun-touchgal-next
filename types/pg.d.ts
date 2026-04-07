declare module 'pg' {
  export interface QueryResultRow {
    [column: string]: unknown
  }

  export interface QueryResult<R extends QueryResultRow = QueryResultRow> {
    rows: R[]
    rowCount: number | null
  }

  export interface PoolConfig {
    connectionString?: string
    max?: number
    idleTimeoutMillis?: number
    connectionTimeoutMillis?: number
  }

  export class PoolClient {
    query<R extends QueryResultRow = QueryResultRow>(
      text: string,
      values?: unknown[]
    ): Promise<QueryResult<R>>
    release(): void
  }

  export class Pool {
    constructor(config?: PoolConfig)
    query<R extends QueryResultRow = QueryResultRow>(
      text: string,
      values?: unknown[]
    ): Promise<QueryResult<R>>
    connect(): Promise<PoolClient>
    end(): Promise<void>
  }

  const pg: {
    Pool: typeof Pool
  }

  export default pg
}
