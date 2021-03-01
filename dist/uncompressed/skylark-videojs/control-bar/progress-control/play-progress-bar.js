define([
    '../../component',
    '../../utils/browser',
    '../../utils/fn',
    './time-tooltip'
], function (Component, browser, Fn) {
    'use strict';
    class PlayProgressBar extends Component {
        constructor(player, options) {
            super(player, options);
            this.update = Fn.throttle(Fn.bind(this, this.update), Fn.UPDATE_REFRESH_INTERVAL);
        }
        createEl() {
            return super.createEl('div', { className: 'vjs-play-progress vjs-slider-bar' }, { 'aria-hidden': 'true' });
        }
        update(seekBarRect, seekBarPoint) {
            const timeTooltip = this.getChild('timeTooltip');
            if (!timeTooltip) {
                return;
            }
            const time = this.player_.scrubbing() ? this.player_.getCache().currentTime : this.player_.currentTime();
            timeTooltip.updateTime(seekBarRect, seekBarPoint, time);
        }
    }
    PlayProgressBar.prototype.options_ = { children: [] };
    if (!browser.IS_IOS && !browser.IS_ANDROID) {
        PlayProgressBar.prototype.options_.children.push('timeTooltip');
    }
    Component.registerComponent('PlayProgressBar', PlayProgressBar);
    return PlayProgressBar;
});