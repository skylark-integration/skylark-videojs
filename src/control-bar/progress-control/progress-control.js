define([
    '../../component',
    '../../utils/dom',
    '../../utils/clamp',
    '../../utils/fn',
    './seek-bar'
], function (Component, Dom, clamp, Fn) {
    'use strict';
    class ProgressControl extends Component {
        constructor(player, options) {
            super(player, options);
            this.handleMouseMove = Fn.throttle(Fn.bind(this, this.handleMouseMove), Fn.UPDATE_REFRESH_INTERVAL);
            this.throttledHandleMouseSeek = Fn.throttle(Fn.bind(this, this.handleMouseSeek), Fn.UPDATE_REFRESH_INTERVAL);
            this.enable();
        }
        createEl() {
            return super.createEl('div', { className: 'vjs-progress-control vjs-control' });
        }
        handleMouseMove(event) {
            const seekBar = this.getChild('seekBar');
            if (!seekBar) {
                return;
            }
            const playProgressBar = seekBar.getChild('playProgressBar');
            const mouseTimeDisplay = seekBar.getChild('mouseTimeDisplay');
            if (!playProgressBar && !mouseTimeDisplay) {
                return;
            }
            const seekBarEl = seekBar.el();
            const seekBarRect = Dom.findPosition(seekBarEl);
            let seekBarPoint = Dom.getPointerPosition(seekBarEl, event).x;
            seekBarPoint = clamp(seekBarPoint, 0, 1);
            if (mouseTimeDisplay) {
                mouseTimeDisplay.update(seekBarRect, seekBarPoint);
            }
            if (playProgressBar) {
                playProgressBar.update(seekBarRect, seekBar.getProgress());
            }
        }
        handleMouseSeek(event) {
            const seekBar = this.getChild('seekBar');
            if (seekBar) {
                seekBar.handleMouseMove(event);
            }
        }
        enabled() {
            return this.enabled_;
        }
        disable() {
            this.children().forEach(child => child.disable && child.disable());
            if (!this.enabled()) {
                return;
            }
            this.unlistenTo([
                'mousedown',
                'touchstart'
            ], this.handleMouseDown);
            this.unlistenTo(this.el_, 'mousemove', this.handleMouseMove);
            this.handleMouseUp();
            this.addClass('disabled');
            this.enabled_ = false;
        }
        enable() {
            this.children().forEach(child => child.enable && child.enable());
            if (this.enabled()) {
                return;
            }
            this.listenTo([
                'mousedown',
                'touchstart'
            ], this.handleMouseDown);
            this.listenTo(this.el_, 'mousemove', this.handleMouseMove);
            this.removeClass('disabled');
            this.enabled_ = true;
        }
        handleMouseDown(event) {
            const doc = this.el_.ownerDocument;
            const seekBar = this.getChild('seekBar');
            if (seekBar) {
                seekBar.handleMouseDown(event);
            }
            this.listenTo(doc, 'mousemove', this.throttledHandleMouseSeek);
            this.listenTo(doc, 'touchmove', this.throttledHandleMouseSeek);
            this.listenTo(doc, 'mouseup', this.handleMouseUp);
            this.listenTo(doc, 'touchend', this.handleMouseUp);
        }
        handleMouseUp(event) {
            const doc = this.el_.ownerDocument;
            const seekBar = this.getChild('seekBar');
            if (seekBar) {
                seekBar.handleMouseUp(event);
            }
            this.unlistenTo(doc, 'mousemove', this.throttledHandleMouseSeek);
            this.unlistenTo(doc, 'touchmove', this.throttledHandleMouseSeek);
            this.unlistenTo(doc, 'mouseup', this.handleMouseUp);
            this.unlistenTo(doc, 'touchend', this.handleMouseUp);
        }
    }
    ProgressControl.prototype.options_ = { children: ['seekBar'] };
    Component.registerComponent('ProgressControl', ProgressControl);
    return ProgressControl;
});