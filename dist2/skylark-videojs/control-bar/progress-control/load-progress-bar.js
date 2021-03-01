/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["skylark-langx-globals/document","../../component","../../utils/dom","../../utils/clamp"],function(e,t,s,a){"use strict";const l=(e,t)=>a(e/t*100,0,100).toFixed(2)+"%";class r extends t{constructor(e,t){super(e,t),this.partEls_=[],this.on(e,"progress",this.update)}createEl(){const t=super.createEl("div",{className:"vjs-load-progress"}),a=s.createEl("span",{className:"vjs-control-text"}),l=s.createEl("span",{textContent:this.localize("Loaded")}),r=e.createTextNode(": ");return this.percentageEl_=s.createEl("span",{className:"vjs-control-text-loaded-percentage",textContent:"0%"}),t.appendChild(a),a.appendChild(l),a.appendChild(r),a.appendChild(this.percentageEl_),t}dispose(){this.partEls_=null,this.percentageEl_=null,super.dispose()}update(e){this.requestNamedAnimationFrame("LoadProgressBar#update",()=>{const e=this.player_.liveTracker,t=this.player_.buffered(),a=e&&e.isLive()?e.seekableEnd():this.player_.duration(),r=this.player_.bufferedEnd(),n=this.partEls_,d=l(r,a);this.percent_!==d&&(this.el_.style.width=d,s.textContent(this.percentageEl_,d),this.percent_=d);for(let e=0;e<t.length;e++){const a=t.start(e),d=t.end(e);let i=n[e];i||(i=this.el_.appendChild(s.createEl()),n[e]=i),i.dataset.start===a&&i.dataset.end===d||(i.dataset.start=a,i.dataset.end=d,i.style.left=l(a,r),i.style.width=l(d-a,r))}for(let e=n.length;e>t.length;e--)this.el_.removeChild(n[e-1]);n.length=t.length})}}return t.registerComponent("LoadProgressBar",r),r});
//# sourceMappingURL=../../sourcemaps/control-bar/progress-control/load-progress-bar.js.map
