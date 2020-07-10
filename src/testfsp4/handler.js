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
 - Sridevi Miriyala sridevi.miriyala@modusbox.com
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
const Sdk = require('@mojaloop/sdk-standard-components')
const Metrics = require('../lib/metrics')
const base64url = require('base64url')

const partiesEndpoint = process.env.PARTIES_ENDPOINT || 'http://localhost:1080'
const quotesEndpoint = process.env.QUOTES_ENDPOINT || 'http://localhost:1080'
const transfersEndpoint = process.env.TRANSFERS_ENDPOINT || 'http://localhost:1080'
const transfersFulfilResponseDisabled = (process.env.TRANSFERS_FULFIL_RESPONSE_DISABLED !== undefined && process.env.TRANSFERS_FULFIL_RESPONSE_DISABLED !== 'false')
const signature = process.env.MOCK_JWS_SIGNATURE || 'abcJjvNrkyK2KBieDUbGfhaBUn75aDUATNF4joqA8OLs4QgSD7i6EO8BIdy6Crph3LnXnTM20Ai1Z6nt0zliS_qPPLU9_vi6qLb15FOkl64DQs9hnfoGeo2tcjZJ88gm19uLY_s27AJqC1GH1B8E2emLrwQMDMikwQcYvXoyLrL7LL3CjaLMKdzR7KTcQi1tCK4sNg0noIQLpV3eA61kess'
const ilpSecret = process.env.ILP_SECRET || 'Quaixohyaesahju3thivuiChai5cahng'
const Ilp = new Sdk.Ilp({ secret: ilpSecret })

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

  // Logger.isPerfEnabled && Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payer::putParticipantsByTypeId - START`)

  Logger.isInfoEnabled && Logger.info(`IN testfsp4:: PUT /testfsp4/participants/${request.params.id}, PAYLOAD: [${JSON.stringify(request.payload)}]`)

  // Saving Incoming request
  const incomingRequest = {
    headers: request.headers,
    data: request.payload
  }
  callbackCache.set(request.params.id, incomingRequest)

  correlationCache.set(request.params.id, request.payload)

  // Logger.isPerfEnabled && Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payer::putParticipantsByTypeId - END`)
  histTimerEnd({ success: true, fsp: 'payer', operation: 'putParticipantsByTypeId', source: request.headers['fspiop-source'], destination: request.headers['fspiop-destination'] })
  return h.response().code(Enums.Http.ReturnCodes.OK.CODE)
}

// Section about /parties
exports.postPartiesByTypeAndId = function (request, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()

  // Logger.isPerfEnabled && Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payee::postPartiesByTypeAndId - START`)

  Logger.isInfoEnabled && Logger.info('IN testfsp4:: POST /testfsp4/parties/' + request.params.id, request.payload)
  correlationCache.set(request.params.id, request.payload)

  // Logger.isPerfEnabled && Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payee::postPartiesByTypeAndId - END`)
  histTimerEnd({ success: true, fsp: 'payee', operation: 'postPartiesByTypeAndId', source: request.headers['fspiop-source'], destination: request.headers['fspiop-destination'] })
  return h.response().code(Enums.Http.ReturnCodes.ACCEPTED.CODE)
}

exports.getPartiesByTypeAndId = function (req, h) {
  (async function () {
    const metadata = `${req.method} ${req.path} ${req.params.id} `
    console.log((new Date().toISOString()), ['IN testfsp4::'], `received: ${metadata}. `)
    const url = partiesEndpoint + '/parties/MSISDN/' + req.params.id
    try {
      const opts = {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/vnd.interoperability.parties+json;version=1.0',
          'FSPIOP-Source': 'testfsp4',
          'FSPIOP-Destination': req.headers['fspiop-source'],
          Date: req.headers.date
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
        data: JSON.stringify(correlationCache.get(req.params.id))
      }
      // console.log((new Date().toISOString()), 'Executing PUT', url)
      const res = await request(url, opts, req.span)
      // console.log((new Date().toISOString()), 'response: ', res.status)
      if (res.status !== Enums.Http.ReturnCodes.ACCEPTED.CODE) {
        // TODO: how does one identify the failed response?
        throw new Error('Failed to send. Result:', res)
      }
    } catch (err) {
      console.log(['error'], err)
    }
  })()
  return h.response().code(Enums.Http.ReturnCodes.ACCEPTED.CODE)
}

exports.putPartiesByTypeId = function (request, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()

  // Logger.isPerfEnabled && Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payer::putPartiesByTypeId - START`)

  Logger.isInfoEnabled && Logger.info(`IN testfsp4:: PUT /testfsp4/parties/${request.params.id}, PAYLOAD: [${JSON.stringify(request.payload)}]`)

  // Saving Incoming request
  const incomingRequest = {
    headers: request.headers,
    data: request.payload
  }
  callbackCache.set(request.params.id, incomingRequest)

  correlationCache.set(request.params.id, request.payload)

  // Logger.isPerfEnabled && Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payer::putPartiesByTypeId - END`)
  histTimerEnd({ success: true, fsp: 'payer', operation: 'putPartiesByTypeId', source: request.headers['fspiop-source'], destination: request.headers['fspiop-destination'] })
  return h.response().code(Enums.Http.ReturnCodes.OK.CODE)
}

