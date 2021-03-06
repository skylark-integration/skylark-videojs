/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["../component","../utils/dom"],function(e,t){"use strict";class s extends e{constructor(e,t){super(e,t),this.updateShowing(),this.listenTo(this.player(),"durationchange",this.updateShowing)}createEl(){const e=super.createEl("div",{className:"vjs-live-control vjs-control"});return this.contentEl_=t.createEl("div",{className:"vjs-live-display",innerHTML:`<span class="vjs-control-text">${this.localize("Stream Type")} </span>${this.localize("LIVE")}`},{"aria-live":"off"}),e.appendChild(this.contentEl_),e}dispose(){this.contentEl_=null,super.dispose()}updateShowing(e){this.player().duration()===1/0?this.show():this.hide()}}return e.registerComponent("LiveDisplay",s),s});
//# sourceMappingURL=../sourcemaps/control-bar/live-display.js.map
