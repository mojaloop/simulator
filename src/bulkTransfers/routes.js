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
 - Rajiv Mothilal rajiv.mothilal@modusbox.com

 --------------
 ******/

const Handler = require('./handler')
const Enum = require('@mojaloop/central-services-shared').Enum
const tags = ['api', 'metadata', Enum.Tags.RouteTags.SAMPLED]
const BaseJoi = require('@hapi/joi').extend(require('joi-currency-code'))
const Joi = BaseJoi.extend(require('@hapi/joi-date'))

module.exports = [
  {
    method: 'POST',
    path: '/bulkTransfers',
    handler: Handler.postBulkTransfers,
    config: {
      id: `simulator_${__dirname.split('/').pop()}_postBulkTransfers`,
      tags: tags,
      auth: null,
      description: 'Bulk Transfer API.',
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
          bulkTransferId: Joi.string().guid().required().description('Id of bulk transfer').label('@ Bulk Transfer Id must be in a valid GUID format. @'),
          bulkQuoteId: Joi.string().guid().required().description('Id of bulk quote').label('@ Bulk Quote Id must be in a valid GUID format. @'),
          payeeFsp: Joi.string().required().min(1).max(32).description('Financial Service Provider of Payee').label('@ A valid Payee FSP number must be supplied. @'),
          payerFsp: Joi.string().required().min(1).max(32).description('Financial Service Provider of Payer').label('@ A valid Payer FSP number must be supplied. @'),
          extensionList: Joi.object().keys({
            extension: Joi.array().items(Joi.object().keys({
              key: Joi.string().required().min(1).max(32).description('Key').label('Supplied key fails to match the required format.'),
              value: Joi.string().required().min(1).max(128).description('Value').label('Supplied key value fails to match the required format.')
            })).required().min(1).max(16).description('extension')
          }).optional().description('Extension list'),
          individualTransfers: Joi.array().required().items({
            transferId: Joi.string().guid().required().description('Id of transfer').label('Transfer Id must be in a valid GUID format.'),
            transferAmount: Joi.object().keys({
              currency: Joi.string().required().currency().description('Currency of the transfer').label('Currency needs to be a valid ISO 4217 currency code.'),
              amount: Joi.string().required().regex(/^([0]|([1-9][0-9]{0,17}))([.][0-9]{0,3}[1-9])?$/).description('Amount of the transfer')
            }).required().description('Amount of the transfer').label('Supplied amount fails to match the required format.'),
            ilpPacket: Joi.string().required().regex(/^[A-Za-z0-9-_]+[=]{0,2}$/).min(1).max(32768).description('ilp packet').label('Supplied ILPPacket fails to match the required format.'),
            condition: Joi.string().required().trim().max(48).regex(/^[A-Za-z0-9-_]{43}$/).description('Condition of transfer').label('A valid transfer condition must be supplied.'),
            extensionList: Joi.object().keys({
              extension: Joi.array().items(Joi.object().keys({
                key: Joi.string().required().min(1).max(32).description('Key').label('Supplied key fails to match the required format.'),
                value: Joi.string().required().min(1).max(128).description('Value').label('Supplied key value fails to match the required format.')
              })).required().min(1).max(16).description('extension')
            }).optional().description('Extension list')
          }),
          expiration: Joi.string().required().regex(/^(?:[1-9]\d{3}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1\d|2[0-8])|(?:0[13-9]|1[0-2])-(?:29|30)|(?:0[13578]|1[02])-31)|(?:[1-9]\d(?:0[48]|[2468][048]|[13579][26])|(?:[2468][048]|[13579][26])00)-02-29)T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:(\.\d{3}))(?:Z|[+-][01]\d:[0-5]\d)$/).description('When the transfer expires').label('A valid transfer expiry date must be supplied.')
        }),
        failAction: (request, h, err) => { throw err }
      }
    }
  },
  {
    method: 'PUT',
    path: '/bulkTransfers/{id}',
    handler: Handler.putBulkTransfersById,
    config: {
      id: `simulator_${__dirname.split('/').pop()}_putBulkTransfersById`,
      tags: tags,
      // auth: Auth.strategy(),
      description: 'Fulfil a bulk transfer',
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
          bulkTransferState: Joi.string().required().valid('RECEIVED', 'PENDING', 'ACCEPTED', 'PROCESSING', 'COMPLETED', 'REJECTED').description('State of the bulk transfer').label('@ Invalid bulk transfer state given. @'),
          completedTimestamp: Joi.string().regex(/^(?:[1-9]\d{3}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1\d|2[0-8])|(?:0[13-9]|1[0-2])-(?:29|30)|(?:0[13578]|1[02])-31)|(?:[1-9]\d(?:0[48]|[2468][048]|[13579][26])|(?:[2468][048]|[13579][26])00)-02-29)T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:(\.\d{3}))(?:Z|[+-][01]\d:[0-5]\d)$/).description('When the transfer was completed').label('@ A valid transfer completion date must be supplied. @'),
          individualTransferResults: Joi.array().required().items({
            transferId: Joi.string().guid().required().description('Id of transfer').label('Transfer Id must be in a valid GUID format.'),
            fulfilment: Joi.string().regex(/^[A-Za-z0-9-_]{43}$/).max(48).description('fulfilment of the transfer').label('@ Invalid transfer fulfilment description. @'),
            errorInformation: Joi.object().keys({
              errorDescription: Joi.string().required(),
              errorCode: Joi.string().required().regex(/^[0-9]{4}/),
              extensionList: Joi.object().keys({
                extension: Joi.array().items(Joi.object().keys({
                  key: Joi.string().required().min(1).max(32).description('Key').label('@ Supplied key fails to match the required format. @'),
                  value: Joi.string().required().min(1).max(128).description('Value').label('@ Supplied key value fails to match the required format. @')
                })).required().min(1).max(16).description('extension')
              }).optional().description('Extension list')
            }).description('Error information'),
            extensionList: Joi.object().keys({
              extension: Joi.array().items(Joi.object().keys({
                key: Joi.string().required().min(1).max(32).description('Key').label('Supplied key fails to match the required format.'),
                value: Joi.string().required().min(1).max(128).description('Value').label('Supplied key value fails to match the required format.')
              })).required().min(1).max(16).description('extension')
            }).optional().description('Extension list')
          }),
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
    path: '/bulkTransfers/{id}/error',
    handler: Handler.putBulkTransfersByIdError,
    options: {
      id: `simulator_${__dirname.split('/').pop()}_putBulkTransfersByIdError`,
      tags: tags,
      description: 'Abort a bulk transfer',
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
    path: '/bulkTransfers/correlationid/{id}',
    handler: Handler.getCorrelationId,
    options: {
      id: `simulator_${__dirname.split('/').pop()}_getCorrelationId`,
      tags: tags,
      description: 'Get details based on correlationid'
    }
  },
  {
    method: 'GET',
    path: '/bulkTransfers/requests/{id}',
    handler: Handler.getRequestById,
    options: {
      id: `simulator_${__dirname.split('/').pop()}_getRequestById`,
      tags: tags,
      description: 'Get details based on request id'
    }
  },
  {
    method: 'GET',
    path: '/bulkTransfers/callbacks/{id}',
    handler: Handler.getCallbackById,
    options: {
      id: `simulator_${__dirname.split('/').pop()}_getCallbackById`,
      tags: tags,
      description: 'Get details based on callback id'
    }
  }
]
