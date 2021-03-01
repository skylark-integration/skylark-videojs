/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(function(){"use strict";class t{constructor(e){t.prototype.setCues_.call(this,e),Object.defineProperty(this,"length",{get(){return this.length_}})}setCues_(t){const e=this.length||0;let s=0;const n=t.length;this.cues_=t,this.length_=t.length;const i=function(t){""+t in this||Object.defineProperty(this,""+t,{get(){return this.cues_[t]}})};if(e<n)for(s=e;s<n;s++)i.call(this,s)}getCueById(t){let e=null;for(let s=0,n=this.length;s<n;s++){const n=this[s];if(n.id===t){e=n;break}}return e}}return t});
//# sourceMappingURL=../sourcemaps/tracks/text-track-cue-list.js.map
