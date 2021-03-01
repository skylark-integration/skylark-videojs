/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./time-ranges"],function(e){"use strict";return{bufferedPercent:function(t,n){let r,f,i=0;if(!n)return 0;t&&t.length||(t=e.createTimeRange(0,0));for(let e=0;e<t.length;e++)r=t.start(e),(f=t.end(e))>n&&(f=n),i+=f-r;return i/n}}});
//# sourceMappingURL=../sourcemaps/utils/buffer.js.map
