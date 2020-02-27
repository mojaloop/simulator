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
 - Murthy Kakarlamudi murthy@modusbox.com
 - Steven Oderayi <steven.oderayi@modusbox.com>
 --------------
 ******/

'use strict'
const NodeCache = require('node-cache')
const correlationCache = new NodeCache()
const requestCache = new NodeCache()
const quoteCache = new NodeCache()
const callbackCache = new NodeCache()
const sendRequest = require('../lib/sendRequest')
const https = require('https')
const Logger = require('@mojaloop/central-services-logger')
const Enums = require('@mojaloop/central-services-shared').Enum
const ErrorHandler = require('@mojaloop/central-services-error-handling')
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

  // Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payer::putParticipantsByTypeId - START`)

  Logger.info(`IN PAYEEFSP:: PUT /payeefsp/participants/${request.params.id}, PAYLOAD: [${JSON.stringify(request.payload)}]`)

  // Saving Incoming request
  const incomingRequest = {
    headers: request.headers,
    data: request.payload
  }
  callbackCache.set(request.params.id, incomingRequest)

  correlationCache.set(request.params.id, request.payload)

  // Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payer::putParticipantsByTypeId - END`)
  histTimerEnd({ success: true, fsp: 'payee', operation: 'putParticipantsByTypeId', source: request.headers['fspiop-source'], destination: request.headers['fspiop-destination'] })
  return h.response().code(Enums.Http.ReturnCodes.OK.CODE)
}

exports.postPartiesByTypeAndId = function (request, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()

  // Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payee::postPartiesByTypeAndId - START`)

  Logger.info('IN PAYEEFSP:: POST /payeefsp/parties/' + request.params.id, request.payload)
  correlationCache.set(request.params.id, request.payload)

  // Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payee::postPartiesByTypeAndId - END`)
  histTimerEnd({ success: true, fsp: 'payee', operation: 'postPartiesByTypeAndId', source: request.headers['fspiop-source'], destination: request.headers['fspiop-destination'] })
  return h.response().code(Enums.Http.ReturnCodes.ACCEPTED.CODE)
}

exports.getPartiesByTypeAndId = function (request, h) {
  (async function () {
    const histTimerEnd = Metrics.getHistogram(
      'sim_request',
      'Histogram for Simulator http operations',
      ['success', 'fsp', 'operation', 'source', 'destination']
    ).startTimer()

    // Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payee::getPartiesByTypeAndId - START`)

    const metadata = `${request.method} ${request.path} ${request.params.id} `
    Logger.info((new Date().toISOString()), ['IN PAYEEFSP::'], `received: ${metadata}. `)
    // Saving Incoming request
    const incomingRequest = {
      headers: request.headers
    }
    requestCache.set(request.params.id, incomingRequest)

    const url = partiesEndpoint + `/parties/${request.params.type}/${request.params.id}`
    try {
      const protectedHeader = {
        alg: 'RS256',
        'FSPIOP-Source': `${request.headers['fspiop-destination']}`,
        'FSPIOP-Destination': `${request.headers['fspiop-source']}`,
        'FSPIOP-URI': `/parties/${request.params.type}/${request.params.id}`,
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
          'FSPIOP-Source': 'payeefsp',
          'FSPIOP-Destination': request.headers['fspiop-source'],
          Date: new Date().toUTCString(),
          'FSPIOP-Signature': JSON.stringify(fspiopSignature),
          'FSPIOP-HTTP-Method': 'PUT',
          'FSPIOP-URI': `/parties/${request.params.type}/${request.params.id}`
          // traceparent: request.headers.traceparent ? request.headers.traceparent : undefined,
          // tracestate: request.headers.tracestate ? request.headers.tracestate : undefined
        },
        transformRequest: [(data, headers) => {
          delete headers.common.Accept
          return data
        }],
        httpsAgent: new https.Agent({
          rejectUnauthorized: false
        }),
        data: JSON.stringify(correlationCache.get(request.params.id))
      }

      // Logger.info((new Date().toISOString()), 'Executing PUT', url)
      const res = await sendRequest(url, opts, request.span)
      // Logger.info((new Date().toISOString()), 'response: ', res.status)
      if (res.status !== Enums.Http.ReturnCodes.ACCEPTED.CODE) {
        // TODO: how does one identify the failed response?
        throw new Error(`Failed to send. Result: ${res}`)
      }

      // Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payee::getPartiesByTypeAndId - END`)
      histTimerEnd({ success: true, fsp: 'payee', operation: 'getPartiesByTypeAndId', source: request.headers['fspiop-source'], destination: request.headers['fspiop-destination'] })
    } catch (err) {
      Logger.error(err)
      // Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payee::getPartiesByTypeAndId - ERROR`)
      histTimerEnd({ success: false, fsp: 'payee', operation: 'getPartiesByTypeAndId', source: request.headers['fspiop-source'], destination: request.headers['fspiop-destination'] })
    }
  })()

  return h.response().code(Enums.Http.ReturnCodes.ACCEPTED.CODE)
}

