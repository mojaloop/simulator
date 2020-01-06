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
 - Steven Oderayi <steven.oderayi@modusbox.com>
 --------------
 ******/

'use strict'
const NodeCache = require('node-cache')
const correlationCache = new NodeCache()
const requestCache = new NodeCache()
const callbackCache = new NodeCache()
const request = require('../lib/sendRequest')
const https = require('https')
const Logger = require('@mojaloop/central-services-logger')
const Enums = require('@mojaloop/central-services-shared').Enum
const Metrics = require('../lib/metrics')
const base64url = require('base64url')

const transfersEndpoint = process.env.TRANSFERS_ENDPOINT || 'http://localhost:1080'
const transfersFulfilResponseDisabled = (process.env.TRANSFERS_FULFIL_RESPONSE_DISABLED !== undefined && process.env.TRANSFERS_FULFIL_RESPONSE_DISABLED !== 'false')
const transfersFulfilment = process.env.TRANSFERS_FULFILMENT || 'XoSz1cL0tljJSCp_VtIYmPNw-zFUgGfbUqf69AagUzY'
const signature = process.env.MOCK_JWS_SIGNATURE || 'abcJjvNrkyK2KBieDUbGfhaBUn75aDUATNF4joqA8OLs4QgSD7i6EO8BIdy6Crph3LnXnTM20Ai1Z6nt0zliS_qPPLU9_vi6qLb15FOkl64DQs9hnfoGeo2tcjZJ88gm19uLY_s27AJqC1GH1B8E2emLrwQMDMikwQcYvXoyLrL7LL3CjaLMKdzR7KTcQi1tCK4sNg0noIQLpV3eA61kess'

exports.postBulkTransfers = async function (req, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()

  Logger.debug(`[cid=${req.payload.bulkTransferId}, fsp=${req.headers['fspiop-source']}, source=${req.headers['fspiop-source']}, dest=${req.headers['fspiop-destination']}] ~ Simulator::api::payee::postTransfers - START`)

  const metadata = `${req.method} ${req.path} ${req.payload.bulkTransferId}`
  Logger.info(`IN Bulk Transfers POST:: received: ${metadata}.`)

  if (!transfersFulfilResponseDisabled) {
    // Saving Incoming request
    const incomingRequest = {
      headers: req.headers,
      data: req.payload
    }
    requestCache.set(req.payload.bulkTransferId, incomingRequest)

    const url = transfersEndpoint + '/bulkTransfers/' + req.payload.bulkTransferId
    const fspiopUriHeader = `/bulkTransfers/${req.payload.bulkTransferId}`
    try {
      const listOfIndividualTransfers = []
      for (const transfer of req.payload.individualTransfers) {
        const individualTransfer = {
          transferId: transfer.transferId,
          fulfilment: transfersFulfilment
        }
        listOfIndividualTransfers.push(individualTransfer)
      }
      const bulkTransferResponse = {
        completedTimestamp: new Date().toISOString(),
        individualTransferResults: listOfIndividualTransfers,
        bulkTransferState: 'COMPLETED'
      }

      const protectedHeader = {
        alg: 'RS256',
        'FSPIOP-Source': `${req.headers['fspiop-destination']}`,
        'FSPIOP-Destination': `${req.headers['fspiop-source']}`,
        'FSPIOP-URI': `/bulkTransfers/${req.payload.transferId}`,
        'FSPIOP-HTTP-Method': 'PUT',
        Date: ''
      }
      const fspiopSignature = {
        signature: signature,
        protectedHeader: `${base64url.encode(JSON.stringify(protectedHeader))}`
      }
      const opts = {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/vnd.interoperability.transfers+json;version=1.0',
          'FSPIOP-Source': req.headers['fspiop-destination'],
          'FSPIOP-Destination': req.headers['fspiop-source'],
          Date: new Date().toUTCString(),
          'FSPIOP-Signature': JSON.stringify(fspiopSignature),
          'FSPIOP-HTTP-Method': 'PUT',
          'FSPIOP-URI': fspiopUriHeader
          // traceparent: req.headers.traceparent ? req.headers.traceparent : undefined,
          // tracestate: req.headers.tracestate ? req.headers.tracestate : undefined
        },
        transformRequest: [(data, headers) => {
          delete headers.common.Accept
          return data
        }],
        httpsAgent: new https.Agent({
          rejectUnauthorized: false
        }),
        data: JSON.stringify(bulkTransferResponse)
      }
      // Logger.info(`Executing PUT: [${url}], HEADERS: [${JSON.stringify(opts.headers)}], BODY: [${JSON.stringify(bulkTransferResponse)}]`)
      const res = await request(url, opts, req.span)
      // Logger.info(`response: ${res.status}`)
      if (res.status !== Enums.Http.ReturnCodes.ACCEPTED.CODE) {
        // TODO: how does one identify the failed response?
        throw new Error(`Failed to send. Result: ${JSON.stringify(res)}`)
      }
      // Logger.perf(`[cid=${req.payload.transferId}, fsp=${req.headers['fspiop-source']}, source=${req.headers['fspiop-source']}, dest=${req.headers['fspiop-destination']}] ~ Simulator::api::payee::postTransfers - END`)
      histTimerEnd({
        success: true,
        fsp: req.headers['fspiop-source'],
        operation: 'postBulkTransfers',
        source: req.headers['fspiop-source'],
        destination: req.headers['fspiop-destination']
      })
    } catch (err) {
      Logger.error(err)
      // Logger.perf(`[cid=${req.payload.transferId}, fsp=${req.headers['fspiop-source']}, source=${req.headers['fspiop-source']}, dest=${req.headers['fspiop-destination']}] ~ Simulator::api::payee::postTransfers - ERROR`)
      histTimerEnd({
        success: false,
        fsp: req.headers['fspiop-source'],
        operation: 'postBulkTransfers',
        source: req.headers['fspiop-source'],
        destination: req.headers['fspiop-destination']
      })
      // TODO: what if this fails? We need to log. What happens by default?
      // const url = await rq.createErrorUrl(db, req.path, requesterName);
      // TODO: review this error message
      // TODO: we should be able to throw an AppError somewhere, test whether the error
      // received in this handler is an AppError, then send the requester the correct
      // payload etc. based on the contents of that AppError.
      // rq.sendError(url, asyncResponses.serverError, rq.defaultHeaders(requesterName, 'participants'), {logger});
    }
  } else {
    // Logger.perf(`[cid=${req.payload.transferId}, fsp=${req.headers['fspiop-source']}, source=${req.headers['fspiop-source']}, dest=${req.headers['fspiop-destination']}] ~ Simulator::api::payee::postTransfers - END`)
    histTimerEnd({
      success: true,
      fsp: req.headers['fspiop-source'],
      operation: 'postBulkTransfers',
      source: req.headers['fspiop-source'],
      destination: req.headers['fspiop-destination']
    })
  }

  return h.response().code(Enums.Http.ReturnCodes.ACCEPTED.CODE)
}