exports.putPartiesByTypeIdAndError = function (request, h) {
  console.log((new Date().toISOString()), 'IN testfsp4:: PUT /testfsp4/parties/' + request.params.id + '/error', request.payload)
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
exports.postQuotes = function (req, h) {
  (async function () {
    const histTimerEnd = Metrics.getHistogram(
      'sim_request',
      'Histogram for Simulator http operations',
      ['success', 'fsp', 'operation', 'source', 'destination']
    ).startTimer()

    // Logger.isPerfEnabled && Logger.perf(`[cid=${req.payload.transferId}, fsp=${req.headers['fspiop-source']}, source=${req.headers['fspiop-source']}, dest=${req.headers['fspiop-destination']}] ~ Simulator::api::payee::postQuotes - START`)

    const metadata = `${req.method} ${req.path}`
    const quotesRequest = req.payload
    Logger.isInfoEnabled && Logger.info((new Date().toISOString()), ['IN testfsp4::'], `received: ${metadata}. `)
    Logger.isInfoEnabled && Logger.info(`incoming request: ${quotesRequest.quoteId}`)

    // Saving Incoming request
    const incomingRequest = {
      headers: req.headers,
      data: req.payload
    }
    requestCache.set(quotesRequest.quoteId, incomingRequest)

    // prepare response
    // const fulfillImage = new cc.PreimageSha256()
    // fulfillImage.setPreimage(new Buffer('hello world'))
    // Logger.isInfoEnabled && Logger.info(fulfillImage.serializeUri())
    // Logger.isInfoEnabled && Logger.info(fulfillImage.getConditionUri())
    // const condition = fulfillImage.getConditionUri()
    //
    // const binaryPrepare = IlpPacket.serializeIlpPrepare({
    //     amount: '10',
    //     executionCondition: condition,
    //     destination: 'g.us.nexus.bob', // this field was called 'account' in older packet types
    //     data: Buffer.from('hello world'),
    //     expiresAt: new Date(new Date().getTime() + 10000)
    // })

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
      expiration: new Date(new Date().getTime() + 10000)
    }

    const ilpData = Ilp.getQuoteResponseIlp(quotesRequest, quotesResponse)
    quotesResponse.ilpPacket = ilpData.ilpPacket
    quotesResponse.condition = ilpData.condition

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
          'FSPIOP-Source': 'testfsp4',
          'FSPIOP-Destination': req.headers['fspiop-source'],
          Date: new Date().toUTCString(),
          'FSPIOP-Signature': `${JSON.stringify(fspiopSignature)}`,
          'FSPIOP-HTTP-Method': 'PUT',
          'FSPIOP-URI': `/quotes/${quotesRequest.quoteId}`
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
        data: JSON.stringify(quotesResponse)
      }
      // Logger.isInfoEnabled && Logger.info(`Executing PUT: [${url}], HEADERS: [${JSON.stringify(opts.headers)}], BODY: [${JSON.stringify(quotesResponse)}]`)
      const res = await request(url, opts, req.span)
      // Logger.isInfoEnabled && Logger.info((new Date().toISOString()), 'response: ', res.status)
      if (res.status !== Enums.Http.ReturnCodes.ACCEPTED.CODE) {
        // TODO: how does one identify the failed response?
        throw new Error(`Failed to send. Result: ${res}`)
      }

      // Logger.isPerfEnabled && Logger.perf(`[cid=${req.payload.transferId}, fsp=${req.headers['fspiop-source']}, source=${req.headers['fspiop-source']}, dest=${req.headers['fspiop-destination']}] ~ Simulator::api::payee::postQuotes - END`)
      histTimerEnd({ success: true, fsp: 'payee', operation: 'postQuotes', source: req.headers['fspiop-source'], destination: req.headers['fspiop-destination'] })
    } catch (err) {
      Logger.isErrorEnabled && Logger.error(err)
      // Logger.isPerfEnabled && Logger.perf(`[cid=${req.payload.transferId}, fsp=${req.headers['fspiop-source']}, source=${req.headers['fspiop-source']}, dest=${req.headers['fspiop-destination']}] ~ Simulator::api::payee::postQuotes - ERROR`)
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

exports.putQuotesById = function (request, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()

  // Logger.isPerfEnabled && Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payer::putQuotesById - START`)

  Logger.isInfoEnabled && Logger.info(`IN testfsp4:: PUT /testfsp4/quotes/${request.params.id}, PAYLOAD: [${JSON.stringify(request.payload)}]`)

  // Saving Incoming request
  const incomingRequest = {
    headers: request.headers,
    data: request.payload
  }
  callbackCache.set(request.params.id, incomingRequest)

  correlationCache.set(request.params.id, request.payload)

  // Logger.isPerfEnabled && Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payer::putQuotesById - END`)
  histTimerEnd({ success: true, fsp: 'payer', operation: 'putQuotesById', source: request.headers['fspiop-source'], destination: request.headers['fspiop-destination'] })
  return h.response().code(Enums.Http.ReturnCodes.OK.CODE)
}

exports.putQuotesByIdAndError = function (request, h) {
  console.log((new Date().toISOString()), 'IN testfsp4:: PUT /testfsp4/quotes/' + request.params.id + '/error', request.payload)
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
exports.postTransfers = async function (req, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()

  Logger.isDebugEnabled && Logger.debug(`[cid=${req.payload.transferId}, fsp=${req.headers['fspiop-source']}, source=${req.headers['fspiop-source']}, dest=${req.headers['fspiop-destination']}] ~ Simulator::api::payee::postTransfers - START`)

  const metadata = `${req.method} ${req.path} ${req.payload.transferId}`
  Logger.isInfoEnabled && Logger.info(`IN testfsp4:: received: ${metadata}.`)

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
        completedTimestamp: new Date().toISOString(),
        transferState: 'COMMITTED'
      }

      transfersResponse.fulfilment = Ilp.calculateFulfil(req.payload.ilpPacket)

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
          'Content-Type': req.headers['content-type'],
          'FSPIOP-Source': 'testfsp4',
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
        data: JSON.stringify(transfersResponse)
      }
      // Logger.isInfoEnabled && Logger.info(`Executing PUT: [${url}], HEADERS: [${JSON.stringify(opts.headers)}], BODY: [${JSON.stringify(transfersResponse)}]`)
      const res = await request(url, opts, req.span)
      // Logger.isInfoEnabled && Logger.info(`response: ${res.status}`)
      if (res.status !== Enums.Http.ReturnCodes.ACCEPTED.CODE) {
        // TODO: how does one identify the failed response?
        throw new Error(`Failed to send. Result: ${JSON.stringify(res)}`)
      }
      // Logger.isPerfEnabled && Logger.perf(`[cid=${req.payload.transferId}, fsp=${req.headers['fspiop-source']}, source=${req.headers['fspiop-source']}, dest=${req.headers['fspiop-destination']}] ~ Simulator::api::payee::postTransfers - END`)
      histTimerEnd({
        success: true,
        fsp: 'payee',
        operation: 'postTransfers',
        source: req.headers['fspiop-source'],
        destination: req.headers['fspiop-destination']
      })
    } catch (err) {
      Logger.isErrorEnabled && Logger.error(err)
      // Logger.isPerfEnabled && Logger.perf(`[cid=${req.payload.transferId}, fsp=${req.headers['fspiop-source']}, source=${req.headers['fspiop-source']}, dest=${req.headers['fspiop-destination']}] ~ Simulator::api::payee::postTransfers - ERROR`)
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
    // Logger.isPerfEnabled && Logger.perf(`[cid=${req.payload.transferId}, fsp=${req.headers['fspiop-source']}, source=${req.headers['fspiop-source']}, dest=${req.headers['fspiop-destination']}] ~ Simulator::api::payee::postTransfers - END`)
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

  // Logger.isPerfEnabled && Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payer::putTransfersById - START`)

  Logger.isInfoEnabled && Logger.info(`IN testfsp4:: PUT /testfsp4/transfers/${request.params.id}, PAYLOAD: [${JSON.stringify(request.payload)}]`)

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

  Logger.isInfoEnabled && Logger.info(`IN testfsp4:: PUT /testfsp4/transfers/${request.params.id}/error, PAYLOAD: [${JSON.stringify(request.payload)}]`)
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

exports.getcorrelationId = function (request, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()

  // Logger.isPerfEnabled && Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payer::getcorrelationId - START`)

  Logger.isInfoEnabled && Logger.info(`IN testfsp4:: PUT /testfsp4/correlationid/${request.params.id}, CACHE: [${JSON.stringify(correlationCache.get(request.params.id))}]`)

  // Logger.isPerfEnabled && Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payer::getcorrelationId - END`)
  histTimerEnd({ success: true, fsp: 'payer', operation: 'getcorrelationId' })
  return h.response(correlationCache.get(request.params.id)).code(Enums.Http.ReturnCodes.ACCEPTED.CODE)
}

exports.getRequestById = function (request, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()

  Logger.isInfoEnabled && Logger.info(`IN testfsp4:: PUT /testfsp4/requests/${request.params.id}, CACHE: [${JSON.stringify(requestCache.get(request.params.id))}]`)
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

  Logger.isInfoEnabled && Logger.info(`IN testfsp4:: PUT /testfsp4/callbacks/${request.params.id}, CACHE: [${JSON.stringify(callbackCache.get(request.params.id))}]`)
  const responseData = callbackCache.get(request.params.id)
  callbackCache.del(request.params.id)

  histTimerEnd({ success: true, fsp: 'payer', operation: 'getCallbackById' })

  return h.response(responseData).code(Enums.Http.ReturnCodes.OK.CODE)
}
