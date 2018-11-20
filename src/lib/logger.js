'use strict'

const winston = require('winston')

const level = process.env.LOG_LEVEL || 'info'

const transportConsole = new winston.transports.Console({ level: level })

const Logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp({
      format: 'YYYY-MM-dd\'T\'HH:mm:ss.SSSZ'
    }),
    winston.format.prettyPrint(),
    winston.format.printf(info => `${info.timestamp} - ${info.level}: ${info.message}`)
  ),
  levels: {
    info: 0,
    warn: 1,
    error: 2,
    verbose: 3,
    debug: 4,
    silly: 5
  },
  transports: [
    transportConsole
  ],
  exceptionHandlers: [
    transportConsole
  ],
  exitOnError: false
})

module.exports = Logger
