define([
    './utils/fn',
    './utils/events',
    './utils/merge-options',
    './component'
], function ( Fn, Events, mergeOptions, Component) {
    'use strict';
    class ResizeManager extends Component {
        constructor(player, options) {
            let RESIZE_OBSERVER_AVAILABLE = options.ResizeObserver || window.ResizeObserver;
            if (options.ResizeObserver === null) {
                RESIZE_OBSERVER_AVAILABLE = false;
            }
            const options_ = mergeOptions({
                createEl: !RESIZE_OBSERVER_AVAILABLE,
                reportTouchActivity: false
            }, options);
            super(player, options_);
            this.ResizeObserver = options.ResizeObserver || window.ResizeObserver;
            this.loadListener_ = null;
            this.resizeObserver_ = null;
            this.debouncedHandler_ = Fn.debounce(() => {
                this.resizeHandler();
            }, 100, false, this);
            if (RESIZE_OBSERVER_AVAILABLE) {
                this.resizeObserver_ = new this.ResizeObserver(this.debouncedHandler_);
                this.resizeObserver_.observe(player.el());
            } else {
                this.loadListener_ = () => {
                    if (!this.el_ || !this.el_.contentWindow) {
                        return;
                    }
                    const debouncedHandler_ = this.debouncedHandler_;
                    let unloadListener_ = this.unloadListener_ = function () {
                        Events.off(this, 'resize', debouncedHandler_);
                        Events.off(this, 'unload', unloadListener_);
                        unloadListener_ = null;
                    };
                    Events.on(this.el_.contentWindow, 'unload', unloadListener_);
                    Events.on(this.el_.contentWindow, 'resize', debouncedHandler_);
                };
                this.listenToOnce('load', this.loadListener_);
            }
        }
        createEl() {
            return super.createEl('iframe', {
                className: 'vjs-resize-manager',
                tabIndex: -1
            }, { 'aria-hidden': 'true' });
        }
        resizeHandler() {
            if (!this.player_ || !this.player_.trigger) {
                return;
            }
            this.player_.trigger('playerresize');
        }
        dispose() {
            if (this.debouncedHandler_) {
                this.debouncedHandler_.cancel();
            }
            if (this.resizeObserver_) {
                if (this.player_.el()) {
                    this.resizeObserver_.unobserve(this.player_.el());
                }
                this.resizeObserver_.disconnect();
            }
            if (this.loadListener_) {
                this.unlistenTo('load', this.loadListener_);
            }
            if (this.el_ && this.el_.contentWindow && this.unloadListener_) {
                this.unloadListener_.call(this.el_.contentWindow);
            }
            this.ResizeObserver = null;
            this.resizeObserver = null;
            this.debouncedHandler_ = null;
            this.loadListener_ = null;
            super.dispose();
        }
    }
    Component.registerComponent('ResizeManager', ResizeManager);
    return ResizeManager;
});