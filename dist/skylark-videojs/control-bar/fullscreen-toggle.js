/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["skylark-langx-globals/document","../button","../component"],function(e,l,s){"use strict";class n extends l{constructor(l,s){super(l,s),this.on(l,"fullscreenchange",this.handleFullscreenChange),!1===e[l.fsApi_.fullscreenEnabled]&&this.disable()}buildCSSClass(){return`vjs-fullscreen-control ${super.buildCSSClass()}`}handleFullscreenChange(e){this.player_.isFullscreen()?this.controlText("Non-Fullscreen"):this.controlText("Fullscreen")}handleClick(e){this.player_.isFullscreen()?this.player_.exitFullscreen():this.player_.requestFullscreen()}}return n.prototype.controlText_="Fullscreen",s.registerComponent("FullscreenToggle",n),n});
//# sourceMappingURL=../sourcemaps/control-bar/fullscreen-toggle.js.map
