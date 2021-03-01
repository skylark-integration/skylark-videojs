define([
    '../component',
    '../utils/fn',
    '../utils/dom'
], function (Component, Fn, Dom) {
    'use strict';
    const darkGray = '#222';
    const lightGray = '#ccc';
    const fontMap = {
        monospace: 'monospace',
        sansSerif: 'sans-serif',
        serif: 'serif',
        monospaceSansSerif: '"Andale Mono", "Lucida Console", monospace',
        monospaceSerif: '"Courier New", monospace',
        proportionalSansSerif: 'sans-serif',
        proportionalSerif: 'serif',
        casual: '"Comic Sans MS", Impact, fantasy',
        script: '"Monotype Corsiva", cursive',
        smallcaps: '"Andale Mono", "Lucida Console", monospace, sans-serif'
    };
    function constructColor(color, opacity) {
        let hex;
        if (color.length === 4) {
            hex = color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
        } else if (color.length === 7) {
            hex = color.slice(1);
        } else {
            throw new Error('Invalid color code provided, ' + color + '; must be formatted as e.g. #f0e or #f604e2.');
        }
        return 'rgba(' + parseInt(hex.slice(0, 2), 16) + ',' + parseInt(hex.slice(2, 4), 16) + ',' + parseInt(hex.slice(4, 6), 16) + ',' + opacity + ')';
    }
    function tryUpdateStyle(el, style, rule) {
        try {
            el.style[style] = rule;
        } catch (e) {
            return;
        }
    }
    class TextTrackDisplay extends Component {
        constructor(player, options, ready) {
            super(player, options, ready);
            const updateDisplayHandler = Fn.bind(this, this.updateDisplay);
            player.on('loadstart', Fn.bind(this, this.toggleDisplay));
            player.on('texttrackchange', updateDisplayHandler);
            player.on('loadedmetadata', Fn.bind(this, this.preselectTrack));
            player.ready(Fn.bind(this, function () {
                if (player.tech_ && player.tech_.featuresNativeTextTracks) {
                    this.hide();
                    return;
                }
                player.on('fullscreenchange', updateDisplayHandler);
                player.on('playerresize', updateDisplayHandler);
                window.addEventListener('orientationchange', updateDisplayHandler);
                player.on('dispose', () => window.removeEventListener('orientationchange', updateDisplayHandler));
                const tracks = this.options_.playerOptions.tracks || [];
                for (let i = 0; i < tracks.length; i++) {
                    this.player_.addRemoteTextTrack(tracks[i], true);
                }
                this.preselectTrack();
            }));
        }
        preselectTrack() {
            const modes = {
                captions: 1,
                subtitles: 1
            };
            const trackList = this.player_.textTracks();
            const userPref = this.player_.cache_.selectedLanguage;
            let firstDesc;
            let firstCaptions;
            let preferredTrack;
            for (let i = 0; i < trackList.length; i++) {
                const track = trackList[i];
                if (userPref && userPref.enabled && userPref.language && userPref.language === track.language && track.kind in modes) {
                    if (track.kind === userPref.kind) {
                        preferredTrack = track;
                    } else if (!preferredTrack) {
                        preferredTrack = track;
                    }
                } else if (userPref && !userPref.enabled) {
                    preferredTrack = null;
                    firstDesc = null;
                    firstCaptions = null;
                } else if (track.default) {
                    if (track.kind === 'descriptions' && !firstDesc) {
                        firstDesc = track;
                    } else if (track.kind in modes && !firstCaptions) {
                        firstCaptions = track;
                    }
                }
            }
            if (preferredTrack) {
                preferredTrack.mode = 'showing';
            } else if (firstCaptions) {
                firstCaptions.mode = 'showing';
            } else if (firstDesc) {
                firstDesc.mode = 'showing';
            }
        }
        toggleDisplay() {
            if (this.player_.tech_ && this.player_.tech_.featuresNativeTextTracks) {
                this.hide();
            } else {
                this.show();
            }
        }
        createEl() {
            return super.createEl('div', { className: 'vjs-text-track-display' }, {
                'aria-live': 'off',
                'aria-atomic': 'true'
            });
        }
        clearDisplay() {
            if (typeof window.WebVTT === 'function') {
                window.WebVTT.processCues(window, [], this.el_);
            }
        }
        updateDisplay() {
            const tracks = this.player_.textTracks();
            const allowMultipleShowingTracks = this.options_.allowMultipleShowingTracks;
            this.clearDisplay();
            if (allowMultipleShowingTracks) {
                const showingTracks = [];
                for (let i = 0; i < tracks.length; ++i) {
                    const track = tracks[i];
                    if (track.mode !== 'showing') {
                        continue;
                    }
                    showingTracks.push(track);
                }
                this.updateForTrack(showingTracks);
                return;
            }
            let descriptionsTrack = null;
            let captionsSubtitlesTrack = null;
            let i = tracks.length;
            while (i--) {
                const track = tracks[i];
                if (track.mode === 'showing') {
                    if (track.kind === 'descriptions') {
                        descriptionsTrack = track;
                    } else {
                        captionsSubtitlesTrack = track;
                    }
                }
            }
            if (captionsSubtitlesTrack) {
                if (this.getAttribute('aria-live') !== 'off') {
                    this.setAttribute('aria-live', 'off');
                }
                this.updateForTrack(captionsSubtitlesTrack);
            } else if (descriptionsTrack) {
                if (this.getAttribute('aria-live') !== 'assertive') {
                    this.setAttribute('aria-live', 'assertive');
                }
                this.updateForTrack(descriptionsTrack);
            }
        }
        updateDisplayState(track) {
            const overrides = this.player_.textTrackSettings.getValues();
            const cues = track.activeCues;
            let i = cues.length;
            while (i--) {
                const cue = cues[i];
                if (!cue) {
                    continue;
                }
                const cueDiv = cue.displayState;
                if (overrides.color) {
                    cueDiv.firstChild.style.color = overrides.color;
                }
                if (overrides.textOpacity) {
                    tryUpdateStyle(cueDiv.firstChild, 'color', constructColor(overrides.color || '#fff', overrides.textOpacity));
                }
                if (overrides.backgroundColor) {
                    cueDiv.firstChild.style.backgroundColor = overrides.backgroundColor;
                }
                if (overrides.backgroundOpacity) {
                    tryUpdateStyle(cueDiv.firstChild, 'backgroundColor', constructColor(overrides.backgroundColor || '#000', overrides.backgroundOpacity));
                }
                if (overrides.windowColor) {
                    if (overrides.windowOpacity) {
                        tryUpdateStyle(cueDiv, 'backgroundColor', constructColor(overrides.windowColor, overrides.windowOpacity));
                    } else {
                        cueDiv.style.backgroundColor = overrides.windowColor;
                    }
                }
                if (overrides.edgeStyle) {
                    if (overrides.edgeStyle === 'dropshadow') {
                        cueDiv.firstChild.style.textShadow = `2px 2px 3px ${ darkGray }, 2px 2px 4px ${ darkGray }, 2px 2px 5px ${ darkGray }`;
                    } else if (overrides.edgeStyle === 'raised') {
                        cueDiv.firstChild.style.textShadow = `1px 1px ${ darkGray }, 2px 2px ${ darkGray }, 3px 3px ${ darkGray }`;
                    } else if (overrides.edgeStyle === 'depressed') {
                        cueDiv.firstChild.style.textShadow = `1px 1px ${ lightGray }, 0 1px ${ lightGray }, -1px -1px ${ darkGray }, 0 -1px ${ darkGray }`;
                    } else if (overrides.edgeStyle === 'uniform') {
                        cueDiv.firstChild.style.textShadow = `0 0 4px ${ darkGray }, 0 0 4px ${ darkGray }, 0 0 4px ${ darkGray }, 0 0 4px ${ darkGray }`;
                    }
                }
                if (overrides.fontPercent && overrides.fontPercent !== 1) {
                    const fontSize = window.parseFloat(cueDiv.style.fontSize);
                    cueDiv.style.fontSize = fontSize * overrides.fontPercent + 'px';
                    cueDiv.style.height = 'auto';
                    cueDiv.style.top = 'auto';
                }
                if (overrides.fontFamily && overrides.fontFamily !== 'default') {
                    if (overrides.fontFamily === 'small-caps') {
                        cueDiv.firstChild.style.fontVariant = 'small-caps';
                    } else {
                        cueDiv.firstChild.style.fontFamily = fontMap[overrides.fontFamily];
                    }
                }
            }
        }
        updateForTrack(tracks) {
            if (!Array.isArray(tracks)) {
                tracks = [tracks];
            }
            if (typeof window.WebVTT !== 'function' || tracks.every(track => {
                    return !track.activeCues;
                })) {
                return;
            }
            const cues = [];
            for (let i = 0; i < tracks.length; ++i) {
                const track = tracks[i];
                for (let j = 0; j < track.activeCues.length; ++j) {
                    cues.push(track.activeCues[j]);
                }
            }
            window.WebVTT.processCues(window, cues, this.el_);
            for (let i = 0; i < tracks.length; ++i) {
                const track = tracks[i];
                for (let j = 0; j < track.activeCues.length; ++j) {
                    const cueEl = track.activeCues[j].displayState;
                    Dom.addClass(cueEl, 'vjs-text-track-cue');
                    Dom.addClass(cueEl, 'vjs-text-track-cue-' + (track.language ? track.language : i));
                }
                if (this.player_.textTrackSettings) {
                    this.updateDisplayState(track);
                }
            }
        }
    }
    
    Component.registerComponent('TextTrackDisplay', TextTrackDisplay);


    TextTrackDisplay.constructColor = constructColor;

    return TextTrackDisplay;
});