define([
    './time-display',
    '../../component'
], function (TimeDisplay, Component) {
    'use strict';
    class CurrentTimeDisplay extends TimeDisplay {
        buildCSSClass() {
            return 'vjs-current-time';
        }
        updateContent(event) {
            let time;
            if (this.player_.ended()) {
                time = this.player_.duration();
            } else {
                time = this.player_.scrubbing() ? this.player_.getCache().currentTime : this.player_.currentTime();
            }
            this.updateTextNode_(time);
        }
    }
    CurrentTimeDisplay.prototype.labelText_ = 'Current Time';
    CurrentTimeDisplay.prototype.controlText_ = 'Current Time';
    Component.registerComponent('CurrentTimeDisplay', CurrentTimeDisplay);
    return CurrentTimeDisplay;
});