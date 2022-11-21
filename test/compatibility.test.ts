import { DeferredPromise } from '../src'

it('can be listened to with ".then()"', (done) => {
  expect.assertions(1)

  const promise = new DeferredPromise<number>()

  promise.then((data) => {
    expect(data).toBe(123)
    done()
  })

  promise.resolve(123)
})

it('can be listened to with ".catch()"', (done) => {
  expect.assertions(1)

  const promise = new DeferredPromise<number>()
  promise.catch((reason) => {
    expect(reason).toBe('error')
    done()
  })

  promise.reject('error')
})

it('allows data transformation in the ".then()" chain', async () => {
  const promise = new DeferredPromise<number>()

  promise.then((value) => value * 2).then((value) => value + 10)
  promise.resolve(5)

  const number = await promise

  expect(number).toBe(20)
})

it('allows ".catch().then()" chaining', async () => {
  const promise = new DeferredPromise<number>()

  promise
    .catch<number>((value) => {
      if (typeof value === 'number') {
        return value
      }
    })
    .then((value) => value + 10)

  promise.reject(5)
  const number = await promise

  expect(number).toBe(15)
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
