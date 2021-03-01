/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["../clickable-component","../component","../utils/obj","./menu-keys","../utils/keycode"],function(e,t,s,l,i){"use strict";class c extends e{constructor(e,t){super(e,t),this.selectable=t.selectable,this.isSelected_=t.selected||!1,this.multiSelectable=t.multiSelectable,this.selected(this.isSelected_),this.selectable?this.multiSelectable?this.el_.setAttribute("role","menuitemcheckbox"):this.el_.setAttribute("role","menuitemradio"):this.el_.setAttribute("role","menuitem")}createEl(e,t,l){return this.nonIconControl=!0,super.createEl("li",s.assign({className:"vjs-menu-item",innerHTML:`<span class="vjs-menu-item-text">${this.localize(this.options_.label)}</span>`,tabIndex:-1},t),l)}handleKeyDown(e){l.some(t=>i.isEventKey(e,t))||super.handleKeyDown(e)}handleClick(e){this.selected(!0)}selected(e){this.selectable&&(e?(this.addClass("vjs-selected"),this.el_.setAttribute("aria-checked","true"),this.controlText(", selected"),this.isSelected_=!0):(this.removeClass("vjs-selected"),this.el_.setAttribute("aria-checked","false"),this.controlText(""),this.isSelected_=!1))}}return t.registerComponent("MenuItem",c),c});
//# sourceMappingURL=../sourcemaps/menu/menu-item.js.map
