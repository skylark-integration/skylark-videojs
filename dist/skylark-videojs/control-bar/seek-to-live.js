/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["../button","../component","../utils/dom"],function(e,t,i){"use strict";class s extends e{constructor(e,t){super(e,t),this.updateLiveEdgeStatus(),this.player_.liveTracker&&this.listenTo(this.player_.liveTracker,"liveedgechange",this.updateLiveEdgeStatus)}createEl(){const e=super.createEl("button",{className:"vjs-seek-to-live-control vjs-control"});return this.textEl_=i.createEl("span",{className:"vjs-seek-to-live-text",innerHTML:this.localize("LIVE")},{"aria-hidden":"true"}),e.appendChild(this.textEl_),e}updateLiveEdgeStatus(){!this.player_.liveTracker||this.player_.liveTracker.atLiveEdge()?(this.setAttribute("aria-disabled",!0),this.addClass("vjs-at-live-edge"),this.controlText("Seek to live, currently playing live")):(this.setAttribute("aria-disabled",!1),this.removeClass("vjs-at-live-edge"),this.controlText("Seek to live, currently behind live"))}handleClick(){this.player_.liveTracker.seekToLiveEdge()}dispose(){this.player_.liveTracker&&this.unlistenTo(this.player_.liveTracker,"liveedgechange",this.updateLiveEdgeStatus),this.textEl_=null,super.dispose()}}return s.prototype.controlText_="Seek to live, currently playing live",t.registerComponent("SeekToLive",s),s});
//# sourceMappingURL=../sourcemaps/control-bar/seek-to-live.js.map
