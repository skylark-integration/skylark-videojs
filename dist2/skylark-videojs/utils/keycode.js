/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define([],function(){function e(e){if(e&&"object"==typeof e){var n=e.which||e.keyCode||e.charCode;n&&(e=n)}if("number"==typeof e)return t[e];var a,c=String(e);return(a=r[c.toLowerCase()])?a:(a=o[c.toLowerCase()])||(1===c.length?c.charCodeAt(0):void 0)}e.isEventKey=function(e,n){if(e&&"object"==typeof e){var t=e.which||e.keyCode||e.charCode;if(null===t||void 0===t)return!1;if("string"==typeof n){var a;if(a=r[n.toLowerCase()])return a===t;if(a=o[n.toLowerCase()])return a===t}else if("number"==typeof n)return n===t;return!1}};var exports=e,r=exports.code=exports.codes={backspace:8,tab:9,enter:13,shift:16,ctrl:17,alt:18,"pause/break":19,"caps lock":20,esc:27,space:32,"page up":33,"page down":34,end:35,home:36,left:37,up:38,right:39,down:40,insert:45,delete:46,command:91,"left command":91,"right command":93,"numpad *":106,"numpad +":107,"numpad -":109,"numpad .":110,"numpad /":111,"num lock":144,"scroll lock":145,"my computer":182,"my calculator":183,";":186,"=":187,",":188,"-":189,".":190,"/":191,"`":192,"[":219,"\\":220,"]":221,"'":222},o=exports.aliases={windows:91,"⇧":16,"⌥":18,"⌃":17,"⌘":91,ctl:17,control:17,option:18,pause:19,break:19,caps:20,return:13,escape:27,spc:32,spacebar:32,pgup:33,pgdn:34,ins:45,del:46,cmd:91};for(n=97;n<123;n++)r[String.fromCharCode(n)]=n-32;for(var n=48;n<58;n++)r[n-48]=n;for(n=1;n<13;n++)r["f"+n]=n+111;for(n=0;n<10;n++)r["numpad "+n]=n+96;var t=exports.names=exports.title={};for(n in r)t[r[n]]=n;for(var a in o)r[a]=o[a];return exports});
//# sourceMappingURL=../sourcemaps/utils/keycode.js.map
