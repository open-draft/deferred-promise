import { DeferredPromise } from '../src'

it('executes the "finally" block when the promise resolves', async () => {
  const promise = new DeferredPromise<void>()
  const finallyCallback = jest.fn()
  promise.finally(finallyCallback)

  // Promise is still pending.
  expect(finallyCallback).not.toHaveBeenCalled()

  promise.resolve()
  await promise

  expect(finallyCallback).toHaveBeenCalledTimes(1)
  expect(finallyCallback).toHaveBeenCalledWith()
})

it('executes the "finally" block when the promise rejects', async () => {
  const promise = new DeferredPromise<void>().catch(() => {})

  const finallyCallback = jest.fn()
  promise.finally(finallyCallback)

  // Promise is still pending.
  expect(finallyCallback).not.toHaveBeenCalled()

  promise.reject()
  await promise

  expect(finallyCallback).toHaveBeenCalledTimes(1)
  expect(finallyCallback).toHaveBeenCalledWith()
})
