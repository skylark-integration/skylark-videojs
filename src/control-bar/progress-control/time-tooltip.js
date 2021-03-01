define([
    '../../component',
    '../../utils/dom',
    '../../utils/format-time',
    '../../utils/fn'
], function (Component, Dom, formatTime, Fn) {
    'use strict';
    class TimeTooltip extends Component {
        constructor(player, options) {
            super(player, options);
            this.update = Fn.throttle(Fn.bind(this, this.update), Fn.UPDATE_REFRESH_INTERVAL);
        }
        createEl() {
            return super.createEl('div', { className: 'vjs-time-tooltip' }, { 'aria-hidden': 'true' });
        }
        update(seekBarRect, seekBarPoint, content) {
            const tooltipRect = Dom.findPosition(this.el_);
            const playerRect = Dom.getBoundingClientRect(this.player_.el());
            const seekBarPointPx = seekBarRect.width * seekBarPoint;
            if (!playerRect || !tooltipRect) {
                return;
            }
            const spaceLeftOfPoint = seekBarRect.left - playerRect.left + seekBarPointPx;
            const spaceRightOfPoint = seekBarRect.width - seekBarPointPx + (playerRect.right - seekBarRect.right);
            let pullTooltipBy = tooltipRect.width / 2;
            if (spaceLeftOfPoint < pullTooltipBy) {
                pullTooltipBy += pullTooltipBy - spaceLeftOfPoint;
            } else if (spaceRightOfPoint < pullTooltipBy) {
                pullTooltipBy = spaceRightOfPoint;
            }
            if (pullTooltipBy < 0) {
                pullTooltipBy = 0;
            } else if (pullTooltipBy > tooltipRect.width) {
                pullTooltipBy = tooltipRect.width;
            }
            pullTooltipBy = Math.round(pullTooltipBy);
            this.el_.style.right = `-${ pullTooltipBy }px`;
            this.write(content);
        }
        write(content) {
            Dom.textContent(this.el_, content);
        }
        updateTime(seekBarRect, seekBarPoint, time, cb) {
            this.requestNamedAnimationFrame('TimeTooltip#updateTime', () => {
                let content;
                const duration = this.player_.duration();
                if (this.player_.liveTracker && this.player_.liveTracker.isLive()) {
                    const liveWindow = this.player_.liveTracker.liveWindow();
                    const secondsBehind = liveWindow - seekBarPoint * liveWindow;
                    content = (secondsBehind < 1 ? '' : '-') + formatTime(secondsBehind, liveWindow);
                } else {
                    content = formatTime(time, duration);
                }
                this.update(seekBarRect, seekBarPoint, content);
                if (cb) {
                    cb();
                }
            });
        }
    }
    Component.registerComponent('TimeTooltip', TimeTooltip);
    return TimeTooltip;
});