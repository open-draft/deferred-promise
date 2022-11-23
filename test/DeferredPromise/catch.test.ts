import { DeferredPromise } from '../../src/DeferredPromise'

it('can be listened to with "catch"', async () => {
  const catchCallback = jest.fn()
  const promise = new DeferredPromise().catch(catchCallback)

  promise.reject('error')

  expect(await promise).toBeUndefined()
  expect(promise.state).toBe('rejected')
  expect(catchCallback).toHaveBeenCalledWith('error')
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
