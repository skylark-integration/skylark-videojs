/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./component","./utils/dom"],function(e,i){"use strict";class n extends e{createEl(){const e=this.player_.isAudio(),n=this.localize(e?"Audio Player":"Video Player"),s=i.createEl("span",{className:"vjs-control-text",innerHTML:this.localize("{1} is loading.",[n])}),t=super.createEl("div",{className:"vjs-loading-spinner",dir:"ltr"});return t.appendChild(s),t}}return e.registerComponent("LoadingSpinner",n),n});
//# sourceMappingURL=sourcemaps/loading-spinner.js.map
