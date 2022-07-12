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
const bulkQuoteCache = new NodeCache()
const callbackCache = new NodeCache()
const sendRequest = require('../lib/sendRequest')
const https = require('https')
const Logger = require('@mojaloop/central-services-logger')
const Enums = require('@mojaloop/central-services-shared').Enum
const Sdk = require('@mojaloop/sdk-standard-components')
const ErrorHandler = require('@mojaloop/central-services-error-handling')
const Metrics = require('../lib/metrics')
const base64url = require('base64url')

const quotesEndpoint = process.env.QUOTES_ENDPOINT || 'http://localhost:1080'
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

exports.postBulkQuotes = function (request, h) {
  (async function () {
    const histTimerEnd = Metrics.getHistogram(
      'sim_request',
      'Histogram for Simulator http operations',
      ['success', 'fsp', 'operation', 'source', 'destination']
    ).startTimer()

    // Logger.isPerfEnabled && Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payee::postQuotes - START`)

    const metadata = `${request.method} ${request.path}`
    const bulkQuoteRequest = request.payload
    Logger.isInfoEnabled && Logger.info((new Date().toISOString()), ['IN BulkQuotes::'], `received: ${metadata}. `)
    Logger.isInfoEnabled && Logger.info(`incoming request: ${bulkQuoteRequest.bulkQuoteId}`)

    // Saving Incoming request
    const incomingRequest = {
      headers: request.headers,
      data: bulkQuoteRequest
    }
    requestCache.set(bulkQuoteRequest.bulkQuoteId, incomingRequest)
    const individualQuoteResults = []
    for (const individualQuote of bulkQuoteRequest.individualQuotes) {
      const quotesResult = {
        quoteId: individualQuote.quoteId,
        payee: individualQuote.payee,
        transferAmount: {
          amount: individualQuote.amount.amount,
          currency: individualQuote.amount.currency
        },
        payeeReceiveAmount: {
          amount: individualQuote.amount.amount,
          currency: individualQuote.amount.currency
        },
        payeeFspFee: {
          amount: '1',
          currency: individualQuote.amount.currency
        },
        payeeFspCommission: {
          amount: '1',
          currency: individualQuote.amount.currency
        },
        expiration: new Date(new Date().getTime() + 10000)
      }
      individualQuote.payer = bulkQuoteRequest.payer
      const ilpData = Ilp.getQuoteResponseIlp(individualQuote, quotesResult)
      delete individualQuote.payer
      quotesResult.ilpPacket = ilpData.ilpPacket
      quotesResult.condition = ilpData.condition
      individualQuoteResults.push(quotesResult)
    }
    const bulkQuotesResponse = {
      individualQuoteResults,
      expiration: new Date(new Date().getTime() + 10000),
      extensionList: bulkQuoteRequest.extensionList || undefined
    }

    bulkQuoteCache.set(bulkQuoteRequest.bulkQuoteId, bulkQuotesResponse)

    try {
      const url = quotesEndpoint + '/bulkQuotes/' + bulkQuoteRequest.bulkQuoteId
      const protectedHeader = {
        alg: 'RS256',
        'FSPIOP-Source': `${request.headers['fspiop-destination']}`,
        'FSPIOP-Destination': `${request.headers['fspiop-source']}`,
        'FSPIOP-URI': `/bulkQuotes/${bulkQuoteRequest.bulkQuoteId}`,
        'FSPIOP-HTTP-Method': 'PUT',
        Date: ''
      }
      const fspiopSignature = {
        signature,
        protectedHeader: `${base64url.encode(JSON.stringify(protectedHeader))}`
      }
      const opts = {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/vnd.interoperability.quotes+json;version=1.0',
          'FSPIOP-Source': request.headers['fspiop-destination'],
          'FSPIOP-Destination': request.headers['fspiop-source'],
          Date: new Date().toUTCString(),
          'FSPIOP-Signature': `${JSON.stringify(fspiopSignature)}`,
          'FSPIOP-HTTP-Method': 'PUT',
          'FSPIOP-URI': `/bulkQuotes/${bulkQuoteRequest.bulkQuoteId}`
        },
        transformRequest: [(data, headers) => {
          delete headers.common.Accept
          return data
        }],
        httpsAgent: new https.Agent({
          rejectUnauthorized: false
        }),
        data: JSON.stringify(bulkQuotesResponse)
      }
      // Logger.isInfoEnabled && Logger.info((new Date().toISOString()), 'Executing PUT', url)
      const res = await sendRequest(url, opts, request.span)
      // Logger.isInfoEnabled && Logger.info((new Date().toISOString()), 'response: ', res.status)
      if (res.status !== Enums.Http.ReturnCodes.ACCEPTED.CODE) {
        // TODO: how does one identify the failed response?
        throw new Error(`Failed to send. Result: ${res}`)
      }

      // Logger.isPerfEnabled && Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payee::postQuotes - END`)
      histTimerEnd({ success: true, fsp: request.headers['fspiop-destination'], operation: 'postBulkQuotes', source: request.headers['fspiop-source'], destination: request.headers['fspiop-destination'] })
    } catch (err) {
      Logger.isErrorEnabled && Logger.error(err)
      // Logger.isPerfEnabled && Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payee::postQuotes - ERROR`)
      histTimerEnd({ success: false, fsp: request.headers['fspiop-destination'], operation: 'postBulkQuotes', source: request.headers['fspiop-source'], destination: request.headers['fspiop-destination'] })
    }
  })()
  return h.response().code(Enums.Http.ReturnCodes.ACCEPTED.CODE)
}

