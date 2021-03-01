/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./text-track-button","../../component","./chapters-track-menu-item","../../utils/string-cases"],function(t,e,r,s){"use strict";class a extends t{constructor(t,e,r){super(t,e,r)}buildCSSClass(){return`vjs-chapters-button ${super.buildCSSClass()}`}buildWrapperCSSClass(){return`vjs-chapters-button ${super.buildWrapperCSSClass()}`}update(t){this.track_&&(!t||"addtrack"!==t.type&&"removetrack"!==t.type)||this.setTrack(this.findChaptersTrack()),super.update()}setTrack(t){if(this.track_!==t){if(this.updateHandler_||(this.updateHandler_=this.update.bind(this)),this.track_){const t=this.player_.remoteTextTrackEls().getTrackElementByTrack_(this.track_);t&&t.removeEventListener("load",this.updateHandler_),this.track_=null}if(this.track_=t,this.track_){this.track_.mode="hidden";const t=this.player_.remoteTextTrackEls().getTrackElementByTrack_(this.track_);t&&t.addEventListener("load",this.updateHandler_)}}}findChaptersTrack(){const t=this.player_.textTracks()||[];for(let e=t.length-1;e>=0;e--){const r=t[e];if(r.kind===this.kind_)return r}}getMenuCaption(){return this.track_&&this.track_.label?this.track_.label:this.localize(s.toTitleCase(this.kind_))}createMenu(){return this.options_.title=this.getMenuCaption(),super.createMenu()}createItems(){const t=[];if(!this.track_)return t;const e=this.track_.cues;if(!e)return t;for(let s=0,a=e.length;s<a;s++){const a=e[s],i=new r(this.player_,{track:this.track_,cue:a});t.push(i)}return t}}return a.prototype.kind_="chapters",a.prototype.controlText_="Chapters",e.registerComponent("ChaptersButton",a),a});
//# sourceMappingURL=../../sourcemaps/control-bar/text-track-controls/chapters-button.js.map