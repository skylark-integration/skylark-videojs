/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["skylark-langx-globals/window","skylark-langx-globals/document"],function(t,n){"use strict";function e(){return n===t.document}const o=t.navigator&&t.navigator.userAgent||"",i=/AppleWebKit\/([\d.]+)/i.exec(o),r=i?parseFloat(i.pop()):null,s=/iPod/i.test(o),a=function(){const t=o.match(/OS (\d+)_/i);return t&&t[1]?t[1]:null}(),I=/Android/i.test(o),u=function(){const t=o.match(/Android (\d+)(?:\.(\d+))?(?:\.(\d+))*/i);if(!t)return null;const n=t[1]&&parseFloat(t[1]),e=t[2]&&parseFloat(t[2]);return n&&e?parseFloat(t[1]+"."+t[2]):n||null}(),c=I&&u<5&&r<537,l=/Firefox/i.test(o),S=/Edg/i.test(o),d=!S&&(/Chrome/i.test(o)||/CriOS/i.test(o)),_=function(){const t=o.match(/(Chrome|CriOS)\/(\d+)/);return t&&t[2]?parseFloat(t[2]):null}(),O=function(){const t=/MSIE\s(\d+)\.\d/.exec(o);let n=t&&parseFloat(t[1]);return!n&&/Trident\/7.0/i.test(o)&&/rv:11.0/.test(o)&&(n=11),n}(),E=/Safari/i.test(o)&&!d&&!I&&!S,A=/Windows/i.test(o),D=Boolean(e()&&("ontouchstart"in t||t.navigator.maxTouchPoints||t.DocumentTouch&&t.document instanceof t.DocumentTouch)),R=/iPad/i.test(o)||E&&D&&!/iPhone/i.test(o),N=/iPhone/i.test(o)&&!R,f=N||R||s;return{IS_IPOD:s,IOS_VERSION:a,IS_ANDROID:I,ANDROID_VERSION:u,IS_NATIVE_ANDROID:c,IS_FIREFOX:l,IS_EDGE:S,IS_CHROME:d,CHROME_VERSION:_,IE_VERSION:O,IS_SAFARI:E,IS_WINDOWS:A,TOUCH_ENABLED:D,IS_IPAD:R,IS_IPHONE:N,IS_IOS:f,IS_ANY_SAFARI:(E||f)&&!d,isReal:e}});
//# sourceMappingURL=../sourcemaps/utils/browser.js.map
