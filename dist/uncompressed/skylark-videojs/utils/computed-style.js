define([
    'skylark-langx-globals/window',
    'skylark-domx-styler'
], function (window,styler) {
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
    ///return computedStyle;
    return styler.css;

});