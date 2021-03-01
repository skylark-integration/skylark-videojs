define([
    '../event-target',
    '../tracks/text-track'
], function (EventTarget, TextTrack) {
    'use strict';
    const NONE = 0;
    const LOADING = 1;
    const LOADED = 2;
    const ERROR = 3;
    class HTMLTrackElement extends EventTarget {
        constructor(options = {}) {
            super();
            let readyState;
            const track = new TextTrack(options);
            this.kind = track.kind;
            this.src = track.src;
            this.srclang = track.language;
            this.label = track.label;
            this.default = track.default;
            Object.defineProperties(this, {
                readyState: {
                    get() {
                        return readyState;
                    }
                },
                track: {
                    get() {
                        return track;
                    }
                }
            });
            readyState = NONE;
            track.addEventListener('loadeddata', () => {
                readyState = LOADED;
                this.trigger({
                    type: 'load',
                    target: this
                });
            });
        }
    }
    HTMLTrackElement.prototype.allowedEvents_ = { load: 'load' };
    HTMLTrackElement.NONE = NONE;
    HTMLTrackElement.LOADING = LOADING;
    HTMLTrackElement.LOADED = LOADED;
    HTMLTrackElement.ERROR = ERROR;
    return HTMLTrackElement;
});