// Section about BulkQuotes
exports.putBulkQuotesById = function (request, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()

  // Logger.isPerfEnabled && Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payer::putQuotesById - START`)

  Logger.isInfoEnabled && Logger.info(`IN BulkQuotes:: PUT /bulkQuotes/${request.params.id}, PAYLOAD: [${JSON.stringify(request.payload)}]`)

  // Saving Incoming request
  const incomingRequest = {
    headers: request.headers,
    data: request.payload
  }
  callbackCache.set(request.params.id, incomingRequest)
  correlationCache.set(request.params.id, request.payload)

  // Logger.isPerfEnabled && Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payer::putQuotesById - END`)
  histTimerEnd({ success: true, fsp: 'payee', operation: 'putBulkQuotesById', source: request.headers['fspiop-source'], destination: request.headers['fspiop-destination'] })
  return h.response().code(Enums.Http.ReturnCodes.OK.CODE)
}

exports.putBulkQuotesByIdAndError = function (request, h) {
  console.log((new Date().toISOString()), 'IN BulkQuotes:: PUT /bulkQuotes/' + request.params.id + '/error', request.payload)
  correlationCache.set(request.params.id, request.payload)

  // Saving Incoming request
  const incomingRequest = {
    headers: request.headers,
    data: request.payload
  }
  callbackCache.set(request.params.id, incomingRequest)

  return h.response().code(Enums.Http.ReturnCodes.OK.CODE)
}

exports.getCorrelationId = function (request, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()

  // Logger.isPerfEnabled && Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payee::getcorrelationId - START`)

  const responseData = correlationCache.get(request.params.id)
  Logger.isInfoEnabled && Logger.info(`IN BulkQuotes:: Final response for GET /bulkQuotes/correlationId/${request.params.id}, CACHE: [${JSON.stringify(responseData)}`)

  // Logger.isPerfEnabled && Logger.perf(`[cid=${request.payload.transferId}, fsp=${request.headers['fspiop-source']}, source=${request.headers['fspiop-source']}, dest=${request.headers['fspiop-destination']}] ~ Simulator::api::payee::getcorrelationId - END`)
  histTimerEnd({ success: true, fsp: 'payee', operation: 'getCorrelationId' })
  return h.response(responseData).code(Enums.Http.ReturnCodes.ACCEPTED.CODE)
}

