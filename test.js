import test from 'ava'
import Client, { HTTP } from './drand.js'
import fetch from 'node-fetch'
import AbortController from 'abort-controller'

global.fetch = fetch
global.AbortController = AbortController

const TESTNET_CHAIN_HASH = '138a324aa6540f93d0dad002aa89454b1bec2b6e948682cde6bd4db40f4b7c9b'
const TESTNET_URLS = [
  'http://pl-eu.testnet.drand.sh',
  'http://pl-us.testnet.drand.sh',
  'http://pl-sin.testnet.drand.sh'
]

test('should get latest randomness from testnet', async t => {
  const drand = await Client.wrap(
    HTTP.forURLs(TESTNET_URLS, TESTNET_CHAIN_HASH),
    { chainHash: TESTNET_CHAIN_HASH }
  )
  const rand = await drand.get()
  t.true(rand.round > 1)
})

test('should get specific randomness round from testnet', async t => {
  const drand = await Client.wrap(
    HTTP.forURLs(TESTNET_URLS, TESTNET_CHAIN_HASH),
    { chainHash: TESTNET_CHAIN_HASH }
  )
  const rand = await drand.get(1)
  t.is(rand.round, 1)
})

test('should abort get', async t => {
  const drand = await Client.wrap(
    HTTP.forURLs(TESTNET_URLS, TESTNET_CHAIN_HASH),
    { chainHash: TESTNET_CHAIN_HASH }
  )

  const controller = new AbortController()
  controller.abort()

  const err = await t.throwsAsync(drand.get(1, { signal: controller.signal }))
  t.is(err.type, 'aborted')
})

test('should watch for randomness', async t => {
  const drand = await Client.wrap(
    HTTP.forURLs(TESTNET_URLS, TESTNET_CHAIN_HASH),
    { chainHash: TESTNET_CHAIN_HASH }
  )

  const controller = new AbortController()

  let i = 0
  for await (const rand of drand.watch({ signal: controller.signal })) {
    const expectedRound = drand.roundAt(Date.now())
    t.true(rand.round, expectedRound)
    if (i > 2) {
      break
    }
    i++
  }
})