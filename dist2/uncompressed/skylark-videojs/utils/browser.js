define([
    "skylark-langx-globals/window",
    "skylark-langx-globals/document"
], function (window,document) {
    'use strict';

    function isReal() {
        return document === window.document;
    }

    const USER_AGENT = window.navigator && window.navigator.userAgent || '';
    const webkitVersionMap = /AppleWebKit\/([\d.]+)/i.exec(USER_AGENT);
    const appleWebkitVersion = webkitVersionMap ? parseFloat(webkitVersionMap.pop()) : null;
    const IS_IPOD = /iPod/i.test(USER_AGENT);
    const IOS_VERSION = function () {
        const match = USER_AGENT.match(/OS (\d+)_/i);
        if (match && match[1]) {
            return match[1];
        }
        return null;
    }();
    const IS_ANDROID = /Android/i.test(USER_AGENT);
    const ANDROID_VERSION = function () {
        const match = USER_AGENT.match(/Android (\d+)(?:\.(\d+))?(?:\.(\d+))*/i);
        if (!match) {
            return null;
        }
        const major = match[1] && parseFloat(match[1]);
        const minor = match[2] && parseFloat(match[2]);
        if (major && minor) {
            return parseFloat(match[1] + '.' + match[2]);
        } else if (major) {
            return major;
        }
        return null;
    }();
    const IS_NATIVE_ANDROID = IS_ANDROID && ANDROID_VERSION < 5 && appleWebkitVersion < 537;
    const IS_FIREFOX = /Firefox/i.test(USER_AGENT);
    const IS_EDGE = /Edg/i.test(USER_AGENT);
    const IS_CHROME = !IS_EDGE && (/Chrome/i.test(USER_AGENT) || /CriOS/i.test(USER_AGENT));
    const CHROME_VERSION = function () {
        const match = USER_AGENT.match(/(Chrome|CriOS)\/(\d+)/);
        if (match && match[2]) {
            return parseFloat(match[2]);
        }
        return null;
    }();
    const IE_VERSION = function () {
        const result = /MSIE\s(\d+)\.\d/.exec(USER_AGENT);
        let version = result && parseFloat(result[1]);
        if (!version && /Trident\/7.0/i.test(USER_AGENT) && /rv:11.0/.test(USER_AGENT)) {
            version = 11;
        }
        return version;
    }();
    const IS_SAFARI = /Safari/i.test(USER_AGENT) && !IS_CHROME && !IS_ANDROID && !IS_EDGE;
    const IS_WINDOWS = /Windows/i.test(USER_AGENT);
    const TOUCH_ENABLED = Boolean(isReal() && ('ontouchstart' in window || window.navigator.maxTouchPoints || window.DocumentTouch && window.document instanceof window.DocumentTouch));
    const IS_IPAD = /iPad/i.test(USER_AGENT) || IS_SAFARI && TOUCH_ENABLED && !/iPhone/i.test(USER_AGENT);
    const IS_IPHONE = /iPhone/i.test(USER_AGENT) && !IS_IPAD;
    const IS_IOS = IS_IPHONE || IS_IPAD || IS_IPOD;
    const IS_ANY_SAFARI = (IS_SAFARI || IS_IOS) && !IS_CHROME;
    return {
        IS_IPOD: IS_IPOD,
        IOS_VERSION: IOS_VERSION,
        IS_ANDROID: IS_ANDROID,
        ANDROID_VERSION: ANDROID_VERSION,
        IS_NATIVE_ANDROID: IS_NATIVE_ANDROID,
        IS_FIREFOX: IS_FIREFOX,
        IS_EDGE: IS_EDGE,
        IS_CHROME: IS_CHROME,
        CHROME_VERSION: CHROME_VERSION,
        IE_VERSION: IE_VERSION,
        IS_SAFARI: IS_SAFARI,
        IS_WINDOWS: IS_WINDOWS,
        TOUCH_ENABLED: TOUCH_ENABLED,
        IS_IPAD: IS_IPAD,
        IS_IPHONE: IS_IPHONE,
        IS_IOS: IS_IOS,
        IS_ANY_SAFARI: IS_ANY_SAFARI,

        isReal
    };
});