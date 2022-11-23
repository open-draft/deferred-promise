import { createDeferredExecutor } from '../src/createDeferredExecutor'

it('executes the "finally" block when the promise resolves', async () => {
  const executor = createDeferredExecutor()
  const promise = new Promise(executor)
  const finallyCallback = jest.fn()
  promise.finally(finallyCallback)

  // Promise is still pending.
  expect(finallyCallback).not.toHaveBeenCalled()

  executor.resolve()
  await promise

  expect(finallyCallback).toHaveBeenCalledTimes(1)
  expect(finallyCallback).toHaveBeenCalledWith()
})

it('executes the "finally" block when the promise rejects', async () => {
  const executor = createDeferredExecutor<number>()
  const promise = new Promise(executor).catch(() => {})

  const finallyCallback = jest.fn()
  promise.finally(finallyCallback)

  // Promise is still pending.
  expect(finallyCallback).not.toHaveBeenCalled()

  executor.reject()
  await promise

  expect(finallyCallback).toHaveBeenCalledTimes(1)
  expect(finallyCallback).toHaveBeenCalledWith()
})

it('does not alter resolved data with ".finally()"', async () => {
  const executor = createDeferredExecutor<number>()
  const promise = new Promise(executor)

  const finallyCallback = jest.fn(() => 'unexpected')
  const wrapper = (): Promise<number> => {
    return promise.finally(finallyCallback)
  }

  executor.resolve(123)
  const result = await wrapper()

  expect(result).toBe(123)
  expect(finallyCallback).toHaveBeenCalledTimes(1)
  expect(finallyCallback).toHaveBeenCalledWith()
})
