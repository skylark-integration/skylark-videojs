define(['./time-ranges'], function (timeRages) {
    'use strict';
    function bufferedPercent(buffered, duration) {
        let bufferedDuration = 0;
        let start;
        let end;
        if (!duration) {
            return 0;
        }
        if (!buffered || !buffered.length) {
            buffered = timeRages.createTimeRange(0, 0);
        }
        for (let i = 0; i < buffered.length; i++) {
            start = buffered.start(i);
            end = buffered.end(i);
            if (end > duration) {
                end = duration;
            }
            bufferedDuration += end - start;
        }
        return bufferedDuration / duration;
    }
    return { bufferedPercent: bufferedPercent };
});