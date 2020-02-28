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

 * ModusBox
 - Rajiv Mothilal <rajiv.mothilal@modusbox.com>
 - Steven Oderayi <steven.oderayi@modusbox.com>

 --------------
 ******/

const Handler = require('./handler')
const Enum = require('@mojaloop/central-services-shared').Enum
const BaseJoi = require('@hapi/joi').extend(require('joi-currency-code'))
const Joi = BaseJoi.extend(require('@hapi/joi-date'))
const tags = ['api', 'transactionRequests', Enum.Tags.RouteTags.SAMPLED]
const regexAccept = Enum.Http.Headers.GENERAL.ACCEPT.regex
const regexContentType = Enum.Http.Headers.GENERAL.ACCEPT.regex

module.exports = [
  {
    method: 'GET',
    path: '/transactionRequests/{ID}',
    handler: Handler.getTransactionRequestById,
    options: {
      id: `simulator_${__dirname.split('/').pop()}_getTransactionRequest`,
      tags: tags,
      description: 'Get a transaction request by ID',
      validate: {
        headers: Joi.object({
          accept: Joi.string().optional().regex(regexAccept),
          'content-type': Joi.string().required().regex(regexContentType),
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
          id: Joi.string().guid().required().description('path').label('Supply a valid transfer Id to continue.')
        })
      }
    }
  },
  {
    method: 'POST',
    path: '/transactionRequests',
    handler: Handler.postTransactionRequest,
    config: {
      id: `simulator_${__dirname.split('/').pop()}_postTransactionRequest`,
      tags: tags,
      description: 'Incoming Transaction Request',
      payload: {
        failAction: 'error'
      },
      validate: {
        headers: Joi.object({
          accept: Joi.string().optional().regex(regexAccept),
          'content-type': Joi.string().required().regex(regexContentType),
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
          transactionRequestId: Joi.string().guid().required().description('Id of transaction request').label('@ Transaction Request Id must be in a valid GUID format. @'),
          payee: Joi.object().keys({
            partyIdInfo: Joi.object().keys({
              partyIdType: Joi.string().valid('MSISDN', 'EMAIL', 'PERSONAL_ID', 'BUSINESS', 'DEVICE', 'ACCOUNT_ID', 'IBAN', 'ALIAS').required().description('PartyID Type'),
              partyIdentifier: Joi.string().required().min(1).max(128).description('Identifier of the Party').label('@ A valid Party Identifier must be supplied. @'),
              partySubIdOrType: Joi.string().optional().min(1).max(128).description('Sub Party ID or Type').label('@ A valid partySubIdOrType must be supplied. @'),
              fspId: Joi.string().optional().min(1).max(32).description('FSP identifier').label('@ A valid FSP ID must be supplied. @')
            }).required().description('Party ID Information').label('@ A valid PartyID Information must be supplied. @'),
            merchantClassificationCode: Joi.string().regex(/^[\d]{1,4}$/).optional().description('merchantClassificationCode'),
            name: Joi.string().optional().min(1).max(128).description('Name of the Party').label('@ A valid party name must be supplied. @'),
            personalInfo: Joi.object().keys({
              complexName: Joi.object().keys({
                firstName: Joi.string().min(1).max(128).regex(/^(?!\s*$)[\w .,''-]{1,128}$/).optional().description('First name of the Party'),
                middleName: Joi.string().min(1).max(128).regex(/^(?!\s*$)[\w .,''-]{1,128}$/).optional().description('Middle name of the Party'),
                lastName: Joi.string().min(1).max(128).regex(/^(?!\s*$)[\w .,''-]{1,128}$/).optional().description('Last name of the Party')
              }).optional().description('Complex Name').label('@ A valid Complex Name Information must be supplied. @'),
              dateOfBirth: Joi.string().optional().regex(/^(?:[1-9]\d{3}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1\d|2[0-8])|(?:0[13-9]|1[0-2])-(?:29|30)|(?:0[13578]|1[02])-31)|(?:[1-9]\d(?:0[48]|[2468][048]|[13579][26])|(?:[2468][048]|[13579][26])00)-02-29)$/).description('Date of Birth of the Party').label('@ A valid Date of Birth must be supplied. @')
            }).optional().description('Personal Information').label('@ A valid Personal Information must be supplied. @')
          }).required().description('Financial Service Provider of Payee').label('@ A valid Payee Information must be supplied. @'),
          payer: Joi.object().keys({
            partyIdType: Joi.string().valid('MSISDN', 'EMAIL', 'PERSONAL_ID', 'BUSINESS', 'DEVICE', 'ACCOUNT_ID', 'IBAN', 'ALIAS').required().description('PartyID Type'),
            partyIdentifier: Joi.string().required().min(1).max(128).description('Identifier of the Party').label('@ A valid Party Identifier must be supplied. @'),
            partySubIdOrType: Joi.string().optional().min(1).max(128).description('Sub Party ID or Type').label('@ A valid partySubIdOrType must be supplied. @'),
            fspId: Joi.string().optional().min(1).max(32).description('FSP identifier').label('@ A valid FSP ID must be supplied. @')
          }).required().description('Financial Service Provider of Payer').label('@ A valid Payer Information must be supplied. @'),
          amount: Joi.object().keys({
            amount: Joi.string().regex(/^([0]|([1-9][0-9]{0,17}))([.][0-9]{0,3}[1-9])?$/).required(),
            currency: Joi.string().length(3).required()
          }).required().description('Transaction amount').label('@ Transaction amount must be a valid number. @'),
          transactionType: Joi.object().keys({
            scenario: Joi.string().valid('DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'PAYMENT', 'REFUND').required().description('Scenario'),
            subScenario: Joi.string().regex(/^[A-Z_]{1,32}$/).optional().description('Sub-scenario'),
            initiator: Joi.string().valid('PAYER', 'PAYEE').required().description('Initiator'),
            initiatorType: Joi.string().valid('CONSUMER', 'AGENT', 'BUSINESS', 'DEVICE').required().description('Initiator Type'),
            refundInfo: Joi.object().keys({
              originalTransactionId: Joi.string().guid().required().description('Original Transaction ID'),
              refundReason: Joi.string().max(128).optional().description('Refund Reason')
            }).optional().description('Refund Information'),
            balanceOfPayments: Joi.string().max(128).optional().description('Balance of Payments')
          }).required(),
          note: Joi.string().min(1).max(128).optional().description('Transaction note'),
          geoCode: Joi.object().keys({
            latitude: Joi.string().required().description('Latitude'),
            longitude: Joi.string().required().description('Longitude')
          }).optional().description('Transaction geo location'),
          authenticationType: Joi.string().valid('OTP', 'QRCODE').optional().description('Authentication type').label('Supplied Authentication Type is not valid.'),
          expiration: Joi.string().required().regex(/^(?:[1-9]\d{3}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1\d|2[0-8])|(?:0[13-9]|1[0-2])-(?:29|30)|(?:0[13578]|1[02])-31)|(?:[1-9]\d(?:0[48]|[2468][048]|[13579][26])|(?:[2468][048]|[13579][26])00)-02-29)T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:(\.\d{3}))(?:Z|[+-][01]\d:[0-5]\d)$/).description('When the transfer expires').label('A valid transfer expiry date must be supplied.'),
          extensionList: Joi.object().keys({
            extension: Joi.array().items(Joi.object().keys({
              key: Joi.string().required().min(1).max(32).description('Key').label('Supplied key fails to match the required format.'),
              value: Joi.string().required().min(1).max(128).description('Value').label('Supplied key value fails to match the required format.')
            })).required().min(1).max(16).description('Extension')
          }).optional().description('Extension list')
        }),
        failAction: (request, h, err) => { throw err }
      }
    }
  },
  {
    method: 'PUT',
    path: '/transactionRequests/{ID}',
    handler: Handler.putTransactionRequest,
    options: {
      id: `simulator_${__dirname.split('/').pop()}_putTransactionRequest`,
      tags: tags,
      description: 'Callback Transaction Request',
      payload: {
        failAction: 'error'
      },
      validate: {
        headers: Joi.object({
          'content-type': Joi.string().required().regex(regexContentType),
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
          ID: Joi.string().required().description('path')
        }),
        payload: Joi.object({
          transactionState: Joi.string().required().valid('RECEIVED', 'PENDING', 'COMPLETED', 'REJECTED').description('State of the transaction').label('@ Invalid transaction state given. @'),
          completedTimestamp: Joi.string().regex(/^(?:[1-9]\d{3}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1\d|2[0-8])|(?:0[13-9]|1[0-2])-(?:29|30)|(?:0[13578]|1[02])-31)|(?:[1-9]\d(?:0[48]|[2468][048]|[13579][26])|(?:[2468][048]|[13579][26])00)-02-29)T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:(\.\d{3}))(?:Z|[+-][01]\d:[0-5]\d)$/).description('When the transaction was completed').label('@ A valid transaction completion date must be supplied. @'),
          code: Joi.string().regex(/^[0-9a-zA-Z]{4,32}$/).optional(),
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
    path: '/transactionRequests/{ID}/error',
    handler: Handler.putTransactionRequestError,
    options: {
      id: `simulator_${__dirname.split('/').pop()}_putTransactionRequestError`,
      tags: tags,
      description: 'Error Callback Transaction Request',
      payload: {
        failAction: 'error'
      },
      validate: {
        headers: Joi.object({
          'content-type': Joi.string().required().regex(regexContentType),
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
          ID: Joi.string().required().description('path')
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
    path: '/transactionRequests/correlationid/{ID}',
    handler: Handler.getCorrelationId,
    options: {
      id: `simulator_${__dirname.split('/').pop()}_getCorrelationId`,
      tags: tags,
      description: 'Get details based on correlation id'
    }
  },
  {
    method: 'GET',
    path: '/transactionRequests/requests/{ID}',
    handler: Handler.getRequestById,
    options: {
      id: `simulator_${__dirname.split('/').pop()}_getRequestById`,
      tags: tags,
      description: 'Get details based on request id'
    }
  },
  {
    method: 'GET',
    path: '/transactionRequests/callbacks/{ID}',
    handler: Handler.getCallbackById,
    options: {
      id: `simulator_${__dirname.split('/').pop()}_getCallbackById`,
      tags: tags,
      description: 'Get details based on callback id'
    }
  }
]
