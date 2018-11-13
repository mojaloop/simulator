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
const cc = require('five-bells-condition')
const IlpPacket = require('ilp-packet')
const crypto = require('crypto')
const NodeCache = require("node-cache");
const myCache = new NodeCache();
const fetch = require('node-fetch');

const partiesEndpoint = process.env.PARTIES_ENDPOINT
const quotesEndpoint = process.env.QUOTES_ENDPOINT
const transfersEndpoint = process.env.TRANSFERS_ENDPOINT

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

  return h.response({ status: 'OK' }).code(200)
}

exports.metadata = function (request, h) {
  return h.response({
    directory: 'localhost',
    urls: extractUrls(request)
  }).code(200)
}

exports.postPartiesByTypeAndId = function (request, h) {
    console.log('IN PAYEEFSP:: POST /payeefsp/parties/'+request.params.id, request.payload)
    myCache.set(request.params.id, request.payload)
    return h.response().code(202)
}

exports.getPartiesByTypeAndId = function (req, h) {
    (async function () {
        const metadata = `${req.method} ${req.path} ${req.params.id} `;
        console.log((new Date().toISOString()), ['IN PAYEEFSP::'], `received: ${metadata}. `);
        const url = partiesEndpoint+'/parties/MSISDN/' + req.params.id;
        try {

            const opts = {
                method: 'PUT',
                headers: {
                    'Accept': 'application/vnd.interoperability.parties+json;version=1',
                    'Content-Type': 'application/vnd.interoperability.parties+json;version=1.0',
                    'FSPIOP-Source': 'payeefsp',
                    'FSPIOP-Destination': req.headers['fspiop-source'],
                    'Date': req.headers['date']
                },
                rejectUnauthorized: false,
                body: JSON.stringify(myCache.get(req.params.id))
            };
            console.log((new Date().toISOString()),`Executing PUT`, url);
            const res = await fetch(url, opts);
            console.log((new Date().toISOString()),'response: ', res.status);
            if (!res.ok) {
                // TODO: how does one identify the failed response?
                throw new Error('Failed to send. Result:', res);
            }


        }
        catch (err) {
            console.log(['error'], err);

        }
    })();
    return h.response().code(202);
}

exports.postQuotes = function (req, h) {
    (async function () {
        const metadata = `${req.method} ${req.path}`;
        const quotesRequest = req.payload
        console.log((new Date().toISOString()),['IN PAYEEFSP::'], `received: ${metadata}. `);
        console.log('incoming request: ', quotesRequest.quoteId)

        //prepare response
        // const fulfillImage = new cc.PreimageSha256()
        // fulfillImage.setPreimage(new Buffer('hello world'))
        // console.log(fulfillImage.serializeUri())
        // console.log(fulfillImage.getConditionUri())
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
            expiration: new Date(new Date().getTime() + 10000),
            ilpPacket: 'AQAAAAAAAABkEHByaXZhdGUucGF5ZWVmc3CCAlV7InRyYW5zYWN0aW9uSWQiOiJhYWUwYzIxMi0wOTJiLTQ5MmItYWQ2ZS1kZmJiYmJjNWRkYzIiLCJxdW90ZUlkIjoiYWFlMGMyMTItMDkyYi00OTJiLWFkNmUtZGZiYmJiYzVkZGMyIiwicGF5ZWUiOnsicGFydHlJZEluZm8iOnsicGFydHlJZFR5cGUiOiJNU0lTRE4iLCJwYXJ0eUlkZW50aWZpZXIiOiIyMjUwNDAwNDc2MiIsImZzcElkIjoicGF5ZWVmc3AifSwicGVyc29uYWxJbmZvIjp7ImNvbXBsZXhOYW1lIjp7fX19LCJwYXllciI6eyJwYXJ0eUlkSW5mbyI6eyJwYXJ0eUlkVHlwZSI6Ik1TSVNETiIsInBhcnR5SWRlbnRpZmllciI6IjI3NzEzODAzOTA1IiwiZnNwSWQiOiJwYXllcmZzcCJ9LCJwZXJzb25hbEluZm8iOnsiY29tcGxleE5hbWUiOnsiZmlyc3ROYW1lIjoiTWF0cyIsImxhc3ROYW1lIjoiSGFnbWFuIn19fSwiYW1vdW50Ijp7ImN1cnJlbmN5IjoiVVNEIiwiYW1vdW50IjoiMTAwIn0sInRyYW5zYWN0aW9uVHlwZSI6eyJzY2VuYXJpbyI6IlRSQU5TRkVSIiwic3ViU2NlbmFyaW8iOiJUUkFOU0ZFUiIsImluaXRpYXRvciI6IlBBWUVSIiwiaW5pdGlhdG9yVHlwZSI6IkNPTlNVTUVSIiwicmVmdW5kSW5mbyI6e319LCJub3RlIjoiaGVqIn0=',
            condition: '_EVkxF7q3V-XDfIztgcHEa3iTqKHt_zKMV5Yjre_Y_o'
        }

        try {
            const url = quotesEndpoint+'/quotes/'+quotesRequest.quoteId;
            const opts = {
                method: 'PUT',
                headers: {
                    'Accept': 'application/vnd.interoperability.quotes+json;version=1',
                    'Content-Type': 'application/vnd.interoperability.quotes+json;version=1.0',
                    'FSPIOP-Source': 'payeefsp',
                    'FSPIOP-Destination': req.headers['fspiop-source'],
                    'Date': req.headers['date']
                },
                rejectUnauthorized: false,
                body: JSON.stringify(quotesResponse)
            };
            console.log((new Date().toISOString()),`Executing PUT`, url);
            const res = await fetch(url, opts);
            console.log((new Date().toISOString()),'response: ', res.status);
            if (!res.ok) {
                // TODO: how does one identify the failed response?
                throw new Error('Failed to send. Result:', res);
            }


        }
        catch (err) {
            console.log(['error'], err);
            // TODO: what if this fails? We need to log. What happens by default?
            //const url = await rq.createErrorUrl(db, req.path, requesterName);
            // TODO: review this error message
            // TODO: we should be able to throw an AppError somewhere, test whether the error
            // received in this handler is an AppError, then send the requester the correct
            // payload etc. based on the contents of that AppError.
            //rq.sendError(url, asyncResponses.serverError, rq.defaultHeaders(requesterName, 'participants'), {logger});
        }
    })();
    return h.response().code(202);
}

