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
})

it.only('rejects the promise if a derived finally throws', async () => {
  const promise = new DeferredPromise<number>()
  const derivedPromise = promise.finally(() => {
    throw new Error('reason')
  })

  promise.resolve(123)

  await expect(promise).resolves.toBe(123)
  // await expect(derivedPromise).rejects.toThrowError('reason')
})

it('how regular promise behaves', async () => {
  const promise = new Promise((resolve) => {
    resolve(123)
  })

  const derivedPromise = promise.finally(() => {
    throw new Error('reason')
  })

  await expect(promise).resolves.toBe(123)
  await expect(derivedPromise).rejects.toThrowError('reason')
})

it.skip('foo', async () => {
  const promise = new Promise<number>((r) => r(123))
  const derivedPromise = promise.finally(() => {
    throw new Error('reason')
  })

  // await expect(promise).resolves.toBe(123)
  await expect(derivedPromise).rejects.toThrowError('reason')
})
