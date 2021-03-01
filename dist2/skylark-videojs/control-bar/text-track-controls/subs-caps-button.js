/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./text-track-button","../../component","./caption-settings-menu-item","./subs-caps-menu-item","../../utils/string-cases"],function(t,e,s,r,i){"use strict";class n extends t{constructor(t,e={}){super(t,e),this.label_="subtitles",["en","en-us","en-ca","fr-ca"].indexOf(this.player_.language_)>-1&&(this.label_="captions"),this.menuButton_.controlText(i.toTitleCase(this.label_))}buildCSSClass(){return`vjs-subs-caps-button ${super.buildCSSClass()}`}buildWrapperCSSClass(){return`vjs-subs-caps-button ${super.buildWrapperCSSClass()}`}createItems(){let t=[];return this.player().tech_&&this.player().tech_.featuresNativeTextTracks||!this.player().getChild("textTrackSettings")||(t.push(new s(this.player_,{kind:this.label_})),this.hideThreshold_+=1),t=super.createItems(t,r)}}return n.prototype.kinds_=["captions","subtitles"],n.prototype.controlText_="Subtitles",e.registerComponent("SubsCapsButton",n),n});
//# sourceMappingURL=../../sourcemaps/control-bar/text-track-controls/subs-caps-button.js.map
