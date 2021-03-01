/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["../track-button","../../component","./audio-track-menu-item"],function(t,e,r){"use strict";class s extends t{constructor(t,e={}){e.tracks=t.audioTracks(),super(t,e)}buildCSSClass(){return`vjs-audio-button ${super.buildCSSClass()}`}buildWrapperCSSClass(){return`vjs-audio-button ${super.buildWrapperCSSClass()}`}createItems(t=[]){this.hideThreshold_=1;const e=this.player_.audioTracks();for(let s=0;s<e.length;s++){const u=e[s];t.push(new r(this.player_,{track:u,selectable:!0,multiSelectable:!1}))}return t}}return s.prototype.controlText_="Audio Track",e.registerComponent("AudioTrackButton",s),s});
//# sourceMappingURL=../../sourcemaps/control-bar/audio-track-controls/audio-track-button.js.map