exports.putBulkTransfersById = function (request, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()
  // Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payee::putTransfersById - START`)

  Logger.info(`IN Bulk Transfer:: PUT /bulkTransfers/${request.params.id}, PAYLOAD: [${JSON.stringify(request.payload)}]`)

  correlationCache.set(request.params.id, request.payload)

  // Saving Incoming request
  const incomingRequest = {
    headers: request.headers,
    data: request.payload
  }
  callbackCache.set(request.params.id, incomingRequest)

  // Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payee::putTransfersById - END`)
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

  // Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payee::putTransfersByIdError - START`)

  Logger.info(`IN Bulk Transfers :: PUT /bulkTransfers/${request.params.id}/error, PAYLOAD: [${JSON.stringify(request.payload)}]`)
  correlationCache.set(request.params.id, request.payload)

  // Saving Incoming request
  const incomingRequest = {
    headers: request.headers,
    data: request.payload
  }
  callbackCache.set(request.params.id, incomingRequest)

  // Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payee::putTransfersByIdError - END`)
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

  // Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payee::getcorrelationId - START`)

  Logger.info(`IN bulk transfers:: Final response for GET /bulkTransfers/correlationid/${request.params.id}, CACHE: [${JSON.stringify(correlationCache.get(request.params.id))}`)

  // Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payee::getcorrelationId - END`)
  histTimerEnd({ success: true, fsp: 'payee', operation: 'getBulkCorrelationId' })
  return h.response(correlationCache.get(request.params.id)).code(Enums.Http.ReturnCodes.ACCEPTED.CODE)
}

exports.getRequestById = function (request, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()

  Logger.info(`IN Bulk Transfers :: PUT /bulkTransfers/requests/${request.params.id}, CACHE: [${JSON.stringify(requestCache.get(request.params.id))}]`)
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

  Logger.info(`IN Bulk Transfers :: PUT /bulkTransfers/callbacks/${request.params.id}, CACHE: [${JSON.stringify(callbackCache.get(request.params.id))}]`)
  const responseData = callbackCache.get(request.params.id)
  callbackCache.del(request.params.id)

  histTimerEnd({ success: true, fsp: 'payee', operation: 'getBulkCallbackById' })

  return h.response(responseData).code(Enums.Http.ReturnCodes.OK.CODE)
}
