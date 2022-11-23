import { createDeferredExecutor } from '../src/createDeferredExecutor'

it('can be listened to with ".catch()"', async () => {
  const catchCallback = jest.fn()
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

  expect(await promise).toBe(15)
})
