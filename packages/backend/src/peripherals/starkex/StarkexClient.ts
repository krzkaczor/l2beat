import { getErrorMessage, HttpClient, Logger } from '@l2beat/common'
import { StarkexProduct } from '@l2beat/config'
import { json } from '@l2beat/types'

import { parseStarkexApiResponse } from './parseStarkexApiResponse'

export class StarkexClient {
  constructor(
    private starkexApiUrl: string,
    private starkexApiKey: string,
    private httpClient: HttpClient,
    private logger: Logger,
  ) {
    this.logger = this.logger.for(this)
  }

  async getDailyCount(day: number, product: StarkexProduct): Promise<number> {
    const body = {
      day_start: day,
      day_end: day + 1,
      product,
      tx_type: '_all',
      token_id: '_all',
    }

    const response = await this.call(body)
    return response.count
  }

  async call(body: json) {
    const start = Date.now()
    const { httpResponse, error } = await this.httpClient
      .fetch(this.starkexApiUrl, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': this.starkexApiKey,
        },
        body: JSON.stringify(body),
        timeout: 10_000,
      })
      .then(
        (httpResponse) => ({ httpResponse, error: undefined }),
        (error: unknown) => ({ httpResponse: undefined, error }),
      )
    const timeMs = Date.now() - start

    if (!httpResponse) {
      const message = getErrorMessage(error)
      this.recordError(timeMs, message)
      throw error
    }

    const text = await httpResponse.text()

    if (!httpResponse.ok) {
      this.recordError(timeMs, text)
      throw new Error(
        `Server responded with non-2XX result: ${httpResponse.status} ${httpResponse.statusText}`,
      )
    }

    const starkexApiResponse = parseStarkexApiResponse(text)

    this.logger.debug({ type: 'success', timeMs })

    return starkexApiResponse
  }

  private recordError(timeMs: number, message: string) {
    this.logger.debug({ type: 'error', message, timeMs })
  }
}
