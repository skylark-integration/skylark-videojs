define([
    './time-display',
    '../../component',
    '../../utils/dom'
], function (TimeDisplay, Component, Dom) {
    'use strict';
    class RemainingTimeDisplay extends TimeDisplay {
        constructor(player, options) {
            super(player, options);
            this.on(player, 'durationchange', this.updateContent);
        }
        buildCSSClass() {
            return 'vjs-remaining-time';
        }
        createEl() {
            const el = super.createEl();
            el.insertBefore(Dom.createEl('span', {}, { 'aria-hidden': true }, '-'), this.contentEl_);
            return el;
        }
        updateContent(event) {
            if (typeof this.player_.duration() !== 'number') {
                return;
            }
            let time;
            if (this.player_.ended()) {
                time = 0;
            } else if (this.player_.remainingTimeDisplay) {
                time = this.player_.remainingTimeDisplay();
            } else {
                time = this.player_.remainingTime();
            }
            this.updateTextNode_(time);
        }
    }
    RemainingTimeDisplay.prototype.labelText_ = 'Remaining Time';
    RemainingTimeDisplay.prototype.controlText_ = 'Remaining Time';
    Component.registerComponent('RemainingTimeDisplay', RemainingTimeDisplay);
    return RemainingTimeDisplay;
});