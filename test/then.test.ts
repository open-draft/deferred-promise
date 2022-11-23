import { createDeferredExecutor } from '../src/createDeferredExecutor'

it('can be listened to with ".then()"', (done) => {
  expect.assertions(1)

  const executor = createDeferredExecutor<number>()
  const promise = new Promise(executor)

  promise.then((data) => {
    expect(data).toBe(123)
    done()
  })

  executor.resolve(123)
})

it('respects promise identity during data transformations', async () => {
  const executor = createDeferredExecutor<number>()
  const promise = new Promise(executor)
  promise.then((num) => num * 10)
  executor.resolve(5)

  expect(await promise).toBe(5)
})

it('allows data transformation in the ".then()" chain', async () => {
  const executor = createDeferredExecutor<number>()
  const promise = new Promise(executor)
    .then(function multiplyByTen(num) {
      return num * 10
    })
    .then(function addTwo(num) {
      return num + 2
    })

  executor.resolve(5)

  expect(await promise).toBe(52)
  expect(await promise).toBe(52)
})

it('supports async then transforms', async () => {
  const executor = createDeferredExecutor<number>()
  const promise = new Promise(executor)
    .then(async function firstAdd(num) {
      return num + 5
    })
    .then(async function secondAdd(num) {
      return num + 5
    })

  executor.resolve(5)

  expect(await promise).toBe(15)
  expect(await promise).toBe(15)
})

it('allows transforming the value after the promise is resolved', async () => {
  const executor = createDeferredExecutor<number>()
  const promise = new Promise(executor)
  const derivedPromise = promise.then((num) => num + 5)
  executor.resolve(5)

  expect(await promise).toBe(5)
  expect(await derivedPromise).toBe(10)
})
