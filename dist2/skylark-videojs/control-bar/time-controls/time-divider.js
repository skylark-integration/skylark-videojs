/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["../../component"],function(e){"use strict";class i extends e{createEl(){return super.createEl("div",{className:"vjs-time-control vjs-time-divider",innerHTML:"<div><span>/</span></div>"},{"aria-hidden":!0})}}return e.registerComponent("TimeDivider",i),i});
//# sourceMappingURL=../../sourcemaps/control-bar/time-controls/time-divider.js.map
