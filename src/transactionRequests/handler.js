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
 - Vijay Kumar Guthi <vijay.guthi@modusbox.com>
 - Steven Oderayi <steven.oderayi@modusbox.com>

 --------------
 ******/

'use strict'
const NodeCache = require('node-cache')
const sendRequest = require('../lib/sendRequest')
const Logger = require('@mojaloop/central-services-logger')
const Enums = require('@mojaloop/central-services-shared').Enum
const ErrorHandler = require('@mojaloop/central-services-error-handling')

const requestsCache = new NodeCache()
const callbackCache = new NodeCache()
const correlationCache = new NodeCache()
const transactionRequestsEndpoint = process.env.TRANSACTION_REQUESTS_ENDPOINT || 'http://moja-transaction-requests-service'

exports.getTransactionRequestById = function (request, h) {
  (async () => {
    Logger.info(`IN transactionRequests:: Final response for GET /transactionRequests/correlationid/${request.params.ID}, CACHE: [${JSON.stringify(correlationCache.get(request.params.ID))}`)
    const url = transactionRequestsEndpoint + '/transactionRequests/' + request.params.ID
    try {
      let transactionRequestResponse
      if (requestsCache.get(request.params.ID)) {
        transactionRequestResponse = {
          transactionId: request.params.ID,
          transactionRequestState: 'RECEIVED'
        }
        requestsCache.del(request.params.ID)
      } else {
        await sendErrorCallback(
          ErrorHandler.CreateFSPIOPError(ErrorHandler.Enums.FSPIOPErrorCodes.TXN_REQUEST_ID_NOT_FOUND, `Transaction Request id ${request.params.ID} not found`, null, request.headers['fspiop-source']),
          request.params.ID,
          request.headers,
          request.span
        )
        throw new Error(`ID:${request.params.ID} not found`)
      }
      const opts = {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/vnd.interoperability.transfers+json;version=1.0',
          'FSPIOP-Source': request.headers['fspiop-destination'],
          'FSPIOP-Destination': request.headers['fspiop-source'],
          Date: new Date().toUTCString(),
          'FSPIOP-HTTP-Method': 'PUT',
          'FSPIOP-URI': `/transactionRequests/${request.params.ID}`
        },
        transformRequest: [(data, headers) => {
          delete headers.common.Accept
          return data
        }],
        data: JSON.stringify(transactionRequestResponse)
      }
      const res = await sendRequest(url, opts, request.span)
      Logger.info(`response: ${res.status}`)
      if (res.status !== Enums.Http.ReturnCodes.OK.CODE) {
        throw new Error(`Failed to send. Result: ${JSON.stringify(res)}`)
      }
    } catch (err) {
      Logger.error(err)
    }
  })()

  return h.response().code(Enums.Http.ReturnCodes.ACCEPTED.CODE)
}

exports.postTransactionRequest = function (request, h) {
  (async () => {
    const metadata = `${request.method} ${request.path} ${request.payload.transactionRequestId}`
    Logger.info(`IN transactionRequests POST:: received: ${metadata}.`)
    const url = transactionRequestsEndpoint + '/transactionRequests/' + request.payload.transactionRequestId
    try {
      if (requestsCache.get(request.payload.transactionRequestId)) {
        await sendErrorCallback(
          ErrorHandler.CreateFSPIOPError(ErrorHandler.Enums.FSPIOPErrorCodes.CLIENT_ERROR, `ID:${request.payload.transactionRequestId} already exists`, null, request.headers['fspiop-source']),
          request.params.ID,
          request.headers,
          request.span
        )
        throw new Error(`ID:${request.payload.transactionRequestId} already exists`)
      } else {
        requestsCache.set(request.payload.transactionRequestId, { headers: request.headers, data: request.payload })
      }
      const transactionRequestsResponse = {
        transactionId: request.payload.transactionRequestId,
        transactionRequestState: 'RECEIVED',
        extensionList: request.payload.extensionList
      }
      const opts = {
        method: 'PUT',
        headers: {
          ID: request.payload.transactionRequestId,
          'Content-Type': 'application/vnd.interoperability.transactionRequests+json;version=1.0',
          'FSPIOP-Source': request.headers['fspiop-destination'],
          'FSPIOP-Destination': request.headers['fspiop-source'],
          Date: new Date().toUTCString(),
          'FSPIOP-HTTP-Method': 'PUT',
          'FSPIOP-URI': `/transactionRequests/${request.payload.transactionRequestId}`
        },
        transformRequest: [(data, headers) => {
          delete headers.common.Accept
          return data
        }],
        data: JSON.stringify(transactionRequestsResponse)
      }
      const res = await sendRequest(url, opts, request.span)
      Logger.info(`response: ${res.status}`)
      if (res.status !== Enums.Http.ReturnCodes.OK.CODE) {
        throw new Error(`Failed to send. Result: ${JSON.stringify(res)}`)
      }
    } catch (err) {
      Logger.error(err)
    }
  })()

  return h.response().code(Enums.Http.ReturnCodes.ACCEPTED.CODE)
}

