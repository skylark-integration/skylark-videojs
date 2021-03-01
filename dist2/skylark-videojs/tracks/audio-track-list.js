/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./track-list"],function(e){"use strict";const n=function(e,n){for(let a=0;a<e.length;a++)Object.keys(e[a]).length&&n.id!==e[a].id&&(e[a].enabled=!1)};return class extends e{constructor(e=[]){for(let a=e.length-1;a>=0;a--)if(e[a].enabled){n(e,e[a]);break}super(e),this.changing_=!1}addTrack(e){e.enabled&&n(this,e),super.addTrack(e),e.addEventListener&&(e.enabledChange_=(()=>{this.changing_||(this.changing_=!0,n(this,e),this.changing_=!1,this.trigger("change"))}),e.addEventListener("enabledchange",e.enabledChange_))}removeTrack(e){super.removeTrack(e),e.removeEventListener&&e.enabledChange_&&(e.removeEventListener("enabledchange",e.enabledChange_),e.enabledChange_=null)}}});
//# sourceMappingURL=../sourcemaps/tracks/audio-track-list.js.map
