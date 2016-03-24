/*
* @Author: dm.yang
* @Date:   2014-11-28 12:55:44
* @Last Modified by:   dmyang
* @Last Modified time: 2015-08-05 20:33:01
*/

// @see => http://promises-aplus.github.io/promises-spec/
// @see => https://github.com/cujojs/when/blob/master/lib/makePromise.js

;(function(root, factory) {
    if (typeof module !== 'undefined' && module.exports) {// CommonJS
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {// AMD / RequireJS
        define(factory);
    } else {
        root.Promise = factory.call(root);
    }
}(this, function() {
    'use strict';

    function PromiseA(resolver) {
        if(!(this instanceof PromiseA)) return new PromiseA(resolver);

        this.status = 'pending';
        this.value;
        this.reason;

        // then may be called multiple times on the same promise
        this._resolves = [];
        this._rejects = [];

        if(isFn(resolver)) resolver(this.resolve.bind(this), this.reject.bind(this));

        return this;
    };

    PromiseA.prototype.then = function(resolve, reject) {
        var next = this._next || (this._next = PromiseA());
        var status = this.status;
        var x;

        if('pending' === status) {
            isFn(resolve) && this._resolves.push(resolve);
            isFn(reject) && this._rejects.push(reject);
            return next;
        }

        if('resolved' === status) {
            if(!isFn(resolve)) {
                next.resolve(resolve);
            } else {
                try {
                    x = resolve(this.value);
                    resolveX(next, x);
                } catch(e) {
                    next.reject(e);
                }
            }
            return next;
        }

        if('rejected' === status) {
            if(!isFn(reject)) {
                next.reject(reject);
            } else {
                try {
                    x = reject(this.reason);
                    resolveX(next, x);
                } catch(e) {
                    next.reject(e);
                }
            }
            return next;
        }
    };

    PromiseA.prototype.resolve = function(value) {
        if('rejected' === this.status) throw Error('Illegal call.');

        this.status = 'resolved';
        this.value = value;

        this._resolves.length && fireQ(this);

        return this;
    };

    PromiseA.prototype.reject = function(reason) {
        if('resolved' === this.status) throw Error('Illegal call.');

        this.status = 'rejected';
        this.reason = reason;

        this._rejects.length && fireQ(this);

        return this;
    };

    // shortcut of promise.then(undefined, reject)
    PromiseA.prototype.catch = function(reject) {
        return this.then(void 0, reject);
    };

    // return a promise with another promise passing in
    PromiseA.cast = function(arg) {
        var p = PromiseA();

        if(arg instanceof PromiseA) return resolvePromise(p, arg);
        else return PromiseA.resolve(arg);
    };

    // return a promise which resolved with arg
    // the arg maybe a thanable object or thanable function or other
    PromiseA.resolve = function(arg) {
        var p = PromiseA();

        if(isThenable(arg)) return resolveThen(p, arg);
        else return p.resolve(arg);
    };

    // accept a promises array,
    // return a promise which will resolsed with all promises's value,
    // if any promise passed rejectd, the returned promise will rejected with the same reason
    PromiseA.all = function(promises) {
        var len = promises.length;
        var promise = PromiseA();
        var r = [];
        var pending = 0;
        var locked;

        each(promises, function(p, i) {
            p.then(function(v) {
                r[i] = v;
                if(++pending === len && !locked) promise.resolve(r);
            }, function(e) {
                locked = true;
                promise.reject(e);
            });
        });

        return promise;
    };

    // accept a promises array,
    // return a promise which will resolsed with the first resolved promise passed,
    // if any promise passed rejectd, the returned promise will rejected with the same reason
    PromiseA.any = function(promises) {
        var promise = PromiseA();
        var called;

        each(promises, function(p, i) {
            p.then(function(v) {
                if(!called) {
                    promise.resolve(v);
                    called = true;
                }
            }, function(e) {
                called = true;
                promise.reject(e);
            });
        });

        return promise;
    };

    // return a promise which reject with reason
    // reason must be an instance of Error object
    PromiseA.reject = function(reason) {
        if(!(reason instanceof Error)) throw Error('reason must be an instance of Error');

        var p = PromiseA();

        p.reject(reason);

        return p;
    };

    function resolveX(promise, x) {
        if(x === promise) promise.reject(new Error('TypeError'));

        if(x instanceof Promise) return resolvePromise(promise, x);
        else if(isThenable(x)) return resolveThen(promise, x);
        else return promise.resolve(x);
    };

    function resolvePromise(promise1, promise2) {
        var status = promise2.status;

        if('pending' === status) return promise2.then(promise1.resolve.bind(promise1), promise1.reject.bind(promise1));
        if('resolved' === status) return promise1.resolve(promise2.value);
        if('rejected' === status) return promise1.reject(promise2.reason);
    };

    function resolveThen(promise, thanable) {
        var called;
        var resolve = once(function(x) {
            if(called) return;
            resolveX(promise, x);
            called = true;
        });
        var reject = once(function(r) {
            if(called) return;
            promise.reject(r);
            called = true;
        });

        try {
            thanable.then.call(thanable, resolve, reject);
        } catch(e) {
            if(!called) throw e;
            else promise.reject(e);
        }

        return promise;
    };

    function fireQ(promise) {
        var status = promise.status;
        var queue = promise['resolved' === status ? '_resolves' : '_rejects'];
        var arg = promise['resolved' === status ? 'value' : 'reason'];
        var fn;
        var x;

        while(fn = queue.shift()) {
            x = fn.call(promise, arg);
            x && resolveX(promise._next, x);
        }

        return promise;
    };

    function noop () {};

    function isFn(fn) {
        return 'function' === type(fn);
    };

    function isObj(o) {
        return 'object' === type(o);
    };

    function type(obj) {
        var o = {};
        return o.toString.call(obj).replace(/\[object (\w+)\]/, '$1').toLowerCase();
    };

    function isThenable(obj) {
        return obj && obj.then && isFn(obj.then);
    };

    function once(fn) {
        var called;
        var r;

        return function() {
            if(called) return r;
            called = true;
            return r = fn.apply(this, arguments);
        };
    };

    // maybe faster then `forEach()`
    function each(arr, iterator) {
        var i = 0;

        for(; arr[i++]; ) iterator(arr[i], i, arr);
    };

    return PromiseA;
}));