exports.postQuotes = function (request, h) {
  (async function () {
    const histTimerEnd = Metrics.getHistogram(
      'sim_request',
      'Histogram for Simulator http operations',
      ['success', 'fsp', 'operation', 'source', 'destination']
    ).startTimer()

    // Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payee::postQuotes - START`)

    const metadata = `${request.method} ${request.path}`
    const quoteRequest = request.payload
    Logger.info((new Date().toISOString()), ['IN PAYEEFSP::'], `received: ${metadata}. `)
    Logger.info(`incoming request: ${quoteRequest.quoteId}`)

    // Saving Incoming request
    const incomingRequest = {
      headers: request.headers,
      data: quoteRequest
    }
    requestCache.set(quoteRequest.quoteId, incomingRequest)

    // prepare response
    // const fulfillImage = new cc.PreimageSha256()
    // fulfillImage.setPreimage(new Buffer('hello world'))
    // Logger.info(fulfillImage.serializeUri())
    // Logger.info(fulfillImage.getConditionUri())
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
        amount: quoteRequest.amount.amount,
        currency: quoteRequest.amount.currency
      },
      payeeFspFee: {
        amount: '1',
        currency: quoteRequest.amount.currency
      },
      payeeFspCommission: {
        amount: '1',
        currency: quoteRequest.amount.currency
      },
      expiration: new Date(new Date().getTime() + 10000),
      // ilpPacket: 'AQAAAAAAAABkEHByaXZhdGUucGF5ZWVmc3CCAlV7InRyYW5zYWN0aW9uSWQiOiJhYWUwYzIxMi0wOTJiLTQ5MmItYWQ2ZS1kZmJiYmJjNWRkYzIiLCJxdW90ZUlkIjoiYWFlMGMyMTItMDkyYi00OTJiLWFkNmUtZGZiYmJiYzVkZGMyIiwicGF5ZWUiOnsicGFydHlJZEluZm8iOnsicGFydHlJZFR5cGUiOiJNU0lTRE4iLCJwYXJ0eUlkZW50aWZpZXIiOiIyMjUwNDAwNDc2MiIsImZzcElkIjoicGF5ZWVmc3AifSwicGVyc29uYWxJbmZvIjp7ImNvbXBsZXhOYW1lIjp7fX19LCJwYXllciI6eyJwYXJ0eUlkSW5mbyI6eyJwYXJ0eUlkVHlwZSI6Ik1TSVNETiIsInBhcnR5SWRlbnRpZmllciI6IjI3NzEzODAzOTA1IiwiZnNwSWQiOiJwYXllcmZzcCJ9LCJwZXJzb25hbEluZm8iOnsiY29tcGxleE5hbWUiOnsiZmlyc3ROYW1lIjoiTWF0cyIsImxhc3ROYW1lIjoiSGFnbWFuIn19fSwiYW1vdW50Ijp7ImN1cnJlbmN5IjoiVVNEIiwiYW1vdW50IjoiMTAwIn0sInRyYW5zYWN0aW9uVHlwZSI6eyJzY2VuYXJpbyI6IlRSQU5TRkVSIiwic3ViU2NlbmFyaW8iOiJUUkFOU0ZFUiIsImluaXRpYXRvciI6IlBBWUVSIiwiaW5pdGlhdG9yVHlwZSI6IkNPTlNVTUVSIiwicmVmdW5kSW5mbyI6e319LCJub3RlIjoiaGVqIn0=',
      ilpPacket: transfersIlpPacket,
      condition: transfersCondition
      // condition: '_EVkxF7q3V-XDfIztgcHEa3iTqKHt_zKMV5Yjre_Y_o'
    }

    quoteCache.set(quoteRequest.quoteId, quotesResponse)

    try {
      const url = quotesEndpoint + '/quotes/' + quoteRequest.quoteId
      const protectedHeader = {
        alg: 'RS256',
        'FSPIOP-Source': `${request.headers['fspiop-destination']}`,
        'FSPIOP-Destination': `${request.headers['fspiop-source']}`,
        'FSPIOP-URI': `/quotes/${quoteRequest.quoteId}`,
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
          'FSPIOP-Source': 'payeefsp',
          'FSPIOP-Destination': request.headers['fspiop-source'],
          Date: new Date().toUTCString(),
          'FSPIOP-Signature': `${JSON.stringify(fspiopSignature)}`,
          'FSPIOP-HTTP-Method': 'PUT',
          'FSPIOP-URI': `/quotes/${quoteRequest.quoteId}`
          // traceparent: request.headers.traceparent ? request.headers.traceparent : undefined,
          // tracestate: request.headers.tracestate ? request.headers.tracestate : undefined
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
      // Logger.info((new Date().toISOString()), 'Executing PUT', url)
      const res = await sendRequest(url, opts, request.span)
      // Logger.info((new Date().toISOString()), 'response: ', res.status)
      if (res.status !== Enums.Http.ReturnCodes.ACCEPTED.CODE) {
        // TODO: how does one identify the failed response?
        throw new Error(`Failed to send. Result: ${res}`)
      }

      // Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payee::postQuotes - END`)
      histTimerEnd({ success: true, fsp: 'payee', operation: 'postQuotes', source: request.headers['fspiop-source'], destination: request.headers['fspiop-destination'] })
    } catch (err) {
      Logger.error(err)
      // Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payee::postQuotes - ERROR`)
      histTimerEnd({ success: false, fsp: 'payee', operation: 'postQuotes', source: request.headers['fspiop-source'], destination: request.headers['fspiop-destination'] })
      // TODO: what if this fails? We need to log. What happens by default?
      // const url = await rq.createErrorUrl(db, request.path, requesterName);
      // TODO: review this error message
      // TODO: we should be able to throw an AppError somewhere, test whether the error
      // received in this handler is an AppError, then send the requester the correct
      // payload etc. based on the contents of that AppError.
      // rq.sendError(url, asyncResponses.serverError, rq.defaultHeaders(requesterName, 'participants'), {logger});
    }
  })()
  return h.response().code(Enums.Http.ReturnCodes.ACCEPTED.CODE)
}

