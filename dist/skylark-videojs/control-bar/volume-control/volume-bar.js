/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["../../slider/slider","../../component","../../utils/dom","./volume-level"],function(e,t,l){"use strict";class s extends e{constructor(e,t){super(e,t),this.on("slideractive",this.updateLastVolume_),this.on(e,"volumechange",this.updateARIAAttributes),e.ready(()=>this.updateARIAAttributes())}createEl(){return super.createEl("div",{className:"vjs-volume-bar vjs-slider-bar"},{"aria-label":this.localize("Volume Level"),"aria-live":"polite"})}handleMouseDown(e){l.isSingleLeftClick(e)&&super.handleMouseDown(e)}handleMouseMove(e){l.isSingleLeftClick(e)&&(this.checkMuted(),this.player_.volume(this.calculateDistance(e)))}checkMuted(){this.player_.muted()&&this.player_.muted(!1)}getPercent(){return this.player_.muted()?0:this.player_.volume()}stepForward(){this.checkMuted(),this.player_.volume(this.player_.volume()+.1)}stepBack(){this.checkMuted(),this.player_.volume(this.player_.volume()-.1)}updateARIAAttributes(e){const t=this.player_.muted()?0:this.volumeAsPercentage_();this.el_.setAttribute("aria-valuenow",t),this.el_.setAttribute("aria-valuetext",t+"%")}volumeAsPercentage_(){return Math.round(100*this.player_.volume())}updateLastVolume_(){const e=this.player_.volume();this.one("sliderinactive",()=>{0===this.player_.volume()&&this.player_.lastVolume_(e)})}}return s.prototype.options_={children:["volumeLevel"],barName:"volumeLevel"},s.prototype.playerEvent="volumechange",t.registerComponent("VolumeBar",s),s});
//# sourceMappingURL=../../sourcemaps/control-bar/volume-control/volume-bar.js.map
