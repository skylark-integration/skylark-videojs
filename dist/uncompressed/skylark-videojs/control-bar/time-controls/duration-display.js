define([
    './time-display',
    '../../component'
], function (TimeDisplay, Component) {
    'use strict';
    class DurationDisplay extends TimeDisplay {
        constructor(player, options) {
            super(player, options);
            this.on(player, 'durationchange', this.updateContent);
            this.on(player, 'loadstart', this.updateContent);
            this.on(player, 'loadedmetadata', this.updateContent);
        }
        buildCSSClass() {
            return 'vjs-duration';
        }
        updateContent(event) {
            const duration = this.player_.duration();
            this.updateTextNode_(duration);
        }
    }
    DurationDisplay.prototype.labelText_ = 'Duration';
    DurationDisplay.prototype.controlText_ = 'Duration';
    Component.registerComponent('DurationDisplay', DurationDisplay);
    return DurationDisplay;
});