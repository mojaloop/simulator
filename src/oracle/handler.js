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

 * Rajiv Mothilal <rajiv.mothilal@modusbox.com>

 --------------
 ******/

'use strict'
const NodeCache = require('node-cache')
const participantsCache = new NodeCache()
const requestsCache = new NodeCache()
const batchRequestCache = new NodeCache()
const Logger = require('@mojaloop/central-services-shared').Logger
const Metrics = require('../lib/metrics')

exports.createParticipantsByTypeAndId = function (request, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()
  Logger.debug(`createParticipantByTypeId::ID=${request.params.ID} payload=${request.payload}`)
  addNewRequest(request)
  const record = {
    partyList: [
      {
        fspId: request.payload.fspId,
        currency: request.payload.currency || undefined,
        partySubIdOrType: request.payload.partySubIdOrType || undefined
      }
    ]
  }
  let idMap = new Map()
  if (participantsCache.get(request.params.Type)) {
    idMap = participantsCache.get(request.params.Type)
    if (idMap.get(request.params.ID)) {
      throw new Error(`ID:${request.params.ID} already exists`)
    } else {
      idMap.set(request.params.ID, record)
      participantsCache.set(request.params.Type, idMap)
    }
  } else {
    idMap.set(request.params.ID, record)
    participantsCache.set(request.params.Type, idMap)
  }

  histTimerEnd({ success: true, operation: 'postParticipants', source: request.headers['fspiop-source'], destination: request.headers['fspiop-destination'] })
  return h.response().code(201)
}

exports.getParticipantsByTypeId = function (request, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()
  Logger.debug(`getParticipantsByTypeId::ID=${request.params.ID}`)
  addNewRequest(request)
  let idMap = new Map()
  let response
  if (participantsCache.get(request.params.Type)) {
    idMap = participantsCache.get(request.params.Type)
    if (idMap.get(request.params.ID)) {
      response = idMap.get(request.params.ID)
    } else {
      response = []
    }
  } else {
    response = []
  }
  histTimerEnd({ success: true, operation: 'getParticipants', source: request.headers['fspiop-source'], destination: request.headers['fspiop-destination'] })
  return h.response(response).code(200)
}

exports.updateParticipantsByTypeId = function (request, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()
  Logger.debug(`updateParticipantByTypeId::ID=${request.params.ID} payload=${request.payload}`)
  addNewRequest(request)
  let idMap
  if (participantsCache.get(request.params.Type)) {
    idMap = participantsCache.get(request.params.Type)
    if (idMap.get(request.params.ID)) {
      const currentRecord = idMap.get(request.params.ID)
      if (request.payload.fspId && currentRecord.partyList[0].fspId !== request.payload.fspId) {
        currentRecord.partyList[0].fspId = request.payload.fspId
      }
      if (request.payload.currency && currentRecord.partyList[0].currency !== request.payload.currency) {
        currentRecord.partyList[0].currency = request.payload.currency
      }
      if (request.payload.partySubIdOrType && currentRecord.partyList[0].partySubIdOrType !== request.payload.partySubIdOrType) {
        currentRecord.partyList[0].partySubIdOrType = request.payload.partySubIdOrType
      }
      idMap.set(request.params.ID, currentRecord)
      participantsCache.set(request.params.Type, idMap)
    } else {
      throw new Error(`ID:${request.params.ID} not found`)
    }
  } else {
    throw new Error(`Type:${request.params.Type} not found`)
  }
  histTimerEnd({ success: true, operation: 'putParticipants', source: request.headers['fspiop-source'], destination: request.headers['fspiop-destination'] })
  return h.response().code(200)
}

exports.delParticipantsByTypeId = function (request, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()
  Logger.debug(`delParticipantsByTypeId::ID=${request.params.ID}`)
  addNewRequest(request)
  let idMap
  if (participantsCache.get(request.params.Type)) {
    idMap = participantsCache.get(request.params.Type)
    if (idMap.get(request.params.ID)) {
      idMap.delete(request.params.ID)
      participantsCache.set(request.params.Type, idMap)
    } else {
      let errorObject = {
        errorCode: 2345,
        errorDescription: `ID:${request.params.ID} not found`
      }
      histTimerEnd({ success: false, operation: 'deleteParticipants', source: request.headers['fspiop-source'], destination: request.headers['fspiop-destination'] })
      return h.response(buildErrorObject(errorObject, [])).code(400)
    }
  } else {
    throw new Error(`Type:${request.params.Type} not found`)
  }
  histTimerEnd({ success: true, operation: 'delParticipants', source: request.headers['fspiop-source'], destination: request.headers['fspiop-destination'] })
  return h.response().code(204)
}

