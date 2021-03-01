define([], function () {
    'use strict';
    class SetSham {
        constructor() {
            this.set_ = {};
        }
        has(key) {
            return key in this.set_;
        }
        delete(key) {
            const has = this.has(key);
            delete this.set_[key];
            return has;
        }
        add(key) {
            this.set_[key] = 1;
            return this;
        }
        forEach(callback, thisArg) {
            for (const key in this.set_) {
                callback.call(thisArg, key, key, this);
            }
        }
    }
    return window.Set ? window.Set : SetSham;
});