exports.postTransfers = async function (request, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()

  Logger.debug(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payee::postTransfers - START`)

  const metadata = `${request.method} ${request.path} ${request.payload.transferId}`
  Logger.info(`IN PAYEEFSP:: received: ${metadata}.`)

  if (!transfersFulfilResponseDisabled) {
    // Saving Incoming request
    const incomingRequest = {
      headers: request.headers,
      data: request.payload
    }
    requestCache.set(request.payload.transferId, incomingRequest)

    const url = transfersEndpoint + '/transfers/' + request.payload.transferId
    const fspiopUriHeader = `/transfers/${request.payload.transferId}`
    try {
      const transfersResponse = {
        // fulfilment: "rjzWyHf4IUao60Yz98HZOIhZbqtclOgZ7WriZuq9Hn0",
        fulfilment: transfersFulfilment,
        completedTimestamp: new Date().toISOString(),
        transferState: 'COMMITTED'
      }
      const protectedHeader = {
        alg: 'RS256',
        'FSPIOP-Source': `${request.headers['fspiop-destination']}`,
        'FSPIOP-Destination': `${request.headers['fspiop-source']}`,
        'FSPIOP-URI': `/transfers/${request.payload.transferId}`,
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
          'FSPIOP-Source': request.headers['fspiop-destination'],
          'FSPIOP-Destination': request.headers['fspiop-source'],
          Date: new Date().toUTCString(),
          'FSPIOP-Signature': JSON.stringify(fspiopSignature),
          'FSPIOP-HTTP-Method': 'PUT',
          'FSPIOP-URI': fspiopUriHeader
          // traceparent: request.headers.traceparent ? request.headers.traceparent : undefined,
          // tracestate: request.headers.tracestate ? request.headers.tracestate : undefined
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

      // Logger.info(`Executing PUT: [${url}], HEADERS: [${JSON.stringify(opts.headers)}], BODY: [${JSON.stringify(transfersResponse)}]`)
      const res = await sendRequest(url, opts, request.span)
      // Logger.info(`response: ${res.status}`)
      if ((res.status !== Enums.Http.ReturnCodes.ACCEPTED.CODE) || (res.status !== Enums.Http.ReturnCodes.OK.CODE)) {
        // TODO: how does one identify the failed response?
        throw new Error(`Failed to send. Result: ${JSON.stringify(res)}`)
      }
      // Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payee::postTransfers - END`)
      histTimerEnd({
        success: true,
        fsp: 'payee',
        operation: 'postTransfers',
        source: request.headers['fspiop-source'],
        destination: request.headers['fspiop-destination']
      })
    } catch (err) {
      Logger.error(err)
      // Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payee::postTransfers - ERROR`)
      histTimerEnd({
        success: false,
        fsp: 'payee',
        operation: 'postTransfers',
        source: request.headers['fspiop-source'],
        destination: request.headers['fspiop-destination']
      })
      // TODO: what if this fails? We need to log. What happens by default?
      // const url = await rq.createErrorUrl(db, request.path, requesterName);
      // TODO: review this error message
      // TODO: we should be able to throw an AppError somewhere, test whether the error
      // received in this handler is an AppError, then send the requester the correct
      // payload etc. based on the contents of that AppError.
      // rq.sendError(url, asyncResponses.serverError, rq.defaultHeaders(requesterName, 'participants'), {logger});
    }
  } else {
    // Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payee::postTransfers - END`)
    histTimerEnd({
      success: true,
      fsp: 'payee',
      operation: 'postTransfers',
      source: request.headers['fspiop-source'],
      destination: request.headers['fspiop-destination']
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
  // Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payee::putTransfersById - START`)

  Logger.info(`IN PAYEEFSP:: PUT /payeefsp/transfers/${request.params.id}, PAYLOAD: [${JSON.stringify(request.payload)}]`)

  correlationCache.set(request.params.id, request.payload)

  // Saving Incoming request
  const incomingRequest = {
    headers: request.headers,
    data: request.payload
  }
  callbackCache.set(request.params.id, incomingRequest)

  // Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payee::putTransfersById - END`)
  histTimerEnd({ success: true, fsp: 'payee', operation: 'putTransfersById', source: request.headers['fspiop-source'], destination: request.headers['fspiop-destination'] })
  return h.response().code(Enums.Http.ReturnCodes.OK.CODE)
}

exports.putTransfersByIdError = function (request, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()

  // Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payee::putTransfersByIdError - START`)

  Logger.info(`IN PAYEEFSP:: PUT /payeefsp/transfers/${request.params.id}/error, PAYLOAD: [${JSON.stringify(request.payload)}]`)
  correlationCache.set(request.params.id, request.payload)

  // Saving Incoming request
  const incomingRequest = {
    headers: request.headers,
    data: request.payload
  }
  callbackCache.set(request.params.id, incomingRequest)

  // Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payee::putTransfersByIdError - END`)
  histTimerEnd({ success: true, fsp: 'payee', operation: 'putTransfersByIdError', source: request.headers['fspiop-source'], destination: request.headers['fspiop-destination'] })
  return h.response().code(Enums.Http.ReturnCodes.OK.CODE)
}

exports.getcorrelationId = function (request, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()

  // Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payee::getcorrelationId - START`)

  const responseData = correlationCache.get(request.params.id)
  Logger.info(`IN PAYEEFSP:: Final response for GET /payeefsp/correlationid/${request.params.id}, CACHE: [${JSON.stringify(responseData)}`)

  // Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payee::getcorrelationId - END`)
  histTimerEnd({ success: true, fsp: 'payee', operation: 'getcorrelationId' })
  return h.response(responseData).code(Enums.Http.ReturnCodes.ACCEPTED.CODE)
}

exports.getQuotesById = function (request, h) {
  const responseData = quoteCache.get(request.params.id)
  Logger.info(`IN PAYEEFSP:: PUT callback for GET /payeefsp/quotes/${request.params.id}, CACHE: [${JSON.stringify(responseData)}`)
  quoteCache.del(request.params.id)

  if (responseData) {
    setImmediate(async () => {
      const histTimerEnd = Metrics.getHistogram(
        'sim_request',
        'Histogram for Simulator http operations',
        ['success', 'fsp', 'operation', 'source', 'destination']
      ).startTimer()

      try {
        const url = quotesEndpoint + '/quotes/' + request.params.id
        const protectedHeader = {
          alg: 'RS256',
          'FSPIOP-Source': `${request.headers['fspiop-destination']}`,
          'FSPIOP-Destination': `${request.headers['fspiop-source']}`,
          'FSPIOP-URI': `/quotes/${request.params.id}`,
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
            'FSPIOP-Source': 'payeefsp',
            'FSPIOP-Destination': request.headers['fspiop-source'],
            Date: new Date().toUTCString(),
            'FSPIOP-Signature': `${JSON.stringify(fspiopSignature)}`,
            'FSPIOP-HTTP-Method': 'PUT',
            'FSPIOP-URI': `/quotes/${request.params.id}`
            // traceparent: request.headers.traceparent ? request.headers.traceparent : undefined,
            // tracestate: request.headers.tracestate ? request.headers.tracestate : undefined
          },
          transformRequest: [(data, headers) => {
            delete headers.common.Accept
            return data
          }],
          httpsAgent: new https.Agent({
            rejectUnauthorized: false
          }),
          data: JSON.stringify(responseData)
        }
        // Logger.info((new Date().toISOString()), 'Executing PUT', url)
        const res = await sendRequest(url, opts, request.span)
        if (res.status !== Enums.Http.ReturnCodes.OK.CODE) {
          throw new Error(`Failed to send. Result: ${res}`)
        }

        histTimerEnd({ success: true, fsp: 'payee', operation: 'getQuotes', source: request.headers['fspiop-source'], destination: request.headers['fspiop-destination'] })
      } catch (err) {
        Logger.error(err)
        histTimerEnd({ success: false, fsp: 'payee', operation: 'getQuotes', source: request.headers['fspiop-source'], destination: request.headers['fspiop-destination'] })
      }
    })
  } else {
    setImmediate(async () => {
      Logger.error(`getQuotesById: Quote ${request.params.id} not found.`)
      await sendErrorCallback(
        ErrorHandler.CreateFSPIOPError(ErrorHandler.Enums.FSPIOPErrorCodes.QUOTE_ID_NOT_FOUND, `Quote id ${request.params.id} not found`, null, request.headers['fspiop-source']),
        request.params.id,
        request.headers,
        request.span
      )
    })
  }

  return h.response().code(Enums.Http.ReturnCodes.ACCEPTED.CODE)
}

const sendErrorCallback = async (fspiopError, quoteId, headers, span) => {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()

  try {
    const url = `${quotesEndpoint}/quotes/${quoteId}/error`
    const protectedHeader = {
      alg: 'RS256',
      'FSPIOP-Source': `${headers['fspiop-source']}`,
      'FSPIOP-Destination': 'switch',
      'FSPIOP-URI': `/quotes/${quoteId}/error`,
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
        'FSPIOP-Source': headers['fspiop-source'],
        'FSPIOP-Destination': 'switch',
        Date: new Date().toUTCString(),
        'FSPIOP-Signature': `${JSON.stringify(fspiopSignature)}`,
        'FSPIOP-HTTP-Method': 'PUT',
        'FSPIOP-URI': `/quotes/${quoteId}/error`
      },
      transformRequest: [(data, headers) => {
        delete headers.common.Accept
        return data
      }],
      httpsAgent: new https.Agent({
        rejectUnauthorized: false
      }),
      data: JSON.stringify(fspiopError.toApiErrorObject())
    }
    const res = await sendRequest(url, opts, span)
    if (res.status !== Enums.Http.ReturnCodes.OK.CODE) {
      throw new Error(`Failed to send. Result: ${res}`)
    }

    histTimerEnd({ success: true, fsp: 'payee', operation: 'sendErrorCallback', source: headers['fspiop-source'], destination: 'switch' })
  } catch (err) {
    Logger.error(err)
    histTimerEnd({ success: false, fsp: 'payee', operation: 'sendErrorCallback', source: headers['fspiop-source'], destination: 'switch' })
  }
}

exports.getRequestById = function (request, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()

  const responseData = requestCache.get(request.params.id)
  Logger.info(`IN PAYEEFSP:: PUT /payeefsp/requests/${request.params.id}, CACHE: [${JSON.stringify(responseData)}]`)
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

  const responseData = callbackCache.get(request.params.id)
  Logger.info(`IN PAYEEFSP:: PUT /payeefsp/callbacks/${request.params.id}, CACHE: [${JSON.stringify(responseData)}]`)
  callbackCache.del(request.params.id)

  histTimerEnd({ success: true, fsp: 'payee', operation: 'getCallbackById' })

  return h.response(responseData).code(Enums.Http.ReturnCodes.OK.CODE)
}
