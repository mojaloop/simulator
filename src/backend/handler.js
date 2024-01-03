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
 - Aaron Reynoza <aaron.reynoza@infitx.com>
 --------------
 ******/

'use strict'
const NodeCache = require('node-cache')
const requestCache = new NodeCache()
const Logger = require('@mojaloop/central-services-logger')
const Enums = require('@mojaloop/central-services-shared').Enum
const Metrics = require('../lib/metrics')

const transfersFulfilResponseDisabled = (process.env.TRANSFERS_FULFIL_RESPONSE_DISABLED !== undefined && process.env.TRANSFERS_FULFIL_RESPONSE_DISABLED !== 'false')

exports.postQuoteRequest = function (req, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()

  const metadata = `${req.method} ${req.path}`
  const quotesRequest = req.payload
  Logger.isInfoEnabled && Logger.info((new Date().toISOString()), ['IN /backend/quoteRequest::'], `received: ${metadata}. `)
  Logger.isInfoEnabled && Logger.info(`incoming request: ${quotesRequest.quoteId}`)

  // Saving Incoming request
  const incomingRequest = {
    headers: req.headers,
    data: req.payload
  }
  requestCache.set(quotesRequest.quoteId, incomingRequest)

  const quotesResponse = {
    payeeFspCommissionAmount: quotesRequest.feesCurrency,
    payeeFspCommissionAmountCurrency: quotesRequest.feesCurrency,
    payeeFspFeeAmount: quotesRequest.feesAmount,
    payeeFspFeeAmountCurrency: quotesRequest.feesCurrency,
    // Fee currency and currency should be the same in order to have the right value
    payeeReceiveAmount: (Number(quotesRequest.amount) - Number(quotesRequest.feesAmount)),
    payeeReceiveAmountCurrency: quotesRequest.currency,
    quoteId: quotesRequest.quoteId,
    transactionId: quotesRequest.transactionId,
    transferAmount: quotesRequest.amount,
    transferAmountCurrency: quotesRequest.currency,
    expiration: new Date(new Date().getTime() + 10000)
  }

  histTimerEnd({ success: true, fsp: req.headers['fspiop-destination'], operation: 'postQuoteRequest', source: req.headers['fspiop-source'], destination: req.headers['fspiop-destination'] })
  return h.response(quotesResponse).code(Enums.Http.ReturnCodes.ACCEPTED.CODE)
}

exports.postTransfers = async function (req, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()

  Logger.isDebugEnabled && Logger.debug(`[cid=${req.payload.transferId}, fsp=${req.headers['fspiop-source']}, source=${req.headers['fspiop-source']}, dest=${req.headers['fspiop-destination']}] ~ Simulator::api::payee::postTransfers - START`)

  const metadata = `${req.method} ${req.path} ${req.payload.transferId}`
  Logger.isInfoEnabled && Logger.info(`IN backend/transfers:: received: ${metadata}.`)

  const quotesResponse = {
    completedTimestamp: new Date(new Date().getTime() + 10000),
    fulfilment: 'string',
    homeTransactionId: req.payload.homeR2PTransactionId,
    transferState: 'RECEIVED'
  }

  if (!transfersFulfilResponseDisabled) {
    // Saving Incoming request
    const incomingRequest = {
      headers: req.headers,
      data: req.payload
    }
    requestCache.set(req.payload.transferId, incomingRequest)

    histTimerEnd({
      success: true,
      fsp: req.headers['fspiop-destination'],
      operation: 'postTransfers',
      source: req.headers['fspiop-source'],
      destination: req.headers['fspiop-destination']
    })
  } else {
    // Logger.isPerfEnabled && Logger.perf(`[cid=${req.payload.transferId}, fsp=${req.headers['fspiop-source']}, source=${req.headers['fspiop-source']}, dest=${req.headers['fspiop-destination']}] ~ Simulator::api::payee::postTransfers - END`)
    histTimerEnd({
      success: true,
      fsp: req.headers['fspiop-destination'],
      operation: 'postTransfers',
      source: req.headers['fspiop-source'],
      destination: req.headers['fspiop-destination']
    })
  }

  return h.response(quotesResponse).code(Enums.Http.ReturnCodes.ACCEPTED.CODE)
}

exports.getPartiesByTypeAndId = function (req, h) {
  return h.response({
    fspId: 'string'
  }).code(Enums.Http.ReturnCodes.ACCEPTED.CODE)
}
