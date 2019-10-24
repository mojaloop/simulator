const Logger = require('@mojaloop/central-services-logger')
const request = require('axios')
const { pickBy, identity } = require('lodash')

module.exports = async (url, opts) => {
  Logger.info(`Executing PUT: [${url}], HEADERS: [${JSON.stringify(opts.headers)}], BODY: [${JSON.stringify(opts.body)}]`)
  const optionsWithCleanHeaders = Object.assign({}, opts, { headers: pickBy(opts.headers, identity) })
  const res = await request(url, optionsWithCleanHeaders)
  Logger.info((new Date().toISOString()), 'response: ', res.status)
  return res
}
