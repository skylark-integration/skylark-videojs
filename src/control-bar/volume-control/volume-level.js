define([
    '../../component'
], function (Component) {
    'use strict';
    class VolumeLevel extends Component {
        createEl() {
            return super.createEl('div', {
                className: 'vjs-volume-level',
                innerHTML: '<span class="vjs-control-text"></span>'
            });
        }
    }
    Component.registerComponent('VolumeLevel', VolumeLevel);
    return VolumeLevel;
});