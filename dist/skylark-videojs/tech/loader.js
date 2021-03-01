/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["../component","./tech","../utils/string-cases","../utils/merge-options"],function(e,t,s,r){"use strict";class o extends e{constructor(o,n,c){if(super(o,r({createEl:!1},n),c),n.playerOptions.sources&&0!==n.playerOptions.sources.length)o.src(n.playerOptions.sources);else for(let r=0,c=n.playerOptions.techOrder;r<c.length;r++){const n=s.toTitleCase(c[r]);let i=t.getTech(n);if(n||(i=e.getComponent(n)),i&&i.isSupported()){o.loadTech_(n);break}}}}return e.registerComponent("MediaLoader",o),o});
//# sourceMappingURL=../sourcemaps/tech/loader.js.map
