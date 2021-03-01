/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["../event-target","../mixins/evented"],function(t,e){"use strict";class r extends t{constructor(t=[]){super(),this.tracks_=[],Object.defineProperty(this,"length",{get(){return this.tracks_.length}});for(let e=0;e<t.length;e++)this.addTrack(t[e])}addTrack(t){const r=this.tracks_.length;""+r in this||Object.defineProperty(this,r,{get(){return this.tracks_[r]}}),-1===this.tracks_.indexOf(t)&&(this.tracks_.push(t),this.trigger({track:t,type:"addtrack",target:this})),t.labelchange_=(()=>{this.trigger({track:t,type:"labelchange",target:this})}),e.isEvented(t)&&t.addEventListener("labelchange",t.labelchange_)}removeTrack(t){let e;for(let r=0,a=this.length;r<a;r++)if(this[r]===t){(e=this[r]).off&&e.off(),this.tracks_.splice(r,1);break}e&&this.trigger({track:e,type:"removetrack",target:this})}getTrackById(t){let e=null;for(let r=0,a=this.length;r<a;r++){const a=this[r];if(a.id===t){e=a;break}}return e}}r.prototype.allowedEvents_={change:"change",addtrack:"addtrack",removetrack:"removetrack",labelchange:"labelchange"};for(const t in r.prototype.allowedEvents_)r.prototype["on"+t]=null;return r});
//# sourceMappingURL=../sourcemaps/tracks/track-list.js.map
