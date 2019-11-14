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

const Handler = require('./handler')
const tags = ['api', 'oracle']

module.exports = [
  {
    method: 'GET',
    path: '/oracle/participants/{Type}/{ID}',
    handler: Handler.getParticipantsByTypeId,
    options: {
      tags: tags,
      description: 'Get list of participants'
    }
  },
  {
    method: 'POST',
    path: '/oracle/participants/{Type}/{ID}',
    handler: Handler.createParticipantsByTypeAndId,
    config: {
      tags: tags,
      description: 'Create participants'
    }
  },
  {
    method: 'PUT',
    path: '/oracle/participants/{Type}/{ID}',
    handler: Handler.updateParticipantsByTypeId,
    options: {
      tags: tags,
      description: 'Update participants'
    }
  },
  {
    method: 'PUT',
    path: '/oracle/participants/{Type}/{ID}/{partySubIdOrType}',
    handler: Handler.updateParticipantsByTypeId,
    options: {
      tags: tags,
      description: 'Update participants by type ID and Sub ID'
    }
  },
  {
    method: 'DELETE',
    path: '/oracle/participants/{Type}/{ID}',
    handler: Handler.delParticipantsByTypeId,
    options: {
      tags: tags,
      description: 'Delete Participants'
    }
  },
  {
    method: 'DELETE',
    path: '/oracle/participants/{Type}/{ID}/{partySubIdOrType}',
    handler: Handler.delParticipantsByTypeId,
    options: {
      tags: tags,
      description: 'Delete Participants by type ID and Sub ID'
    }
  },
  {
    method: 'POST',
    path: '/oracle/participants',
    handler: Handler.createParticipantsBatch,
    options: {
      tags: tags,
      description: 'Create a list of participants'
    }
  },
  {
    method: 'GET',
    path: '/oracle/requests/{Type}/{ID}',
    handler: Handler.getRequestByTypeId,
    options: {
      tags: tags,
      description: 'Get oracle specific requests based on Type and ID'
    }
  },
  {
    method: 'GET',
    path: '/oracle/requests/{requestId}',
    handler: Handler.getRequestById,
    options: {
      tags: tags,
      description: 'Get oracle specific requests based on requestId of a batch'
    }
  }
]
