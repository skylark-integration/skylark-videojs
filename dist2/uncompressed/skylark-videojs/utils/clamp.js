define(function () {
    'use strict';
    const clamp = function (number, min, max) {
        number = Number(number);
        return Math.min(max, Math.max(min, isNaN(number) ? min : number));
    };
    return clamp;
});