'use strict'

const Logger = require('@mojaloop/central-services-logger')
const Util = require('util')

const logRequest = function (request) {
  const traceId = request.headers.traceparent ? request.headers.traceparent.split('-')[1] : undefined
  if (request.path.indexOf('health') > -1 || request.path.indexOf('metrics') > -1) {
    Logger.debug(`L1p-Trace-Id=${traceId} - Method: ${request.method} Path: ${request.path} Query: ${JSON.stringify(request.query)}`)
    Logger.debug(`L1p-Trace-Id=${traceId} - Headers: ${JSON.stringify(request.headers)}`)
    if (request.body) {
      Logger.debug(`L1p-Trace-Id=${traceId} - Body: ${request.body}`)
    }
  } else {
    Logger.info(`L1p-Trace-Id=${traceId} - Method: ${request.method} Path: ${request.path} Query: ${JSON.stringify(request.query)}`)
    Logger.info(`L1p-Trace-Id=${traceId} - Headers: ${JSON.stringify(request.headers)}`)
    if (request.body) {
      Logger.info(`L1p-Trace-Id=${traceId} - Body: ${request.body}`)
    }
  }
}

const logResponse = function (request) {
  const traceId = request.headers.traceparent ? request.headers.traceparent.split('-')[1] : undefined
  if (request.response) {
    let response
    try {
      response = JSON.stringify(request.response.source)
    } catch (e) {
      response = Util.inspect(request.response.source)
    }
    if (request.path.indexOf('health') > -1 || request.path.indexOf('metrics') > -1) {
      if (!response) {
        Logger.debug(`L1p-Trace-Id=${traceId} - Response: ${request.response}`)
      } else {
        Logger.debug(`L1p-Trace-Id=${traceId} - Response: ${response} Status: ${request.response.statusCode}`)
      }
    } else {
      if (!response) {
        Logger.info(`L1p-Trace-Id=${traceId} - Response: ${request.response}`)
      } else {
        Logger.info(`L1p-Trace-Id=${traceId} - Response: ${response} Status: ${request.response.statusCode}`)
      }
    }
  }
}

module.exports = {
  logRequest,
  logResponse
}
