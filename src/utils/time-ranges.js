define(function () {
    'use strict';
    function rangeCheck(fnName, index, maxIndex) {
        if (typeof index !== 'number' || index < 0 || index > maxIndex) {
            throw new Error(`Failed to execute '${ fnName }' on 'TimeRanges': The index provided (${ index }) is non-numeric or out of bounds (0-${ maxIndex }).`);
        }
    }
    function getRange(fnName, valueIndex, ranges, rangeIndex) {
        rangeCheck(fnName, rangeIndex, ranges.length - 1);
        return ranges[rangeIndex][valueIndex];
    }
    function createTimeRangesObj(ranges) {
        if (ranges === undefined || ranges.length === 0) {
            return {
                length: 0,
                start() {
                    throw new Error('This TimeRanges object is empty');
                },
                end() {
                    throw new Error('This TimeRanges object is empty');
                }
            };
        }
        return {
            length: ranges.length,
            start: getRange.bind(null, 'start', 0, ranges),
            end: getRange.bind(null, 'end', 1, ranges)
        };
    }
    function createTimeRanges(start, end) {
        if (Array.isArray(start)) {
            return createTimeRangesObj(start);
        } else if (start === undefined || end === undefined) {
            return createTimeRangesObj();
        }
        return createTimeRangesObj([[
                start,
                end
            ]]);
    }
    return {
        createTimeRanges: createTimeRanges,
        createTimeRanges
    };
});