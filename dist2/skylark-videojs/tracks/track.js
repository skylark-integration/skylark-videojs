/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["../utils/guid","../event-target"],function(e,t){"use strict";return class extends t{constructor(t={}){super();const n={id:t.id||"vjs_track_"+e.newGUID(),kind:t.kind||"",language:t.language||""};let i=t.label||"";for(const e in n)Object.defineProperty(this,e,{get:()=>n[e],set(){}});Object.defineProperty(this,"label",{get:()=>i,set(e){e!==i&&(i=e,this.trigger("labelchange"))}})}}});
//# sourceMappingURL=../sourcemaps/tracks/track.js.map
