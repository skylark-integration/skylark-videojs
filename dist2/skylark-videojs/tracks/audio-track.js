/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./track-enums","./track","../utils/merge-options"],function(e,t,n){"use strict";return class extends t{constructor(t={}){const s=n(t,{kind:e.AudioTrackKind[t.kind]||""});super(s);let i=!1;Object.defineProperty(this,"enabled",{get:()=>i,set(e){"boolean"==typeof e&&e!==i&&(i=e,this.trigger("enabledchange"))}}),s.enabled&&(this.enabled=s.enabled),this.loaded_=!0}}});
//# sourceMappingURL=../sourcemaps/tracks/audio-track.js.map
