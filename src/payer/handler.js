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
 - Georgi Georgiev georgi.georgiev@modusbox.com
 - Murthy Kakarlamudi murthy@modusbox.com
 --------------
 ******/

'use strict'

const NodeCache = require('node-cache')
const correlationCache = new NodeCache()
const requestCache = new NodeCache()
const callbackCache = new NodeCache()
const Metrics = require('../lib/metrics')
const Logger = require('@mojaloop/central-services-logger')
const Enums = require('@mojaloop/central-services-shared').Enum

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

// Section about /participants
exports.putParticipantsByTypeId = function (request, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()

  // Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payer::putParticipantsByTypeId - START`)

  Logger.info(`IN PAYERFSP:: PUT /payerfsp/participants/${request.params.id}, PAYLOAD: [${JSON.stringify(request.payload)}]`)

  // Saving Incoming request
  const incomingRequest = {
    headers: request.headers,
    data: request.payload
  }
  callbackCache.set(request.params.id, incomingRequest)

  correlationCache.set(request.params.id, request.payload)

  // Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payer::putParticipantsByTypeId - END`)
  histTimerEnd({ success: true, fsp: 'payer', operation: 'putParticipantsByTypeId', source: request.headers['fspiop-source'], destination: request.headers['fspiop-destination'] })
  return h.response().code(Enums.Http.ReturnCodes.OK.CODE)
}

// Section about /parties
exports.putPartiesByTypeId = function (request, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()

  // Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payer::putPartiesByTypeId - START`)

  Logger.info(`IN PAYERFSP:: PUT /payerfsp/parties/${request.params.type}/${request.params.id}, PAYLOAD: [${JSON.stringify(request.payload)}]`)

  // Saving Incoming request
  const incomingRequest = {
    headers: request.headers,
    data: request.payload
  }
  callbackCache.set(request.params.id, incomingRequest)

  correlationCache.set(request.params.id, request.payload)

  // Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payer::putPartiesByTypeId - END`)
  histTimerEnd({ success: true, fsp: 'payer', operation: 'putPartiesByTypeId', source: request.headers['fspiop-source'], destination: request.headers['fspiop-destination'] })
  return h.response().code(Enums.Http.ReturnCodes.OK.CODE)
}

exports.putPartiesByTypeIdAndError = function (request, h) {
  console.log((new Date().toISOString()), `IN PAYERFSP:: PUT /payerfsp/parties//${request.params.type}/${request.params.id}/error`, request.payload)
  correlationCache.set(request.params.id, request.payload)

  // Saving Incoming request
  const incomingRequest = {
    headers: request.headers,
    data: request.payload
  }
  callbackCache.set(request.params.id, incomingRequest)

  return h.response().code(Enums.Http.ReturnCodes.OK.CODE)
}

// Section about Quotes
exports.putQuotesById = function (request, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()

  // Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payer::putQuotesById - START`)

  Logger.info(`IN PAYERFSP:: PUT /payerfsp/quotes/${request.params.id}, PAYLOAD: [${JSON.stringify(request.payload)}]`)

  // Saving Incoming request
  const incomingRequest = {
    headers: request.headers,
    data: request.payload
  }
  callbackCache.set(request.params.id, incomingRequest)
  correlationCache.set(request.params.id, request.payload)

  // Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payer::putQuotesById - END`)
  histTimerEnd({ success: true, fsp: 'payer', operation: 'putQuotesById', source: request.headers['fspiop-source'], destination: request.headers['fspiop-destination'] })
  return h.response().code(Enums.Http.ReturnCodes.OK.CODE)
}

exports.putQuotesByIdAndError = function (request, h) {
  console.log((new Date().toISOString()), 'IN PAYERFSP:: PUT /payerfsp/quotes/' + request.params.id + '/error', request.payload)
  correlationCache.set(request.params.id, request.payload)

  // Saving Incoming request
  const incomingRequest = {
    headers: request.headers,
    data: request.payload
  }
  callbackCache.set(request.params.id, incomingRequest)

  return h.response().code(Enums.Http.ReturnCodes.OK.CODE)
}

// Section about Transfers
exports.putTransfersById = function (request, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()

  // Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payer::putTransfersById - START`)

  Logger.info(`IN PAYERFSP:: PUT /payerfsp/transfers/${request.params.id}, PAYLOAD: [${JSON.stringify(request.payload)}]`)

  // Saving Incoming request
  const incomingRequest = {
    headers: request.headers,
    data: request.payload
  }
  callbackCache.set(request.params.id, incomingRequest)

  correlationCache.set(request.params.id, request.payload)

  // Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payer::putTransfersById - END`)
  histTimerEnd({ success: true, fsp: 'payer', operation: 'putTransfersById', source: request.headers['fspiop-source'], destination: request.headers['fspiop-destination'] })
  return h.response().code(Enums.Http.ReturnCodes.OK.CODE)
}

exports.putTransfersByIdError = function (request, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()

  // Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payer::putTransfersByIdError - START`)

  Logger.info(`IN PAYERFSP:: PUT /payerfsp/transfers/${request.params.id}/error, PAYLOAD: [${JSON.stringify(request.payload)}]`)
  correlationCache.set(request.params.id, request.payload)

  // Saving Incoming request
  const incomingRequest = {
    headers: request.headers,
    data: request.payload
  }
  callbackCache.set(request.params.id, incomingRequest)

  // Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payer::putTransfersByIdError - END`)
  histTimerEnd({ success: true, fsp: 'payer', operation: 'putTransfersByIdError', source: request.headers['fspiop-source'], destination: request.headers['fspiop-destination'] })
  return h.response().code(Enums.Http.ReturnCodes.OK.CODE)
}

exports.getcorrelationId = function (request, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()

  // Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payer::getcorrelationId - START`)

  const responseData = correlationCache.get(request.params.id)
  Logger.info(`IN PAYERFSP:: PUT /payerfsp/correlationid/${request.params.id}, CACHE: [${JSON.stringify(responseData)}]`)

  // Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payer::getcorrelationId - END`)
  histTimerEnd({ success: true, fsp: 'payer', operation: 'getcorrelationId' })
  return h.response(responseData).code(Enums.Http.ReturnCodes.ACCEPTED.CODE)
}

exports.getRequestById = function (request, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()

  const responseData = requestCache.get(request.params.id)
  Logger.info(`IN PAYERFSP:: PUT /payerfsp/requests/${request.params.id}, CACHE: [${JSON.stringify(responseData)}]`)
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

  const responseData = callbackCache.get(request.params.id)
  Logger.info(`IN PAYERFSP:: PUT /payerfsp/callbacks/${request.params.id}, CACHE: [${JSON.stringify(responseData)}]`)
  callbackCache.del(request.params.id)

  histTimerEnd({ success: true, fsp: 'payer', operation: 'getCallbackById' })

  return h.response(responseData).code(Enums.Http.ReturnCodes.OK.CODE)
}
