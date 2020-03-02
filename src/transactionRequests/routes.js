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

 * Rajiv Mothilal <rajiv.mothilal@modusbox.com>

 --------------
 ******/

const Handler = require('./handler')
const Enum = require('@mojaloop/central-services-shared').Enum
const tags = ['api', 'transactionRequests', Enum.Tags.RouteTags.SAMPLED]

module.exports = [
  {
    method: 'GET',
    path: '/transactionRequests/{ID}',
    handler: Handler.getTransactionRequest,
    options: {
      id: `simulator_${__dirname.split('/').pop()}_getTransactionRequest`,
      tags: tags,
      description: 'Get a transaction request by ID',
      validate: {
        headers: Joi.object({
          accept: Joi.string().optional().regex(regexAccept)
        }).unknown(false).options({ stripUnknown: true }),
        params: Joi.object({
          ID: Joi.string().guid().required().description('path').label('Supply a valid transfer Id to continue.')
        })
      }
    }
  },
  {
    method: 'POST',
    path: '/transactionRequests',
    handler: Handler.incomingTransactionRequests,
    config: {
      id: `simulator_${__dirname.split('/').pop()}_incomingTransactionRequests`,
      tags: tags,
      description: 'Incoming Transaction Requests'
    }
  },
  {
    method: 'PUT',
    path: '/transactionRequests/{ID}',
    handler: Handler.callbackTransactionRequests,
    options: {
      id: `simulator_${__dirname.split('/').pop()}_callbackTransactionRequests`,
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
          transactionId: Joi.string().required().description('Identifies a related transaction (if a transaction has been created).').label('@ Invalid transaction Id given. @'),
          transactionRequestState: Joi.string().valid('RECEIVED', 'PENDING', 'ACCEPTED', 'REJECTED').required().description('State of the transaction').label('@ Invalid transaction state given. @'),
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
    handler: Handler.errorCallbackTransactionRequests,
    options: {
      id: `simulator_${__dirname.split('/').pop()}_errorCallbackTransactionRequests`,
      tags: tags,
      description: 'Error Callback Transaction Requests'
    }
  }
]
