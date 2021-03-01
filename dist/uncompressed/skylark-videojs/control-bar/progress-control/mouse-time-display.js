define([
    '../../component',
    '../../utils/fn',
    './time-tooltip'
], function (Component, Fn) {
    'use strict';
    class MouseTimeDisplay extends Component {
        constructor(player, options) {
            super(player, options);
            this.update = Fn.throttle(Fn.bind(this, this.update), Fn.UPDATE_REFRESH_INTERVAL);
        }
        createEl() {
            return super.createEl('div', { className: 'vjs-mouse-display' });
        }
        update(seekBarRect, seekBarPoint) {
            const time = seekBarPoint * this.player_.duration();
            this.getChild('timeTooltip').updateTime(seekBarRect, seekBarPoint, time, () => {
                this.el_.style.left = `${ seekBarRect.width * seekBarPoint }px`;
            });
        }
    }
    MouseTimeDisplay.prototype.options_ = { children: ['timeTooltip'] };
    Component.registerComponent('MouseTimeDisplay', MouseTimeDisplay);
    return MouseTimeDisplay;
});