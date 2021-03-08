define([
    "skylark-langx",
    'skylark-langx-globals/document',
    './tech',
    '../utils/dom',
    '../utils/url',
    '../utils/log',
    '../utils/browser',
    '../utils/obj',
    '../utils/merge-options',
    '../utils/string-cases',
    '../tracks/track-types',
    './setup-sourceset',
    '../utils/define-lazy-property',
    '../utils/promise'
], function (
    langx,
    document,
    Tech, 
    Dom, 
    Url, 
    log, 
    browser,  
    obj, 
    mergeOptions, 
    stringCases, 
    TRACK_TYPES, 
    setupSourceset, 
    defineLazyProperty, 
    promise
) {
    'use strict';
    const NORMAL = TRACK_TYPES.NORMAL,
          REMOTE = TRACK_TYPES.REMOTE;

    const NativeEvents = {
            'abort' : 3,
            'canplay' : 3,
            'canplaythrough' : 3,
            'disablepictureinpicturechanged':3,
            'durationchange':3,
            'emptied' : 3,
            'ended':3,
            'enterpictureinpicture':3,
            'error' : 3,
            'leavepictureinpicture':3,
            'loadeddata' : 3,
            'loadstart' : 3,
            'loadedmetadata':3,
            'pause' : 3,
            'play':3,
            'playing' : 3,
            'posterchange':3,
            'progress' : 3,
            'ratechange':3,
            'seeking' : 3,
            'seeked' : 3,
            'sourceset':3,
            'stalled' : 3,
            'suspend':3,
            'textdata':3,
            'texttrackchange':3,
            'timeupdate':3,
            'volumechange':3,
            'waiting' : 3,

    };
    class Html5 extends Tech {

        isNativeEvent(events) {
            var ret  = super.isNativeEvent(events);
            if (ret) {
                return true;
            }
            if (langx.isString(events)) {
                return !!NativeEvents[events];
            } else if (langx.isArray(events)) {
                for (var i=0; i<events.length; i++) {
                    if (NativeEvents[events[i]]) {
                        return true;
                    }
                }
                return false;
            }            

        } 

        constructor(options, ready) {
            super(options, ready);
            const source = options.source;
            let crossoriginTracks = false;
            if (source && (this.el_.currentSrc !== source.src || options.tag && options.tag.initNetworkState_ === 3)) {
                this.setSource(source);
            } else {
                this.handleLateInit_(this.el_);
            }
            if (options.enableSourceset) {
                this.setupSourcesetHandling_();
            }
            this.isScrubbing_ = false;
            if (this.el_.hasChildNodes()) {
                const nodes = this.el_.childNodes;
                let nodesLength = nodes.length;
                const removeNodes = [];
                while (nodesLength--) {
                    const node = nodes[nodesLength];
                    const nodeName = node.nodeName.toLowerCase();
                    if (nodeName === 'track') {
                        if (!this.featuresNativeTextTracks) {
                            removeNodes.push(node);
                        } else {
                            this.remoteTextTrackEls().addTrackElement_(node);
                            this.remoteTextTracks().addTrack(node.track);
                            this.textTracks().addTrack(node.track);
                            if (!crossoriginTracks && !this.el_.hasAttribute('crossorigin') && Url.isCrossOrigin(node.src)) {
                                crossoriginTracks = true;
                            }
                        }
                    }
                }
                for (let i = 0; i < removeNodes.length; i++) {
                    this.el_.removeChild(removeNodes[i]);
                }
            }
            this.proxyNativeTracks_();
            if (this.featuresNativeTextTracks && crossoriginTracks) {
                log.warn("Text Tracks are being loaded from another origin but the crossorigin attribute isn't used.\n" + 'This may prevent text tracks from loading.');
            }
            this.restoreMetadataTracksInIOSNativePlayer_();
            if ((browser.TOUCH_ENABLED || browser.IS_IPHONE || browser.IS_NATIVE_ANDROID) && options.nativeControlsForTouch === true) {
                this.setControls(true);
            }
            this.proxyWebkitFullscreen_();
            this.triggerReady();
        }
        dispose() {
            if (this.el_ && this.el_.resetSourceset_) {
                this.el_.resetSourceset_();
            }
            Html5.disposeMediaElement(this.el_);
            this.options_ = null;
            super.dispose();
        }
        setupSourcesetHandling_() {
            setupSourceset(this);
        }
        restoreMetadataTracksInIOSNativePlayer_() {
            const textTracks = this.textTracks();
            let metadataTracksPreFullscreenState;
            const takeMetadataTrackSnapshot = () => {
                metadataTracksPreFullscreenState = [];
                for (let i = 0; i < textTracks.length; i++) {
                    const track = textTracks[i];
                    if (track.kind === 'metadata') {
                        metadataTracksPreFullscreenState.push({
                            track,
                            storedMode: track.mode
                        });
                    }
                }
            };
            takeMetadataTrackSnapshot();
            textTracks.addEventListener('change', takeMetadataTrackSnapshot);
            this.listenTo('dispose', () => textTracks.removeEventListener('change', takeMetadataTrackSnapshot));
            const restoreTrackMode = () => {
                for (let i = 0; i < metadataTracksPreFullscreenState.length; i++) {
                    const storedTrack = metadataTracksPreFullscreenState[i];
                    if (storedTrack.track.mode === 'disabled' && storedTrack.track.mode !== storedTrack.storedMode) {
                        storedTrack.track.mode = storedTrack.storedMode;
                    }
                }
                textTracks.removeEventListener('change', restoreTrackMode);
            };
            this.listenTo('webkitbeginfullscreen', () => {
                textTracks.removeEventListener('change', takeMetadataTrackSnapshot);
                textTracks.removeEventListener('change', restoreTrackMode);
                textTracks.addEventListener('change', restoreTrackMode);
            });
            this.listenTo('webkitendfullscreen', () => {
                textTracks.removeEventListener('change', takeMetadataTrackSnapshot);
                textTracks.addEventListener('change', takeMetadataTrackSnapshot);
                textTracks.removeEventListener('change', restoreTrackMode);
            });
        }
        overrideNative_(type, override) {
            if (override !== this[`featuresNative${ type }Tracks`]) {
                return;
            }
            const lowerCaseType = type.toLowerCase();
            if (this[`${ lowerCaseType }TracksListeners_`]) {
                Object.keys(this[`${ lowerCaseType }TracksListeners_`]).forEach(eventName => {
                    const elTracks = this.el()[`${ lowerCaseType }Tracks`];
                    elTracks.removeEventListener(eventName, this[`${ lowerCaseType }TracksListeners_`][eventName]);
                });
            }
            this[`featuresNative${ type }Tracks`] = !override;
            this[`${ lowerCaseType }TracksListeners_`] = null;
            this.proxyNativeTracksForType_(lowerCaseType);
        }
        overrideNativeAudioTracks(override) {
            this.overrideNative_('Audio', override);
        }
        overrideNativeVideoTracks(override) {
            this.overrideNative_('Video', override);
        }
        proxyNativeTracksForType_(name) {
            const props = NORMAL[name];
            const elTracks = this.el()[props.getterName];
            const techTracks = this[props.getterName]();
            if (!this[`featuresNative${ props.capitalName }Tracks`] || !elTracks || !elTracks.addEventListener) {
                return;
            }
            const listeners = {
                change: e => {
                    const event = {
                        type: 'change',
                        target: techTracks,
                        currentTarget: techTracks,
                        srcElement: techTracks
                    };
                    techTracks.trigger(event);
                    if (name === 'text') {
                        this[REMOTE.remoteText.getterName]().trigger(event);
                    }
                },
                addtrack(e) {
                    techTracks.addTrack(e.track);
                },
                removetrack(e) {
                    techTracks.removeTrack(e.track);
                }
            };
            const removeOldTracks = function () {
                const removeTracks = [];
                for (let i = 0; i < techTracks.length; i++) {
                    let found = false;
                    for (let j = 0; j < elTracks.length; j++) {
                        if (elTracks[j] === techTracks[i]) {
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        removeTracks.push(techTracks[i]);
                    }
                }
                while (removeTracks.length) {
                    techTracks.removeTrack(removeTracks.shift());
                }
            };
            this[props.getterName + 'Listeners_'] = listeners;
            Object.keys(listeners).forEach(eventName => {
                const listener = listeners[eventName];
                elTracks.addEventListener(eventName, listener);
                this.listenTo('dispose', e => elTracks.removeEventListener(eventName, listener));
            });
            this.listenTo('loadstart', removeOldTracks);
            this.listenTo('dispose', e => this.unlistenTo('loadstart', removeOldTracks));
        }
        proxyNativeTracks_() {
            NORMAL.names.forEach(name => {
                this.proxyNativeTracksForType_(name);
            });
        }
        createEl() {
            let el = this.options_.tag;
            if (!el || !(this.options_.playerElIngest || this.movingMediaElementInDOM)) {
                if (el) {
                    const clone = el.cloneNode(true);
                    if (el.parentNode) {
                        el.parentNode.insertBefore(clone, el);
                    }
                    Html5.disposeMediaElement(el);
                    el = clone;
                } else {
                    el = document.createElement('video');
                    const tagAttributes = this.options_.tag && Dom.getAttributes(this.options_.tag);
                    const attributes = mergeOptions({}, tagAttributes);
                    if (!browser.TOUCH_ENABLED || this.options_.nativeControlsForTouch !== true) {
                        delete attributes.controls;
                    }
                    Dom.setAttributes(el, obj.assign(attributes, {
                        id: this.options_.techId,
                        class: 'vjs-tech'
                    }));
                }
                el.playerId = this.options_.playerId;
            }
            if (typeof this.options_.preload !== 'undefined') {
                Dom.setAttribute(el, 'preload', this.options_.preload);
            }
            if (this.options_.disablePictureInPicture !== undefined) {
                el.disablePictureInPicture = this.options_.disablePictureInPicture;
            }
            const settingsAttrs = [
                'loop',
                'muted',
                'playsinline',
                'autoplay'
            ];
            for (let i = 0; i < settingsAttrs.length; i++) {
                const attr = settingsAttrs[i];
                const value = this.options_[attr];
                if (typeof value !== 'undefined') {
                    if (value) {
                        Dom.setAttribute(el, attr, attr);
                    } else {
                        Dom.removeAttribute(el, attr);
                    }
                    el[attr] = value;
                }
            }
            return el;
        }
        handleLateInit_(el) {
            if (el.networkState === 0 || el.networkState === 3) {
                return;
            }
            if (el.readyState === 0) {
                let loadstartFired = false;
                const setLoadstartFired = function () {
                    loadstartFired = true;
                };
                this.listenTo('loadstart', setLoadstartFired);
                const triggerLoadstart = function () {
                    if (!loadstartFired) {
                        this.trigger('loadstart');
                    }
                };
                this.listenTo('loadedmetadata', triggerLoadstart);
                this.ready(function () {
                    this.unlistenTo('loadstart', setLoadstartFired);
                    this.unlistenTo('loadedmetadata', triggerLoadstart);
                    if (!loadstartFired) {
                        this.trigger('loadstart');
                    }
                });
                return;
            }
            const eventsToTrigger = ['loadstart'];
            eventsToTrigger.push('loadedmetadata');
            if (el.readyState >= 2) {
                eventsToTrigger.push('loadeddata');
            }
            if (el.readyState >= 3) {
                eventsToTrigger.push('canplay');
            }
            if (el.readyState >= 4) {
                eventsToTrigger.push('canplaythrough');
            }
            this.ready(function () {
                eventsToTrigger.forEach(function (type) {
                    this.trigger(type);
                }, this);
            });
        }
        setScrubbing(isScrubbing) {
            this.isScrubbing_ = isScrubbing;
        }
        scrubbing() {
            return this.isScrubbing_;
        }
        setCurrentTime(seconds) {
            try {
                if (this.isScrubbing_ && this.el_.fastSeek && browser.IS_ANY_SAFARI) {
                    this.el_.fastSeek(seconds);
                } else {
                    this.el_.currentTime = seconds;
                }
            } catch (e) {
                log(e, 'Video is not ready. (Video.js)');
            }
        }
        duration() {
            if (this.el_.duration === Infinity && browser.IS_ANDROID && browser.IS_CHROME && this.el_.currentTime === 0) {
                const checkProgress = () => {
                    if (this.el_.currentTime > 0) {
                        if (this.el_.duration === Infinity) {
                            this.trigger('durationchange');
                        }
                        this.unlistenTo('timeupdate', checkProgress);
                    }
                };
                this.listenTo('timeupdate', checkProgress);
                return NaN;
            }
            return this.el_.duration || NaN;
        }
        width() {
            return this.el_.offsetWidth;
        }
        height() {
            return this.el_.offsetHeight;
        }
        proxyWebkitFullscreen_() {
            if (!('webkitDisplayingFullscreen' in this.el_)) {
                return;
            }
            const endFn = function () {
                this.trigger('fullscreenchange', { isFullscreen: false });
            };
            const beginFn = function () {
                if ('webkitPresentationMode' in this.el_ && this.el_.webkitPresentationMode !== 'picture-in-picture') {
                    this.listenToOnce('webkitendfullscreen', endFn);
                    this.trigger('fullscreenchange', {
                        isFullscreen: true,
                        nativeIOSFullscreen: true
                    });
                }
            };
            this.listenTo('webkitbeginfullscreen', beginFn);
            this.listenTo('dispose', () => {
                this.unlistenTo('webkitbeginfullscreen', beginFn);
                this.unlistenTo('webkitendfullscreen', endFn);
            });
        }
        supportsFullScreen() {
            if (typeof this.el_.webkitEnterFullScreen === 'function') {
                const userAgent = window.navigator && window.navigator.userAgent || '';
                if (/Android/.test(userAgent) || !/Chrome|Mac OS X 10.5/.test(userAgent)) {
                    return true;
                }
            }
            return false;
        }
        enterFullScreen() {
            const video = this.el_;
            if (video.paused && video.networkState <= video.HAVE_METADATA) {
                promise.silencePromise(this.el_.play());
                this.setTimeout(function () {
                    video.pause();
                    try {
                        video.webkitEnterFullScreen();
                    } catch (e) {
                        this.trigger('fullscreenerror', e);
                    }
                }, 0);
            } else {
                try {
                    video.webkitEnterFullScreen();
                } catch (e) {
                    this.trigger('fullscreenerror', e);
                }
            }
        }
        exitFullScreen() {
            if (!this.el_.webkitDisplayingFullscreen) {
                this.trigger('fullscreenerror', new Error('The video is not fullscreen'));
                return;
            }
            this.el_.webkitExitFullScreen();
        }
        requestPictureInPicture() {
            return this.el_.requestPictureInPicture();
        }
        src(src) {
            if (src === undefined) {
                return this.el_.src;
            }
            this.setSrc(src);
        }
        reset() {
            Html5.resetMediaElement(this.el_);
        }
        currentSrc() {
            if (this.currentSource_) {
                return this.currentSource_.src;
            }
            return this.el_.currentSrc;
        }
        setControls(val) {
            this.el_.controls = !!val;
        }
        addTextTrack(kind, label, language) {
            if (!this.featuresNativeTextTracks) {
                return super.addTextTrack(kind, label, language);
            }
            return this.el_.addTextTrack(kind, label, language);
        }
        createRemoteTextTrack(options) {
            if (!this.featuresNativeTextTracks) {
                return super.createRemoteTextTrack(options);
            }
            const htmlTrackElement = document.createElement('track');
            if (options.kind) {
                htmlTrackElement.kind = options.kind;
            }
            if (options.label) {
                htmlTrackElement.label = options.label;
            }
            if (options.language || options.srclang) {
                htmlTrackElement.srclang = options.language || options.srclang;
            }
            if (options.default) {
                htmlTrackElement.default = options.default;
            }
            if (options.id) {
                htmlTrackElement.id = options.id;
            }
            if (options.src) {
                htmlTrackElement.src = options.src;
            }
            return htmlTrackElement;
        }
        addRemoteTextTrack(options, manualCleanup) {
            const htmlTrackElement = super.addRemoteTextTrack(options, manualCleanup);
            if (this.featuresNativeTextTracks) {
                this.el().appendChild(htmlTrackElement);
            }
            return htmlTrackElement;
        }
        removeRemoteTextTrack(track) {
            super.removeRemoteTextTrack(track);
            if (this.featuresNativeTextTracks) {
                const tracks = this.$$('track');
                let i = tracks.length;
                while (i--) {
                    if (track === tracks[i] || track === tracks[i].track) {
                        this.el().removeChild(tracks[i]);
                    }
                }
            }
        }
        getVideoPlaybackQuality() {
            if (typeof this.el().getVideoPlaybackQuality === 'function') {
                return this.el().getVideoPlaybackQuality();
            }
            const videoPlaybackQuality = {};
            if (typeof this.el().webkitDroppedFrameCount !== 'undefined' && typeof this.el().webkitDecodedFrameCount !== 'undefined') {
                videoPlaybackQuality.droppedVideoFrames = this.el().webkitDroppedFrameCount;
                videoPlaybackQuality.totalVideoFrames = this.el().webkitDecodedFrameCount;
            }
            if (window.performance && typeof window.performance.now === 'function') {
                videoPlaybackQuality.creationTime = window.performance.now();
            } else if (window.performance && window.performance.timing && typeof window.performance.timing.navigationStart === 'number') {
                videoPlaybackQuality.creationTime = window.Date.now() - window.performance.timing.navigationStart;
            }
            return videoPlaybackQuality;
        }
    }
    defineLazyProperty(Html5, 'TEST_VID', function () {
        if (!Dom.isReal()) {
            return;
        }
        const video = document.createElement('video');
        const track = document.createElement('track');
        track.kind = 'captions';
        track.srclang = 'en';
        track.label = 'English';
        video.appendChild(track);
        return video;
    });
    Html5.isSupported = function () {
        try {
            Html5.TEST_VID.volume = 0.5;
        } catch (e) {
            return false;
        }
        return !!(Html5.TEST_VID && Html5.TEST_VID.canPlayType);
    };
    Html5.canPlayType = function (type) {
        return Html5.TEST_VID.canPlayType(type);
    };
    Html5.canPlaySource = function (srcObj, options) {
        return Html5.canPlayType(srcObj.type);
    };
    Html5.canControlVolume = function () {
        try {
            const volume = Html5.TEST_VID.volume;
            Html5.TEST_VID.volume = volume / 2 + 0.1;
            return volume !== Html5.TEST_VID.volume;
        } catch (e) {
            return false;
        }
    };
    Html5.canMuteVolume = function () {
        try {
            const muted = Html5.TEST_VID.muted;
            Html5.TEST_VID.muted = !muted;
            if (Html5.TEST_VID.muted) {
                Dom.setAttribute(Html5.TEST_VID, 'muted', 'muted');
            } else {
                Dom.removeAttribute(Html5.TEST_VID, 'muted', 'muted');
            }
            return muted !== Html5.TEST_VID.muted;
        } catch (e) {
            return false;
        }
    };
    Html5.canControlPlaybackRate = function () {
        if (browser.IS_ANDROID && browser.IS_CHROME && browser.CHROME_VERSION < 58) {
            return false;
        }
        try {
            const playbackRate = Html5.TEST_VID.playbackRate;
            Html5.TEST_VID.playbackRate = playbackRate / 2 + 0.1;
            return playbackRate !== Html5.TEST_VID.playbackRate;
        } catch (e) {
            return false;
        }
    };
    Html5.canOverrideAttributes = function () {
        try {
            const noop = () => {
            };
            Object.defineProperty(document.createElement('video'), 'src', {
                get: noop,
                set: noop
            });
            Object.defineProperty(document.createElement('audio'), 'src', {
                get: noop,
                set: noop
            });
            Object.defineProperty(document.createElement('video'), 'innerHTML', {
                get: noop,
                set: noop
            });
            Object.defineProperty(document.createElement('audio'), 'innerHTML', {
                get: noop,
                set: noop
            });
        } catch (e) {
            return false;
        }
        return true;
    };
    Html5.supportsNativeTextTracks = function () {
        return browser.IS_ANY_SAFARI || browser.IS_IOS && browser.IS_CHROME;
    };
    Html5.supportsNativeVideoTracks = function () {
        return !!(Html5.TEST_VID && Html5.TEST_VID.videoTracks);
    };
    Html5.supportsNativeAudioTracks = function () {
        return !!(Html5.TEST_VID && Html5.TEST_VID.audioTracks);
    };
    Html5.Events = [
        'loadstart',
        'suspend',
        'abort',
        'error',
        'emptied',
        'stalled',
        'loadedmetadata',
        'loadeddata',
        'canplay',
        'canplaythrough',
        'playing',
        'waiting',
        'seeking',
        'seeked',
        'ended',
        'durationchange',
        'timeupdate',
        'progress',
        'play',
        'pause',
        'ratechange',
        'resize',
        'volumechange'
    ];
    [
        [
            'featuresVolumeControl',
            'canControlVolume'
        ],
        [
            'featuresMuteControl',
            'canMuteVolume'
        ],
        [
            'featuresPlaybackRate',
            'canControlPlaybackRate'
        ],
        [
            'featuresSourceset',
            'canOverrideAttributes'
        ],
        [
            'featuresNativeTextTracks',
            'supportsNativeTextTracks'
        ],
        [
            'featuresNativeVideoTracks',
            'supportsNativeVideoTracks'
        ],
        [
            'featuresNativeAudioTracks',
            'supportsNativeAudioTracks'
        ]
    ].forEach(function ([key, fn]) {
        defineLazyProperty(Html5.prototype, key, () => Html5[fn](), true);
    });
    Html5.prototype.movingMediaElementInDOM = !browser.IS_IOS;
    Html5.prototype.featuresFullscreenResize = true;
    Html5.prototype.featuresProgressEvents = true;
    Html5.prototype.featuresTimeupdateEvents = true;
    let canPlayType;
    Html5.patchCanPlayType = function () {
        if (browser.ANDROID_VERSION >= 4 && !browser.IS_FIREFOX && !browser.IS_CHROME) {
            canPlayType = Html5.TEST_VID && Html5.TEST_VID.constructor.prototype.canPlayType;
            Html5.TEST_VID.constructor.prototype.canPlayType = function (type) {
                const mpegurlRE = /^application\/(?:x-|vnd\.apple\.)mpegurl/i;
                if (type && mpegurlRE.test(type)) {
                    return 'maybe';
                }
                return canPlayType.call(this, type);
            };
        }
    };
    Html5.unpatchCanPlayType = function () {
        const r = Html5.TEST_VID.constructor.prototype.canPlayType;
        if (canPlayType) {
            Html5.TEST_VID.constructor.prototype.canPlayType = canPlayType;
        }
        return r;
    };
    Html5.patchCanPlayType();
    Html5.disposeMediaElement = function (el) {
        if (!el) {
            return;
        }
        if (el.parentNode) {
            el.parentNode.removeChild(el);
        }
        while (el.hasChildNodes()) {
            el.removeChild(el.firstChild);
        }
        el.removeAttribute('src');
        if (typeof el.load === 'function') {
            (function () {
                try {
                    el.load();
                } catch (e) {
                }
            }());
        }
    };
    Html5.resetMediaElement = function (el) {
        if (!el) {
            return;
        }
        const sources = el.querySelectorAll('source');
        let i = sources.length;
        while (i--) {
            el.removeChild(sources[i]);
        }
        el.removeAttribute('src');
        if (typeof el.load === 'function') {
            (function () {
                try {
                    el.load();
                } catch (e) {
                }
            }());
        }
    };
    [
        'muted',
        'defaultMuted',
        'autoplay',
        'controls',
        'loop',
        'playsinline'
    ].forEach(function (prop) {
        Html5.prototype[prop] = function () {
            return this.el_[prop] || this.el_.hasAttribute(prop);
        };
    });
    [
        'muted',
        'defaultMuted',
        'autoplay',
        'loop',
        'playsinline'
    ].forEach(function (prop) {
        Html5.prototype['set' + stringCases.toTitleCase(prop)] = function (v) {
            this.el_[prop] = v;
            if (v) {
                this.el_.setAttribute(prop, prop);
            } else {
                this.el_.removeAttribute(prop);
            }
        };
    });
    [
        'paused',
        'currentTime',
        'buffered',
        'volume',
        'poster',
        'preload',
        'error',
        'seeking',
        'seekable',
        'ended',
        'playbackRate',
        'defaultPlaybackRate',
        'disablePictureInPicture',
        'played',
        'networkState',
        'readyState',
        'videoWidth',
        'videoHeight',
        'crossOrigin'
    ].forEach(function (prop) {
        Html5.prototype[prop] = function () {
            return this.el_[prop];
        };
    });
    [
        'volume',
        'src',
        'poster',
        'preload',
        'playbackRate',
        'defaultPlaybackRate',
        'disablePictureInPicture',
        'crossOrigin'
    ].forEach(function (prop) {
        Html5.prototype['set' + stringCases.toTitleCase(prop)] = function (v) {
            this.el_[prop] = v;
        };
    });
    [
        'pause',
        'load',
        'play'
    ].forEach(function (prop) {
        Html5.prototype[prop] = function () {
            return this.el_[prop]();
        };
    });
    Tech.withSourceHandlers(Html5);
    Html5.nativeSourceHandler = {};
    Html5.nativeSourceHandler.canPlayType = function (type) {
        try {
            return Html5.TEST_VID.canPlayType(type);
        } catch (e) {
            return '';
        }
    };
    Html5.nativeSourceHandler.canHandleSource = function (source, options) {
        if (source.type) {
            return Html5.nativeSourceHandler.canPlayType(source.type);
        } else if (source.src) {
            const ext = Url.getFileExtension(source.src);
            return Html5.nativeSourceHandler.canPlayType(`video/${ ext }`);
        }
        return '';
    };
    Html5.nativeSourceHandler.handleSource = function (source, tech, options) {
        tech.setSrc(source.src);
    };
    Html5.nativeSourceHandler.dispose = function () {
    };
    Html5.registerSourceHandler(Html5.nativeSourceHandler);
    Tech.registerTech('Html5', Html5);
    return Html5;
});