exports.getBulkQuotesById = function (request, h) {
  const responseData = bulkQuoteCache.get(request.params.id)
  Logger.isInfoEnabled && Logger.info(`IN BulkQuotes:: PUT callback for GET /bulkQuotes/${request.params.id}, CACHE: [${JSON.stringify(responseData)}`)
  bulkQuoteCache.del(request.params.id)

  if (responseData) {
    setImmediate(async () => {
      const histTimerEnd = Metrics.getHistogram(
        'sim_request',
        'Histogram for Simulator http operations',
        ['success', 'fsp', 'operation', 'source', 'destination']
      ).startTimer()

      try {
        const url = quotesEndpoint + '/bulkQuotes/' + request.params.id
        const protectedHeader = {
          alg: 'RS256',
          'FSPIOP-Source': `${request.headers['fspiop-destination']}`,
          'FSPIOP-Destination': `${request.headers['fspiop-source']}`,
          'FSPIOP-URI': `/bulkQuotes/${request.params.id}`,
          'FSPIOP-HTTP-Method': 'PUT',
          Date: ''
        }
        const fspiopSignature = {
          signature,
          protectedHeader: `${base64url.encode(JSON.stringify(protectedHeader))}`
        }
        const opts = {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/vnd.interoperability.quotes+json;version=1.0',
            'FSPIOP-Source': request.headers['fspiop-destination'],
            'FSPIOP-Destination': request.headers['fspiop-source'],
            Date: new Date().toUTCString(),
            'FSPIOP-Signature': `${JSON.stringify(fspiopSignature)}`,
            'FSPIOP-HTTP-Method': 'PUT',
            'FSPIOP-URI': `/bulkQuotes/${request.params.id}`
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
        // Logger.isInfoEnabled && Logger.info((new Date().toISOString()), 'Executing PUT', url)
        const res = await sendRequest(url, opts, request.span)
        if (res.status !== Enums.Http.ReturnCodes.OK.CODE) {
          throw new Error(`Failed to send. Result: ${res}`)
        }

        histTimerEnd({ success: true, fsp: request.headers['fspiop-source'], operation: 'getBulkQuotes', source: request.headers['fspiop-source'], destination: request.headers['fspiop-destination'] })
      } catch (err) {
        Logger.isErrorEnabled && Logger.error(err)
        histTimerEnd({ success: false, fsp: request.headers['fspiop-source'], operation: 'getBulkQuotes', source: request.headers['fspiop-source'], destination: request.headers['fspiop-destination'] })
      }
    })
  } else {
    setImmediate(async () => {
      Logger.isErrorEnabled && Logger.error(`getBulkQuotesById: Quote ${request.params.id} not found.`)
      await sendErrorCallback(
        ErrorHandler.CreateFSPIOPError(ErrorHandler.Enums.FSPIOPErrorCodes.QUOTE_ID_NOT_FOUND, `Bulk Quote id ${request.params.id} not found`, null, request.headers['fspiop-source']),
        request.params.id,
        request.headers,
        request.span
      )
    })
  }

  return h.response().code(Enums.Http.ReturnCodes.ACCEPTED.CODE)
}

const sendErrorCallback = async (fspiopError, bulkQuoteId, headers, span) => {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()

  try {
    const url = `${quotesEndpoint}/bulkQuotes/${bulkQuoteId}/error`
    const protectedHeader = {
      alg: 'RS256',
      'FSPIOP-Source': `${headers['fspiop-source']}`,
      'FSPIOP-Destination': 'switch',
      'FSPIOP-URI': `/bulkQuotes/${bulkQuoteId}/error`,
      'FSPIOP-HTTP-Method': 'PUT',
      Date: ''
    }
    const fspiopSignature = {
      signature,
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
        'FSPIOP-URI': `/bulkQuotes/${bulkQuoteId}/error`
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
    Logger.isErrorEnabled && Logger.error(err)
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
  Logger.isInfoEnabled && Logger.info(`IN PAYEEFSP:: PUT /payeefsp/requests/${request.params.id}, CACHE: [${JSON.stringify(responseData)}]`)
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
  Logger.isInfoEnabled && Logger.info(`IN PAYEEFSP:: PUT /payeefsp/callbacks/${request.params.id}, CACHE: [${JSON.stringify(responseData)}]`)
  callbackCache.del(request.params.id)

  histTimerEnd({ success: true, fsp: 'payee', operation: 'getCallbackById' })

  return h.response(responseData).code(Enums.Http.ReturnCodes.OK.CODE)
}
