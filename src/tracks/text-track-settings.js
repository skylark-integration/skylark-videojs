define([
    '../component',
    '../modal-dialog',
    '../utils/dom',
    '../utils/fn',
    '../utils/obj',
    '../utils/log'
], function (Component, ModalDialog, Dom, Fn, Obj, log) {
    'use strict';
    const LOCAL_STORAGE_KEY = 'vjs-text-track-settings';
    const COLOR_BLACK = [
        '#000',
        'Black'
    ];
    const COLOR_BLUE = [
        '#00F',
        'Blue'
    ];
    const COLOR_CYAN = [
        '#0FF',
        'Cyan'
    ];
    const COLOR_GREEN = [
        '#0F0',
        'Green'
    ];
    const COLOR_MAGENTA = [
        '#F0F',
        'Magenta'
    ];
    const COLOR_RED = [
        '#F00',
        'Red'
    ];
    const COLOR_WHITE = [
        '#FFF',
        'White'
    ];
    const COLOR_YELLOW = [
        '#FF0',
        'Yellow'
    ];
    const OPACITY_OPAQUE = [
        '1',
        'Opaque'
    ];
    const OPACITY_SEMI = [
        '0.5',
        'Semi-Transparent'
    ];
    const OPACITY_TRANS = [
        '0',
        'Transparent'
    ];
    const selectConfigs = {
        backgroundColor: {
            selector: '.vjs-bg-color > select',
            id: 'captions-background-color-%s',
            label: 'Color',
            options: [
                COLOR_BLACK,
                COLOR_WHITE,
                COLOR_RED,
                COLOR_GREEN,
                COLOR_BLUE,
                COLOR_YELLOW,
                COLOR_MAGENTA,
                COLOR_CYAN
            ]
        },
        backgroundOpacity: {
            selector: '.vjs-bg-opacity > select',
            id: 'captions-background-opacity-%s',
            label: 'Transparency',
            options: [
                OPACITY_OPAQUE,
                OPACITY_SEMI,
                OPACITY_TRANS
            ]
        },
        color: {
            selector: '.vjs-fg-color > select',
            id: 'captions-foreground-color-%s',
            label: 'Color',
            options: [
                COLOR_WHITE,
                COLOR_BLACK,
                COLOR_RED,
                COLOR_GREEN,
                COLOR_BLUE,
                COLOR_YELLOW,
                COLOR_MAGENTA,
                COLOR_CYAN
            ]
        },
        edgeStyle: {
            selector: '.vjs-edge-style > select',
            id: '%s',
            label: 'Text Edge Style',
            options: [
                [
                    'none',
                    'None'
                ],
                [
                    'raised',
                    'Raised'
                ],
                [
                    'depressed',
                    'Depressed'
                ],
                [
                    'uniform',
                    'Uniform'
                ],
                [
                    'dropshadow',
                    'Dropshadow'
                ]
            ]
        },
        fontFamily: {
            selector: '.vjs-font-family > select',
            id: 'captions-font-family-%s',
            label: 'Font Family',
            options: [
                [
                    'proportionalSansSerif',
                    'Proportional Sans-Serif'
                ],
                [
                    'monospaceSansSerif',
                    'Monospace Sans-Serif'
                ],
                [
                    'proportionalSerif',
                    'Proportional Serif'
                ],
                [
                    'monospaceSerif',
                    'Monospace Serif'
                ],
                [
                    'casual',
                    'Casual'
                ],
                [
                    'script',
                    'Script'
                ],
                [
                    'small-caps',
                    'Small Caps'
                ]
            ]
        },
        fontPercent: {
            selector: '.vjs-font-percent > select',
            id: 'captions-font-size-%s',
            label: 'Font Size',
            options: [
                [
                    '0.50',
                    '50%'
                ],
                [
                    '0.75',
                    '75%'
                ],
                [
                    '1.00',
                    '100%'
                ],
                [
                    '1.25',
                    '125%'
                ],
                [
                    '1.50',
                    '150%'
                ],
                [
                    '1.75',
                    '175%'
                ],
                [
                    '2.00',
                    '200%'
                ],
                [
                    '3.00',
                    '300%'
                ],
                [
                    '4.00',
                    '400%'
                ]
            ],
            default: 2,
            parser: v => v === '1.00' ? null : Number(v)
        },
        textOpacity: {
            selector: '.vjs-text-opacity > select',
            id: 'captions-foreground-opacity-%s',
            label: 'Transparency',
            options: [
                OPACITY_OPAQUE,
                OPACITY_SEMI
            ]
        },
        windowColor: {
            selector: '.vjs-window-color > select',
            id: 'captions-window-color-%s',
            label: 'Color'
        },
        windowOpacity: {
            selector: '.vjs-window-opacity > select',
            id: 'captions-window-opacity-%s',
            label: 'Transparency',
            options: [
                OPACITY_TRANS,
                OPACITY_SEMI,
                OPACITY_OPAQUE
            ]
        }
    };
    selectConfigs.windowColor.options = selectConfigs.backgroundColor.options;
    function parseOptionValue(value, parser) {
        if (parser) {
            value = parser(value);
        }
        if (value && value !== 'none') {
            return value;
        }
    }
    function getSelectedOptionValue(el, parser) {
        const value = el.options[el.options.selectedIndex].value;
        return parseOptionValue(value, parser);
    }
    function setSelectedOption(el, value, parser) {
        if (!value) {
            return;
        }
        for (let i = 0; i < el.options.length; i++) {
            if (parseOptionValue(el.options[i].value, parser) === value) {
                el.selectedIndex = i;
                break;
            }
        }
    }
    class TextTrackSettings extends ModalDialog {
        constructor(player, options) {
            options.temporary = false;
            super(player, options);
            this.updateDisplay = Fn.bind(this, this.updateDisplay);
            this.fill();
            this.hasBeenOpened_ = this.hasBeenFilled_ = true;
            this.endDialog = Dom.createEl('p', {
                className: 'vjs-control-text',
                textContent: this.localize('End of dialog window.')
            });
            this.el().appendChild(this.endDialog);
            this.setDefaults();
            if (options.persistTextTrackSettings === undefined) {
                this.options_.persistTextTrackSettings = this.options_.playerOptions.persistTextTrackSettings;
            }
            this.on(this.$('.vjs-done-button'), 'click', () => {
                this.saveSettings();
                this.close();
            });
            this.on(this.$('.vjs-default-button'), 'click', () => {
                this.setDefaults();
                this.updateDisplay();
            });
            Obj.each(selectConfigs, config => {
                this.on(this.$(config.selector), 'change', this.updateDisplay);
            });
            if (this.options_.persistTextTrackSettings) {
                this.restoreSettings();
            }
        }
        dispose() {
            this.endDialog = null;
            super.dispose();
        }
        createElSelect_(key, legendId = '', type = 'label') {
            const config = selectConfigs[key];
            const id = config.id.replace('%s', this.id_);
            const selectLabelledbyIds = [
                legendId,
                id
            ].join(' ').trim();
            return [
                `<${ type } id="${ id }" class="${ type === 'label' ? 'vjs-label' : '' }">`,
                this.localize(config.label),
                `</${ type }>`,
                `<select aria-labelledby="${ selectLabelledbyIds }">`
            ].concat(config.options.map(o => {
                const optionId = id + '-' + o[1].replace(/\W+/g, '');
                return [
                    `<option id="${ optionId }" value="${ o[0] }" `,
                    `aria-labelledby="${ selectLabelledbyIds } ${ optionId }">`,
                    this.localize(o[1]),
                    '</option>'
                ].join('');
            })).concat('</select>').join('');
        }
        createElFgColor_() {
            const legendId = `captions-text-legend-${ this.id_ }`;
            return [
                '<fieldset class="vjs-fg-color vjs-track-setting">',
                `<legend id="${ legendId }">`,
                this.localize('Text'),
                '</legend>',
                this.createElSelect_('color', legendId),
                '<span class="vjs-text-opacity vjs-opacity">',
                this.createElSelect_('textOpacity', legendId),
                '</span>',
                '</fieldset>'
            ].join('');
        }
        createElBgColor_() {
            const legendId = `captions-background-${ this.id_ }`;
            return [
                '<fieldset class="vjs-bg-color vjs-track-setting">',
                `<legend id="${ legendId }">`,
                this.localize('Background'),
                '</legend>',
                this.createElSelect_('backgroundColor', legendId),
                '<span class="vjs-bg-opacity vjs-opacity">',
                this.createElSelect_('backgroundOpacity', legendId),
                '</span>',
                '</fieldset>'
            ].join('');
        }
        createElWinColor_() {
            const legendId = `captions-window-${ this.id_ }`;
            return [
                '<fieldset class="vjs-window-color vjs-track-setting">',
                `<legend id="${ legendId }">`,
                this.localize('Window'),
                '</legend>',
                this.createElSelect_('windowColor', legendId),
                '<span class="vjs-window-opacity vjs-opacity">',
                this.createElSelect_('windowOpacity', legendId),
                '</span>',
                '</fieldset>'
            ].join('');
        }
        createElColors_() {
            return Dom.createEl('div', {
                className: 'vjs-track-settings-colors',
                innerHTML: [
                    this.createElFgColor_(),
                    this.createElBgColor_(),
                    this.createElWinColor_()
                ].join('')
            });
        }
        createElFont_() {
            return Dom.createEl('div', {
                className: 'vjs-track-settings-font',
                innerHTML: [
                    '<fieldset class="vjs-font-percent vjs-track-setting">',
                    this.createElSelect_('fontPercent', '', 'legend'),
                    '</fieldset>',
                    '<fieldset class="vjs-edge-style vjs-track-setting">',
                    this.createElSelect_('edgeStyle', '', 'legend'),
                    '</fieldset>',
                    '<fieldset class="vjs-font-family vjs-track-setting">',
                    this.createElSelect_('fontFamily', '', 'legend'),
                    '</fieldset>'
                ].join('')
            });
        }
        createElControls_() {
            const defaultsDescription = this.localize('restore all settings to the default values');
            return Dom.createEl('div', {
                className: 'vjs-track-settings-controls',
                innerHTML: [
                    `<button type="button" class="vjs-default-button" title="${ defaultsDescription }">`,
                    this.localize('Reset'),
                    `<span class="vjs-control-text"> ${ defaultsDescription }</span>`,
                    '</button>',
                    `<button type="button" class="vjs-done-button">${ this.localize('Done') }</button>`
                ].join('')
            });
        }
        content() {
            return [
                this.createElColors_(),
                this.createElFont_(),
                this.createElControls_()
            ];
        }
        label() {
            return this.localize('Caption Settings Dialog');
        }
        description() {
            return this.localize('Beginning of dialog window. Escape will cancel and close the window.');
        }
        buildCSSClass() {
            return super.buildCSSClass() + ' vjs-text-track-settings';
        }
        getValues() {
            return Obj.reduce(selectConfigs, (accum, config, key) => {
                const value = getSelectedOptionValue(this.$(config.selector), config.parser);
                if (value !== undefined) {
                    accum[key] = value;
                }
                return accum;
            }, {});
        }
        setValues(values) {
            Obj.each(selectConfigs, (config, key) => {
                setSelectedOption(this.$(config.selector), values[key], config.parser);
            });
        }
        setDefaults() {
            Obj.each(selectConfigs, config => {
                const index = config.hasOwnProperty('default') ? config.default : 0;
                this.$(config.selector).selectedIndex = index;
            });
        }
        restoreSettings() {
            let values;
            try {
                values = JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_KEY));
            } catch (err) {
                log.warn(err);
            }
            if (values) {
                this.setValues(values);
            }
        }
        saveSettings() {
            if (!this.options_.persistTextTrackSettings) {
                return;
            }
            const values = this.getValues();
            try {
                if (Object.keys(values).length) {
                    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(values));
                } else {
                    window.localStorage.removeItem(LOCAL_STORAGE_KEY);
                }
            } catch (err) {
                log.warn(err);
            }
        }
        updateDisplay() {
            const ttDisplay = this.player_.getChild('textTrackDisplay');
            if (ttDisplay) {
                ttDisplay.updateDisplay();
            }
        }
        conditionalBlur_() {
            this.previouslyActiveEl_ = null;
            const cb = this.player_.controlBar;
            const subsCapsBtn = cb && cb.subsCapsButton;
            const ccBtn = cb && cb.captionsButton;
            if (subsCapsBtn) {
                subsCapsBtn.focus();
            } else if (ccBtn) {
                ccBtn.focus();
            }
        }
    }
    Component.registerComponent('TextTrackSettings', TextTrackSettings);
    return TextTrackSettings;
});