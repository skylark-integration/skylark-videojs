define(['./create-logger'], function (createLogger) {
    'use strict';
    const log = createLogger('VIDEOJS');
    log.createLogger = createLogger;
    return log;
});