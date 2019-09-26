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

const Hapi = require('@hapi/hapi')
const Boom = require('@hapi/boom')
const Logger = require('@mojaloop/central-services-logger')
const Metrics = require('../lib/metrics')
const RequestLogger = require('../lib/requestLogger')

const createServer = (port, modules) => {
  return (async () => {
    const server = await new Hapi.Server({
      port,
      routes: {
        validate: {
          failAction: async (request, h, err) => {
            throw Boom.boomify(err)
          }
        }
      }
    })
    server.ext('onRequest', function (request, h) {
      RequestLogger.logRequest(request)
      return h.continue
    })
    server.ext('onPreResponse', function (request, h) {
      RequestLogger.logResponse(request)
      return h.continue
    })
    Logger.info('Registering server modules...')
    await server.register(modules)

    Logger.info('Registering server plugins')
    await require('./plugins').registerPlugins(server)

    Logger.info('Initializing metrics...')
    Metrics.setup()

    Logger.info('Server starting up...')
    await server.start()

    Logger.info(`Server running at: ${server.info.uri}`)
    return server
  })()
}

// Migrator.migrate is called before connecting to the database to ensure all new tables are loaded properly.
const initialize = async function ({ service, port, modules = [] }) {
  const server = await createServer(port, modules)
  return server
}

module.exports = {
  initialize,
  createServer
}
