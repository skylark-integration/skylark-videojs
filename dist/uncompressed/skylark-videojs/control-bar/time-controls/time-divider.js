define([
    '../../component'
], function (Component) {
    'use strict';
    class TimeDivider extends Component {
        createEl() {
            return super.createEl('div', {
                className: 'vjs-time-control vjs-time-divider',
                innerHTML: '<div><span>/</span></div>'
            }, { 'aria-hidden': true });
        }
    }
    Component.registerComponent('TimeDivider', TimeDivider);
    return TimeDivider;
});