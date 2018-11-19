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

 - Pedro Barreto <pedrob@crosslaketech.com>
 - Rajiv Mothilal <rajivmothilal@gmail.com>
 - Miguel de Barros <miguel.debarros@modusbox.com>

 --------------
 ******/

'use strict'

const client = require('prom-client')
const Logger = require('./logger')

let alreadySetup = false
let histograms = []
let prefix = process.env.METRICS_PREFIX || 'moja_sim_'
let isDisabled = (process.env.METRICS_DISABLED === 'true')
let timeout = process.env.METRICS_TIMEOUT || 5000
let disabledMessage = 'Metrics is disabled. Please enable it via the environment var METRICS_DISABLED=\'false\'.'

let metricOptions = {
  timeout,
  prefix
}

const setup = () => {
  if (alreadySetup || isDisabled) {
    if(isDisabled){
      Logger.warn(disabledMessage)
    }
    return
  }
  client.collectDefaultMetrics(metricOptions)
  client.register.metrics()
  alreadySetup = true
}

const getHistogram = (name, help = null, labelNames = []) => {
  try {
    if (histograms[name]) {
      return histograms[name]
    }
    histograms[name] = new client.Histogram({
      name: `${prefix}${name}`,
      help: help || `${name}_histogram`,
      labelNames: labelNames,
      buckets: [0.010, 0.050, 0.1, 0.5, 1, 2, 5] // this is in seconds - the startTimer().end() collects in seconds with ms precision
    })
    return histograms[name]
  } catch (e) {
    throw new Error(`Couldn't get metrics histogram for ${name}`)
  }
}

const getMetricsForPrometheus = () => {
  if(isDisabled) {
    return disabledMessage
  } else {
    return client.register.metrics()
  }
}

module.exports = {
  isDisabled,
  options: metricOptions,
  disabledMessage: disabledMessage,
  setup,
  getHistogram,
  getMetricsForPrometheus
}
