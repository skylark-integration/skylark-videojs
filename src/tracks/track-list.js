define([
    '../event-target'
    ///'../mixins/evented'
], function (EventTarget) {
    'use strict';
    class TrackList extends EventTarget {
        constructor(tracks = []) {
            super();
            this.tracks_ = [];
            Object.defineProperty(this, 'length', {
                get() {
                    return this.tracks_.length;
                }
            });
            for (let i = 0; i < tracks.length; i++) {
                this.addTrack(tracks[i]);
            }
        }
        addTrack(track) {
            const index = this.tracks_.length;
            if (!('' + index in this)) {
                Object.defineProperty(this, index, {
                    get() {
                        return this.tracks_[index];
                    }
                });
            }
            if (this.tracks_.indexOf(track) === -1) {
                this.tracks_.push(track);
                this.trigger({
                    track,
                    type: 'addtrack',
                    target: this
                });
            }
            track.labelchange_ = () => {
                this.trigger({
                    track,
                    type: 'labelchange',
                    target: this
                });
            };
            ///if (evented.isEvented(track)) {
            if (track.addEventListener) {
                track.addEventListener('labelchange', track.labelchange_);
            }
        }
        removeTrack(rtrack) {
            let track;
            for (let i = 0, l = this.length; i < l; i++) {
                if (this[i] === rtrack) {
                    track = this[i];
                    if (track.off) {
                        track.off();
                    }
                    this.tracks_.splice(i, 1);
                    break;
                }
            }
            if (!track) {
                return;
            }
            this.trigger({
                track,
                type: 'removetrack',
                target: this
            });
        }
        getTrackById(id) {
            let result = null;
            for (let i = 0, l = this.length; i < l; i++) {
                const track = this[i];
                if (track.id === id) {
                    result = track;
                    break;
                }
            }
            return result;
        }
    }
    TrackList.prototype.allowedEvents_ = {
        change: 'change',
        addtrack: 'addtrack',
        removetrack: 'removetrack',
        labelchange: 'labelchange'
    };
    for (const event in TrackList.prototype.allowedEvents_) {
        TrackList.prototype['on' + event] = null;
    }
    return TrackList;
});