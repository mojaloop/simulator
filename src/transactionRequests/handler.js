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
 * Vijay Kumar Guthi <vijay.guthi@modusbox.com>

 --------------
 ******/

'use strict'
const NodeCache = require('node-cache')
const transactionRequestsCache = new NodeCache()
// const requestCache = new NodeCache()
// const batchRequestCache = new NodeCache()
const sendRequest = require('../lib/sendRequest')
const Logger = require('@mojaloop/central-services-logger')
const Enums = require('@mojaloop/central-services-shared').Enum
const ErrorHandler = require('@mojaloop/central-services-error-handling')

const transactionRequestsEndpoint = process.env.TRANSACTION_REQUESTS_ENDPOINT || 'http://moja-transaction-requests-service'

exports.incomingTransactionRequests = function (request, h) {
  (async () => {
    const url = transactionRequestsEndpoint + '/transactionRequests/' + request.payload.transactionRequestId
    const fspiopUriHeader = `/transactionRequests/${request.payload.transactionRequestId}`
    try {
      if (transactionRequestsCache.get(request.payload.transactionRequestId)) {
        await sendErrorCallback(
          ErrorHandler.CreateFSPIOPError(ErrorHandler.Enums.FSPIOPErrorCodes.CLIENT_ERROR, `ID:${request.payload.transactionRequestId} already exists`, null, request.headers['fspiop-source']),
          request.params.ID,
          request.headers,
          request.span
        )
        throw new Error(`ID:${request.payload.transactionRequestId} already exists`)
      } else {
        transactionRequestsCache.set(request.payload.transactionRequestId, request.payload)
      }

      const transactionRequestsResponse = {
        transactionId: request.payload.transactionRequestId,
        transactionRequestState: 'RECEIVED',
        extensionList: request.payload.extensionList
      }
      const opts = {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/vnd.interoperability.transfers+json;version=1.0',
          'FSPIOP-Source': request.headers['fspiop-destination'],
          'FSPIOP-Destination': request.headers['fspiop-source'],
          Date: new Date().toUTCString(),
          'FSPIOP-HTTP-Method': 'PUT',
          'FSPIOP-URI': fspiopUriHeader
        },
        transformRequest: [(data, headers) => {
          delete headers.common.Accept
          return data
        }],
        data: JSON.stringify(transactionRequestsResponse)
      }

      const res = await sendRequest(url, opts, request.span)
      Logger.info(`response: ${res.status}`)
      if ((res.status !== Enums.Http.ReturnCodes.ACCEPTED.CODE) && (res.status !== Enums.Http.ReturnCodes.OK.CODE)) {
        throw new Error(`Failed to send. Result: ${JSON.stringify(res)}`)
      }
    } catch (err) {
      Logger.error(err)
    }
  })()

  return h.response().code(202)
}

exports.getTransactionRequest = function (request, h) {
  (async () => {
    const url = transactionRequestsEndpoint + '/transactionRequests/' + request.params.ID
    const fspiopUriHeader = `/transactionRequests/${request.params.ID}`
    try {
      let getTransactionRequestsResponse
      if (transactionRequestsCache.get(request.params.ID)) {
        // getTransactionRequestsResponse = transactionRequestsCache.get(request.params.ID)
        getTransactionRequestsResponse = {
          transactionId: request.params.ID,
          transactionRequestState: 'RECEIVED'
        }
        // Delete the transaction request in cache
        transactionRequestsCache.del(request.params.ID)
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
          'FSPIOP-URI': fspiopUriHeader
        },
        transformRequest: [(data, headers) => {
          delete headers.common.Accept
          return data
        }],
        data: JSON.stringify(getTransactionRequestsResponse)
      }

      const res = await sendRequest(url, opts, request.span)
      Logger.info(`response: ${res.status}`)
      if ((res.status !== Enums.Http.ReturnCodes.ACCEPTED.CODE) && (res.status !== Enums.Http.ReturnCodes.OK.CODE)) {
        throw new Error(`Failed to send. Result: ${JSON.stringify(res)}`)
      }
    } catch (err) {
      Logger.error(err)
    }
  })()

  return h.response().code(202)
}

exports.callbackTransactionRequests = function (request, h) {
  return h.response().code(Enums.Http.ReturnCodes.OK.CODE)
}

exports.errorCallbackTransactionRequests = function (request, h) {
  return h.response().code(Enums.Http.ReturnCodes.OK.CODE)
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
