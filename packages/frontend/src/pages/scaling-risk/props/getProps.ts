import { TvlApiResponse } from '@l2beat/types'

import { Config } from '../../../build/config'
import { getFooterProps, getNavbarProps } from '../../../components'
import { getIncludedProjects } from '../../../utils/getIncludedProjects'
import { orderByTvl } from '../../../utils/orderByTvl'
import { Wrapped } from '../../Page'
import { ScalingRiskPageProps } from '../view/ScalingRiskPage'
import { getPageMetadata } from './getPageMetadata'
import { getRiskView } from './getRiskView'

export function getProps(
  config: Config,
  tvlApiResponse: TvlApiResponse,
): Wrapped<ScalingRiskPageProps> {
  const included = getIncludedProjects(config.layer2s, tvlApiResponse)
  const ordering = orderByTvl(included, tvlApiResponse)

  return {
    props: {
      navbar: getNavbarProps(config),
      riskView: getRiskView(ordering),
      footer: getFooterProps(config),
      showActivity: config.features.activity,
    },
    wrapper: {
      metadata: getPageMetadata(),
    },
  }
}
