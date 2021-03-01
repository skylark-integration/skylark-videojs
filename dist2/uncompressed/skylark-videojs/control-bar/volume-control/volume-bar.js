define([
    '../../slider/slider',
    '../../component',
    '../../utils/dom',
    './volume-level'
], function (Slider, Component, Dom) {
    'use strict';
    class VolumeBar extends Slider {
        constructor(player, options) {
            super(player, options);
            this.on('slideractive', this.updateLastVolume_);
            this.on(player, 'volumechange', this.updateARIAAttributes);
            player.ready(() => this.updateARIAAttributes());
        }
        createEl() {
            return super.createEl('div', { className: 'vjs-volume-bar vjs-slider-bar' }, {
                'aria-label': this.localize('Volume Level'),
                'aria-live': 'polite'
            });
        }
        handleMouseDown(event) {
            if (!Dom.isSingleLeftClick(event)) {
                return;
            }
            super.handleMouseDown(event);
        }
        handleMouseMove(event) {
            if (!Dom.isSingleLeftClick(event)) {
                return;
            }
            this.checkMuted();
            this.player_.volume(this.calculateDistance(event));
        }
        checkMuted() {
            if (this.player_.muted()) {
                this.player_.muted(false);
            }
        }
        getPercent() {
            if (this.player_.muted()) {
                return 0;
            }
            return this.player_.volume();
        }
        stepForward() {
            this.checkMuted();
            this.player_.volume(this.player_.volume() + 0.1);
        }
        stepBack() {
            this.checkMuted();
            this.player_.volume(this.player_.volume() - 0.1);
        }
        updateARIAAttributes(event) {
            const ariaValue = this.player_.muted() ? 0 : this.volumeAsPercentage_();
            this.el_.setAttribute('aria-valuenow', ariaValue);
            this.el_.setAttribute('aria-valuetext', ariaValue + '%');
        }
        volumeAsPercentage_() {
            return Math.round(this.player_.volume() * 100);
        }
        updateLastVolume_() {
            const volumeBeforeDrag = this.player_.volume();
            this.one('sliderinactive', () => {
                if (this.player_.volume() === 0) {
                    this.player_.lastVolume_(volumeBeforeDrag);
                }
            });
        }
    }
    VolumeBar.prototype.options_ = {
        children: ['volumeLevel'],
        barName: 'volumeLevel'
    };
    VolumeBar.prototype.playerEvent = 'volumechange';
    Component.registerComponent('VolumeBar', VolumeBar);
    return VolumeBar;
});