/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./audio-track-list","./video-track-list","./text-track-list","./html-track-element-list","./text-track","./audio-track","./video-track","./html-track-element"],function(e,t,a,s,c,r,i,m){"use strict";const l={audio:{ListClass:e,TrackClass:r,capitalName:"Audio"},video:{ListClass:t,TrackClass:i,capitalName:"Video"},text:{ListClass:a,TrackClass:c,capitalName:"Text"}};Object.keys(l).forEach(function(e){l[e].getterName=`${e}Tracks`,l[e].privateName=`${e}Tracks_`});const k={remoteText:{ListClass:a,TrackClass:c,capitalName:"RemoteText",getterName:"remoteTextTracks",privateName:"remoteTextTracks_"},remoteTextEl:{ListClass:s,TrackClass:m,capitalName:"RemoteTextTrackEls",getterName:"remoteTextTrackEls",privateName:"remoteTextTrackEls_"}},o=Object.assign({},l,k);return k.names=Object.keys(k),l.names=Object.keys(l),o.names=[].concat(k.names).concat(l.names),{NORMAL:l,REMOTE:k,ALL:o}});
//# sourceMappingURL=../sourcemaps/tracks/track-types.js.map
