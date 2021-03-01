/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["../../component"],function(e){"use strict";class n extends e{createEl(){return super.createEl("div",{className:"vjs-volume-level",innerHTML:'<span class="vjs-control-text"></span>'})}}return e.registerComponent("VolumeLevel",n),n});
//# sourceMappingURL=../../sourcemaps/control-bar/volume-control/volume-level.js.map
