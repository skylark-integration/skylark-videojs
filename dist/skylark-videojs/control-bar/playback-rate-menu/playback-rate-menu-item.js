/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["../../menu/menu-item","../../component"],function(e,t){"use strict";class a extends e{constructor(e,t){const a=t.rate,l=parseFloat(a,10);t.label=a,t.selected=1===l,t.selectable=!0,t.multiSelectable=!1,super(e,t),this.label=a,this.rate=l,this.on(e,"ratechange",this.update)}handleClick(e){super.handleClick(),this.player().playbackRate(this.rate)}update(e){this.selected(this.player().playbackRate()===this.rate)}}return a.prototype.contentElType="button",t.registerComponent("PlaybackRateMenuItem",a),a});
//# sourceMappingURL=../../sourcemaps/control-bar/playback-rate-menu/playback-rate-menu-item.js.map
