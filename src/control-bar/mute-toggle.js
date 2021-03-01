define([
    '../button',
    '../component',
    '../utils/dom',
    './volume-control/check-mute-support',
    '../utils/browser'
], function (Button, Component, Dom, checkMuteSupport, browser) {
    'use strict';
    class MuteToggle extends Button {
        constructor(player, options) {
            super(player, options);
            checkMuteSupport(this, player);
            this.on(player, [
                'loadstart',
                'volumechange'
            ], this.update);
        }
        buildCSSClass() {
            return `vjs-mute-control ${ super.buildCSSClass() }`;
        }
        handleClick(event) {
            const vol = this.player_.volume();
            const lastVolume = this.player_.lastVolume_();
            if (vol === 0) {
                const volumeToSet = lastVolume < 0.1 ? 0.1 : lastVolume;
                this.player_.volume(volumeToSet);
                this.player_.muted(false);
            } else {
                this.player_.muted(this.player_.muted() ? false : true);
            }
        }
        update(event) {
            this.updateIcon_();
            this.updateControlText_();
        }
        updateIcon_() {
            const vol = this.player_.volume();
            let level = 3;
            if (browser.IS_IOS && this.player_.tech_ && this.player_.tech_.el_) {
                this.player_.muted(this.player_.tech_.el_.muted);
            }
            if (vol === 0 || this.player_.muted()) {
                level = 0;
            } else if (vol < 0.33) {
                level = 1;
            } else if (vol < 0.67) {
                level = 2;
            }
            for (let i = 0; i < 4; i++) {
                Dom.removeClass(this.el_, `vjs-vol-${ i }`);
            }
            Dom.addClass(this.el_, `vjs-vol-${ level }`);
        }
        updateControlText_() {
            const soundOff = this.player_.muted() || this.player_.volume() === 0;
            const text = soundOff ? 'Unmute' : 'Mute';
            if (this.controlText() !== text) {
                this.controlText(text);
            }
        }
    }
    MuteToggle.prototype.controlText_ = 'Mute';
    Component.registerComponent('MuteToggle', MuteToggle);
    return MuteToggle;
});