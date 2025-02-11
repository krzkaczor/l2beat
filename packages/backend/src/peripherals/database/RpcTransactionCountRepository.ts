import { Logger } from '@l2beat/common'
import { ProjectId, UnixTime } from '@l2beat/types'
import { RpcTransactionCountRow } from 'knex/types/tables'
import _ from 'lodash'

import { assert } from '../../tools/assert'
import { BaseRepository } from './shared/BaseRepository'
import { Database } from './shared/Database'

export interface RpcTransactionCountRecord {
  timestamp: UnixTime
  projectId: ProjectId
  blockNumber: number
  count: number
}
interface RawBlockNumberQueryResult {
  rows: {
    block_number: number
  }[]
}

export class RpcTransactionCountRepository extends BaseRepository {
  constructor(database: Database, logger: Logger) {
    super(database, logger)

    /* eslint-disable @typescript-eslint/unbound-method */

    this.add = this.wrapAdd(this.add)
    this.addMany = this.wrapAddMany(this.addMany)
    this.deleteAll = this.wrapDelete(this.deleteAll)
    this.getDailyTransactionCount = this.wrapGet(this.getDailyTransactionCount)

    /* eslint-enable @typescript-eslint/unbound-method */
  }

  async add(record: RpcTransactionCountRecord) {
    const knex = await this.knex()
    const row = toRow(record)
    await knex('transactions.rpc').insert(row)
    return `${row.project_id}-${row.block_number}`
  }

  async addMany(records: RpcTransactionCountRecord[]) {
    const knex = await this.knex()
    const rows = records.map(toRow)
    await knex('transactions.rpc').insert(rows)
    return rows.length
  }

  // Returns an array of half open intervals [) that include all missing block numbers
  async getMissingRangesByProject(projectId: ProjectId) {
    const knex = await this.knex()

    const noNext = (await knex.raw(
      `
      WITH 
        project_blocks AS (
          SELECT * FROM transactions.rpc WHERE project_id=?
        )
      SELECT * 
      FROM (
        SELECT project_blocks.block_number 
        FROM project_blocks 
        LEFT JOIN project_blocks b2 ON project_blocks.block_number  = b2.block_number - 1
        WHERE b2.block_number IS NULL) AS no_next
      ORDER BY block_number ASC
    `,
      projectId.toString(),
    )) as unknown as RawBlockNumberQueryResult

    const noPrev = (await knex.raw(
      `
      WITH 
          project_blocks AS (
            SELECT * FROM transactions.rpc WHERE project_id=?
          )
        SELECT * 
        FROM (
          SELECT project_blocks.block_number 
          FROM project_blocks 
          LEFT JOIN project_blocks b2 ON project_blocks.block_number = b2.block_number + 1
          WHERE b2.block_number IS NULL) AS no_prev
        ORDER BY block_number ASC
    `,
      projectId.toString(),
    )) as unknown as RawBlockNumberQueryResult

    const noPrevBlockNumbers = noPrev.rows.map((row) => row.block_number)
    const noNextBlockNumbers = noNext.rows.map((row) => row.block_number + 1)

    noPrevBlockNumbers.push(Infinity)
    noNextBlockNumbers.unshift(-Infinity)

    assert(noNextBlockNumbers.length === noPrevBlockNumbers.length)

    return _.zip(noNextBlockNumbers, noPrevBlockNumbers) as [number, number][]
  }

  async getDailyTransactionCount(
    projectId: ProjectId,
  ): Promise<{ timestamp: UnixTime; count: number }[]> {
    const knex = await this.knex()
    const { rows } = (await knex.raw(
      `
      SELECT
        date_trunc('day', unix_timestamp, 'UTC') AS unix_timestamp,
        sum(count) as count
      FROM
        transactions.rpc
      WHERE
        project_id = ?
      GROUP BY
        project_id,
        date_trunc('day', unix_timestamp, 'UTC')
    `,
      projectId.toString(),
    )) as unknown as {
      rows: Pick<RpcTransactionCountRow, 'unix_timestamp' | 'count'>[]
    }

    return rows.map((r) => ({
      timestamp: UnixTime.fromDate(r.unix_timestamp),
      count: Number(r.count),
    }))
  }

  async deleteAll() {
    const knex = await this.knex()
    return await knex('transactions.rpc').delete()
  }
}

function toRow(record: RpcTransactionCountRecord): RpcTransactionCountRow {
  return {
    unix_timestamp: record.timestamp.toDate(),
    project_id: record.projectId.toString(),
    block_number: record.blockNumber,
    count: record.count,
  }
}
