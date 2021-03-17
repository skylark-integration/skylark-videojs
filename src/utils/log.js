define(['skylark-langx-logging'], function (logging) {
    'use strict';
    /*
    const log = new('VIDEOJS');
    log.createLogger = createLogger;
    return log;
    */
    return new logging.Logger('VIDEOJS');
});