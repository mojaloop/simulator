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
 - Name Surname <name.surname@gatesfoundation.com>

 - Valentin Genev <valentin.genev@modusbox.com>

 --------------
 ******/

'use strict'

const Logger = require('@mojaloop/central-services-logger')
const request = require('axios')
const { pickBy, identity } = require('lodash')

// module.exports = async (url, opts, span) => {
//   Logger.info(`Executing PUT: [${url}], HEADERS: [${JSON.stringify(opts.headers)}], BODY: [${JSON.stringify(opts.body)}]`)
//   let optionsWithCleanHeaders = Object.assign({}, opts, { headers: pickBy(opts.headers, identity) })
//   if (span) {
//     optionsWithCleanHeaders = span.injectContextToHttpRequest(optionsWithCleanHeaders)
//   }
//   const res = await request(url, optionsWithCleanHeaders)
//   Logger.info((new Date().toISOString()), 'response: ', res.status)
//   return res
// }

const httpKeepAlive = process.env.HTTP_KEEPALIVE || 'true'
const httpKeepAliveMsecs = process.env.HTTP_KEEPALIVEMS || undefined
const httpMaxSockets = process.env.HTTP_MAXSOCKETS || undefined
const httpMaxFreeSockets = process.env.HTTP_MAXFREESOCKETS || undefined
const httpTimeoutMsecs = process.env.HTTP_TIMEOUTMS || undefined

const httpAgentConfig = {}

if (httpKeepAlive && httpKeepAlive === 'true') {
  Object.assign(httpAgentConfig, { keepAlive: true })
}

if (httpKeepAliveMsecs && !isNaN(httpKeepAliveMsecs)) {
  Object.assign(httpAgentConfig, { keepAliveMsecs: parseInt(httpKeepAliveMsecs) })
}

if (httpMaxSockets && !isNaN(httpMaxSockets)) {
  Object.assign(httpAgentConfig, { maxSockets: parseInt(httpMaxSockets) })
}

if (httpMaxFreeSockets && !isNaN(httpMaxFreeSockets)) {
  Object.assign(httpAgentConfig, { maxFreeSockets: parseInt(httpMaxFreeSockets) })
}

if (httpTimeoutMsecs && !isNaN(httpTimeoutMsecs)) {
  Object.assign(httpAgentConfig, { timeout: parseInt(httpTimeoutMsecs) })
}


/** 
 * Class: HTTPRequestHandler 
 * Implementation that allows config options to be injected into underying Axios.
 * See https://github.com/axios/axios#request-config for configuration options.
 * TODO: 
 * - Productionise code below, and also create unit tests, etc.
 * - Consider replacing all sendRequest using the implementation below
*/

const http = require('http')
const axios = require('axios')
class HTTPRequestHandler {
  constructor(opts) {
    if (opts) {
      this._opts = opts
    } else {
      // Set config defaults when creating the instance
      this._opts = {
        httpAgent: new http.Agent({
          "keepAlive": true
        })
      }
    }

    this._requestInstance = axios.create(opts)
  }

  /**
   * @method sendRequest
   *
   * @description sends a request to url
   *
   * @param {string} url the endpoint for the service you require
   * @param {object} opts option config for axios - https://github.com/axios/axios#request-config
   * @param {object} span a span for event logging if this request is within a span
   *
   *@return {object} The response for the request being sent or error object with response included
  */
  sendRequest = async (url, opts, span) => {
    Logger.info(`Executing PUT: [${url}], HEADERS: [${JSON.stringify(opts.headers)}], BODY: [${JSON.stringify(opts.body)}]`)
    let optionsWithCleanHeaders = Object.assign({}, opts, { headers: pickBy(opts.headers, identity) })
    if (span) {
      optionsWithCleanHeaders = span.injectContextToHttpRequest(optionsWithCleanHeaders)
    }
    const res = await this._requestInstance.request(url, optionsWithCleanHeaders)
    Logger.info((new Date().toISOString()), 'response: ', res.status)
    return res
  }
}

const httpRequestHandler = new HTTPRequestHandler({
  httpAgent: new http.Agent(
    {
      httpAgent: httpAgentConfig
    }
  )
})

module.exports = async (url, opts, span) => {
  return await httpRequestHandler.sendRequest(url, optionsWithCleanHeaders)
}
