/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.
 * Gates Foundation
 - Murthy Kakarlamudi murthy@modusbox.com
 --------------
 ******/

const Handler = require('./handler')
const Enum = require('@mojaloop/central-services-shared').Enum
const tags = ['api', 'metadata', Enum.Tags.RouteTags.SAMPLED]
const BaseJoi = require('@hapi/joi').extend(require('joi-currency-code'))
const Joi = BaseJoi.extend(require('@hapi/joi-date'))

module.exports = [
  {
    method: 'GET',
    path: '/payeefsp/',
    handler: Handler.metadata,
    options: {
      id: `simulator_${__dirname.split('/').pop()}_metadata`,
      tags: tags,
      description: 'Metadata'
    }
  },
  {
    method: 'PUT',
    path: '/payeefsp/participants/{type}/{id}',
    handler: Handler.putParticipantsByTypeId,
    options: {
      id: `simulator_${__dirname.split('/').pop()}_putParticipantsByTypeId`,
      tags: tags,
      description: 'Callback for adding participant'
    }
  },
  {
    method: 'POST',
    path: '/payeefsp/parties/{type}/{id}',
    handler: Handler.postPartiesByTypeAndId,
    config: {
      id: `simulator_${__dirname.split('/').pop()}_postPartiesByTypeAndId`,
      tags: tags,
      auth: null,
      description: 'Transfer API.',
      payload: {
        failAction: 'error',
        output: 'data'
      }
    }
  },
  {
    method: 'GET',
    path: '/payeefsp/parties/{type}/{id}',
    handler: Handler.getPartiesByTypeAndId,
    options: {
      id: `simulator_${__dirname.split('/').pop()}_getPartiesByTypeAndId`,
      tags: tags,
      description: 'Add users to payer simulator',
      validate: {
        headers: Joi.object({
          accept: Joi.string().optional().regex(/application\/vnd.interoperability[.]/),
          'content-type': Joi.string().required().regex(/application\/vnd.interoperability[.]/),
          date: Joi.date().format('ddd, D MMM YYYY H:mm:ss [GMT]').required(),
          'x-forwarded-for': Joi.string().optional(),
          'fspiop-source': Joi.string().required(),
          'fspiop-destination': Joi.string().optional(),
          'fspiop-encryption': Joi.string().optional(),
          'fspiop-signature': Joi.string().optional(),
          'fspiop-uri': Joi.string().optional(),
          'fspiop-http-method': Joi.string().optional(),
          traceparent: Joi.string().optional(),
          tracestate: Joi.string().optional()
        }).unknown(false).options({ stripUnknown: true }),
        failAction: (request, h, err) => { throw err }
      }
    }
  },
  {
    method: 'POST',
    path: '/payeefsp/quotes',
    handler: Handler.postQuotes,
    options: {
      id: `simulator_${__dirname.split('/').pop()}_postQuotes`,
      tags: tags,
      description: 'Metadata',
      payload: {
        failAction: 'error'
      },
      validate: {
        headers: Joi.object({
          accept: Joi.string().optional().regex(/application\/vnd.interoperability[.]/),
          'content-type': Joi.string().required().regex(/application\/vnd.interoperability[.]/),
          'content-length': Joi.number().max(5242880),
          date: Joi.date().format('ddd, D MMM YYYY H:mm:ss [GMT]').required(),
          'x-forwarded-for': Joi.string().optional(),
          'fspiop-source': Joi.string().required(),
          'fspiop-destination': Joi.string().required(),
          'fspiop-encryption': Joi.string().optional(),
          'fspiop-signature': Joi.string().optional(),
          'fspiop-uri': Joi.string().optional(),
          'fspiop-http-method': Joi.string().optional(),
          traceparent: Joi.string().optional(),
          tracestate: Joi.string().optional()
        }).unknown(false).options({ stripUnknown: true }),
        payload: Joi.object({
          quoteId: Joi.string().guid().required().description('Id of quote').label('@ Quote Id must be in a valid GUID format. @'),
          transactionId: Joi.string().guid().required().description('Id of transaction').label('@ Transaction Id must be in a valid GUID format. @'),
          transactionRequestId: Joi.string().guid().optional().description('Id of transaction request').label('@ Transaction Request Id must be in a valid GUID format. @'),
          payer: Joi.object().keys({
            partyIdInfo: Joi.object().keys({
              partyIdType: Joi.string().required().valid('MSISDN', 'EMAIL', 'PERSONAL_ID', 'BUSINESS', 'DEVICE', 'ACCOUNT_ID', 'IBAN', 'ALIAS').description('Type of the identifier. ').label('@ Type of the identifier.  @'),
              partyIdentifier: Joi.string().required().min(1).max(32).description('An identifier for the Party.').label('@ An identifier for the Party. @'),
              partySubIdOrType: Joi.string().optional().min(1).max(32).description('A sub-identifier or sub-type for the Party.').label('@ A sub-identifier or sub-type for the Party. @'),
              fspId: Joi.string().optional().min(1).max(32).description('FSP ID ').label('@ FSP ID  @')
            }).required().description('Party Id type, id, sub ID or type, and FSP Id.').label('@ Party Id type, id, sub ID or type, and FSP Id. @'),
            merchantClassificationCode: Joi.string().optional().min(1).max(32).description('Used in the context of Payee Information, where the Payee happens to be a merchant accepting merchant payments.').label('@ Used in the context of Payee Information, where the Payee happens to be a merchant accepting merchant payments. @'),
            name: Joi.string().optional().min(1).max(32).description('Display name of the Party, could be a real name or a nick name.').label('@ Display name of the Party, could be a real name or a nick name. @'),
            personalInfo: Joi.object().keys({
              complexName: Joi.object().keys({
                firstName: Joi.string().required().regex(/^(?!\s*$)[\w .,'-]{1,128}$/).description('Party’s first name.').label('@ Party’s first name. @'),
                middleName: Joi.string().optional().regex(/^(?!\s*$)[\w .,'-]{1,128}$/).description('Party’s middle name.').label('@ Party’s middle name. @'),
                lastName: Joi.string().required().regex(/^(?!\s*$)[\w .,'-]{1,128}$/).description('Party ’s last name.').label('@ Party ’s last name. @')
              }).optional().description('Amount of the transfer').label('@ Supplied amount fails to match the required format. @'),
              dateOfBirth: Joi.string().optional().min(1).max(32).description('Financial Service Provider of Payee').label('@ A valid Payee FSP number must be supplied. @')
            }).optional().description('Personal information used to verify identity of Party such as first, middle, last name and date of birth.').label('@ Personal information used to verify identity of Party such as first, middle, last name and date of birth. @')
          }).required().description('Information about the Payer in the proposed financial transaction.').label('@ Information about the Payer in the proposed financial transaction. @'),
          payee: Joi.object().keys({
            partyIdInfo: Joi.object().keys({
              partyIdType: Joi.string().required().valid('MSISDN', 'EMAIL', 'PERSONAL_ID', 'BUSINESS', 'DEVICE', 'ACCOUNT_ID', 'IBAN', 'ALIAS').description('Type of the identifier. ').label('@ Type of the identifier.  @'),
              partyIdentifier: Joi.string().required().min(1).max(32).description('An identifier for the Party.').label('@ An identifier for the Party. @'),
              partySubIdOrType: Joi.string().optional().min(1).max(32).description('A sub-identifier or sub-type for the Party.').label('@ A sub-identifier or sub-type for the Party. @'),
              fspId: Joi.string().optional().min(1).max(32).description('FSP ID ').label('@ FSP ID  @')
            }).required().description('Party Id type, id, sub ID or type, and FSP Id.').label('@ Party Id type, id, sub ID or type, and FSP Id. @'),
            merchantClassificationCode: Joi.string().optional().min(1).max(32).description('Used in the context of Payee Information, where the Payee happens to be a merchant accepting merchant payments.').label('@ Used in the context of Payee Information, where the Payee happens to be a merchant accepting merchant payments. @'),
            name: Joi.string().optional().min(1).max(32).description('Display name of the Party, could be a real name or a nick name.').label('@ Display name of the Party, could be a real name or a nick name. @'),
            personalInfo: Joi.object().keys({
              complexName: Joi.object().keys({
                firstName: Joi.string().required().regex(/^(?!\s*$)[\w .,'-]{1,128}$/).description('Party’s first name.').label('@ Party’s first name. @'),
                middleName: Joi.string().optional().regex(/^(?!\s*$)[\w .,'-]{1,128}$/).description('Party’s middle name.').label('@ Party’s middle name. @'),
                lastName: Joi.string().required().regex(/^(?!\s*$)[\w .,'-]{1,128}$/).description('Party ’s last name.').label('@ Party ’s last name. @')
              }).optional().description('Amount of the transfer').label('@ Supplied amount fails to match the required format. @'),
              dateOfBirth: Joi.string().optional().min(1).max(32).description('Financial Service Provider of Payee').label('@ A valid Payee FSP number must be supplied. @')
            }).optional().description('Personal information used to verify identity of Party such as first, middle, last name and date of birth.').label('@ Personal information used to verify identity of Party such as first, middle, last name and date of birth. @')
          }).required().description('Information about the Payer in the proposed financial transaction.').label('@ Information about the Payer in the proposed financial transaction. @'),
          amountType: Joi.string().required().valid('SEND', 'RECEIVE').description('SEND for sendAmount, RECEIVE for receiveAmount').label('@ SEND for sendAmount, RECEIVE for receiveAmount. @'),
          amount: Joi.object().keys({
            currency: Joi.string().required().currency().description('Currency of the transfer').label('@ Currency needs to be a valid ISO 4217 currency code. @'),
            amount: Joi.string().required().regex(/^([0]|([1-9][0-9]{0,17}))([.][0-9]{0,3}[1-9])?$/).description('Amount of the transfer')
          }).required().description('Amount of the transfer').label('@ Supplied amount fails to match the required format. @'),
          fees: Joi.object().keys({
            currency: Joi.string().required().currency().description('Currency of the transfer').label('@ Currency needs to be a valid ISO 4217 currency code. @'),
            amount: Joi.string().required().regex(/^([0]|([1-9][0-9]{0,17}))([.][0-9]{0,3}[1-9])?$/).description('Amount of the transfer')
          }).optional().description('Amount of the transfer').label('@ Supplied fees fails to match the required format. @'),
          transactionType: Joi.object().keys({
            scenario: Joi.string().required().valid('DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'PAYMENT').description('One of Deposit, withdrawal, refund').label('@ Supplied value should be one of DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'PAYMENT. @'),
            subScenario: Joi.string().optional().regex(/^([0]|([1-9][0-9]{0,17}))([.][0-9]{0,3}[1-9])?$/).description('Possible sub-scenario, defined locally within the scheme.'),
            initiator: Joi.string().required().valid('PAYER', 'PAYEE').description('Who is initiating the transaction: Payer or Payee').label('@ Who is initiating the transaction: Payer or Payee. @'),
            initiatorType: Joi.string().required().valid('CONSUMER', 'AGENT', 'BUSINESS', 'DEVICE').description('Consumer, agent, business,'),
            refundInfo: Joi.string().optional().currency().description('Extra information specific to a refund scenario. Should only be populated if scenario is REFUND').label('@ Extra information specific to a refund scenario. Should only be populated if scenario is REFUND. @'),
            balanceOfPayments: Joi.string().optional().regex(/^([0]|([1-9][0-9]{0,17}))([.][0-9]{0,3}[1-9])?$/).description('Balance of Payments code')
          }).required().description('Amount of the transfer').label('@ Supplied amount fails to match the required format. @'),
          note: Joi.string().optional().regex(/^[A-Za-z0-9-_]+[=]{0,2}$/).min(1).max(32768).description('Memo that will be attached to the transaction.').label('@ Supplied value does not match the required format. @'),
          expiration: Joi.string().optional().regex(/^(?:[1-9]\d{3}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1\d|2[0-8])|(?:0[13-9]|1[0-2])-(?:29|30)|(?:0[13578]|1[02])-31)|(?:[1-9]\d(?:0[48]|[2468][048]|[13579][26])|(?:[2468][048]|[13579][26])00)-02-29)T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:(\.\d{3}))(?:Z|[+-][01]\d:[0-5]\d)$/).description('When the transfer expires').label('@ A valid transfer expiry date must be supplied. @'),
          extensionList: Joi.object().keys({
            extension: Joi.array().items(Joi.object().keys({
              key: Joi.string().required().min(1).max(32).description('Key').label('@ Supplied key fails to match the required format. @'),
              value: Joi.string().required().min(1).max(128).description('Value').label('@ Supplied key value fails to match the required format. @')
            })).required().min(1).max(16).description('extension')
          }).optional().description('Extension list')
        }),
        failAction: (request, h, err) => { throw err }
      }
    }
  },
  {
    method: 'GET',
    path: '/payeefsp/quotes/{id}',
    handler: Handler.getQuotesById,
    options: {
      id: `simulator_${__dirname.split('/').pop()}_getQuotesById`,
      tags: tags,
      description: 'Metadata',
      validate: {
        headers: Joi.object({
          'content-type': Joi.string().required().regex(/application\/vnd.interoperability[.]/),
          'content-length': Joi.number().max(5242880),
          date: Joi.date().format('ddd, D MMM YYYY H:mm:ss [GMT]').required(),
          'x-forwarded-for': Joi.string().optional(),
          'fspiop-source': Joi.string().required(),
          'fspiop-destination': Joi.string().required(),
          'fspiop-encryption': Joi.string().optional(),
          'fspiop-signature': Joi.string().optional(),
          'fspiop-uri': Joi.string().optional(),
          'fspiop-http-method': Joi.string().optional(),
          traceparent: Joi.string().optional(),
          tracestate: Joi.string().optional()
        }).unknown(false).options({ stripUnknown: true }),
        params: Joi.object({
          id: Joi.string().required().description('path')
        }),
        failAction: (request, h, err) => { throw err }
      }
    }
  },
  {
    method: 'POST',
    path: '/payeefsp/transfers',
    handler: Handler.postTransfers,
    config: {
      id: `simulator_${__dirname.split('/').pop()}_postTransfers`,
      tags: tags,
      auth: null,
      description: 'Transfer API.',
      payload: {
        failAction: 'error',
        output: 'data'
      },
      validate: {
        headers: Joi.object({
          accept: Joi.string().optional().regex(/application\/vnd.interoperability[.]/),
          'content-type': Joi.string().required().regex(/application\/vnd.interoperability[.]/),
          'content-length': Joi.number().max(5242880),
          date: Joi.date().format('ddd, D MMM YYYY H:mm:ss [GMT]').required(),
          'x-forwarded-for': Joi.string().optional(),
          'fspiop-source': Joi.string().required(),
          'fspiop-destination': Joi.string().required(),
          'fspiop-encryption': Joi.string().optional(),
          'fspiop-signature': Joi.string().optional(),
          'fspiop-uri': Joi.string().optional(),
          'fspiop-http-method': Joi.string().optional(),
          traceparent: Joi.string().optional(),
          tracestate: Joi.string().optional()
        }).unknown(false).options({ stripUnknown: true }),
        payload: Joi.object({
          transferId: Joi.string().guid().required().description('Id of transfer').label('@ Transfer Id must be in a valid GUID format. @'),
          payeeFsp: Joi.string().required().min(1).max(32).description('Financial Service Provider of Payee').label('@ A valid Payee FSP number must be supplied. @'),
          payerFsp: Joi.string().required().min(1).max(32).description('Financial Service Provider of Payer').label('@ A valid Payer FSP number must be supplied. @'),
          amount: Joi.object().keys({
            currency: Joi.string().required().currency().description('Currency of the transfer').label('@ Currency needs to be a valid ISO 4217 currency code. @'),
            amount: Joi.string().required().regex(/^([0]|([1-9][0-9]{0,17}))([.][0-9]{0,3}[1-9])?$/).description('Amount of the transfer')
          }).required().description('Amount of the transfer').label('@ Supplied amount fails to match the required format. @'),
          ilpPacket: Joi.string().required().regex(/^[A-Za-z0-9-_]+[=]{0,2}$/).min(1).max(32768).description('ilp packet').label('@ Supplied ILPPacket fails to match the required format. @'),
          condition: Joi.string().required().trim().max(48).regex(/^[A-Za-z0-9-_]{43}$/).description('Condition of transfer').label('@ A valid transfer condition must be supplied. @'),
          expiration: Joi.string().required().regex(/^(?:[1-9]\d{3}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1\d|2[0-8])|(?:0[13-9]|1[0-2])-(?:29|30)|(?:0[13578]|1[02])-31)|(?:[1-9]\d(?:0[48]|[2468][048]|[13579][26])|(?:[2468][048]|[13579][26])00)-02-29)T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:(\.\d{3}))(?:Z|[+-][01]\d:[0-5]\d)$/).description('When the transfer expires').label('@ A valid transfer expiry date must be supplied. @'),
          extensionList: Joi.object().keys({
            extension: Joi.array().items(Joi.object().keys({
              key: Joi.string().required().min(1).max(32).description('Key').label('@ Supplied key fails to match the required format. @'),
              value: Joi.string().required().min(1).max(128).description('Value').label('@ Supplied key value fails to match the required format. @')
            })).required().min(1).max(16).description('extension')
          }).optional().description('Extension list')
        }),
        failAction: (request, h, err) => { throw err }
      }
    }
  },
  {
    method: 'PUT',
    path: '/payeefsp/transfers/{id}',
    handler: Handler.putTransfersById,
    config: {
      id: `simulator_${__dirname.split('/').pop()}_putTransfersById`,
      tags: tags,
      // auth: Auth.strategy(),
      description: 'Fulfil a transfer',
      payload: {
        failAction: 'error'
      },
      validate: {
        headers: Joi.object({
          'content-type': Joi.string().required().regex(/application\/vnd.interoperability[.]/),
          date: Joi.date().format('ddd, D MMM YYYY H:mm:ss [GMT]').required(),
          'x-forwarded-for': Joi.string().optional(),
          'fspiop-source': Joi.string().required(),
          'fspiop-destination': Joi.string().required(),
          'fspiop-encryption': Joi.string().optional(),
          'fspiop-signature': Joi.string().optional(),
          'fspiop-uri': Joi.string().optional(),
          'fspiop-http-method': Joi.string().optional(),
          traceparent: Joi.string().optional(),
          tracestate: Joi.string().optional()
        }).unknown(false).options({ stripUnknown: true }),
        params: Joi.object({
          id: Joi.string().required().description('path')
        }),
        payload: Joi.object({
          fulfilment: Joi.string().regex(/^[A-Za-z0-9-_]{43}$/).max(48).description('fulfilment of the transfer').label('@ Invalid transfer fulfilment description. @'),
          completedTimestamp: Joi.string().regex(/^(?:[1-9]\d{3}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1\d|2[0-8])|(?:0[13-9]|1[0-2])-(?:29|30)|(?:0[13578]|1[02])-31)|(?:[1-9]\d(?:0[48]|[2468][048]|[13579][26])|(?:[2468][048]|[13579][26])00)-02-29)T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:(\.\d{3}))(?:Z|[+-][01]\d:[0-5]\d)$/).description('When the transfer was completed').label('@ A valid transfer completion date must be supplied. @'),
          transferState: Joi.string().required().valid('RECEIVED', 'RESERVED', 'COMMITTED', 'ABORTED', 'SETTLED').description('State of the transfer').label('@ Invalid transfer state given. @'),
          extensionList: Joi.object().keys({
            extension: Joi.array().items(Joi.object().keys({
              key: Joi.string().required().min(1).max(32).description('Key').label('@ Supplied key fails to match the required format. @'),
              value: Joi.string().required().min(1).max(128).description('Value').label('@ Supplied key value fails to match the required format. @')
            })).required().min(1).max(16).description('extension')
          }).optional().description('Extension list')
        })
      }
    }
  },
  {
    method: 'PUT',
    path: '/payeefsp/transfers/{id}/error',
    handler: Handler.putTransfersByIdError,
    options: {
      id: `simulator_${__dirname.split('/').pop()}_putTransfersByIdError`,
      tags: tags,
      description: 'Abort a transfer',
      payload: {
        failAction: 'error'
      },
      validate: {
        headers: Joi.object({
          'content-type': Joi.string().required().regex(/application\/vnd.interoperability[.]/),
          date: Joi.date().format('ddd, D MMM YYYY H:mm:ss [GMT]').required(),
          'x-forwarded-for': Joi.string().optional(),
          'fspiop-source': Joi.string().required(),
          'fspiop-destination': Joi.string().optional(),
          'fspiop-encryption': Joi.string().optional(),
          'fspiop-signature': Joi.string().optional(),
          'fspiop-uri': Joi.string().optional(),
          'fspiop-http-method': Joi.string().optional(),
          traceparent: Joi.string().optional(),
          tracestate: Joi.string().optional()
        }).unknown(false).options({ stripUnknown: true }),
        params: Joi.object({
          id: Joi.string().required().description('path')
        }),
        payload: Joi.object({
          errorInformation: Joi.object().keys({
            errorDescription: Joi.string().required(),
            errorCode: Joi.string().required().regex(/^[0-9]{4}/),
            extensionList: Joi.object().keys({
              extension: Joi.array().items(Joi.object().keys({
                key: Joi.string().required().min(1).max(32).description('Key').label('@ Supplied key fails to match the required format. @'),
                value: Joi.string().required().min(1).max(128).description('Value').label('@ Supplied key value fails to match the required format. @')
              })).required().min(1).max(16).description('extension')
            }).optional().description('Extension list')
          }).required().description('Error information')
        })
      }
    }
  },
  {
    method: 'GET',
    path: '/payeefsp/correlationid/{id}',
    handler: Handler.getcorrelationId,
    options: {
      id: `simulator_${__dirname.split('/').pop()}_getcorrelationId`,
      tags: tags,
      description: 'Get details based on correlationid'
    }
  },
  {
    method: 'GET',
    path: '/payeefsp/requests/{id}',
    handler: Handler.getRequestById,
    options: {
      id: `simulator_${__dirname.split('/').pop()}_getRequestById`,
      tags: tags,
      description: 'Get details based on request id'
    }
  },
  {
    method: 'GET',
    path: '/payeefsp/callbacks/{id}',
    handler: Handler.getCallbackById,
    options: {
      id: `simulator_${__dirname.split('/').pop()}_getCallbackById`,
      tags: tags,
      description: 'Get details based on callback id'
    }
  }
]
