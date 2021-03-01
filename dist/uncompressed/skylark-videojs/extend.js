define([
    './utils/inherits'
], function (_inherits) {
    'use strict';
    const extend = function (superClass, subClassMethods = {}) {
        let subClass = function () {
            superClass.apply(this, arguments);
        };
        let methods = {};
        if (typeof subClassMethods === 'object') {
            if (subClassMethods.constructor !== Object.prototype.constructor) {
                subClass = subClassMethods.constructor;
            }
            methods = subClassMethods;
        } else if (typeof subClassMethods === 'function') {
            subClass = subClassMethods;
        }
        _inherits(subClass, superClass);
        if (superClass) {
            subClass.super_ = superClass;
        }
        for (const name in methods) {
            if (methods.hasOwnProperty(name)) {
                subClass.prototype[name] = methods[name];
            }
        }
        return subClass;
    };
    return extend;
});