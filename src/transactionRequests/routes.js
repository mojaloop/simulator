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
const Enum = require('@mojaloop/central-services-shared').Enum
const tags = ['api', 'transactionRequests', Enum.Tags.RouteTags.SAMPLED]

module.exports = [
  {
    method: 'GET',
    path: '/transactionRequests/{ID}',
    handler: Handler.getParticipantsByTypeId,
    options: {
      id: `simulator_${__dirname.split('/').pop()}_getParticipantsByTypeId`,
      tags: tags,
      description: 'Get list of participants'
    }
  },
  {
    method: 'POST',
    path: '/transactionRequests',
    handler: Handler.createParticipantsByTypeAndId,
    config: {
      id: `simulator_${__dirname.split('/').pop()}_createParticipantsByTypeAndId`,
      tags: tags,
      description: 'Create participants'
    }
  },
  {
    method: 'PUT',
    path: '/transactionRequests/{ID}',
    handler: Handler.updateParticipantsByTypeId,
    options: {
      id: `simulator_${__dirname.split('/').pop()}_updateParticipantsByTypeId`,
      tags: tags,
      description: 'Update participants'
    }
  },
  {
    method: 'PUT',
    path: '/transactionRequests/{ID}/error',
    handler: Handler.delParticipantsByTypeId,
    options: {
      id: `simulator_${__dirname.split('/').pop()}_delParticipantsByTypeId`,
      tags: tags,
      description: 'Delete Participants'
    }
  },
  {
    method: 'GET',
    path: '/transactionRequests/requests/{Type}/{ID}',
    handler: Handler.getRequestByTypeId,
    options: {
      id: `simulator_${__dirname.split('/').pop()}_getRequestByTypeId`,
      tags: tags,
      description: 'Get oracle specific requests based on Type and ID'
    }
  },
  {
    method: 'GET',
    path: '/transactionRequests/requests/{requestId}',
    handler: Handler.getRequestById,
    options: {
      id: `simulator_${__dirname.split('/').pop()}_getRequestById`,
      tags: tags,
      description: 'Get oracle specific requests based on requestId of a batch'
    }
  }
]
