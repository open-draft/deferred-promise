import { DeferredPromise } from '../../src/DeferredPromise'

it('can be listened to with "catch"', async () => {
  const promise = new DeferredPromise().catch((reason) => reason)

  promise.reject('reason')

  expect(await promise).toBe('reason')
  expect(promise.state).toBe('fulfilled')

  queueMicrotask(() => console.log(promise.state))
})

it('propagates a caught error to derived promises', async () => {
  const p1 = new DeferredPromise()
  const p2 = p1.catch((error) => error)

  p1.reject('hello')

  expect(await p2).toBe('hello')
})

it('allows chaining "then" after "catch"', async () => {
  const promise = new DeferredPromise()
    .catch((value) => {
      if (typeof value === 'number') {
        return value
      }
    })
    .then((value) => {
      if (typeof value === 'number') {
        return value + 10
      }
    })

  promise.reject(5)

  expect(await promise).toBe(15)
  expect(promise.state).toBe('rejected')
})

it('supports complex then/catch chains', async () => {
  const promise = new DeferredPromise<number>()
    .then((x) => {
      return x + 5
    })
    .then((x) => {
      throw new Error(`${x} apples`)
    })
    .catch((error) => {
      if (error instanceof Error) {
        return error.message.toUpperCase()
      }

      throw error
    })
    .then((message) => {
      if (typeof message === 'string') {
        return message.split(' ')
      }
    })
    .catch(() => {
      throw new Error('Must never reach this')
    })

  promise.resolve(5)

  expect(await promise).toEqual(['10', 'APPLES'])
})

it('supports a Promise returned from "catch"', async () => {
  const promise = new DeferredPromise().catch((x) => {
    return new Promise<string>((resolve) => {
      resolve(x.toString())
    })
  })

  promise.reject(123)

  expect(await promise).toBe('123')
})

it('supports a DeferredPromise returned from "catch"', async () => {
  const promise = new DeferredPromise().catch((x) => {
    const deferred = new DeferredPromise<string>()
    deferred.resolve(x.toString())
    return deferred
  })

  promise.reject(123)

  expect(await promise).toBe('123')
})
