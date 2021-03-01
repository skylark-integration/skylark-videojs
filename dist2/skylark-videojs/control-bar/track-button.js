/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["../menu/menu-button","../component","../utils/fn"],function(e,t,n){"use strict";class r extends e{constructor(e,t){const r=t.tracks;if(super(e,t),this.items.length<=1&&this.hide(),!r)return;const s=n.bind(this,this.update);r.addEventListener("removetrack",s),r.addEventListener("addtrack",s),r.addEventListener("labelchange",s),this.player_.on("ready",s),this.player_.on("dispose",function(){r.removeEventListener("removetrack",s),r.removeEventListener("addtrack",s),r.removeEventListener("labelchange",s)})}}return t.registerComponent("TrackButton",r),r});
//# sourceMappingURL=../sourcemaps/control-bar/track-button.js.map
