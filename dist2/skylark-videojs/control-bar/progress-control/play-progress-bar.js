/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["../../component","../../utils/browser","../../utils/fn","./time-tooltip"],function(t,e,r){"use strict";class i extends t{constructor(t,e){super(t,e),this.update=r.throttle(r.bind(this,this.update),r.UPDATE_REFRESH_INTERVAL)}createEl(){return super.createEl("div",{className:"vjs-play-progress vjs-slider-bar"},{"aria-hidden":"true"})}update(t,e){const r=this.getChild("timeTooltip");if(!r)return;const i=this.player_.scrubbing()?this.player_.getCache().currentTime:this.player_.currentTime();r.updateTime(t,e,i)}}return i.prototype.options_={children:[]},e.IS_IOS||e.IS_ANDROID||i.prototype.options_.children.push("timeTooltip"),t.registerComponent("PlayProgressBar",i),i});
//# sourceMappingURL=../../sourcemaps/control-bar/progress-control/play-progress-bar.js.map
