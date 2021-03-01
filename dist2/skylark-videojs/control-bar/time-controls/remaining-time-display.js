/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./time-display","../../component","../../utils/dom"],function(e,t,i){"use strict";class n extends e{constructor(e,t){super(e,t),this.on(e,"durationchange",this.updateContent)}buildCSSClass(){return"vjs-remaining-time"}createEl(){const e=super.createEl();return e.insertBefore(i.createEl("span",{},{"aria-hidden":!0},"-"),this.contentEl_),e}updateContent(e){if("number"!=typeof this.player_.duration())return;let t;t=this.player_.ended()?0:this.player_.remainingTimeDisplay?this.player_.remainingTimeDisplay():this.player_.remainingTime(),this.updateTextNode_(t)}}return n.prototype.labelText_="Remaining Time",n.prototype.controlText_="Remaining Time",t.registerComponent("RemainingTimeDisplay",n),n});
//# sourceMappingURL=../../sourcemaps/control-bar/time-controls/remaining-time-display.js.map
