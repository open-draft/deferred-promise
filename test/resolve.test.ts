import { createDeferredExecutor } from '../src/createDeferredExecutor'

it('can be resolved without data', async () => {
  const executor = createDeferredExecutor<void>()
  const promise = new Promise<void>(executor)
  expect(executor.state).toBe('pending')
  executor.resolve()

  expect(executor.state).toBe('fulfilled')
  expect(await promise).toBeUndefined()
})

it('can be resolved with data', async () => {
  const executor = createDeferredExecutor<number>()
  const promise = new Promise(executor)
  expect(executor.state).toBe('pending')

  executor.resolve(123)

  expect(executor.state).toBe('fulfilled')
  expect(await promise).toBe(123)
})

it('does nothing when resolving an already resolved promise', async () => {
  const executor = createDeferredExecutor<number>()
  const promise = new Promise(executor)
  expect(executor.state).toBe('pending')

  executor.resolve(123)
  expect(executor.state).toBe('fulfilled')
  expect(await promise).toBe(123)

  // Resolving an already resolved Promise does nothing.
  executor.resolve(456)
  expect(executor.state).toBe('fulfilled')
  expect(await promise).toBe(123)
})

it('throws when resolving an already rejected promise', () => {
  const executor = createDeferredExecutor<number>()
  new Promise(executor).catch(() => {})
  expect(executor.state).toBe('pending')
  executor.reject('first reason')

  expect(executor.state).toBe('rejected')
  expect(executor.rejectionReason).toBe('first reason')

  executor.reject('second reason')
  expect(executor.state).toBe('rejected')
  expect(executor.rejectionReason).toBe('first reason')
})
