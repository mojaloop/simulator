/*****
 License
 --------------
 Copyright © 2020-2025 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Mojaloop Foundation for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 * Mojaloop Foundation
 - Kayden Dua <kaydenduazx@gmail.com>
 --------------
 ******/
'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const Handler = require('../../../src/oracle/handler')

const createRequest = ({ params, payload, headers } = {}) => ({
  params: params || { Type: 'MSISDN', ID: '27713803912' },
  payload: payload || { fspId: 'greenbankfsp', currency: 'USD' },
  headers: headers || { 'fspiop-source': 'greenbankfsp', 'fspiop-destination': 'switch' }
})

const createH = (sandbox) => {
  const h = {}
  h.response = sandbox.stub().returns(h)
  h.code = sandbox.stub().returns(h)
  return h
}

Test('oracle handler', (handlerTest) => {
  let sandbox

  handlerTest.beforeEach(t => {
    sandbox = Sinon.createSandbox()
    t.end()
  })

  handlerTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  handlerTest.test('createParticipantsByTypeAndId should', createTest => {
    createTest.test('return 201 for a new participant', async test => {
      // Arrange
      const request = createRequest()
      const h = createH(sandbox)
      const expectedResponseCode = 201

      // Act
      Handler.createParticipantsByTypeAndId(request, h)

      // Assert
      test.ok(h.code.calledWith(expectedResponseCode), 'The response code matches')
      test.end()
    })

    createTest.test('return 409 with errorInformation when the participant already exists', async test => {
      // Arrange
      const request = createRequest()
      Handler.createParticipantsByTypeAndId(request, createH(sandbox)) // first call creates it
      const h = createH(sandbox)
      const expectedResponseCode = 409
      const expectedErrorCode = '3003'

      // Act
      Handler.createParticipantsByTypeAndId(request, h)

      // Assert
      test.ok(h.code.calledWith(expectedResponseCode), 'The response code matches')
      const body = h.response.getCall(0).args[0]
      test.ok(body.errorInformation, 'The response is wrapped in errorInformation')
      test.deepEqual(body.errorInformation.errorCode, expectedErrorCode, 'The error code matches')
      test.ok(body.errorInformation.errorDescription.includes('already exists'), 'The description mentions already exists')
      test.deepEqual(body.errorInformation.extensionList, { extension: [] }, 'The extension list is empty')
      test.end()
    })

    createTest.test('return 409 with errorInformation when the same partySubIdOrType already exists', async test => {
      // Arrange
      const params = { Type: 'MSISDN', ID: '27713803913' }
      const payload = { fspId: 'greenbankfsp', currency: 'USD', partySubIdOrType: 'PASSPORT' }
      const request = createRequest({ params, payload })
      Handler.createParticipantsByTypeAndId(request, createH(sandbox))
      const h = createH(sandbox)
      const expectedResponseCode = 409

      // Act
      Handler.createParticipantsByTypeAndId(request, h)

      // Assert
      test.ok(h.code.calledWith(expectedResponseCode), 'The response code matches')
      const body = h.response.getCall(0).args[0]
      test.deepEqual(body.errorInformation.errorCode, '3003', 'The error code matches')
      test.end()
    })

    createTest.end()
  })

  handlerTest.end()
})
