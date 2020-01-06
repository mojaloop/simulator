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

const methodDictionary = {
  POST: 'prepare',
  PUT: 'fulfil'
}

const getTagsFromFSPIOPHeaders = (request) => {
  const tags = {}
  for (const headerName in request.headers) {
    const h = headerName.split('-')
    if (h[0].toUpperCase() === 'FSPIOP' && h[1].toUpperCase() !== 'SIGNATURE') {
      if (h[1].toUpperCase() === 'HTTP') {
        tags[h[2].toLowerCase()] = request.headers[headerName]
      } else {
        if (h[1].toUpperCase() === 'URI') {
          const uri = request.headers[headerName].split('/')
          if (uri[1] === 'transfers') { // handling outgoing transfers
            tags.transactionType = 'transfers'
            tags.transactionAction = methodDictionary[request.method.toUpperCase()]
            tags.transactionId = uri[2]
          } else if (uri[2] === 'transfers') { // handling incoming transfers
            tags.transactionType = 'transfers'
            tags.transactionAction = methodDictionary[request.method.toUpperCase()]
            tags.transactionId = uri[3]
          }
        }
        tags[h[1].toLowerCase()] = request.headers[headerName]
      }
    }
  }
  return tags
}

const addTagsPostHandler = (request, h) => {
  const span = request.span
  if (span && !span.spanContext.tags.transactionId) {
    span.setTags(getTagsFromFSPIOPHeaders(request))
  }
  return h.continue
}

const plugin = {
  name: 'spanTagSetterOnPostHandler',
  register: function (server) {
    server.ext('onPostHandler', addTagsPostHandler)
  }
}

module.exports = {
  getTagsFromFSPIOPHeaders,
  plugin
}
