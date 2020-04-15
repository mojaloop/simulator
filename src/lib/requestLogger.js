'use strict'

const Logger = require('@mojaloop/central-services-logger')
const Util = require('util')

const logRequest = function (request) {
  const traceId = request.headers.traceparent ? request.headers.traceparent.split('-')[1] : undefined
  if (request.path.indexOf('health') > -1 || request.path.indexOf('metrics') > -1) {
    Logger.isDebugEnabled && Logger.debug(`L1p-Trace-Id=${traceId} - Method: ${request.method} Path: ${request.path} Query: ${JSON.stringify(request.query)}`)
    Logger.isDebugEnabled && Logger.debug(`L1p-Trace-Id=${traceId} - Headers: ${JSON.stringify(request.headers)}`)
    if (request.body) {
      Logger.isDebugEnabled && Logger.debug(`L1p-Trace-Id=${traceId} - Body: ${request.body}`)
    }
  } else {
    Logger.isInfoEnabled && Logger.info(`L1p-Trace-Id=${traceId} - Method: ${request.method} Path: ${request.path} Query: ${JSON.stringify(request.query)}`)
    Logger.isInfoEnabled && Logger.info(`L1p-Trace-Id=${traceId} - Headers: ${JSON.stringify(request.headers)}`)
    if (request.body) {
      Logger.isInfoEnabled && Logger.info(`L1p-Trace-Id=${traceId} - Body: ${request.body}`)
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
        Logger.isDebugEnabled && Logger.debug(`L1p-Trace-Id=${traceId} - Response: ${request.response}`)
      } else {
        Logger.isDebugEnabled && Logger.debug(`L1p-Trace-Id=${traceId} - Response: ${response} Status: ${request.response.statusCode}`)
      }
    } else {
      if (!response) {
        Logger.isInfoEnabled && Logger.info(`L1p-Trace-Id=${traceId} - Response: ${request.response}`)
      } else {
        Logger.isInfoEnabled && Logger.info(`L1p-Trace-Id=${traceId} - Response: ${response} Status: ${request.response.statusCode}`)
      }
    }
  }
}

module.exports = {
  logRequest,
  logResponse
}
