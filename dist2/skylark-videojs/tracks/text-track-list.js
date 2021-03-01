/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./track-list"],function(e){"use strict";return class extends e{addTrack(e){super.addTrack(e),this.queueChange_||(this.queueChange_=(()=>this.queueTrigger("change"))),this.triggerSelectedlanguagechange||(this.triggerSelectedlanguagechange_=(()=>this.trigger("selectedlanguagechange"))),e.addEventListener("modechange",this.queueChange_),-1===["metadata","chapters"].indexOf(e.kind)&&e.addEventListener("modechange",this.triggerSelectedlanguagechange_)}removeTrack(e){super.removeTrack(e),e.removeEventListener&&(this.queueChange_&&e.removeEventListener("modechange",this.queueChange_),this.selectedlanguagechange_&&e.removeEventListener("modechange",this.triggerSelectedlanguagechange_))}}});
//# sourceMappingURL=../sourcemaps/tracks/text-track-list.js.map
