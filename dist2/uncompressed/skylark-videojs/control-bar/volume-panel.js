define([
    'skylark-langx-globals/document',
    '../component',
    '../utils/obj',
    '../utils/events',
    '../utils/fn',
    '../utils/keycode',
    './volume-control/volume-control',
    './mute-toggle'
], function (document, Component, obj, Events, Fn, keycode) {
    'use strict';
    class VolumePanel extends Component {
        constructor(player, options = {}) {
            if (typeof options.inline !== 'undefined') {
                options.inline = options.inline;
            } else {
                options.inline = true;
            }
            if (typeof options.volumeControl === 'undefined' || obj.isPlain(options.volumeControl)) {
                options.volumeControl = options.volumeControl || {};
                options.volumeControl.vertical = !options.inline;
            }
            super(player, options);
            this.on(player, ['loadstart'], this.volumePanelState_);
            this.on(this.muteToggle, 'keyup', this.handleKeyPress);
            this.on(this.volumeControl, 'keyup', this.handleVolumeControlKeyUp);
            this.on('keydown', this.handleKeyPress);
            this.on('mouseover', this.handleMouseOver);
            this.on('mouseout', this.handleMouseOut);
            this.on(this.volumeControl, ['slideractive'], this.sliderActive_);
            this.on(this.volumeControl, ['sliderinactive'], this.sliderInactive_);
        }
        sliderActive_() {
            this.addClass('vjs-slider-active');
        }
        sliderInactive_() {
            this.removeClass('vjs-slider-active');
        }
        volumePanelState_() {
            if (this.volumeControl.hasClass('vjs-hidden') && this.muteToggle.hasClass('vjs-hidden')) {
                this.addClass('vjs-hidden');
            }
            if (this.volumeControl.hasClass('vjs-hidden') && !this.muteToggle.hasClass('vjs-hidden')) {
                this.addClass('vjs-mute-toggle-only');
            }
        }
        createEl() {
            let orientationClass = 'vjs-volume-panel-horizontal';
            if (!this.options_.inline) {
                orientationClass = 'vjs-volume-panel-vertical';
            }
            return super.createEl('div', { className: `vjs-volume-panel vjs-control ${ orientationClass }` });
        }
        dispose() {
            this.handleMouseOut();
            super.dispose();
        }
        handleVolumeControlKeyUp(event) {
            if (keycode.isEventKey(event, 'Esc')) {
                this.muteToggle.focus();
            }
        }
        handleMouseOver(event) {
            this.addClass('vjs-hover');
            Events.on(document, 'keyup', Fn.bind(this, this.handleKeyPress));
        }
        handleMouseOut(event) {
            this.removeClass('vjs-hover');
            Events.off(document, 'keyup', Fn.bind(this, this.handleKeyPress));
        }
        handleKeyPress(event) {
            if (keycode.isEventKey(event, 'Esc')) {
                this.handleMouseOut();
            }
        }
    }
    VolumePanel.prototype.options_ = {
        children: [
            'muteToggle',
            'volumeControl'
        ]
    };
    Component.registerComponent('VolumePanel', VolumePanel);
    return VolumePanel;
});