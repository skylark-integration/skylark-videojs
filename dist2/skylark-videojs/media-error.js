/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./utils/obj"],function(e){"use strict";function t(o){if(o instanceof t)return o;"number"==typeof o?this.code=o:"string"==typeof o?this.message=o:e.isObject(o)&&("number"==typeof o.code&&(this.code=o.code),e.assign(this,o)),this.message||(this.message=t.defaultMessages[this.code]||"")}t.prototype.code=0,t.prototype.message="",t.prototype.status=null,t.errorTypes=["MEDIA_ERR_CUSTOM","MEDIA_ERR_ABORTED","MEDIA_ERR_NETWORK","MEDIA_ERR_DECODE","MEDIA_ERR_SRC_NOT_SUPPORTED","MEDIA_ERR_ENCRYPTED"],t.defaultMessages={1:"You aborted the media playback",2:"A network error caused the media download to fail part-way.",3:"The media playback was aborted due to a corruption problem or because the media used features your browser did not support.",4:"The media could not be loaded, either because the server or network failed or because the format is not supported.",5:"The media is encrypted and we do not have the keys to decrypt it."};for(let e=0;e<t.errorTypes.length;e++)t[t.errorTypes[e]]=e,t.prototype[t.errorTypes[e]]=e;return t});
//# sourceMappingURL=sourcemaps/media-error.js.map
