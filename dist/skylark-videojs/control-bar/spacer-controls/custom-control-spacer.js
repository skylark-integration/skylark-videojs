/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./spacer","../../component"],function(e,s){"use strict";class r extends e{buildCSSClass(){return`vjs-custom-control-spacer ${super.buildCSSClass()}`}createEl(){const e=super.createEl({className:this.buildCSSClass()});return e.innerHTML=" ",e}}return s.registerComponent("CustomControlSpacer",r),r});
//# sourceMappingURL=../../sourcemaps/control-bar/spacer-controls/custom-control-spacer.js.map
