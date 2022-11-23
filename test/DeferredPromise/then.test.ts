import { DeferredPromise } from '../../src/DeferredPromise'

it('respects promise identity with chain transforms', async () => {
  const p1 = new DeferredPromise<number>()
  const p2 = p1.then(function add(x) {
    return x + 2
  })
  p1.resolve(5)

  expect(await p1).toBe(5)
  expect(await p2).toBe(7)
})

it('supports value transform via chaining', async () => {
  const p1 = new DeferredPromise<number>()
    .then(function add(x) {
      return x + 2
    })
    .then(function multiply(x) {
      return x * 2
    })

  p1.resolve(5)

  expect(await p1).toBe(14)
})

it('supports two independent transform chains', async () => {
  const p1 = new DeferredPromise<number>().then((x) => x + 2)
  const p2 = p1.then((x) => x + 5)

  p1.resolve(5)

  expect(await p1).toBe(7)
  expect(await p2).toBe(12)
})
