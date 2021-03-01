define(function () {
    'use strict';
    const toString = Object.prototype.toString;
    const keys = function (object) {
        return isObject(object) ? Object.keys(object) : [];
    };
    function each(object, fn) {
        keys(object).forEach(key => fn(object[key], key));
    }
    function reduce(object, fn, initial = 0) {
        return keys(object).reduce((accum, key) => fn(accum, object[key], key), initial);
    }
    function assign(target, ...sources) {
        if (Object.assign) {
            return Object.assign(target, ...sources);
        }
        sources.forEach(source => {
            if (!source) {
                return;
            }
            each(source, (value, key) => {
                target[key] = value;
            });
        });
        return target;
    }
    function isObject(value) {
        return !!value && typeof value === 'object';
    }
    function isPlain(value) {
        return isObject(value) && toString.call(value) === '[object Object]' && value.constructor === Object;
    }
    return {
        each: each,
        reduce: reduce,
        assign: assign,
        isObject: isObject,
        isPlain: isPlain
    };
});