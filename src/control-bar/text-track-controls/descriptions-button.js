define([
    './text-track-button',
    '../../component',
    '../../utils/fn'
], function (TextTrackButton, Component, Fn) {
    'use strict';
    class DescriptionsButton extends TextTrackButton {
        constructor(player, options, ready) {
            super(player, options, ready);
            const tracks = player.textTracks();
            const changeHandler = Fn.bind(this, this.handleTracksChange);
            tracks.addEventListener('change', changeHandler);
            this.listenTo('dispose', function () {
                tracks.removeEventListener('change', changeHandler);
            });
        }
        handleTracksChange(event) {
            const tracks = this.player().textTracks();
            let disabled = false;
            for (let i = 0, l = tracks.length; i < l; i++) {
                const track = tracks[i];
                if (track.kind !== this.kind_ && track.mode === 'showing') {
                    disabled = true;
                    break;
                }
            }
            if (disabled) {
                this.disable();
            } else {
                this.enable();
            }
        }
        buildCSSClass() {
            return `vjs-descriptions-button ${ super.buildCSSClass() }`;
        }
        buildWrapperCSSClass() {
            return `vjs-descriptions-button ${ super.buildWrapperCSSClass() }`;
        }
    }
    DescriptionsButton.prototype.kind_ = 'descriptions';
    DescriptionsButton.prototype.controlText_ = 'Descriptions';
    Component.registerComponent('DescriptionsButton', DescriptionsButton);
    return DescriptionsButton;
});