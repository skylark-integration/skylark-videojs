/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(function(){"use strict";return class{constructor(t=[]){this.trackElements_=[],Object.defineProperty(this,"length",{get(){return this.trackElements_.length}});for(let e=0,r=t.length;e<r;e++)this.addTrackElement_(t[e])}addTrackElement_(t){const e=this.trackElements_.length;""+e in this||Object.defineProperty(this,e,{get(){return this.trackElements_[e]}}),-1===this.trackElements_.indexOf(t)&&this.trackElements_.push(t)}getTrackElementByTrack_(t){let e;for(let r=0,s=this.trackElements_.length;r<s;r++)if(t===this.trackElements_[r].track){e=this.trackElements_[r];break}return e}removeTrackElement_(t){for(let e=0,r=this.trackElements_.length;e<r;e++)if(t===this.trackElements_[e]){this.trackElements_[e].track&&"function"==typeof this.trackElements_[e].track.off&&this.trackElements_[e].track.off(),"function"==typeof this.trackElements_[e].off&&this.trackElements_[e].off(),this.trackElements_.splice(e,1);break}}}});
//# sourceMappingURL=../sourcemaps/tracks/html-track-element-list.js.map
