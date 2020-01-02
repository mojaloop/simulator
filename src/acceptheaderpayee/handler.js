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

const partiesEndpoint = process.env.PARTIES_ENDPOINT || 'http://localhost:1080'
const quotesEndpoint = process.env.QUOTES_ENDPOINT || 'http://localhost:1080'
const transfersEndpoint = process.env.TRANSFERS_ENDPOINT || 'http://localhost:1080'
const transfersFulfilResponseDisabled = (process.env.TRANSFERS_FULFIL_RESPONSE_DISABLED !== undefined && process.env.TRANSFERS_FULFIL_RESPONSE_DISABLED !== 'false')
const transfersFulfilment = process.env.TRANSFERS_FULFILMENT || 'XoSz1cL0tljJSCp_VtIYmPNw-zFUgGfbUqf69AagUzY'
const transfersCondition = process.env.TRANSFERS_CONDITION || 'HOr22-H3AfTDHrSkPjJtVPRdKouuMkDXTR4ejlQa8Ks'
const transfersIlpPacket = process.env.TRANSFERS_ILPPACKET || 'AQAAAAAAAADIEHByaXZhdGUucGF5ZWVmc3CCAiB7InRyYW5zYWN0aW9uSWQiOiIyZGY3NzRlMi1mMWRiLTRmZjctYTQ5NS0yZGRkMzdhZjdjMmMiLCJxdW90ZUlkIjoiMDNhNjA1NTAtNmYyZi00NTU2LThlMDQtMDcwM2UzOWI4N2ZmIiwicGF5ZWUiOnsicGFydHlJZEluZm8iOnsicGFydHlJZFR5cGUiOiJNU0lTRE4iLCJwYXJ0eUlkZW50aWZpZXIiOiIyNzcxMzgwMzkxMyIsImZzcElkIjoicGF5ZWVmc3AifSwicGVyc29uYWxJbmZvIjp7ImNvbXBsZXhOYW1lIjp7fX19LCJwYXllciI6eyJwYXJ0eUlkSW5mbyI6eyJwYXJ0eUlkVHlwZSI6Ik1TSVNETiIsInBhcnR5SWRlbnRpZmllciI6IjI3NzEzODAzOTExIiwiZnNwSWQiOiJwYXllcmZzcCJ9LCJwZXJzb25hbEluZm8iOnsiY29tcGxleE5hbWUiOnt9fX0sImFtb3VudCI6eyJjdXJyZW5jeSI6IlVTRCIsImFtb3VudCI6IjIwMCJ9LCJ0cmFuc2FjdGlvblR5cGUiOnsic2NlbmFyaW8iOiJERVBPU0lUIiwic3ViU2NlbmFyaW8iOiJERVBPU0lUIiwiaW5pdGlhdG9yIjoiUEFZRVIiLCJpbml0aWF0b3JUeXBlIjoiQ09OU1VNRVIiLCJyZWZ1bmRJbmZvIjp7fX19'
const signature = process.env.MOCK_JWS_SIGNATURE || 'abcJjvNrkyK2KBieDUbGfhaBUn75aDUATNF4joqA8OLs4QgSD7i6EO8BIdy6Crph3LnXnTM20Ai1Z6nt0zliS_qPPLU9_vi6qLb15FOkl64DQs9hnfoGeo2tcjZJ88gm19uLY_s27AJqC1GH1B8E2emLrwQMDMikwQcYvXoyLrL7LL3CjaLMKdzR7KTcQi1tCK4sNg0noIQLpV3eA61kess'

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

  Logger.info(`IN PAYEEFSP:: PUT /acceptheaderpayeefsp/participants/${request.params.id}, PAYLOAD: [${JSON.stringify(request.payload)}]`)

  // Saving Incoming request
  const incomingRequest = {
    headers: request.headers,
    data: request.payload
  }
  callbackCache.set(request.params.id, incomingRequest)

  correlationCache.set(request.params.id, request.payload)

  histTimerEnd({ success: true, fsp: 'payee', operation: 'putParticipantsByTypeId', source: request.headers['fspiop-source'], destination: request.headers['fspiop-destination'] })
  return h.response().code(Enums.Http.ReturnCodes.OK.CODE)
}

