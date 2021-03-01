/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["../../component","../../utils/dom","../../utils/format-time","../../utils/fn"],function(t,e,i,r){"use strict";class s extends t{constructor(t,e){super(t,e),this.update=r.throttle(r.bind(this,this.update),r.UPDATE_REFRESH_INTERVAL)}createEl(){return super.createEl("div",{className:"vjs-time-tooltip"},{"aria-hidden":"true"})}update(t,i,r){const s=e.findPosition(this.el_),l=e.getBoundingClientRect(this.player_.el()),n=t.width*i;if(!l||!s)return;const o=t.left-l.left+n,a=t.width-n+(l.right-t.right);let h=s.width/2;o<h?h+=h-o:a<h&&(h=a),h<0?h=0:h>s.width&&(h=s.width),h=Math.round(h),this.el_.style.right=`-${h}px`,this.write(r)}write(t){e.textContent(this.el_,t)}updateTime(t,e,r,s){this.requestNamedAnimationFrame("TimeTooltip#updateTime",()=>{let l;const n=this.player_.duration();if(this.player_.liveTracker&&this.player_.liveTracker.isLive()){const t=this.player_.liveTracker.liveWindow(),r=t-e*t;l=(r<1?"":"-")+i(r,t)}else l=i(r,n);this.update(t,e,l),s&&s()})}}return t.registerComponent("TimeTooltip",s),s});
//# sourceMappingURL=../../sourcemaps/control-bar/progress-control/time-tooltip.js.map
