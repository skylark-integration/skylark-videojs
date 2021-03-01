define([
    'skylark-videojs-vtt',
    './text-track-cue-list',
    '../utils/fn',
    './track-enums',
    '../utils/log',
    './track',
    '../utils/url',
    '../utils/xhr',
    '../utils/merge-options'
], function (vtt,TextTrackCueList, Fn, TrackEnums, log, Track, url, XHR, merge) {
    'use strict';
    const parseCues = function (srcContent, track) {
        const parser = new vtt.WebVTT.Parser(window, vtt, vtt.WebVTT.StringDecoder());
        const errors = [];
        parser.oncue = function (cue) {
            track.addCue(cue);
        };
        parser.onparsingerror = function (error) {
            errors.push(error);
        };
        parser.onflush = function () {
            track.trigger({
                type: 'loadeddata',
                target: track
            });
        };
        parser.parse(srcContent);
        if (errors.length > 0) {
            if (window.console && window.console.groupCollapsed) {
                window.console.groupCollapsed(`Text Track parsing errors for ${ track.src }`);
            }
            errors.forEach(error => log.error(error));
            if (window.console && window.console.groupEnd) {
                window.console.groupEnd();
            }
        }
        parser.flush();
    };
    const loadTrack = function (src, track) {
        const opts = { uri: src };
        const crossOrigin = url.isCrossOrigin(src);
        if (crossOrigin) {
            opts.cors = crossOrigin;
        }
        const withCredentials = track.tech_.crossOrigin() === 'use-credentials';
        if (withCredentials) {
            opts.withCredentials = withCredentials;
        }
        XHR(opts, Fn.bind(this, function (err, response, responseBody) {
            if (err) {
                return log.error(err, response);
            }
            track.loaded_ = true;
            if (typeof vtt.WebVTT !== 'function') {
                if (track.tech_) {
                    track.tech_.any([
                        'vttjsloaded',
                        'vttjserror'
                    ], event => {
                        if (event.type === 'vttjserror') {
                            log.error(`vttjs failed to load, stopping trying to process ${ track.src }`);
                            return;
                        }
                        return parseCues(responseBody, track);
                    });
                }
            } else {
                parseCues(responseBody, track);
            }
        }));
    };
    class TextTrack extends Track {
        constructor(options = {}) {
            if (!options.tech) {
                throw new Error('A tech was not provided.');
            }
            const settings = merge(options, {
                kind: TrackEnums.TextTrackKind[options.kind] || 'subtitles',
                language: options.language || options.srclang || ''
            });
            let mode = TrackEnums.TextTrackMode[settings.mode] || 'disabled';
            const default_ = settings.default;
            if (settings.kind === 'metadata' || settings.kind === 'chapters') {
                mode = 'hidden';
            }
            super(settings);
            this.tech_ = settings.tech;
            this.cues_ = [];
            this.activeCues_ = [];
            this.preload_ = this.tech_.preloadTextTracks !== false;
            const cues = new TextTrackCueList(this.cues_);
            const activeCues = new TextTrackCueList(this.activeCues_);
            let changed = false;
            const timeupdateHandler = Fn.bind(this, function () {
                if (!this.tech_.isReady_ || this.tech_.isDisposed()) {
                    return;
                }
                this.activeCues = this.activeCues;
                if (changed) {
                    this.trigger('cuechange');
                    changed = false;
                }
            });
            const disposeHandler = () => {
                this.tech_.off('timeupdate', timeupdateHandler);
            };
            this.tech_.one('dispose', disposeHandler);
            if (mode !== 'disabled') {
                this.tech_.on('timeupdate', timeupdateHandler);
            }
            Object.defineProperties(this, {
                default: {
                    get() {
                        return default_;
                    },
                    set() {
                    }
                },
                mode: {
                    get() {
                        return mode;
                    },
                    set(newMode) {
                        if (!TrackEnums.TextTrackMode[newMode]) {
                            return;
                        }
                        if (mode === newMode) {
                            return;
                        }
                        mode = newMode;
                        if (!this.preload_ && mode !== 'disabled' && this.cues.length === 0) {
                            loadTrack(this.src, this);
                        }
                        this.tech_.off('timeupdate', timeupdateHandler);
                        if (mode !== 'disabled') {
                            this.tech_.on('timeupdate', timeupdateHandler);
                        }
                        this.trigger('modechange');
                    }
                },
                cues: {
                    get() {
                        if (!this.loaded_) {
                            return null;
                        }
                        return cues;
                    },
                    set() {
                    }
                },
                activeCues: {
                    get() {
                        if (!this.loaded_) {
                            return null;
                        }
                        if (this.cues.length === 0) {
                            return activeCues;
                        }
                        const ct = this.tech_.currentTime();
                        const active = [];
                        for (let i = 0, l = this.cues.length; i < l; i++) {
                            const cue = this.cues[i];
                            if (cue.startTime <= ct && cue.endTime >= ct) {
                                active.push(cue);
                            } else if (cue.startTime === cue.endTime && cue.startTime <= ct && cue.startTime + 0.5 >= ct) {
                                active.push(cue);
                            }
                        }
                        changed = false;
                        if (active.length !== this.activeCues_.length) {
                            changed = true;
                        } else {
                            for (let i = 0; i < active.length; i++) {
                                if (this.activeCues_.indexOf(active[i]) === -1) {
                                    changed = true;
                                }
                            }
                        }
                        this.activeCues_ = active;
                        activeCues.setCues_(this.activeCues_);
                        return activeCues;
                    },
                    set() {
                    }
                }
            });
            if (settings.src) {
                this.src = settings.src;
                if (!this.preload_) {
                    this.loaded_ = true;
                }
                if (this.preload_ || default_ || settings.kind !== 'subtitles' && settings.kind !== 'captions') {
                    loadTrack(this.src, this);
                }
            } else {
                this.loaded_ = true;
            }
        }
        addCue(originalCue) {
            let cue = originalCue;
            if (vtt && !(originalCue instanceof vtt.VTTCue)) {
                cue = new vtt.VTTCue(originalCue.startTime, originalCue.endTime, originalCue.text);
                for (const prop in originalCue) {
                    if (!(prop in cue)) {
                        cue[prop] = originalCue[prop];
                    }
                }
                cue.id = originalCue.id;
                cue.originalCue_ = originalCue;
            }
            const tracks = this.tech_.textTracks();
            for (let i = 0; i < tracks.length; i++) {
                if (tracks[i] !== this) {
                    tracks[i].removeCue(cue);
                }
            }
            this.cues_.push(cue);
            this.cues.setCues_(this.cues_);
        }
        removeCue(removeCue) {
            let i = this.cues_.length;
            while (i--) {
                const cue = this.cues_[i];
                if (cue === removeCue || cue.originalCue_ && cue.originalCue_ === removeCue) {
                    this.cues_.splice(i, 1);
                    this.cues.setCues_(this.cues_);
                    break;
                }
            }
        }
    }
    TextTrack.prototype.allowedEvents_ = { cuechange: 'cuechange' };
    return TextTrack;
});