exports.postPartiesByTypeAndId = function (request, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()

  Logger.info('IN PAYEEFSP:: POST /acceptheaderpayeefsp/parties/' + request.params.id, request.payload)
  correlationCache.set(request.params.id, request.payload)

  histTimerEnd({ success: true, fsp: 'payee', operation: 'postPartiesByTypeAndId', source: request.headers['fspiop-source'], destination: request.headers['fspiop-destination'] })
  return h.response().code(Enums.Http.ReturnCodes.ACCEPTED.CODE)
}

exports.getPartiesByTypeAndId = function (req, h) {
  (async function () {
    const histTimerEnd = Metrics.getHistogram(
      'sim_request',
      'Histogram for Simulator http operations',
      ['success', 'fsp', 'operation', 'source', 'destination']
    ).startTimer()

    const metadata = `${req.method} ${req.path} ${req.params.id} `
    Logger.info((new Date().toISOString()), ['IN PAYEEFSP::'], `received: ${metadata}. `)
    // Saving Incoming request
    const incomingRequest = {
      headers: req.headers
    }
    requestCache.set(req.params.id, incomingRequest)

    const url = partiesEndpoint + `/parties/${req.params.type}/${req.params.id}`
    try {
      const protectedHeader = {
        alg: 'RS256',
        'FSPIOP-Source': `${req.headers['fspiop-destination']}`,
        'FSPIOP-Destination': `${req.headers['fspiop-source']}`,
        'FSPIOP-URI': `/parties/${req.params.type}/${req.params.id}`,
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
          'Content-Type': 'application/vnd.interoperability.parties+json;version=1.0',
          'FSPIOP-Source': 'acceptheaderpayeefsp',
          'FSPIOP-Destination': req.headers['fspiop-source'],
          Date: new Date().toUTCString(),
          'FSPIOP-Signature': JSON.stringify(fspiopSignature),
          'FSPIOP-HTTP-Method': 'PUT',
          'FSPIOP-URI': `/parties/${req.params.type}/${req.params.id}`
          // traceparent: req.headers.traceparent ? req.headers.traceparent : undefined,
          // tracestate: req.headers.tracestate ? req.headers.tracestate : undefined
        },
        httpsAgent: new https.Agent({
          rejectUnauthorized: false
        }),
        data: JSON.stringify(correlationCache.get(req.params.id))
      }

      // Logger.info((new Date().toISOString()), 'Executing PUT', url)
      const res = await request(url, opts, req.span)
      // Logger.info((new Date().toISOString()), 'response: ', res.status)
      if (res.status !== Enums.Http.ReturnCodes.ACCEPTED.CODE) {
        // TODO: how does one identify the failed response?
        throw new Error(`Failed to send. Result: ${res}`)
      }

      histTimerEnd({ success: true, fsp: 'payee', operation: 'getPartiesByTypeAndId', source: req.headers['fspiop-source'], destination: req.headers['fspiop-destination'] })
    } catch (err) {
      Logger.error(err)
      histTimerEnd({ success: false, fsp: 'payee', operation: 'getPartiesByTypeAndId', source: req.headers['fspiop-source'], destination: req.headers['fspiop-destination'] })
    }
  })()

  return h.response().code(Enums.Http.ReturnCodes.ACCEPTED.CODE)
}

