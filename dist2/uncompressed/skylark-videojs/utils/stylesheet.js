define([
    'skylark-langx-globals/document'
], function (document) {
    'use strict';
    const createStyleElement = function (className) {
        const style = document.createElement('style');
        style.className = className;
        return style;
    };
    const setTextContent = function (el, content) {
        if (el.styleSheet) {
            el.styleSheet.cssText = content;
        } else {
            el.textContent = content;
        }
    };
    return {
        createStyleElement: createStyleElement,
        setTextContent: setTextContent
    };
});