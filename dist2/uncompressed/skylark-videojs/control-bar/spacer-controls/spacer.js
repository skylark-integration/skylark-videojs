define([
    '../../component'
], function (Component) {
    'use strict';
    class Spacer extends Component {
        buildCSSClass() {
            return `vjs-spacer ${ super.buildCSSClass() }`;
        }
        createEl() {
            return super.createEl('div', { className: this.buildCSSClass() });
        }
    }
    Component.registerComponent('Spacer', Spacer);
    return Spacer;
});