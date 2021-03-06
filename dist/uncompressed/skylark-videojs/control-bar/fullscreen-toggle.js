define([
    'skylark-langx-globals/document',
    '../button',
    '../component',
], function (document,Button, Component) {
    'use strict';
    class FullscreenToggle extends Button {
        constructor(player, options) {
            super(player, options);
            this.listenTo(player, 'fullscreenchange', this.handleFullscreenChange);
            if (document[player.fsApi_.fullscreenEnabled] === false) {
                this.disable();
            }
        }
        buildCSSClass() {
            return `vjs-fullscreen-control ${ super.buildCSSClass() }`;
        }
        handleFullscreenChange(event) {
            if (this.player_.isFullscreen()) {
                this.controlText('Non-Fullscreen');
            } else {
                this.controlText('Fullscreen');
            }
        }
        handleClick(event) {
            if (!this.player_.isFullscreen()) {
                this.player_.requestFullscreen();
            } else {
                this.player_.exitFullscreen();
            }
        }
    }
    FullscreenToggle.prototype.controlText_ = 'Fullscreen';
    Component.registerComponent('FullscreenToggle', FullscreenToggle);
    return FullscreenToggle;
});