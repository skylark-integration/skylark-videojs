define([
    '../../component',
    './check-volume-support',
    '../../utils/obj',
    '../../utils/fn',
    './volume-bar'
], function (Component, checkVolumeSupport, obj, Fn) {
    'use strict';
    class VolumeControl extends Component {
        constructor(player, options = {}) {
            options.vertical = options.vertical || false;
            if (typeof options.volumeBar === 'undefined' || obj.isPlain(options.volumeBar)) {
                options.volumeBar = options.volumeBar || {};
                options.volumeBar.vertical = options.vertical;
            }
            super(player, options);
            checkVolumeSupport(this, player);
            this.throttledHandleMouseMove = Fn.throttle(Fn.bind(this, this.handleMouseMove), Fn.UPDATE_REFRESH_INTERVAL);
            this.on('mousedown', this.handleMouseDown);
            this.on('touchstart', this.handleMouseDown);
            this.on(this.volumeBar, [
                'focus',
                'slideractive'
            ], () => {
                this.volumeBar.addClass('vjs-slider-active');
                this.addClass('vjs-slider-active');
                this.trigger('slideractive');
            });
            this.on(this.volumeBar, [
                'blur',
                'sliderinactive'
            ], () => {
                this.volumeBar.removeClass('vjs-slider-active');
                this.removeClass('vjs-slider-active');
                this.trigger('sliderinactive');
            });
        }
        createEl() {
            let orientationClass = 'vjs-volume-horizontal';
            if (this.options_.vertical) {
                orientationClass = 'vjs-volume-vertical';
            }
            return super.createEl('div', { className: `vjs-volume-control vjs-control ${ orientationClass }` });
        }
        handleMouseDown(event) {
            const doc = this.el_.ownerDocument;
            this.on(doc, 'mousemove', this.throttledHandleMouseMove);
            this.on(doc, 'touchmove', this.throttledHandleMouseMove);
            this.on(doc, 'mouseup', this.handleMouseUp);
            this.on(doc, 'touchend', this.handleMouseUp);
        }
        handleMouseUp(event) {
            const doc = this.el_.ownerDocument;
            this.off(doc, 'mousemove', this.throttledHandleMouseMove);
            this.off(doc, 'touchmove', this.throttledHandleMouseMove);
            this.off(doc, 'mouseup', this.handleMouseUp);
            this.off(doc, 'touchend', this.handleMouseUp);
        }
        handleMouseMove(event) {
            this.volumeBar.handleMouseMove(event);
        }
    }
    VolumeControl.prototype.options_ = { children: ['volumeBar'] };
    Component.registerComponent('VolumeControl', VolumeControl);
    return VolumeControl;
});