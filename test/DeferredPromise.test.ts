import { DeferredPromise } from '../src'

it('can be listened to with ".then()"', (done) => {
  expect.assertions(1)

  const promise = new DeferredPromise<number>()
  promise.then((data) => {
    expect(data).toBe(123)
    done()
  })

  promise.resolve(123)
})

it('can be listened to with ".catch()"', (done) => {
  expect.assertions(1)

  const promise = new DeferredPromise<number>()
  promise.catch((reason) => {
    expect(reason).toBe('error')
    done()
  })

  promise.reject('error')
})

it('can be awaited', async () => {
  const promise = new DeferredPromise<number>()
  promise.resolve(123)

  const data = await promise
  expect(data).toBe(123)
})

describe('resolve()', () => {
  it('can be resolved without data', () => {
    const promise = new DeferredPromise<void>()
    promise.resolve()

    expect(promise.state).toBe('resolved')
    expect(promise.result).toBeUndefined()
  })

  it('can be resolved with data', () => {
    const promise = new DeferredPromise<number>()
    expect(promise.state).toBe('pending')

    promise.resolve(123)

    expect(promise.state).toBe('resolved')
    expect(promise.result).toBe(123)
  })

  it('throws when resolving an already resolved promise', () => {
    const promise = new DeferredPromise<number>()
    promise.resolve(123)

    expect(() => promise.resolve(456)).toThrow(
      new TypeError(
        'Cannot resolve a DeferredPromise: illegal state ("resolved")'
      )
    )
  })

  it('throws when resolving an already rejected promise', () => {
    const promise = new DeferredPromise<number>().catch(() => {})
    promise.reject()

    expect(() => promise.resolve(123)).toThrow(
      new TypeError(
        'Cannot resolve a DeferredPromise: illegal state ("rejected")'
      )
    )
  })
})

describe('reject()', () => {
  it('can be rejected without any reason', () => {
    const promise = new DeferredPromise<void>()
    promise.reject()

    expect(promise.state).toBe('rejected')
    expect(promise.result).toBeUndefined()
    expect(promise.rejectionReason).toBeUndefined()
  })

  it('can be rejected with a reason', () => {
    const promise = new DeferredPromise()
    expect(promise.state).toBe('pending')

    const rejectionReason = new Error('Something went wrong')
    promise.reject(rejectionReason)

    expect(promise.state).toBe('rejected')
    expect(promise.result).toBeUndefined()
    expect(promise.rejectionReason).toEqual(rejectionReason)
  })
})
