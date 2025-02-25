/*****
 License
 --------------
 Copyright © 2020-2025 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Mojaloop Foundation for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 * Mojaloop Foundation
 - Name Surname <name.surname@mojaloop.io>
 - Sridevi Miriyala sridevi.miriyala@modusbox.com
 --------------
 ******/

'use strict'

const NodeCache = require('node-cache')
const correlationCache = new NodeCache()
const requestCache = new NodeCache()
const callbackCache = new NodeCache()
const Logger = require('@mojaloop/central-services-logger')
const Enums = require('@mojaloop/central-services-shared').Enum
const Metrics = require('../lib/metrics')

const extractUrls = (request) => {
  const urls = {}
  request.server.table()[0].table.filter(route => {
    return route.settings.id !== undefined &&
      Array.isArray(route.settings.tags) &&
      route.settings.tags.indexOf('api') >= 0
  }).forEach(route => {
    urls[route.settings.id] = `localhost${route.path.replace(/\{/g, ':').replace(/\}/g, '')}`
  })
  return urls
}

exports.metadata = function (request, h) {
  return h.response({
    directory: 'localhost',
    urls: extractUrls(request)
  }).code(Enums.Http.ReturnCodes.OK.CODE)
}

// Section about Transfers

exports.putTransfersById = function (request, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()

  // Logger.isPerfEnabled && Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payer::putTransfersById - START`)

  Logger.isInfoEnabled && Logger.info(`IN noresponsepayeefsp:: PUT /noresponsepayeefsp/transfers/${request.params.id}, PAYLOAD: [${JSON.stringify(request.payload)}]`)

  // Saving Incoming request
  const incomingRequest = {
    headers: request.headers,
    data: request.payload
  }
  callbackCache.set(request.params.id, incomingRequest)

  correlationCache.set(request.params.id, request.payload)

  // Logger.isPerfEnabled && Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payer::putTransfersById - END`)
  histTimerEnd({ success: true, fsp: 'payer', operation: 'putTransfersById', source: request.headers['fspiop-source'], destination: request.headers['fspiop-destination'] })
  return h.response().code(Enums.Http.ReturnCodes.OK.CODE)
}

exports.putTransfersByIdError = function (request, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()

  // Logger.isPerfEnabled && Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payer::putTransfersByIdError - START`)

  Logger.isInfoEnabled && Logger.info(`IN noresponsepayeefsp:: PUT /noresponsepayeefsp/transfers/${request.params.id}/error, PAYLOAD: [${JSON.stringify(request.payload)}]`)
  correlationCache.set(request.params.id, request.payload)

  // Saving Incoming request
  const incomingRequest = {
    headers: request.headers,
    data: request.payload
  }
  callbackCache.set(request.params.id, incomingRequest)

  // Logger.isPerfEnabled && Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payer::putTransfersByIdError - END`)
  histTimerEnd({ success: true, fsp: 'payer', operation: 'putTransfersByIdError', source: request.headers['fspiop-source'], destination: request.headers['fspiop-destination'] })
  return h.response().code(Enums.Http.ReturnCodes.OK.CODE)
}

exports.getRequestById = function (request, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()

  Logger.isInfoEnabled && Logger.info(`IN noresponsepayeefsp:: PUT /noresponsepayeefsp/requests/${request.params.id}, CACHE: [${JSON.stringify(requestCache.get(request.params.id))}]`)
  const responseData = requestCache.get(request.params.id)
  requestCache.del(request.params.id)

  histTimerEnd({ success: true, fsp: 'payer', operation: 'getRequestById' })

  return h.response(responseData).code(Enums.Http.ReturnCodes.OK.CODE)
}

exports.getCallbackById = function (request, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()

  Logger.isInfoEnabled && Logger.info(`IN noresponsepayeefsp:: PUT /noresponsepayeefsp/callbacks/${request.params.id}, CACHE: [${JSON.stringify(callbackCache.get(request.params.id))}]`)
  const responseData = callbackCache.get(request.params.id)
  callbackCache.del(request.params.id)

  histTimerEnd({ success: true, fsp: 'payer', operation: 'getCallbackById' })

  return h.response(responseData).code(Enums.Http.ReturnCodes.OK.CODE)
}

exports.postQuotes = function (request, h) {
  (async function () {
    const histTimerEnd = Metrics.getHistogram(
      'sim_request',
      'Histogram for Simulator http operations',
      ['success', 'fsp', 'operation', 'source', 'destination']
    ).startTimer()

    const metadata = `${request.method} ${request.path}`
    const quoteRequest = request.payload
    Logger.isInfoEnabled && Logger.info((new Date().toISOString()), ['IN NORESPONSEPAYEEFSP::'], `received: ${metadata}. `)
    Logger.isInfoEnabled && Logger.info(`incoming request: ${quoteRequest.quoteId}`)

    // Saving Incoming request
    const incomingRequest = {
      headers: request.headers,
      data: quoteRequest
    }
    requestCache.set(quoteRequest.quoteId, incomingRequest)
    histTimerEnd({ success: true, fsp: 'payer', operation: 'postQuotes', source: request.headers['fspiop-source'], destination: request.headers['fspiop-destination'] })
  })()
  return h.response().code(Enums.Http.ReturnCodes.ACCEPTED.CODE)
}

exports.putQuotesById = function (request, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()

  Logger.isInfoEnabled && Logger.info(`IN NORESPONSEPAYEEFSP:: PUT /noresponsepayeefsp/quotes/${request.params.id}, PAYLOAD: [${JSON.stringify(request.payload)}]`)

  const incomingRequest = {
    headers: request.headers,
    data: request.payload
  }
  callbackCache.set(request.params.id, incomingRequest)
  correlationCache.set(request.params.id, request.payload)

  histTimerEnd({ success: true, fsp: 'payee', operation: 'putQuotesById', source: request.headers['fspiop-source'], destination: request.headers['fspiop-destination'] })
  return h.response().code(Enums.Http.ReturnCodes.OK.CODE)
}

exports.putQuotesByIdAndError = function (request, h) {
  console.log((new Date().toISOString()), 'IN NORESPONSEPAYEEFSP:: PUT /noresponsepayeefsp/quotes/' + request.params.id + '/error', request.payload)
  correlationCache.set(request.params.id, request.payload)

  const incomingRequest = {
    headers: request.headers,
    data: request.payload
  }
  callbackCache.set(request.params.id, incomingRequest)

  return h.response().code(Enums.Http.ReturnCodes.OK.CODE)
}

exports.getQuotesById = function (request, h) {
  Logger.isInfoEnabled && Logger.info(`IN NORESPONSEPAYEEFSP:: GET /noresponsepayeefsp/quotes/${request.params.id}, CACHE: [undefined]`)

  return h.response().code(Enums.Http.ReturnCodes.ACCEPTED.CODE)
}
