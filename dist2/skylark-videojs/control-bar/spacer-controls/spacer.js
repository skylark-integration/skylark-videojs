/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["../../component"],function(e){"use strict";class s extends e{buildCSSClass(){return`vjs-spacer ${super.buildCSSClass()}`}createEl(){return super.createEl("div",{className:this.buildCSSClass()})}}return e.registerComponent("Spacer",s),s});
//# sourceMappingURL=../../sourcemaps/control-bar/spacer-controls/spacer.js.map
