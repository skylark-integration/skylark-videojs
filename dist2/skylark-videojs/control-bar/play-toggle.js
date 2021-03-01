/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["../button","../component"],function(e,s){"use strict";class a extends e{constructor(e,s={}){super(e,s),s.replay=void 0===s.replay||s.replay,this.on(e,"play",this.handlePlay),this.on(e,"pause",this.handlePause),s.replay&&this.on(e,"ended",this.handleEnded)}buildCSSClass(){return`vjs-play-control ${super.buildCSSClass()}`}handleClick(e){this.player_.paused()?this.player_.play():this.player_.pause()}handleSeeked(e){this.removeClass("vjs-ended"),this.player_.paused()?this.handlePause(e):this.handlePlay(e)}handlePlay(e){this.removeClass("vjs-ended"),this.removeClass("vjs-paused"),this.addClass("vjs-playing"),this.controlText("Pause")}handlePause(e){this.removeClass("vjs-playing"),this.addClass("vjs-paused"),this.controlText("Play")}handleEnded(e){this.removeClass("vjs-playing"),this.addClass("vjs-ended"),this.controlText("Replay"),this.one(this.player_,"seeked",this.handleSeeked)}}return a.prototype.controlText_="Play",s.registerComponent("PlayToggle",a),a});
//# sourceMappingURL=../sourcemaps/control-bar/play-toggle.js.map
