import {
  DomainRestrictedSignatureRequest,
  ErrorMessage,
  ErrorType,
  SignMessageRequest,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Response as FetchResponse } from 'node-fetch'
import { OdisConfig } from '../config'
import { CombineAbstract } from './combine.abstract'
import { IOAbstract } from './io.abstract'
import { Session } from './session'

export type OdisSignatureRequest = SignMessageRequest | DomainRestrictedSignatureRequest

// tslint:disable-next-line: max-classes-per-file
export abstract class SignAbstract<R extends OdisSignatureRequest> extends CombineAbstract<R> {
  constructor(readonly config: OdisConfig, readonly io: IOAbstract<R>) {
    super(config, io)
  }

  protected async receiveSuccess(
    signerResponse: FetchResponse,
    url: string,
    session: Session<R>
  ): Promise<void> {
    const responseKeyVersion = this.io.getResponseKeyVersion(signerResponse, session.logger)
    const requestKeyVersion =
      this.io.getRequestKeyVersion(session.request, session.logger) ?? this.config.keys.version

    if (responseKeyVersion !== requestKeyVersion) {
      // TODO(Alec)
      throw new Error(ErrorMessage.INVALID_KEY_VERSION_RESPONSE)
    }

    const status: number = signerResponse.status
    const data: string = await signerResponse.text()
    session.logger.info({ url, res: data, status }, 'received OK response from signer')

    // TODO(Alec): Move this up one level
    const res = this.io.validateSignerResponse(data, url, session)

    if (!res.success) {
      throw new Error('DO NOT MERGE: Add error message') // TODO(Alec)
    }

    session.responses.push({ url, res, status })

    session.logger.info({ signer: url }, 'Add signature')
    const signatureAdditionStart = Date.now()
    session.crypto.addSignature({ url, signature: res.signature })
    session.logger.info(
      {
        signer: url,
        hasSufficientSignatures: session.crypto.hasSufficientSignatures(),
        additionLatency: Date.now() - signatureAdditionStart,
      },
      'Added signature'
    )
    // Send response immediately once we cross threshold
    // BLS threshold signatures can be combined without all partial signatures
    if (session.crypto.hasSufficientSignatures()) {
      try {
        await session.crypto.combinePartialBlindedSignatures(
          this.parseBlindedMessage(session.request.body)
        )
        // Close outstanding requests
        session.controller.abort()
      } catch {
        // One or more signatures failed verification and were discarded.
        // Error has already been logged, continue to collect signatures.
      }
    }
  }

  protected handleMissingSignatures(session: Session<R>) {
    let error: ErrorType = ErrorMessage.NOT_ENOUGH_PARTIAL_SIGNATURES
    const majorityErrorCode = session.getMajorityErrorCode()
    if (majorityErrorCode === 403 || majorityErrorCode === 429) {
      error = WarningMessage.EXCEEDED_QUOTA
    }
    this.io.sendFailure(error, majorityErrorCode ?? 500, session.response, session.logger)
  }

  protected abstract parseBlindedMessage(req: OdisSignatureRequest): string
}
