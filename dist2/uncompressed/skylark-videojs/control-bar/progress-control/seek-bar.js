define([
    'skylark-langx-globals/document',
    '../../slider/slider',
    '../../component',
    '../../utils/browser',
    '../../utils/dom',
    '../../utils/fn',
    '../../utils/format-time',
    '../../utils/promise',
    '../../utils/keycode',
    './load-progress-bar',
    './play-progress-bar',
    './mouse-time-display'
], function (document,Slider, Component, browser, Dom, Fn, formatTime, promise, keycode) {
    'use strict';
    const STEP_SECONDS = 5;
    const PAGE_KEY_MULTIPLIER = 12;
    class SeekBar extends Slider {
        constructor(player, options) {
            super(player, options);
            this.setEventHandlers_();
        }
        setEventHandlers_() {
            this.update_ = Fn.bind(this, this.update);
            this.update = Fn.throttle(this.update_, Fn.UPDATE_REFRESH_INTERVAL);
            this.on(this.player_, [
                'ended',
                'durationchange',
                'timeupdate'
            ], this.update);
            if (this.player_.liveTracker) {
                this.on(this.player_.liveTracker, 'liveedgechange', this.update);
            }
            this.updateInterval = null;
            this.on(this.player_, ['playing'], this.enableInterval_);
            this.on(this.player_, [
                'ended',
                'pause',
                'waiting'
            ], this.disableInterval_);
            if ('hidden' in document && 'visibilityState' in document) {
                this.on(document, 'visibilitychange', this.toggleVisibility_);
            }
        }
        toggleVisibility_(e) {
            if (document.hidden) {
                this.disableInterval_(e);
            } else {
                this.enableInterval_();
                this.update();
            }
        }
        enableInterval_() {
            if (this.updateInterval) {
                return;
            }
            this.updateInterval = this.setInterval(this.update, Fn.UPDATE_REFRESH_INTERVAL);
        }
        disableInterval_(e) {
            if (this.player_.liveTracker && this.player_.liveTracker.isLive() && e && e.type !== 'ended') {
                return;
            }
            if (!this.updateInterval) {
                return;
            }
            this.clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        createEl() {
            return super.createEl('div', { className: 'vjs-progress-holder' }, { 'aria-label': this.localize('Progress Bar') });
        }
        update(event) {
            const percent = super.update();
            this.requestNamedAnimationFrame('SeekBar#update', () => {
                const currentTime = this.player_.ended() ? this.player_.duration() : this.getCurrentTime_();
                const liveTracker = this.player_.liveTracker;
                let duration = this.player_.duration();
                if (liveTracker && liveTracker.isLive()) {
                    duration = this.player_.liveTracker.liveCurrentTime();
                }
                if (this.percent_ !== percent) {
                    this.el_.setAttribute('aria-valuenow', (percent * 100).toFixed(2));
                    this.percent_ = percent;
                }
                if (this.currentTime_ !== currentTime || this.duration_ !== duration) {
                    this.el_.setAttribute('aria-valuetext', this.localize('progress bar timing: currentTime={1} duration={2}', [
                        formatTime(currentTime, duration),
                        formatTime(duration, duration)
                    ], '{1} of {2}'));
                    this.currentTime_ = currentTime;
                    this.duration_ = duration;
                }
                if (this.bar) {
                    this.bar.update(Dom.getBoundingClientRect(this.el()), this.getProgress());
                }
            });
            return percent;
        }
        getCurrentTime_() {
            return this.player_.scrubbing() ? this.player_.getCache().currentTime : this.player_.currentTime();
        }
        getPercent() {
            const currentTime = this.getCurrentTime_();
            let percent;
            const liveTracker = this.player_.liveTracker;
            if (liveTracker && liveTracker.isLive()) {
                percent = (currentTime - liveTracker.seekableStart()) / liveTracker.liveWindow();
                if (liveTracker.atLiveEdge()) {
                    percent = 1;
                }
            } else {
                percent = currentTime / this.player_.duration();
            }
            return percent;
        }
        handleMouseDown(event) {
            if (!Dom.isSingleLeftClick(event)) {
                return;
            }
            event.stopPropagation();
            this.player_.scrubbing(true);
            this.videoWasPlaying = !this.player_.paused();
            this.player_.pause();
            super.handleMouseDown(event);
        }
        handleMouseMove(event) {
            if (!Dom.isSingleLeftClick(event)) {
                return;
            }
            let newTime;
            const distance = this.calculateDistance(event);
            const liveTracker = this.player_.liveTracker;
            if (!liveTracker || !liveTracker.isLive()) {
                newTime = distance * this.player_.duration();
                if (newTime === this.player_.duration()) {
                    newTime = newTime - 0.1;
                }
            } else {
                if (distance >= 0.99) {
                    liveTracker.seekToLiveEdge();
                    return;
                }
                const seekableStart = liveTracker.seekableStart();
                const seekableEnd = liveTracker.liveCurrentTime();
                newTime = seekableStart + distance * liveTracker.liveWindow();
                if (newTime >= seekableEnd) {
                    newTime = seekableEnd;
                }
                if (newTime <= seekableStart) {
                    newTime = seekableStart + 0.1;
                }
                if (newTime === Infinity) {
                    return;
                }
            }
            this.player_.currentTime(newTime);
        }
        enable() {
            super.enable();
            const mouseTimeDisplay = this.getChild('mouseTimeDisplay');
            if (!mouseTimeDisplay) {
                return;
            }
            mouseTimeDisplay.show();
        }
        disable() {
            super.disable();
            const mouseTimeDisplay = this.getChild('mouseTimeDisplay');
            if (!mouseTimeDisplay) {
                return;
            }
            mouseTimeDisplay.hide();
        }
        handleMouseUp(event) {
            super.handleMouseUp(event);
            if (event) {
                event.stopPropagation();
            }
            this.player_.scrubbing(false);
            this.player_.trigger({
                type: 'timeupdate',
                target: this,
                manuallyTriggered: true
            });
            if (this.videoWasPlaying) {
                promise.silencePromise(this.player_.play());
            } else {
                this.update_();
            }
        }
        stepForward() {
            this.player_.currentTime(this.player_.currentTime() + STEP_SECONDS);
        }
        stepBack() {
            this.player_.currentTime(this.player_.currentTime() - STEP_SECONDS);
        }
        handleAction(event) {
            if (this.player_.paused()) {
                this.player_.play();
            } else {
                this.player_.pause();
            }
        }
        handleKeyDown(event) {
            if (keycode.isEventKey(event, 'Space') || keycode.isEventKey(event, 'Enter')) {
                event.preventDefault();
                event.stopPropagation();
                this.handleAction(event);
            } else if (keycode.isEventKey(event, 'Home')) {
                event.preventDefault();
                event.stopPropagation();
                this.player_.currentTime(0);
            } else if (keycode.isEventKey(event, 'End')) {
                event.preventDefault();
                event.stopPropagation();
                this.player_.currentTime(this.player_.duration());
            } else if (/^[0-9]$/.test(keycode(event))) {
                event.preventDefault();
                event.stopPropagation();
                const gotoFraction = (keycode.codes[keycode(event)] - keycode.codes['0']) * 10 / 100;
                this.player_.currentTime(this.player_.duration() * gotoFraction);
            } else if (keycode.isEventKey(event, 'PgDn')) {
                event.preventDefault();
                event.stopPropagation();
                this.player_.currentTime(this.player_.currentTime() - STEP_SECONDS * PAGE_KEY_MULTIPLIER);
            } else if (keycode.isEventKey(event, 'PgUp')) {
                event.preventDefault();
                event.stopPropagation();
                this.player_.currentTime(this.player_.currentTime() + STEP_SECONDS * PAGE_KEY_MULTIPLIER);
            } else {
                super.handleKeyDown(event);
            }
        }
        dispose() {
            this.disableInterval_();
            this.off(this.player_, [
                'ended',
                'durationchange',
                'timeupdate'
            ], this.update);
            if (this.player_.liveTracker) {
                this.on(this.player_.liveTracker, 'liveedgechange', this.update);
            }
            this.off(this.player_, ['playing'], this.enableInterval_);
            this.off(this.player_, [
                'ended',
                'pause',
                'waiting'
            ], this.disableInterval_);
            if ('hidden' in document && 'visibilityState' in document) {
                this.off(document, 'visibilitychange', this.toggleVisibility_);
            }
            super.dispose();
        }
    }
    SeekBar.prototype.options_ = {
        children: [
            'loadProgressBar',
            'playProgressBar'
        ],
        barName: 'playProgressBar'
    };
    if (!browser.IS_IOS && !browser.IS_ANDROID) {
        SeekBar.prototype.options_.children.splice(1, 0, 'mouseTimeDisplay');
    }
    Component.registerComponent('SeekBar', SeekBar);
    return SeekBar;
});