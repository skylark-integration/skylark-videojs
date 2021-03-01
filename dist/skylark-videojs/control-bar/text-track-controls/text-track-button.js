/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["../track-button","../../component","./text-track-menu-item","./off-text-track-menu-item"],function(t,e,s,i){"use strict";class n extends t{constructor(t,e={}){e.tracks=t.textTracks(),super(t,e)}createItems(t=[],e=s){let n;this.label_&&(n=`${this.label_} off`),t.push(new i(this.player_,{kinds:this.kinds_,kind:this.kind_,label:n})),this.hideThreshold_+=1;const r=this.player_.textTracks();Array.isArray(this.kinds_)||(this.kinds_=[this.kind_]);for(let s=0;s<r.length;s++){const i=r[s];if(this.kinds_.indexOf(i.kind)>-1){const s=new e(this.player_,{track:i,kinds:this.kinds_,kind:this.kind_,selectable:!0,multiSelectable:!1});s.addClass(`vjs-${i.kind}-menu-item`),t.push(s)}}return t}}return e.registerComponent("TextTrackButton",n),n});
//# sourceMappingURL=../../sourcemaps/control-bar/text-track-controls/text-track-button.js.map
