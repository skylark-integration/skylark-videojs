define([], function () {
    'use strict';
    let history = [];
    const LogByTypeFactory = (name, log) => (type, level, args) => {
        const lvl = log.levels[level];
        const lvlRegExp = new RegExp(`^(${ lvl })$`);
        if (type !== 'log') {
            args.unshift(type.toUpperCase() + ':');
        }
        args.unshift(name + ':');
        if (history) {
            history.push([].concat(args));
            const splice = history.length - 1000;
            history.splice(0, splice > 0 ? splice : 0);
        }
        if (!window.console) {
            return;
        }
        let fn = window.console[type];
        if (!fn && type === 'debug') {
            fn = window.console.info || window.console.log;
        }
        if (!fn || !lvl || !lvlRegExp.test(type)) {
            return;
        }
        fn[Array.isArray(args) ? 'apply' : 'call'](window.console, args);
    };
    return function createLogger(name) {
        let level = 'info';
        let logByType;
        const log = function (...args) {
            logByType('log', level, args);
        };
        logByType = LogByTypeFactory(name, log);
        log.createLogger = subname => createLogger(name + ': ' + subname);
        log.levels = {
            all: 'debug|log|warn|error',
            off: '',
            debug: 'debug|log|warn|error',
            info: 'log|warn|error',
            warn: 'warn|error',
            error: 'error',
            DEFAULT: level
        };
        log.level = lvl => {
            if (typeof lvl === 'string') {
                if (!log.levels.hasOwnProperty(lvl)) {
                    throw new Error(`"${ lvl }" in not a valid log level`);
                }
                level = lvl;
            }
            return level;
        };
        log.history = () => history ? [].concat(history) : [];
        log.history.filter = fname => {
            return (history || []).filter(historyItem => {
                return new RegExp(`.*${ fname }.*`).test(historyItem[0]);
            });
        };
        log.history.clear = () => {
            if (history) {
                history.length = 0;
            }
        };
        log.history.disable = () => {
            if (history !== null) {
                history.length = 0;
                history = null;
            }
        };
        log.history.enable = () => {
            if (history === null) {
                history = [];
            }
        };
        log.error = (...args) => logByType('error', level, args);
        log.warn = (...args) => logByType('warn', level, args);
        log.debug = (...args) => logByType('debug', level, args);
        return log;
    };
});