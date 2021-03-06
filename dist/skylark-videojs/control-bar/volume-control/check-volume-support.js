/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(function(){"use strict";return function(e,t){t.tech_&&!t.tech_.featuresVolumeControl&&e.addClass("vjs-hidden"),e.listenTo(t,"loadstart",function(){t.tech_.featuresVolumeControl?e.removeClass("vjs-hidden"):e.addClass("vjs-hidden")})}});
//# sourceMappingURL=../../sourcemaps/control-bar/volume-control/check-volume-support.js.map
