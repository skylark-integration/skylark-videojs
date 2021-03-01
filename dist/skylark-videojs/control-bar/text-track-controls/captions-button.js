/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./text-track-button","../../component","./caption-settings-menu-item"],function(t,e,s){"use strict";class r extends t{constructor(t,e,s){super(t,e,s)}buildCSSClass(){return`vjs-captions-button ${super.buildCSSClass()}`}buildWrapperCSSClass(){return`vjs-captions-button ${super.buildWrapperCSSClass()}`}createItems(){const t=[];return this.player().tech_&&this.player().tech_.featuresNativeTextTracks||!this.player().getChild("textTrackSettings")||(t.push(new s(this.player_,{kind:this.kind_})),this.hideThreshold_+=1),super.createItems(t)}}return r.prototype.kind_="captions",r.prototype.controlText_="Captions",e.registerComponent("CaptionsButton",r),r});
//# sourceMappingURL=../../sourcemaps/control-bar/text-track-controls/captions-button.js.map
