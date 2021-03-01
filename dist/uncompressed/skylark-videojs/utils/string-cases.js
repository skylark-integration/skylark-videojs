define(function () {
    'use strict';
    const toLowerCase = function (string) {
        if (typeof string !== 'string') {
            return string;
        }
        return string.replace(/./, w => w.toLowerCase());
    };
    const toTitleCase = function (string) {
        if (typeof string !== 'string') {
            return string;
        }
        return string.replace(/./, w => w.toUpperCase());
    };
    const titleCaseEquals = function (str1, str2) {
        return toTitleCase(str1) === toTitleCase(str2);
    };
    return {
        toLowerCase: toLowerCase,
        toTitleCase: toTitleCase,
        titleCaseEquals: titleCaseEquals
    };
});