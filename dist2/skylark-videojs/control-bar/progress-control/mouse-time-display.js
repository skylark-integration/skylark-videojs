/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["../../component","../../utils/fn","./time-tooltip"],function(t,e){"use strict";class i extends t{constructor(t,i){super(t,i),this.update=e.throttle(e.bind(this,this.update),e.UPDATE_REFRESH_INTERVAL)}createEl(){return super.createEl("div",{className:"vjs-mouse-display"})}update(t,e){const i=e*this.player_.duration();this.getChild("timeTooltip").updateTime(t,e,i,()=>{this.el_.style.left=`${t.width*e}px`})}}return i.prototype.options_={children:["timeTooltip"]},t.registerComponent("MouseTimeDisplay",i),i});
//# sourceMappingURL=../../sourcemaps/control-bar/progress-control/mouse-time-display.js.map
