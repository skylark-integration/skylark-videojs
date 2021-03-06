define([
    '../../menu/menu-button',
    '../../menu/menu',
    './playback-rate-menu-item',
    '../../component',
    '../../utils/dom'
], function (MenuButton, Menu, PlaybackRateMenuItem, Component, Dom) {
    'use strict';
    class PlaybackRateMenuButton extends MenuButton {
        constructor(player, options) {
            super(player, options);
            this.updateVisibility();
            this.updateLabel();
            this.listenTo(player, 'loadstart', this.updateVisibility);
            this.listenTo(player, 'ratechange', this.updateLabel);
        }
        createEl() {
            const el = super.createEl();
            this.labelEl_ = Dom.createEl('div', {
                className: 'vjs-playback-rate-value',
                innerHTML: '1x'
            });
            el.appendChild(this.labelEl_);
            return el;
        }
        dispose() {
            this.labelEl_ = null;
            super.dispose();
        }
        buildCSSClass() {
            return `vjs-playback-rate ${ super.buildCSSClass() }`;
        }
        buildWrapperCSSClass() {
            return `vjs-playback-rate ${ super.buildWrapperCSSClass() }`;
        }
        createMenu() {
            const menu = new Menu(this.player());
            const rates = this.playbackRates();
            if (rates) {
                for (let i = rates.length - 1; i >= 0; i--) {
                    menu.addChild(new PlaybackRateMenuItem(this.player(), { rate: rates[i] + 'x' }));
                }
            }
            return menu;
        }
        updateARIAAttributes() {
            this.el().setAttribute('aria-valuenow', this.player().playbackRate());
        }
        handleClick(event) {
            const currentRate = this.player().playbackRate();
            const rates = this.playbackRates();
            let newRate = rates[0];
            for (let i = 0; i < rates.length; i++) {
                if (rates[i] > currentRate) {
                    newRate = rates[i];
                    break;
                }
            }
            this.player().playbackRate(newRate);
        }
        playbackRates() {
            return this.options_.playbackRates || this.options_.playerOptions && this.options_.playerOptions.playbackRates;
        }
        playbackRateSupported() {
            return this.player().tech_ && this.player().tech_.featuresPlaybackRate && this.playbackRates() && this.playbackRates().length > 0;
        }
        updateVisibility(event) {
            if (this.playbackRateSupported()) {
                this.removeClass('vjs-hidden');
            } else {
                this.addClass('vjs-hidden');
            }
        }
        updateLabel(event) {
            if (this.playbackRateSupported()) {
                this.labelEl_.innerHTML = this.player().playbackRate() + 'x';
            }
        }
    }
    PlaybackRateMenuButton.prototype.controlText_ = 'Playback Rate';
    Component.registerComponent('PlaybackRateMenuButton', PlaybackRateMenuButton);
    return PlaybackRateMenuButton;
});