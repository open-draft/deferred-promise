import { DeferredPromise } from '../src'

it('can be awaited with async/await', async () => {
  const promise = new DeferredPromise<number>()
  promise.resolve(123)

  const data = await promise
  expect(data).toBe(123)
})