exports.postQuotes = function (req, h) {
  (async function () {
    const histTimerEnd = Metrics.getHistogram(
      'sim_request',
      'Histogram for Simulator http operations',
      ['success', 'fsp', 'operation', 'source', 'destination']
    ).startTimer()

    const metadata = `${req.method} ${req.path}`
    const quotesRequest = req.payload
    Logger.info((new Date().toISOString()), ['IN PAYEEFSP::'], `received: ${metadata}. `)
    Logger.info(`incoming request: ${quotesRequest.quoteId}`)

    // Saving Incoming request
    const incomingRequest = {
      headers: req.headers,
      data: req.payload
    }
    requestCache.set(quotesRequest.quoteId, incomingRequest)

    const quotesResponse = {
      transferAmount: {
        amount: quotesRequest.amount.amount,
        currency: quotesRequest.amount.currency
      },
      payeeFspFee: {
        amount: '1',
        currency: quotesRequest.amount.currency
      },
      payeeFspCommission: {
        amount: '1',
        currency: quotesRequest.amount.currency
      },
      expiration: new Date(new Date().getTime() + 10000),
      ilpPacket: transfersIlpPacket,
      condition: transfersCondition
    }

    try {
      const url = quotesEndpoint + '/quotes/' + quotesRequest.quoteId
      const protectedHeader = {
        alg: 'RS256',
        'FSPIOP-Source': `${req.headers['fspiop-destination']}`,
        'FSPIOP-Destination': `${req.headers['fspiop-source']}`,
        'FSPIOP-URI': `/quotes/${quotesRequest.quoteId}`,
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
          'Content-Type': 'application/vnd.interoperability.quotes+json;version=1.0',
          'FSPIOP-Source': 'acceptheaderpayeefsp',
          'FSPIOP-Destination': req.headers['fspiop-source'],
          Date: new Date().toUTCString(),
          'FSPIOP-Signature': `${JSON.stringify(fspiopSignature)}`,
          'FSPIOP-HTTP-Method': 'PUT',
          'FSPIOP-URI': `/quotes/${quotesRequest.quoteId}`
          // traceparent: req.headers.traceparent ? req.headers.traceparent : undefined,
          // tracestate: req.headers.tracestate ? req.headers.tracestate : undefined
        },
        httpsAgent: new https.Agent({
          rejectUnauthorized: false
        }),
        data: JSON.stringify(quotesResponse)
      }
      // Logger.info((new Date().toISOString()), 'Executing PUT', url)
      const res = await request(url, opts, req.span)
      // Logger.info((new Date().toISOString()), 'response: ', res.status)
      if (res.status !== Enums.Http.ReturnCodes.ACCEPTED.CODE) {
        // TODO: how does one identify the failed response?
        throw new Error(`Failed to send. Result: ${res}`)
      }

      histTimerEnd({ success: true, fsp: 'payee', operation: 'postQuotes', source: req.headers['fspiop-source'], destination: req.headers['fspiop-destination'] })
    } catch (err) {
      Logger.error(err)
      histTimerEnd({ success: false, fsp: 'payee', operation: 'postQuotes', source: req.headers['fspiop-source'], destination: req.headers['fspiop-destination'] })
      // TODO: what if this fails? We need to log. What happens by default?
      // const url = await rq.createErrorUrl(db, req.path, requesterName);
      // TODO: review this error message
      // TODO: we should be able to throw an AppError somewhere, test whether the error
      // received in this handler is an AppError, then send the requester the correct
      // payload etc. based on the contents of that AppError.
      // rq.sendError(url, asyncResponses.serverError, rq.defaultHeaders(requesterName, 'participants'), {logger});
    }
  })()
  return h.response().code(Enums.Http.ReturnCodes.ACCEPTED.CODE)
}

