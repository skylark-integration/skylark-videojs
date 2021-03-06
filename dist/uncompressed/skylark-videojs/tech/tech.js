define([
    'skylark-langx-globals/window',
    'skylark-langx-globals/document',
    '../component',
    '../utils/merge-options',
    '../utils/fn',
    '../utils/log',
    '../utils/time-ranges',
    '../utils/buffer',
    '../media-error',
    '../utils/obj',
    '../tracks/track-types',
    '../utils/string-cases',
    'skylark-videojs-vtt'
], function (window, document, Component, mergeOptions, Fn, log, timeRages, buffer, MediaError, obj, TRACK_TYPES, stringCases, vtt) {
    'use strict';
    function createTrackHelper(self, kind, label, language, options = {}) {
        const tracks = self.textTracks();
        options.kind = kind;
        if (label) {
            options.label = label;
        }
        if (language) {
            options.language = language;
        }
        options.tech = self;
        const track = new TRACK_TYPES.ALL.text.TrackClass(options);
        tracks.addTrack(track);
        return track;
    }
    class Tech extends Component {
        constructor(options = {}, ready = function () {
        }) {
            options.reportTouchActivity = false;
            super(null, options, ready);
            this.hasStarted_ = false;
            this.listenTo('playing', function () {
                this.hasStarted_ = true;
            });
            this.listenTo('loadstart', function () {
                this.hasStarted_ = false;
            });
            TRACK_TYPES.ALL.names.forEach(name => {
                const props = TRACK_TYPES.ALL[name];
                if (options && options[props.getterName]) {
                    this[props.privateName] = options[props.getterName];
                }
            });
            if (!this.featuresProgressEvents) {
                this.manualProgressOn();
            }
            if (!this.featuresTimeupdateEvents) {
                this.manualTimeUpdatesOn();
            }
            [
                'Text',
                'Audio',
                'Video'
            ].forEach(track => {
                if (options[`native${ track }Tracks`] === false) {
                    this[`featuresNative${ track }Tracks`] = false;
                }
            });
            if (options.nativeCaptions === false || options.nativeTextTracks === false) {
                this.featuresNativeTextTracks = false;
            } else if (options.nativeCaptions === true || options.nativeTextTracks === true) {
                this.featuresNativeTextTracks = true;
            }
            if (!this.featuresNativeTextTracks) {
                this.emulateTextTracks();
            }
            this.preloadTextTracks = options.preloadTextTracks !== false;
            this.autoRemoteTextTracks_ = new TRACK_TYPES.ALL.text.ListClass();
            this.initTrackListeners();
            if (!options.nativeControlsForTouch) {
                this.emitTapEvents();
            }
            if (this.constructor) {
                this.name_ = this.constructor.name || 'Unknown Tech';
            }
        }
        triggerSourceset(src) {
            if (!this.isReady_) {
                this.listenToOnce('ready', () => this.setTimeout(() => this.triggerSourceset(src), 1));
            }
            this.trigger({
                src,
                type: 'sourceset'
            });
        }
        manualProgressOn() {
            this.listenTo('durationchange', this.listenToDurationChange);
            this.manualProgress = true;
            this.listenToOnce('ready', this.trackProgress);
        }
        manualProgressOff() {
            this.manualProgress = false;
            this.stopTrackingProgress();
            this.unlistenTo('durationchange', this.listenToDurationChange);
        }
        trackProgress(event) {
            this.stopTrackingProgress();
            this.progressInterval = this.setInterval(Fn.bind(this, function () {
                const numBufferedPercent = this.undefined();
                if (this.bufferedPercent_ !== numBufferedPercent) {
                    this.trigger('progress');
                }
                this.bufferedPercent_ = numBufferedPercent;
                if (numBufferedPercent === 1) {
                    this.stopTrackingProgress();
                }
            }), 500);
        }
        onDurationChange(event) {
            this.duration_ = this.duration();
        }
        buffered() {
            return timeRages.createTimeRange(0, 0);
        }
        bufferedPercent() {
            return buffer.bufferedPercent(this.buffered(), this.duration_);
        }
        stopTrackingProgress() {
            this.clearInterval(this.progressInterval);
        }
        manualTimeUpdatesOn() {
            this.manualTimeUpdates = true;
            this.listenTo('play', this.trackCurrentTime);
            this.listenTo('pause', this.stopTrackingCurrentTime);
        }
        manualTimeUpdatesOff() {
            this.manualTimeUpdates = false;
            this.stopTrackingCurrentTime();
            this.unlistenTo('play', this.trackCurrentTime);
            this.unlistenTo('pause', this.stopTrackingCurrentTime);
        }
        trackCurrentTime() {
            if (this.currentTimeInterval) {
                this.stopTrackingCurrentTime();
            }
            this.currentTimeInterval = this.setInterval(function () {
                this.trigger({
                    type: 'timeupdate',
                    target: this,
                    manuallyTriggered: true
                });
            }, 250);
        }
        stopTrackingCurrentTime() {
            this.clearInterval(this.currentTimeInterval);
            this.trigger({
                type: 'timeupdate',
                target: this,
                manuallyTriggered: true
            });
        }
        dispose() {
            this.clearTracks(TRACK_TYPES.NORMAL.names);
            if (this.manualProgress) {
                this.manualProgressOff();
            }
            if (this.manualTimeUpdates) {
                this.manualTimeUpdatesOff();
            }
            super.dispose();
        }
        clearTracks(types) {
            types = [].concat(types);
            types.forEach(type => {
                const list = this[`${ type }Tracks`]() || [];
                let i = list.length;
                while (i--) {
                    const track = list[i];
                    if (type === 'text') {
                        this.removeRemoteTextTrack(track);
                    }
                    list.removeTrack(track);
                }
            });
        }
        cleanupAutoTextTracks() {
            const list = this.autoRemoteTextTracks_ || [];
            let i = list.length;
            while (i--) {
                const track = list[i];
                this.removeRemoteTextTrack(track);
            }
        }
        reset() {
        }
        crossOrigin() {
        }
        setCrossOrigin() {
        }
        error(err) {
            if (err !== undefined) {
                this.error_ = new MediaError(err);
                this.trigger('error');
            }
            return this.error_;
        }
        played() {
            if (this.hasStarted_) {
                return timeRages.createTimeRange(0, 0);
            }
            return timeRages.createTimeRange();
        }
        play() {
        }
        setScrubbing() {
        }
        scrubbing() {
        }
        setCurrentTime() {
            if (this.manualTimeUpdates) {
                this.trigger({
                    type: 'timeupdate',
                    target: this,
                    manuallyTriggered: true
                });
            }
        }
        initTrackListeners() {
            TRACK_TYPES.NORMAL.names.forEach(name => {
                const props = TRACK_TYPES.NORMAL[name];
                const trackListChanges = () => {
                    this.trigger(`${ name }trackchange`);
                };
                const tracks = this[props.getterName]();
                tracks.addEventListener('removetrack', trackListChanges);
                tracks.addEventListener('addtrack', trackListChanges);
                this.listenTo('dispose', () => {
                    tracks.removeEventListener('removetrack', trackListChanges);
                    tracks.removeEventListener('addtrack', trackListChanges);
                });
            });
        }
        addWebVttScript_() {
            if (window.WebVTT) {
                return;
            }
            if (document.body.contains(this.el())) {
                if (!this.options_['vtt.js'] && obj.isPlain(vtt) && Object.keys(vtt).length > 0) {
                    this.trigger('vttjsloaded');
                    return;
                }
                const script = document.createElement('script');
                script.src = this.options_['vtt.js'] || 'https://vjs.zencdn.net/vttjs/0.14.1/vtt.min.js';
                script.onload = () => {
                    this.trigger('vttjsloaded');
                };
                script.onerror = () => {
                    this.trigger('vttjserror');
                };
                this.listenTo('dispose', () => {
                    script.onload = null;
                    script.onerror = null;
                });
                window.WebVTT = true;
                this.el().parentNode.appendChild(script);
            } else {
                this.ready(this.addWebVttScript_);
            }
        }
        emulateTextTracks() {
            const tracks = this.textTracks();
            const remoteTracks = this.remoteTextTracks();
            const handleAddTrack = e => tracks.addTrack(e.track);
            const handleRemoveTrack = e => tracks.removeTrack(e.track);
            remoteTracks.on('addtrack', handleAddTrack);
            remoteTracks.on('removetrack', handleRemoveTrack);
            this.addWebVttScript_();
            const updateDisplay = () => this.trigger('texttrackchange');
            const textTracksChanges = () => {
                updateDisplay();
                for (let i = 0; i < tracks.length; i++) {
                    const track = tracks[i];
                    track.removeEventListener('cuechange', updateDisplay);
                    if (track.mode === 'showing') {
                        track.addEventListener('cuechange', updateDisplay);
                    }
                }
            };
            textTracksChanges();
            tracks.addEventListener('change', textTracksChanges);
            tracks.addEventListener('addtrack', textTracksChanges);
            tracks.addEventListener('removetrack', textTracksChanges);
            this.listenTo('dispose', function () {
                remoteTracks.off('addtrack', handleAddTrack);
                remoteTracks.off('removetrack', handleRemoveTrack);
                tracks.removeEventListener('change', textTracksChanges);
                tracks.removeEventListener('addtrack', textTracksChanges);
                tracks.removeEventListener('removetrack', textTracksChanges);
                for (let i = 0; i < tracks.length; i++) {
                    const track = tracks[i];
                    track.removeEventListener('cuechange', updateDisplay);
                }
            });
        }
        addTextTrack(kind, label, language) {
            if (!kind) {
                throw new Error('TextTrack kind is required but was not provided');
            }
            return createTrackHelper(this, kind, label, language);
        }
        createRemoteTextTrack(options) {
            const track = mergeOptions(options, { tech: this });
            return new TRACK_TYPES.REMOTE.remoteTextEl.TrackClass(track);
        }
        addRemoteTextTrack(options = {}, manualCleanup) {
            const htmlTrackElement = this.createRemoteTextTrack(options);
            if (manualCleanup !== true && manualCleanup !== false) {
                log.warn('Calling addRemoteTextTrack without explicitly setting the "manualCleanup" parameter to `true` is deprecated and default to `false` in future version of video.js');
                manualCleanup = true;
            }
            this.remoteTextTrackEls().addTrackElement_(htmlTrackElement);
            this.remoteTextTracks().addTrack(htmlTrackElement.track);
            if (manualCleanup !== true) {
                this.ready(() => this.autoRemoteTextTracks_.addTrack(htmlTrackElement.track));
            }
            return htmlTrackElement;
        }
        removeRemoteTextTrack(track) {
            const trackElement = this.remoteTextTrackEls().getTrackElementByTrack_(track);
            this.remoteTextTrackEls().removeTrackElement_(trackElement);
            this.remoteTextTracks().removeTrack(track);
            this.autoRemoteTextTracks_.removeTrack(track);
        }
        getVideoPlaybackQuality() {
            return {};
        }
        requestPictureInPicture() {
            const PromiseClass = this.options_.Promise || window.Promise;
            if (PromiseClass) {
                return PromiseClass.reject();
            }
        }
        disablePictureInPicture() {
            return true;
        }
        setDisablePictureInPicture() {
        }
        setPoster() {
        }
        playsinline() {
        }
        setPlaysinline() {
        }
        overrideNativeAudioTracks() {
        }
        overrideNativeVideoTracks() {
        }
        canPlayType() {
            return '';
        }
        static canPlayType() {
            return '';
        }
        static canPlaySource(srcObj, options) {
            return Tech.canPlayType(srcObj.type);
        }
        static isTech(component) {
            return component.prototype instanceof Tech || component instanceof Tech || component === Tech;
        }
        static registerTech(name, tech) {
            if (!Tech.techs_) {
                Tech.techs_ = {};
            }
            if (!Tech.isTech(tech)) {
                throw new Error(`Tech ${ name } must be a Tech`);
            }
            if (!Tech.canPlayType) {
                throw new Error('Techs must have a static canPlayType method on them');
            }
            if (!Tech.canPlaySource) {
                throw new Error('Techs must have a static canPlaySource method on them');
            }
            name = stringCases.toTitleCase(name);
            Tech.techs_[name] = tech;
            Tech.techs_[stringCases.toLowerCase(name)] = tech;
            if (name !== 'Tech') {
                Tech.defaultTechOrder_.push(name);
            }
            return tech;
        }
        static getTech(name) {
            if (!name) {
                return;
            }
            if (Tech.techs_ && Tech.techs_[name]) {
                return Tech.techs_[name];
            }
            name = stringCases.toTitleCase(name);
            if (window && window.videojs && window.videojs[name]) {
                log.warn(`The ${ name } tech was added to the videojs object when it should be registered using videojs.registerTech(name, tech)`);
                return window.videojs[name];
            }
        }
    }
    TRACK_TYPES.ALL.names.forEach(function (name) {
        const props = TRACK_TYPES.ALL[name];
        Tech.prototype[props.getterName] = function () {
            this[props.privateName] = this[props.privateName] || new props.ListClass();
            return this[props.privateName];
        };
    });
    Tech.prototype.featuresVolumeControl = true;
    Tech.prototype.featuresMuteControl = true;
    Tech.prototype.featuresFullscreenResize = false;
    Tech.prototype.featuresPlaybackRate = false;
    Tech.prototype.featuresProgressEvents = false;
    Tech.prototype.featuresSourceset = false;
    Tech.prototype.featuresTimeupdateEvents = false;
    Tech.prototype.featuresNativeTextTracks = false;
    Tech.withSourceHandlers = function (_Tech) {
        _Tech.registerSourceHandler = function (handler, index) {
            let handlers = _Tech.sourceHandlers;
            if (!handlers) {
                handlers = _Tech.sourceHandlers = [];
            }
            if (index === undefined) {
                index = handlers.length;
            }
            handlers.splice(index, 0, handler);
        };
        _Tech.canPlayType = function (type) {
            const handlers = _Tech.sourceHandlers || [];
            let can;
            for (let i = 0; i < handlers.length; i++) {
                can = handlers[i].canPlayType(type);
                if (can) {
                    return can;
                }
            }
            return '';
        };
        _Tech.selectSourceHandler = function (source, options) {
            const handlers = _Tech.sourceHandlers || [];
            let can;
            for (let i = 0; i < handlers.length; i++) {
                can = handlers[i].canHandleSource(source, options);
                if (can) {
                    return handlers[i];
                }
            }
            return null;
        };
        _Tech.canPlaySource = function (srcObj, options) {
            const sh = _Tech.selectSourceHandler(srcObj, options);
            if (sh) {
                return sh.canHandleSource(srcObj, options);
            }
            return '';
        };
        const deferrable = [
            'seekable',
            'seeking',
            'duration'
        ];
        deferrable.forEach(function (fnName) {
            const originalFn = this[fnName];
            if (typeof originalFn !== 'function') {
                return;
            }
            this[fnName] = function () {
                if (this.sourceHandler_ && this.sourceHandler_[fnName]) {
                    return this.sourceHandler_[fnName].apply(this.sourceHandler_, arguments);
                }
                return originalFn.apply(this, arguments);
            };
        }, _Tech.prototype);
        _Tech.prototype.setSource = function (source) {
            let sh = _Tech.selectSourceHandler(source, this.options_);
            if (!sh) {
                if (_Tech.nativeSourceHandler) {
                    sh = _Tech.nativeSourceHandler;
                } else {
                    log.error('No source handler found for the current source.');
                }
            }
            this.disposeSourceHandler();
            this.unlistenTo('dispose', this.disposeSourceHandler);
            if (sh !== _Tech.nativeSourceHandler) {
                this.currentSource_ = source;
            }
            this.sourceHandler_ = sh.handleSource(source, this, this.options_);
            this.listenToOnce('dispose', this.disposeSourceHandler);
        };
        _Tech.prototype.disposeSourceHandler = function () {
            if (this.currentSource_) {
                this.clearTracks([
                    'audio',
                    'video'
                ]);
                this.currentSource_ = null;
            }
            this.cleanupAutoTextTracks();
            if (this.sourceHandler_) {
                if (this.sourceHandler_.dispose) {
                    this.sourceHandler_.dispose();
                }
                this.sourceHandler_ = null;
            }
        };
    };
    Component.registerComponent('Tech', Tech);
    Tech.registerTech('Tech', Tech);
    Tech.defaultTechOrder_ = [];
    return Tech;
});