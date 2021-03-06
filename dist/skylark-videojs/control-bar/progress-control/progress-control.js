/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["../../component","../../utils/dom","../../utils/clamp","../../utils/fn","./seek-bar"],function(e,s,t,o){"use strict";class n extends e{constructor(e,s){super(e,s),this.handleMouseMove=o.throttle(o.bind(this,this.handleMouseMove),o.UPDATE_REFRESH_INTERVAL),this.throttledHandleMouseSeek=o.throttle(o.bind(this,this.handleMouseSeek),o.UPDATE_REFRESH_INTERVAL),this.enable()}createEl(){return super.createEl("div",{className:"vjs-progress-control vjs-control"})}handleMouseMove(e){const o=this.getChild("seekBar");if(!o)return;const n=o.getChild("playProgressBar"),i=o.getChild("mouseTimeDisplay");if(!n&&!i)return;const h=o.el(),l=s.findPosition(h);let d=s.getPointerPosition(h,e).x;d=t(d,0,1),i&&i.update(l,d),n&&n.update(l,o.getProgress())}handleMouseSeek(e){const s=this.getChild("seekBar");s&&s.handleMouseMove(e)}enabled(){return this.enabled_}disable(){this.children().forEach(e=>e.disable&&e.disable()),this.enabled()&&(this.unlistenTo(["mousedown","touchstart"],this.handleMouseDown),this.unlistenTo(this.el_,"mousemove",this.handleMouseMove),this.handleMouseUp(),this.addClass("disabled"),this.enabled_=!1)}enable(){this.children().forEach(e=>e.enable&&e.enable()),this.enabled()||(this.listenTo(["mousedown","touchstart"],this.handleMouseDown),this.listenTo(this.el_,"mousemove",this.handleMouseMove),this.removeClass("disabled"),this.enabled_=!0)}handleMouseDown(e){const s=this.el_.ownerDocument,t=this.getChild("seekBar");t&&t.handleMouseDown(e),this.listenTo(s,"mousemove",this.throttledHandleMouseSeek),this.listenTo(s,"touchmove",this.throttledHandleMouseSeek),this.listenTo(s,"mouseup",this.handleMouseUp),this.listenTo(s,"touchend",this.handleMouseUp)}handleMouseUp(e){const s=this.el_.ownerDocument,t=this.getChild("seekBar");t&&t.handleMouseUp(e),this.unlistenTo(s,"mousemove",this.throttledHandleMouseSeek),this.unlistenTo(s,"touchmove",this.throttledHandleMouseSeek),this.unlistenTo(s,"mouseup",this.handleMouseUp),this.unlistenTo(s,"touchend",this.handleMouseUp)}}return n.prototype.options_={children:["seekBar"]},e.registerComponent("ProgressControl",n),n});
//# sourceMappingURL=../../sourcemaps/control-bar/progress-control/progress-control.js.map