exports.postTransfers = function (req, h) {
    (async function () {
        const metadata = `${req.method} ${req.path} ${req.payload.transferId}`;
        console.log((new Date().toISOString()),['IN PAYEEFSP::'], `received: ${metadata}. `);
        const url = transfersEndpoint+'/transfers/' + req.payload.transferId;
        try {

            const transfersResponse = {
                fulfilment: "rjzWyHf4IUao60Yz98HZOIhZbqtclOgZ7WriZuq9Hn0",
                completedTimestamp: new Date().toISOString(),
                transferState: "COMMITTED"
            }

            const opts = {
                method: 'PUT',
                headers: {
                    'Accept': 'application/vnd.interoperability.transfers+json;version=1',
                    'Content-Type': 'application/vnd.interoperability.transfers+json;version=1.0',
                    'FSPIOP-Source': 'payeefsp',
                    'FSPIOP-Destination': req.headers['fspiop-source'],
                    'Date': req.headers['date']
                },
                rejectUnauthorized: false,
                body: JSON.stringify(transfersResponse)
            };
            console.log((new Date().toISOString()),`Executing PUT`, url, 'with body:', JSON.stringify(transfersResponse));
            const res = await fetch(url, opts);
            console.log((new Date().toISOString()),'response: ', res.status);
            if (!res.ok) {
                // TODO: how does one identify the failed response?
                throw new Error('Failed to send. Result:', res);
            }


        }
        catch (err) {
            console.log(['error'], err);
            // TODO: what if this fails? We need to log. What happens by default?
            //const url = await rq.createErrorUrl(db, req.path, requesterName);
            // TODO: review this error message
            // TODO: we should be able to throw an AppError somewhere, test whether the error
            // received in this handler is an AppError, then send the requester the correct
            // payload etc. based on the contents of that AppError.
            //rq.sendError(url, asyncResponses.serverError, rq.defaultHeaders(requesterName, 'participants'), {logger});
        }
    })();
    return h.response().code(202);
}

exports.putTransfersById = function (request, h) {
    console.log((new Date().toISOString()),'IN PAYEEFSP:: PUT /payeefsp/transfers/'+request.params.id, request.payload)
    myCache.set(request.params.id, request.payload)
    return h.response().code(200)
}

exports.putTransfersByIdError = function (request, h) {
    console.log('IN PAYEEFSP:: PUT /payeefsp/transfers/'+request.params.id+'/error', request.payload)
    myCache.set(request.params.id, request.payload)
    return h.response().code(200)
}

exports.getcorrelationId = function (request, h) {
    console.log((new Date().toISOString()),'IN PAYEEFSP:: Final response for GET /payeefsp/correlationid/'+request.params.id, myCache.get(request.params.id))
    return h.response(myCache.get(request.params.id)).code(202)
}
