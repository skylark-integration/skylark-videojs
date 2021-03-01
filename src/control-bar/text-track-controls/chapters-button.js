define([
    './text-track-button',
    '../../component',
    './chapters-track-menu-item',
    '../../utils/string-cases'
], function (TextTrackButton, Component, ChaptersTrackMenuItem, stringCases) {
    'use strict';
    class ChaptersButton extends TextTrackButton {
        constructor(player, options, ready) {
            super(player, options, ready);
        }
        buildCSSClass() {
            return `vjs-chapters-button ${ super.buildCSSClass() }`;
        }
        buildWrapperCSSClass() {
            return `vjs-chapters-button ${ super.buildWrapperCSSClass() }`;
        }
        update(event) {
            if (!this.track_ || event && (event.type === 'addtrack' || event.type === 'removetrack')) {
                this.setTrack(this.findChaptersTrack());
            }
            super.update();
        }
        setTrack(track) {
            if (this.track_ === track) {
                return;
            }
            if (!this.updateHandler_) {
                this.updateHandler_ = this.update.bind(this);
            }
            if (this.track_) {
                const remoteTextTrackEl = this.player_.remoteTextTrackEls().getTrackElementByTrack_(this.track_);
                if (remoteTextTrackEl) {
                    remoteTextTrackEl.removeEventListener('load', this.updateHandler_);
                }
                this.track_ = null;
            }
            this.track_ = track;
            if (this.track_) {
                this.track_.mode = 'hidden';
                const remoteTextTrackEl = this.player_.remoteTextTrackEls().getTrackElementByTrack_(this.track_);
                if (remoteTextTrackEl) {
                    remoteTextTrackEl.addEventListener('load', this.updateHandler_);
                }
            }
        }
        findChaptersTrack() {
            const tracks = this.player_.textTracks() || [];
            for (let i = tracks.length - 1; i >= 0; i--) {
                const track = tracks[i];
                if (track.kind === this.kind_) {
                    return track;
                }
            }
        }
        getMenuCaption() {
            if (this.track_ && this.track_.label) {
                return this.track_.label;
            }
            return this.localize(stringCases.toTitleCase(this.kind_));
        }
        createMenu() {
            this.options_.title = this.getMenuCaption();
            return super.createMenu();
        }
        createItems() {
            const items = [];
            if (!this.track_) {
                return items;
            }
            const cues = this.track_.cues;
            if (!cues) {
                return items;
            }
            for (let i = 0, l = cues.length; i < l; i++) {
                const cue = cues[i];
                const mi = new ChaptersTrackMenuItem(this.player_, {
                    track: this.track_,
                    cue
                });
                items.push(mi);
            }
            return items;
        }
    }
    ChaptersButton.prototype.kind_ = 'chapters';
    ChaptersButton.prototype.controlText_ = 'Chapters';
    Component.registerComponent('ChaptersButton', ChaptersButton);
    return ChaptersButton;
});