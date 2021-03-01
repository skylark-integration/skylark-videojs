define([
    '../track-button',
    '../../component',
    './audio-track-menu-item'
], function (TrackButton, Component, AudioTrackMenuItem) {
    'use strict';
    class AudioTrackButton extends TrackButton {
        constructor(player, options = {}) {
            options.tracks = player.audioTracks();
            super(player, options);
        }
        buildCSSClass() {
            return `vjs-audio-button ${ super.buildCSSClass() }`;
        }
        buildWrapperCSSClass() {
            return `vjs-audio-button ${ super.buildWrapperCSSClass() }`;
        }
        createItems(items = []) {
            this.hideThreshold_ = 1;
            const tracks = this.player_.audioTracks();
            for (let i = 0; i < tracks.length; i++) {
                const track = tracks[i];
                items.push(new AudioTrackMenuItem(this.player_, {
                    track,
                    selectable: true,
                    multiSelectable: false
                }));
            }
            return items;
        }
    }
    AudioTrackButton.prototype.controlText_ = 'Audio Track';
    Component.registerComponent('AudioTrackButton', AudioTrackButton);
    return AudioTrackButton;
});