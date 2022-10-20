import { DeferredPromise } from "../src";

describe("Promise-compliance", () => {
  it('can be listened to with ".then()"', (done) => {
    expect.assertions(1);

    const promise = new DeferredPromise<number>();

    promise.then((data) => {
      expect(data).toBe(123);
      done();
    });

    promise.resolve(123);
  });

  it('can be listened to with ".catch()"', (done) => {
    expect.assertions(1);

    const promise = new DeferredPromise<number>();
    promise.catch((reason) => {
      expect(reason).toBe("error");
      done();
    });

    promise.reject("error");
  });

  it("can be awaited with async/await", async () => {
    const promise = new DeferredPromise<number>();
    promise.resolve(123);

    const data = await promise;
    expect(data).toBe(123);
  });

  it('allows data transformation in the ".then()" chain', async () => {
    const promise = new DeferredPromise<number>();

    promise.then((value) => value * 2).then((value) => value + 10);
    promise.resolve(5);

    const number = await promise;

    expect(number).toBe(20);
  });

  it('allows ".catch().then()" chaining', async () => {
    const promise = new DeferredPromise<number>();

    promise
      .catch<number>((value) => {
        if (typeof value === "number") {
          return value;
        }
      })
      .then((value) => value + 10);

    promise.reject(5);
    const number = await promise;

    expect(number).toBe(15);
  });

  it('does not alter resolved data with ".finally()"', async () => {
    const promise = new DeferredPromise<number>();

    const finallyCallback = jest.fn(() => "unexpected");
    const wrapper = (): Promise<number> => {
      return promise.finally(finallyCallback);
    };

    promise.resolve(123);
    const result = await wrapper();

    expect(result).toBe(123);
    expect(finallyCallback).toHaveBeenCalledTimes(1);
    expect(finallyCallback).toHaveBeenCalledWith();
  });
});

describe("resolve()", () => {
  it("can be resolved without data", () => {
    const promise = new DeferredPromise<void>();
    expect(promise.state).toBe("pending");
    promise.resolve();

    expect(promise.state).toBe("resolved");
    expect(promise.result).toBeUndefined();
  });

  it("can be resolved with data", () => {
    const promise = new DeferredPromise<number>();
    expect(promise.state).toBe("pending");

    promise.resolve(123);

    expect(promise.state).toBe("resolved");
    expect(promise.result).toBe(123);
  });

  it("does nothing when resolving an already resolved promise", async () => {
    const promise = new DeferredPromise<number>();
    expect(promise.state).toBe("pending");

    promise.resolve(123);
    expect(promise.state).toBe("resolved");
    expect(promise.result).toBe(123);

    // Resolving an already resolved Promise does nothing.
    promise.resolve(456);
    expect(promise.state).toBe("resolved");
    expect(promise.result).toBe(123);
  });

  it("throws when resolving an already rejected promise", () => {
    const promise = new DeferredPromise<number>().catch(() => {});
    expect(promise.state).toBe("pending");
    promise.reject("first reason");

    expect(promise.state).toBe("rejected");
    expect(promise.rejectionReason).toBe("first reason");

    promise.reject("second reason");
    expect(promise.state).toBe("rejected");
    expect(promise.rejectionReason).toBe("first reason");
  });
});

describe("reject()", () => {
  it("can be rejected without any reason", () => {
    const promise = new DeferredPromise<void>().catch(() => {});
    expect(promise.state).toBe("pending");
    promise.reject();

    expect(promise.state).toBe("rejected");
    expect(promise.result).toBeUndefined();
    expect(promise.rejectionReason).toBeUndefined();
  });

  it("can be rejected with a reason", () => {
    const promise = new DeferredPromise().catch(() => {});
    expect(promise.state).toBe("pending");

    const rejectionReason = new Error("Something went wrong");
    promise.reject(rejectionReason);

    expect(promise.state).toBe("rejected");
    expect(promise.result).toBeUndefined();
    expect(promise.rejectionReason).toEqual(rejectionReason);
  });
});

describe("finally()", () => {
  it('executes the "finally" block when the promise resolves', async () => {
    const promise = new DeferredPromise<void>();
    const finallyCallback = jest.fn();
    promise.finally(finallyCallback);

    // Promise is still pending.
    expect(finallyCallback).not.toHaveBeenCalled();

    promise.resolve();
    await promise;

    expect(finallyCallback).toHaveBeenCalledTimes(1);
    expect(finallyCallback).toHaveBeenCalledWith();
  });

  it('executes the "finally" block when the promise rejects', async () => {
    const promise = new DeferredPromise<void>().catch(() => {});

    const finallyCallback = jest.fn();
    promise.finally(finallyCallback);

    // Promise is still pending.
    expect(finallyCallback).not.toHaveBeenCalled();

    promise.reject();
    await promise;

    expect(finallyCallback).toHaveBeenCalledTimes(1);
    expect(finallyCallback).toHaveBeenCalledWith();
  });
});
