import { ProjectId } from '@l2beat/types'

import { AggregateReportRepository } from '../../peripherals/database/AggregateReportRepository'
import { asNumber } from './tvl/asNumber'

export class DydxController {
  constructor(private aggregateReportsRepository: AggregateReportRepository) {}

  async getTvl(): Promise<number | undefined> {
    const report = await this.aggregateReportsRepository.findLatest(
      ProjectId('dydx'),
    )

    return report ? asNumber(report.tvlUsd, 2) : undefined
  }
}
