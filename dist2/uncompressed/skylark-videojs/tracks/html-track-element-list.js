define(function () {
    'use strict';
    class HtmlTrackElementList {
        constructor(trackElements = []) {
            this.trackElements_ = [];
            Object.defineProperty(this, 'length', {
                get() {
                    return this.trackElements_.length;
                }
            });
            for (let i = 0, length = trackElements.length; i < length; i++) {
                this.addTrackElement_(trackElements[i]);
            }
        }
        addTrackElement_(trackElement) {
            const index = this.trackElements_.length;
            if (!('' + index in this)) {
                Object.defineProperty(this, index, {
                    get() {
                        return this.trackElements_[index];
                    }
                });
            }
            if (this.trackElements_.indexOf(trackElement) === -1) {
                this.trackElements_.push(trackElement);
            }
        }
        getTrackElementByTrack_(track) {
            let trackElement_;
            for (let i = 0, length = this.trackElements_.length; i < length; i++) {
                if (track === this.trackElements_[i].track) {
                    trackElement_ = this.trackElements_[i];
                    break;
                }
            }
            return trackElement_;
        }
        removeTrackElement_(trackElement) {
            for (let i = 0, length = this.trackElements_.length; i < length; i++) {
                if (trackElement === this.trackElements_[i]) {
                    if (this.trackElements_[i].track && typeof this.trackElements_[i].track.off === 'function') {
                        this.trackElements_[i].track.off();
                    }
                    if (typeof this.trackElements_[i].off === 'function') {
                        this.trackElements_[i].off();
                    }
                    this.trackElements_.splice(i, 1);
                    break;
                }
            }
        }
    }
    return HtmlTrackElementList;
});