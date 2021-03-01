/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(function(){"use strict";const t=function(t,o){t=t<0?0:t;let n=Math.floor(t%60),r=Math.floor(t/60%60),e=Math.floor(t/3600);const f=Math.floor(o/60%60),i=Math.floor(o/3600);return(isNaN(t)||t===1/0)&&(e=r=n="-"),(e=e>0||i>0?e+":":"")+(r=((e||f>=10)&&r<10?"0"+r:r)+":")+(n=n<10?"0"+n:n)};let o=t;function n(t,n=t){return o(t,n)}return n.setFormatTime=function(t){o=t},n.resetFormatTime=function(){o=t},n});
//# sourceMappingURL=../sourcemaps/utils/format-time.js.map