exports.putTransactionRequest = function (request, h) {
  Logger.info(`IN transactionRequests :: PUT /transactionRequests/${request.params.ID}, PAYLOAD: [${JSON.stringify(request.payload)}]`)
  correlationCache.set(request.params.ID, { headers: request.headers, data: request.payload })
  callbackCache.set(request.params.ID, { headers: request.headers, data: request.payload })

  return h.response().code(Enums.Http.ReturnCodes.OK.CODE)
}

exports.putTransactionRequestError = function (request, h) {
  Logger.info(`IN transactionRequests :: PUT /transactionRequests/${request.params.ID}/error, PAYLOAD: [${JSON.stringify(request.payload)}]`)
  correlationCache.set(request.params.ID, { headers: request.headers, data: request.payload })
  callbackCache.set(request.params.ID, { headers: request.headers, data: request.payload })

  return h.response().code(Enums.Http.ReturnCodes.OK.CODE)
}

exports.getCorrelationId = function (request, h) {
  Logger.info(`IN transactionRequests:: GET /transactionRequests/correlationid/${request.params.ID}, CACHE: [${JSON.stringify(correlationCache.get(request.params.ID))}`)

  return h.response(correlationCache.get(request.params.ID)).code(Enums.Http.ReturnCodes.ACCEPTED.CODE)
}

exports.getRequestById = function (request, h) {
  Logger.info(`IN transactionRequests :: GET /transactionRequests/requests/${request.params.ID}, CACHE: [${JSON.stringify(requestsCache.get(request.params.ID))}]`)
  const responseData = requestsCache.get(request.params.ID)
  requestsCache.del(request.params.ID)

  return h.response(responseData).code(Enums.Http.ReturnCodes.OK.CODE)
}

exports.getCallbackById = function (request, h) {
  Logger.info(`IN transactionRequests :: GET /transactionRequests/callbacks/${request.params.ID}, CACHE: [${JSON.stringify(callbackCache.get(request.params.ID))}]`)
  const responseData = callbackCache.get(request.params.ID)
  callbackCache.del(request.params.ID)

  return h.response(responseData).code(Enums.Http.ReturnCodes.OK.CODE)
}

const sendErrorCallback = async (fspiopError, transactionRequestId, headers, span) => {
  try {
    const url = transactionRequestsEndpoint + '/transactionRequests/' + transactionRequestId + '/error'
    const fspiopUriHeader = '/transactionRequests/' + transactionRequestId + '/error'
    const opts = {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/vnd.interoperability.quotes+json;version=1.0',
        'FSPIOP-Source': headers['fspiop-destination'],
        'FSPIOP-Destination': headers['fspiop-source'],
        Date: new Date().toUTCString(),
        'FSPIOP-HTTP-Method': 'PUT',
        'FSPIOP-URI': fspiopUriHeader
      },
      transformRequest: [(data, headers) => {
        delete headers.common.Accept
        return data
      }],
      data: JSON.stringify(fspiopError.toApiErrorObject())
    }
    const res = await sendRequest(url, opts, span)
    if (res.status !== Enums.Http.ReturnCodes.OK.CODE) {
      throw new Error(`Failed to send. Result: ${res}`)
    }
  } catch (err) {
    Logger.error(err)
  }
}
