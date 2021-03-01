/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./track-list"],function(e){"use strict";const t=function(e,t){for(let n=0;n<e.length;n++)Object.keys(e[n]).length&&t.id!==e[n].id&&(e[n].selected=!1)};return class extends e{constructor(e=[]){for(let n=e.length-1;n>=0;n--)if(e[n].selected){t(e,e[n]);break}super(e),this.changing_=!1,Object.defineProperty(this,"selectedIndex",{get(){for(let e=0;e<this.length;e++)if(this[e].selected)return e;return-1},set(){}})}addTrack(e){e.selected&&t(this,e),super.addTrack(e),e.addEventListener&&(e.selectedChange_=(()=>{this.changing_||(this.changing_=!0,t(this,e),this.changing_=!1,this.trigger("change"))}),e.addEventListener("selectedchange",e.selectedChange_))}removeTrack(e){super.removeTrack(e),e.removeEventListener&&e.selectedChange_&&(e.removeEventListener("selectedchange",e.selectedChange_),e.selectedChange_=null)}}});
//# sourceMappingURL=../sourcemaps/tracks/video-track-list.js.map
