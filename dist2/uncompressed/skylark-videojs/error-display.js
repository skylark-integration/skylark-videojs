define([
    './component',
    './modal-dialog'
], function (Component, ModalDialog) {
    'use strict';
    class ErrorDisplay extends ModalDialog {
        constructor(player, options) {
            super(player, options);
            this.on(player, 'error', this.open);
        }
        buildCSSClass() {
            return `vjs-error-display ${ super.buildCSSClass() }`;
        }
        content() {
            const error = this.player().error();
            return error ? this.localize(error.message) : '';
        }
    }
    ErrorDisplay.prototype.options_ = Object.assign({}, ModalDialog.prototype.options_, {
        pauseOnOpen: false,
        fillAlways: true,
        temporary: false,
        uncloseable: true
    });
    Component.registerComponent('ErrorDisplay', ErrorDisplay);
    return ErrorDisplay;
});