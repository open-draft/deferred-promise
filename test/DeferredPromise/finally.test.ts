import { DeferredPromise } from '../../src/DeferredPromise'

it('executes the "finally" block when the promise resolves', async () => {
  const promise = new DeferredPromise<void>()
  const finallyCallback = jest.fn()
  promise.finally(finallyCallback)

  // Promise is still pending.
  expect(finallyCallback).not.toHaveBeenCalled()

  promise.resolve()
  expect(finallyCallback).not.toHaveBeenCalled()

  expect(await promise).toBe(undefined)
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

  expect(await promise).toBeUndefined()
  expect(finallyCallback).toHaveBeenCalledTimes(1)
  expect(finallyCallback).toHaveBeenCalledWith()
})

it('does not alter resolved data with ".finally()"', async () => {
  const promise = new DeferredPromise<number>()

  const finallyCallback = jest.fn(() => 'unexpected')
  const wrapper = (): Promise<number> => {
    // @ts-expect-error (must only return a rejected Promise)
    return promise.finally(finallyCallback)
  }

  promise.resolve(123)
  const result = await wrapper()

  expect(result).toBe(123)
  expect(finallyCallback).toHaveBeenCalledTimes(1)
  expect(finallyCallback).toHaveBeenCalledWith()
})

it('rejects the promise if a chained finally throws', async () => {
  const promise = new DeferredPromise<number>().finally(() => {
    throw new Error('reason')
  })

  promise.resolve(123)

  await expect(promise).rejects.toThrowError('reason')
  expect(promise.state).toBe('rejected')
})

it('rejects a derived promise if its "finally" throws', async () => {
  const promise = new DeferredPromise<number>()
  const derivedPromise = promise.finally(() => {
    throw new Error('reason')
  })

  promise.resolve(123)

  /**
   * @issue
   * 1. p1 resolves with 123.
   * 2. p1 calls its ".then()" attached by "p1.finally()".
   * 3. "onSettled" throws while p1 is resolving.
   * 4. This directs the exception to rejecting p1.
   * 5. p1 rejects but has no "catch" callback.
   * 6. The exception is unhandled.
   */

  await expect(derivedPromise).rejects.toThrowError('reason')
  expect(derivedPromise.state).toBe('rejected')

  await expect(promise).resolves.toBe(123)
  expect(promise.state).toBe('fulfilled')
})
