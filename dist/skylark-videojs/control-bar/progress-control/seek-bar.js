/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["skylark-langx-globals/document","../../slider/slider","../../component","../../utils/browser","../../utils/dom","../../utils/fn","../../utils/format-time","../../utils/promise","../../utils/keycode","./load-progress-bar","./play-progress-bar","./mouse-time-display"],function(e,t,i,s,r,a,l,n,p){"use strict";const h=5,o=12;class u extends t{constructor(e,t){super(e,t),this.setEventHandlers_()}setEventHandlers_(){this.update_=a.bind(this,this.update),this.update=a.throttle(this.update_,a.UPDATE_REFRESH_INTERVAL),this.listenTo(this.player_,["ended","durationchange","timeupdate"],this.update),this.player_.liveTracker&&this.listenTo(this.player_.liveTracker,"liveedgechange",this.update),this.updateInterval=null,this.listenTo(this.player_,["playing"],this.enableInterval_),this.listenTo(this.player_,["ended","pause","waiting"],this.disableInterval_),"hidden"in e&&"visibilityState"in e&&this.listenTo(e,"visibilitychange",this.toggleVisibility_)}toggleVisibility_(t){e.hidden?this.disableInterval_(t):(this.enableInterval_(),this.update())}enableInterval_(){this.updateInterval||(this.updateInterval=this.setInterval(this.update,a.UPDATE_REFRESH_INTERVAL))}disableInterval_(e){this.player_.liveTracker&&this.player_.liveTracker.isLive()&&e&&"ended"!==e.type||this.updateInterval&&(this.clearInterval(this.updateInterval),this.updateInterval=null)}createEl(){return super.createEl("div",{className:"vjs-progress-holder"},{"aria-label":this.localize("Progress Bar")})}update(e){const t=super.update();return this.requestNamedAnimationFrame("SeekBar#update",()=>{const e=this.player_.ended()?this.player_.duration():this.getCurrentTime_(),i=this.player_.liveTracker;let s=this.player_.duration();i&&i.isLive()&&(s=this.player_.liveTracker.liveCurrentTime()),this.percent_!==t&&(this.el_.setAttribute("aria-valuenow",(100*t).toFixed(2)),this.percent_=t),this.currentTime_===e&&this.duration_===s||(this.el_.setAttribute("aria-valuetext",this.localize("progress bar timing: currentTime={1} duration={2}",[l(e,s),l(s,s)],"{1} of {2}")),this.currentTime_=e,this.duration_=s),this.bar&&this.bar.update(r.getBoundingClientRect(this.el()),this.getProgress())}),t}getCurrentTime_(){return this.player_.scrubbing()?this.player_.getCache().currentTime:this.player_.currentTime()}getPercent(){const e=this.getCurrentTime_();let t;const i=this.player_.liveTracker;return i&&i.isLive()?(t=(e-i.seekableStart())/i.liveWindow(),i.atLiveEdge()&&(t=1)):t=e/this.player_.duration(),t}handleMouseDown(e){r.isSingleLeftClick(e)&&(e.stopPropagation(),this.player_.scrubbing(!0),this.videoWasPlaying=!this.player_.paused(),this.player_.pause(),super.handleMouseDown(e))}handleMouseMove(e){if(!r.isSingleLeftClick(e))return;let t;const i=this.calculateDistance(e),s=this.player_.liveTracker;if(s&&s.isLive()){if(i>=.99)return void s.seekToLiveEdge();const e=s.seekableStart(),r=s.liveCurrentTime();if((t=e+i*s.liveWindow())>=r&&(t=r),t<=e&&(t=e+.1),t===1/0)return}else(t=i*this.player_.duration())===this.player_.duration()&&(t-=.1);this.player_.currentTime(t)}enable(){super.enable();const e=this.getChild("mouseTimeDisplay");e&&e.show()}disable(){super.disable();const e=this.getChild("mouseTimeDisplay");e&&e.hide()}handleMouseUp(e){super.handleMouseUp(e),e&&e.stopPropagation(),this.player_.scrubbing(!1),this.player_.trigger({type:"timeupdate",target:this,manuallyTriggered:!0}),this.videoWasPlaying?n.silencePromise(this.player_.play()):this.update_()}stepForward(){this.player_.currentTime(this.player_.currentTime()+h)}stepBack(){this.player_.currentTime(this.player_.currentTime()-h)}handleAction(e){this.player_.paused()?this.player_.play():this.player_.pause()}handleKeyDown(e){if(p.isEventKey(e,"Space")||p.isEventKey(e,"Enter"))e.preventDefault(),e.stopPropagation(),this.handleAction(e);else if(p.isEventKey(e,"Home"))e.preventDefault(),e.stopPropagation(),this.player_.currentTime(0);else if(p.isEventKey(e,"End"))e.preventDefault(),e.stopPropagation(),this.player_.currentTime(this.player_.duration());else if(/^[0-9]$/.test(p(e))){e.preventDefault(),e.stopPropagation();const t=10*(p.codes[p(e)]-p.codes[0])/100;this.player_.currentTime(this.player_.duration()*t)}else p.isEventKey(e,"PgDn")?(e.preventDefault(),e.stopPropagation(),this.player_.currentTime(this.player_.currentTime()-h*o)):p.isEventKey(e,"PgUp")?(e.preventDefault(),e.stopPropagation(),this.player_.currentTime(this.player_.currentTime()+h*o)):super.handleKeyDown(e)}dispose(){this.disableInterval_(),thisunlistenTo(this.player_,["ended","durationchange","timeupdate"],this.update),this.player_.liveTracker&&this.listenTo(this.player_.liveTracker,"liveedgechange",this.update),this.unlistenTo(this.player_,["playing"],this.enableInterval_),this.unlistenTo(this.player_,["ended","pause","waiting"],this.disableInterval_),"hidden"in e&&"visibilityState"in e&&this.unlistenTo(e,"visibilitychange",this.toggleVisibility_),super.dispose()}}return u.prototype.options_={children:["loadProgressBar","playProgressBar"],barName:"playProgressBar"},s.IS_IOS||s.IS_ANDROID||u.prototype.options_.children.splice(1,0,"mouseTimeDisplay"),i.registerComponent("SeekBar",u),u});
//# sourceMappingURL=../../sourcemaps/control-bar/progress-control/seek-bar.js.map
