define([
    './text-track-button',
    '../../component',
    './caption-settings-menu-item'
], function (TextTrackButton, Component, CaptionSettingsMenuItem) {
    'use strict';
    class CaptionsButton extends TextTrackButton {
        constructor(player, options, ready) {
            super(player, options, ready);
        }
        buildCSSClass() {
            return `vjs-captions-button ${ super.buildCSSClass() }`;
        }
        buildWrapperCSSClass() {
            return `vjs-captions-button ${ super.buildWrapperCSSClass() }`;
        }
        createItems() {
            const items = [];
            if (!(this.player().tech_ && this.player().tech_.featuresNativeTextTracks) && this.player().getChild('textTrackSettings')) {
                items.push(new CaptionSettingsMenuItem(this.player_, { kind: this.kind_ }));
                this.hideThreshold_ += 1;
            }
            return super.createItems(items);
        }
    }
    CaptionsButton.prototype.kind_ = 'captions';
    CaptionsButton.prototype.controlText_ = 'Captions';
    Component.registerComponent('CaptionsButton', CaptionsButton);
    return CaptionsButton;
});