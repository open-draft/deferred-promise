import { createDeferredExecutor } from '../src/createDeferredExecutor'

it('can be rejected without any reason', async () => {
  const executor = createDeferredExecutor<void>()
  const promise = new Promise<void>(executor).catch(() => {})
  expect(executor.state).toBe('pending')

  executor.reject()

  expect(executor.state).toBe('rejected')
  expect(await promise).toBeUndefined()
  expect(executor.rejectionReason).toBeUndefined()
})

it('can be rejected with a reason', async () => {
  const executor = createDeferredExecutor<void>()
  const promise = new Promise<void>(executor).catch(() => {})
  expect(executor.state).toBe('pending')

  const rejectionReason = new Error('Something went wrong')
  executor.reject(rejectionReason)

  expect(executor.state).toBe('rejected')
  expect(await promise).toBeUndefined()
  expect(executor.rejectionReason).toEqual(rejectionReason)
})
