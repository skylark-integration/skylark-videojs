define([
    './guid'
], function (GUID) {
    'use strict';
    const UPDATE_REFRESH_INTERVAL = 30;
    const bind = function (context, fn, uid) {
        if (!fn.guid) {
            fn.guid = GUID.newGUID();
        }
        const bound = fn.bind(context);
        bound.guid = uid ? uid + '_' + fn.guid : fn.guid;
        return bound;
    };
    const throttle = function (fn, wait) {
        let last = window.performance.now();
        const throttled = function (...args) {
            const now = window.performance.now();
            if (now - last >= wait) {
                fn(...args);
                last = now;
            }
        };
        return throttled;
    };
    const debounce = function (func, wait, immediate, context = window) {
        let timeout;
        const cancel = () => {
            context.clearTimeout(timeout);
            timeout = null;
        };
        const debounced = function () {
            const self = this;
            const args = arguments;
            let later = function () {
                timeout = null;
                later = null;
                if (!immediate) {
                    func.apply(self, args);
                }
            };
            if (!timeout && immediate) {
                func.apply(self, args);
            }
            context.clearTimeout(timeout);
            timeout = context.setTimeout(later, wait);
        };
        debounced.cancel = cancel;
        return debounced;
    };
    return {
        UPDATE_REFRESH_INTERVAL: UPDATE_REFRESH_INTERVAL,
        bind: bind,
        throttle: throttle,
        debounce: debounce
    };
});