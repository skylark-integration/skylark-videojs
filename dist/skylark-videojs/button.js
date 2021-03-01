/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./clickable-component","./component","./utils/log","./utils/obj","./utils/keycode"],function(e,t,n,s,a){"use strict";class l extends e{createEl(e,n={},a={}){n=s.assign({innerHTML:'<span aria-hidden="true" class="vjs-icon-placeholder"></span>',className:this.buildCSSClass()},n),a=s.assign({type:"button"},a);const l=t.prototype.createEl.call(this,"button",n,a);return this.createControlTextEl(l),l}addChild(e,s={}){const a=this.constructor.name;return n.warn(`Adding an actionable (user controllable) child to a Button (${a}) is not supported; use a ClickableComponent instead.`),t.prototype.addChild.call(this,e,s)}enable(){super.enable(),this.el_.removeAttribute("disabled")}disable(){super.disable(),this.el_.setAttribute("disabled","disabled")}handleKeyDown(e){a.isEventKey(e,"Space")||a.isEventKey(e,"Enter")?e.stopPropagation():super.handleKeyDown(e)}}return t.registerComponent("Button",l),l});
//# sourceMappingURL=sourcemaps/button.js.map
