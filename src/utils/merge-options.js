define([
    "skylark-langx",
    './obj'
], function (langx,obj) {
    'use strict';
    /*
    function mergeOptions(...sources) {
        const result = {};
        sources.forEach(source => {
            if (!source) {
                return;
            }
            obj.each(source, (value, key) => {
                if (!obj.isPlain(value)) {
                    result[key] = value;
                    return;
                }
                if (!obj.isPlain(result[key])) {
                    result[key] = {};
                }
                result[key] = mergeOptions(result[key], value);
            });
        });
        return result;
    }
    return mergeOptions;
    */
    return function(...sources) {
        var result = {};
        langx.mixin(result,...sources,true);
        return result;
    }
});