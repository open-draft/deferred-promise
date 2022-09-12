# Deferred Promise

The `DeferredPromise` class is a Promise-compatible abstraction that defers resolving/rejecting promises to another closure. This class is primarily useful when one part of your system establishes as promise but another part of your system fulfills it.

> This class is conceptually inspired by the [`createDeferredPromise()`](https://github.com/nodejs/node/blob/696fd4b14fc34cc2d01497a3abd9bb441b89be50/lib/internal/util.js#L468-L477) internal utility in Node.js. Unlike the Node.js implementation, however, `DeferredProimse` _extends_ a native `Promise`, allowing the consumer to handle deferred promises like regular promises (no `.promise` instance nesting).

## Getting started

```sh
npm install deferred-promise
```

## Documentation

- [**Class: `DeferredPromise`**](#class-deferredpromise)
  - [`new DeferredPromise()`](#new-defferedpromise)
  - [`deferredPromise.state`](#deferredpromisestate)
  - [`deferredProimse.result`](#deferredpromiseresult)
  - [`deferredPromise.resolve()`](#deferredpromiseresolve)
  - [`deferredPromies.reject()`](#deferredpromisereject)

## Class: `DeferredPromise`

### `new DefferedPromise()`

Creates a new instance of a deferred promise.

```js
import { DeferredPromise } from 'deferred-promise'

const promise = new DeferredPromise()
```

Unlike the regular `Promise`, a deferred promise does not accept the callback function. Instead, you should use [`.resolve()`](#deferredpromiseresolve) and [`.reject()`](#deferredpromisereject) to resolve and reject the promise respectively.

A deferred promise is fully compatible with the native `Promise`, which means you can pass it to the consumers that await a regular `Promise` as well.

### `deferredPromise.state`

- `<"pending" | "resolved" | "rejected">` **Default:** `"pending"`

```js
const promise = new DeferredPromise()
console.log(promise.state) // "pending"

promise.resolve()
console.log(promise.state) // "resolved"
```

### `deferredPromise.result`

Returns the value that has resolved the promise. If no value has been provided to the `.resolve()` call, `undefined` is returned instead.

```js
const promise = new DeferredPromise()
promise.resolve('John')

console.log(promise.result) // "John"
```

### `deferredPromise.rejectionReason`

Returns the reason that has rejected the promise. If no reason has been provided to the `.reject()` call, `undefined` is returned instead.

```js
const promise = new DeferredPromise()
promise.reject(new Error('Internal Server Error'))

console.log(promise.rejectionReason) // Error
```

### `deferredPromise.resolve()`

Resolves the deferred promise with a given value.

```js
function startServer() {
  const serverReady = new DeferredPromise()

  new http.Server().listen(() => {
    // Resolve the deferred promise with the server address
    // once the server is ready.
    serverReady.resolve('http://localhost:8080')
  })

  // Return the deferred promise to the consumer.
  return serverReady
}

startServer().then((address) => {
  console.log('Server is running at "%s"', address)
})
```

### `deferredPromise.reject()`

Rejects the deferred promise with a given reason.

```js
function createBroadcast() {
  const runtimePromise = new DeferredPromise()

  receiver.on('error', (error) => {
    // Reject the deferred promise in response
    // to the incoming "error" event.
    runtimePromise.reject(error)
  })

  // This deferred promise will be pending forever
  // unless the broadcast channel receives the
  // "error" event that rejects it.
  return runtimePromise
}
```
