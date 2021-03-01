define(function () {
    'use strict';
    const _initialGuid = 3;
    let _guid = _initialGuid;
    function newGUID() {
        return _guid++;
    }
    function resetGuidInTestsOnly() {
        _guid = _initialGuid;
    }
    return {
        newGUID: newGUID,
        resetGuidInTestsOnly: resetGuidInTestsOnly
    };
});