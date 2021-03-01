/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./time-display","../../component"],function(e,t){"use strict";class r extends e{buildCSSClass(){return"vjs-current-time"}updateContent(e){let t;t=this.player_.ended()?this.player_.duration():this.player_.scrubbing()?this.player_.getCache().currentTime:this.player_.currentTime(),this.updateTextNode_(t)}}return r.prototype.labelText_="Current Time",r.prototype.controlText_="Current Time",t.registerComponent("CurrentTimeDisplay",r),r});
//# sourceMappingURL=../../sourcemaps/control-bar/time-controls/current-time-display.js.map
