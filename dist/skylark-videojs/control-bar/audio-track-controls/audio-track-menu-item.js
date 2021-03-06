/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["../../menu/menu-item","../../component","../../utils/obj"],function(e,s,n){"use strict";class t extends e{constructor(e,s){const n=s.track,t=e.audioTracks();s.label=n.label||n.language||"Unknown",s.selected=n.enabled,super(e,s),this.track=n,this.addClass(`vjs-${n.kind}-menu-item`);const a=(...e)=>{this.handleTracksChange.apply(this,e)};t.addEventListener("change",a),this.listenTo("dispose",()=>{t.removeEventListener("change",a)})}createEl(e,s,t){let a=`<span class="vjs-menu-item-text">${this.localize(this.options_.label)}`;return"main-desc"===this.options_.track.kind&&(a+=`\n        <span aria-hidden="true" class="vjs-icon-placeholder"></span>\n        <span class="vjs-control-text"> ${this.localize("Descriptions")}</span>\n      `),a+="</span>",super.createEl(e,n.assign({innerHTML:a},s),t)}handleClick(e){const s=this.player_.audioTracks();super.handleClick(e);for(let e=0;e<s.length;e++){const n=s[e];n.enabled=n===this.track}}handleTracksChange(e){this.selected(this.track.enabled)}}return s.registerComponent("AudioTrackMenuItem",t),t});
//# sourceMappingURL=../../sourcemaps/control-bar/audio-track-controls/audio-track-menu-item.js.map