exports.postTransfers = async function (req, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()

  Logger.debug(`[cid=${req.payload.transferId}, fsp=${req.headers['fspiop-source']}, source=${req.headers['fspiop-source']}, dest=${req.headers['fspiop-destination']}] ~ Simulator::api::payee::postTransfers - START`)

  const metadata = `${req.method} ${req.path} ${req.payload.transferId}`
  Logger.info(`IN PAYEEFSP:: received: ${metadata}.`)

  if (!transfersFulfilResponseDisabled) {
    // Saving Incoming request
    const incomingRequest = {
      headers: req.headers,
      data: req.payload
    }
    requestCache.set(req.payload.transferId, incomingRequest)

    const url = transfersEndpoint + '/transfers/' + req.payload.transferId
    const fspiopUriHeader = `/transfers/${req.payload.transferId}`
    try {
      const transfersResponse = {
        fulfilment: transfersFulfilment,
        completedTimestamp: new Date().toISOString(),
        transferState: 'COMMITTED'
      }
      const protectedHeader = {
        alg: 'RS256',
        'FSPIOP-Source': `${req.headers['fspiop-destination']}`,
        'FSPIOP-Destination': `${req.headers['fspiop-source']}`,
        'FSPIOP-URI': `/transfers/${req.payload.transferId}`,
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
        httpsAgent: new https.Agent({
          rejectUnauthorized: false
        }),
        data: JSON.stringify(transfersResponse)
      }

      // Logger.info(`Executing PUT: [${url}], HEADERS: [${JSON.stringify(opts.headers)}], BODY: [${JSON.stringify(transfersResponse)}]`)
      const res = await request(url, opts, req.span)
      // Logger.info(`response: ${res.status}`)
      if (res.status !== Enums.Http.ReturnCodes.ACCEPTED.CODE) {
        // TODO: how does one identify the failed response?
        throw new Error(`Failed to send. Result: ${JSON.stringify(res)}`)
      }
      histTimerEnd({
        success: true,
        fsp: 'payee',
        operation: 'postTransfers',
        source: req.headers['fspiop-source'],
        destination: req.headers['fspiop-destination']
      })
    } catch (err) {
      Logger.error(err)
      histTimerEnd({
        success: false,
        fsp: 'payee',
        operation: 'postTransfers',
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
    histTimerEnd({
      success: true,
      fsp: 'payee',
      operation: 'postTransfers',
      source: req.headers['fspiop-source'],
      destination: req.headers['fspiop-destination']
    })
  }

  return h.response().code(Enums.Http.ReturnCodes.ACCEPTED.CODE)
}

exports.putTransfersById = function (request, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()

  Logger.info(`IN PAYEEFSP:: PUT /acceptheaderpayeefsp/transfers/${request.params.id}, PAYLOAD: [${JSON.stringify(request.payload)}]`)

  correlationCache.set(request.params.id, request.payload)

  // Saving Incoming request
  const incomingRequest = {
    headers: request.headers,
    data: request.payload
  }
  callbackCache.set(request.params.id, incomingRequest)

  histTimerEnd({ success: true, fsp: 'payee', operation: 'putTransfersById', source: request.headers['fspiop-source'], destination: request.headers['fspiop-destination'] })
  return h.response().code(Enums.Http.ReturnCodes.OK.CODE)
}

exports.putTransfersByIdError = function (request, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()

  Logger.info(`IN PAYEEFSP:: PUT /acceptheaderpayeefsp/transfers/${request.params.id}/error, PAYLOAD: [${JSON.stringify(request.payload)}]`)
  correlationCache.set(request.params.id, request.payload)

  // Saving Incoming request
  const incomingRequest = {
    headers: request.headers,
    data: request.payload
  }
  callbackCache.set(request.params.id, incomingRequest)

  histTimerEnd({ success: true, fsp: 'payee', operation: 'putTransfersByIdError', source: request.headers['fspiop-source'], destination: request.headers['fspiop-destination'] })
  return h.response().code(Enums.Http.ReturnCodes.OK.CODE)
}

exports.getcorrelationId = function (request, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()

  Logger.info(`IN PAYEEFSP:: Final response for GET /acceptheaderpayeefsp/correlationid/${request.params.id}, CACHE: [${JSON.stringify(correlationCache.get(request.params.id))}`)

  histTimerEnd({ success: true, fsp: 'payee', operation: 'getcorrelationId' })
  return h.response(correlationCache.get(request.params.id)).code(Enums.Http.ReturnCodes.ACCEPTED.CODE)
}

exports.getRequestById = function (request, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()

  Logger.info(`IN PAYEEFSP:: PUT /acceptheaderpayeefsp/requests/${request.params.id}, CACHE: [${JSON.stringify(requestCache.get(request.params.id))}]`)
  const responseData = requestCache.get(request.params.id)
  requestCache.del(request.params.id)

  histTimerEnd({ success: true, fsp: 'payee', operation: 'getRequestById' })

  return h.response(responseData).code(Enums.Http.ReturnCodes.OK.CODE)
}

exports.getCallbackById = function (request, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()

  Logger.info(`IN PAYEEFSP:: PUT /acceptheaderpayeefsp/callbacks/${request.params.id}, CACHE: [${JSON.stringify(callbackCache.get(request.params.id))}]`)
  const responseData = callbackCache.get(request.params.id)
  callbackCache.del(request.params.id)

  histTimerEnd({ success: true, fsp: 'payee', operation: 'getCallbackById' })

  return h.response(responseData).code(Enums.Http.ReturnCodes.OK.CODE)
}
