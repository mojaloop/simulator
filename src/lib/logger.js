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

 - Pedro Barreto <pedrob@crosslaketech.com>
 - Rajiv Mothilal <rajivmothilal@gmail.com>
 - Miguel de Barros <miguel.debarros@modusbox.com>

 --------------
 ******/

'use strict'

const winston = require('winston')

let Logger

if(!Logger) {
  const level = process.env.LOG_LEVEL || 'info'
  const transportConsole = new winston.transports.Console({ level: level })

  Logger = winston.createLogger({
    format: winston.format.combine(
      winston.format.colorize({all: true}),
      winston.format.timestamp({
        format: 'YYYY-MM-dd\'T\'HH:mm:ss.SSSZ'
      }),
      winston.format.prettyPrint(),
      winston.format.printf(info => `${info.timestamp} - ${info.level}: ${info.message}`)
    ),
    levels: {
      error: 0,
      warn: 1,
      info: 2,
      perf: 3,
      verbose: 4,
      debug: 5,
      silly: 6
    },
    transports: [
      transportConsole
    ],
    exceptionHandlers: [
      transportConsole
    ],
    exitOnError: false
  })

  winston.addColors({
    perf: 'red'
  })
}

module.exports = Logger
