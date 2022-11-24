import { DeferredPromise } from '../../src/DeferredPromise'

it('executes the "finally" block when the promise resolves', async () => {
  const promise = new DeferredPromise<void>()
  const finallyCallback = jest.fn()
  promise.finally(finallyCallback)

  // Promise is still pending.
  expect(finallyCallback).not.toHaveBeenCalled()

  promise.resolve()
  expect(finallyCallback).not.toHaveBeenCalled()

  await promise

  expect(finallyCallback).toHaveBeenCalledTimes(1)
  // "finally" callback does not receive any result.
  expect(finallyCallback).toHaveBeenCalledWith()
})

it('executes the "finally" block when the promise rejects', async () => {
  const promise = new DeferredPromise().catch(() => {})

  const finallyCallback = jest.fn()
  promise.finally(finallyCallback)

  // Promise is still pending.
  expect(finallyCallback).not.toHaveBeenCalled()

  promise.reject()
  await promise

  expect(finallyCallback).toHaveBeenCalledTimes(1)
  expect(finallyCallback).toHaveBeenCalledWith()
})

it('does not alter resolved data with ".finally()"', async () => {
  const promise = new DeferredPromise<number>()

  const finallyCallback = jest.fn(() => 'unexpected')
  const wrapper = (): Promise<number> => {
    return promise.finally(finallyCallback)
  }

  promise.resolve(123)
  const result = await wrapper()

  expect(result).toBe(123)
  expect(finallyCallback).toHaveBeenCalledTimes(1)
  expect(finallyCallback).toHaveBeenCalledWith()
})
