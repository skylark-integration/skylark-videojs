/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["skylark-langx-globals/document","../component","../utils/dom","../utils/fn","../utils/events","../utils/keycode"],function(t,e,n,s,i,o){"use strict";class l extends e{constructor(t,e){super(t,e),e&&(this.menuButton_=e.menuButton),this.focusedChild_=-1,this.on("keydown",this.handleKeyDown),this.boundHandleBlur_=s.bind(this,this.handleBlur),this.boundHandleTapClick_=s.bind(this,this.handleTapClick)}addEventListenerForItem(t){t instanceof e&&(this.on(t,"blur",this.boundHandleBlur_),this.on(t,["tap","click"],this.boundHandleTapClick_))}removeEventListenerForItem(t){t instanceof e&&(this.off(t,"blur",this.boundHandleBlur_),this.off(t,["tap","click"],this.boundHandleTapClick_))}removeChild(t){"string"==typeof t&&(t=this.getChild(t)),this.removeEventListenerForItem(t),super.removeChild(t)}addItem(t){const e=this.addChild(t);e&&this.addEventListenerForItem(e)}createEl(){const t=this.options_.contentElType||"ul";this.contentEl_=n.createEl(t,{className:"vjs-menu-content"}),this.contentEl_.setAttribute("role","menu");const e=super.createEl("div",{append:this.contentEl_,className:"vjs-menu"});return e.appendChild(this.contentEl_),i.on(e,"click",function(t){t.preventDefault(),t.stopImmediatePropagation()}),e}dispose(){this.contentEl_=null,this.boundHandleBlur_=null,this.boundHandleTapClick_=null,super.dispose()}handleBlur(e){const n=e.relatedTarget||t.activeElement;if(!this.children().some(t=>t.el()===n)){const t=this.menuButton_;t&&t.buttonPressed_&&n!==t.el().firstChild&&t.unpressButton()}}handleTapClick(t){if(this.menuButton_){this.menuButton_.unpressButton();const e=this.children();if(!Array.isArray(e))return;const n=e.filter(e=>e.el()===t.target)[0];if(!n)return;"CaptionSettingsMenuItem"!==n.name()&&this.menuButton_.focus()}}handleKeyDown(t){o.isEventKey(t,"Left")||o.isEventKey(t,"Down")?(t.preventDefault(),t.stopPropagation(),this.stepForward()):(o.isEventKey(t,"Right")||o.isEventKey(t,"Up"))&&(t.preventDefault(),t.stopPropagation(),this.stepBack())}stepForward(){let t=0;void 0!==this.focusedChild_&&(t=this.focusedChild_+1),this.focus(t)}stepBack(){let t=0;void 0!==this.focusedChild_&&(t=this.focusedChild_-1),this.focus(t)}focus(t=0){const e=this.children().slice();e.length&&e[0].hasClass("vjs-menu-title")&&e.shift(),e.length>0&&(t<0?t=0:t>=e.length&&(t=e.length-1),this.focusedChild_=t,e[t].el_.focus())}}return e.registerComponent("Menu",l),l});
//# sourceMappingURL=../sourcemaps/menu/menu.js.map