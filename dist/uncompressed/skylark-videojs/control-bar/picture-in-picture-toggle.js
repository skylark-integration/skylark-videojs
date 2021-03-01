define([
    'skylark-langx-globals/document',
    '../button',
    '../component'
], function (document,Button, Component) {
    'use strict';
    class PictureInPictureToggle extends Button {
        constructor(player, options) {
            super(player, options);
            this.on(player, [
                'enterpictureinpicture',
                'leavepictureinpicture'
            ], this.handlePictureInPictureChange);
            this.on(player, [
                'disablepictureinpicturechanged',
                'loadedmetadata'
            ], this.handlePictureInPictureEnabledChange);
            this.disable();
        }
        buildCSSClass() {
            return `vjs-picture-in-picture-control ${ super.buildCSSClass() }`;
        }
        handlePictureInPictureEnabledChange() {
            if (document.pictureInPictureEnabled && this.player_.disablePictureInPicture() === false) {
                this.enable();
            } else {
                this.disable();
            }
        }
        handlePictureInPictureChange(event) {
            if (this.player_.isInPictureInPicture()) {
                this.controlText('Exit Picture-in-Picture');
            } else {
                this.controlText('Picture-in-Picture');
            }
            this.handlePictureInPictureEnabledChange();
        }
        handleClick(event) {
            if (!this.player_.isInPictureInPicture()) {
                this.player_.requestPictureInPicture();
            } else {
                this.player_.exitPictureInPicture();
            }
        }
    }
    PictureInPictureToggle.prototype.controlText_ = 'Picture-in-Picture';
    Component.registerComponent('PictureInPictureToggle', PictureInPictureToggle);
    return PictureInPictureToggle;
});