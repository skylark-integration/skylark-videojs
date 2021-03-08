/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["skylark-langx-funcs","./guid"],function(n,u){"use strict";return{UPDATE_REFRESH_INTERVAL:30,bind:function(n,t,e){t.guid||(t.guid=u.newGUID());const i=t.bind(n);return i.guid=e?e+"_"+t.guid:t.guid,i},throttle:n.throttle,debounce:n.debounce}});
//# sourceMappingURL=../sourcemaps/utils/fn.js.map
