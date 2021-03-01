define([
    '../utils/obj',
    '../utils/string-cases'
], function (obj, stringCases) {
    'use strict';
    const middlewares = {};
    const middlewareInstances = {};
    const TERMINATOR = {};
    function use(type, middleware) {
        middlewares[type] = middlewares[type] || [];
        middlewares[type].push(middleware);
    }
    function getMiddleware(type) {
        if (type) {
            return middlewares[type];
        }
        return middlewares;
    }
    function setSource(player, src, next) {
        player.setTimeout(() => setSourceHelper(src, middlewares[src.type], next, player), 1);
    }
    function setTech(middleware, tech) {
        middleware.forEach(mw => mw.setTech && mw.setTech(tech));
    }
    function get(middleware, tech, method) {
        return middleware.reduceRight(middlewareIterator(method), tech[method]());
    }
    function set(middleware, tech, method, arg) {
        return tech[method](middleware.reduce(middlewareIterator(method), arg));
    }
    function mediate(middleware, tech, method, arg = null) {
        const callMethod = 'call' + stringCases.toTitleCase(method);
        const middlewareValue = middleware.reduce(middlewareIterator(callMethod), arg);
        const terminated = middlewareValue === TERMINATOR;
        const returnValue = terminated ? null : tech[method](middlewareValue);
        executeRight(middleware, method, returnValue, terminated);
        return returnValue;
    }
    const allowedGetters = {
        buffered: 1,
        currentTime: 1,
        duration: 1,
        muted: 1,
        played: 1,
        paused: 1,
        seekable: 1,
        volume: 1
    };
    const allowedSetters = {
        setCurrentTime: 1,
        setMuted: 1,
        setVolume: 1
    };
    const allowedMediators = {
        play: 1,
        pause: 1
    };
    function middlewareIterator(method) {
        return (value, mw) => {
            if (value === TERMINATOR) {
                return TERMINATOR;
            }
            if (mw[method]) {
                return mw[method](value);
            }
            return value;
        };
    }
    function executeRight(mws, method, value, terminated) {
        for (let i = mws.length - 1; i >= 0; i--) {
            const mw = mws[i];
            if (mw[method]) {
                mw[method](terminated, value);
            }
        }
    }
    function clearCacheForPlayer(player) {
        middlewareInstances[player.id()] = null;
    }
    function getOrCreateFactory(player, mwFactory) {
        const mws = middlewareInstances[player.id()];
        let mw = null;
        if (mws === undefined || mws === null) {
            mw = mwFactory(player);
            middlewareInstances[player.id()] = [[
                    mwFactory,
                    mw
                ]];
            return mw;
        }
        for (let i = 0; i < mws.length; i++) {
            const [mwf, mwi] = mws[i];
            if (mwf !== mwFactory) {
                continue;
            }
            mw = mwi;
        }
        if (mw === null) {
            mw = mwFactory(player);
            mws.push([
                mwFactory,
                mw
            ]);
        }
        return mw;
    }
    function setSourceHelper(src = {}, middleware = [], next, player, acc = [], lastRun = false) {
        const [mwFactory, ...mwrest] = middleware;
        if (typeof mwFactory === 'string') {
            setSourceHelper(src, middlewares[mwFactory], next, player, acc, lastRun);
        } else if (mwFactory) {
            const mw = getOrCreateFactory(player, mwFactory);
            if (!mw.setSource) {
                acc.push(mw);
                return setSourceHelper(src, mwrest, next, player, acc, lastRun);
            }
            mw.setSource(obj.assign({}, src), function (err, _src) {
                if (err) {
                    return setSourceHelper(src, mwrest, next, player, acc, lastRun);
                }
                acc.push(mw);
                setSourceHelper(_src, src.type === _src.type ? mwrest : middlewares[_src.type], next, player, acc, lastRun);
            });
        } else if (mwrest.length) {
            setSourceHelper(src, mwrest, next, player, acc, lastRun);
        } else if (lastRun) {
            next(src, acc);
        } else {
            setSourceHelper(src, middlewares['*'], next, player, acc, true);
        }
    }
    return {
        TERMINATOR: TERMINATOR,
        use: use,
        getMiddleware: getMiddleware,
        setSource: setSource,
        setTech: setTech,
        get: get,
        set: set,
        mediate: mediate,
        allowedGetters: allowedGetters,
        allowedSetters: allowedSetters,
        allowedMediators: allowedMediators,
        clearCacheForPlayer: clearCacheForPlayer
    };
});