exports.createParticipantsBatch = function (request, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()
  let responseObject = {
    partyList: []
  }
  if (batchRequestCache.get(request.payload.requestId)) {
    let errorObject = {
      errorCode: 2345,
      errorDescription: `Duplicated batch requestId:${request.payload.requestId} received`
    }
    return h.response(buildErrorObject(errorObject, [])).code(400)
  } else {
    let newRequest = {
      headers: request.headers,
      path: request.path,
      method: request.method,
      params: request.params,
      payload: request.payload
    }
    batchRequestCache.set(request.payload.requestId, newRequest)
    for (let party of request.payload.partyList) {
      const record = {
        partyList: [
          {
            fspId: party.fspId,
            currency: party.currency,
            partySubIdOrType: party.partySubIdOrType
          }
        ]
      }
      let partyId = {
        partyIdType: party.partyIdType,
        partyIdentifier: party.partyIdentifier,
        partySubIdOrType: party.partySubIdOrType || undefined,
        fspId: party.fspId,
        currency: party.currency || undefined
      }
      let errorInformation
      let idMap = new Map()
      if (participantsCache.get(party.partyIdType)) {
        idMap = participantsCache.get(party.partyIdType)
        if (idMap.get(party.partyIdentifier)) {
          let errorObject = {
            errorCode: 1234,
            errorDescription: `Participant:${party.partyIdentifier} already exists`
          }
          errorInformation = buildErrorObject(errorObject, [{ key: party.partyIdentifier, value: party.partyIdType }])
          responseObject.partyList.push({ partyId, errorInformation })
        } else {
          idMap.set(party.partyIdentifier, record)
          participantsCache.set(party.partyIdType, idMap)
          responseObject.partyList.push({ partyId })
        }
      } else {
        idMap.set(party.partyIdentifier, record)
        participantsCache.set(party.partyIdType, idMap)
        responseObject.partyList.push({ partyId })
      }
    }
  }
  histTimerEnd({ success: true, operation: 'postParticipantsBatch', source: request.headers['fspiop-source'], destination: request.headers['fspiop-destination'] })
  return h.response(responseObject).code(201)
}

exports.getRequestByTypeId = function (request, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()
  const responseData = requestsCache.get(request.params.ID)
  requestsCache.del(request.params.ID)
  histTimerEnd({ success: true, operation: 'getRequestByTypeId' })
  return h.response(responseData).code(200)
}

exports.getRequestById = function (request, h) {
  const histTimerEnd = Metrics.getHistogram(
    'sim_request',
    'Histogram for Simulator http operations',
    ['success', 'fsp', 'operation', 'source', 'destination']
  ).startTimer()
  const responseData = batchRequestCache.get(request.params.requestId)
  batchRequestCache.del(request.params.requestId)
  histTimerEnd({ success: true, operation: 'getRequestById' })
  return h.response(responseData).code(200)
}

const addNewRequest = function (request) {
  let newRequest = {
    headers: request.headers,
    path: request.path,
    method: request.method,
    params: request.params,
    payload: request.payload ? request.payload : undefined
  }
  if (requestsCache.get(request.params.ID)) {
    let incomingRequests = requestsCache.get(request.params.ID)
    let foundMethod = false
    let count = 0
    for (let entry of incomingRequests) {
      if (entry.method === newRequest.method) {
        foundMethod = true
        break
      }
      count++
    }
    if (!foundMethod) {
      incomingRequests.push(newRequest)
    } else {
      incomingRequests.splice(count, 1)
      incomingRequests.push(newRequest)
    }
    requestsCache.set(request.params.ID, incomingRequests)
  } else {
    requestsCache.set(request.params.ID, [newRequest])
  }
}

const buildErrorObject = function (error, extensionList) {
  return {
    errorCode: error.errorCode.toString(),
    errorDescription: error.errorDescription,
    extensionList
  }
}
