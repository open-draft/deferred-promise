import { createDeferredExecutor } from '../src/create-deferred-executor'

it('can be awaited with async/await', async () => {
  const executor = createDeferredExecutor<number>()
  const promise = new Promise(executor)
  executor.resolve(123)

  await expect(promise).resolves.toBe(123)
})

it('yields the resolved value upon subsequent "await"', async () => {
  const executor = createDeferredExecutor<number>()
  const promise = new Promise(executor)
  setTimeout(() => executor.resolve(123), 100)

  await expect(promise).resolves.toBe(123)
  await expect(promise).resolves.toBe(123)
  await expect(promise).resolves.toBe(123)
})
