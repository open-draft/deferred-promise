import { DeferredPromise } from '../../src/_DeferredPromise'

it('can be rejected without any reason', async () => {
  const promise = new DeferredPromise<void>().catch(() => {})
  expect(promise.state).toBe('pending')

  promise.reject()

  expect(promise.state).toBe('pending')
  expect(await promise).toBeUndefined()
  expect(promise.state).toBe('rejected')
  expect(promise.rejectionReason).toBeUndefined()
})

it('can be rejected with a reason', async () => {
  const promise = new DeferredPromise<void>().catch((reason) => reason)
  expect(promise.state).toBe('pending')

  const reason = new Error('hello')
  promise.reject(reason)

  expect(promise.state).toBe('pending')
  expect(await promise).toEqual(reason)
  expect(promise.state).toBe('rejected')
  expect(promise.rejectionReason).toEqual(reason)
})

it('rejects with undefined reason if there is an empty catch block', async () => {
  const promise = new DeferredPromise<void>().catch(() => {
    // Note how this catch block will lose any rejection reason.
  })
  expect(promise.state).toBe('pending')

  const reason = new Error('hello')
  promise.reject(reason)

  expect(promise.state).toBe('pending')
  expect(await promise).toBeUndefined()
  // The state still remains as rejected.
  expect(promise.state).toBe('rejected')
  // But the rejection reason is undefined
  // because the "catch" block above didn't return any.
  expect(promise.rejectionReason).toBeUndefined()
})
