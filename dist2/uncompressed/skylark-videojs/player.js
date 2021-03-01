define([
    'skylark-langx-globals/document',
    './component',
    './mixins/evented',
    './utils/events',
    './utils/dom',
    './utils/fn',
    './utils/guid',
    './utils/browser',
    './utils/log',
    './utils/string-cases',
    './utils/time-ranges',
    './utils/buffer',
    './utils/stylesheet',
    './fullscreen-api',
    './media-error',
    './utils/safeParseTuple',
    './utils/obj',
    './utils/merge-options',
    './utils/promise',
    './tracks/text-track-list-converter',
    './modal-dialog',
    './tech/tech',
    './tech/middleware',
    './tracks/track-types',
    './utils/filter-source',
    './utils/mimetypes',
    './utils/keycode',
    './tech/loader',
    './poster-image',
    './tracks/text-track-display',
    './loading-spinner',
    './big-play-button',
    './close-button',
    './control-bar/control-bar',
    './error-display',
    './tracks/text-track-settings',
    './resize-manager',
    './live-tracker',
    './tech/html5'
], function (
    document,
    Component,
    evented, 
    Events, 
    Dom, 
    Fn, 
    Guid, 
    browser, 
    log, 
    stringCases, 
    timeRages, 
    buffer, 
    stylesheet, 
    FullscreenApi, 
    MediaError, 
    safeParseTuple, 
    obj, 
    mergeOptions, 
    promise, 
    textTrackConverter, 
    ModalDialog, 
    Tech, 
    middleware, 
    TRACK_TYPES, 
    filterSource, 
    mimetypes, 
    keycode
) {
    'use strict';
    const TECH_EVENTS_RETRIGGER = [
        'progress',
        'abort',
        'suspend',
        'emptied',
        'stalled',
        'loadedmetadata',
        'loadeddata',
        'timeupdate',
        'resize',
        'volumechange',
        'texttrackchange'
    ];
    const TECH_EVENTS_QUEUE = {
        canplay: 'CanPlay',
        canplaythrough: 'CanPlayThrough',
        playing: 'Playing',
        seeked: 'Seeked'
    };
    const BREAKPOINT_ORDER = [
        'tiny',
        'xsmall',
        'small',
        'medium',
        'large',
        'xlarge',
        'huge'
    ];
    const BREAKPOINT_CLASSES = {};
    BREAKPOINT_ORDER.forEach(k => {
        const v = k.charAt(0) === 'x' ? `x-${ k.substring(1) }` : k;
        BREAKPOINT_CLASSES[k] = `vjs-layout-${ v }`;
    });
    const DEFAULT_BREAKPOINTS = {
        tiny: 210,
        xsmall: 320,
        small: 425,
        medium: 768,
        large: 1440,
        xlarge: 2560,
        huge: Infinity
    };
    class Player extends Component {
        constructor(tag, options, ready) {
            tag.id = tag.id || options.id || `vjs_video_${ Guid.newGUID() }`;
            options = obj.assign(Player.getTagSettings(tag), options);
            options.initChildren = false;
            options.createEl = false;
            options.evented = false;
            options.reportTouchActivity = false;
            if (!options.language) {
                if (typeof tag.closest === 'function') {
                    const closest = tag.closest('[lang]');
                    if (closest && closest.getAttribute) {
                        options.language = closest.getAttribute('lang');
                    }
                } else {
                    let element = tag;
                    while (element && element.nodeType === 1) {
                        if (Dom.getAttributes(element).hasOwnProperty('lang')) {
                            options.language = element.getAttribute('lang');
                            break;
                        }
                        element = element.parentNode;
                    }
                }
            }
            super(null, options, ready);
            this.boundDocumentFullscreenChange_ = e => this.documentFullscreenChange_(e);
            this.boundFullWindowOnEscKey_ = e => this.fullWindowOnEscKey(e);
            this.isFullscreen_ = false;
            this.log = log.createLogger(this.id_);
            this.fsApi_ = FullscreenApi;
            this.isPosterFromTech_ = false;
            this.queuedCallbacks_ = [];
            this.isReady_ = false;
            this.hasStarted_ = false;
            this.userActive_ = false;
            this.debugEnabled_ = false;
            if (!this.options_ || !this.options_.techOrder || !this.options_.techOrder.length) {
                throw new Error('No techOrder specified. Did you overwrite ' + 'videojs.options instead of just changing the ' + 'properties you want to override?');
            }
            this.tag = tag;
            this.tagAttributes = tag && Dom.getAttributes(tag);
            this.language(this.options_.language);
            if (options.languages) {
                const languagesToLower = {};
                Object.getOwnPropertyNames(options.languages).forEach(function (name) {
                    languagesToLower[name.toLowerCase()] = options.languages[name];
                });
                this.languages_ = languagesToLower;
            } else {
                this.languages_ = Player.prototype.options_.languages;
            }
            this.resetCache_();
            this.poster_ = options.poster || '';
            this.controls_ = !!options.controls;
            tag.controls = false;
            tag.removeAttribute('controls');
            this.changingSrc_ = false;
            this.playCallbacks_ = [];
            this.playTerminatedQueue_ = [];
            if (tag.hasAttribute('autoplay')) {
                this.autoplay(true);
            } else {
                this.autoplay(this.options_.autoplay);
            }
            if (options.plugins) {
                Object.keys(options.plugins).forEach(name => {
                    if (typeof this[name] !== 'function') {
                        throw new Error(`plugin "${ name }" does not exist`);
                    }
                });
            }
            this.scrubbing_ = false;
            this.el_ = this.createEl();
            evented(this, { eventBusKey: 'el_' });
            if (this.fsApi_.requestFullscreen) {
                Events.on(document, this.fsApi_.fullscreenchange, this.boundDocumentFullscreenChange_);
                this.on(this.fsApi_.fullscreenchange, this.boundDocumentFullscreenChange_);
            }
            if (this.fluid_) {
                this.on([
                    'playerreset',
                    'resize'
                ], this.updateStyleEl_);
            }
            const playerOptionsCopy = mergeOptions(this.options_);
            if (options.plugins) {
                Object.keys(options.plugins).forEach(name => {
                    this[name](options.plugins[name]);
                });
            }
            if (options.debug) {
                this.debug(true);
            }
            this.options_.playerOptions = playerOptionsCopy;
            this.middleware_ = [];
            this.initChildren();
            this.isAudio(tag.nodeName.toLowerCase() === 'audio');
            if (this.controls()) {
                this.addClass('vjs-controls-enabled');
            } else {
                this.addClass('vjs-controls-disabled');
            }
            this.el_.setAttribute('role', 'region');
            if (this.isAudio()) {
                this.el_.setAttribute('aria-label', this.localize('Audio Player'));
            } else {
                this.el_.setAttribute('aria-label', this.localize('Video Player'));
            }
            if (this.isAudio()) {
                this.addClass('vjs-audio');
            }
            if (this.flexNotSupported_()) {
                this.addClass('vjs-no-flex');
            }
            if (browser.TOUCH_ENABLED) {
                this.addClass('vjs-touch-enabled');
            }
            if (!browser.IS_IOS) {
                this.addClass('vjs-workinghover');
            }
            Player.players[this.id_] = this;
            const majorVersion = "7";
            this.addClass(`vjs-v${ majorVersion }`);
            this.userActive(true);
            this.reportUserActivity();
            this.one('play', this.listenForUserActivity_);
            this.on('stageclick', this.handleStageClick_);
            this.on('keydown', this.handleKeyDown);
            this.on('languagechange', this.handleLanguagechange);
            this.breakpoints(this.options_.breakpoints);
            this.responsive(this.options_.responsive);
        }
        dispose() {
            this.trigger('dispose');
            this.off('dispose');
            Events.off(document, this.fsApi_.fullscreenchange, this.boundDocumentFullscreenChange_);
            Events.off(document, 'keydown', this.boundFullWindowOnEscKey_);
            if (this.styleEl_ && this.styleEl_.parentNode) {
                this.styleEl_.parentNode.removeChild(this.styleEl_);
                this.styleEl_ = null;
            }
            Player.players[this.id_] = null;
            if (this.tag && this.tag.player) {
                this.tag.player = null;
            }
            if (this.el_ && this.el_.player) {
                this.el_.player = null;
            }
            if (this.tech_) {
                this.tech_.dispose();
                this.isPosterFromTech_ = false;
                this.poster_ = '';
            }
            if (this.playerElIngest_) {
                this.playerElIngest_ = null;
            }
            if (this.tag) {
                this.tag = null;
            }
            middleware.clearCacheForPlayer(this);
            TRACK_TYPES.names.forEach(name => {
                const props = TRACK_TYPES[name];
                const list = this[props.getterName]();
                if (list && list.off) {
                    list.off();
                }
            });
            super.dispose();
        }
        createEl() {
            let tag = this.tag;
            let el;
            let playerElIngest = this.playerElIngest_ = tag.parentNode && tag.parentNode.hasAttribute && tag.parentNode.hasAttribute('data-vjs-player');
            const divEmbed = this.tag.tagName.toLowerCase() === 'video-js';
            if (playerElIngest) {
                el = this.el_ = tag.parentNode;
            } else if (!divEmbed) {
                el = this.el_ = super.createEl('div');
            }
            const attrs = Dom.getAttributes(tag);
            if (divEmbed) {
                el = this.el_ = tag;
                tag = this.tag = document.createElement('video');
                while (el.children.length) {
                    tag.appendChild(el.firstChild);
                }
                if (!Dom.hasClass(el, 'video-js')) {
                    Dom.addClass(el, 'video-js');
                }
                el.appendChild(tag);
                playerElIngest = this.playerElIngest_ = el;
                Object.keys(el).forEach(k => {
                    try {
                        tag[k] = el[k];
                    } catch (e) {
                    }
                });
            }
            tag.setAttribute('tabindex', '-1');
            attrs.tabindex = '-1';
            if (browser.IE_VERSION || browser.IS_CHROME && browser.IS_WINDOWS) {
                tag.setAttribute('role', 'application');
                attrs.role = 'application';
            }
            tag.removeAttribute('width');
            tag.removeAttribute('height');
            if ('width' in attrs) {
                delete attrs.width;
            }
            if ('height' in attrs) {
                delete attrs.height;
            }
            Object.getOwnPropertyNames(attrs).forEach(function (attr) {
                if (!(divEmbed && attr === 'class')) {
                    el.setAttribute(attr, attrs[attr]);
                }
                if (divEmbed) {
                    tag.setAttribute(attr, attrs[attr]);
                }
            });
            tag.playerId = tag.id;
            tag.id += '_html5_api';
            tag.className = 'vjs-tech';
            tag.player = el.player = this;
            this.addClass('vjs-paused');
            if (window.VIDEOJS_NO_DYNAMIC_STYLE !== true) {
                this.styleEl_ = stylesheet.createStyleElement('vjs-styles-dimensions');
                const defaultsStyleEl = Dom.$('.vjs-styles-defaults');
                const head = Dom.$('head');
                head.insertBefore(this.styleEl_, defaultsStyleEl ? defaultsStyleEl.nextSibling : head.firstChild);
            }
            this.fill_ = false;
            this.fluid_ = false;
            this.width(this.options_.width);
            this.height(this.options_.height);
            this.fill(this.options_.fill);
            this.fluid(this.options_.fluid);
            this.aspectRatio(this.options_.aspectRatio);
            this.crossOrigin(this.options_.crossOrigin || this.options_.crossorigin);
            const links = tag.getElementsByTagName('a');
            for (let i = 0; i < links.length; i++) {
                const linkEl = links.item(i);
                Dom.addClass(linkEl, 'vjs-hidden');
                linkEl.setAttribute('hidden', 'hidden');
            }
            tag.initNetworkState_ = tag.networkState;
            if (tag.parentNode && !playerElIngest) {
                tag.parentNode.insertBefore(el, tag);
            }
            Dom.prependTo(tag, el);
            this.children_.unshift(tag);
            this.el_.setAttribute('lang', this.language_);
            this.el_ = el;
            return el;
        }
        crossOrigin(value) {
            if (!value) {
                return this.techGet_('crossOrigin');
            }
            if (value !== 'anonymous' && value !== 'use-credentials') {
                log.warn(`crossOrigin must be "anonymous" or "use-credentials", given "${ value }"`);
                return;
            }
            this.techCall_('setCrossOrigin', value);
            return;
        }
        width(value) {
            return this.dimension('width', value);
        }
        height(value) {
            return this.dimension('height', value);
        }
        dimension(dimension, value) {
            const privDimension = dimension + '_';
            if (value === undefined) {
                return this[privDimension] || 0;
            }
            if (value === '' || value === 'auto') {
                this[privDimension] = undefined;
                this.updateStyleEl_();
                return;
            }
            const parsedVal = parseFloat(value);
            if (isNaN(parsedVal)) {
                log.error(`Improper value "${ value }" supplied for for ${ dimension }`);
                return;
            }
            this[privDimension] = parsedVal;
            this.updateStyleEl_();
        }
        fluid(bool) {
            if (bool === undefined) {
                return !!this.fluid_;
            }
            this.fluid_ = !!bool;
            if (evented.isEvented(this)) {
                this.off([
                    'playerreset',
                    'resize'
                ], this.updateStyleEl_);
            }
            if (bool) {
                this.addClass('vjs-fluid');
                this.fill(false);
                evented.addEventedCallback(this, () => {
                    this.on([
                        'playerreset',
                        'resize'
                    ], this.updateStyleEl_);
                });
            } else {
                this.removeClass('vjs-fluid');
            }
            this.updateStyleEl_();
        }
        fill(bool) {
            if (bool === undefined) {
                return !!this.fill_;
            }
            this.fill_ = !!bool;
            if (bool) {
                this.addClass('vjs-fill');
                this.fluid(false);
            } else {
                this.removeClass('vjs-fill');
            }
        }
        aspectRatio(ratio) {
            if (ratio === undefined) {
                return this.aspectRatio_;
            }
            if (!/^\d+\:\d+$/.test(ratio)) {
                throw new Error('Improper value supplied for aspect ratio. The format should be width:height, for example 16:9.');
            }
            this.aspectRatio_ = ratio;
            this.fluid(true);
            this.updateStyleEl_();
        }
        updateStyleEl_() {
            if (window.VIDEOJS_NO_DYNAMIC_STYLE === true) {
                const width = typeof this.width_ === 'number' ? this.width_ : this.options_.width;
                const height = typeof this.height_ === 'number' ? this.height_ : this.options_.height;
                const techEl = this.tech_ && this.tech_.el();
                if (techEl) {
                    if (width >= 0) {
                        techEl.width = width;
                    }
                    if (height >= 0) {
                        techEl.height = height;
                    }
                }
                return;
            }
            let width;
            let height;
            let aspectRatio;
            let idClass;
            if (this.aspectRatio_ !== undefined && this.aspectRatio_ !== 'auto') {
                aspectRatio = this.aspectRatio_;
            } else if (this.videoWidth() > 0) {
                aspectRatio = this.videoWidth() + ':' + this.videoHeight();
            } else {
                aspectRatio = '16:9';
            }
            const ratioParts = aspectRatio.split(':');
            const ratioMultiplier = ratioParts[1] / ratioParts[0];
            if (this.width_ !== undefined) {
                width = this.width_;
            } else if (this.height_ !== undefined) {
                width = this.height_ / ratioMultiplier;
            } else {
                width = this.videoWidth() || 300;
            }
            if (this.height_ !== undefined) {
                height = this.height_;
            } else {
                height = width * ratioMultiplier;
            }
            if (/^[^a-zA-Z]/.test(this.id())) {
                idClass = 'dimensions-' + this.id();
            } else {
                idClass = this.id() + '-dimensions';
            }
            this.addClass(idClass);
            stylesheet.setTextContent(this.styleEl_, `
      .${ idClass } {
        width: ${ width }px;
        height: ${ height }px;
      }

      .${ idClass }.vjs-fluid {
        padding-top: ${ ratioMultiplier * 100 }%;
      }
    `);
        }
        loadTech_(techName, source) {
            if (this.tech_) {
                this.unloadTech_();
            }
            const titleTechName = stringCases.toTitleCase(techName);
            const camelTechName = techName.charAt(0).toLowerCase() + techName.slice(1);
            if (titleTechName !== 'Html5' && this.tag) {
                Tech.getTech('Html5').disposeMediaElement(this.tag);
                this.tag.player = null;
                this.tag = null;
            }
            this.techName_ = titleTechName;
            this.isReady_ = false;
            const autoplay = typeof this.autoplay() === 'string' ? false : this.autoplay();
            const techOptions = {
                source,
                autoplay,
                'nativeControlsForTouch': this.options_.nativeControlsForTouch,
                'playerId': this.id(),
                'techId': `${ this.id() }_${ camelTechName }_api`,
                'playsinline': this.options_.playsinline,
                'preload': this.options_.preload,
                'loop': this.options_.loop,
                'disablePictureInPicture': this.options_.disablePictureInPicture,
                'muted': this.options_.muted,
                'poster': this.poster(),
                'language': this.language(),
                'playerElIngest': this.playerElIngest_ || false,
                'vtt.js': this.options_['vtt.js'],
                'canOverridePoster': !!this.options_.techCanOverridePoster,
                'enableSourceset': this.options_.enableSourceset,
                'Promise': this.options_.Promise
            };
            TRACK_TYPES.names.forEach(name => {
                const props = TRACK_TYPES[name];
                techOptions[props.getterName] = this[props.privateName];
            });
            obj.assign(techOptions, this.options_[titleTechName]);
            obj.assign(techOptions, this.options_[camelTechName]);
            obj.assign(techOptions, this.options_[techName.toLowerCase()]);
            if (this.tag) {
                techOptions.tag = this.tag;
            }
            if (source && source.src === this.cache_.src && this.cache_.currentTime > 0) {
                techOptions.startTime = this.cache_.currentTime;
            }
            const TechClass = Tech.getTech(techName);
            if (!TechClass) {
                throw new Error(`No Tech named '${ titleTechName }' exists! '${ titleTechName }' should be registered using videojs.registerTech()'`);
            }
            this.tech_ = new TechClass(techOptions);
            this.tech_.ready(Fn.bind(this, this.handleTechReady_), true);
            textTrackConverter.jsonToTextTracks(this.textTracksJson_ || [], this.tech_);
            TECH_EVENTS_RETRIGGER.forEach(event => {
                this.on(this.tech_, event, this[`handleTech${ stringCases.toTitleCase(event) }_`]);
            });
            Object.keys(TECH_EVENTS_QUEUE).forEach(event => {
                this.on(this.tech_, event, eventObj => {
                    if (this.tech_.playbackRate() === 0 && this.tech_.seeking()) {
                        this.queuedCallbacks_.push({
                            callback: this[`handleTech${ TECH_EVENTS_QUEUE[event] }_`].bind(this),
                            event: eventObj
                        });
                        return;
                    }
                    this[`handleTech${ TECH_EVENTS_QUEUE[event] }_`](eventObj);
                });
            });
            this.on(this.tech_, 'loadstart', this.handleTechLoadStart_);
            this.on(this.tech_, 'sourceset', this.handleTechSourceset_);
            this.on(this.tech_, 'waiting', this.handleTechWaiting_);
            this.on(this.tech_, 'ended', this.handleTechEnded_);
            this.on(this.tech_, 'seeking', this.handleTechSeeking_);
            this.on(this.tech_, 'play', this.handleTechPlay_);
            this.on(this.tech_, 'firstplay', this.handleTechFirstPlay_);
            this.on(this.tech_, 'pause', this.handleTechPause_);
            this.on(this.tech_, 'durationchange', this.handleTechDurationChange_);
            this.on(this.tech_, 'fullscreenchange', this.handleTechFullscreenChange_);
            this.on(this.tech_, 'fullscreenerror', this.handleTechFullscreenError_);
            this.on(this.tech_, 'enterpictureinpicture', this.handleTechEnterPictureInPicture_);
            this.on(this.tech_, 'leavepictureinpicture', this.handleTechLeavePictureInPicture_);
            this.on(this.tech_, 'error', this.handleTechError_);
            this.on(this.tech_, 'loadedmetadata', this.updateStyleEl_);
            this.on(this.tech_, 'posterchange', this.handleTechPosterChange_);
            this.on(this.tech_, 'textdata', this.handleTechTextData_);
            this.on(this.tech_, 'ratechange', this.handleTechRateChange_);
            this.usingNativeControls(this.techGet_('controls'));
            if (this.controls() && !this.usingNativeControls()) {
                this.addTechControlsListeners_();
            }
            if (this.tech_.el().parentNode !== this.el() && (titleTechName !== 'Html5' || !this.tag)) {
                Dom.prependTo(this.tech_.el(), this.el());
            }
            if (this.tag) {
                this.tag.player = null;
                this.tag = null;
            }
        }
        unloadTech_() {
            TRACK_TYPES.names.forEach(name => {
                const props = TRACK_TYPES[name];
                this[props.privateName] = this[props.getterName]();
            });
            this.textTracksJson_ = textTrackConverter.textTracksToJson(this.tech_);
            this.isReady_ = false;
            this.tech_.dispose();
            this.tech_ = false;
            if (this.isPosterFromTech_) {
                this.poster_ = '';
                this.trigger('posterchange');
            }
            this.isPosterFromTech_ = false;
        }
        tech(safety) {
            if (safety === undefined) {
                log.warn("Using the tech directly can be dangerous. I hope you know what you're doing.\n" + 'See https://github.com/videojs/video.js/issues/2617 for more info.\n');
            }
            return this.tech_;
        }
        addTechControlsListeners_() {
            this.removeTechControlsListeners_();
            this.on(this.tech_, 'mouseup', this.handleTechClick_);
            this.on(this.tech_, 'dblclick', this.handleTechDoubleClick_);
            this.on(this.tech_, 'touchstart', this.handleTechTouchStart_);
            this.on(this.tech_, 'touchmove', this.handleTechTouchMove_);
            this.on(this.tech_, 'touchend', this.handleTechTouchEnd_);
            this.on(this.tech_, 'tap', this.handleTechTap_);
        }
        removeTechControlsListeners_() {
            this.off(this.tech_, 'tap', this.handleTechTap_);
            this.off(this.tech_, 'touchstart', this.handleTechTouchStart_);
            this.off(this.tech_, 'touchmove', this.handleTechTouchMove_);
            this.off(this.tech_, 'touchend', this.handleTechTouchEnd_);
            this.off(this.tech_, 'mouseup', this.handleTechClick_);
            this.off(this.tech_, 'dblclick', this.handleTechDoubleClick_);
        }
        handleTechReady_() {
            this.triggerReady();
            if (this.cache_.volume) {
                this.techCall_('setVolume', this.cache_.volume);
            }
            this.handleTechPosterChange_();
            this.handleTechDurationChange_();
        }
        handleTechLoadStart_() {
            this.removeClass('vjs-ended');
            this.removeClass('vjs-seeking');
            this.error(null);
            this.handleTechDurationChange_();
            if (!this.paused()) {
                this.trigger('loadstart');
                this.trigger('firstplay');
            } else {
                this.hasStarted(false);
                this.trigger('loadstart');
            }
            this.manualAutoplay_(this.autoplay());
        }
        manualAutoplay_(type) {
            if (!this.tech_ || typeof type !== 'string') {
                return;
            }
            const muted = () => {
                const previouslyMuted = this.muted();
                this.muted(true);
                const restoreMuted = () => {
                    this.muted(previouslyMuted);
                };
                this.playTerminatedQueue_.push(restoreMuted);
                const mutedPromise = this.play();
                if (!promise.isPromise(mutedPromise)) {
                    return;
                }
                return mutedPromise.catch(restoreMuted);
            };
            let promise;
            if (type === 'any' && this.muted() !== true) {
                promise = this.play();
                if (promise.isPromise(promise)) {
                    promise = promise.catch(muted);
                }
            } else if (type === 'muted' && this.muted() !== true) {
                promise = muted();
            } else {
                promise = this.play();
            }
            if (!promise.isPromise(promise)) {
                return;
            }
            return promise.then(() => {
                this.trigger({
                    type: 'autoplay-success',
                    autoplay: type
                });
            }).catch(e => {
                this.trigger({
                    type: 'autoplay-failure',
                    autoplay: type
                });
            });
        }
        updateSourceCaches_(srcObj = '') {
            let src = srcObj;
            let type = '';
            if (typeof src !== 'string') {
                src = srcObj.src;
                type = srcObj.type;
            }
            this.cache_.source = this.cache_.source || {};
            this.cache_.sources = this.cache_.sources || [];
            if (src && !type) {
                type = mimetypes.findMimetype(this, src);
            }
            this.cache_.source = mergeOptions({}, srcObj, {
                src,
                type
            });
            const matchingSources = this.cache_.sources.filter(s => s.src && s.src === src);
            const sourceElSources = [];
            const sourceEls = this.$$('source');
            const matchingSourceEls = [];
            for (let i = 0; i < sourceEls.length; i++) {
                const sourceObj = Dom.getAttributes(sourceEls[i]);
                sourceElSources.push(sourceObj);
                if (sourceObj.src && sourceObj.src === src) {
                    matchingSourceEls.push(sourceObj.src);
                }
            }
            if (matchingSourceEls.length && !matchingSources.length) {
                this.cache_.sources = sourceElSources;
            } else if (!matchingSources.length) {
                this.cache_.sources = [this.cache_.source];
            }
            this.cache_.src = src;
        }
        handleTechSourceset_(event) {
            if (!this.changingSrc_) {
                let updateSourceCaches = src => this.updateSourceCaches_(src);
                const playerSrc = this.currentSource().src;
                const eventSrc = event.src;
                if (playerSrc && !/^blob:/.test(playerSrc) && /^blob:/.test(eventSrc)) {
                    if (!this.lastSource_ || this.lastSource_.tech !== eventSrc && this.lastSource_.player !== playerSrc) {
                        updateSourceCaches = () => {
                        };
                    }
                }
                updateSourceCaches(eventSrc);
                if (!event.src) {
                    this.tech_.any([
                        'sourceset',
                        'loadstart'
                    ], e => {
                        if (e.type === 'sourceset') {
                            return;
                        }
                        const techSrc = this.techGet('currentSrc');
                        this.lastSource_.tech = techSrc;
                        this.updateSourceCaches_(techSrc);
                    });
                }
            }
            this.lastSource_ = {
                player: this.currentSource().src,
                tech: event.src
            };
            this.trigger({
                src: event.src,
                type: 'sourceset'
            });
        }
        hasStarted(request) {
            if (request === undefined) {
                return this.hasStarted_;
            }
            if (request === this.hasStarted_) {
                return;
            }
            this.hasStarted_ = request;
            if (this.hasStarted_) {
                this.addClass('vjs-has-started');
                this.trigger('firstplay');
            } else {
                this.removeClass('vjs-has-started');
            }
        }
        handleTechPlay_() {
            this.removeClass('vjs-ended');
            this.removeClass('vjs-paused');
            this.addClass('vjs-playing');
            this.hasStarted(true);
            this.trigger('play');
        }
        handleTechRateChange_() {
            if (this.tech_.playbackRate() > 0 && this.cache_.lastPlaybackRate === 0) {
                this.queuedCallbacks_.forEach(queued => queued.callback(queued.event));
                this.queuedCallbacks_ = [];
            }
            this.cache_.lastPlaybackRate = this.tech_.playbackRate();
            this.trigger('ratechange');
        }
        handleTechWaiting_() {
            this.addClass('vjs-waiting');
            this.trigger('waiting');
            const timeWhenWaiting = this.currentTime();
            const timeUpdateListener = () => {
                if (timeWhenWaiting !== this.currentTime()) {
                    this.removeClass('vjs-waiting');
                    this.off('timeupdate', timeUpdateListener);
                }
            };
            this.on('timeupdate', timeUpdateListener);
        }
        handleTechCanPlay_() {
            this.removeClass('vjs-waiting');
            this.trigger('canplay');
        }
        handleTechCanPlayThrough_() {
            this.removeClass('vjs-waiting');
            this.trigger('canplaythrough');
        }
        handleTechPlaying_() {
            this.removeClass('vjs-waiting');
            this.trigger('playing');
        }
        handleTechSeeking_() {
            this.addClass('vjs-seeking');
            this.trigger('seeking');
        }
        handleTechSeeked_() {
            this.removeClass('vjs-seeking');
            this.removeClass('vjs-ended');
            this.trigger('seeked');
        }
        handleTechFirstPlay_() {
            if (this.options_.starttime) {
                log.warn('Passing the `starttime` option to the player will be deprecated in 6.0');
                this.currentTime(this.options_.starttime);
            }
            this.addClass('vjs-has-started');
            this.trigger('firstplay');
        }
        handleTechPause_() {
            this.removeClass('vjs-playing');
            this.addClass('vjs-paused');
            this.trigger('pause');
        }
        handleTechEnded_() {
            this.addClass('vjs-ended');
            if (this.options_.loop) {
                this.currentTime(0);
                this.play();
            } else if (!this.paused()) {
                this.pause();
            }
            this.trigger('ended');
        }
        handleTechDurationChange_() {
            this.duration(this.techGet_('duration'));
        }
        handleTechClick_(event) {
            if (!Dom.isSingleLeftClick(event)) {
                return;
            }
            if (!this.controls_) {
                return;
            }
            if (this.paused()) {
                promise.silencePromise(this.play());
            } else {
                this.pause();
            }
        }
        handleTechDoubleClick_(event) {
            if (!this.controls_) {
                return;
            }
            const inAllowedEls = Array.prototype.some.call(this.$$('.vjs-control-bar, .vjs-modal-dialog'), el => el.contains(event.target));
            if (!inAllowedEls) {
                if (this.options_ === undefined || this.options_.userActions === undefined || this.options_.userActions.doubleClick === undefined || this.options_.userActions.doubleClick !== false) {
                    if (this.options_ !== undefined && this.options_.userActions !== undefined && typeof this.options_.userActions.doubleClick === 'function') {
                        this.options_.userActions.doubleClick.call(this, event);
                    } else if (this.isFullscreen()) {
                        this.exitFullscreen();
                    } else {
                        this.requestFullscreen();
                    }
                }
            }
        }
        handleTechTap_() {
            this.userActive(!this.userActive());
        }
        handleTechTouchStart_() {
            this.userWasActive = this.userActive();
        }
        handleTechTouchMove_() {
            if (this.userWasActive) {
                this.reportUserActivity();
            }
        }
        handleTechTouchEnd_(event) {
            if (event.cancelable) {
                event.preventDefault();
            }
        }
        handleStageClick_() {
            this.reportUserActivity();
        }
        toggleFullscreenClass_() {
            if (this.isFullscreen()) {
                this.addClass('vjs-fullscreen');
            } else {
                this.removeClass('vjs-fullscreen');
            }
        }
        documentFullscreenChange_(e) {
            const targetPlayer = e.target.player;
            if (targetPlayer && targetPlayer !== this) {
                return;
            }
            const el = this.el();
            let isFs = document[this.fsApi_.fullscreenElement] === el;
            if (!isFs && el.matches) {
                isFs = el.matches(':' + this.fsApi_.fullscreen);
            } else if (!isFs && el.msMatchesSelector) {
                isFs = el.msMatchesSelector(':' + this.fsApi_.fullscreen);
            }
            this.isFullscreen(isFs);
        }
        handleTechFullscreenChange_(event, data) {
            if (data) {
                if (data.nativeIOSFullscreen) {
                    this.toggleClass('vjs-ios-native-fs');
                }
                this.isFullscreen(data.isFullscreen);
            }
        }
        handleTechFullscreenError_(event, err) {
            this.trigger('fullscreenerror', err);
        }
        togglePictureInPictureClass_() {
            if (this.isInPictureInPicture()) {
                this.addClass('vjs-picture-in-picture');
            } else {
                this.removeClass('vjs-picture-in-picture');
            }
        }
        handleTechEnterPictureInPicture_(event) {
            this.isInPictureInPicture(true);
        }
        handleTechLeavePictureInPicture_(event) {
            this.isInPictureInPicture(false);
        }
        handleTechError_() {
            const error = this.tech_.error();
            this.error(error);
        }
        handleTechTextData_() {
            let data = null;
            if (arguments.length > 1) {
                data = arguments[1];
            }
            this.trigger('textdata', data);
        }
        getCache() {
            return this.cache_;
        }
        resetCache_() {
            this.cache_ = {
                currentTime: 0,
                initTime: 0,
                inactivityTimeout: this.options_.inactivityTimeout,
                duration: NaN,
                lastVolume: 1,
                lastPlaybackRate: this.defaultPlaybackRate(),
                media: null,
                src: '',
                source: {},
                sources: [],
                volume: 1
            };
        }
        techCall_(method, arg) {
            this.ready(function () {
                if (method in middleware.allowedSetters) {
                    return middleware.set(this.middleware_, this.tech_, method, arg);
                } else if (method in middleware.allowedMediators) {
                    return middleware.mediate(this.middleware_, this.tech_, method, arg);
                }
                try {
                    if (this.tech_) {
                        this.tech_[method](arg);
                    }
                } catch (e) {
                    log(e);
                    throw e;
                }
            }, true);
        }
        techGet_(method) {
            if (!this.tech_ || !this.tech_.isReady_) {
                return;
            }
            if (method in middleware.allowedGetters) {
                return middleware.get(this.middleware_, this.tech_, method);
            } else if (method in middleware.allowedMediators) {
                return middleware.mediate(this.middleware_, this.tech_, method);
            }
            try {
                return this.tech_[method]();
            } catch (e) {
                if (this.tech_[method] === undefined) {
                    log(`Video.js: ${ method } method not defined for ${ this.techName_ } playback technology.`, e);
                    throw e;
                }
                if (e.name === 'TypeError') {
                    log(`Video.js: ${ method } unavailable on ${ this.techName_ } playback technology element.`, e);
                    this.tech_.isReady_ = false;
                    throw e;
                }
                log(e);
                throw e;
            }
        }
        play() {
            const PromiseClass = this.options_.Promise || window.Promise;
            if (PromiseClass) {
                return new PromiseClass(resolve => {
                    this.play_(resolve);
                });
            }
            return this.play_();
        }
        play_(callback = promise.silencePromise) {
            this.playCallbacks_.push(callback);
            const isSrcReady = Boolean(!this.changingSrc_ && (this.src() || this.currentSrc()));
            if (this.waitToPlay_) {
                this.off([
                    'ready',
                    'loadstart'
                ], this.waitToPlay_);
                this.waitToPlay_ = null;
            }
            if (!this.isReady_ || !isSrcReady) {
                this.waitToPlay_ = e => {
                    this.play_();
                };
                this.one([
                    'ready',
                    'loadstart'
                ], this.waitToPlay_);
                if (!isSrcReady && (browser.IS_ANY_SAFARI || browser.IS_IOS)) {
                    this.load();
                }
                return;
            }
            const val = this.techGet_('play');
            if (val === null) {
                this.runPlayTerminatedQueue_();
            } else {
                this.runPlayCallbacks_(val);
            }
        }
        runPlayTerminatedQueue_() {
            const queue = this.playTerminatedQueue_.slice(0);
            this.playTerminatedQueue_ = [];
            queue.forEach(function (q) {
                q();
            });
        }
        runPlayCallbacks_(val) {
            const callbacks = this.playCallbacks_.slice(0);
            this.playCallbacks_ = [];
            this.playTerminatedQueue_ = [];
            callbacks.forEach(function (cb) {
                cb(val);
            });
        }
        pause() {
            this.techCall_('pause');
        }
        paused() {
            return this.techGet_('paused') === false ? false : true;
        }
        played() {
            return this.techGet_('played') || timeRages.createTimeRange(0, 0);
        }
        scrubbing(isScrubbing) {
            if (typeof isScrubbing === 'undefined') {
                return this.scrubbing_;
            }
            this.scrubbing_ = !!isScrubbing;
            this.techCall_('setScrubbing', this.scrubbing_);
            if (isScrubbing) {
                this.addClass('vjs-scrubbing');
            } else {
                this.removeClass('vjs-scrubbing');
            }
        }
        currentTime(seconds) {
            if (typeof seconds !== 'undefined') {
                if (seconds < 0) {
                    seconds = 0;
                }
                if (!this.isReady_ || this.changingSrc_ || !this.tech_ || !this.tech_.isReady_) {
                    this.cache_.initTime = seconds;
                    this.off('canplay', this.applyInitTime_);
                    this.one('canplay', this.applyInitTime_);
                    return;
                }
                this.techCall_('setCurrentTime', seconds);
                this.cache_.initTime = 0;
                return;
            }
            this.cache_.currentTime = this.techGet_('currentTime') || 0;
            return this.cache_.currentTime;
        }
        applyInitTime_() {
            this.currentTime(this.cache_.initTime);
        }
        duration(seconds) {
            if (seconds === undefined) {
                return this.cache_.duration !== undefined ? this.cache_.duration : NaN;
            }
            seconds = parseFloat(seconds);
            if (seconds < 0) {
                seconds = Infinity;
            }
            if (seconds !== this.cache_.duration) {
                this.cache_.duration = seconds;
                if (seconds === Infinity) {
                    this.addClass('vjs-live');
                } else {
                    this.removeClass('vjs-live');
                }
                if (!isNaN(seconds)) {
                    this.trigger('durationchange');
                }
            }
        }
        remainingTime() {
            return this.duration() - this.currentTime();
        }
        remainingTimeDisplay() {
            return Math.floor(this.duration()) - Math.floor(this.currentTime());
        }
        buffered() {
            let buffered = this.techGet_('buffered');
            if (!buffered || !buffered.length) {
                buffered = timeRages.createTimeRange(0, 0);
            }
            return buffered;
        }
        bufferedPercent() {
            return buffer.bufferedPercent(this.buffered(), this.duration());
        }
        bufferedEnd() {
            const buffered = this.buffered();
            const duration = this.duration();
            let end = buffered.end(buffered.length - 1);
            if (end > duration) {
                end = duration;
            }
            return end;
        }
        volume(percentAsDecimal) {
            let vol;
            if (percentAsDecimal !== undefined) {
                vol = Math.max(0, Math.min(1, parseFloat(percentAsDecimal)));
                this.cache_.volume = vol;
                this.techCall_('setVolume', vol);
                if (vol > 0) {
                    this.lastVolume_(vol);
                }
                return;
            }
            vol = parseFloat(this.techGet_('volume'));
            return isNaN(vol) ? 1 : vol;
        }
        muted(muted) {
            if (muted !== undefined) {
                this.techCall_('setMuted', muted);
                return;
            }
            return this.techGet_('muted') || false;
        }
        defaultMuted(defaultMuted) {
            if (defaultMuted !== undefined) {
                return this.techCall_('setDefaultMuted', defaultMuted);
            }
            return this.techGet_('defaultMuted') || false;
        }
        lastVolume_(percentAsDecimal) {
            if (percentAsDecimal !== undefined && percentAsDecimal !== 0) {
                this.cache_.lastVolume = percentAsDecimal;
                return;
            }
            return this.cache_.lastVolume;
        }
        supportsFullScreen() {
            return this.techGet_('supportsFullScreen') || false;
        }
        isFullscreen(isFS) {
            if (isFS !== undefined) {
                const oldValue = this.isFullscreen_;
                this.isFullscreen_ = Boolean(isFS);
                if (this.isFullscreen_ !== oldValue && this.fsApi_.prefixed) {
                    this.trigger('fullscreenchange');
                }
                this.toggleFullscreenClass_();
                return;
            }
            return this.isFullscreen_;
        }
        requestFullscreen(fullscreenOptions) {
            const PromiseClass = this.options_.Promise || window.Promise;
            if (PromiseClass) {
                const self = this;
                return new PromiseClass((resolve, reject) => {
                    function offHandler() {
                        self.off('fullscreenerror', errorHandler);
                        self.off('fullscreenchange', changeHandler);
                    }
                    function changeHandler() {
                        offHandler();
                        resolve();
                    }
                    function errorHandler(e, err) {
                        offHandler();
                        reject(err);
                    }
                    self.one('fullscreenchange', changeHandler);
                    self.one('fullscreenerror', errorHandler);
                    const promise = self.requestFullscreenHelper_(fullscreenOptions);
                    if (promise) {
                        promise.then(offHandler, offHandler);
                        return promise;
                    }
                });
            }
            return this.requestFullscreenHelper_();
        }
        requestFullscreenHelper_(fullscreenOptions) {
            let fsOptions;
            if (!this.fsApi_.prefixed) {
                fsOptions = this.options_.fullscreen && this.options_.fullscreen.options || {};
                if (fullscreenOptions !== undefined) {
                    fsOptions = fullscreenOptions;
                }
            }
            if (this.fsApi_.requestFullscreen) {
                const promise = this.el_[this.fsApi_.requestFullscreen](fsOptions);
                if (promise) {
                    promise.then(() => this.isFullscreen(true), () => this.isFullscreen(false));
                }
                return promise;
            } else if (this.tech_.supportsFullScreen()) {
                this.techCall_('enterFullScreen');
            } else {
                this.enterFullWindow();
            }
        }
        exitFullscreen() {
            const PromiseClass = this.options_.Promise || window.Promise;
            if (PromiseClass) {
                const self = this;
                return new PromiseClass((resolve, reject) => {
                    function offHandler() {
                        self.off('fullscreenerror', errorHandler);
                        self.off('fullscreenchange', changeHandler);
                    }
                    function changeHandler() {
                        offHandler();
                        resolve();
                    }
                    function errorHandler(e, err) {
                        offHandler();
                        reject(err);
                    }
                    self.one('fullscreenchange', changeHandler);
                    self.one('fullscreenerror', errorHandler);
                    const promise = self.exitFullscreenHelper_();
                    if (promise) {
                        promise.then(offHandler, offHandler);
                        return promise;
                    }
                });
            }
            return this.exitFullscreenHelper_();
        }
        exitFullscreenHelper_() {
            if (this.fsApi_.requestFullscreen) {
                const promise = document[this.fsApi_.exitFullscreen]();
                if (promise) {
                    promise.then(() => this.isFullscreen(false));
                }
                return promise;
            } else if (this.tech_.supportsFullScreen()) {
                this.techCall_('exitFullScreen');
            } else {
                this.exitFullWindow();
            }
        }
        enterFullWindow() {
            this.isFullscreen(true);
            this.isFullWindow = true;
            this.docOrigOverflow = document.documentElement.style.overflow;
            Events.on(document, 'keydown', this.boundFullWindowOnEscKey_);
            document.documentElement.style.overflow = 'hidden';
            Dom.addClass(document.body, 'vjs-full-window');
            this.trigger('enterFullWindow');
        }
        fullWindowOnEscKey(event) {
            if (keycode.isEventKey(event, 'Esc')) {
                if (this.isFullscreen() === true) {
                    this.exitFullscreen();
                } else {
                    this.exitFullWindow();
                }
            }
        }
        exitFullWindow() {
            this.isFullscreen(false);
            this.isFullWindow = false;
            Events.off(document, 'keydown', this.boundFullWindowOnEscKey_);
            document.documentElement.style.overflow = this.docOrigOverflow;
            Dom.removeClass(document.body, 'vjs-full-window');
            this.trigger('exitFullWindow');
        }
        disablePictureInPicture(value) {
            if (value === undefined) {
                return this.techGet_('disablePictureInPicture');
            }
            this.techCall_('setDisablePictureInPicture', value);
            this.options_.disablePictureInPicture = value;
            this.trigger('disablepictureinpicturechanged');
        }
        isInPictureInPicture(isPiP) {
            if (isPiP !== undefined) {
                this.isInPictureInPicture_ = !!isPiP;
                this.togglePictureInPictureClass_();
                return;
            }
            return !!this.isInPictureInPicture_;
        }
        requestPictureInPicture() {
            if ('pictureInPictureEnabled' in document && this.disablePictureInPicture() === false) {
                return this.techGet_('requestPictureInPicture');
            }
        }
        exitPictureInPicture() {
            if ('pictureInPictureEnabled' in document) {
                return document.exitPictureInPicture();
            }
        }
        handleKeyDown(event) {
            const {userActions} = this.options_;
            if (!userActions || !userActions.hotkeys) {
                return;
            }
            const excludeElement = el => {
                const tagName = el.tagName.toLowerCase();
                if (el.isContentEditable) {
                    return true;
                }
                const allowedInputTypes = [
                    'button',
                    'checkbox',
                    'hidden',
                    'radio',
                    'reset',
                    'submit'
                ];
                if (tagName === 'input') {
                    return allowedInputTypes.indexOf(el.type) === -1;
                }
                const excludedTags = ['textarea'];
                return excludedTags.indexOf(tagName) !== -1;
            };
            if (excludeElement(this.el_.ownerDocument.activeElement)) {
                return;
            }
            if (typeof userActions.hotkeys === 'function') {
                userActions.hotkeys.call(this, event);
            } else {
                this.handleHotkeys(event);
            }
        }
        handleHotkeys(event) {
            const hotkeys = this.options_.userActions ? this.options_.userActions.hotkeys : {};
            const {fullscreenKey = keydownEvent => keycode.isEventKey(keydownEvent, 'f'), muteKey = keydownEvent => keycode.isEventKey(keydownEvent, 'm'), playPauseKey = keydownEvent => keycode.isEventKey(keydownEvent, 'k') || keycode.isEventKey(keydownEvent, 'Space')} = hotkeys;
            if (fullscreenKey.call(this, event)) {
                event.preventDefault();
                event.stopPropagation();
                const FSToggle = Component.getComponent('FullscreenToggle');
                if (document[this.fsApi_.fullscreenEnabled] !== false) {
                    FSToggle.prototype.handleClick.call(this, event);
                }
            } else if (muteKey.call(this, event)) {
                event.preventDefault();
                event.stopPropagation();
                const MuteToggle = Component.getComponent('MuteToggle');
                MuteToggle.prototype.handleClick.call(this, event);
            } else if (playPauseKey.call(this, event)) {
                event.preventDefault();
                event.stopPropagation();
                const PlayToggle = Component.getComponent('PlayToggle');
                PlayToggle.prototype.handleClick.call(this, event);
            }
        }
        canPlayType(type) {
            let can;
            for (let i = 0, j = this.options_.techOrder; i < j.length; i++) {
                const techName = j[i];
                let tech = Tech.getTech(techName);
                if (!tech) {
                    tech = Component.getComponent(techName);
                }
                if (!tech) {
                    log.error(`The "${ techName }" tech is undefined. Skipped browser support check for that tech.`);
                    continue;
                }
                if (tech.isSupported()) {
                    can = tech.canPlayType(type);
                    if (can) {
                        return can;
                    }
                }
            }
            return '';
        }
        selectSource(sources) {
            const techs = this.options_.techOrder.map(techName => {
                return [
                    techName,
                    Tech.getTech(techName)
                ];
            }).filter(([techName, tech]) => {
                if (tech) {
                    return tech.isSupported();
                }
                log.error(`The "${ techName }" tech is undefined. Skipped browser support check for that tech.`);
                return false;
            });
            const findFirstPassingTechSourcePair = function (outerArray, innerArray, tester) {
                let found;
                outerArray.some(outerChoice => {
                    return innerArray.some(innerChoice => {
                        found = tester(outerChoice, innerChoice);
                        if (found) {
                            return true;
                        }
                    });
                });
                return found;
            };
            let foundSourceAndTech;
            const flip = fn => (a, b) => fn(b, a);
            const finder = ([techName, tech], source) => {
                if (tech.canPlaySource(source, this.options_[techName.toLowerCase()])) {
                    return {
                        source,
                        tech: techName
                    };
                }
            };
            if (this.options_.sourceOrder) {
                foundSourceAndTech = findFirstPassingTechSourcePair(sources, techs, flip(finder));
            } else {
                foundSourceAndTech = findFirstPassingTechSourcePair(techs, sources, finder);
            }
            return foundSourceAndTech || false;
        }
        src(source) {
            if (typeof source === 'undefined') {
                return this.cache_.src || '';
            }
            const sources = filterSource(source);
            if (!sources.length) {
                this.setTimeout(function () {
                    this.error({
                        code: 4,
                        message: this.localize(this.options_.notSupportedMessage)
                    });
                }, 0);
                return;
            }
            this.changingSrc_ = true;
            this.cache_.sources = sources;
            this.updateSourceCaches_(sources[0]);
            middleware.setSource(this, sources[0], (middlewareSource, mws) => {
                this.middleware_ = mws;
                this.cache_.sources = sources;
                this.updateSourceCaches_(middlewareSource);
                const err = this.src_(middlewareSource);
                if (err) {
                    if (sources.length > 1) {
                        return this.src(sources.slice(1));
                    }
                    this.changingSrc_ = false;
                    this.setTimeout(function () {
                        this.error({
                            code: 4,
                            message: this.localize(this.options_.notSupportedMessage)
                        });
                    }, 0);
                    this.triggerReady();
                    return;
                }
                middleware.setTech(mws, this.tech_);
            });
        }
        src_(source) {
            const sourceTech = this.selectSource([source]);
            if (!sourceTech) {
                return true;
            }
            if (!stringCases.titleCaseEquals(sourceTech.tech, this.techName_)) {
                this.changingSrc_ = true;
                this.loadTech_(sourceTech.tech, sourceTech.source);
                this.tech_.ready(() => {
                    this.changingSrc_ = false;
                });
                return false;
            }
            this.ready(function () {
                if (this.tech_.constructor.prototype.hasOwnProperty('setSource')) {
                    this.techCall_('setSource', source);
                } else {
                    this.techCall_('src', source.src);
                }
                this.changingSrc_ = false;
            }, true);
            return false;
        }
        load() {
            this.techCall_('load');
        }
        reset() {
            const PromiseClass = this.options_.Promise || window.Promise;
            if (this.paused() || !PromiseClass) {
                this.doReset_();
            } else {
                const playPromise = this.play();
                promise.silencePromise(playPromise.then(() => this.doReset_()));
            }
        }
        doReset_() {
            if (this.tech_) {
                this.tech_.clearTracks('text');
            }
            this.resetCache_();
            this.poster('');
            this.loadTech_(this.options_.techOrder[0], null);
            this.techCall_('reset');
            this.resetControlBarUI_();
            if (evented.isEvented(this)) {
                this.trigger('playerreset');
            }
        }
        resetControlBarUI_() {
            this.resetProgressBar_();
            this.resetPlaybackRate_();
            this.resetVolumeBar_();
        }
        resetProgressBar_() {
            this.currentTime(0);
            const {durationDisplay, remainingTimeDisplay} = this.controlBar;
            if (durationDisplay) {
                durationDisplay.updateContent();
            }
            if (remainingTimeDisplay) {
                remainingTimeDisplay.updateContent();
            }
        }
        resetPlaybackRate_() {
            this.playbackRate(this.defaultPlaybackRate());
            this.handleTechRateChange_();
        }
        resetVolumeBar_() {
            this.volume(1);
            this.trigger('volumechange');
        }
        currentSources() {
            const source = this.currentSource();
            const sources = [];
            if (Object.keys(source).length !== 0) {
                sources.push(source);
            }
            return this.cache_.sources || sources;
        }
        currentSource() {
            return this.cache_.source || {};
        }
        currentSrc() {
            return this.currentSource() && this.currentSource().src || '';
        }
        currentType() {
            return this.currentSource() && this.currentSource().type || '';
        }
        preload(value) {
            if (value !== undefined) {
                this.techCall_('setPreload', value);
                this.options_.preload = value;
                return;
            }
            return this.techGet_('preload');
        }
        autoplay(value) {
            if (value === undefined) {
                return this.options_.autoplay || false;
            }
            let techAutoplay;
            if (typeof value === 'string' && /(any|play|muted)/.test(value)) {
                this.options_.autoplay = value;
                this.manualAutoplay_(value);
                techAutoplay = false;
            } else if (!value) {
                this.options_.autoplay = false;
            } else {
                this.options_.autoplay = true;
            }
            techAutoplay = typeof techAutoplay === 'undefined' ? this.options_.autoplay : techAutoplay;
            if (this.tech_) {
                this.techCall_('setAutoplay', techAutoplay);
            }
        }
        playsinline(value) {
            if (value !== undefined) {
                this.techCall_('setPlaysinline', value);
                this.options_.playsinline = value;
                return this;
            }
            return this.techGet_('playsinline');
        }
        loop(value) {
            if (value !== undefined) {
                this.techCall_('setLoop', value);
                this.options_.loop = value;
                return;
            }
            return this.techGet_('loop');
        }
        poster(src) {
            if (src === undefined) {
                return this.poster_;
            }
            if (!src) {
                src = '';
            }
            if (src === this.poster_) {
                return;
            }
            this.poster_ = src;
            this.techCall_('setPoster', src);
            this.isPosterFromTech_ = false;
            this.trigger('posterchange');
        }
        handleTechPosterChange_() {
            if ((!this.poster_ || this.options_.techCanOverridePoster) && this.tech_ && this.tech_.poster) {
                const newPoster = this.tech_.poster() || '';
                if (newPoster !== this.poster_) {
                    this.poster_ = newPoster;
                    this.isPosterFromTech_ = true;
                    this.trigger('posterchange');
                }
            }
        }
        controls(bool) {
            if (bool === undefined) {
                return !!this.controls_;
            }
            bool = !!bool;
            if (this.controls_ === bool) {
                return;
            }
            this.controls_ = bool;
            if (this.usingNativeControls()) {
                this.techCall_('setControls', bool);
            }
            if (this.controls_) {
                this.removeClass('vjs-controls-disabled');
                this.addClass('vjs-controls-enabled');
                this.trigger('controlsenabled');
                if (!this.usingNativeControls()) {
                    this.addTechControlsListeners_();
                }
            } else {
                this.removeClass('vjs-controls-enabled');
                this.addClass('vjs-controls-disabled');
                this.trigger('controlsdisabled');
                if (!this.usingNativeControls()) {
                    this.removeTechControlsListeners_();
                }
            }
        }
        usingNativeControls(bool) {
            if (bool === undefined) {
                return !!this.usingNativeControls_;
            }
            bool = !!bool;
            if (this.usingNativeControls_ === bool) {
                return;
            }
            this.usingNativeControls_ = bool;
            if (this.usingNativeControls_) {
                this.addClass('vjs-using-native-controls');
                this.trigger('usingnativecontrols');
            } else {
                this.removeClass('vjs-using-native-controls');
                this.trigger('usingcustomcontrols');
            }
        }
        error(err) {
            if (err === undefined) {
                return this.error_ || null;
            }
            if (this.options_.suppressNotSupportedError && err && err.code === 4) {
                const triggerSuppressedError = function () {
                    this.error(err);
                };
                this.options_.suppressNotSupportedError = false;
                this.any([
                    'click',
                    'touchstart'
                ], triggerSuppressedError);
                this.one('loadstart', function () {
                    this.off([
                        'click',
                        'touchstart'
                    ], triggerSuppressedError);
                });
                return;
            }
            if (err === null) {
                this.error_ = err;
                this.removeClass('vjs-error');
                if (this.errorDisplay) {
                    this.errorDisplay.close();
                }
                return;
            }
            this.error_ = new MediaError(err);
            this.addClass('vjs-error');
            log.error(`(CODE:${ this.error_.code } ${ MediaError.errorTypes[this.error_.code] })`, this.error_.message, this.error_);
            this.trigger('error');
            return;
        }
        reportUserActivity(event) {
            this.userActivity_ = true;
        }
        userActive(bool) {
            if (bool === undefined) {
                return this.userActive_;
            }
            bool = !!bool;
            if (bool === this.userActive_) {
                return;
            }
            this.userActive_ = bool;
            if (this.userActive_) {
                this.userActivity_ = true;
                this.removeClass('vjs-user-inactive');
                this.addClass('vjs-user-active');
                this.trigger('useractive');
                return;
            }
            if (this.tech_) {
                this.tech_.one('mousemove', function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                });
            }
            this.userActivity_ = false;
            this.removeClass('vjs-user-active');
            this.addClass('vjs-user-inactive');
            this.trigger('userinactive');
        }
        listenForUserActivity_() {
            let mouseInProgress;
            let lastMoveX;
            let lastMoveY;
            const handleActivity = Fn.bind(this, this.reportUserActivity);
            const handleMouseMove = function (e) {
                if (e.screenX !== lastMoveX || e.screenY !== lastMoveY) {
                    lastMoveX = e.screenX;
                    lastMoveY = e.screenY;
                    handleActivity();
                }
            };
            const handleMouseDown = function () {
                handleActivity();
                this.clearInterval(mouseInProgress);
                mouseInProgress = this.setInterval(handleActivity, 250);
            };
            const handleMouseUpAndMouseLeave = function (event) {
                handleActivity();
                this.clearInterval(mouseInProgress);
            };
            this.on('mousedown', handleMouseDown);
            this.on('mousemove', handleMouseMove);
            this.on('mouseup', handleMouseUpAndMouseLeave);
            this.on('mouseleave', handleMouseUpAndMouseLeave);
            const controlBar = this.getChild('controlBar');
            if (controlBar && !browser.IS_IOS && !browser.IS_ANDROID) {
                controlBar.on('mouseenter', function (event) {
                    this.player().cache_.inactivityTimeout = this.player().options_.inactivityTimeout;
                    this.player().options_.inactivityTimeout = 0;
                });
                controlBar.on('mouseleave', function (event) {
                    this.player().options_.inactivityTimeout = this.player().cache_.inactivityTimeout;
                });
            }
            this.on('keydown', handleActivity);
            this.on('keyup', handleActivity);
            let inactivityTimeout;
            this.setInterval(function () {
                if (!this.userActivity_) {
                    return;
                }
                this.userActivity_ = false;
                this.userActive(true);
                this.clearTimeout(inactivityTimeout);
                const timeout = this.options_.inactivityTimeout;
                if (timeout <= 0) {
                    return;
                }
                inactivityTimeout = this.setTimeout(function () {
                    if (!this.userActivity_) {
                        this.userActive(false);
                    }
                }, timeout);
            }, 250);
        }
        playbackRate(rate) {
            if (rate !== undefined) {
                this.techCall_('setPlaybackRate', rate);
                return;
            }
            if (this.tech_ && this.tech_.featuresPlaybackRate) {
                return this.cache_.lastPlaybackRate || this.techGet_('playbackRate');
            }
            return 1;
        }
        defaultPlaybackRate(rate) {
            if (rate !== undefined) {
                return this.techCall_('setDefaultPlaybackRate', rate);
            }
            if (this.tech_ && this.tech_.featuresPlaybackRate) {
                return this.techGet_('defaultPlaybackRate');
            }
            return 1;
        }
        isAudio(bool) {
            if (bool !== undefined) {
                this.isAudio_ = !!bool;
                return;
            }
            return !!this.isAudio_;
        }
        addTextTrack(kind, label, language) {
            if (this.tech_) {
                return this.tech_.addTextTrack(kind, label, language);
            }
        }
        addRemoteTextTrack(options, manualCleanup) {
            if (this.tech_) {
                return this.tech_.addRemoteTextTrack(options, manualCleanup);
            }
        }
        removeRemoteTextTrack(obj = {}) {
            let {track} = obj;
            if (!track) {
                track = obj;
            }
            if (this.tech_) {
                return this.tech_.removeRemoteTextTrack(track);
            }
        }
        getVideoPlaybackQuality() {
            return this.techGet_('getVideoPlaybackQuality');
        }
        videoWidth() {
            return this.tech_ && this.tech_.videoWidth && this.tech_.videoWidth() || 0;
        }
        videoHeight() {
            return this.tech_ && this.tech_.videoHeight && this.tech_.videoHeight() || 0;
        }
        language(code) {
            if (code === undefined) {
                return this.language_;
            }
            if (this.language_ !== String(code).toLowerCase()) {
                this.language_ = String(code).toLowerCase();
                if (evented.isEvented(this)) {
                    this.trigger('languagechange');
                }
            }
        }
        languages() {
            return mergeOptions(Player.prototype.options_.languages, this.languages_);
        }
        toJSON() {
            const options = mergeOptions(this.options_);
            const tracks = options.tracks;
            options.tracks = [];
            for (let i = 0; i < tracks.length; i++) {
                let track = tracks[i];
                track = mergeOptions(track);
                track.player = undefined;
                options.tracks[i] = track;
            }
            return options;
        }
        createModal(content, options) {
            options = options || {};
            options.content = content || '';
            const modal = new ModalDialog(this, options);
            this.addChild(modal);
            modal.on('dispose', () => {
                this.removeChild(modal);
            });
            modal.open();
            return modal;
        }
        updateCurrentBreakpoint_() {
            if (!this.responsive()) {
                return;
            }
            const currentBreakpoint = this.currentBreakpoint();
            const currentWidth = this.currentWidth();
            for (let i = 0; i < BREAKPOINT_ORDER.length; i++) {
                const candidateBreakpoint = BREAKPOINT_ORDER[i];
                const maxWidth = this.breakpoints_[candidateBreakpoint];
                if (currentWidth <= maxWidth) {
                    if (currentBreakpoint === candidateBreakpoint) {
                        return;
                    }
                    if (currentBreakpoint) {
                        this.removeClass(BREAKPOINT_CLASSES[currentBreakpoint]);
                    }
                    this.addClass(BREAKPOINT_CLASSES[candidateBreakpoint]);
                    this.breakpoint_ = candidateBreakpoint;
                    break;
                }
            }
        }
        removeCurrentBreakpoint_() {
            const className = this.currentBreakpointClass();
            this.breakpoint_ = '';
            if (className) {
                this.removeClass(className);
            }
        }
        breakpoints(breakpoints) {
            if (breakpoints === undefined) {
                return obj.assign(this.breakpoints_);
            }
            this.breakpoint_ = '';
            this.breakpoints_ = obj.assign({}, DEFAULT_BREAKPOINTS, breakpoints);
            this.updateCurrentBreakpoint_();
            return obj.assign(this.breakpoints_);
        }
        responsive(value) {
            if (value === undefined) {
                return this.responsive_;
            }
            value = Boolean(value);
            const current = this.responsive_;
            if (value === current) {
                return;
            }
            this.responsive_ = value;
            if (value) {
                this.on('playerresize', this.updateCurrentBreakpoint_);
                this.updateCurrentBreakpoint_();
            } else {
                this.off('playerresize', this.updateCurrentBreakpoint_);
                this.removeCurrentBreakpoint_();
            }
            return value;
        }
        currentBreakpoint() {
            return this.breakpoint_;
        }
        currentBreakpointClass() {
            return BREAKPOINT_CLASSES[this.breakpoint_] || '';
        }
        loadMedia(media, ready) {
            if (!media || typeof media !== 'object') {
                return;
            }
            this.reset();
            this.cache_.media = mergeOptions(media);
            const {artwork, poster, src, textTracks} = this.cache_.media;
            if (!artwork && poster) {
                this.cache_.media.artwork = [{
                        src: poster,
                        type: mimetypes.getMimetype(poster)
                    }];
            }
            if (src) {
                this.src(src);
            }
            if (poster) {
                this.poster(poster);
            }
            if (Array.isArray(textTracks)) {
                textTracks.forEach(tt => this.addRemoteTextTrack(tt, false));
            }
            this.ready(ready);
        }
        getMedia() {
            if (!this.cache_.media) {
                const poster = this.poster();
                const src = this.currentSources();
                const textTracks = Array.prototype.map.call(this.remoteTextTracks(), tt => ({
                    kind: tt.kind,
                    label: tt.label,
                    language: tt.language,
                    src: tt.src
                }));
                const media = {
                    src,
                    textTracks
                };
                if (poster) {
                    media.poster = poster;
                    media.artwork = [{
                            src: media.poster,
                            type: mimetypes.getMimetype(media.poster)
                        }];
                }
                return media;
            }
            return mergeOptions(this.cache_.media);
        }
        static getTagSettings(tag) {
            const baseOptions = {
                sources: [],
                tracks: []
            };
            const tagOptions = Dom.getAttributes(tag);
            const dataSetup = tagOptions['data-setup'];
            if (Dom.hasClass(tag, 'vjs-fill')) {
                tagOptions.fill = true;
            }
            if (Dom.hasClass(tag, 'vjs-fluid')) {
                tagOptions.fluid = true;
            }
            if (dataSetup !== null) {
                const [err, data] = safeParseTuple(dataSetup || '{}');
                if (err) {
                    log.error(err);
                }
                obj.assign(tagOptions, data);
            }
            obj.assign(baseOptions, tagOptions);
            if (tag.hasChildNodes()) {
                const children = tag.childNodes;
                for (let i = 0, j = children.length; i < j; i++) {
                    const child = children[i];
                    const childName = child.nodeName.toLowerCase();
                    if (childName === 'source') {
                        baseOptions.sources.push(Dom.getAttributes(child));
                    } else if (childName === 'track') {
                        baseOptions.tracks.push(Dom.getAttributes(child));
                    }
                }
            }
            return baseOptions;
        }
        flexNotSupported_() {
            const elem = document.createElement('i');
            return !('flexBasis' in elem.style || 'webkitFlexBasis' in elem.style || 'mozFlexBasis' in elem.style || 'msFlexBasis' in elem.style || 'msFlexOrder' in elem.style);
        }
        debug(enabled) {
            if (enabled === undefined) {
                return this.debugEnabled_;
            }
            if (enabled) {
                this.trigger('debugon');
                this.previousLogLevel_ = this.log.level;
                this.log.level('debug');
                this.debugEnabled_ = true;
            } else {
                this.trigger('debugoff');
                this.log.level(this.previousLogLevel_);
                this.previousLogLevel_ = undefined;
                this.debugEnabled_ = false;
            }
        }
    }
    TRACK_TYPES.names.forEach(function (name) {
        const props = TRACK_TYPES[name];
        Player.prototype[props.getterName] = function () {
            if (this.tech_) {
                return this.tech_[props.getterName]();
            }
            this[props.privateName] = this[props.privateName] || new props.ListClass();
            return this[props.privateName];
        };
    });
    Player.prototype.crossorigin = Player.prototype.crossOrigin;
    Player.players = {};
    const navigator = window.navigator;
    Player.prototype.options_ = {
        techOrder: Tech.defaultTechOrder_,
        html5: {},
        inactivityTimeout: 2000,
        playbackRates: [],
        liveui: false,
        children: [
            'mediaLoader',
            'posterImage',
            'textTrackDisplay',
            'loadingSpinner',
            'bigPlayButton',
            'liveTracker',
            'controlBar',
            'errorDisplay',
            'textTrackSettings',
            'resizeManager'
        ],
        language: navigator && (navigator.languages && navigator.languages[0] || navigator.userLanguage || navigator.language) || 'en',
        languages: {},
        notSupportedMessage: 'No compatible source was found for this media.',
        fullscreen: { options: { navigationUI: 'hide' } },
        breakpoints: {},
        responsive: false
    };
    [
        'ended',
        'seeking',
        'seekable',
        'networkState',
        'readyState'
    ].forEach(function (fn) {
        Player.prototype[fn] = function () {
            return this.techGet_(fn);
        };
    });
    TECH_EVENTS_RETRIGGER.forEach(function (event) {
        Player.prototype[`handleTech${ stringCases.toTitleCase(event) }_`] = function () {
            return this.trigger(event);
        };
    });
    Component.registerComponent('Player', Player);
    return Player;
});