/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./component","./modal-dialog"],function(e,r){"use strict";class s extends r{constructor(e,r){super(e,r),this.on(e,"error",this.open)}buildCSSClass(){return`vjs-error-display ${super.buildCSSClass()}`}content(){const e=this.player().error();return e?this.localize(e.message):""}}return s.prototype.options_=Object.assign({},r.prototype.options_,{pauseOnOpen:!1,fillAlways:!0,temporary:!1,uncloseable:!0}),e.registerComponent("ErrorDisplay",s),s});
//# sourceMappingURL=sourcemaps/error-display.js.map
