/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./text-track-menu-item","../../component","../../utils/obj"],function(s,e,t){"use strict";class n extends s{createEl(s,e,n){let a=`<span class="vjs-menu-item-text">${this.localize(this.options_.label)}`;return"captions"===this.options_.track.kind&&(a+=`\n        <span aria-hidden="true" class="vjs-icon-placeholder"></span>\n        <span class="vjs-control-text"> ${this.localize("Captions")}</span>\n      `),a+="</span>",super.createEl(s,t.assign({innerHTML:a},e),n)}}return e.registerComponent("SubsCapsMenuItem",n),n});
//# sourceMappingURL=../../sourcemaps/control-bar/text-track-controls/subs-caps-menu-item.js.map
