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
            this.listenTo('mousedown', this.handleMouseDown);
            this.listenTo('touchstart', this.handleMouseDown);
            this.listenTo('keydown', this.handleKeyDown);
            this.listenTo('click', this.handleClick);
            this.listenTo(this.player_, 'controlsvisible', this.update);
            if (this.playerEvent) {
                this.listenTo(this.player_, this.playerEvent, this.update);
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
            this.unlistenTo('mousedown', this.handleMouseDown);
            this.unlistenTo('touchstart', this.handleMouseDown);
            this.unlistenTo('keydown', this.handleKeyDown);
            this.unlistenTo('click', this.handleClick);
            this.unlistenTo(this.player_, 'controlsvisible', this.update);
            this.unlistenTo(doc, 'mousemove', this.handleMouseMove);
            this.unlistenTo(doc, 'mouseup', this.handleMouseUp);
            this.unlistenTo(doc, 'touchmove', this.handleMouseMove);
            this.unlistenTo(doc, 'touchend', this.handleMouseUp);
            this.removeAttribute('tabindex');
            this.addClass('disabled');
            if (this.playerEvent) {
                this.unlistenTo(this.player_, this.playerEvent, this.update);
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
            this.listenTo(doc, 'mousemove', this.handleMouseMove);
            this.listenTo(doc, 'mouseup', this.handleMouseUp);
            this.listenTo(doc, 'touchmove', this.handleMouseMove);
            this.listenTo(doc, 'touchend', this.handleMouseUp);
            this.handleMouseMove(event);
        }
        handleMouseMove(event) {
        }
        handleMouseUp() {
            const doc = this.bar.el_.ownerDocument;
            Dom.unblockTextSelection();
            this.removeClass('vjs-sliding');
            this.trigger('sliderinactive');
            this.unlistenTo(doc, 'mousemove', this.handleMouseMove);
            this.unlistenTo(doc, 'mouseup', this.handleMouseUp);
            this.unlistenTo(doc, 'touchmove', this.handleMouseMove);
            this.unlistenTo(doc, 'touchend', this.handleMouseUp);
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