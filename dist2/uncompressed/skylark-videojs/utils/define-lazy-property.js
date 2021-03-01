define(function () {
    'use strict';
    const defineLazyProperty = function (obj, key, getValue, setter = true) {
        const set = value => Object.defineProperty(obj, key, {
            value,
            enumerable: true,
            writable: true
        });
        const options = {
            configurable: true,
            enumerable: true,
            get() {
                const value = getValue();
                set(value);
                return value;
            }
        };
        if (setter) {
            options.set = set;
        }
        return Object.defineProperty(obj, key, options);
    };
    return defineLazyProperty;
});