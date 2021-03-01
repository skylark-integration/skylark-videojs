define([
    'skylark-langx-globals/window'
], function (window) {
    'use strict';
    function computedStyle(el, prop) {
        if (!el || !prop) {
            return '';
        }
        if (typeof window.getComputedStyle === 'function') {
            const computedStyleValue = window.getComputedStyle(el);
            return computedStyleValue ? computedStyleValue.getPropertyValue(prop) || computedStyleValue[prop] : '';
        }
        return '';
    }
    return computedStyle;
});