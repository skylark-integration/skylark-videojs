define([
    './component',
    './utils/merge-options',
    './utils/browser',
    './utils/fn'
], function (Component, mergeOptions, browser,  Fn) {
    'use strict';
    const defaults = {
        trackingThreshold: 30,
        liveTolerance: 15
    };
    class LiveTracker extends Component {
        constructor(player, options) {
            const options_ = mergeOptions(defaults, options, { createEl: false });
            super(player, options_);
            this.reset_();
            this.on(this.player_, 'durationchange', this.handleDurationchange);
            if (browser.IE_VERSION && 'hidden' in document && 'visibilityState' in document) {
                this.on(document, 'visibilitychange', this.handleVisibilityChange);
            }
        }
        handleVisibilityChange() {
            if (this.player_.duration() !== Infinity) {
                return;
            }
            if (document.hidden) {
                this.stopTracking();
            } else {
                this.startTracking();
            }
        }
        trackLive_() {
            const seekable = this.player_.seekable();
            if (!seekable || !seekable.length) {
                return;
            }
            const newTime = Number(window.performance.now().toFixed(4));
            const deltaTime = this.lastTime_ === -1 ? 0 : (newTime - this.lastTime_) / 1000;
            this.lastTime_ = newTime;
            this.pastSeekEnd_ = this.pastSeekEnd() + deltaTime;
            const liveCurrentTime = this.liveCurrentTime();
            const currentTime = this.player_.currentTime();
            let isBehind = this.player_.paused() || this.seekedBehindLive_ || Math.abs(liveCurrentTime - currentTime) > this.options_.liveTolerance;
            if (!this.timeupdateSeen_ || liveCurrentTime === Infinity) {
                isBehind = false;
            }
            if (isBehind !== this.behindLiveEdge_) {
                this.behindLiveEdge_ = isBehind;
                this.trigger('liveedgechange');
            }
        }
        handleDurationchange() {
            if (this.player_.duration() === Infinity && this.liveWindow() >= this.options_.trackingThreshold) {
                if (this.player_.options_.liveui) {
                    this.player_.addClass('vjs-liveui');
                }
                this.startTracking();
            } else {
                this.player_.removeClass('vjs-liveui');
                this.stopTracking();
            }
        }
        startTracking() {
            if (this.isTracking()) {
                return;
            }
            if (!this.timeupdateSeen_) {
                this.timeupdateSeen_ = this.player_.hasStarted();
            }
            this.trackingInterval_ = this.setInterval(this.trackLive_, Fn.UPDATE_REFRESH_INTERVAL);
            this.trackLive_();
            this.on(this.player_, [
                'play',
                'pause'
            ], this.trackLive_);
            if (!this.timeupdateSeen_) {
                this.one(this.player_, 'play', this.handlePlay);
                this.one(this.player_, 'timeupdate', this.handleFirstTimeupdate);
            } else {
                this.on(this.player_, 'seeked', this.handleSeeked);
            }
        }
        handleFirstTimeupdate() {
            this.timeupdateSeen_ = true;
            this.on(this.player_, 'seeked', this.handleSeeked);
        }
        handleSeeked() {
            const timeDiff = Math.abs(this.liveCurrentTime() - this.player_.currentTime());
            this.seekedBehindLive_ = this.skipNextSeeked_ ? false : timeDiff > 2;
            this.skipNextSeeked_ = false;
            this.trackLive_();
        }
        handlePlay() {
            this.one(this.player_, 'timeupdate', this.seekToLiveEdge);
        }
        reset_() {
            this.lastTime_ = -1;
            this.pastSeekEnd_ = 0;
            this.lastSeekEnd_ = -1;
            this.behindLiveEdge_ = true;
            this.timeupdateSeen_ = false;
            this.seekedBehindLive_ = false;
            this.skipNextSeeked_ = false;
            this.clearInterval(this.trackingInterval_);
            this.trackingInterval_ = null;
            this.off(this.player_, [
                'play',
                'pause'
            ], this.trackLive_);
            this.off(this.player_, 'seeked', this.handleSeeked);
            this.off(this.player_, 'play', this.handlePlay);
            this.off(this.player_, 'timeupdate', this.handleFirstTimeupdate);
            this.off(this.player_, 'timeupdate', this.seekToLiveEdge);
        }
        stopTracking() {
            if (!this.isTracking()) {
                return;
            }
            this.reset_();
            this.trigger('liveedgechange');
        }
        seekableEnd() {
            const seekable = this.player_.seekable();
            const seekableEnds = [];
            let i = seekable ? seekable.length : 0;
            while (i--) {
                seekableEnds.push(seekable.end(i));
            }
            return seekableEnds.length ? seekableEnds.sort()[seekableEnds.length - 1] : Infinity;
        }
        seekableStart() {
            const seekable = this.player_.seekable();
            const seekableStarts = [];
            let i = seekable ? seekable.length : 0;
            while (i--) {
                seekableStarts.push(seekable.start(i));
            }
            return seekableStarts.length ? seekableStarts.sort()[0] : 0;
        }
        liveWindow() {
            const liveCurrentTime = this.liveCurrentTime();
            if (liveCurrentTime === Infinity) {
                return 0;
            }
            return liveCurrentTime - this.seekableStart();
        }
        isLive() {
            return this.isTracking();
        }
        atLiveEdge() {
            return !this.behindLiveEdge();
        }
        liveCurrentTime() {
            return this.pastSeekEnd() + this.seekableEnd();
        }
        pastSeekEnd() {
            const seekableEnd = this.seekableEnd();
            if (this.lastSeekEnd_ !== -1 && seekableEnd !== this.lastSeekEnd_) {
                this.pastSeekEnd_ = 0;
            }
            this.lastSeekEnd_ = seekableEnd;
            return this.pastSeekEnd_;
        }
        behindLiveEdge() {
            return this.behindLiveEdge_;
        }
        isTracking() {
            return typeof this.trackingInterval_ === 'number';
        }
        seekToLiveEdge() {
            this.seekedBehindLive_ = false;
            if (this.atLiveEdge()) {
                return;
            }
            this.skipNextSeeked_ = true;
            this.player_.currentTime(this.liveCurrentTime());
        }
        dispose() {
            this.off(document, 'visibilitychange', this.handleVisibilityChange);
            this.stopTracking();
            super.dispose();
        }
    }
    Component.registerComponent('LiveTracker', LiveTracker);
    return LiveTracker;
});