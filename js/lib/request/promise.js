/**
 * 
 * @authors yutent (yutent@doui.cc)
 * @date    2016-11-26 16:35:45
 *
 */

'use strict';

define(function() {
    var _Promise = function(callback) {
        this.callback = [];
        var _this = this;

        if (typeof this !== 'object')
            throw new TypeError('Promises must be constructed via new');

        if (typeof callback !== 'function')
            throw new TypeError('Argument must be a function');

        callback(
            function(val) {
                _resolve(_this, val);
            },
            function(val) {
                _reject(_this, val);
            }
        );
    };
    var self = {
        _state: 1,
        _fired: 1,
        _val: 1,
        callback: 1
    };

    _Promise.prototype = {
        constructor: _Promise,
        _state: 'pending',
        _fired: false,
        _fire: function(yes, no) {
            if (this._state === 'rejected') {
                if (typeof no === 'function') no(this._val);
                else throw this._val;
            } else {
                if (typeof yes === 'function') yes(this._val);
            }
        },
        _then: function(yes, no) {
            if (this._fired) {
                var _this = this;
                fireCallback(_this, function() {
                    _this._fire(yes, no);
                });
            } else {
                this.callback.push({ yes: yes, no: no });
            }
        },
        then: function(yes, no) {
            yes = typeof yes === 'function' ? yes : _yes;
            no = typeof no === 'function' ? no : _no;
            var _this = this;
            var next = new _Promise(function(resolve, reject) {
                _this._then(
                    function(val) {
                        try {
                            val = yes(val);
                        } catch (err) {
                            return reject(err);
                        }
                    },
                    function(val) {
                        try {
                            val = no(val);
                        } catch (err) {
                            return reject(err);
                        }
                        resolve(val);
                    }
                );
            });
            for (var i in _this) {
                if (!self[i]) next[i] = _this[i];
            }
            return next;
        },
        done: done,
        catch: fail,
        fail: fail
    };

    _Promise.all = function(arr) {
        return _some(false, arr);
    };

    _Promise.race = function(arr) {
        return _some(true, arr);
    };

    _Promise.defer = defer;

    // -----------------------------------------------------------

    function _yes(val) {
        return val;
    }

    function _no(err) {
        throw err;
    }

    function done(callback) {
        return this.then(callback, _no);
    }

    function fail(callback) {
        return this.then(_yes, callback);
    }

    function defer() {
        var obj = {};
        obj.promise = new this(function(yes, no) {
            obj.resolve = yes;
            obj.reject = no;
        });
        return obj;
    }

    //成功的回调
    function _resolve(obj, val) {
        if (obj._state !== 'pending') return;

        if (val && typeof val.then === 'function') {
            var method = val instanceof _Promise ? '_then' : 'then';
            val[method](
                function(v) {
                    _transmit(obj, v, true);
                },
                function(v) {
                    _transmit(obj, v, false);
                }
            );
        } else {
            _transmit(obj, val, true);
        }
    }

    //失败的回调
    function _reject(obj, val) {
        if (obj._state !== 'pending') return;

        _transmit(obj, val, false);
    }

    // 改变Promise的_fired值，并保持用户传参，触发所有回调
    function _transmit(obj, val, isResolved) {
        obj._fired = true;
        obj._val = val;
        obj._state = isResolved ? 'fulfilled' : 'rejected';

        fireCallback(obj, function() {
            for (var i in obj.callback) {
                obj._fire(obj.callback[i].yes, obj.callback[i].no);
            }
        });
    }

    function fireCallback(obj, callback) {
        var isAsync = false;

        if (typeof obj.async === 'boolean') isAsync = obj.async;
        else isAsync = obj.async = true;

        if (isAsync) setTimeout(callback, 0);
        else callback();
    }

    function _some(bool, iterable) {
        iterable = Array.isArray(iterable) ? iterable : [];

        var n = 0;
        var res = [];
        var end = false;

        return new _Promise(function(yes, no) {
            if (!iterable.length) no(res);

            function loop(obj, idx) {
                obj.then(
                    function(val) {
                        if (!end) {
                            res[idx] = val;
                            n++;
                            if (bool || n >= iterable.length) {
                                yes(bool ? val : res);
                                end = true;
                            }
                        }
                    },
                    function(val) {
                        end = true;
                        no(val);
                    }
                );
            }

            for (var i = 0, len = iterable.length; i < len; i++) {
                loop(iterable[i], i);
            }
        });
    }

    // ---------------------------------------------------------------

    var nativePromise = window.Promise;
    if (/native code/.test(nativePromise)) {
        nativePromise.prototype.done = done;
        nativePromise.prototype.fail = fail;
        if (!nativePromise.defer) nativePromise.defer = defer;
    }

    return (window.Promise = nativePromise || _Promise);
});
