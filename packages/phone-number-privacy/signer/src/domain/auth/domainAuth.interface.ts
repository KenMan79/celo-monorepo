import { DomainRequest } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { DomainState } from '../../database/models/domainState'
import { Endpoints } from '../../server'

export interface IDomainAuthService {
  authCheck(domainRequest: DomainRequest, endpoint: Endpoints, logger: Logger): boolean
  nonceCheck(domainRequest: DomainRequest, domainState: DomainState, logger: Logger): boolean
}
