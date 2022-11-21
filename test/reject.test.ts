import { DeferredPromise } from '../src'

it('can be rejected without any reason', () => {
  const promise = new DeferredPromise<void>().catch(() => {})
  expect(promise.state).toBe('pending')
  promise.reject()

  expect(promise.state).toBe('rejected')
  expect(promise.result).toBeUndefined()
  expect(promise.rejectionReason).toBeUndefined()
})

it('can be rejected with a reason', () => {
  const promise = new DeferredPromise().catch(() => {})
  expect(promise.state).toBe('pending')

  const rejectionReason = new Error('Something went wrong')
  promise.reject(rejectionReason)

  expect(promise.state).toBe('rejected')
  expect(promise.result).toBeUndefined()
  expect(promise.rejectionReason).toEqual(rejectionReason)
})
