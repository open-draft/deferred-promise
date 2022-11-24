import { DeferredPromise } from '../../src/DeferredPromise'

it('respects promise identity with chain transforms', async () => {
  const p1 = new DeferredPromise<number>()
  const p2 = p1.then(function add(x) {
    return x + 2
  })
  p1.resolve(5)

  expect(await p1).toBe(5)
  expect(await p2).toBe(7)
})

it('supports value transform via chaining', async () => {
  const p1 = new DeferredPromise<number>()
    .then(function add(x) {
      return x + 2
    })
    .then(function multiply(x) {
      return x * 2
    })

  p1.resolve(5)

  expect(await p1).toBe(14)
  expect(p1.state).toBe('fulfilled')
})

it('supports two independent transform chains', async () => {
  const p1 = new DeferredPromise<number>().then((x) => x + 2)
  const p2 = p1.then((x) => x + 5)

  p1.resolve(5)

  expect(await p1).toBe(7)
  expect(await p2).toBe(12)
})

it('supports a Promise returned from "then"', async () => {
  const promise = new DeferredPromise<number>().then((x) => {
    return new Promise<string>((resolve) => {
      resolve(x.toString())
    })
  })

  promise.resolve(5)

  expect(await promise).toBe('5')
})

it('supports a DeferredPromise returned from "then"', async () => {
  const promise = new DeferredPromise<number>().then((x) => {
    const deferred = new DeferredPromise<string>()
    deferred.resolve(x.toString())
    return deferred
  })

  promise.resolve(5)

  expect(await promise).toBe('5')
})
