/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./evented","../utils/obj"],function(t,e){"use strict";const n={state:{},setState(n){let s;return"function"==typeof n&&(n=n()),e.each(n,(t,e)=>{this.state[e]!==t&&((s=s||{})[e]={from:this.state[e],to:t}),this.state[e]=t}),s&&t.isEvented(this)&&this.trigger({changes:s,type:"statechanged"}),s}};return function(s,a){return e.assign(s,n),s.state=e.assign({},s.state,a),"function"==typeof s.handleStateChanged&&t.isEvented(s)&&s.on("statechanged",s.handleStateChanged),s}});
//# sourceMappingURL=../sourcemaps/mixins/stateful.js.map
