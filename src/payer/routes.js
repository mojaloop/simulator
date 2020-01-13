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
    path: '/payerfsp/',
    handler: Handler.metadata,
    options: {
      id: `simulator_${__dirname.split('/').pop()}_metadata`,
      tags: tags,
      description: 'Metadata'
    }
  },
  {
    method: 'PUT',
    path: '/payerfsp/participants/{type}/{id}',
    handler: Handler.putParticipantsByTypeId,
    options: {
      id: `simulator_${__dirname.split('/').pop()}_putParticipantsByTypeId`,
      tags: tags,
      description: 'Metadata'
    }
  },
  {
    method: 'PUT',
    path: '/payerfsp/parties/{type}/{id}',
    handler: Handler.putPartiesByTypeId,
    options: {
      id: `simulator_${__dirname.split('/').pop()}_putPartiesByTypeId`,
      tags: tags,
      description: 'Metadata',
      payload: {
        failAction: 'error'
      },
      validate: {
        headers: Joi.object({
          'content-type': Joi.string().required().regex(/application\/vnd.interoperability[.]/),
          'content-length': Joi.number().optional().max(5242880),
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
          party: Joi.object().keys({
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
          }).required().description('Information about the Payer in the proposed financial transaction.').label('@ Information about the Payer in the proposed financial transaction. @')

        }),
        failAction: (request, h, err) => { throw err }
      }
    }
  },
  {
    method: 'PUT',
    path: '/payerfsp/parties/{type}/{id}/error',
    handler: Handler.putPartiesByTypeIdAndError,
    options: {
      id: `simulator_${__dirname.split('/').pop()}_putPartiesByTypeIdAndError`,
      tags: tags,
      description: 'Metadata',
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
          type: Joi.string().required().description('path'),
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
    method: 'PUT',
    path: '/payerfsp/quotes/{id}',
    handler: Handler.putQuotesById,
    options: {
      id: `simulator_${__dirname.split('/').pop()}_putQuotesById`,
      tags: tags,
      description: 'Metadata',
      payload: {
        failAction: 'error'
      },
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
        payload: Joi.object({
          transferAmount: Joi.object().keys({
            currency: Joi.string().required().currency().description('Currency of the transfer').label('@ Currency needs to be a valid ISO 4217 currency code. @'),
            amount: Joi.string().required().regex(/^([0]|([1-9][0-9]{0,17}))([.][0-9]{0,3}[1-9])?$/).description('Amount of the transfer')
          }).optional().description('The amount of Money that the Payer FSP should transfer to the Payee FSP.').label('@ The amount of Money that the Payer FSP should transfer to the Payee FSP. @'),
          payeeReceiveAmount: Joi.object().keys({
            currency: Joi.string().required().currency().description('Currency of the transfer').label('@ Currency needs to be a valid ISO 4217 currency code. @'),
            amount: Joi.string().required().regex(/^([0]|([1-9][0-9]{0,17}))([.][0-9]{0,3}[1-9])?$/).description('Amount of the transfer')
          }).optional().description('Amount that the Payee should receive in the end-to-end transaction. Optional as the Payee FSP might not want to disclose any optional Payee fees').label('@ Supplied payeeReceiveAmount fails to match the required format. @'),
          payeeFspFee: Joi.object().keys({
            currency: Joi.string().required().currency().description('Currency of the transfer').label('@ Currency needs to be a valid ISO 4217 currency code. @'),
            amount: Joi.string().required().regex(/^([0]|([1-9][0-9]{0,17}))([.][0-9]{0,3}[1-9])?$/).description('Amount of the transfer')
          }).optional().description('Payee FSP’s part of the transaction fee').label('@ Supplied payeeFspFee fails to match the required format. @'),
          payeeFspCommission: Joi.object().keys({
            currency: Joi.string().required().currency().description('Currency of the transfer').label('@ Currency needs to be a valid ISO 4217 currency code. @'),
            amount: Joi.string().required().regex(/^([0]|([1-9][0-9]{0,17}))([.][0-9]{0,3}[1-9])?$/).description('Amount of the transfer')
          }).optional().description('Transaction commission from the Payee FSP').label('@ Supplied payeeFspCommission fails to match the required format. @'),
          expiration: Joi.string().required().regex(/^(?:[1-9]\d{3}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1\d|2[0-8])|(?:0[13-9]|1[0-2])-(?:29|30)|(?:0[13578]|1[02])-31)|(?:[1-9]\d(?:0[48]|[2468][048]|[13579][26])|(?:[2468][048]|[13579][26])00)-02-29)T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:(\.\d{3}))(?:Z|[+-][01]\d:[0-5]\d)$/).description('When the transfer expires').label('@ A valid transfer expiry date must be supplied. @'),
          ilpPacket: Joi.string().required().regex(/^[A-Za-z0-9-_]+[=]{0,2}$/).min(1).max(32768).description('ilp packet').label('@ Supplied ILPPacket fails to match the required format. @'),
          condition: Joi.string().required().trim().max(48).regex(/^[A-Za-z0-9-_]{43}$/).description('Condition of transfer').label('@ A valid transfer condition must be supplied. @'),
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
    path: '/payerfsp/quotes/{id}/error',
    handler: Handler.putQuotesByIdAndError,
    options: {
      id: `simulator_${__dirname.split('/').pop()}_putQuotesByIdAndError`,
      tags: tags,
      description: 'Metadata',
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
    method: 'PUT',
    path: '/payerfsp/transfers/{id}',
    handler: Handler.putTransfersById,
    options: {
      id: `simulator_${__dirname.split('/').pop()}_putTransfersById`,
      tags: tags,
      description: 'Metadata',
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
    path: '/payerfsp/transfers/{id}/error',
    handler: Handler.putTransfersByIdError,
    options: {
      id: `simulator_${__dirname.split('/').pop()}_putTransfersByIdError`,
      tags: tags,
      description: 'Metadata',
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
    path: '/payerfsp/correlationid/{id}',
    handler: Handler.getcorrelationId,
    options: {
      id: `simulator_${__dirname.split('/').pop()}_getcorrelationId`,
      tags: tags,
      description: 'Get details based on correlationid'
    }
  },
  {
    method: 'GET',
    path: '/payerfsp/requests/{id}',
    handler: Handler.getRequestById,
    options: {
      id: `simulator_${__dirname.split('/').pop()}_getRequestById`,
      tags: tags,
      description: 'Get details based on request id'
    }
  },
  {
    method: 'GET',
    path: '/payerfsp/callbacks/{id}',
    handler: Handler.getCallbackById,
    options: {
      id: `simulator_${__dirname.split('/').pop()}_getCallbackById`,
      tags: tags,
      description: 'Get details based on callback id'
    }
  }
]
