// see => http://promises-aplus.github.io/promises-spec/
// see => https://github.com/cujojs/when/blob/master/lib/makePromise.js

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

    function Promise(resolver) {
        if(!(this instanceof Promise)) return new Promise(resolver);

        this.status = 'pending';
        this.value;
        this.reason;

        this._resolves = [];
        this._rejects = [];

        if(isFn(resolver)) resolver(this.resolve.bind(this), this.reject.bind(this));

        return this;
    };

    Promise.prototype.then = function(resolve, reject) {
        var next = this._next || (this._next = Promise());
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
                    Promise.resolver(next, x);
                } catch(e) {
                    this.reject(e);
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
                    Promise.resolver(next, x);
                } catch(e) {
                    this.reject(e);
                }
            }
            return next;
        }
    };

    Promise.prototype.resolve = function(value) {
        if('rejected' === this.status) throw Error('Illegal call.');

        this.status = 'resolved';
        this.value = value;

        this._resolves.length && this._fireQ();

        return this;
    };

    Promise.prototype.reject = function(reason) {
        if('resolved' === this.status) throw Error('Illegal call.');

        this.status = 'rejected';
        this.reason = reason;

        this._rejects.length && this._fireQ();

        return this;
    };

    Promise.prototype._fireQ = function() {
        var status = this.status;
        var queue = this['resolved' === status ? '_resolves' : '_rejects'];
        var arg = this['resolved' === status ? 'value' : 'reason'];
        var fn;
        var x;

        while(fn = queue.shift()) {
            x = fn.call(this, arg);
            Promise.resolver(this._next, x);
        }
    };

    Promise.resolver = function(promise, x) {
        if(x === promise) {
            promise.reject(new Error('TypeError'));
            return;
        }

        if(x instanceof Promise) {
            var status = x.status;

            if('pending' === status) {
                x.then(promise.resolve.bind(promise), promise.reject.bind(promise));
            }
            if('resolved' === status) promise.resolve(x.value);
            if('rejected' === status) promise.reject(x.reason);
        } else if(isObj(x) || isFn(x)) {
            var then = x.then;

            if(isFn(then)) {
                var called;
                var resolve = once(function(y) {
                    if(called) return;
                    Promise.resolver(promise, y);
                    called = true;
                });
                var reject = once(function(r) {
                    if(called) return;
                    promise.reject(r);
                    called = true;
                });

                try {
                    then.call(x, resolve, reject);
                } catch(e) {
                    if(!called) return;
                    else promise.reject(e);
                }
            } else {
                promise.resolve(x);
            }
        } else {
            promise.resolve(x);
        }
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
            r = fn.apply(this, arguments);
            called = true;
        };
    };

    return Promise;
}));
