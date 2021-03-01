define([
    './text-track-button',
    '../../component'
], function (TextTrackButton, Component) {
    'use strict';
    class SubtitlesButton extends TextTrackButton {
        constructor(player, options, ready) {
            super(player, options, ready);
        }
        buildCSSClass() {
            return `vjs-subtitles-button ${ super.buildCSSClass() }`;
        }
        buildWrapperCSSClass() {
            return `vjs-subtitles-button ${ super.buildWrapperCSSClass() }`;
        }
    }
    SubtitlesButton.prototype.kind_ = 'subtitles';
    SubtitlesButton.prototype.controlText_ = 'Subtitles';
    Component.registerComponent('SubtitlesButton', SubtitlesButton);
    return SubtitlesButton;
});