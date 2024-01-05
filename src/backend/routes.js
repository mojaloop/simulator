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

const Handler = require('./handler')
const Enum = require('@mojaloop/central-services-shared').Enum
const tags = ['api', 'metadata', Enum.Tags.RouteTags.SAMPLED]

module.exports = [
  {
    method: 'POST',
    path: '/backend/quoterequests',
    handler: Handler.postQuoteRequest,
    options: {
      id: `simulator_${__dirname.split('/').pop()}_postQuoteRequest`,
      tags,
      description: 'Metadata'
    }
  },
  {
    method: 'PUT',
    path: '/backend/quotes/{id}',
    handler: Handler.putQuotes,
    options: {
      id: `simulator_${__dirname.split('/').pop()}_putQuotes`,
      tags,
      description: 'Metadata'
    }
  },
  {
    method: 'POST',
    path: '/backend/transfers',
    handler: Handler.postTransfers,
    options: {
      id: `simulator_${__dirname.split('/').pop()}_postTransfers`,
      tags,
      description: 'Metadata'
    }
  },
  {
    method: 'PUT',
    path: '/backend/transfers/{id}',
    handler: Handler.putTransfers,
    options: {
      id: `simulator_${__dirname.split('/').pop()}_putTransfers`,
      tags,
      description: 'Metadata'
    }
  },
  {
    method: 'GET',
    path: '/backend/parties/{type}/{id}',
    handler: Handler.getPartiesByTypeAndId,
    options: {
      id: `simulator_${__dirname.split('/').pop()}_getParty`,
      tags,
      description: 'Metadata'
    }
  },
  {
    method: 'PUT',
    path: '/backend/parties/{type}/{id}',
    handler: Handler.putPartiesByTypeAndId,
    options: {
      id: `simulator_${__dirname.split('/').pop()}_putParty`,
      tags,
      description: 'Metadata'
    }
  }
]
