define(function () {
    'use strict';
    function isPromise(value) {
        return value !== undefined && value !== null && typeof value.then === 'function';
    }
    function silencePromise(value) {
        if (isPromise(value)) {
            value.then(null, e => {
            });
        }
    }
    return {
        isPromise: isPromise,
        silencePromise: silencePromise
    };
});