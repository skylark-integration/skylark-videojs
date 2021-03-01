define([
    './text-track-button',
    '../../component',
    './caption-settings-menu-item',
    './subs-caps-menu-item',
    '../../utils/string-cases'
], function (TextTrackButton, Component, CaptionSettingsMenuItem, SubsCapsMenuItem, stringCases) {
    'use strict';
    class SubsCapsButton extends TextTrackButton {
        constructor(player, options = {}) {
            super(player, options);
            this.label_ = 'subtitles';
            if ([
                    'en',
                    'en-us',
                    'en-ca',
                    'fr-ca'
                ].indexOf(this.player_.language_) > -1) {
                this.label_ = 'captions';
            }
            this.menuButton_.controlText(stringCases.toTitleCase(this.label_));
        }
        buildCSSClass() {
            return `vjs-subs-caps-button ${ super.buildCSSClass() }`;
        }
        buildWrapperCSSClass() {
            return `vjs-subs-caps-button ${ super.buildWrapperCSSClass() }`;
        }
        createItems() {
            let items = [];
            if (!(this.player().tech_ && this.player().tech_.featuresNativeTextTracks) && this.player().getChild('textTrackSettings')) {
                items.push(new CaptionSettingsMenuItem(this.player_, { kind: this.label_ }));
                this.hideThreshold_ += 1;
            }
            items = super.createItems(items, SubsCapsMenuItem);
            return items;
        }
    }
    SubsCapsButton.prototype.kinds_ = [
        'captions',
        'subtitles'
    ];
    SubsCapsButton.prototype.controlText_ = 'Subtitles';
    Component.registerComponent('SubsCapsButton', SubsCapsButton);
    return SubsCapsButton;
});