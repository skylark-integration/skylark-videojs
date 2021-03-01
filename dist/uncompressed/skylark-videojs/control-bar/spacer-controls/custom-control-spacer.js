define([
    './spacer',
    '../../component'
], function (Spacer, Component) {
    'use strict';
    class CustomControlSpacer extends Spacer {
        buildCSSClass() {
            return `vjs-custom-control-spacer ${ super.buildCSSClass() }`;
        }
        createEl() {
            const el = super.createEl({ className: this.buildCSSClass() });
            el.innerHTML = '\xA0';
            return el;
        }
    }
    Component.registerComponent('CustomControlSpacer', CustomControlSpacer);
    return CustomControlSpacer;
});