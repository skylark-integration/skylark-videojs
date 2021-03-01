/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./text-track-button","../../component"],function(t,s){"use strict";class e extends t{constructor(t,s,e){super(t,s,e)}buildCSSClass(){return`vjs-subtitles-button ${super.buildCSSClass()}`}buildWrapperCSSClass(){return`vjs-subtitles-button ${super.buildWrapperCSSClass()}`}}return e.prototype.kind_="subtitles",e.prototype.controlText_="Subtitles",s.registerComponent("SubtitlesButton",e),e});
//# sourceMappingURL=../../sourcemaps/control-bar/text-track-controls/subtitles-button.js.map
