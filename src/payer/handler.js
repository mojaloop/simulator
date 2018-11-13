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
 --------------
 ******/

'use strict'

const NodeCache = require("node-cache");
const myCache = new NodeCache();
const fetch = require('node-fetch');


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

exports.health = function (request, h) {
    return h.response({status: 'OK'}).code(200)
}

exports.metadata = function (request, h) {
    return h.response({
        directory: 'localhost',
        urls: extractUrls(request)
    }).code(200)
}

//Section about /participants
exports.putParticipantsByTypeId = function (request, h) {
    console.log((new Date().toISOString()),'IN PAYERFSP:: PUT /payerfsp/participants/'+request.params.id, request.payload)
    myCache.set(request.params.id, request.payload)
    return h.response().code(200)
}


//Section about /parties
exports.putPartiesByTypeId = function (request, h) {
    console.log((new Date().toISOString()),'IN PAYERFSP:: PUT /payerfsp/parties/'+request.params.id, request.payload)
    myCache.set(request.params.id, request.payload)
    return h.response().code(200)
}

//Section about Quotes
exports.putQuotesById = function (request, h) {
    console.log((new Date().toISOString()),'IN PAYERFSP:: PUT /payerfsp/quotes/'+request.params.id, request.payload)
    myCache.set(request.params.id, request.payload)
    return h.response().code(200)
}

//Section about Transfers
exports.putTransfersById = function (request, h) {
    console.log((new Date().toISOString()),'IN PAYERFSP:: PUT /payerfsp/transfers/'+request.params.id, request.payload)
    myCache.set(request.params.id, request.payload)
    return h.response().code(200)
}

exports.putTransfersByIdError = function (request, h) {
    console.log((new Date().toISOString()),'IN PAYERFSP:: PUT /payerfsp/transfers/'+request.params.id+'/error', request.payload)
    myCache.set(request.params.id, request.payload)
    return h.response().code(200)
}

exports.getcorrelationId = function (request, h) {
    console.log((new Date().toISOString()),'IN PAYERFSP:: Final response for GET /payerfsp/correlationid/'+request.params.id, myCache.get(request.params.id))
    return h.response(myCache.get(request.params.id)).code(202)
}





