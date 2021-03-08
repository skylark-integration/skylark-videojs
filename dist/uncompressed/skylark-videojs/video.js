define([
    "skylark-langx-globals/window",
    'skylark-net-http/xhr',
    './setup',
    './utils/stylesheet',
    './component',
    './event-target',
    './utils/events',
    './player',
    './plugin',
    './utils/merge-options',
    './utils/fn',
    './tracks/text-track',
    './tracks/audio-track',
    './tracks/video-track',
    './utils/time-ranges',
    './utils/format-time',
    './utils/log',
    './utils/dom',
    './utils/browser',
    './utils/url',
    './utils/obj',
    './utils/computed-style',
    ///'./extend',
    './tech/tech',
    './tech/middleware',
    './utils/define-lazy-property'
], function (
    window,
    xhr,
    setup, 
    stylesheet, 
    Component, 
    EventTarget, 
    Events, 
    Player, 
    Plugin, 
    mergeOptions, 
    Fn, 
    TextTrack, 
    AudioTrack, 
    VideoTrack, 
    timeRanges, 
    formatTime, 
    log, 
    Dom, 
    browser, 
    Url, 
    obj, 
    computedStyle, 
    ///extend, 
    Tech, 
    middleware, 
    defineLazyProperty
) {
    'use strict';

    var middlewareUse = middleware.use,
        TERMINATOR = middleware.TERMINATOR;


    const normalizeId = id => id.indexOf('#') === 0 ? id.slice(1) : id;
    function videojs(id, options, ready) {
        let player = videojs.getPlayer(id);
        if (player) {
            if (options) {
                log.warn(`Player "${ id }" is already initialised. Options will not be applied.`);
            }
            if (ready) {
                player.ready(ready);
            }
            return player;
        }
        const el = typeof id === 'string' ? Dom.$('#' + normalizeId(id)) : id;
        if (!Dom.isEl(el)) {
            throw new TypeError('The element or ID supplied is not valid. (videojs)');
        }
        if (!el.ownerDocument.defaultView || !el.ownerDocument.body.contains(el)) {
            log.warn('The element supplied is not included in the DOM');
        }
        options = options || {};
        videojs.hooks('beforesetup').forEach(hookFunction => {
            const opts = hookFunction(el, mergeOptions(options));
            if (!obj.isObject(opts) || Array.isArray(opts)) {
                log.error('please return an object in beforesetup hooks');
                return;
            }
            options = mergeOptions(options, opts);
        });
        const PlayerComponent = Component.getComponent('Player');
        player = new PlayerComponent(el, options, ready);
        videojs.hooks('setup').forEach(hookFunction => hookFunction(player));
        return player;
    }
    videojs.hooks_ = {};
    videojs.hooks = function (type, fn) {
        videojs.hooks_[type] = videojs.hooks_[type] || [];
        if (fn) {
            videojs.hooks_[type] = videojs.hooks_[type].concat(fn);
        }
        return videojs.hooks_[type];
    };
    videojs.hook = function (type, fn) {
        videojs.hooks(type, fn);
    };
    videojs.hookOnce = function (type, fn) {
        videojs.hooks(type, [].concat(fn).map(original => {
            const wrapper = (...args) => {
                videojs.removeHook(type, wrapper);
                return original(...args);
            };
            return wrapper;
        }));
    };
    videojs.removeHook = function (type, fn) {
        const index = videojs.hooks(type).indexOf(fn);
        if (index <= -1) {
            return false;
        }
        videojs.hooks_[type] = videojs.hooks_[type].slice();
        videojs.hooks_[type].splice(index, 1);
        return true;
    };
    if (window.VIDEOJS_NO_DYNAMIC_STYLE !== true && Dom.isReal()) {
        let style = Dom.$('.vjs-styles-defaults');
        if (!style) {
            style = stylesheet.createStyleElement('vjs-styles-defaults');
            const head = Dom.$('head');
            if (head) {
                head.insertBefore(style, head.firstChild);
            }
            stylesheet.setTextContent(style, `
      .video-js {
        width: 300px;
        height: 150px;
      }

      .vjs-fluid {
        padding-top: 56.25%
      }
    `);
        }
    }
    setup.autoSetupTimeout(1, videojs);
    videojs.VERSION = "7.11.5";
    videojs.options = Player.prototype.options_;
    videojs.getPlayers = () => Player.players;
    videojs.getPlayer = id => {
        const players = Player.players;
        let tag;
        if (typeof id === 'string') {
            const nId = normalizeId(id);
            const player = players[nId];
            if (player) {
                return player;
            }
            tag = Dom.$('#' + nId);
        } else {
            tag = id;
        }
        if (Dom.isEl(tag)) {
            const {player, playerId} = tag;
            if (player || players[playerId]) {
                return player || players[playerId];
            }
        }
    };
    videojs.getAllPlayers = () => Object.keys(Player.players).map(k => Player.players[k]).filter(Boolean);
    videojs.players = Player.players;
    videojs.getComponent = Component.getComponent;
    videojs.registerComponent = (name, comp) => {
        if (Tech.isTech(comp)) {
            log.warn(`The ${ name } tech was registered as a component. It should instead be registered using videojs.registerTech(name, tech)`);
        }
        Component.registerComponent.call(Component, name, comp);
    };
    videojs.getTech = Tech.getTech;
    videojs.registerTech = Tech.registerTech;
    videojs.use = middlewareUse;
    Object.defineProperty(videojs, 'middleware', {
        value: {},
        writeable: false,
        enumerable: true
    });
    Object.defineProperty(videojs.middleware, 'TERMINATOR', {
        value: TERMINATOR,
        writeable: false,
        enumerable: true
    });
    videojs.browser = browser;
    videojs.TOUCH_ENABLED = browser.TOUCH_ENABLED;
    ///videojs.extend = extend;
    videojs.mergeOptions = mergeOptions;
    videojs.bind = Fn.bind;
    videojs.registerPlugin = Plugin.registerPlugin;
    videojs.deregisterPlugin = Plugin.deregisterPlugin;
    videojs.plugin = (name, plugin) => {
        log.warn('videojs.plugin() is deprecated; use videojs.registerPlugin() instead');
        return Plugin.registerPlugin(name, plugin);
    };
    videojs.getPlugins = Plugin.getPlugins;
    videojs.getPlugin = Plugin.getPlugin;
    videojs.getPluginVersion = Plugin.getPluginVersion;
    videojs.addLanguage = function (code, data) {
        code = ('' + code).toLowerCase();
        videojs.options.languages = mergeOptions(videojs.options.languages, { [code]: data });
        return videojs.options.languages[code];
    };
    videojs.log = log;
    videojs.createLogger = log.createLogger;
    videojs.createTimeRange = videojs.undefined = timeRanges.createTimeRanges;
    videojs.formatTime = formatTime;
    videojs.setFormatTime = formatTime.setFormatTime;
    videojs.resetFormatTime = formatTime.resetFormatTime;
    videojs.parseUrl = Url.parseUrl;
    videojs.isCrossOrigin = Url.isCrossOrigin;
    videojs.EventTarget = EventTarget;
    videojs.on = Events.on;
    videojs.one = Events.one;
    videojs.off = Events.off;
    videojs.trigger = Events.trigger;
    videojs.xhr = xhr;
    videojs.TextTrack = TextTrack;
    videojs.AudioTrack = AudioTrack;
    videojs.VideoTrack = VideoTrack;
    [
        'isEl',
        'isTextNode',
        'createEl',
        'hasClass',
        'addClass',
        'removeClass',
        'toggleClass',
        'setAttributes',
        'getAttributes',
        'emptyEl',
        'appendContent',
        'insertContent'
    ].forEach(k => {
        videojs[k] = function () {
            log.warn(`videojs.${ k }() is deprecated; use videojs.dom.${ k }() instead`);
            return Dom[k].apply(null, arguments);
        };
    });
    videojs.computedStyle = computedStyle;
    videojs.dom = Dom;
    videojs.url = Url;
    videojs.defineLazyProperty = defineLazyProperty;
    return videojs;
});