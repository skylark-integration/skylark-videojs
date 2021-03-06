/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["../button","../component","../utils/dom","./volume-control/check-mute-support","../utils/browser"],function(t,e,s,l,o){"use strict";class r extends t{constructor(t,e){super(t,e),l(this,t),this.listenTo(t,["loadstart","volumechange"],this.update)}buildCSSClass(){return`vjs-mute-control ${super.buildCSSClass()}`}handleClick(t){const e=this.player_.volume(),s=this.player_.lastVolume_();if(0===e){const t=s<.1?.1:s;this.player_.volume(t),this.player_.muted(!1)}else this.player_.muted(!this.player_.muted())}update(t){this.updateIcon_(),this.updateControlText_()}updateIcon_(){const t=this.player_.volume();let e=3;o.IS_IOS&&this.player_.tech_&&this.player_.tech_.el_&&this.player_.muted(this.player_.tech_.el_.muted),0===t||this.player_.muted()?e=0:t<.33?e=1:t<.67&&(e=2);for(let t=0;t<4;t++)s.removeClass(this.el_,`vjs-vol-${t}`);s.addClass(this.el_,`vjs-vol-${e}`)}updateControlText_(){const t=this.player_.muted()||0===this.player_.volume()?"Unmute":"Mute";this.controlText()!==t&&this.controlText(t)}}return r.prototype.controlText_="Mute",e.registerComponent("MuteToggle",r),r});
//# sourceMappingURL=../sourcemaps/control-bar/mute-toggle.js.map
