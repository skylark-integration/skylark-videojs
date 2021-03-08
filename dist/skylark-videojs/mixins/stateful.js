/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["../utils/obj"],function(t){"use strict";const e={state:{},setState(e){let n;return"function"==typeof e&&(e=e()),t.each(e,(t,e)=>{this.state[e]!==t&&((n=n||{})[e]={from:this.state[e],to:t}),this.state[e]=t}),n&&this.trigger&&this.trigger({changes:n,type:"statechanged"}),n}};return function(n,s){return t.assign(n,e),n.state=t.assign({},n.state,s),"function"==typeof n.handleStateChanged&&n.on&&n.on("statechanged",n.handleStateChanged),n}});
//# sourceMappingURL=../sourcemaps/mixins/stateful.js.map
