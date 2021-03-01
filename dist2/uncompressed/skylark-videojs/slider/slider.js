define([
    '../component',
    '../utils/dom',
    '../utils/obj',
    '../utils/browser',
    '../utils/clamp',
    '../utils/keycode'
], function (Component, Dom, obj, browser, clamp, keycode) {
    'use strict';
    class Slider extends Component {
        constructor(player, options) {
            super(player, options);
            this.bar = this.getChild(this.options_.barName);
            this.vertical(!!this.options_.vertical);
            this.enable();
        }
        enabled() {
            return this.enabled_;
        }
        enable() {
            if (this.enabled()) {
                return;
            }
            this.on('mousedown', this.handleMouseDown);
            this.on('touchstart', this.handleMouseDown);
            this.on('keydown', this.handleKeyDown);
            this.on('click', this.handleClick);
            this.on(this.player_, 'controlsvisible', this.update);
            if (this.playerEvent) {
                this.on(this.player_, this.playerEvent, this.update);
            }
            this.removeClass('disabled');
            this.setAttribute('tabindex', 0);
            this.enabled_ = true;
        }
        disable() {
            if (!this.enabled()) {
                return;
            }
            const doc = this.bar.el_.ownerDocument;
            this.off('mousedown', this.handleMouseDown);
            this.off('touchstart', this.handleMouseDown);
            this.off('keydown', this.handleKeyDown);
            this.off('click', this.handleClick);
            this.off(this.player_, 'controlsvisible', this.update);
            this.off(doc, 'mousemove', this.handleMouseMove);
            this.off(doc, 'mouseup', this.handleMouseUp);
            this.off(doc, 'touchmove', this.handleMouseMove);
            this.off(doc, 'touchend', this.handleMouseUp);
            this.removeAttribute('tabindex');
            this.addClass('disabled');
            if (this.playerEvent) {
                this.off(this.player_, this.playerEvent, this.update);
            }
            this.enabled_ = false;
        }
        createEl(type, props = {}, attributes = {}) {
            props.className = props.className + ' vjs-slider';
            props = obj.assign({ tabIndex: 0 }, props);
            attributes = obj.assign({
                'role': 'slider',
                'aria-valuenow': 0,
                'aria-valuemin': 0,
                'aria-valuemax': 100,
                'tabIndex': 0
            }, attributes);
            return super.createEl(type, props, attributes);
        }
        handleMouseDown(event) {
            const doc = this.bar.el_.ownerDocument;
            if (event.type === 'mousedown') {
                event.preventDefault();
            }
            if (event.type === 'touchstart' && !browser.IS_CHROME) {
                event.preventDefault();
            }
            Dom.blockTextSelection();
            this.addClass('vjs-sliding');
            this.trigger('slideractive');
            this.on(doc, 'mousemove', this.handleMouseMove);
            this.on(doc, 'mouseup', this.handleMouseUp);
            this.on(doc, 'touchmove', this.handleMouseMove);
            this.on(doc, 'touchend', this.handleMouseUp);
            this.handleMouseMove(event);
        }
        handleMouseMove(event) {
        }
        handleMouseUp() {
            const doc = this.bar.el_.ownerDocument;
            Dom.unblockTextSelection();
            this.removeClass('vjs-sliding');
            this.trigger('sliderinactive');
            this.off(doc, 'mousemove', this.handleMouseMove);
            this.off(doc, 'mouseup', this.handleMouseUp);
            this.off(doc, 'touchmove', this.handleMouseMove);
            this.off(doc, 'touchend', this.handleMouseUp);
            this.update();
        }
        update() {
            if (!this.el_ || !this.bar) {
                return;
            }
            const progress = this.getProgress();
            if (progress === this.progress_) {
                return progress;
            }
            this.progress_ = progress;
            this.requestNamedAnimationFrame('Slider#update', () => {
                const sizeKey = this.vertical() ? 'height' : 'width';
                this.bar.el().style[sizeKey] = (progress * 100).toFixed(2) + '%';
            });
            return progress;
        }
        getProgress() {
            return Number(clamp(this.getPercent(), 0, 1).toFixed(4));
        }
        calculateDistance(event) {
            const position = Dom.getPointerPosition(this.el_, event);
            if (this.vertical()) {
                return position.y;
            }
            return position.x;
        }
        handleKeyDown(event) {
            if (keycode.isEventKey(event, 'Left') || keycode.isEventKey(event, 'Down')) {
                event.preventDefault();
                event.stopPropagation();
                this.stepBack();
            } else if (keycode.isEventKey(event, 'Right') || keycode.isEventKey(event, 'Up')) {
                event.preventDefault();
                event.stopPropagation();
                this.stepForward();
            } else {
                super.handleKeyDown(event);
            }
        }
        handleClick(event) {
            event.stopPropagation();
            event.preventDefault();
        }
        vertical(bool) {
            if (bool === undefined) {
                return this.vertical_ || false;
            }
            this.vertical_ = !!bool;
            if (this.vertical_) {
                this.addClass('vjs-slider-vertical');
            } else {
                this.addClass('vjs-slider-horizontal');
            }
        }
    }
    Component.registerComponent('Slider', Slider);
    return Slider;
});