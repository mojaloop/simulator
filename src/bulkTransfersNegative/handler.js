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
 - Steven Oderayi <steven.oderayi@modusbox.com>
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

exports.postBulkTransfers = async function (req, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()
  Logger.isDebugEnabled && Logger.debug(`[cid=${req.payload.bulkTransferId}, fsp=${req.headers['fspiop-source']}, source=${req.headers['fspiop-source']}, dest=${req.headers['fspiop-destination']}] ~ Simulator::api::payee::postBulkTransfers - START`)
  const metadata = `${req.method} ${req.path} ${req.payload.bulkTransferId}`
  Logger.isInfoEnabled && Logger.info(`IN BulkTransfersNegative POST:: received: ${metadata}.`)
  histTimerEnd({
    success: true,
    fsp: req.headers['fspiop-source'],
    operation: 'postBulkTransfers',
    source: req.headers['fspiop-source'],
    destination: req.headers['fspiop-destination']
  })

  return h.response().code(Enums.Http.ReturnCodes.ACCEPTED.CODE)
}

exports.putBulkTransfersById = function (request, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()
  Logger.isInfoEnabled && Logger.info(`IN Bulk Transfer:: PUT /bulkTransfersNegative/${request.params.id}, PAYLOAD: [${JSON.stringify(request.payload)}]`)
  correlationCache.set(request.params.id, request.payload)
  // Saving Incoming request
  const incomingRequest = {
    headers: request.headers,
    data: request.payload
  }
  callbackCache.set(request.params.id, incomingRequest)
  histTimerEnd({
    success: true,
    fsp: request.headers['fspiop-source'],
    operation: 'putBulkTransfersById',
    source: request.headers['fspiop-source'],
    destination: request.headers['fspiop-destination']
  })
  return h.response().code(Enums.Http.ReturnCodes.OK.CODE)
}

exports.putBulkTransfersByIdError = function (request, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()
  Logger.isInfoEnabled && Logger.info(`IN Bulk Transfers :: PUT /bulkTransfersNegative/${request.params.id}/error, PAYLOAD: [${JSON.stringify(request.payload)}]`)
  correlationCache.set(request.params.id, request.payload)
  // Saving Incoming request
  const incomingRequest = {
    headers: request.headers,
    data: request.payload
  }
  callbackCache.set(request.params.id, incomingRequest)
  histTimerEnd({
    success: true,
    fsp: request.headers['fspiop-source'],
    operation: 'putBulkTransfersByIdError',
    source: request.headers['fspiop-source'],
    destination: request.headers['fspiop-destination']
  })
  return h.response().code(Enums.Http.ReturnCodes.OK.CODE)
}

exports.getCorrelationId = function (request, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()
  Logger.isInfoEnabled && Logger.info(`IN bulk transfers:: Final response for GET /bulkTransfersNegative/correlationid/${request.params.id}, CACHE: [${JSON.stringify(correlationCache.get(request.params.id))}`)
  histTimerEnd({ success: true, fsp: 'payee', operation: 'getBulkCorrelationId' })
  return h.response(correlationCache.get(request.params.id)).code(Enums.Http.ReturnCodes.ACCEPTED.CODE)
}

exports.getRequestById = function (request, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()
  Logger.isInfoEnabled && Logger.info(`IN Bulk Transfers :: PUT /bulkTransfersNegative/requests/${request.params.id}, CACHE: [${JSON.stringify(requestCache.get(request.params.id))}]`)
  const responseData = requestCache.get(request.params.id)
  requestCache.del(request.params.id)

  histTimerEnd({ success: true, fsp: 'payee', operation: 'getBulkRequestById' })

  return h.response(responseData).code(Enums.Http.ReturnCodes.OK.CODE)
}

exports.getCallbackById = function (request, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()

  Logger.isInfoEnabled && Logger.info(`IN Bulk Transfers :: PUT /bulkTransfers/callbacks/${request.params.id}, CACHE: [${JSON.stringify(callbackCache.get(request.params.id))}]`)
  const responseData = callbackCache.get(request.params.id)
  callbackCache.del(request.params.id)

  histTimerEnd({ success: true, fsp: 'payee', operation: 'getBulkCallbackById' })

  return h.response(responseData).code(Enums.Http.ReturnCodes.OK.CODE)
}
