/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./time-display","../../component"],function(t,e){"use strict";class n extends t{constructor(t,e){super(t,e),this.on(t,"durationchange",this.updateContent),this.on(t,"loadstart",this.updateContent),this.on(t,"loadedmetadata",this.updateContent)}buildCSSClass(){return"vjs-duration"}updateContent(t){const e=this.player_.duration();this.updateTextNode_(e)}}return n.prototype.labelText_="Duration",n.prototype.controlText_="Duration",e.registerComponent("DurationDisplay",n),n});
//# sourceMappingURL=../../sourcemaps/control-bar/time-controls/duration-display.js.map
