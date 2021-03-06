/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./text-track-button","../../component","../../utils/fn"],function(t,e,s){"use strict";class n extends t{constructor(t,e,n){super(t,e,n);const i=t.textTracks(),r=s.bind(this,this.handleTracksChange);i.addEventListener("change",r),this.listenTo("dispose",function(){i.removeEventListener("change",r)})}handleTracksChange(t){const e=this.player().textTracks();let s=!1;for(let t=0,n=e.length;t<n;t++){const n=e[t];if(n.kind!==this.kind_&&"showing"===n.mode){s=!0;break}}s?this.disable():this.enable()}buildCSSClass(){return`vjs-descriptions-button ${super.buildCSSClass()}`}buildWrapperCSSClass(){return`vjs-descriptions-button ${super.buildWrapperCSSClass()}`}}return n.prototype.kind_="descriptions",n.prototype.controlText_="Descriptions",e.registerComponent("DescriptionsButton",n),n});
//# sourceMappingURL=../../sourcemaps/control-bar/text-track-controls/descriptions-button.js.map
