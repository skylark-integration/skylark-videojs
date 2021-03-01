/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./button","./component","./utils/keycode"],function(e,t,s){"use strict";class o extends e{constructor(e,t){super(e,t),this.controlText(t&&t.controlText||this.localize("Close"))}buildCSSClass(){return`vjs-close-button ${super.buildCSSClass()}`}handleClick(e){this.trigger({type:"close",bubbles:!1})}handleKeyDown(e){s.isEventKey(e,"Esc")?(e.preventDefault(),e.stopPropagation(),this.trigger("click")):super.handleKeyDown(e)}}return t.registerComponent("CloseButton",o),o});
//# sourceMappingURL=sourcemaps/close-button.js.map
