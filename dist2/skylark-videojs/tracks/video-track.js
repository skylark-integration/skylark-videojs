/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./track-enums","./track","../utils/merge-options"],function(e,t,s){"use strict";return class extends t{constructor(t={}){const c=s(t,{kind:e.VideoTrackKind[t.kind]||""});super(c);let n=!1;Object.defineProperty(this,"selected",{get:()=>n,set(e){"boolean"==typeof e&&e!==n&&(n=e,this.trigger("selectedchange"))}}),c.selected&&(this.selected=c.selected)}}});
//# sourceMappingURL=../sourcemaps/tracks/video-track.js.map
