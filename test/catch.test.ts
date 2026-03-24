import { createDeferredExecutor } from '../src/create-deferred-executor'

it('can be listened to with ".catch()"', async () => {
  const catchCallback = vi.fn()
  const executor = createDeferredExecutor<number>()
  const promise = new Promise(executor).catch(catchCallback)

  executor.reject('error')
  await promise

  expect(catchCallback).toHaveBeenCalledWith('error')
})

it('allows ".catch().then()" chaining', async () => {
  const executor = createDeferredExecutor<number>()
  const promise = new Promise(executor)
    .catch((value) => {
      if (typeof value === 'number') {
        return value
      }
    })
    .then((value) => value + 10)

  executor.reject(5)

  await expect(promise).resolves.toBe(15)
})
