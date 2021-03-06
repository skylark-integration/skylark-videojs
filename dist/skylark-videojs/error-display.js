/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./component","./modal-dialog"],function(e,s){"use strict";class r extends s{constructor(e,s){super(e,s),this.listenTo(e,"error",this.open)}buildCSSClass(){return`vjs-error-display ${super.buildCSSClass()}`}content(){const e=this.player().error();return e?this.localize(e.message):""}}return r.prototype.options_=Object.assign({},s.prototype.options_,{pauseOnOpen:!1,fillAlways:!0,temporary:!1,uncloseable:!0}),e.registerComponent("ErrorDisplay",r),r});
//# sourceMappingURL=sourcemaps/error-display.js.map
