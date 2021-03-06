/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["skylark-langx-globals/document","../../component","../../utils/dom","../../utils/format-time","../../utils/log"],function(e,t,i,n,s){"use strict";class o extends t{constructor(e,t){super(e,t),this.listenTo(e,["timeupdate","ended"],this.updateContent),this.updateTextNode_()}createEl(){const e=this.buildCSSClass(),t=super.createEl("div",{className:`${e} vjs-time-control vjs-control`,innerHTML:`<span class="vjs-control-text" role="presentation">${this.localize(this.labelText_)} </span>`});return this.contentEl_=i.createEl("span",{className:`${e}-display`},{"aria-live":"off",role:"presentation"}),t.appendChild(this.contentEl_),t}dispose(){this.contentEl_=null,this.textNode_=null,super.dispose()}updateTextNode_(t=0){t=n(t),this.formattedTime_!==t&&(this.formattedTime_=t,this.requestNamedAnimationFrame("TimeDisplay#updateTextNode_",()=>{if(!this.contentEl_)return;let t=this.textNode_;t&&this.contentEl_.firstChild!==t&&(t=null,s.warn("TimeDisplay#updateTextnode_: Prevented replacement of text node element since it was no longer a child of this node. Appending a new node instead.")),this.textNode_=e.createTextNode(this.formattedTime_),this.textNode_&&(t?this.contentEl_.replaceChild(this.textNode_,t):this.contentEl_.appendChild(this.textNode_))}))}updateContent(e){}}return o.prototype.labelText_="Time",o.prototype.controlText_="Time",t.registerComponent("TimeDisplay",o),o});
//# sourceMappingURL=../../sourcemaps/control-bar/time-controls/time-display.js.map
