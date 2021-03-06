/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
(function(factory,globals) {
  var define = globals.define,
      require = globals.require,
      isAmd = (typeof define === 'function' && define.amd),
      isCmd = (!isAmd && typeof exports !== 'undefined');

  if (!isAmd && !define) {
    var map = {};
    function absolute(relative, base) {
        if (relative[0]!==".") {
          return relative;
        }
        var stack = base.split("/"),
            parts = relative.split("/");
        stack.pop(); 
        for (var i=0; i<parts.length; i++) {
            if (parts[i] == ".")
                continue;
            if (parts[i] == "..")
                stack.pop();
            else
                stack.push(parts[i]);
        }
        return stack.join("/");
    }
    define = globals.define = function(id, deps, factory) {
        if (typeof factory == 'function') {
            map[id] = {
                factory: factory,
                deps: deps.map(function(dep){
                  return absolute(dep,id);
                }),
                resolved: false,
                exports: null
            };
            require(id);
        } else {
            map[id] = {
                factory : null,
                resolved : true,
                exports : factory
            };
        }
    };
    require = globals.require = function(id) {
        if (!map.hasOwnProperty(id)) {
            throw new Error('Module ' + id + ' has not been defined');
        }
        var module = map[id];
        if (!module.resolved) {
            var args = [];

            module.deps.forEach(function(dep){
                args.push(require(dep));
            })

            module.exports = module.factory.apply(globals, args) || null;
            module.resolved = true;
        }
        return module.exports;
    };
  }
  
  if (!define) {
     throw new Error("The module utility (ex: requirejs or skylark-utils) is not loaded!");
  }

  factory(define,require);

  if (!isAmd) {
    var skylarkjs = require("skylark-langx-ns");

    if (isCmd) {
      module.exports = skylarkjs;
    } else {
      globals.skylarkjs  = skylarkjs;
    }
  }

})(function(define,require) {

define('skylark-net-http/xhr',[
  "skylark-langx-ns/ns",
  "skylark-langx-types",
  "skylark-langx-objects",
  "skylark-langx-arrays",
  "skylark-langx-funcs",
  "skylark-langx-async/Deferred",
  "skylark-langx-emitter/Evented",
  "./http"
],function(skylark,types,objects,arrays,funcs,Deferred,Evented,http){

    var each = objects.each,
        mixin = objects.mixin,
        noop = funcs.noop,
        isArray = types.isArray,
        isFunction = types.isFunction,
        isPlainObject = types.isPlainObject,
        type = types.type;
 
     var getAbsoluteUrl = (function() {
        var a;

        return function(url) {
            if (!a) a = document.createElement('a');
            a.href = url;

            return a.href;
        };
    })();
   
    var Xhr = (function(){
        var jsonpID = 0,
            key,
            name,
            rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            scriptTypeRE = /^(?:text|application)\/javascript/i,
            xmlTypeRE = /^(?:text|application)\/xml/i,
            jsonType = 'application/json',
            htmlType = 'text/html',
            blankRE = /^\s*$/;

        var XhrDefaultOptions = {
            async: true,

            // Default type of request
            type: 'GET',
            // Callback that is executed before request
            beforeSend: noop,
            // Callback that is executed if the request succeeds
            success: noop,
            // Callback that is executed the the server drops error
            error: noop,
            // Callback that is executed on request complete (both: error and success)
            complete: noop,
            // The context for the callbacks
            context: null,
            // Whether to trigger "global" Ajax events
            global: true,

            // MIME types mapping
            // IIS returns Javascript as "application/x-javascript"
            accepts: {
                script: 'text/javascript, application/javascript, application/x-javascript',
                json: 'application/json',
                xml: 'application/xml, text/xml',
                html: 'text/html',
                text: 'text/plain'
            },
            // Whether the request is to another domain
            crossDomain: false,
            // Default timeout
            timeout: 0,
            // Whether data should be serialized to string
            processData: false,
            // Whether the browser should be allowed to cache GET responses
            cache: true,

            traditional : false,
            
            xhrFields : {
                withCredentials : false
            }
        };

        function mimeToDataType(mime) {
            if (mime) {
                mime = mime.split(';', 2)[0];
            }
            if (mime) {
                if (mime == htmlType) {
                    return "html";
                } else if (mime == jsonType) {
                    return "json";
                } else if (scriptTypeRE.test(mime)) {
                    return "script";
                } else if (xmlTypeRE.test(mime)) {
                    return "xml";
                }
            }
            return "text";
        }

        function appendQuery(url, query) {
            if (query == '') return url
            return (url + '&' + query).replace(/[&?]{1,2}/, '?')
        }

        // serialize payload and append it to the URL for GET requests
        function serializeData(options) {
            options.data = options.data || options.query;
            if (options.processData && options.data && type(options.data) != "string") {
                options.data = param(options.data, options.traditional);
            }
            if (options.data && (!options.type || options.type.toUpperCase() == 'GET')) {
                if (type(options.data) != "string") {
                    options.data = param(options.data, options.traditional);
                }
                options.url = appendQuery(options.url, options.data);
                options.data = undefined;
            }
        }
        
        function serialize(params, obj, traditional, scope) {
            var t, array = isArray(obj),
                hash = isPlainObject(obj)
            each(obj, function(key, value) {
                t =type(value);
                if (scope) key = traditional ? scope :
                    scope + '[' + (hash || t == 'object' || t == 'array' ? key : '') + ']'
                // handle data in serializeArray() format
                if (!scope && array) params.add(value.name, value.value)
                // recurse into nested objects
                else if (t == "array" || (!traditional && t == "object"))
                    serialize(params, value, traditional, key)
                else params.add(key, value)
            })
        }

        var param = function(obj, traditional) {
            var params = []
            params.add = function(key, value) {
                if (isFunction(value)) {
                  value = value();
                }
                if (value == null) {
                  value = "";
                }
                this.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
            };
            serialize(params, obj, traditional)
            return params.join('&').replace(/%20/g, '+')
        };

        var Xhr = Evented.inherit({
            klassName : "Xhr",

            _request  : function(args) {
                var _ = this._,
                    self = this,
                    options = mixin({},XhrDefaultOptions,_.options,args),
                    xhr = _.xhr = new XMLHttpRequest();

                serializeData(options)

                if (options.beforeSend) {
                    options.beforeSend.call(this, xhr, options);
                }                

                var dataType = options.dataType || options.handleAs,
                    mime = options.mimeType || options.accepts[dataType],
                    headers = options.headers,
                    xhrFields = options.xhrFields,
                    isFormData = options.data && options.data instanceof FormData,
                    basicAuthorizationToken = options.basicAuthorizationToken,
                    type = options.type,
                    url = options.url,
                    async = options.async,
                    user = options.user , 
                    password = options.password,
                    deferred = new Deferred(),
                    contentType = options.contentType || (isFormData ? false : 'application/x-www-form-urlencoded');

                if (xhrFields) {
                    for (name in xhrFields) {
                        xhr[name] = xhrFields[name];
                    }
                }

                if (mime && mime.indexOf(',') > -1) {
                    mime = mime.split(',', 2)[0];
                }
                if (mime && xhr.overrideMimeType) {
                    xhr.overrideMimeType(mime);
                }

                if (dataType == "blob" || dataType == "arraybuffer") {
                    xhr.responseType = dataType;
                }

                var finish = function() {
                    xhr.onloadend = noop;
                    xhr.onabort = noop;
                    xhr.onprogress = noop;
                    xhr.ontimeout = noop;
                    xhr = null;
                }
                var onloadend = function() {
                    var result, error = false
                    if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304 || (xhr.status == 0 && getAbsoluteUrl(url).startsWith('file:'))) {
                        dataType = dataType || mimeToDataType(options.mimeType || xhr.getResponseHeader('content-type'));

                        //result = xhr.responseText;
                        try {
                            if (dataType == 'script') {
                                eval(xhr.responseText);
                            } else if (dataType == 'xml') {
                                result = xhr.responseXML;
                            } else if (dataType == 'json') {
                                result = blankRE.test(xhr.responseText) ? null : JSON.parse(xhr.responseText);
                            } else if (dataType == "blob") {
                                result = xhr.response; // new Blob([xhr.response]);
                            } else if (dataType == "arraybuffer") {
                                result = xhr.reponse;
                            }
                        } catch (e) { 
                            error = e;
                        }

                        if (error) {
                            deferred.reject(error,xhr.status,xhr);
                        } else {
                            deferred.resolve(result,xhr.status,xhr);
                        }
                    } else {
                        deferred.reject(new Error(xhr.statusText),xhr.status,xhr);
                    }
                    finish();
                };
                
                var onabort = function() {
                    if (deferred) {
                        deferred.reject(new Error("abort"),xhr.status,xhr);
                    }
                    finish();                 
                }
 
                var ontimeout = function() {
                    if (deferred) {
                        deferred.reject(new Error("timeout"),xhr.status,xhr);
                    }
                    finish();                 
                }

                var onprogress = function(evt) {
                    if (deferred) {
                        deferred.notify(evt,xhr.status,xhr);
                    }
                }

                xhr.onloadend = onloadend;
                xhr.onabort = onabort;
                xhr.ontimeout = ontimeout;
                xhr.onprogress = onprogress;

                xhr.open(type, url, async, user, password);
               
                if (headers) {
                    for ( var key in headers) {
                        var value = headers[key];
 
                        if(key.toLowerCase() === 'content-type'){
                            contentType = value;
                        } else {
                           xhr.setRequestHeader(key, value);
                        }
                    }
                }   

                if  (contentType && contentType !== false){
                    xhr.setRequestHeader('Content-Type', contentType);
                }

                if(!headers || !('X-Requested-With' in headers)){
                    //xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest'); // del for s02
                }


                //If basicAuthorizationToken is defined set its value into "Authorization" header
                if (basicAuthorizationToken) {
                    xhr.setRequestHeader("Authorization", basicAuthorizationToken);
                }

                xhr.send(options.data ? options.data : null);

                return deferred.promise;

            },

            "abort": function() {
                var _ = this._,
                    xhr = _.xhr;

                if (xhr) {
                    xhr.abort();
                }    
            },


            "request": function(args) {
                return this._request(args);
            },

            get : function(args) {
                args = args || {};
                args.type = "GET";
                return this._request(args);
            },

            post : function(args) {
                args = args || {};
                args.type = "POST";
                return this._request(args);
            },

            patch : function(args) {
                args = args || {};
                args.type = "PATCH";
                return this._request(args);
            },

            put : function(args) {
                args = args || {};
                args.type = "PUT";
                return this._request(args);
            },

            del : function(args) {
                args = args || {};
                args.type = "DELETE";
                return this._request(args);
            },

            "init": function(options) {
                this._ = {
                    options : options || {}
                };
            }
        });

        ["request","get","post","put","del","patch"].forEach(function(name){
            Xhr[name] = function(url,args) {
                var xhr = new Xhr({"url" : url});
                return xhr[name](args);
            };
        });

        Xhr.defaultOptions = XhrDefaultOptions;
        Xhr.param = param;

        return Xhr;
    })();

	return http.Xhr = Xhr;	
});
define('skylark-videojs/fullscreen-api',[], function () {
    'use strict';
    const FullscreenApi = { prefixed: true };
    const apiMap = [
        [
            'requestFullscreen',
            'exitFullscreen',
            'fullscreenElement',
            'fullscreenEnabled',
            'fullscreenchange',
            'fullscreenerror',
            'fullscreen'
        ],
        [
            'webkitRequestFullscreen',
            'webkitExitFullscreen',
            'webkitFullscreenElement',
            'webkitFullscreenEnabled',
            'webkitfullscreenchange',
            'webkitfullscreenerror',
            '-webkit-full-screen'
        ],
        [
            'mozRequestFullScreen',
            'mozCancelFullScreen',
            'mozFullScreenElement',
            'mozFullScreenEnabled',
            'mozfullscreenchange',
            'mozfullscreenerror',
            '-moz-full-screen'
        ],
        [
            'msRequestFullscreen',
            'msExitFullscreen',
            'msFullscreenElement',
            'msFullscreenEnabled',
            'MSFullscreenChange',
            'MSFullscreenError',
            '-ms-fullscreen'
        ]
    ];
    const specApi = apiMap[0];
    let browserApi;
    for (let i = 0; i < apiMap.length; i++) {
        if (apiMap[i][1] in document) {
            browserApi = apiMap[i];
            break;
        }
    }
    if (browserApi) {
        for (let i = 0; i < browserApi.length; i++) {
            FullscreenApi[specApi[i]] = browserApi[i];
        }
        FullscreenApi.prefixed = browserApi[0] !== specApi[0];
    }
    return FullscreenApi;
});
define('skylark-videojs/utils/create-logger',[], function () {
    'use strict';
    let history = [];
    const LogByTypeFactory = (name, log) => (type, level, args) => {
        const lvl = log.levels[level];
        const lvlRegExp = new RegExp(`^(${ lvl })$`);
        if (type !== 'log') {
            args.unshift(type.toUpperCase() + ':');
        }
        args.unshift(name + ':');
        if (history) {
            history.push([].concat(args));
            const splice = history.length - 1000;
            history.splice(0, splice > 0 ? splice : 0);
        }
        if (!window.console) {
            return;
        }
        let fn = window.console[type];
        if (!fn && type === 'debug') {
            fn = window.console.info || window.console.log;
        }
        if (!fn || !lvl || !lvlRegExp.test(type)) {
            return;
        }
        fn[Array.isArray(args) ? 'apply' : 'call'](window.console, args);
    };
    return function createLogger(name) {
        let level = 'info';
        let logByType;
        const log = function (...args) {
            logByType('log', level, args);
        };
        logByType = LogByTypeFactory(name, log);
        log.createLogger = subname => createLogger(name + ': ' + subname);
        log.levels = {
            all: 'debug|log|warn|error',
            off: '',
            debug: 'debug|log|warn|error',
            info: 'log|warn|error',
            warn: 'warn|error',
            error: 'error',
            DEFAULT: level
        };
        log.level = lvl => {
            if (typeof lvl === 'string') {
                if (!log.levels.hasOwnProperty(lvl)) {
                    throw new Error(`"${ lvl }" in not a valid log level`);
                }
                level = lvl;
            }
            return level;
        };
        log.history = () => history ? [].concat(history) : [];
        log.history.filter = fname => {
            return (history || []).filter(historyItem => {
                return new RegExp(`.*${ fname }.*`).test(historyItem[0]);
            });
        };
        log.history.clear = () => {
            if (history) {
                history.length = 0;
            }
        };
        log.history.disable = () => {
            if (history !== null) {
                history.length = 0;
                history = null;
            }
        };
        log.history.enable = () => {
            if (history === null) {
                history = [];
            }
        };
        log.error = (...args) => logByType('error', level, args);
        log.warn = (...args) => logByType('warn', level, args);
        log.debug = (...args) => logByType('debug', level, args);
        return log;
    };
});
define('skylark-videojs/utils/log',['./create-logger'], function (createLogger) {
    'use strict';
    const log = createLogger('VIDEOJS');
    log.createLogger = createLogger;
    return log;
});
define('skylark-videojs/utils/obj',[
    "skylark-langx"
],function (langx) {
    'use strict';

    /*
    const toString = Object.prototype.toString;
    const keys = function (object) {
        return isObject(object) ? Object.keys(object) : [];
    };
    function each(object, fn) {
        keys(object).forEach(key => fn(object[key], key));
    }
    function reduce(object, fn, initial = 0) {
        return keys(object).reduce((accum, key) => fn(accum, object[key], key), initial);
    }
    function assign(target, ...sources) {
        if (Object.assign) {
            return Object.assign(target, ...sources);
        }
        sources.forEach(source => {
            if (!source) {
                return;
            }
            each(source, (value, key) => {
                target[key] = value;
            });
        });
        return target;
    }
    function isObject(value) {
        return !!value && typeof value === 'object';
    }
    function isPlain(value) {
        return isObject(value) && toString.call(value) === '[object Object]' && value.constructor === Object;
    }

    */
    return {
        each : function(object,fn) {
            return langx.each(object,fn,true/*isForEach*/);
        },
        reduce: langx.reduce,
        assign: langx.mixin,
        isObject: langx.isObject,
        isPlain: langx.isPlainObject
    };
});
define('skylark-videojs/utils/computed-style',[
    'skylark-langx-globals/window'
], function (window) {
    'use strict';
    function computedStyle(el, prop) {
        if (!el || !prop) {
            return '';
        }
        if (typeof window.getComputedStyle === 'function') {
            const computedStyleValue = window.getComputedStyle(el);
            return computedStyleValue ? computedStyleValue.getPropertyValue(prop) || computedStyleValue[prop] : '';
        }
        return '';
    }
    return computedStyle;
});
define('skylark-videojs/utils/browser',[
    "skylark-langx-globals/window",
    "skylark-langx-globals/document"
], function (window,document) {
    'use strict';

    function isReal() {
        return document === window.document;
    }

    const USER_AGENT = window.navigator && window.navigator.userAgent || '';
    const webkitVersionMap = /AppleWebKit\/([\d.]+)/i.exec(USER_AGENT);
    const appleWebkitVersion = webkitVersionMap ? parseFloat(webkitVersionMap.pop()) : null;
    const IS_IPOD = /iPod/i.test(USER_AGENT);
    const IOS_VERSION = function () {
        const match = USER_AGENT.match(/OS (\d+)_/i);
        if (match && match[1]) {
            return match[1];
        }
        return null;
    }();
    const IS_ANDROID = /Android/i.test(USER_AGENT);
    const ANDROID_VERSION = function () {
        const match = USER_AGENT.match(/Android (\d+)(?:\.(\d+))?(?:\.(\d+))*/i);
        if (!match) {
            return null;
        }
        const major = match[1] && parseFloat(match[1]);
        const minor = match[2] && parseFloat(match[2]);
        if (major && minor) {
            return parseFloat(match[1] + '.' + match[2]);
        } else if (major) {
            return major;
        }
        return null;
    }();
    const IS_NATIVE_ANDROID = IS_ANDROID && ANDROID_VERSION < 5 && appleWebkitVersion < 537;
    const IS_FIREFOX = /Firefox/i.test(USER_AGENT);
    const IS_EDGE = /Edg/i.test(USER_AGENT);
    const IS_CHROME = !IS_EDGE && (/Chrome/i.test(USER_AGENT) || /CriOS/i.test(USER_AGENT));
    const CHROME_VERSION = function () {
        const match = USER_AGENT.match(/(Chrome|CriOS)\/(\d+)/);
        if (match && match[2]) {
            return parseFloat(match[2]);
        }
        return null;
    }();
    const IE_VERSION = function () {
        const result = /MSIE\s(\d+)\.\d/.exec(USER_AGENT);
        let version = result && parseFloat(result[1]);
        if (!version && /Trident\/7.0/i.test(USER_AGENT) && /rv:11.0/.test(USER_AGENT)) {
            version = 11;
        }
        return version;
    }();
    const IS_SAFARI = /Safari/i.test(USER_AGENT) && !IS_CHROME && !IS_ANDROID && !IS_EDGE;
    const IS_WINDOWS = /Windows/i.test(USER_AGENT);
    const TOUCH_ENABLED = Boolean(isReal() && ('ontouchstart' in window || window.navigator.maxTouchPoints || window.DocumentTouch && window.document instanceof window.DocumentTouch));
    const IS_IPAD = /iPad/i.test(USER_AGENT) || IS_SAFARI && TOUCH_ENABLED && !/iPhone/i.test(USER_AGENT);
    const IS_IPHONE = /iPhone/i.test(USER_AGENT) && !IS_IPAD;
    const IS_IOS = IS_IPHONE || IS_IPAD || IS_IPOD;
    const IS_ANY_SAFARI = (IS_SAFARI || IS_IOS) && !IS_CHROME;
    return {
        IS_IPOD: IS_IPOD,
        IOS_VERSION: IOS_VERSION,
        IS_ANDROID: IS_ANDROID,
        ANDROID_VERSION: ANDROID_VERSION,
        IS_NATIVE_ANDROID: IS_NATIVE_ANDROID,
        IS_FIREFOX: IS_FIREFOX,
        IS_EDGE: IS_EDGE,
        IS_CHROME: IS_CHROME,
        CHROME_VERSION: CHROME_VERSION,
        IE_VERSION: IE_VERSION,
        IS_SAFARI: IS_SAFARI,
        IS_WINDOWS: IS_WINDOWS,
        TOUCH_ENABLED: TOUCH_ENABLED,
        IS_IPAD: IS_IPAD,
        IS_IPHONE: IS_IPHONE,
        IS_IOS: IS_IOS,
        IS_ANY_SAFARI: IS_ANY_SAFARI,

        isReal
    };
});
define('skylark-videojs/utils/dom',[
    "skylark-langx-globals/window",
    "skylark-langx-globals/document",   
    "skylark-domx",
    '../fullscreen-api',
    './log',
    './obj',
    './computed-style',
    './browser'
], function (window,document,domx,fs, log, obj, computedStyle, browser) {
    'use strict';
    function isNonBlankString(str) {
        return typeof str === 'string' && Boolean(str.trim());
    }
    function throwIfWhitespace(str) {
        if (str.indexOf(' ') >= 0) {
            throw new Error('class has illegal whitespace characters');
        }
    }
    function classRegExp(className) {
        return new RegExp('(^|\\s)' + className + '($|\\s)');
    }

    function isEl(value) {
        return obj.isObject(value) && value.nodeType === 1;
    }
    function isInFrame() {
        try {
            return window.parent !== window.self;
        } catch (x) {
            return true;
        }
    }
    function createQuerier(method) {
        return function (selector, context) {
            if (!isNonBlankString(selector)) {
                return document[method](null);
            }
            if (isNonBlankString(context)) {
                context = document.querySelector(context);
            }
            const ctx = isEl(context) ? context : document;
            return ctx[method] && ctx[method](selector);
        };
    }
    function createEl(tagName = 'div', properties = {}, attributes = {}, content) {
        const el = document.createElement(tagName);
        Object.getOwnPropertyNames(properties).forEach(function (propName) {
            const val = properties[propName];
            if (propName.indexOf('aria-') !== -1 || propName === 'role' || propName === 'type') {
                log.warn('Setting attributes in the second argument of createEl()\n' + 'has been deprecated. Use the third argument instead.\n' + `createEl(type, properties, attributes). Attempting to set ${ propName } to ${ val }.`);
                el.setAttribute(propName, val);
            } else if (propName === 'textContent') {
                textContent(el, val);
            } else if (el[propName] !== val || propName === 'tabIndex') {
                el[propName] = val;
            }
        });
        Object.getOwnPropertyNames(attributes).forEach(function (attrName) {
            el.setAttribute(attrName, attributes[attrName]);
        });
        if (content) {
            appendContent(el, content);
        }
        return el;
    }
    function textContent(el, text) {
        if (typeof el.textContent === 'undefined') {
            el.innerText = text;
        } else {
            el.textContent = text;
        }
        return el;
    }
    function prependTo(child, parent) {
        if (parent.firstChild) {
            parent.insertBefore(child, parent.firstChild);
        } else {
            parent.appendChild(child);
        }
    }
    function hasClass(element, classToCheck) {
        throwIfWhitespace(classToCheck);
        if (element.classList) {
            return element.classList.contains(classToCheck);
        }
        return classRegExp(classToCheck).test(element.className);
    }
    function addClass(element, classToAdd) {
        if (element.classList) {
            element.classList.add(classToAdd);
        } else if (!hasClass(element, classToAdd)) {
            element.className = (element.className + ' ' + classToAdd).trim();
        }
        return element;
    }
    function removeClass(element, classToRemove) {
        if (element.classList) {
            element.classList.remove(classToRemove);
        } else {
            throwIfWhitespace(classToRemove);
            element.className = element.className.split(/\s+/).filter(function (c) {
                return c !== classToRemove;
            }).join(' ');
        }
        return element;
    }
    function toggleClass(element, classToToggle, predicate) {
        const has = hasClass(element, classToToggle);
        if (typeof predicate === 'function') {
            predicate = predicate(element, classToToggle);
        }
        if (typeof predicate !== 'boolean') {
            predicate = !has;
        }
        if (predicate === has) {
            return;
        }
        if (predicate) {
            addClass(element, classToToggle);
        } else {
            removeClass(element, classToToggle);
        }
        return element;
    }
    function setAttributes(el, attributes) {
        Object.getOwnPropertyNames(attributes).forEach(function (attrName) {
            const attrValue = attributes[attrName];
            if (attrValue === null || typeof attrValue === 'undefined' || attrValue === false) {
                el.removeAttribute(attrName);
            } else {
                el.setAttribute(attrName, attrValue === true ? '' : attrValue);
            }
        });
    }
    function getAttributes(tag) {
        const obj = {};
        const knownBooleans = ',' + 'autoplay,controls,playsinline,loop,muted,default,defaultMuted' + ',';
        if (tag && tag.attributes && tag.attributes.length > 0) {
            const attrs = tag.attributes;
            for (let i = attrs.length - 1; i >= 0; i--) {
                const attrName = attrs[i].name;
                let attrVal = attrs[i].value;
                if (typeof tag[attrName] === 'boolean' || knownBooleans.indexOf(',' + attrName + ',') !== -1) {
                    attrVal = attrVal !== null ? true : false;
                }
                obj[attrName] = attrVal;
            }
        }
        return obj;
    }
    function getAttribute(el, attribute) {
        return el.getAttribute(attribute);
    }
    function setAttribute(el, attribute, value) {
        el.setAttribute(attribute, value);
    }
    function removeAttribute(el, attribute) {
        el.removeAttribute(attribute);
    }
    function blockTextSelection() {
        document.body.focus();
        document.onselectstart = function () {
            return false;
        };
    }
    function unblockTextSelection() {
        document.onselectstart = function () {
            return true;
        };
    }
    function getBoundingClientRect(el) {
        if (el && el.getBoundingClientRect && el.parentNode) {
            const rect = el.getBoundingClientRect();
            const result = {};
            [
                'bottom',
                'height',
                'left',
                'right',
                'top',
                'width'
            ].forEach(k => {
                if (rect[k] !== undefined) {
                    result[k] = rect[k];
                }
            });
            if (!result.height) {
                result.height = parseFloat(computedStyle(el, 'height'));
            }
            if (!result.width) {
                result.width = parseFloat(computedStyle(el, 'width'));
            }
            return result;
        }
    }
    function findPosition(el) {
        if (!el || el && !el.offsetParent) {
            return {
                left: 0,
                top: 0,
                width: 0,
                height: 0
            };
        }
        const width = el.offsetWidth;
        const height = el.offsetHeight;
        let left = 0;
        let top = 0;
        while (el.offsetParent && el !== document[fs.fullscreenElement]) {
            left += el.offsetLeft;
            top += el.offsetTop;
            el = el.offsetParent;
        }
        return {
            left,
            top,
            width,
            height
        };
    }
    function getPointerPosition(el, event) {
        const translated = {
            x: 0,
            y: 0
        };
        if (browser.IS_IOS) {
            let item = el;
            while (item && item.nodeName.toLowerCase() !== 'html') {
                const transform = computedStyle(item, 'transform');
                if (/^matrix/.test(transform)) {
                    const values = transform.slice(7, -1).split(/,\s/).map(Number);
                    translated.x += values[4];
                    translated.y += values[5];
                } else if (/^matrix3d/.test(transform)) {
                    const values = transform.slice(9, -1).split(/,\s/).map(Number);
                    translated.x += values[12];
                    translated.y += values[13];
                }
                item = item.parentNode;
            }
        }
        const position = {};
        const boxTarget = findPosition(event.target);
        const box = findPosition(el);
        const boxW = box.width;
        const boxH = box.height;
        let offsetY = event.offsetY - (box.top - boxTarget.top);
        let offsetX = event.offsetX - (box.left - boxTarget.left);
        if (event.changedTouches) {
            offsetX = event.changedTouches[0].pageX - box.left;
            offsetY = event.changedTouches[0].pageY + box.top;
            if (browser.IS_IOS) {
                offsetX -= translated.x;
                offsetY -= translated.y;
            }
        }
        position.y = 1 - Math.max(0, Math.min(1, offsetY / boxH));
        position.x = Math.max(0, Math.min(1, offsetX / boxW));
        return position;
    }
    function isTextNode(value) {
        return obj.isObject(value) && value.nodeType === 3;
    }
    function emptyEl(el) {
        while (el.firstChild) {
            el.removeChild(el.firstChild);
        }
        return el;
    }
    function normalizeContent(content) {
        if (typeof content === 'function') {
            content = content();
        }
        return (Array.isArray(content) ? content : [content]).map(value => {
            if (typeof value === 'function') {
                value = value();
            }
            if (isEl(value) || isTextNode(value)) {
                return value;
            }
            if (typeof value === 'string' && /\S/.test(value)) {
                return document.createTextNode(value);
            }
        }).filter(value => value);
    }
    function appendContent(el, content) {
        normalizeContent(content).forEach(node => el.appendChild(node));
        return el;
    }
    function insertContent(el, content) {
        return appendContent(emptyEl(el), content);
    }
    function isSingleLeftClick(event) {
        if (event.button === undefined && event.buttons === undefined) {
            return true;
        }
        if (event.button === 0 && event.buttons === undefined) {
            return true;
        }
        if (event.type === 'mouseup' && event.button === 0 && event.buttons === 0) {
            return true;
        }
        if (event.button !== 0 || event.buttons !== 1) {
            return false;
        }
        return true;
    }
    const $ = createQuerier('querySelector');
    const $$ = createQuerier('querySelectorAll');
    return {
        isReal: browser.isReal,
        isEl: domx.noder.isElement,// isEl,
        isInFrame: domx.noder.isInFrame, //isInFrame,
        createEl:  function (tagName = 'div', properties = {}, attributes = {}, content) { //createEl,
            var el  = domx.noder.createElement(tagName,properties,attributes);
            if (content) {
                domx.noder.append(el,content)
            }
            return el;
        }, 
        textContent: domx.data.text, //textContent,
        prependTo: function (child, parent) { //prependTo,
            domx.noder.prepend(parent,child);
        },
        hasClass: domx.styler.hasClass, //hasClass,
        addClass: domx.styler.addClass,  //addClass,
        removeClass: domx.styler.removeClass, //removeClass,
        toggleClass: domx.styler.toogleClass, //toggleClass,
        setAttributes: domx.data.attr, // setAttributes,
        getAttributes: getAttributes,
        getAttribute: domx.data.attr, //getAttribute,
        setAttribute: domx.data.attr, //setAttribute,
        removeAttribute: domx.data.removeAttr, //removeAttribute,
        blockTextSelection: blockTextSelection,
        unblockTextSelection: unblockTextSelection,
        getBoundingClientRect: getBoundingClientRect,
        findPosition: domx.geom.pageRect, //findPosition,
        getPointerPosition: getPointerPosition,
        isTextNode: domx.noder.isTextNode,// isTextNode,
        emptyEl: domx.noder.empty, //emptyEl,
        normalizeContent: normalizeContent,
        appendContent: domx.noder.append,//appendContent,
        insertContent: function(el,content) { //insertContent,
            domx.noder.empty(el);
            domx.noder.append(el,content);
            return el;
        },
        isSingleLeftClick: isSingleLeftClick,
        $: function(selector,context) {
            context = context || document;
            return domx.finder.find(context,selector);
        },
        $$: function(selector,context) {
            context = context || document;
            return domx.finder.findAll(context,selector);
        }
    };
});
define('skylark-videojs/setup',[
    'skylark-langx-globals/document',
    './utils/dom'
], function (document,Dom) {
    'use strict';
    let _windowLoaded = false;
    let videojs;
    const autoSetup = function () {
        if (!Dom.isReal() || videojs.options.autoSetup === false) {
            return;
        }
        const vids = Array.prototype.slice.call(document.getElementsByTagName('video'));
        const audios = Array.prototype.slice.call(document.getElementsByTagName('audio'));
        const divs = Array.prototype.slice.call(document.getElementsByTagName('video-js'));
        const mediaEls = vids.concat(audios, divs);
        if (mediaEls && mediaEls.length > 0) {
            for (let i = 0, e = mediaEls.length; i < e; i++) {
                const mediaEl = mediaEls[i];
                if (mediaEl && mediaEl.getAttribute) {
                    if (mediaEl.player === undefined) {
                        const options = mediaEl.getAttribute('data-setup');
                        if (options !== null) {
                            videojs(mediaEl);
                        }
                    }
                } else {
                    autoSetupTimeout(1);
                    break;
                }
            }
        } else if (!_windowLoaded) {
            autoSetupTimeout(1);
        }
    };
    function autoSetupTimeout(wait, vjs) {
        if (vjs) {
            videojs = vjs;
        }
        window.setTimeout(autoSetup, wait);
    }
    function setWindowLoaded() {
        _windowLoaded = true;
        window.removeEventListener('load', setWindowLoaded);
    }
    if (Dom.isReal()) {
        if (document.readyState === 'complete') {
            setWindowLoaded();
        } else {
            window.addEventListener('load', setWindowLoaded);
        }
    }
    const hasLoaded = function () {
        return _windowLoaded;
    };
    return {
        autoSetup,
        autoSetupTimeout,
        hasLoaded
    };
});
define('skylark-videojs/utils/stylesheet',[
    'skylark-langx-globals/document'
], function (document) {
    'use strict';
    const createStyleElement = function (className) {
        const style = document.createElement('style');
        style.className = className;
        return style;
    };
    const setTextContent = function (el, content) {
        if (el.styleSheet) {
            el.styleSheet.cssText = content;
        } else {
            el.textContent = content;
        }
    };
    return {
        createStyleElement: createStyleElement,
        setTextContent: setTextContent
    };
});
define('skylark-videojs/utils/guid',[],function () {
    'use strict';
    const _initialGuid = 3;
    let _guid = _initialGuid;
    function newGUID() {
        return _guid++;
    }
    function resetGuidInTestsOnly() {
        _guid = _initialGuid;
    }
    return {
        newGUID: newGUID,
        resetGuidInTestsOnly: resetGuidInTestsOnly
    };
});
define('skylark-videojs/utils/dom-data',[
    './log',
    './guid'
], function (log, Guid) {
    'use strict';
    let FakeWeakMap;
    if (!window.WeakMap) {
        FakeWeakMap = class {
            constructor() {
                this.vdata = 'vdata' + Math.floor(window.performance && window.performance.now() || Date.now());
                this.data = {};
            }
            set(key, value) {
                const access = key[this.vdata] || Guid.newGUID();
                if (!key[this.vdata]) {
                    key[this.vdata] = access;
                }
                this.data[access] = value;
                return this;
            }
            get(key) {
                const access = key[this.vdata];
                if (access) {
                    return this.data[access];
                }
                log('We have no data for this element', key);
                return undefined;
            }
            has(key) {
                const access = key[this.vdata];
                return access in this.data;
            }
            delete(key) {
                const access = key[this.vdata];
                if (access) {
                    delete this.data[access];
                    delete key[this.vdata];
                }
            }
        };
    }
    return window.WeakMap ? new WeakMap() : new FakeWeakMap();
});
define('skylark-videojs/utils/events',[
    'skylark-langx-globals/document',
    "skylark-domx",
    './dom-data',
    './guid',
    './log'
], function (document, domx, DomData, Guid, log) {
    'use strict';
    function _cleanUpEvents(elem, type) {
        if (!DomData.has(elem)) {
            return;
        }
        const data = DomData.get(elem);
        if (data.handlers[type].length === 0) {
            delete data.handlers[type];
            if (elem.removeEventListener) {
                elem.removeEventListener(type, data.dispatcher, false);
            } else if (elem.detachEvent) {
                elem.detachEvent('on' + type, data.dispatcher);
            }
        }
        if (Object.getOwnPropertyNames(data.handlers).length <= 0) {
            delete data.handlers;
            delete data.dispatcher;
            delete data.disabled;
        }
        if (Object.getOwnPropertyNames(data).length === 0) {
            DomData.delete(elem);
        }
    }
    function _handleMultipleEvents(fn, elem, types, callback) {
        types.forEach(function (type) {
            fn(elem, type, callback);
        });
    }
    function fixEvent(event) {
        if (event.fixed_) {
            return event;
        }
        function returnTrue() {
            return true;
        }
        function returnFalse() {
            return false;
        }
        if (!event || !event.isPropagationStopped) {
            const old = event || window.event;
            event = {};
            for (const key in old) {
                if (key !== 'layerX' && key !== 'layerY' && key !== 'keyLocation' && key !== 'webkitMovementX' && key !== 'webkitMovementY') {
                    if (!(key === 'returnValue' && old.preventDefault)) {
                        event[key] = old[key];
                    }
                }
            }
            if (!event.target) {
                event.target = event.srcElement || document;
            }
            if (!event.relatedTarget) {
                event.relatedTarget = event.fromElement === event.target ? event.toElement : event.fromElement;
            }
            event.preventDefault = function () {
                if (old.preventDefault) {
                    old.preventDefault();
                }
                event.returnValue = false;
                old.returnValue = false;
                event.defaultPrevented = true;
            };
            event.defaultPrevented = false;
            event.stopPropagation = function () {
                if (old.stopPropagation) {
                    old.stopPropagation();
                }
                event.cancelBubble = true;
                old.cancelBubble = true;
                event.isPropagationStopped = returnTrue;
            };
            event.isPropagationStopped = returnFalse;
            event.stopImmediatePropagation = function () {
                if (old.stopImmediatePropagation) {
                    old.stopImmediatePropagation();
                }
                event.isImmediatePropagationStopped = returnTrue;
                event.stopPropagation();
            };
            event.isImmediatePropagationStopped = returnFalse;
            if (event.clientX !== null && event.clientX !== undefined) {
                const doc = document.documentElement;
                const body = document.body;
                event.pageX = event.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0);
                event.pageY = event.clientY + (doc && doc.scrollTop || body && body.scrollTop || 0) - (doc && doc.clientTop || body && body.clientTop || 0);
            }
            event.which = event.charCode || event.keyCode;
            if (event.button !== null && event.button !== undefined) {
                event.button = event.button & 1 ? 0 : event.button & 4 ? 1 : event.button & 2 ? 2 : 0;
            }
        }
        event.fixed_ = true;
        return event;
    }
    let _supportsPassive;
    const supportsPassive = function () {
        if (typeof _supportsPassive !== 'boolean') {
            _supportsPassive = false;
            try {
                const opts = Object.defineProperty({}, 'passive', {
                    get() {
                        _supportsPassive = true;
                    }
                });
                window.addEventListener('test', null, opts);
                window.removeEventListener('test', null, opts);
            } catch (e) {
            }
        }
        return _supportsPassive;
    };
    const passiveEvents = [
        'touchstart',
        'touchmove'
    ];
    function on(elem, type, fn) {
        if (Array.isArray(type)) {
            return _handleMultipleEvents(on, elem, type, fn);
        }
        if (!DomData.has(elem)) {
            DomData.set(elem, {});
        }
        const data = DomData.get(elem);
        if (!data.handlers) {
            data.handlers = {};
        }
        if (!data.handlers[type]) {
            data.handlers[type] = [];
        }
        if (!fn.guid) {
            fn.guid = Guid.newGUID();
        }
        data.handlers[type].push(fn);
        if (!data.dispatcher) {
            data.disabled = false;
            data.dispatcher = function (event, hash) {
                if (data.disabled) {
                    return;
                }
                event = fixEvent(event);
                const handlers = data.handlers[event.type];
                if (handlers) {
                    const handlersCopy = handlers.slice(0);
                    for (let m = 0, n = handlersCopy.length; m < n; m++) {
                        if (event.isImmediatePropagationStopped()) {
                            break;
                        } else {
                            try {
                                handlersCopy[m].call(elem, event, hash);
                            } catch (e) {
                                log.error(e);
                            }
                        }
                    }
                }
            };
        }
        if (data.handlers[type].length === 1) {
            if (elem.addEventListener) {
                let options = false;
                if (supportsPassive() && passiveEvents.indexOf(type) > -1) {
                    options = { passive: true };
                }
                elem.addEventListener(type, data.dispatcher, options);
            } else if (elem.attachEvent) {
                elem.attachEvent('on' + type, data.dispatcher);
            }
        }
    }
    function off(elem, type, fn) {
        if (!DomData.has(elem)) {
            return;
        }
        const data = DomData.get(elem);
        if (!data.handlers) {
            return;
        }
        if (Array.isArray(type)) {
            return _handleMultipleEvents(off, elem, type, fn);
        }
        const removeType = function (el, t) {
            data.handlers[t] = [];
            _cleanUpEvents(el, t);
        };
        if (type === undefined) {
            for (const t in data.handlers) {
                if (Object.prototype.hasOwnProperty.call(data.handlers || {}, t)) {
                    removeType(elem, t);
                }
            }
            return;
        }
        const handlers = data.handlers[type];
        if (!handlers) {
            return;
        }
        if (!fn) {
            removeType(elem, type);
            return;
        }
        if (fn.guid) {
            for (let n = 0; n < handlers.length; n++) {
                if (handlers[n].guid === fn.guid) {
                    handlers.splice(n--, 1);
                }
            }
        }
        _cleanUpEvents(elem, type);
    }
    function trigger(elem, event, hash) {
        const elemData = DomData.has(elem) ? DomData.get(elem) : {};
        const parent = elem.parentNode || elem.ownerDocument;
        if (typeof event === 'string') {
            event = {
                type: event,
                target: elem
            };
        } else if (!event.target) {
            event.target = elem;
        }
        event = fixEvent(event);
        if (elemData.dispatcher) {
            elemData.dispatcher.call(elem, event, hash);
        }
        if (parent && !event.isPropagationStopped() && event.bubbles === true) {
            trigger.call(null, parent, event, hash);
        } else if (!parent && !event.defaultPrevented && event.target && event.target[event.type]) {
            if (!DomData.has(event.target)) {
                DomData.set(event.target, {});
            }
            const targetData = DomData.get(event.target);
            if (event.target[event.type]) {
                targetData.disabled = true;
                if (typeof event.target[event.type] === 'function') {
                    event.target[event.type]();
                }
                targetData.disabled = false;
            }
        }
        return !event.defaultPrevented;
    }
    function one(elem, type, fn) {
        if (Array.isArray(type)) {
            return _handleMultipleEvents(one, elem, type, fn);
        }
        const func = function () {
            off(elem, type, func);
            fn.apply(this, arguments);
        };
        func.guid = fn.guid = fn.guid || Guid.newGUID();
        on(elem, type, func);
    }
    function any(elem, type, fn) {
        const func = function () {
            off(elem, type, func);
            fn.apply(this, arguments);
        };
        func.guid = fn.guid = fn.guid || Guid.newGUID();
        on(elem, type, func);
    }
    return {
        fixEvent: fixEvent,
        on: domx.eventer.on, //on,
        off: domx.eventer.off, //off,
        trigger: domx.eventer.trigger, //trigger,
        one: domx.eventer.one, //one,
        any: domx.eventer.one //any
    };
});
define('skylark-videojs/utils/fn',[
    './guid'
], function (GUID) {
    'use strict';
    const UPDATE_REFRESH_INTERVAL = 30;
    const bind = function (context, fn, uid) {
        if (!fn.guid) {
            fn.guid = GUID.newGUID();
        }
        const bound = fn.bind(context);
        bound.guid = uid ? uid + '_' + fn.guid : fn.guid;
        return bound;
    };
    const throttle = function (fn, wait) {
        let last = window.performance.now();
        const throttled = function (...args) {
            const now = window.performance.now();
            if (now - last >= wait) {
                fn(...args);
                last = now;
            }
        };
        return throttled;
    };
    const debounce = function (func, wait, immediate, context = window) {
        let timeout;
        const cancel = () => {
            context.clearTimeout(timeout);
            timeout = null;
        };
        const debounced = function () {
            const self = this;
            const args = arguments;
            let later = function () {
                timeout = null;
                later = null;
                if (!immediate) {
                    func.apply(self, args);
                }
            };
            if (!timeout && immediate) {
                func.apply(self, args);
            }
            context.clearTimeout(timeout);
            timeout = context.setTimeout(later, wait);
        };
        debounced.cancel = cancel;
        return debounced;
    };
    return {
        UPDATE_REFRESH_INTERVAL: UPDATE_REFRESH_INTERVAL,
        bind: bind,
        throttle: throttle,
        debounce: debounce
    };
});
define('skylark-videojs/event-target',[
    "skylark-langx-events/Emitter",
    './utils/events'
], function (Emitter,Events) {
    'use strict';

    /*
    const EventTarget = function () {
    };
    EventTarget.prototype.allowedEvents_ = {};
    EventTarget.prototype.on = function (type, fn) {
        const ael = this.addEventListener;
        this.addEventListener = () => {
        };
        Events.on(this, type, fn);
        this.addEventListener = ael;
    };
    EventTarget.prototype.addEventListener = EventTarget.prototype.on;
    EventTarget.prototype.off = function (type, fn) {
        Events.off(this, type, fn);
    };
    EventTarget.prototype.removeEventListener = EventTarget.prototype.off;
    EventTarget.prototype.one = function (type, fn) {
        const ael = this.addEventListener;
        this.addEventListener = () => {
        };
        Events.one(this, type, fn);
        this.addEventListener = ael;
    };
    EventTarget.prototype.any = function (type, fn) {
        const ael = this.addEventListener;
        this.addEventListener = () => {
        };
        Events.any(this, type, fn);
        this.addEventListener = ael;
    };
    EventTarget.prototype.trigger = function (event) {
        const type = event.type || event;
        if (typeof event === 'string') {
            event = { type };
        }
        event = Events.fixEvent(event);
        if (this.allowedEvents_[type] && this['on' + type]) {
            this['on' + type](event);
        }
        Events.trigger(this, event);
    };
    EventTarget.prototype.dispatchEvent = EventTarget.prototype.trigger;

    */

    var EventTarget = Emitter.inherit({});
    EventTarget.prototype.addEventListener = EventTarget.prototype.on;
    EventTarget.prototype.dispatchEvent = EventTarget.prototype.trigger;
    EventTarget.prototype.removeEventListener = EventTarget.prototype.off;
    EventTarget.prototype.any = EventTarget.prototype.one;

    let EVENT_MAP;
    EventTarget.prototype.queueTrigger = function (event) {
        if (!EVENT_MAP) {
            EVENT_MAP = new Map();
        }
        const type = event.type || event;
        let map = EVENT_MAP.get(this);
        if (!map) {
            map = new Map();
            EVENT_MAP.set(this, map);
        }
        const oldTimeout = map.get(type);
        map.delete(type);
        window.clearTimeout(oldTimeout);
        const timeout = window.setTimeout(() => {
            if (map.size === 0) {
                map = null;
                EVENT_MAP.delete(this);
            }
            this.trigger(event);
        }, 0);
        map.set(type, timeout);
    };

    return EventTarget;
});
define('skylark-videojs/mixins/evented',[
    '../utils/dom',
    '../utils/events',
    '../utils/fn',
    '../utils/obj',
    '../event-target',
    '../utils/log'
], function (Dom, Events, Fn, Obj, EventTarget, log) {
    'use strict';
    const objName = obj => {
        if (typeof obj.name === 'function') {
            return obj.name();
        }
        if (typeof obj.name === 'string') {
            return obj.name;
        }
        if (obj.name_) {
            return obj.name_;
        }
        if (obj.constructor && obj.constructor.name) {
            return obj.constructor.name;
        }
        return typeof obj;
    };
    const isEvented = object => object instanceof EventTarget || !!object.eventBusEl_ && [
        'on',
        'one',
        'off',
        'trigger'
    ].every(k => typeof object[k] === 'function');
    const addEventedCallback = (target, callback) => {
        if (isEvented(target)) {
            callback();
        } else {
            if (!target.eventedCallbacks) {
                target.eventedCallbacks = [];
            }
            target.eventedCallbacks.push(callback);
        }
    };
    const isValidEventType = type => typeof type === 'string' && /\S/.test(type) || Array.isArray(type) && !!type.length;
    const validateTarget = (target, obj, fnName) => {
        if (!target || !target.nodeName && !isEvented(target)) {
            throw new Error(`Invalid target for ${ objName(obj) }#${ fnName }; must be a DOM node or evented object.`);
        }
    };
    const validateEventType = (type, obj, fnName) => {
        if (!isValidEventType(type)) {
            throw new Error(`Invalid event type for ${ objName(obj) }#${ fnName }; must be a non-empty string or array.`);
        }
    };
    const validateListener = (listener, obj, fnName) => {
        if (typeof listener !== 'function') {
            throw new Error(`Invalid listener for ${ objName(obj) }#${ fnName }; must be a function.`);
        }
    };
    const normalizeListenArgs = (self, args, fnName) => {
        const isTargetingSelf = args.length < 3 || args[0] === self || args[0] === self.eventBusEl_;
        let target;
        let type;
        let listener;
        if (isTargetingSelf) {
            target = self.eventBusEl_;
            if (args.length >= 3) {
                args.shift();
            }
            [type, listener] = args;
        } else {
            [target, type, listener] = args;
        }
        validateTarget(target, self, fnName);
        validateEventType(type, self, fnName);
        validateListener(listener, self, fnName);
        listener = Fn.bind(self, listener);
        return {
            isTargetingSelf,
            target,
            type,
            listener
        };
    };
    const listen = (target, method, type, listener) => {
        validateTarget(target, target, method);
        if (target.nodeName) {
            Events[method](target, type, listener);
        } else {
            target[method](type, listener);
        }
    };
    const EventedMixin = {
        on(...args) {
            const {isTargetingSelf, target, type, listener} = normalizeListenArgs(this, args, 'on');
            listen(target, 'on', type, listener);
            if (!isTargetingSelf) {
                const removeListenerOnDispose = () => this.unlistenTo(target, type, listener);
                removeListenerOnDispose.guid = listener.guid;
                const removeRemoverOnTargetDispose = () => this.unlistenTo('dispose', removeListenerOnDispose);
                removeRemoverOnTargetDispose.guid = listener.guid;
                listen(this, 'on', 'dispose', removeListenerOnDispose);
                listen(target, 'on', 'dispose', removeRemoverOnTargetDispose);
            }
        },
        one(...args) {
            const {isTargetingSelf, target, type, listener} = normalizeListenArgs(this, args, 'one');
            if (isTargetingSelf) {
                listen(target, 'one', type, listener);
            } else {
                const wrapper = (...largs) => {
                    this.unlistenTo(target, type, wrapper);
                    listener.apply(null, largs);
                };
                wrapper.guid = listener.guid;
                listen(target, 'one', type, wrapper);
            }
        },
        any(...args) {
            const {isTargetingSelf, target, type, listener} = normalizeListenArgs(this, args, 'any');
            if (isTargetingSelf) {
                listen(target, 'any', type, listener);
            } else {
                const wrapper = (...largs) => {
                    this.unlistenTo(target, type, wrapper);
                    listener.apply(null, largs);
                };
                wrapper.guid = listener.guid;
                listen(target, 'any', type, wrapper);
            }
        },
        off(targetOrType, typeOrListener, listener) {
            if (!targetOrType || isValidEventType(targetOrType)) {
                Events.off(this.eventBusEl_, targetOrType, typeOrListener);
            } else {
                const target = targetOrType;
                const type = typeOrListener;
                validateTarget(target, this, 'off');
                validateEventType(type, this, 'off');
                validateListener(listener, this, 'off');
                listener = Fn.bind(this, listener);
                this.unlistenTo('dispose', listener);
                if (target.nodeName) {
                    Events.off(target, type, listener);
                    Events.off(target, 'dispose', listener);
                } else if (isEvented(target)) {
                    target.off(type, listener);
                    target.off('dispose', listener);
                }
            }
        },
        trigger(event, hash) {
            validateTarget(this.eventBusEl_, this, 'trigger');
            const type = event && typeof event !== 'string' ? event.type : event;
            if (!isValidEventType(type)) {
                const error = `Invalid event type for ${ objName(this) }#trigger; ` + 'must be a non-empty string or object with a type key that has a non-empty value.';
                if (event) {
                    (this.log || log).error(error);
                } else {
                    throw new Error(error);
                }
            }
            return Events.trigger(this.eventBusEl_, event, hash);
        }
    };
    function evented(target, options = {}) {
        const {eventBusKey} = options;
        if (eventBusKey) {
            if (!target[eventBusKey].nodeName) {
                throw new Error(`The eventBusKey "${ eventBusKey }" does not refer to an element.`);
            }
            target.eventBusEl_ = target[eventBusKey];
        } else {
            target.eventBusEl_ = Dom.createEl('span', { className: 'vjs-event-bus' });
        }
        Obj.assign(target, EventedMixin);
        if (target.eventedCallbacks) {
            target.eventedCallbacks.forEach(callback => {
                callback();
            });
        }
        target.on('dispose', () => {
            target.off();
            window.setTimeout(() => {
                target.eventBusEl_ = null;
            }, 0);
        });
        return target;
    }

    evented.isEvented = isEvented;
    evented.addEventedCallback = addEventedCallback;

    return evented;
    
});
define('skylark-videojs/mixins/stateful',[
    './evented',
    '../utils/obj'
], function (evented, Obj) {
    'use strict';
    const StatefulMixin = {
        state: {},
        setState(stateUpdates) {
            if (typeof stateUpdates === 'function') {
                stateUpdates = stateUpdates();
            }
            let changes;
            Obj.each(stateUpdates, (value, key) => {
                if (this.state[key] !== value) {
                    changes = changes || {};
                    changes[key] = {
                        from: this.state[key],
                        to: value
                    };
                }
                this.state[key] = value;
            });
            if (changes && evented.isEvented(this)) {
                this.trigger({
                    changes,
                    type: 'statechanged'
                });
            }
            return changes;
        }
    };
    function stateful(target, defaultState) {
        Obj.assign(target, StatefulMixin);
        target.state = Obj.assign({}, target.state, defaultState);
        if (typeof target.handleStateChanged === 'function' && evented.isEvented(target)) {
            target.on('statechanged', target.handleStateChanged);
        }
        return target;
    }
    return stateful;
});
define('skylark-videojs/utils/string-cases',[],function () {
    'use strict';
    const toLowerCase = function (string) {
        if (typeof string !== 'string') {
            return string;
        }
        return string.replace(/./, w => w.toLowerCase());
    };
    const toTitleCase = function (string) {
        if (typeof string !== 'string') {
            return string;
        }
        return string.replace(/./, w => w.toUpperCase());
    };
    const titleCaseEquals = function (str1, str2) {
        return toTitleCase(str1) === toTitleCase(str2);
    };
    return {
        toLowerCase: toLowerCase,
        toTitleCase: toTitleCase,
        titleCaseEquals: titleCaseEquals
    };
});
define('skylark-videojs/utils/merge-options',['./obj'], function (obj) {
    'use strict';
    function mergeOptions(...sources) {
        const result = {};
        sources.forEach(source => {
            if (!source) {
                return;
            }
            obj.each(source, (value, key) => {
                if (!obj.isPlain(value)) {
                    result[key] = value;
                    return;
                }
                if (!obj.isPlain(result[key])) {
                    result[key] = {};
                }
                result[key] = mergeOptions(result[key], value);
            });
        });
        return result;
    }
    return mergeOptions;
});
define('skylark-videojs/utils/map',[], function () {
    'use strict';
    class MapSham {
        constructor() {
            this.map_ = {};
        }
        has(key) {
            return key in this.map_;
        }
        delete(key) {
            const has = this.has(key);
            delete this.map_[key];
            return has;
        }
        set(key, value) {
            this.map_[key] = value;
            return this;
        }
        forEach(callback, thisArg) {
            for (const key in this.map_) {
                callback.call(thisArg, this.map_[key], key, this);
            }
        }
    }
    return window.Map ? window.Map : MapSham;
});
define('skylark-videojs/utils/set',[], function () {
    'use strict';
    class SetSham {
        constructor() {
            this.set_ = {};
        }
        has(key) {
            return key in this.set_;
        }
        delete(key) {
            const has = this.has(key);
            delete this.set_[key];
            return has;
        }
        add(key) {
            this.set_[key] = 1;
            return this;
        }
        forEach(callback, thisArg) {
            for (const key in this.set_) {
                callback.call(thisArg, key, key, this);
            }
        }
    }
    return window.Set ? window.Set : SetSham;
});
define('skylark-videojs/component',[
    "skylark-langx",
    "skylark-domx-eventer",
    "skylark-widgets-base/Widget",
    './mixins/evented',
    './mixins/stateful',
    './utils/dom',
    './utils/dom-data',
    './utils/fn',
    './utils/guid',
    './utils/string-cases',
    './utils/merge-options',
    './utils/computed-style',
    './utils/map',
    './utils/set'
], function (langx,eventer,Widget,evented, stateful, Dom, DomData, Fn, Guid, stringCases, mergeOptions, computedStyle, Map, Set) {
    'use strict';
    class Component extends Widget {
        on(events, selector, data, callback, ctx, /*used internally*/ one) {
            if (this.el_ && eventer.isNativeEvent(events)) {
                eventer.on(this.el_,events,selector,data,callback,ctx,one);
            } else {
                super.on(events, selector, data, callback, ctx,  one);
            }
        }   

        off(events, callback) {
            if (this.el_ && eventer.isNativeEvent(events)) {
                eventer.off(this.el_,events,callback);
            } else {
                super.off(events,callback);
            }
        }

        listenTo (obj, event, callback, /*used internally*/ one) {
            if (langx.isString(obj) || langx.isArray(obj)) {
                one = callback;
                callback = event;
                event = obj;
                if (this.el_ && eventer.isNativeEvent(event)) {
                    eventer.on(this.el_,event,callback,this,one);
                } else {
                    this.on(event,callback,this,one);
                }
            } else {
                if (obj.nodeType) {
                    eventer.on(obj,event,callback,this,one)
                } else {
                    super.listenTo(obj,event,callback,one)
                }                
            }
        }

        unlistenTo(obj, event, callback) {
            if (langx.isString(obj) || langx.isArray(obj)) {
                callback = event;
                event = obj;
                if (this.el_ && eventer.isNativeEvent(event)) {
                    eventer.off(this.el_,event,callback);
                } else {
                    this.off(event,callback);                   
                }
            } else {
                if (obj.nodeType) {
                    eventer.off(obj,event,callback)
                } else {
                    super.unlistenTo(obj,event,callback)
                }
            }
        }

        _create() {

        }


        _construct(player, options, ready) {
            /*
            var el;
            if (options.el) {
               el = options.el;
            } else if (options.createEl !== false) {
                el = this.createEl();
            }
            super(el);
            */

            if (!player && this.play) {
                this.player_ = player = this;
            } else {
                this.player_ = player;
            }
            this.isDisposed_ = false;
            this.parentComponent_ = null;
            this.options_ = mergeOptions({}, this.options_);
            options = this.options_ = mergeOptions(this.options_, options);
            this.id_ = options.id || options.el && options.el.id;
            if (!this.id_) {
                const id = player && player.id && player.id() || 'no_player';
                this.id_ = `${ id }_component_${ Guid.newGUID() }`;
            }
            this.name_ = options.name || null;
            if (options.el) {
               this.el_ = options.el;
            } else if (options.createEl !== false) {
                this.el_ = this.createEl();
            }
            //this.el_ = this._elm;

            if (options.evented !== false) {
                ///evented(this, { eventBusKey: this.el_ ? 'el_' : null });
                this.handleLanguagechange = this.handleLanguagechange.bind(this);
                ///this.listenTo(this.player_, 'languagechange', this.handleLanguagechange);
                this.listenTo(this.player_, 'languagechange', this.handleLanguagechange);
            }


            stateful(this, this.constructor.defaultState);
            this.children_ = [];
            this.childIndex_ = {};
            this.childNameIndex_ = {};
            this.setTimeoutIds_ = new Set();
            this.setIntervalIds_ = new Set();
            this.rafIds_ = new Set();
            this.namedRafs_ = new Map();
            this.clearingTimersOnDispose_ = false;
            if (options.initChildren !== false) {
                this.initChildren();
            }
            this.ready(ready);
            if (options.reportTouchActivity !== false) {
                this.enableTouchActivity();
            }
        }
        dispose() {
            if (this.isDisposed_) {
                return;
            }
            if (this.readyQueue_) {
                this.readyQueue_.length = 0;
            }
            this.trigger({
                type: 'dispose',
                bubbles: false
            });
            this.isDisposed_ = true;
            if (this.children_) {
                for (let i = this.children_.length - 1; i >= 0; i--) {
                    if (this.children_[i].dispose) {
                        this.children_[i].dispose();
                    }
                }
            }
            this.children_ = null;
            this.childIndex_ = null;
            this.childNameIndex_ = null;
            this.parentComponent_ = null;
            if (this.el_) {
                if (this.el_.parentNode) {
                    this.el_.parentNode.removeChild(this.el_);
                }
                ///if (DomData.has(this.el_)) {
                ///    DomData.delete(this.el_);
                ///}
                eventer.clear(this.el_);
                this.el_ = null;
            }
            this.player_ = null;
        }
        isDisposed() {
            return Boolean(this.isDisposed_);
        }
        player() {
            return this.player_;
        }
        options(obj) {
            if (!obj) {
                return this.options_;
            }
            this.options_ = mergeOptions(this.options_, obj);
            return this.options_;
        }
        el() {
            return this.el_;
        }
        createEl(tagName, properties, attributes) {
            return Dom.createEl(tagName, properties, attributes);
        }
        localize(string, tokens, defaultValue = string) {
            const code = this.player_.language && this.player_.language();
            const languages = this.player_.languages && this.player_.languages();
            const language = languages && languages[code];
            const primaryCode = code && code.split('-')[0];
            const primaryLang = languages && languages[primaryCode];
            let localizedString = defaultValue;
            if (language && language[string]) {
                localizedString = language[string];
            } else if (primaryLang && primaryLang[string]) {
                localizedString = primaryLang[string];
            }
            if (tokens) {
                localizedString = localizedString.replace(/\{(\d+)\}/g, function (match, index) {
                    const value = tokens[index - 1];
                    let ret = value;
                    if (typeof value === 'undefined') {
                        ret = match;
                    }
                    return ret;
                });
            }
            return localizedString;
        }
        handleLanguagechange() {
        }
        contentEl() {
            return this.contentEl_ || this.el_;
        }
        id() {
            return this.id_;
        }
        name() {
            return this.name_;
        }
        children() {
            return this.children_;
        }
        getChildById(id) {
            return this.childIndex_[id];
        }
        getChild(name) {
            if (!name) {
                return;
            }
            return this.childNameIndex_[name];
        }
        getDescendant(...names) {
            names = names.reduce((acc, n) => acc.concat(n), []);
            let currentChild = this;
            for (let i = 0; i < names.length; i++) {
                currentChild = currentChild.getChild(names[i]);
                if (!currentChild || !currentChild.getChild) {
                    return;
                }
            }
            return currentChild;
        }
        addChild(child, options = {}, index = this.children_.length) {
            let component;
            let componentName;
            if (typeof child === 'string') {
                componentName = stringCases.toTitleCase(child);
                const componentClassName = options.componentClass || componentName;
                options.name = componentName;
                const ComponentClass = Component.getComponent(componentClassName);
                if (!ComponentClass) {
                    throw new Error(`Component ${ componentClassName } does not exist`);
                }
                if (typeof ComponentClass !== 'function') {
                    return null;
                }
                component = new ComponentClass(this.player_ || this, options);
            } else {
                component = child;
            }
            if (component.parentComponent_) {
                component.parentComponent_.removeChild(component);
            }
            this.children_.splice(index, 0, component);
            component.parentComponent_ = this;
            if (typeof component.id === 'function') {
                this.childIndex_[component.id()] = component;
            }
            componentName = componentName || component.name && stringCases.toTitleCase(component.name());
            if (componentName) {
                this.childNameIndex_[componentName] = component;
                this.childNameIndex_[stringCases.toLowerCase(componentName)] = component;
            }
            if (typeof component.el === 'function' && component.el()) {
                let refNode = null;
                if (this.children_[index + 1]) {
                    if (this.children_[index + 1].el_) {
                        refNode = this.children_[index + 1].el_;
                    } else if (Dom.isEl(this.children_[index + 1])) {
                        refNode = this.children_[index + 1];
                    }
                }
                this.contentEl().insertBefore(component.el(), refNode);
            }
            return component;
        }
        removeChild(component) {
            if (typeof component === 'string') {
                component = this.getChild(component);
            }
            if (!component || !this.children_) {
                return;
            }
            let childFound = false;
            for (let i = this.children_.length - 1; i >= 0; i--) {
                if (this.children_[i] === component) {
                    childFound = true;
                    this.children_.splice(i, 1);
                    break;
                }
            }
            if (!childFound) {
                return;
            }
            component.parentComponent_ = null;
            this.childIndex_[component.id()] = null;
            this.childNameIndex_[stringCases.toTitleCase(component.name())] = null;
            this.childNameIndex_[stringCases.toLowerCase(component.name())] = null;
            const compEl = component.el();
            if (compEl && compEl.parentNode === this.contentEl()) {
                this.contentEl().removeChild(component.el());
            }
        }
        initChildren() {
            const children = this.options_.children;
            if (children) {
                const parentOptions = this.options_;
                const handleAdd = child => {
                    const name = child.name;
                    let opts = child.opts;
                    if (parentOptions[name] !== undefined) {
                        opts = parentOptions[name];
                    }
                    if (opts === false) {
                        return;
                    }
                    if (opts === true) {
                        opts = {};
                    }
                    opts.playerOptions = this.options_.playerOptions;
                    const newChild = this.addChild(name, opts);
                    if (newChild) {
                        this[name] = newChild;
                    }
                };
                let workingChildren;
                const Tech = Component.getComponent('Tech');
                if (Array.isArray(children)) {
                    workingChildren = children;
                } else {
                    workingChildren = Object.keys(children);
                }
                workingChildren.concat(Object.keys(this.options_).filter(function (child) {
                    return !workingChildren.some(function (wchild) {
                        if (typeof wchild === 'string') {
                            return child === wchild;
                        }
                        return child === wchild.name;
                    });
                })).map(child => {
                    let name;
                    let opts;
                    if (typeof child === 'string') {
                        name = child;
                        opts = children[name] || this.options_[name] || {};
                    } else {
                        name = child.name;
                        opts = child;
                    }
                    return {
                        name,
                        opts
                    };
                }).filter(child => {
                    const c = Component.getComponent(child.opts.componentClass || stringCases.toTitleCase(child.name));
                    return c && !Tech.isTech(c);
                }).forEach(handleAdd);
            }
        }
        buildCSSClass() {
            return '';
        }
        ready(fn, sync = false) {
            if (!fn) {
                return;
            }
            if (!this.isReady_) {
                this.readyQueue_ = this.readyQueue_ || [];
                this.readyQueue_.push(fn);
                return;
            }
            if (sync) {
                fn.call(this);
            } else {
                this.setTimeout(fn, 1);
            }
        }
        triggerReady() {
            this.isReady_ = true;
            this.setTimeout(function () {
                const readyQueue = this.readyQueue_;
                this.readyQueue_ = [];
                if (readyQueue && readyQueue.length > 0) {
                    readyQueue.forEach(function (fn) {
                        fn.call(this);
                    }, this);
                }
                this.trigger('ready');
            }, 1);
        }
        $(selector, context) {
            return Dom.$(selector, context || this.contentEl());
        }
        $$(selector, context) {
            return Dom.$$(selector, context || this.contentEl());
        }
        hasClass(classToCheck) {
            return Dom.hasClass(this.el_, classToCheck);
        }
        addClass(classToAdd) {
            Dom.addClass(this.el_, classToAdd);
        }
        removeClass(classToRemove) {
            Dom.removeClass(this.el_, classToRemove);
        }
        toggleClass(classToToggle, predicate) {
            Dom.toggleClass(this.el_, classToToggle, predicate);
        }
        show() {
            this.removeClass('vjs-hidden');
        }
        hide() {
            this.addClass('vjs-hidden');
        }
        lockShowing() {
            this.addClass('vjs-lock-showing');
        }
        unlockShowing() {
            this.removeClass('vjs-lock-showing');
        }
        getAttribute(attribute) {
            return Dom.getAttribute(this.el_, attribute);
        }
        setAttribute(attribute, value) {
            Dom.setAttribute(this.el_, attribute, value);
        }
        removeAttribute(attribute) {
            Dom.removeAttribute(this.el_, attribute);
        }
        width(num, skipListeners) {
            return this.dimension('width', num, skipListeners);
        }
        height(num, skipListeners) {
            return this.dimension('height', num, skipListeners);
        }
        dimensions(width, height) {
            this.width(width, true);
            this.height(height);
        }
        dimension(widthOrHeight, num, skipListeners) {
            if (num !== undefined) {
                if (num === null || num !== num) {
                    num = 0;
                }
                if (('' + num).indexOf('%') !== -1 || ('' + num).indexOf('px') !== -1) {
                    this.el_.style[widthOrHeight] = num;
                } else if (num === 'auto') {
                    this.el_.style[widthOrHeight] = '';
                } else {
                    this.el_.style[widthOrHeight] = num + 'px';
                }
                if (!skipListeners) {
                    this.trigger('componentresize');
                }
                return;
            }
            if (!this.el_) {
                return 0;
            }
            const val = this.el_.style[widthOrHeight];
            const pxIndex = val.indexOf('px');
            if (pxIndex !== -1) {
                return parseInt(val.slice(0, pxIndex), 10);
            }
            return parseInt(this.el_['offset' + stringCases.toTitleCase(widthOrHeight)], 10);
        }
        currentDimension(widthOrHeight) {
            let computedWidthOrHeight = 0;
            if (widthOrHeight !== 'width' && widthOrHeight !== 'height') {
                throw new Error('currentDimension only accepts width or height value');
            }
            computedWidthOrHeight = computedStyle(this.el_, widthOrHeight);
            computedWidthOrHeight = parseFloat(computedWidthOrHeight);
            if (computedWidthOrHeight === 0 || isNaN(computedWidthOrHeight)) {
                const rule = `offset${ stringCases.toTitleCase(widthOrHeight) }`;
                computedWidthOrHeight = this.el_[rule];
            }
            return computedWidthOrHeight;
        }
        currentDimensions() {
            return {
                width: this.currentDimension('width'),
                height: this.currentDimension('height')
            };
        }
        currentWidth() {
            return this.currentDimension('width');
        }
        currentHeight() {
            return this.currentDimension('height');
        }
        focus() {
            this.el_.focus();
        }
        blur() {
            this.el_.blur();
        }
        handleKeyDown(event) {
            if (this.player_) {
                event.stopPropagation();
                this.player_.handleKeyDown(event);
            }
        }
        handleKeyPress(event) {
            this.handleKeyDown(event);
        }
        emitTapEvents() {
            let touchStart = 0;
            let firstTouch = null;
            const tapMovementThreshold = 10;
            const touchTimeThreshold = 200;
            let couldBeTap;
            this.listenTo('touchstart', function (event) {
                if (event.touches.length === 1) {
                    firstTouch = {
                        pageX: event.touches[0].pageX,
                        pageY: event.touches[0].pageY
                    };
                    touchStart = window.performance.now();
                    couldBeTap = true;
                }
            });
            this.listenTo('touchmove', function (event) {
                if (event.touches.length > 1) {
                    couldBeTap = false;
                } else if (firstTouch) {
                    const xdiff = event.touches[0].pageX - firstTouch.pageX;
                    const ydiff = event.touches[0].pageY - firstTouch.pageY;
                    const touchDistance = Math.sqrt(xdiff * xdiff + ydiff * ydiff);
                    if (touchDistance > tapMovementThreshold) {
                        couldBeTap = false;
                    }
                }
            });
            const noTap = function () {
                couldBeTap = false;
            };
            this.listenTo('touchleave', noTap);
            this.listenTo('touchcancel', noTap);
            this.listenTo('touchend', function (event) {
                firstTouch = null;
                if (couldBeTap === true) {
                    const touchTime = window.performance.now() - touchStart;
                    if (touchTime < touchTimeThreshold) {
                        event.preventDefault();
                        this.trigger('tap');
                    }
                }
            });
        }
        enableTouchActivity() {
            if (!this.player() || !this.player().reportUserActivity) {
                return;
            }
            const report = Fn.bind(this.player(), this.player().reportUserActivity);
            let touchHolding;
            this.listenTo('touchstart', function () {
                report();
                this.clearInterval(touchHolding);
                touchHolding = this.setInterval(report, 250);
            });
            const touchEnd = function (event) {
                report();
                this.clearInterval(touchHolding);
            };
            this.listenTo('touchmove', report);
            this.listenTo('touchend', touchEnd);
            this.listenTo('touchcancel', touchEnd);
        }
        setTimeout(fn, timeout) {
            var timeoutId, disposeFn;
            fn = Fn.bind(this, fn);
            this.clearTimersOnDispose_();
            timeoutId = window.setTimeout(() => {
                if (this.setTimeoutIds_.has(timeoutId)) {
                    this.setTimeoutIds_.delete(timeoutId);
                }
                fn();
            }, timeout);
            this.setTimeoutIds_.add(timeoutId);
            return timeoutId;
        }
        clearTimeout(timeoutId) {
            if (this.setTimeoutIds_.has(timeoutId)) {
                this.setTimeoutIds_.delete(timeoutId);
                window.clearTimeout(timeoutId);
            }
            return timeoutId;
        }
        setInterval(fn, interval) {
            fn = Fn.bind(this, fn);
            this.clearTimersOnDispose_();
            const intervalId = window.setInterval(fn, interval);
            this.setIntervalIds_.add(intervalId);
            return intervalId;
        }
        clearInterval(intervalId) {
            if (this.setIntervalIds_.has(intervalId)) {
                this.setIntervalIds_.delete(intervalId);
                window.clearInterval(intervalId);
            }
            return intervalId;
        }
        requestAnimationFrame(fn) {
            if (!this.supportsRaf_) {
                return this.setTimeout(fn, 1000 / 60);
            }
            this.clearTimersOnDispose_();
            var id;
            fn = Fn.bind(this, fn);
            id = window.requestAnimationFrame(() => {
                if (this.rafIds_.has(id)) {
                    this.rafIds_.delete(id);
                }
                fn();
            });
            this.rafIds_.add(id);
            return id;
        }
        requestNamedAnimationFrame(name, fn) {
            if (this.namedRafs_.has(name)) {
                return;
            }
            this.clearTimersOnDispose_();
            fn = Fn.bind(this, fn);
            const id = this.requestAnimationFrame(() => {
                fn();
                if (this.namedRafs_.has(name)) {
                    this.namedRafs_.delete(name);
                }
            });
            this.namedRafs_.set(name, id);
            return name;
        }
        cancelNamedAnimationFrame(name) {
            if (!this.namedRafs_.has(name)) {
                return;
            }
            this.cancelAnimationFrame(this.namedRafs_.get(name));
            this.namedRafs_.delete(name);
        }
        cancelAnimationFrame(id) {
            if (!this.supportsRaf_) {
                return this.clearTimeout(id);
            }
            if (this.rafIds_.has(id)) {
                this.rafIds_.delete(id);
                window.cancelAnimationFrame(id);
            }
            return id;
        }
        clearTimersOnDispose_() {
            if (this.clearingTimersOnDispose_) {
                return;
            }
            this.clearingTimersOnDispose_ = true;
            this.listenToOnce('dispose', () => {
                [
                    [
                        'namedRafs_',
                        'cancelNamedAnimationFrame'
                    ],
                    [
                        'rafIds_',
                        'cancelAnimationFrame'
                    ],
                    [
                        'setTimeoutIds_',
                        'clearTimeout'
                    ],
                    [
                        'setIntervalIds_',
                        'clearInterval'
                    ]
                ].forEach(([idName, cancelName]) => {
                    this[idName].forEach((val, key) => this[cancelName](key));
                });
                this.clearingTimersOnDispose_ = false;
            });
        }
        static registerComponent(name, ComponentToRegister) {
            if (typeof name !== 'string' || !name) {
                throw new Error(`Illegal component name, "${ name }"; must be a non-empty string.`);
            }
            const Tech = Component.getComponent('Tech');
            const isTech = Tech && Tech.isTech(ComponentToRegister);
            const isComp = Component === ComponentToRegister || Component.prototype.isPrototypeOf(ComponentToRegister.prototype);
            if (isTech || !isComp) {
                let reason;
                if (isTech) {
                    reason = 'techs must be registered using Tech.registerTech()';
                } else {
                    reason = 'must be a Component subclass';
                }
                throw new Error(`Illegal component, "${ name }"; ${ reason }.`);
            }
            name = stringCases.toTitleCase(name);
            if (!Component.components_) {
                Component.components_ = {};
            }
            const Player = Component.getComponent('Player');
            if (name === 'Player' && Player && Player.players) {
                const players = Player.players;
                const playerNames = Object.keys(players);
                if (players && playerNames.length > 0 && playerNames.map(pname => players[pname]).every(Boolean)) {
                    throw new Error('Can not register Player component after player has been created.');
                }
            }
            Component.components_[name] = ComponentToRegister;
            Component.components_[stringCases.toLowerCase(name)] = ComponentToRegister;
            return ComponentToRegister;
        }
        static getComponent(name) {
            if (!name || !Component.components_) {
                return;
            }
            return Component.components_[name];
        }
    }
    Component.prototype.supportsRaf_ = typeof window.requestAnimationFrame === 'function' && typeof window.cancelAnimationFrame === 'function';
    Component.registerComponent('Component', Component);
    return Component;
});
define('skylark-videojs/utils/time-ranges',[],function () {
    'use strict';
    function rangeCheck(fnName, index, maxIndex) {
        if (typeof index !== 'number' || index < 0 || index > maxIndex) {
            throw new Error(`Failed to execute '${ fnName }' on 'TimeRanges': The index provided (${ index }) is non-numeric or out of bounds (0-${ maxIndex }).`);
        }
    }
    function getRange(fnName, valueIndex, ranges, rangeIndex) {
        rangeCheck(fnName, rangeIndex, ranges.length - 1);
        return ranges[rangeIndex][valueIndex];
    }
    function createTimeRangesObj(ranges) {
        if (ranges === undefined || ranges.length === 0) {
            return {
                length: 0,
                start() {
                    throw new Error('This TimeRanges object is empty');
                },
                end() {
                    throw new Error('This TimeRanges object is empty');
                }
            };
        }
        return {
            length: ranges.length,
            start: getRange.bind(null, 'start', 0, ranges),
            end: getRange.bind(null, 'end', 1, ranges)
        };
    }
    function createTimeRanges(start, end) {
        if (Array.isArray(start)) {
            return createTimeRangesObj(start);
        } else if (start === undefined || end === undefined) {
            return createTimeRangesObj();
        }
        return createTimeRangesObj([[
                start,
                end
            ]]);
    }
    return {
        createTimeRanges: createTimeRanges,
        createTimeRanges
    };
});
define('skylark-videojs/utils/buffer',['./time-ranges'], function (timeRages) {
    'use strict';
    function bufferedPercent(buffered, duration) {
        let bufferedDuration = 0;
        let start;
        let end;
        if (!duration) {
            return 0;
        }
        if (!buffered || !buffered.length) {
            buffered = timeRages.createTimeRange(0, 0);
        }
        for (let i = 0; i < buffered.length; i++) {
            start = buffered.start(i);
            end = buffered.end(i);
            if (end > duration) {
                end = duration;
            }
            bufferedDuration += end - start;
        }
        return bufferedDuration / duration;
    }
    return { bufferedPercent: bufferedPercent };
});
define('skylark-videojs/media-error',['./utils/obj'], function (obj) {
    'use strict';
    function MediaError(value) {
        if (value instanceof MediaError) {
            return value;
        }
        if (typeof value === 'number') {
            this.code = value;
        } else if (typeof value === 'string') {
            this.message = value;
        } else if (obj.isObject(value)) {
            if (typeof value.code === 'number') {
                this.code = value.code;
            }
            obj.assign(this, value);
        }
        if (!this.message) {
            this.message = MediaError.defaultMessages[this.code] || '';
        }
    }
    MediaError.prototype.code = 0;
    MediaError.prototype.message = '';
    MediaError.prototype.status = null;
    MediaError.errorTypes = [
        'MEDIA_ERR_CUSTOM',
        'MEDIA_ERR_ABORTED',
        'MEDIA_ERR_NETWORK',
        'MEDIA_ERR_DECODE',
        'MEDIA_ERR_SRC_NOT_SUPPORTED',
        'MEDIA_ERR_ENCRYPTED'
    ];
    MediaError.defaultMessages = {
        1: 'You aborted the media playback',
        2: 'A network error caused the media download to fail part-way.',
        3: 'The media playback was aborted due to a corruption problem or because the media used features your browser did not support.',
        4: 'The media could not be loaded, either because the server or network failed or because the format is not supported.',
        5: 'The media is encrypted and we do not have the keys to decrypt it.'
    };
    for (let errNum = 0; errNum < MediaError.errorTypes.length; errNum++) {
        MediaError[MediaError.errorTypes[errNum]] = errNum;
        MediaError.prototype[MediaError.errorTypes[errNum]] = errNum;
    }
    return MediaError;
});
define('skylark-videojs/utils/safeParseTuple',[],function(){
	function safeParseTuple(obj, reviver) {
	    var json
	    var error = null

	    try {
	        json = JSON.parse(obj, reviver)
	    } catch (err) {
	        error = err
	    }

	    return [error, json]
	}

	return 	safeParseTuple;
});


define('skylark-videojs/utils/promise',[],function () {
    'use strict';
    function isPromise(value) {
        return value !== undefined && value !== null && typeof value.then === 'function';
    }
    function silencePromise(value) {
        if (isPromise(value)) {
            value.then(null, e => {
            });
        }
    }
    return {
        isPromise: isPromise,
        silencePromise: silencePromise
    };
});
define('skylark-videojs/tracks/text-track-list-converter',[],function () {
    'use strict';
    const trackToJson_ = function (track) {
        const ret = [
            'kind',
            'label',
            'language',
            'id',
            'inBandMetadataTrackDispatchType',
            'mode',
            'src'
        ].reduce((acc, prop, i) => {
            if (track[prop]) {
                acc[prop] = track[prop];
            }
            return acc;
        }, {
            cues: track.cues && Array.prototype.map.call(track.cues, function (cue) {
                return {
                    startTime: cue.startTime,
                    endTime: cue.endTime,
                    text: cue.text,
                    id: cue.id
                };
            })
        });
        return ret;
    };
    const textTracksToJson = function (tech) {
        const trackEls = tech.$$('track');
        const trackObjs = Array.prototype.map.call(trackEls, t => t.track);
        const tracks = Array.prototype.map.call(trackEls, function (trackEl) {
            const json = trackToJson_(trackEl.track);
            if (trackEl.src) {
                json.src = trackEl.src;
            }
            return json;
        });
        return tracks.concat(Array.prototype.filter.call(tech.textTracks(), function (track) {
            return trackObjs.indexOf(track) === -1;
        }).map(trackToJson_));
    };
    const jsonToTextTracks = function (json, tech) {
        json.forEach(function (track) {
            const addedTrack = tech.addRemoteTextTrack(track).track;
            if (!track.src && track.cues) {
                track.cues.forEach(cue => addedTrack.addCue(cue));
            }
        });
        return tech.textTracks();
    };
    return {
        textTracksToJson,
        jsonToTextTracks,
        trackToJson_
    };
});
define('skylark-videojs/utils/keycode',[],function(){
  // Source: http://jsfiddle.net/vWx8V/
  // http://stackoverflow.com/questions/5603195/full-list-of-javascript-keycodes

  /**
   * Conenience method returns corresponding value for given keyName or keyCode.
   *
   * @param {Mixed} keyCode {Number} or keyName {String}
   * @return {Mixed}
   * @api public
   */

  function keyCode(searchInput) {
    // Keyboard Events
    if (searchInput && 'object' === typeof searchInput) {
      var hasKeyCode = searchInput.which || searchInput.keyCode || searchInput.charCode
      if (hasKeyCode) searchInput = hasKeyCode
    }

    // Numbers
    if ('number' === typeof searchInput) return names[searchInput]

    // Everything else (cast to string)
    var search = String(searchInput)

    // check codes
    var foundNamedKey = codes[search.toLowerCase()]
    if (foundNamedKey) return foundNamedKey

    // check aliases
    var foundNamedKey = aliases[search.toLowerCase()]
    if (foundNamedKey) return foundNamedKey

    // weird character?
    if (search.length === 1) return search.charCodeAt(0)

    return undefined
  }

  /**
   * Compares a keyboard event with a given keyCode or keyName.
   *
   * @param {Event} event Keyboard event that should be tested
   * @param {Mixed} keyCode {Number} or keyName {String}
   * @return {Boolean}
   * @api public
   */
  keyCode.isEventKey = function isEventKey(event, nameOrCode) {
    if (event && 'object' === typeof event) {
      var keyCode = event.which || event.keyCode || event.charCode
      if (keyCode === null || keyCode === undefined) { return false; }
      if (typeof nameOrCode === 'string') {
        // check codes
        var foundNamedKey = codes[nameOrCode.toLowerCase()]
        if (foundNamedKey) { return foundNamedKey === keyCode; }
      
        // check aliases
        var foundNamedKey = aliases[nameOrCode.toLowerCase()]
        if (foundNamedKey) { return foundNamedKey === keyCode; }
      } else if (typeof nameOrCode === 'number') {
        return nameOrCode === keyCode;
      }
      return false;
    }
  }

  var exports = keyCode;

  /**
   * Get by name
   *
   *   exports.code['enter'] // => 13
   */

  var codes = exports.code = exports.codes = {
    'backspace': 8,
    'tab': 9,
    'enter': 13,
    'shift': 16,
    'ctrl': 17,
    'alt': 18,
    'pause/break': 19,
    'caps lock': 20,
    'esc': 27,
    'space': 32,
    'page up': 33,
    'page down': 34,
    'end': 35,
    'home': 36,
    'left': 37,
    'up': 38,
    'right': 39,
    'down': 40,
    'insert': 45,
    'delete': 46,
    'command': 91,
    'left command': 91,
    'right command': 93,
    'numpad *': 106,
    'numpad +': 107,
    'numpad -': 109,
    'numpad .': 110,
    'numpad /': 111,
    'num lock': 144,
    'scroll lock': 145,
    'my computer': 182,
    'my calculator': 183,
    ';': 186,
    '=': 187,
    ',': 188,
    '-': 189,
    '.': 190,
    '/': 191,
    '`': 192,
    '[': 219,
    '\\': 220,
    ']': 221,
    "'": 222
  }

  // Helper aliases

  var aliases = exports.aliases = {
    'windows': 91,
    '⇧': 16,
    '⌥': 18,
    '⌃': 17,
    '⌘': 91,
    'ctl': 17,
    'control': 17,
    'option': 18,
    'pause': 19,
    'break': 19,
    'caps': 20,
    'return': 13,
    'escape': 27,
    'spc': 32,
    'spacebar': 32,
    'pgup': 33,
    'pgdn': 34,
    'ins': 45,
    'del': 46,
    'cmd': 91
  }

  /*!
   * Programatically add the following
   */

  // lower case chars
  for (i = 97; i < 123; i++) codes[String.fromCharCode(i)] = i - 32

  // numbers
  for (var i = 48; i < 58; i++) codes[i - 48] = i

  // function keys
  for (i = 1; i < 13; i++) codes['f'+i] = i + 111

  // numpad keys
  for (i = 0; i < 10; i++) codes['numpad '+i] = i + 96

  /**
   * Get by code
   *
   *   exports.name[13] // => 'Enter'
   */

  var names = exports.names = exports.title = {} // title for backward compat

  // Create reverse mapping
  for (i in codes) names[codes[i]] = i

  // Add aliases
  for (var alias in aliases) {
    codes[alias] = aliases[alias]
  }

  return exports;

});
define('skylark-videojs/modal-dialog',[
    'skylark-langx-globals/document',
    './utils/dom',
    './component',
    './utils/keycode'
], function (document,Dom, Component, keycode) {
    'use strict';
    const MODAL_CLASS_NAME = 'vjs-modal-dialog';
    class ModalDialog extends Component {
        constructor(player, options) {
            super(player, options);
            this.opened_ = this.hasBeenOpened_ = this.hasBeenFilled_ = false;
            this.closeable(!this.options_.uncloseable);
            this.content(this.options_.content);
            this.contentEl_ = Dom.createEl('div', { className: `${ MODAL_CLASS_NAME }-content` }, { role: 'document' });
            this.descEl_ = Dom.createEl('p', {
                className: `${ MODAL_CLASS_NAME }-description vjs-control-text`,
                id: this.el().getAttribute('aria-describedby')
            });
            Dom.textContent(this.descEl_, this.description());
            this.el_.appendChild(this.descEl_);
            this.el_.appendChild(this.contentEl_);
        }
        createEl() {
            return super.createEl('div', {
                className: this.buildCSSClass(),
                tabIndex: -1
            }, {
                'aria-describedby': `${ this.id() }_description`,
                'aria-hidden': 'true',
                'aria-label': this.label(),
                'role': 'dialog'
            });
        }
        dispose() {
            this.contentEl_ = null;
            this.descEl_ = null;
            this.previouslyActiveEl_ = null;
            super.dispose();
        }
        buildCSSClass() {
            return `${ MODAL_CLASS_NAME } vjs-hidden ${ super.buildCSSClass() }`;
        }
        label() {
            return this.localize(this.options_.label || 'Modal Window');
        }
        description() {
            let desc = this.options_.description || this.localize('This is a modal window.');
            if (this.closeable()) {
                desc += ' ' + this.localize('This modal can be closed by pressing the Escape key or activating the close button.');
            }
            return desc;
        }
        open() {
            if (!this.opened_) {
                const player = this.player();
                this.trigger('beforemodalopen');
                this.opened_ = true;
                if (this.options_.fillAlways || !this.hasBeenOpened_ && !this.hasBeenFilled_) {
                    this.fill();
                }
                this.wasPlaying_ = !player.paused();
                if (this.options_.pauseOnOpen && this.wasPlaying_) {
                    player.pause();
                }
                this.listenTo('keydown', this.handleKeyDown);
                this.hadControls_ = player.controls();
                player.controls(false);
                this.show();
                this.conditionalFocus_();
                this.el().setAttribute('aria-hidden', 'false');
                this.trigger('modalopen');
                this.hasBeenOpened_ = true;
            }
        }
        opened(value) {
            if (typeof value === 'boolean') {
                this[value ? 'open' : 'close']();
            }
            return this.opened_;
        }
        close() {
            if (!this.opened_) {
                return;
            }
            const player = this.player();
            this.trigger('beforemodalclose');
            this.opened_ = false;
            if (this.wasPlaying_ && this.options_.pauseOnOpen) {
                player.play();
            }
            this.unlistenTo('keydown', this.handleKeyDown);
            if (this.hadControls_) {
                player.controls(true);
            }
            this.hide();
            this.el().setAttribute('aria-hidden', 'true');
            this.trigger('modalclose');
            this.conditionalBlur_();
            if (this.options_.temporary) {
                this.dispose();
            }
        }
        closeable(value) {
            if (typeof value === 'boolean') {
                const closeable = this.closeable_ = !!value;
                let close = this.getChild('closeButton');
                if (closeable && !close) {
                    const temp = this.contentEl_;
                    this.contentEl_ = this.el_;
                    close = this.addChild('closeButton', { controlText: 'Close Modal Dialog' });
                    this.contentEl_ = temp;
                    this.listenTo(close, 'close', this.close);
                }
                if (!closeable && close) {
                    this.unlistenTo(close, 'close', this.close);
                    this.removeChild(close);
                    close.dispose();
                }
            }
            return this.closeable_;
        }
        fill() {
            this.fillWith(this.content());
        }
        fillWith(content) {
            const contentEl = this.contentEl();
            const parentEl = contentEl.parentNode;
            const nextSiblingEl = contentEl.nextSibling;
            this.trigger('beforemodalfill');
            this.hasBeenFilled_ = true;
            parentEl.removeChild(contentEl);
            this.empty();
            Dom.insertContent(contentEl, content);
            this.trigger('modalfill');
            if (nextSiblingEl) {
                parentEl.insertBefore(contentEl, nextSiblingEl);
            } else {
                parentEl.appendChild(contentEl);
            }
            const closeButton = this.getChild('closeButton');
            if (closeButton) {
                parentEl.appendChild(closeButton.el_);
            }
        }
        empty() {
            this.trigger('beforemodalempty');
            Dom.emptyEl(this.contentEl());
            this.trigger('modalempty');
        }
        content(value) {
            if (typeof value !== 'undefined') {
                this.content_ = value;
            }
            return this.content_;
        }
        conditionalFocus_() {
            const activeEl = document.activeElement;
            const playerEl = this.player_.el_;
            this.previouslyActiveEl_ = null;
            if (playerEl.contains(activeEl) || playerEl === activeEl) {
                this.previouslyActiveEl_ = activeEl;
                this.focus();
            }
        }
        conditionalBlur_() {
            if (this.previouslyActiveEl_) {
                this.previouslyActiveEl_.focus();
                this.previouslyActiveEl_ = null;
            }
        }
        handleKeyDown(event) {
            event.stopPropagation();
            if (keycode.isEventKey(event, 'Escape') && this.closeable()) {
                event.preventDefault();
                this.close();
                return;
            }
            if (!keycode.isEventKey(event, 'Tab')) {
                return;
            }
            const focusableEls = this.focusableEls_();
            const activeEl = this.el_.querySelector(':focus');
            let focusIndex;
            for (let i = 0; i < focusableEls.length; i++) {
                if (activeEl === focusableEls[i]) {
                    focusIndex = i;
                    break;
                }
            }
            if (document.activeElement === this.el_) {
                focusIndex = 0;
            }
            if (event.shiftKey && focusIndex === 0) {
                focusableEls[focusableEls.length - 1].focus();
                event.preventDefault();
            } else if (!event.shiftKey && focusIndex === focusableEls.length - 1) {
                focusableEls[0].focus();
                event.preventDefault();
            }
        }
        focusableEls_() {
            const allChildren = this.el_.querySelectorAll('*');
            return Array.prototype.filter.call(allChildren, child => {
                return (child instanceof window.HTMLAnchorElement || child instanceof window.HTMLAreaElement) && child.hasAttribute('href') || (child instanceof window.HTMLInputElement || child instanceof window.HTMLSelectElement || child instanceof window.HTMLTextAreaElement || child instanceof window.HTMLButtonElement) && !child.hasAttribute('disabled') || (child instanceof window.HTMLIFrameElement || child instanceof window.HTMLObjectElement || child instanceof window.HTMLEmbedElement) || child.hasAttribute('tabindex') && child.getAttribute('tabindex') !== -1 || child.hasAttribute('contenteditable');
            });
        }
    }
    ModalDialog.prototype.options_ = {
        pauseOnOpen: true,
        temporary: true
    };
    Component.registerComponent('ModalDialog', ModalDialog);
    return ModalDialog;
});
define('skylark-videojs/tracks/track-list',[
    '../event-target',
    '../mixins/evented'
], function (EventTarget, evented) {
    'use strict';
    class TrackList extends EventTarget {
        constructor(tracks = []) {
            super();
            this.tracks_ = [];
            Object.defineProperty(this, 'length', {
                get() {
                    return this.tracks_.length;
                }
            });
            for (let i = 0; i < tracks.length; i++) {
                this.addTrack(tracks[i]);
            }
        }
        addTrack(track) {
            const index = this.tracks_.length;
            if (!('' + index in this)) {
                Object.defineProperty(this, index, {
                    get() {
                        return this.tracks_[index];
                    }
                });
            }
            if (this.tracks_.indexOf(track) === -1) {
                this.tracks_.push(track);
                this.trigger({
                    track,
                    type: 'addtrack',
                    target: this
                });
            }
            track.labelchange_ = () => {
                this.trigger({
                    track,
                    type: 'labelchange',
                    target: this
                });
            };
            if (evented.isEvented(track)) {
                track.addEventListener('labelchange', track.labelchange_);
            }
        }
        removeTrack(rtrack) {
            let track;
            for (let i = 0, l = this.length; i < l; i++) {
                if (this[i] === rtrack) {
                    track = this[i];
                    if (track.off) {
                        track.off();
                    }
                    this.tracks_.splice(i, 1);
                    break;
                }
            }
            if (!track) {
                return;
            }
            this.trigger({
                track,
                type: 'removetrack',
                target: this
            });
        }
        getTrackById(id) {
            let result = null;
            for (let i = 0, l = this.length; i < l; i++) {
                const track = this[i];
                if (track.id === id) {
                    result = track;
                    break;
                }
            }
            return result;
        }
    }
    TrackList.prototype.allowedEvents_ = {
        change: 'change',
        addtrack: 'addtrack',
        removetrack: 'removetrack',
        labelchange: 'labelchange'
    };
    for (const event in TrackList.prototype.allowedEvents_) {
        TrackList.prototype['on' + event] = null;
    }
    return TrackList;
});
define('skylark-videojs/tracks/audio-track-list',[
    './track-list'
], function (TrackList) {
    'use strict';
    const disableOthers = function (list, track) {
        for (let i = 0; i < list.length; i++) {
            if (!Object.keys(list[i]).length || track.id === list[i].id) {
                continue;
            }
            list[i].enabled = false;
        }
    };
    class AudioTrackList extends TrackList {
        constructor(tracks = []) {
            for (let i = tracks.length - 1; i >= 0; i--) {
                if (tracks[i].enabled) {
                    disableOthers(tracks, tracks[i]);
                    break;
                }
            }
            super(tracks);
            this.changing_ = false;
        }
        addTrack(track) {
            if (track.enabled) {
                disableOthers(this, track);
            }
            super.addTrack(track);
            if (!track.addEventListener) {
                return;
            }
            track.enabledChange_ = () => {
                if (this.changing_) {
                    return;
                }
                this.changing_ = true;
                disableOthers(this, track);
                this.changing_ = false;
                this.trigger('change');
            };
            track.addEventListener('enabledchange', track.enabledChange_);
        }
        removeTrack(rtrack) {
            super.removeTrack(rtrack);
            if (rtrack.removeEventListener && rtrack.enabledChange_) {
                rtrack.removeEventListener('enabledchange', rtrack.enabledChange_);
                rtrack.enabledChange_ = null;
            }
        }
    }
    return AudioTrackList;
});
define('skylark-videojs/tracks/video-track-list',['./track-list'], function (TrackList) {
    'use strict';
    const disableOthers = function (list, track) {
        for (let i = 0; i < list.length; i++) {
            if (!Object.keys(list[i]).length || track.id === list[i].id) {
                continue;
            }
            list[i].selected = false;
        }
    };
    class VideoTrackList extends TrackList {
        constructor(tracks = []) {
            for (let i = tracks.length - 1; i >= 0; i--) {
                if (tracks[i].selected) {
                    disableOthers(tracks, tracks[i]);
                    break;
                }
            }
            super(tracks);
            this.changing_ = false;
            Object.defineProperty(this, 'selectedIndex', {
                get() {
                    for (let i = 0; i < this.length; i++) {
                        if (this[i].selected) {
                            return i;
                        }
                    }
                    return -1;
                },
                set() {
                }
            });
        }
        addTrack(track) {
            if (track.selected) {
                disableOthers(this, track);
            }
            super.addTrack(track);
            if (!track.addEventListener) {
                return;
            }
            track.selectedChange_ = () => {
                if (this.changing_) {
                    return;
                }
                this.changing_ = true;
                disableOthers(this, track);
                this.changing_ = false;
                this.trigger('change');
            };
            track.addEventListener('selectedchange', track.selectedChange_);
        }
        removeTrack(rtrack) {
            super.removeTrack(rtrack);
            if (rtrack.removeEventListener && rtrack.selectedChange_) {
                rtrack.removeEventListener('selectedchange', rtrack.selectedChange_);
                rtrack.selectedChange_ = null;
            }
        }
    }
    return VideoTrackList;
});
define('skylark-videojs/tracks/text-track-list',[
    './track-list'
], function (TrackList) {

    'use strict';
    
    class TextTrackList extends TrackList {
        addTrack(track) {
            super.addTrack(track);
            if (!this.queueChange_) {
                this.queueChange_ = () => this.queueTrigger('change');
            }
            if (!this.triggerSelectedlanguagechange) {
                this.triggerSelectedlanguagechange_ = () => this.trigger('selectedlanguagechange');
            }
            track.addEventListener('modechange', this.queueChange_);
            const nonLanguageTextTrackKind = [
                'metadata',
                'chapters'
            ];
            if (nonLanguageTextTrackKind.indexOf(track.kind) === -1) {
                track.addEventListener('modechange', this.triggerSelectedlanguagechange_);
            }
        }
        removeTrack(rtrack) {
            super.removeTrack(rtrack);
            if (rtrack.removeEventListener) {
                if (this.queueChange_) {
                    rtrack.removeEventListener('modechange', this.queueChange_);
                }
                if (this.selectedlanguagechange_) {
                    rtrack.removeEventListener('modechange', this.triggerSelectedlanguagechange_);
                }
            }
        }
    }

    return TextTrackList;
});
define('skylark-videojs/tracks/html-track-element-list',[],function () {
    'use strict';
    class HtmlTrackElementList {
        constructor(trackElements = []) {
            this.trackElements_ = [];
            Object.defineProperty(this, 'length', {
                get() {
                    return this.trackElements_.length;
                }
            });
            for (let i = 0, length = trackElements.length; i < length; i++) {
                this.addTrackElement_(trackElements[i]);
            }
        }
        addTrackElement_(trackElement) {
            const index = this.trackElements_.length;
            if (!('' + index in this)) {
                Object.defineProperty(this, index, {
                    get() {
                        return this.trackElements_[index];
                    }
                });
            }
            if (this.trackElements_.indexOf(trackElement) === -1) {
                this.trackElements_.push(trackElement);
            }
        }
        getTrackElementByTrack_(track) {
            let trackElement_;
            for (let i = 0, length = this.trackElements_.length; i < length; i++) {
                if (track === this.trackElements_[i].track) {
                    trackElement_ = this.trackElements_[i];
                    break;
                }
            }
            return trackElement_;
        }
        removeTrackElement_(trackElement) {
            for (let i = 0, length = this.trackElements_.length; i < length; i++) {
                if (trackElement === this.trackElements_[i]) {
                    if (this.trackElements_[i].track && typeof this.trackElements_[i].track.off === 'function') {
                        this.trackElements_[i].track.off();
                    }
                    if (typeof this.trackElements_[i].off === 'function') {
                        this.trackElements_[i].off();
                    }
                    this.trackElements_.splice(i, 1);
                    break;
                }
            }
        }
    }
    return HtmlTrackElementList;
});
define('skylark-videojs/tracks/text-track-cue-list',[],function () {
    'use strict';
    class TextTrackCueList {
        constructor(cues) {
            TextTrackCueList.prototype.setCues_.call(this, cues);
            Object.defineProperty(this, 'length', {
                get() {
                    return this.length_;
                }
            });
        }
        setCues_(cues) {
            const oldLength = this.length || 0;
            let i = 0;
            const l = cues.length;
            this.cues_ = cues;
            this.length_ = cues.length;
            const defineProp = function (index) {
                if (!('' + index in this)) {
                    Object.defineProperty(this, '' + index, {
                        get() {
                            return this.cues_[index];
                        }
                    });
                }
            };
            if (oldLength < l) {
                i = oldLength;
                for (; i < l; i++) {
                    defineProp.call(this, i);
                }
            }
        }
        getCueById(id) {
            let result = null;
            for (let i = 0, l = this.length; i < l; i++) {
                const cue = this[i];
                if (cue.id === id) {
                    result = cue;
                    break;
                }
            }
            return result;
        }
    }
    return TextTrackCueList;
});
define('skylark-videojs/tracks/track-enums',[],function () {
    'use strict';
    const VideoTrackKind = {
        alternative: 'alternative',
        captions: 'captions',
        main: 'main',
        sign: 'sign',
        subtitles: 'subtitles',
        commentary: 'commentary'
    };
    const AudioTrackKind = {
        'alternative': 'alternative',
        'descriptions': 'descriptions',
        'main': 'main',
        'main-desc': 'main-desc',
        'translation': 'translation',
        'commentary': 'commentary'
    };
    const TextTrackKind = {
        subtitles: 'subtitles',
        captions: 'captions',
        descriptions: 'descriptions',
        chapters: 'chapters',
        metadata: 'metadata'
    };
    const TextTrackMode = {
        disabled: 'disabled',
        hidden: 'hidden',
        showing: 'showing'
    };
    return {
        VideoTrackKind: VideoTrackKind,
        AudioTrackKind: AudioTrackKind,
        TextTrackKind: TextTrackKind,
        TextTrackMode: TextTrackMode
    };
});
define('skylark-videojs/tracks/track',[
    '../utils/guid',
    '../event-target'
], function (Guid, EventTarget) {
    'use strict';
    class Track extends EventTarget {
        constructor(options = {}) {
            super();
            const trackProps = {
                id: options.id || 'vjs_track_' + Guid.newGUID(),
                kind: options.kind || '',
                language: options.language || ''
            };
            let label = options.label || '';
            for (const key in trackProps) {
                Object.defineProperty(this, key, {
                    get() {
                        return trackProps[key];
                    },
                    set() {
                    }
                });
            }
            Object.defineProperty(this, 'label', {
                get() {
                    return label;
                },
                set(newLabel) {
                    if (newLabel !== label) {
                        label = newLabel;
                        this.trigger('labelchange');
                    }
                }
            });
        }
    }
    return Track;
});
define('skylark-videojs/utils/url',[
    'skylark-langx-globals/document'
], function (document) {
    'use strict';
    const parseUrl = function (url) {
        const props = [
            'protocol',
            'hostname',
            'port',
            'pathname',
            'search',
            'hash',
            'host'
        ];
        let a = document.createElement('a');
        a.href = url;
        const addToBody = a.host === '' && a.protocol !== 'file:';
        let div;
        if (addToBody) {
            div = document.createElement('div');
            div.innerHTML = `<a href="${ url }"></a>`;
            a = div.firstChild;
            div.setAttribute('style', 'display:none; position:absolute;');
            document.body.appendChild(div);
        }
        const details = {};
        for (let i = 0; i < props.length; i++) {
            details[props[i]] = a[props[i]];
        }
        if (details.protocol === 'http:') {
            details.host = details.host.replace(/:80$/, '');
        }
        if (details.protocol === 'https:') {
            details.host = details.host.replace(/:443$/, '');
        }
        if (!details.protocol) {
            details.protocol = window.location.protocol;
        }
        if (addToBody) {
            document.body.removeChild(div);
        }
        return details;
    };
    const getAbsoluteURL = function (url) {
        if (!url.match(/^https?:\/\//)) {
            const div = document.createElement('div');
            div.innerHTML = `<a href="${ url }">x</a>`;
            url = div.firstChild.href;
        }
        return url;
    };
    const getFileExtension = function (path) {
        if (typeof path === 'string') {
            const splitPathRe = /^(\/?)([\s\S]*?)((?:\.{1,2}|[^\/]+?)(\.([^\.\/\?]+)))(?:[\/]*|[\?].*)$/;
            const pathParts = splitPathRe.exec(path);
            if (pathParts) {
                return pathParts.pop().toLowerCase();
            }
        }
        return '';
    };
    const isCrossOrigin = function (url, winLoc = window.location) {
        const urlInfo = parseUrl(url);
        const srcProtocol = urlInfo.protocol === ':' ? winLoc.protocol : urlInfo.protocol;
        const crossOrigin = srcProtocol + urlInfo.host !== winLoc.protocol + winLoc.host;
        return crossOrigin;
    };
    return {
        parseUrl: parseUrl,
        getAbsoluteURL: getAbsoluteURL,
        getFileExtension: getFileExtension,
        isCrossOrigin: isCrossOrigin
    };
});
define('skylark-videojs/utils/xhr',[
	"skylark-langx-globals/window",
	"skylark-langx-objects",
	"skylark-langx-types",
	"skylark-net-http/xhr"
],function(window,objects,types,_xhr){

	"use strict";

	/**
	 * @license
	 * slighly modified parse-headers 2.0.2 <https://github.com/kesla/parse-headers/>
	 * Copyright (c) 2014 David Björklund
	 * Available under the MIT license
	 * <https://github.com/kesla/parse-headers/blob/master/LICENCE>
	 */

	var parseHeaders = function(headers) {
	    var result = {};

	    if (!headers) {
	        return result;
	    }

	    headers.trim().split('\n').forEach(function(row) {
	        var index = row.indexOf(':');
	        var key = row.slice(0, index).trim().toLowerCase();
	        var value = row.slice(index + 1).trim();

	        if (typeof(result[key]) === 'undefined') {
	          result[key] = value
	        } else if (Array.isArray(result[key])) {
	          result[key].push(value)
	        } else {
	          result[key] = [ result[key], value ]
	        }
	    });

	    return result;
	};


	createXHR.XMLHttpRequest = window.XMLHttpRequest || noop
	createXHR.XDomainRequest = "withCredentials" in (new createXHR.XMLHttpRequest()) ? createXHR.XMLHttpRequest : window.XDomainRequest

	forEachArray(["get", "put", "post", "patch", "head", "delete"], function(method) {
	    createXHR[method === "delete" ? "del" : method] = function(uri, options, callback) {
	        options = initParams(uri, options, callback)
	        options.method = method.toUpperCase()
	        return _createXHR(options)
	    }
	})

	function forEachArray(array, iterator) {
	    for (var i = 0; i < array.length; i++) {
	        iterator(array[i])
	    }
	}

	function isEmpty(obj){
	    for(var i in obj){
	        if(obj.hasOwnProperty(i)) return false
	    }
	    return true
	}

	function initParams(uri, options, callback) {
	    var params = uri

	    if (types.isFunction(options)) {
	        callback = options
	        if (typeof uri === "string") {
	            params = {uri:uri}
	        }
	    } else {
	        params = objects.mixin({}, options, {uri: uri})
	    }

	    params.callback = callback
	    return params
	}

	function createXHR(uri, options, callback) {
	    options = initParams(uri, options, callback)
	    return _createXHR(options)
	}

	function _createXHR(options) {
	    if(typeof options.callback === "undefined"){
	        throw new Error("callback argument missing")
	    }

	    var called = false
	    var callback = function cbOnce(err, response, body){
	        if(!called){
	            called = true
	            options.callback(err, response, body)
	        }
	    }

	    function readystatechange() {
	        if (xhr.readyState === 4) {
	            setTimeout(loadFunc, 0)
	        }
	    }

	    function getBody() {
	        // Chrome with requestType=blob throws errors arround when even testing access to responseText
	        var body = undefined

	        if (xhr.response) {
	            body = xhr.response
	        } else {
	            body = xhr.responseText || getXml(xhr)
	        }

	        if (isJson) {
	            try {
	                body = JSON.parse(body)
	            } catch (e) {}
	        }

	        return body
	    }

	    function errorFunc(evt) {
	        clearTimeout(timeoutTimer)
	        if(!(evt instanceof Error)){
	            evt = new Error("" + (evt || "Unknown XMLHttpRequest Error") )
	        }
	        evt.statusCode = 0
	        return callback(evt, failureResponse)
	    }

	    // will load the data & process the response in a special response object
	    function loadFunc() {
	        if (aborted) return
	        var status
	        clearTimeout(timeoutTimer)
	        if(options.useXDR && xhr.status===undefined) {
	            //IE8 CORS GET successful response doesn't have a status field, but body is fine
	            status = 200
	        } else {
	            status = (xhr.status === 1223 ? 204 : xhr.status)
	        }
	        var response = failureResponse
	        var err = null

	        if (status !== 0){
	            response = {
	                body: getBody(),
	                statusCode: status,
	                method: method,
	                headers: {},
	                url: uri,
	                rawRequest: xhr
	            }
	            if(xhr.getAllResponseHeaders){ //remember xhr can in fact be XDR for CORS in IE
	                response.headers = parseHeaders(xhr.getAllResponseHeaders())
	            }
	        } else {
	            err = new Error("Internal XMLHttpRequest Error")
	        }
	        return callback(err, response, response.body)
	    }

	    var xhr = options.xhr || null

	    if (!xhr) {
	        if (options.cors || options.useXDR) {
	            xhr = new createXHR.XDomainRequest()
	        }else{
	            xhr = new createXHR.XMLHttpRequest()
	        }
	    }

	    var key
	    var aborted
	    var uri = xhr.url = options.uri || options.url
	    var method = xhr.method = options.method || "GET"
	    var body = options.body || options.data
	    var headers = xhr.headers = options.headers || {}
	    var sync = !!options.sync
	    var isJson = false
	    var timeoutTimer
	    var failureResponse = {
	        body: undefined,
	        headers: {},
	        statusCode: 0,
	        method: method,
	        url: uri,
	        rawRequest: xhr
	    }

	    if ("json" in options && options.json !== false) {
	        isJson = true
	        headers["accept"] || headers["Accept"] || (headers["Accept"] = "application/json") //Don't override existing accept header declared by user
	        if (method !== "GET" && method !== "HEAD") {
	            headers["content-type"] || headers["Content-Type"] || (headers["Content-Type"] = "application/json") //Don't override existing accept header declared by user
	            body = JSON.stringify(options.json === true ? body : options.json)
	        }
	    }

	    xhr.onreadystatechange = readystatechange
	    xhr.onload = loadFunc
	    xhr.onerror = errorFunc
	    // IE9 must have onprogress be set to a unique function.
	    xhr.onprogress = function () {
	        // IE must die
	    }
	    xhr.onabort = function(){
	        aborted = true;
	    }
	    xhr.ontimeout = errorFunc
	    xhr.open(method, uri, !sync, options.username, options.password)
	    //has to be after open
	    if(!sync) {
	        xhr.withCredentials = !!options.withCredentials
	    }
	    // Cannot set timeout with sync request
	    // not setting timeout on the xhr object, because of old webkits etc. not handling that correctly
	    // both npm's request and jquery 1.x use this kind of timeout, so this is being consistent
	    if (!sync && options.timeout > 0 ) {
	        timeoutTimer = setTimeout(function(){
	            if (aborted) return
	            aborted = true//IE9 may still call readystatechange
	            xhr.abort("timeout")
	            var e = new Error("XMLHttpRequest timeout")
	            e.code = "ETIMEDOUT"
	            errorFunc(e)
	        }, options.timeout )
	    }

	    if (xhr.setRequestHeader) {
	        for(key in headers){
	            if(headers.hasOwnProperty(key)){
	                xhr.setRequestHeader(key, headers[key])
	            }
	        }
	    } else if (options.headers && !isEmpty(options.headers)) {
	        throw new Error("Headers cannot be set on an XDomainRequest object")
	    }

	    if ("responseType" in options) {
	        xhr.responseType = options.responseType
	    }

	    if ("beforeSend" in options &&
	        typeof options.beforeSend === "function"
	    ) {
	        options.beforeSend(xhr)
	    }

	    // Microsoft Edge browser sends "undefined" when send is called with undefined value.
	    // XMLHttpRequest spec says to pass null as body to indicate no body
	    // See https://github.com/naugtur/xhr/issues/100.
	    xhr.send(body || null)

	    return xhr


	}

	function getXml(xhr) {
	    // xhr.responseXML will throw Exception "InvalidStateError" or "DOMException"
	    // See https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/responseXML.
	    try {
	        if (xhr.responseType === "document") {
	            return xhr.responseXML
	        }
	        var firefoxBugTakenEffect = xhr.responseXML && xhr.responseXML.documentElement.nodeName === "parsererror"
	        if (xhr.responseType === "" && !firefoxBugTakenEffect) {
	            return xhr.responseXML
	        }
	    } catch (e) {}

	    return null
	}

	function noop() {}

	return createXHR;


});
define('skylark-videojs/tracks/text-track',[
    'skylark-videojs-vtt',
    './text-track-cue-list',
    '../utils/fn',
    './track-enums',
    '../utils/log',
    './track',
    '../utils/url',
    '../utils/xhr',
    '../utils/merge-options'
], function (vtt,TextTrackCueList, Fn, TrackEnums, log, Track, url, XHR, merge) {
    'use strict';
    const parseCues = function (srcContent, track) {
        const parser = new vtt.WebVTT.Parser(window, vtt, vtt.WebVTT.StringDecoder());
        const errors = [];
        parser.oncue = function (cue) {
            track.addCue(cue);
        };
        parser.onparsingerror = function (error) {
            errors.push(error);
        };
        parser.onflush = function () {
            track.trigger({
                type: 'loadeddata',
                target: track
            });
        };
        parser.parse(srcContent);
        if (errors.length > 0) {
            if (window.console && window.console.groupCollapsed) {
                window.console.groupCollapsed(`Text Track parsing errors for ${ track.src }`);
            }
            errors.forEach(error => log.error(error));
            if (window.console && window.console.groupEnd) {
                window.console.groupEnd();
            }
        }
        parser.flush();
    };
    const loadTrack = function (src, track) {
        const opts = { uri: src };
        const crossOrigin = url.isCrossOrigin(src);
        if (crossOrigin) {
            opts.cors = crossOrigin;
        }
        const withCredentials = track.tech_.crossOrigin() === 'use-credentials';
        if (withCredentials) {
            opts.withCredentials = withCredentials;
        }
        XHR(opts, Fn.bind(this, function (err, response, responseBody) {
            if (err) {
                return log.error(err, response);
            }
            track.loaded_ = true;
            if (typeof vtt.WebVTT !== 'function') {
                if (track.tech_) {
                    track.tech_.any([
                        'vttjsloaded',
                        'vttjserror'
                    ], event => {
                        if (event.type === 'vttjserror') {
                            log.error(`vttjs failed to load, stopping trying to process ${ track.src }`);
                            return;
                        }
                        return parseCues(responseBody, track);
                    });
                }
            } else {
                parseCues(responseBody, track);
            }
        }));
    };
    class TextTrack extends Track {
        constructor(options = {}) {
            if (!options.tech) {
                throw new Error('A tech was not provided.');
            }
            const settings = merge(options, {
                kind: TrackEnums.TextTrackKind[options.kind] || 'subtitles',
                language: options.language || options.srclang || ''
            });
            let mode = TrackEnums.TextTrackMode[settings.mode] || 'disabled';
            const default_ = settings.default;
            if (settings.kind === 'metadata' || settings.kind === 'chapters') {
                mode = 'hidden';
            }
            super(settings);
            this.tech_ = settings.tech;
            this.cues_ = [];
            this.activeCues_ = [];
            this.preload_ = this.tech_.preloadTextTracks !== false;
            const cues = new TextTrackCueList(this.cues_);
            const activeCues = new TextTrackCueList(this.activeCues_);
            let changed = false;
            const timeupdateHandler = Fn.bind(this, function () {
                if (!this.tech_.isReady_ || this.tech_.isDisposed()) {
                    return;
                }
                this.activeCues = this.activeCues;
                if (changed) {
                    this.trigger('cuechange');
                    changed = false;
                }
            });
            const disposeHandler = () => {
                this.tech_.off('timeupdate', timeupdateHandler);
            };
            this.tech_.one('dispose', disposeHandler);
            if (mode !== 'disabled') {
                this.tech_.on('timeupdate', timeupdateHandler);
            }
            Object.defineProperties(this, {
                default: {
                    get() {
                        return default_;
                    },
                    set() {
                    }
                },
                mode: {
                    get() {
                        return mode;
                    },
                    set(newMode) {
                        if (!TrackEnums.TextTrackMode[newMode]) {
                            return;
                        }
                        if (mode === newMode) {
                            return;
                        }
                        mode = newMode;
                        if (!this.preload_ && mode !== 'disabled' && this.cues.length === 0) {
                            loadTrack(this.src, this);
                        }
                        this.tech_.off('timeupdate', timeupdateHandler);
                        if (mode !== 'disabled') {
                            this.tech_.on('timeupdate', timeupdateHandler);
                        }
                        this.trigger('modechange');
                    }
                },
                cues: {
                    get() {
                        if (!this.loaded_) {
                            return null;
                        }
                        return cues;
                    },
                    set() {
                    }
                },
                activeCues: {
                    get() {
                        if (!this.loaded_) {
                            return null;
                        }
                        if (this.cues.length === 0) {
                            return activeCues;
                        }
                        const ct = this.tech_.currentTime();
                        const active = [];
                        for (let i = 0, l = this.cues.length; i < l; i++) {
                            const cue = this.cues[i];
                            if (cue.startTime <= ct && cue.endTime >= ct) {
                                active.push(cue);
                            } else if (cue.startTime === cue.endTime && cue.startTime <= ct && cue.startTime + 0.5 >= ct) {
                                active.push(cue);
                            }
                        }
                        changed = false;
                        if (active.length !== this.activeCues_.length) {
                            changed = true;
                        } else {
                            for (let i = 0; i < active.length; i++) {
                                if (this.activeCues_.indexOf(active[i]) === -1) {
                                    changed = true;
                                }
                            }
                        }
                        this.activeCues_ = active;
                        activeCues.setCues_(this.activeCues_);
                        return activeCues;
                    },
                    set() {
                    }
                }
            });
            if (settings.src) {
                this.src = settings.src;
                if (!this.preload_) {
                    this.loaded_ = true;
                }
                if (this.preload_ || default_ || settings.kind !== 'subtitles' && settings.kind !== 'captions') {
                    loadTrack(this.src, this);
                }
            } else {
                this.loaded_ = true;
            }
        }
        addCue(originalCue) {
            let cue = originalCue;
            if (vtt && !(originalCue instanceof vtt.VTTCue)) {
                cue = new vtt.VTTCue(originalCue.startTime, originalCue.endTime, originalCue.text);
                for (const prop in originalCue) {
                    if (!(prop in cue)) {
                        cue[prop] = originalCue[prop];
                    }
                }
                cue.id = originalCue.id;
                cue.originalCue_ = originalCue;
            }
            const tracks = this.tech_.textTracks();
            for (let i = 0; i < tracks.length; i++) {
                if (tracks[i] !== this) {
                    tracks[i].removeCue(cue);
                }
            }
            this.cues_.push(cue);
            this.cues.setCues_(this.cues_);
        }
        removeCue(removeCue) {
            let i = this.cues_.length;
            while (i--) {
                const cue = this.cues_[i];
                if (cue === removeCue || cue.originalCue_ && cue.originalCue_ === removeCue) {
                    this.cues_.splice(i, 1);
                    this.cues.setCues_(this.cues_);
                    break;
                }
            }
        }
    }
    TextTrack.prototype.allowedEvents_ = { cuechange: 'cuechange' };
    return TextTrack;
});
define('skylark-videojs/tracks/audio-track',[
    './track-enums',
    './track',
    '../utils/merge-options'
], function (TrackEnums, Track, merge) {
    'use strict';
    class AudioTrack extends Track {
        constructor(options = {}) {
            const settings = merge(options, { kind: TrackEnums.AudioTrackKind[options.kind] || '' });
            super(settings);
            let enabled = false;
            Object.defineProperty(this, 'enabled', {
                get() {
                    return enabled;
                },
                set(newEnabled) {
                    if (typeof newEnabled !== 'boolean' || newEnabled === enabled) {
                        return;
                    }
                    enabled = newEnabled;
                    this.trigger('enabledchange');
                }
            });
            if (settings.enabled) {
                this.enabled = settings.enabled;
            }
            this.loaded_ = true;
        }
    }
    return AudioTrack;
});
define('skylark-videojs/tracks/video-track',[
    './track-enums',
    './track',
    '../utils/merge-options'
], function (TrackEnums, Track, merge) {
    'use strict';
    class VideoTrack extends Track {
        constructor(options = {}) {
            const settings = merge(options, { kind: TrackEnums.VideoTrackKind[options.kind] || '' });
            super(settings);
            let selected = false;
            Object.defineProperty(this, 'selected', {
                get() {
                    return selected;
                },
                set(newSelected) {
                    if (typeof newSelected !== 'boolean' || newSelected === selected) {
                        return;
                    }
                    selected = newSelected;
                    this.trigger('selectedchange');
                }
            });
            if (settings.selected) {
                this.selected = settings.selected;
            }
        }
    }
    return VideoTrack;
});
define('skylark-videojs/tracks/html-track-element',[
    '../event-target',
    '../tracks/text-track'
], function (EventTarget, TextTrack) {
    'use strict';
    const NONE = 0;
    const LOADING = 1;
    const LOADED = 2;
    const ERROR = 3;
    class HTMLTrackElement extends EventTarget {
        constructor(options = {}) {
            super();
            let readyState;
            const track = new TextTrack(options);
            this.kind = track.kind;
            this.src = track.src;
            this.srclang = track.language;
            this.label = track.label;
            this.default = track.default;
            Object.defineProperties(this, {
                readyState: {
                    get() {
                        return readyState;
                    }
                },
                track: {
                    get() {
                        return track;
                    }
                }
            });
            readyState = NONE;
            track.addEventListener('loadeddata', () => {
                readyState = LOADED;
                this.trigger({
                    type: 'load',
                    target: this
                });
            });
        }
    }
    HTMLTrackElement.prototype.allowedEvents_ = { load: 'load' };
    HTMLTrackElement.NONE = NONE;
    HTMLTrackElement.LOADING = LOADING;
    HTMLTrackElement.LOADED = LOADED;
    HTMLTrackElement.ERROR = ERROR;
    return HTMLTrackElement;
});
define('skylark-videojs/tracks/track-types',[
    './audio-track-list',
    './video-track-list',
    './text-track-list',
    './html-track-element-list',
    './text-track',
    './audio-track',
    './video-track',
    './html-track-element'
], function (AudioTrackList, VideoTrackList, TextTrackList, HtmlTrackElementList, TextTrack, AudioTrack, VideoTrack, HTMLTrackElement) {
    'use strict';
    const NORMAL = {
        audio: {
            ListClass: AudioTrackList,
            TrackClass: AudioTrack,
            capitalName: 'Audio'
        },
        video: {
            ListClass: VideoTrackList,
            TrackClass: VideoTrack,
            capitalName: 'Video'
        },
        text: {
            ListClass: TextTrackList,
            TrackClass: TextTrack,
            capitalName: 'Text'
        }
    };
    Object.keys(NORMAL).forEach(function (type) {
        NORMAL[type].getterName = `${ type }Tracks`;
        NORMAL[type].privateName = `${ type }Tracks_`;
    });
    const REMOTE = {
        remoteText: {
            ListClass: TextTrackList,
            TrackClass: TextTrack,
            capitalName: 'RemoteText',
            getterName: 'remoteTextTracks',
            privateName: 'remoteTextTracks_'
        },
        remoteTextEl: {
            ListClass: HtmlTrackElementList,
            TrackClass: HTMLTrackElement,
            capitalName: 'RemoteTextTrackEls',
            getterName: 'remoteTextTrackEls',
            privateName: 'remoteTextTrackEls_'
        }
    };
    const ALL = Object.assign({}, NORMAL, REMOTE);
    REMOTE.names = Object.keys(REMOTE);
    NORMAL.names = Object.keys(NORMAL);
    ALL.names = [].concat(REMOTE.names).concat(NORMAL.names);
    return {
        NORMAL,
        REMOTE,
        ALL
    };
});
define('skylark-videojs/tech/tech',[
    'skylark-langx-globals/window',
    'skylark-langx-globals/document',
    '../component',
    '../utils/merge-options',
    '../utils/fn',
    '../utils/log',
    '../utils/time-ranges',
    '../utils/buffer',
    '../media-error',
    '../utils/obj',
    '../tracks/track-types',
    '../utils/string-cases',
    'skylark-videojs-vtt'
], function (window, document, Component, mergeOptions, Fn, log, timeRages, buffer, MediaError, obj, TRACK_TYPES, stringCases, vtt) {
    'use strict';
    function createTrackHelper(self, kind, label, language, options = {}) {
        const tracks = self.textTracks();
        options.kind = kind;
        if (label) {
            options.label = label;
        }
        if (language) {
            options.language = language;
        }
        options.tech = self;
        const track = new TRACK_TYPES.ALL.text.TrackClass(options);
        tracks.addTrack(track);
        return track;
    }
    class Tech extends Component {
        constructor(options = {}, ready = function () {
        }) {
            options.reportTouchActivity = false;
            super(null, options, ready);
            this.hasStarted_ = false;
            this.listenTo('playing', function () {
                this.hasStarted_ = true;
            });
            this.listenTo('loadstart', function () {
                this.hasStarted_ = false;
            });
            TRACK_TYPES.ALL.names.forEach(name => {
                const props = TRACK_TYPES.ALL[name];
                if (options && options[props.getterName]) {
                    this[props.privateName] = options[props.getterName];
                }
            });
            if (!this.featuresProgressEvents) {
                this.manualProgressOn();
            }
            if (!this.featuresTimeupdateEvents) {
                this.manualTimeUpdatesOn();
            }
            [
                'Text',
                'Audio',
                'Video'
            ].forEach(track => {
                if (options[`native${ track }Tracks`] === false) {
                    this[`featuresNative${ track }Tracks`] = false;
                }
            });
            if (options.nativeCaptions === false || options.nativeTextTracks === false) {
                this.featuresNativeTextTracks = false;
            } else if (options.nativeCaptions === true || options.nativeTextTracks === true) {
                this.featuresNativeTextTracks = true;
            }
            if (!this.featuresNativeTextTracks) {
                this.emulateTextTracks();
            }
            this.preloadTextTracks = options.preloadTextTracks !== false;
            this.autoRemoteTextTracks_ = new TRACK_TYPES.ALL.text.ListClass();
            this.initTrackListeners();
            if (!options.nativeControlsForTouch) {
                this.emitTapEvents();
            }
            if (this.constructor) {
                this.name_ = this.constructor.name || 'Unknown Tech';
            }
        }
        triggerSourceset(src) {
            if (!this.isReady_) {
                this.listenToOnce('ready', () => this.setTimeout(() => this.triggerSourceset(src), 1));
            }
            this.trigger({
                src,
                type: 'sourceset'
            });
        }
        manualProgressOn() {
            this.listenTo('durationchange', this.listenToDurationChange);
            this.manualProgress = true;
            this.listenToOnce('ready', this.trackProgress);
        }
        manualProgressOff() {
            this.manualProgress = false;
            this.stopTrackingProgress();
            this.unlistenTo('durationchange', this.listenToDurationChange);
        }
        trackProgress(event) {
            this.stopTrackingProgress();
            this.progressInterval = this.setInterval(Fn.bind(this, function () {
                const numBufferedPercent = this.undefined();
                if (this.bufferedPercent_ !== numBufferedPercent) {
                    this.trigger('progress');
                }
                this.bufferedPercent_ = numBufferedPercent;
                if (numBufferedPercent === 1) {
                    this.stopTrackingProgress();
                }
            }), 500);
        }
        onDurationChange(event) {
            this.duration_ = this.duration();
        }
        buffered() {
            return timeRages.createTimeRange(0, 0);
        }
        bufferedPercent() {
            return buffer.bufferedPercent(this.buffered(), this.duration_);
        }
        stopTrackingProgress() {
            this.clearInterval(this.progressInterval);
        }
        manualTimeUpdatesOn() {
            this.manualTimeUpdates = true;
            this.listenTo('play', this.trackCurrentTime);
            this.listenTo('pause', this.stopTrackingCurrentTime);
        }
        manualTimeUpdatesOff() {
            this.manualTimeUpdates = false;
            this.stopTrackingCurrentTime();
            this.unlistenTo('play', this.trackCurrentTime);
            this.unlistenTo('pause', this.stopTrackingCurrentTime);
        }
        trackCurrentTime() {
            if (this.currentTimeInterval) {
                this.stopTrackingCurrentTime();
            }
            this.currentTimeInterval = this.setInterval(function () {
                this.trigger({
                    type: 'timeupdate',
                    target: this,
                    manuallyTriggered: true
                });
            }, 250);
        }
        stopTrackingCurrentTime() {
            this.clearInterval(this.currentTimeInterval);
            this.trigger({
                type: 'timeupdate',
                target: this,
                manuallyTriggered: true
            });
        }
        dispose() {
            this.clearTracks(TRACK_TYPES.NORMAL.names);
            if (this.manualProgress) {
                this.manualProgressOff();
            }
            if (this.manualTimeUpdates) {
                this.manualTimeUpdatesOff();
            }
            super.dispose();
        }
        clearTracks(types) {
            types = [].concat(types);
            types.forEach(type => {
                const list = this[`${ type }Tracks`]() || [];
                let i = list.length;
                while (i--) {
                    const track = list[i];
                    if (type === 'text') {
                        this.removeRemoteTextTrack(track);
                    }
                    list.removeTrack(track);
                }
            });
        }
        cleanupAutoTextTracks() {
            const list = this.autoRemoteTextTracks_ || [];
            let i = list.length;
            while (i--) {
                const track = list[i];
                this.removeRemoteTextTrack(track);
            }
        }
        reset() {
        }
        crossOrigin() {
        }
        setCrossOrigin() {
        }
        error(err) {
            if (err !== undefined) {
                this.error_ = new MediaError(err);
                this.trigger('error');
            }
            return this.error_;
        }
        played() {
            if (this.hasStarted_) {
                return timeRages.createTimeRange(0, 0);
            }
            return timeRages.createTimeRange();
        }
        play() {
        }
        setScrubbing() {
        }
        scrubbing() {
        }
        setCurrentTime() {
            if (this.manualTimeUpdates) {
                this.trigger({
                    type: 'timeupdate',
                    target: this,
                    manuallyTriggered: true
                });
            }
        }
        initTrackListeners() {
            TRACK_TYPES.NORMAL.names.forEach(name => {
                const props = TRACK_TYPES.NORMAL[name];
                const trackListChanges = () => {
                    this.trigger(`${ name }trackchange`);
                };
                const tracks = this[props.getterName]();
                tracks.addEventListener('removetrack', trackListChanges);
                tracks.addEventListener('addtrack', trackListChanges);
                this.listenTo('dispose', () => {
                    tracks.removeEventListener('removetrack', trackListChanges);
                    tracks.removeEventListener('addtrack', trackListChanges);
                });
            });
        }
        addWebVttScript_() {
            if (window.WebVTT) {
                return;
            }
            if (document.body.contains(this.el())) {
                if (!this.options_['vtt.js'] && obj.isPlain(vtt) && Object.keys(vtt).length > 0) {
                    this.trigger('vttjsloaded');
                    return;
                }
                const script = document.createElement('script');
                script.src = this.options_['vtt.js'] || 'https://vjs.zencdn.net/vttjs/0.14.1/vtt.min.js';
                script.onload = () => {
                    this.trigger('vttjsloaded');
                };
                script.onerror = () => {
                    this.trigger('vttjserror');
                };
                this.listenTo('dispose', () => {
                    script.onload = null;
                    script.onerror = null;
                });
                window.WebVTT = true;
                this.el().parentNode.appendChild(script);
            } else {
                this.ready(this.addWebVttScript_);
            }
        }
        emulateTextTracks() {
            const tracks = this.textTracks();
            const remoteTracks = this.remoteTextTracks();
            const handleAddTrack = e => tracks.addTrack(e.track);
            const handleRemoveTrack = e => tracks.removeTrack(e.track);
            remoteTracks.on('addtrack', handleAddTrack);
            remoteTracks.on('removetrack', handleRemoveTrack);
            this.addWebVttScript_();
            const updateDisplay = () => this.trigger('texttrackchange');
            const textTracksChanges = () => {
                updateDisplay();
                for (let i = 0; i < tracks.length; i++) {
                    const track = tracks[i];
                    track.removeEventListener('cuechange', updateDisplay);
                    if (track.mode === 'showing') {
                        track.addEventListener('cuechange', updateDisplay);
                    }
                }
            };
            textTracksChanges();
            tracks.addEventListener('change', textTracksChanges);
            tracks.addEventListener('addtrack', textTracksChanges);
            tracks.addEventListener('removetrack', textTracksChanges);
            this.listenTo('dispose', function () {
                remoteTracks.off('addtrack', handleAddTrack);
                remoteTracks.off('removetrack', handleRemoveTrack);
                tracks.removeEventListener('change', textTracksChanges);
                tracks.removeEventListener('addtrack', textTracksChanges);
                tracks.removeEventListener('removetrack', textTracksChanges);
                for (let i = 0; i < tracks.length; i++) {
                    const track = tracks[i];
                    track.removeEventListener('cuechange', updateDisplay);
                }
            });
        }
        addTextTrack(kind, label, language) {
            if (!kind) {
                throw new Error('TextTrack kind is required but was not provided');
            }
            return createTrackHelper(this, kind, label, language);
        }
        createRemoteTextTrack(options) {
            const track = mergeOptions(options, { tech: this });
            return new TRACK_TYPES.REMOTE.remoteTextEl.TrackClass(track);
        }
        addRemoteTextTrack(options = {}, manualCleanup) {
            const htmlTrackElement = this.createRemoteTextTrack(options);
            if (manualCleanup !== true && manualCleanup !== false) {
                log.warn('Calling addRemoteTextTrack without explicitly setting the "manualCleanup" parameter to `true` is deprecated and default to `false` in future version of video.js');
                manualCleanup = true;
            }
            this.remoteTextTrackEls().addTrackElement_(htmlTrackElement);
            this.remoteTextTracks().addTrack(htmlTrackElement.track);
            if (manualCleanup !== true) {
                this.ready(() => this.autoRemoteTextTracks_.addTrack(htmlTrackElement.track));
            }
            return htmlTrackElement;
        }
        removeRemoteTextTrack(track) {
            const trackElement = this.remoteTextTrackEls().getTrackElementByTrack_(track);
            this.remoteTextTrackEls().removeTrackElement_(trackElement);
            this.remoteTextTracks().removeTrack(track);
            this.autoRemoteTextTracks_.removeTrack(track);
        }
        getVideoPlaybackQuality() {
            return {};
        }
        requestPictureInPicture() {
            const PromiseClass = this.options_.Promise || window.Promise;
            if (PromiseClass) {
                return PromiseClass.reject();
            }
        }
        disablePictureInPicture() {
            return true;
        }
        setDisablePictureInPicture() {
        }
        setPoster() {
        }
        playsinline() {
        }
        setPlaysinline() {
        }
        overrideNativeAudioTracks() {
        }
        overrideNativeVideoTracks() {
        }
        canPlayType() {
            return '';
        }
        static canPlayType() {
            return '';
        }
        static canPlaySource(srcObj, options) {
            return Tech.canPlayType(srcObj.type);
        }
        static isTech(component) {
            return component.prototype instanceof Tech || component instanceof Tech || component === Tech;
        }
        static registerTech(name, tech) {
            if (!Tech.techs_) {
                Tech.techs_ = {};
            }
            if (!Tech.isTech(tech)) {
                throw new Error(`Tech ${ name } must be a Tech`);
            }
            if (!Tech.canPlayType) {
                throw new Error('Techs must have a static canPlayType method on them');
            }
            if (!Tech.canPlaySource) {
                throw new Error('Techs must have a static canPlaySource method on them');
            }
            name = stringCases.toTitleCase(name);
            Tech.techs_[name] = tech;
            Tech.techs_[stringCases.toLowerCase(name)] = tech;
            if (name !== 'Tech') {
                Tech.defaultTechOrder_.push(name);
            }
            return tech;
        }
        static getTech(name) {
            if (!name) {
                return;
            }
            if (Tech.techs_ && Tech.techs_[name]) {
                return Tech.techs_[name];
            }
            name = stringCases.toTitleCase(name);
            if (window && window.videojs && window.videojs[name]) {
                log.warn(`The ${ name } tech was added to the videojs object when it should be registered using videojs.registerTech(name, tech)`);
                return window.videojs[name];
            }
        }
    }
    TRACK_TYPES.ALL.names.forEach(function (name) {
        const props = TRACK_TYPES.ALL[name];
        Tech.prototype[props.getterName] = function () {
            this[props.privateName] = this[props.privateName] || new props.ListClass();
            return this[props.privateName];
        };
    });
    Tech.prototype.featuresVolumeControl = true;
    Tech.prototype.featuresMuteControl = true;
    Tech.prototype.featuresFullscreenResize = false;
    Tech.prototype.featuresPlaybackRate = false;
    Tech.prototype.featuresProgressEvents = false;
    Tech.prototype.featuresSourceset = false;
    Tech.prototype.featuresTimeupdateEvents = false;
    Tech.prototype.featuresNativeTextTracks = false;
    Tech.withSourceHandlers = function (_Tech) {
        _Tech.registerSourceHandler = function (handler, index) {
            let handlers = _Tech.sourceHandlers;
            if (!handlers) {
                handlers = _Tech.sourceHandlers = [];
            }
            if (index === undefined) {
                index = handlers.length;
            }
            handlers.splice(index, 0, handler);
        };
        _Tech.canPlayType = function (type) {
            const handlers = _Tech.sourceHandlers || [];
            let can;
            for (let i = 0; i < handlers.length; i++) {
                can = handlers[i].canPlayType(type);
                if (can) {
                    return can;
                }
            }
            return '';
        };
        _Tech.selectSourceHandler = function (source, options) {
            const handlers = _Tech.sourceHandlers || [];
            let can;
            for (let i = 0; i < handlers.length; i++) {
                can = handlers[i].canHandleSource(source, options);
                if (can) {
                    return handlers[i];
                }
            }
            return null;
        };
        _Tech.canPlaySource = function (srcObj, options) {
            const sh = _Tech.selectSourceHandler(srcObj, options);
            if (sh) {
                return sh.canHandleSource(srcObj, options);
            }
            return '';
        };
        const deferrable = [
            'seekable',
            'seeking',
            'duration'
        ];
        deferrable.forEach(function (fnName) {
            const originalFn = this[fnName];
            if (typeof originalFn !== 'function') {
                return;
            }
            this[fnName] = function () {
                if (this.sourceHandler_ && this.sourceHandler_[fnName]) {
                    return this.sourceHandler_[fnName].apply(this.sourceHandler_, arguments);
                }
                return originalFn.apply(this, arguments);
            };
        }, _Tech.prototype);
        _Tech.prototype.setSource = function (source) {
            let sh = _Tech.selectSourceHandler(source, this.options_);
            if (!sh) {
                if (_Tech.nativeSourceHandler) {
                    sh = _Tech.nativeSourceHandler;
                } else {
                    log.error('No source handler found for the current source.');
                }
            }
            this.disposeSourceHandler();
            this.unlistenTo('dispose', this.disposeSourceHandler);
            if (sh !== _Tech.nativeSourceHandler) {
                this.currentSource_ = source;
            }
            this.sourceHandler_ = sh.handleSource(source, this, this.options_);
            this.listenToOnce('dispose', this.disposeSourceHandler);
        };
        _Tech.prototype.disposeSourceHandler = function () {
            if (this.currentSource_) {
                this.clearTracks([
                    'audio',
                    'video'
                ]);
                this.currentSource_ = null;
            }
            this.cleanupAutoTextTracks();
            if (this.sourceHandler_) {
                if (this.sourceHandler_.dispose) {
                    this.sourceHandler_.dispose();
                }
                this.sourceHandler_ = null;
            }
        };
    };
    Component.registerComponent('Tech', Tech);
    Tech.registerTech('Tech', Tech);
    Tech.defaultTechOrder_ = [];
    return Tech;
});
define('skylark-videojs/tech/middleware',[
    '../utils/obj',
    '../utils/string-cases'
], function (obj, stringCases) {
    'use strict';
    const middlewares = {};
    const middlewareInstances = {};
    const TERMINATOR = {};
    function use(type, middleware) {
        middlewares[type] = middlewares[type] || [];
        middlewares[type].push(middleware);
    }
    function getMiddleware(type) {
        if (type) {
            return middlewares[type];
        }
        return middlewares;
    }
    function setSource(player, src, next) {
        player.setTimeout(() => setSourceHelper(src, middlewares[src.type], next, player), 1);
    }
    function setTech(middleware, tech) {
        middleware.forEach(mw => mw.setTech && mw.setTech(tech));
    }
    function get(middleware, tech, method) {
        return middleware.reduceRight(middlewareIterator(method), tech[method]());
    }
    function set(middleware, tech, method, arg) {
        return tech[method](middleware.reduce(middlewareIterator(method), arg));
    }
    function mediate(middleware, tech, method, arg = null) {
        const callMethod = 'call' + stringCases.toTitleCase(method);
        const middlewareValue = middleware.reduce(middlewareIterator(callMethod), arg);
        const terminated = middlewareValue === TERMINATOR;
        const returnValue = terminated ? null : tech[method](middlewareValue);
        executeRight(middleware, method, returnValue, terminated);
        return returnValue;
    }
    const allowedGetters = {
        buffered: 1,
        currentTime: 1,
        duration: 1,
        muted: 1,
        played: 1,
        paused: 1,
        seekable: 1,
        volume: 1
    };
    const allowedSetters = {
        setCurrentTime: 1,
        setMuted: 1,
        setVolume: 1
    };
    const allowedMediators = {
        play: 1,
        pause: 1
    };
    function middlewareIterator(method) {
        return (value, mw) => {
            if (value === TERMINATOR) {
                return TERMINATOR;
            }
            if (mw[method]) {
                return mw[method](value);
            }
            return value;
        };
    }
    function executeRight(mws, method, value, terminated) {
        for (let i = mws.length - 1; i >= 0; i--) {
            const mw = mws[i];
            if (mw[method]) {
                mw[method](terminated, value);
            }
        }
    }
    function clearCacheForPlayer(player) {
        middlewareInstances[player.id()] = null;
    }
    function getOrCreateFactory(player, mwFactory) {
        const mws = middlewareInstances[player.id()];
        let mw = null;
        if (mws === undefined || mws === null) {
            mw = mwFactory(player);
            middlewareInstances[player.id()] = [[
                    mwFactory,
                    mw
                ]];
            return mw;
        }
        for (let i = 0; i < mws.length; i++) {
            const [mwf, mwi] = mws[i];
            if (mwf !== mwFactory) {
                continue;
            }
            mw = mwi;
        }
        if (mw === null) {
            mw = mwFactory(player);
            mws.push([
                mwFactory,
                mw
            ]);
        }
        return mw;
    }
    function setSourceHelper(src = {}, middleware = [], next, player, acc = [], lastRun = false) {
        const [mwFactory, ...mwrest] = middleware;
        if (typeof mwFactory === 'string') {
            setSourceHelper(src, middlewares[mwFactory], next, player, acc, lastRun);
        } else if (mwFactory) {
            const mw = getOrCreateFactory(player, mwFactory);
            if (!mw.setSource) {
                acc.push(mw);
                return setSourceHelper(src, mwrest, next, player, acc, lastRun);
            }
            mw.setSource(obj.assign({}, src), function (err, _src) {
                if (err) {
                    return setSourceHelper(src, mwrest, next, player, acc, lastRun);
                }
                acc.push(mw);
                setSourceHelper(_src, src.type === _src.type ? mwrest : middlewares[_src.type], next, player, acc, lastRun);
            });
        } else if (mwrest.length) {
            setSourceHelper(src, mwrest, next, player, acc, lastRun);
        } else if (lastRun) {
            next(src, acc);
        } else {
            setSourceHelper(src, middlewares['*'], next, player, acc, true);
        }
    }
    return {
        TERMINATOR: TERMINATOR,
        use: use,
        getMiddleware: getMiddleware,
        setSource: setSource,
        setTech: setTech,
        get: get,
        set: set,
        mediate: mediate,
        allowedGetters: allowedGetters,
        allowedSetters: allowedSetters,
        allowedMediators: allowedMediators,
        clearCacheForPlayer: clearCacheForPlayer
    };
});
define('skylark-videojs/utils/mimetypes',['./url'], function (Url) {
    'use strict';
    const MimetypesKind = {
        opus: 'video/ogg',
        ogv: 'video/ogg',
        mp4: 'video/mp4',
        mov: 'video/mp4',
        m4v: 'video/mp4',
        mkv: 'video/x-matroska',
        m4a: 'audio/mp4',
        mp3: 'audio/mpeg',
        aac: 'audio/aac',
        caf: 'audio/x-caf',
        flac: 'audio/flac',
        oga: 'audio/ogg',
        wav: 'audio/wav',
        m3u8: 'application/x-mpegURL',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        gif: 'image/gif',
        png: 'image/png',
        svg: 'image/svg+xml',
        webp: 'image/webp'
    };
    const getMimetype = function (src = '') {
        const ext = Url.getFileExtension(src);
        const mimetype = MimetypesKind[ext.toLowerCase()];
        return mimetype || '';
    };
    const findMimetype = (player, src) => {
        if (!src) {
            return '';
        }
        if (player.cache_.source.src === src && player.cache_.source.type) {
            return player.cache_.source.type;
        }
        const matchingSources = player.cache_.sources.filter(s => s.src === src);
        if (matchingSources.length) {
            return matchingSources[0].type;
        }
        const sources = player.$$('source');
        for (let i = 0; i < sources.length; i++) {
            const s = sources[i];
            if (s.type && s.src && s.src === src) {
                return s.type;
            }
        }
        return getMimetype(src);
    };
    return {
        MimetypesKind: MimetypesKind,
        getMimetype: getMimetype,
        findMimetype: findMimetype
    };
});
define('skylark-videojs/utils/filter-source',[
    './obj',
    './mimetypes'
], function (obj, mimetypes) {
    'use strict';
    const filterSource = function (src) {
        if (Array.isArray(src)) {
            let newsrc = [];
            src.forEach(function (srcobj) {
                srcobj = filterSource(srcobj);
                if (Array.isArray(srcobj)) {
                    newsrc = newsrc.concat(srcobj);
                } else if (obj.isObject(srcobj)) {
                    newsrc.push(srcobj);
                }
            });
            src = newsrc;
        } else if (typeof src === 'string' && src.trim()) {
            src = [fixSource({ src })];
        } else if (obj.isObject(src) && typeof src.src === 'string' && src.src && src.src.trim()) {
            src = [fixSource(src)];
        } else {
            src = [];
        }
        return src;
    };
    function fixSource(src) {
        if (!src.type) {
            const mimetype = mimetypes.getMimetype(src.src);
            if (mimetype) {
                src.type = mimetype;
            }
        }
        return src;
    }
    return filterSource;
});
define('skylark-videojs/tech/loader',[
    '../component',
    './tech',
    '../utils/string-cases',
    '../utils/merge-options'
], function (Component, Tech, stringCases, mergeOptions) {
    'use strict';
    class MediaLoader extends Component {
        constructor(player, options, ready) {
            const options_ = mergeOptions({ createEl: false }, options);
            super(player, options_, ready);
            if (!options.playerOptions.sources || options.playerOptions.sources.length === 0) {
                for (let i = 0, j = options.playerOptions.techOrder; i < j.length; i++) {
                    const techName = stringCases.toTitleCase(j[i]);
                    let tech = Tech.getTech(techName);
                    if (!techName) {
                        tech = Component.getComponent(techName);
                    }
                    if (tech && tech.isSupported()) {
                        player.loadTech_(techName);
                        break;
                    }
                }
            } else {
                player.src(options.playerOptions.sources);
            }
        }
    }
    Component.registerComponent('MediaLoader', MediaLoader);
    return MediaLoader;
});
define('skylark-videojs/clickable-component',[
    './component',
    './utils/dom',
    './utils/log',
    './utils/obj',
    './utils/keycode'
], function (Component, Dom, log, obj, keycode) {
    'use strict';
    class ClickableComponent extends Component {
        constructor(player, options) {
            super(player, options);
            this.emitTapEvents();
            this.enable();
        }
        createEl(tag = 'div', props = {}, attributes = {}) {
            props = obj.assign({
                innerHTML: '<span aria-hidden="true" class="vjs-icon-placeholder"></span>',
                className: this.buildCSSClass(),
                tabIndex: 0
            }, props);
            if (tag === 'button') {
                log.error(`Creating a ClickableComponent with an HTML element of ${ tag } is not supported; use a Button instead.`);
            }
            attributes = obj.assign({ role: 'button' }, attributes);
            this.tabIndex_ = props.tabIndex;
            const el = super.createEl(tag, props, attributes);
            this.createControlTextEl(el);
            return el;
        }
        dispose() {
            this.controlTextEl_ = null;
            super.dispose();
        }
        createControlTextEl(el) {
            this.controlTextEl_ = Dom.createEl('span', { className: 'vjs-control-text' }, { 'aria-live': 'polite' });
            if (el) {
                el.appendChild(this.controlTextEl_);
            }
            this.controlText(this.controlText_, el);
            return this.controlTextEl_;
        }
        controlText(text, el = this.el()) {
            if (text === undefined) {
                return this.controlText_ || 'Need Text';
            }
            const localizedText = this.localize(text);
            this.controlText_ = text;
            Dom.textContent(this.controlTextEl_, localizedText);
            if (!this.nonIconControl) {
                el.setAttribute('title', localizedText);
            }
        }
        buildCSSClass() {
            return `vjs-control vjs-button ${ super.buildCSSClass() }`;
        }
        enable() {
            if (!this.enabled_) {
                this.enabled_ = true;
                this.removeClass('vjs-disabled');
                this.el_.setAttribute('aria-disabled', 'false');
                if (typeof this.tabIndex_ !== 'undefined') {
                    this.el_.setAttribute('tabIndex', this.tabIndex_);
                }
                this.listenTo([
                    'tap',
                    'click'
                ], this.handleClick);
                this.listenTo('keydown', this.handleKeyDown);
            }
        }
        disable() {
            this.enabled_ = false;
            this.addClass('vjs-disabled');
            this.el_.setAttribute('aria-disabled', 'true');
            if (typeof this.tabIndex_ !== 'undefined') {
                this.el_.removeAttribute('tabIndex');
            }
            this.unlistenTo('mouseover', this.handleMouseOver);
            this.unlistenTo('mouseout', this.handleMouseOut);
            this.unlistenTo([
                'tap',
                'click'
            ], this.handleClick);
            this.unlistenTo('keydown', this.handleKeyDown);
        }
        handleLanguagechange() {
            this.controlText(this.controlText_);
        }
        handleClick(event) {
            if (this.options_.clickHandler) {
                this.options_.clickHandler.call(this, arguments);
            }
        }
        handleKeyDown(event) {
            if (keycode.isEventKey(event, 'Space') || keycode.isEventKey(event, 'Enter')) {
                event.preventDefault();
                event.stopPropagation();
                this.trigger('click');
            } else {
                super.handleKeyDown(event);
            }
        }
    }
    Component.registerComponent('ClickableComponent', ClickableComponent);
    return ClickableComponent;
});
define('skylark-videojs/poster-image',[
    './clickable-component',
    './component',
    './utils/fn',
    './utils/dom',
    './utils/promise',
    './utils/browser'
], function (ClickableComponent, Component, Fn, Dom, promise, browser) {
    'use strict';
    class PosterImage extends ClickableComponent {
        constructor(player, options) {
            super(player, options);
            this.update();
            player.on('posterchange', Fn.bind(this, this.update));
        }
        dispose() {
            this.player().off('posterchange', this.update);
            super.dispose();
        }
        createEl() {
            const el = Dom.createEl('div', {
                className: 'vjs-poster',
                tabIndex: -1
            });
            return el;
        }
        update(event) {
            const url = this.player().poster();
            this.setSrc(url);
            if (url) {
                this.show();
            } else {
                this.hide();
            }
        }
        setSrc(url) {
            let backgroundImage = '';
            if (url) {
                backgroundImage = `url("${ url }")`;
            }
            this.el_.style.backgroundImage = backgroundImage;
        }
        handleClick(event) {
            if (!this.player_.controls()) {
                return;
            }
            const sourceIsEncrypted = this.player_.usingPlugin('eme') && this.player_.eme.sessions && this.player_.eme.sessions.length > 0;
            if (this.player_.tech(true) && !((browser.IE_VERSION || browser.IS_EDGE) && sourceIsEncrypted)) {
                this.player_.tech(true).focus();
            }
            if (this.player_.paused()) {
                promise.silencePromise(this.player_.play());
            } else {
                this.player_.pause();
            }
        }
    }
    Component.registerComponent('PosterImage', PosterImage);
    return PosterImage;
});
define('skylark-videojs/tracks/text-track-display',[
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
define('skylark-videojs/loading-spinner',[
    './component',
    './utils/dom'
], function (Component, dom) {
    'use strict';
    class LoadingSpinner extends Component {
        createEl() {
            const isAudio = this.player_.isAudio();
            const playerType = this.localize(isAudio ? 'Audio Player' : 'Video Player');
            const controlText = dom.createEl('span', {
                className: 'vjs-control-text',
                innerHTML: this.localize('{1} is loading.', [playerType])
            });
            const el = super.createEl('div', {
                className: 'vjs-loading-spinner',
                dir: 'ltr'
            });
            el.appendChild(controlText);
            return el;
        }
    }
    Component.registerComponent('LoadingSpinner', LoadingSpinner);
    return LoadingSpinner;
});
define('skylark-videojs/button',[
    './clickable-component',
    './component',
    './utils/log',
    './utils/obj',
    './utils/keycode'
], function (ClickableComponent, Component, log, obj, keycode) {
    'use strict';
    class Button extends ClickableComponent {
        createEl(tag, props = {}, attributes = {}) {
            tag = 'button';
            props = obj.assign({
                innerHTML: '<span aria-hidden="true" class="vjs-icon-placeholder"></span>',
                className: this.buildCSSClass()
            }, props);
            attributes = obj.assign({ type: 'button' }, attributes);
            const el = Component.prototype.createEl.call(this, tag, props, attributes);
            this.createControlTextEl(el);
            return el;
        }
        addChild(child, options = {}) {
            const className = this.constructor.name;
            log.warn(`Adding an actionable (user controllable) child to a Button (${ className }) is not supported; use a ClickableComponent instead.`);
            return Component.prototype.addChild.call(this, child, options);
        }
        enable() {
            super.enable();
            this.el_.removeAttribute('disabled');
        }
        disable() {
            super.disable();
            this.el_.setAttribute('disabled', 'disabled');
        }
        handleKeyDown(event) {
            if (keycode.isEventKey(event, 'Space') || keycode.isEventKey(event, 'Enter')) {
                event.stopPropagation();
                return;
            }
            super.handleKeyDown(event);
        }
    }
    Component.registerComponent('Button', Button);
    return Button;
});
define('skylark-videojs/big-play-button',[
    './button',
    './component',
    './utils/promise',
    './utils/browser'
], function (Button, Component, promise, browser) {
    'use strict';
    class BigPlayButton extends Button {
        constructor(player, options) {
            super(player, options);
            this.mouseused_ = false;
            this.listenTo('mousedown', this.handleMouseDown);
        }
        buildCSSClass() {
            return 'vjs-big-play-button';
        }
        handleClick(event) {
            const playPromise = this.player_.play();
            if (this.mouseused_ && event.clientX && event.clientY) {
                const sourceIsEncrypted = this.player_.usingPlugin('eme') && this.player_.eme.sessions && this.player_.eme.sessions.length > 0;
                promise.silencePromise(playPromise);
                if (this.player_.tech(true) && !((browser.IE_VERSION || browser.IS_EDGE) && sourceIsEncrypted)) {
                    this.player_.tech(true).focus();
                }
                return;
            }
            const cb = this.player_.getChild('controlBar');
            const playToggle = cb && cb.getChild('playToggle');
            if (!playToggle) {
                this.player_.tech(true).focus();
                return;
            }
            const playFocus = () => playToggle.focus();
            if (promise.isPromise(playPromise)) {
                playPromise.then(playFocus, () => {
                });
            } else {
                this.setTimeout(playFocus, 1);
            }
        }
        handleKeyDown(event) {
            this.mouseused_ = false;
            super.handleKeyDown(event);
        }
        handleMouseDown(event) {
            this.mouseused_ = true;
        }
    }
    BigPlayButton.prototype.controlText_ = 'Play Video';
    Component.registerComponent('BigPlayButton', BigPlayButton);
    return BigPlayButton;
});
define('skylark-videojs/close-button',[
    './button',
    './component',
    './utils/keycode'
], function (Button, Component, keycode) {
    'use strict';
    class CloseButton extends Button {
        constructor(player, options) {
            super(player, options);
            this.controlText(options && options.controlText || this.localize('Close'));
        }
        buildCSSClass() {
            return `vjs-close-button ${ super.buildCSSClass() }`;
        }
        handleClick(event) {
            this.trigger({
                type: 'close',
                bubbles: false
            });
        }
        handleKeyDown(event) {
            if (keycode.isEventKey(event, 'Esc')) {
                event.preventDefault();
                event.stopPropagation();
                this.trigger('click');
            } else {
                super.handleKeyDown(event);
            }
        }
    }
    Component.registerComponent('CloseButton', CloseButton);
    return CloseButton;
});
define('skylark-videojs/control-bar/play-toggle',[
    '../button',
    '../component'
], function (Button, Component) {
    'use strict';
    class PlayToggle extends Button {
        constructor(player, options = {}) {
            super(player, options);
            options.replay = options.replay === undefined || options.replay;
            this.listenTo(player, 'play', this.handlePlay);
            this.listenTo(player, 'pause', this.handlePause);
            if (options.replay) {
                this.listenTo(player, 'ended', this.handleEnded);
            }
        }
        buildCSSClass() {
            return `vjs-play-control ${ super.buildCSSClass() }`;
        }
        handleClick(event) {
            if (this.player_.paused()) {
                this.player_.play();
            } else {
                this.player_.pause();
            }
        }
        handleSeeked(event) {
            this.removeClass('vjs-ended');
            if (this.player_.paused()) {
                this.handlePause(event);
            } else {
                this.handlePlay(event);
            }
        }
        handlePlay(event) {
            this.removeClass('vjs-ended');
            this.removeClass('vjs-paused');
            this.addClass('vjs-playing');
            this.controlText('Pause');
        }
        handlePause(event) {
            this.removeClass('vjs-playing');
            this.addClass('vjs-paused');
            this.controlText('Play');
        }
        handleEnded(event) {
            this.removeClass('vjs-playing');
            this.addClass('vjs-ended');
            this.controlText('Replay');
            this.listenToOnce(this.player_, 'seeked', this.handleSeeked);
        }
    }
    PlayToggle.prototype.controlText_ = 'Play';
    Component.registerComponent('PlayToggle', PlayToggle);
    return PlayToggle;
});
define('skylark-videojs/utils/format-time',[],function () {
    'use strict';
    const defaultImplementation = function (seconds, guide) {
        seconds = seconds < 0 ? 0 : seconds;
        let s = Math.floor(seconds % 60);
        let m = Math.floor(seconds / 60 % 60);
        let h = Math.floor(seconds / 3600);
        const gm = Math.floor(guide / 60 % 60);
        const gh = Math.floor(guide / 3600);
        if (isNaN(seconds) || seconds === Infinity) {
            h = m = s = '-';
        }
        h = h > 0 || gh > 0 ? h + ':' : '';
        m = ((h || gm >= 10) && m < 10 ? '0' + m : m) + ':';
        s = s < 10 ? '0' + s : s;
        return h + m + s;
    };
    let implementation = defaultImplementation;
    function setFormatTime(customImplementation) {
        implementation = customImplementation;
    }
    function resetFormatTime() {
        implementation = defaultImplementation;
    }
    function formatTime(seconds, guide = seconds) {
        return implementation(seconds, guide);
    }

    formatTime.setFormatTime = setFormatTime;
    formatTime.resetFormatTime = resetFormatTime;

    return   formatTime;
});
define('skylark-videojs/control-bar/time-controls/time-display',[
    'skylark-langx-globals/document',
    '../../component',
    '../../utils/dom',
    '../../utils/format-time',
    '../../utils/log'
], function (document, Component, Dom, formatTime, log) {
    'use strict';
    class TimeDisplay extends Component {
        constructor(player, options) {
            super(player, options);
            this.listenTo(player, [
                'timeupdate',
                'ended'
            ], this.updateContent);
            this.updateTextNode_();
        }
        createEl() {
            const className = this.buildCSSClass();
            const el = super.createEl('div', {
                className: `${ className } vjs-time-control vjs-control`,
                innerHTML: `<span class="vjs-control-text" role="presentation">${ this.localize(this.labelText_) }\u00a0</span>`
            });
            this.contentEl_ = Dom.createEl('span', { className: `${ className }-display` }, {
                'aria-live': 'off',
                'role': 'presentation'
            });
            el.appendChild(this.contentEl_);
            return el;
        }
        dispose() {
            this.contentEl_ = null;
            this.textNode_ = null;
            super.dispose();
        }
        updateTextNode_(time = 0) {
            time = formatTime(time);
            if (this.formattedTime_ === time) {
                return;
            }
            this.formattedTime_ = time;
            this.requestNamedAnimationFrame('TimeDisplay#updateTextNode_', () => {
                if (!this.contentEl_) {
                    return;
                }
                let oldNode = this.textNode_;
                if (oldNode && this.contentEl_.firstChild !== oldNode) {
                    oldNode = null;
                    log.warn('TimeDisplay#updateTextnode_: Prevented replacement of text node element since it was no longer a child of this node. Appending a new node instead.');
                }
                this.textNode_ = document.createTextNode(this.formattedTime_);
                if (!this.textNode_) {
                    return;
                }
                if (oldNode) {
                    this.contentEl_.replaceChild(this.textNode_, oldNode);
                } else {
                    this.contentEl_.appendChild(this.textNode_);
                }
            });
        }
        updateContent(event) {
        }
    }
    TimeDisplay.prototype.labelText_ = 'Time';
    TimeDisplay.prototype.controlText_ = 'Time';
    Component.registerComponent('TimeDisplay', TimeDisplay);
    return TimeDisplay;
});
define('skylark-videojs/control-bar/time-controls/current-time-display',[
    './time-display',
    '../../component'
], function (TimeDisplay, Component) {
    'use strict';
    class CurrentTimeDisplay extends TimeDisplay {
        buildCSSClass() {
            return 'vjs-current-time';
        }
        updateContent(event) {
            let time;
            if (this.player_.ended()) {
                time = this.player_.duration();
            } else {
                time = this.player_.scrubbing() ? this.player_.getCache().currentTime : this.player_.currentTime();
            }
            this.updateTextNode_(time);
        }
    }
    CurrentTimeDisplay.prototype.labelText_ = 'Current Time';
    CurrentTimeDisplay.prototype.controlText_ = 'Current Time';
    Component.registerComponent('CurrentTimeDisplay', CurrentTimeDisplay);
    return CurrentTimeDisplay;
});
define('skylark-videojs/control-bar/time-controls/duration-display',[
    './time-display',
    '../../component'
], function (TimeDisplay, Component) {
    'use strict';
    class DurationDisplay extends TimeDisplay {
        constructor(player, options) {
            super(player, options);
            this.listenTo(player, 'durationchange', this.updateContent);
            this.listenTo(player, 'loadstart', this.updateContent);
            this.listenTo(player, 'loadedmetadata', this.updateContent);
        }
        buildCSSClass() {
            return 'vjs-duration';
        }
        updateContent(event) {
            const duration = this.player_.duration();
            this.updateTextNode_(duration);
        }
    }
    DurationDisplay.prototype.labelText_ = 'Duration';
    DurationDisplay.prototype.controlText_ = 'Duration';
    Component.registerComponent('DurationDisplay', DurationDisplay);
    return DurationDisplay;
});
define('skylark-videojs/control-bar/time-controls/time-divider',[
    '../../component'
], function (Component) {
    'use strict';
    class TimeDivider extends Component {
        createEl() {
            return super.createEl('div', {
                className: 'vjs-time-control vjs-time-divider',
                innerHTML: '<div><span>/</span></div>'
            }, { 'aria-hidden': true });
        }
    }
    Component.registerComponent('TimeDivider', TimeDivider);
    return TimeDivider;
});
define('skylark-videojs/control-bar/time-controls/remaining-time-display',[
    './time-display',
    '../../component',
    '../../utils/dom'
], function (TimeDisplay, Component, Dom) {
    'use strict';
    class RemainingTimeDisplay extends TimeDisplay {
        constructor(player, options) {
            super(player, options);
            this.listenTo(player, 'durationchange', this.updateContent);
        }
        buildCSSClass() {
            return 'vjs-remaining-time';
        }
        createEl() {
            const el = super.createEl();
            el.insertBefore(Dom.createEl('span', {}, { 'aria-hidden': true }, '-'), this.contentEl_);
            return el;
        }
        updateContent(event) {
            if (typeof this.player_.duration() !== 'number') {
                return;
            }
            let time;
            if (this.player_.ended()) {
                time = 0;
            } else if (this.player_.remainingTimeDisplay) {
                time = this.player_.remainingTimeDisplay();
            } else {
                time = this.player_.remainingTime();
            }
            this.updateTextNode_(time);
        }
    }
    RemainingTimeDisplay.prototype.labelText_ = 'Remaining Time';
    RemainingTimeDisplay.prototype.controlText_ = 'Remaining Time';
    Component.registerComponent('RemainingTimeDisplay', RemainingTimeDisplay);
    return RemainingTimeDisplay;
});
define('skylark-videojs/control-bar/live-display',[
    '../component',
    '../utils/dom'
], function (Component, Dom) {
    'use strict';
    class LiveDisplay extends Component {
        constructor(player, options) {
            super(player, options);
            this.updateShowing();
            this.listenTo(this.player(), 'durationchange', this.updateShowing);
        }
        createEl() {
            const el = super.createEl('div', { className: 'vjs-live-control vjs-control' });
            this.contentEl_ = Dom.createEl('div', {
                className: 'vjs-live-display',
                innerHTML: `<span class="vjs-control-text">${ this.localize('Stream Type') }\u00a0</span>${ this.localize('LIVE') }`
            }, { 'aria-live': 'off' });
            el.appendChild(this.contentEl_);
            return el;
        }
        dispose() {
            this.contentEl_ = null;
            super.dispose();
        }
        updateShowing(event) {
            if (this.player().duration() === Infinity) {
                this.show();
            } else {
                this.hide();
            }
        }
    }
    Component.registerComponent('LiveDisplay', LiveDisplay);
    return LiveDisplay;
});
define('skylark-videojs/control-bar/seek-to-live',[
    '../button',
    '../component',
    '../utils/dom'
], function (Button, Component, Dom) {
    'use strict';
    class SeekToLive extends Button {
        constructor(player, options) {
            super(player, options);
            this.updateLiveEdgeStatus();
            if (this.player_.liveTracker) {
                this.listenTo(this.player_.liveTracker, 'liveedgechange', this.updateLiveEdgeStatus);
            }
        }
        createEl() {
            const el = super.createEl('button', { className: 'vjs-seek-to-live-control vjs-control' });
            this.textEl_ = Dom.createEl('span', {
                className: 'vjs-seek-to-live-text',
                innerHTML: this.localize('LIVE')
            }, { 'aria-hidden': 'true' });
            el.appendChild(this.textEl_);
            return el;
        }
        updateLiveEdgeStatus() {
            if (!this.player_.liveTracker || this.player_.liveTracker.atLiveEdge()) {
                this.setAttribute('aria-disabled', true);
                this.addClass('vjs-at-live-edge');
                this.controlText('Seek to live, currently playing live');
            } else {
                this.setAttribute('aria-disabled', false);
                this.removeClass('vjs-at-live-edge');
                this.controlText('Seek to live, currently behind live');
            }
        }
        handleClick() {
            this.player_.liveTracker.seekToLiveEdge();
        }
        dispose() {
            if (this.player_.liveTracker) {
                this.unlistenTo(this.player_.liveTracker, 'liveedgechange', this.updateLiveEdgeStatus);
            }
            this.textEl_ = null;
            super.dispose();
        }
    }
    SeekToLive.prototype.controlText_ = 'Seek to live, currently playing live';
    Component.registerComponent('SeekToLive', SeekToLive);
    return SeekToLive;
});
define('skylark-videojs/utils/clamp',[],function () {
    'use strict';
    const clamp = function (number, min, max) {
        number = Number(number);
        return Math.min(max, Math.max(min, isNaN(number) ? min : number));
    };
    return clamp;
});
define('skylark-videojs/slider/slider',[
    '../component',
    '../utils/dom',
    '../utils/obj',
    '../utils/browser',
    '../utils/clamp',
    '../utils/keycode'
], function (Component, Dom, obj, browser, clamp, keycode) {
    'use strict';
    class Slider extends Component {
        constructor(player, options) {
            super(player, options);
            this.bar = this.getChild(this.options_.barName);
            this.vertical(!!this.options_.vertical);
            this.enable();
        }
        enabled() {
            return this.enabled_;
        }
        enable() {
            if (this.enabled()) {
                return;
            }
            this.listenTo('mousedown', this.handleMouseDown);
            this.listenTo('touchstart', this.handleMouseDown);
            this.listenTo('keydown', this.handleKeyDown);
            this.listenTo('click', this.handleClick);
            this.listenTo(this.player_, 'controlsvisible', this.update);
            if (this.playerEvent) {
                this.listenTo(this.player_, this.playerEvent, this.update);
            }
            this.removeClass('disabled');
            this.setAttribute('tabindex', 0);
            this.enabled_ = true;
        }
        disable() {
            if (!this.enabled()) {
                return;
            }
            const doc = this.bar.el_.ownerDocument;
            this.unlistenTo('mousedown', this.handleMouseDown);
            this.unlistenTo('touchstart', this.handleMouseDown);
            this.unlistenTo('keydown', this.handleKeyDown);
            this.unlistenTo('click', this.handleClick);
            this.unlistenTo(this.player_, 'controlsvisible', this.update);
            this.unlistenTo(doc, 'mousemove', this.handleMouseMove);
            this.unlistenTo(doc, 'mouseup', this.handleMouseUp);
            this.unlistenTo(doc, 'touchmove', this.handleMouseMove);
            this.unlistenTo(doc, 'touchend', this.handleMouseUp);
            this.removeAttribute('tabindex');
            this.addClass('disabled');
            if (this.playerEvent) {
                this.unlistenTo(this.player_, this.playerEvent, this.update);
            }
            this.enabled_ = false;
        }
        createEl(type, props = {}, attributes = {}) {
            props.className = props.className + ' vjs-slider';
            props = obj.assign({ tabIndex: 0 }, props);
            attributes = obj.assign({
                'role': 'slider',
                'aria-valuenow': 0,
                'aria-valuemin': 0,
                'aria-valuemax': 100,
                'tabIndex': 0
            }, attributes);
            return super.createEl(type, props, attributes);
        }
        handleMouseDown(event) {
            const doc = this.bar.el_.ownerDocument;
            if (event.type === 'mousedown') {
                event.preventDefault();
            }
            if (event.type === 'touchstart' && !browser.IS_CHROME) {
                event.preventDefault();
            }
            Dom.blockTextSelection();
            this.addClass('vjs-sliding');
            this.trigger('slideractive');
            this.listenTo(doc, 'mousemove', this.handleMouseMove);
            this.listenTo(doc, 'mouseup', this.handleMouseUp);
            this.listenTo(doc, 'touchmove', this.handleMouseMove);
            this.listenTo(doc, 'touchend', this.handleMouseUp);
            this.handleMouseMove(event);
        }
        handleMouseMove(event) {
        }
        handleMouseUp() {
            const doc = this.bar.el_.ownerDocument;
            Dom.unblockTextSelection();
            this.removeClass('vjs-sliding');
            this.trigger('sliderinactive');
            this.unlistenTo(doc, 'mousemove', this.handleMouseMove);
            this.unlistenTo(doc, 'mouseup', this.handleMouseUp);
            this.unlistenTo(doc, 'touchmove', this.handleMouseMove);
            this.unlistenTo(doc, 'touchend', this.handleMouseUp);
            this.update();
        }
        update() {
            if (!this.el_ || !this.bar) {
                return;
            }
            const progress = this.getProgress();
            if (progress === this.progress_) {
                return progress;
            }
            this.progress_ = progress;
            this.requestNamedAnimationFrame('Slider#update', () => {
                const sizeKey = this.vertical() ? 'height' : 'width';
                this.bar.el().style[sizeKey] = (progress * 100).toFixed(2) + '%';
            });
            return progress;
        }
        getProgress() {
            return Number(clamp(this.getPercent(), 0, 1).toFixed(4));
        }
        calculateDistance(event) {
            const position = Dom.getPointerPosition(this.el_, event);
            if (this.vertical()) {
                return position.y;
            }
            return position.x;
        }
        handleKeyDown(event) {
            if (keycode.isEventKey(event, 'Left') || keycode.isEventKey(event, 'Down')) {
                event.preventDefault();
                event.stopPropagation();
                this.stepBack();
            } else if (keycode.isEventKey(event, 'Right') || keycode.isEventKey(event, 'Up')) {
                event.preventDefault();
                event.stopPropagation();
                this.stepForward();
            } else {
                super.handleKeyDown(event);
            }
        }
        handleClick(event) {
            event.stopPropagation();
            event.preventDefault();
        }
        vertical(bool) {
            if (bool === undefined) {
                return this.vertical_ || false;
            }
            this.vertical_ = !!bool;
            if (this.vertical_) {
                this.addClass('vjs-slider-vertical');
            } else {
                this.addClass('vjs-slider-horizontal');
            }
        }
    }
    Component.registerComponent('Slider', Slider);
    return Slider;
});
define('skylark-videojs/control-bar/progress-control/load-progress-bar',[
    'skylark-langx-globals/document',
    '../../component',
    '../../utils/dom',
    '../../utils/clamp'
], function (document,Component, Dom, clamp) {
    'use strict';
    const percentify = (time, end) => clamp(time / end * 100, 0, 100).toFixed(2) + '%';
    class LoadProgressBar extends Component {
        constructor(player, options) {
            super(player, options);
            this.partEls_ = [];
            this.listenTo(player, 'progress', this.update);
        }
        createEl() {
            const el = super.createEl('div', { className: 'vjs-load-progress' });
            const wrapper = Dom.createEl('span', { className: 'vjs-control-text' });
            const loadedText = Dom.createEl('span', { textContent: this.localize('Loaded') });
            const separator = document.createTextNode(': ');
            this.percentageEl_ = Dom.createEl('span', {
                className: 'vjs-control-text-loaded-percentage',
                textContent: '0%'
            });
            el.appendChild(wrapper);
            wrapper.appendChild(loadedText);
            wrapper.appendChild(separator);
            wrapper.appendChild(this.percentageEl_);
            return el;
        }
        dispose() {
            this.partEls_ = null;
            this.percentageEl_ = null;
            super.dispose();
        }
        update(event) {
            this.requestNamedAnimationFrame('LoadProgressBar#update', () => {
                const liveTracker = this.player_.liveTracker;
                const buffered = this.player_.buffered();
                const duration = liveTracker && liveTracker.isLive() ? liveTracker.seekableEnd() : this.player_.duration();
                const bufferedEnd = this.player_.bufferedEnd();
                const children = this.partEls_;
                const percent = percentify(bufferedEnd, duration);
                if (this.percent_ !== percent) {
                    this.el_.style.width = percent;
                    Dom.textContent(this.percentageEl_, percent);
                    this.percent_ = percent;
                }
                for (let i = 0; i < buffered.length; i++) {
                    const start = buffered.start(i);
                    const end = buffered.end(i);
                    let part = children[i];
                    if (!part) {
                        part = this.el_.appendChild(Dom.createEl());
                        children[i] = part;
                    }
                    if (part.dataset.start === start && part.dataset.end === end) {
                        continue;
                    }
                    part.dataset.start = start;
                    part.dataset.end = end;
                    part.style.left = percentify(start, bufferedEnd);
                    part.style.width = percentify(end - start, bufferedEnd);
                }
                for (let i = children.length; i > buffered.length; i--) {
                    this.el_.removeChild(children[i - 1]);
                }
                children.length = buffered.length;
            });
        }
    }
    Component.registerComponent('LoadProgressBar', LoadProgressBar);
    return LoadProgressBar;
});
define('skylark-videojs/control-bar/progress-control/time-tooltip',[
    '../../component',
    '../../utils/dom',
    '../../utils/format-time',
    '../../utils/fn'
], function (Component, Dom, formatTime, Fn) {
    'use strict';
    class TimeTooltip extends Component {
        constructor(player, options) {
            super(player, options);
            this.update = Fn.throttle(Fn.bind(this, this.update), Fn.UPDATE_REFRESH_INTERVAL);
        }
        createEl() {
            return super.createEl('div', { className: 'vjs-time-tooltip' }, { 'aria-hidden': 'true' });
        }
        update(seekBarRect, seekBarPoint, content) {
            const tooltipRect = Dom.findPosition(this.el_);
            const playerRect = Dom.getBoundingClientRect(this.player_.el());
            const seekBarPointPx = seekBarRect.width * seekBarPoint;
            if (!playerRect || !tooltipRect) {
                return;
            }
            const spaceLeftOfPoint = seekBarRect.left - playerRect.left + seekBarPointPx;
            const spaceRightOfPoint = seekBarRect.width - seekBarPointPx + (playerRect.right - seekBarRect.right);
            let pullTooltipBy = tooltipRect.width / 2;
            if (spaceLeftOfPoint < pullTooltipBy) {
                pullTooltipBy += pullTooltipBy - spaceLeftOfPoint;
            } else if (spaceRightOfPoint < pullTooltipBy) {
                pullTooltipBy = spaceRightOfPoint;
            }
            if (pullTooltipBy < 0) {
                pullTooltipBy = 0;
            } else if (pullTooltipBy > tooltipRect.width) {
                pullTooltipBy = tooltipRect.width;
            }
            pullTooltipBy = Math.round(pullTooltipBy);
            this.el_.style.right = `-${ pullTooltipBy }px`;
            this.write(content);
        }
        write(content) {
            Dom.textContent(this.el_, content);
        }
        updateTime(seekBarRect, seekBarPoint, time, cb) {
            this.requestNamedAnimationFrame('TimeTooltip#updateTime', () => {
                let content;
                const duration = this.player_.duration();
                if (this.player_.liveTracker && this.player_.liveTracker.isLive()) {
                    const liveWindow = this.player_.liveTracker.liveWindow();
                    const secondsBehind = liveWindow - seekBarPoint * liveWindow;
                    content = (secondsBehind < 1 ? '' : '-') + formatTime(secondsBehind, liveWindow);
                } else {
                    content = formatTime(time, duration);
                }
                this.update(seekBarRect, seekBarPoint, content);
                if (cb) {
                    cb();
                }
            });
        }
    }
    Component.registerComponent('TimeTooltip', TimeTooltip);
    return TimeTooltip;
});
define('skylark-videojs/control-bar/progress-control/play-progress-bar',[
    '../../component',
    '../../utils/browser',
    '../../utils/fn',
    './time-tooltip'
], function (Component, browser, Fn) {
    'use strict';
    class PlayProgressBar extends Component {
        constructor(player, options) {
            super(player, options);
            this.update = Fn.throttle(Fn.bind(this, this.update), Fn.UPDATE_REFRESH_INTERVAL);
        }
        createEl() {
            return super.createEl('div', { className: 'vjs-play-progress vjs-slider-bar' }, { 'aria-hidden': 'true' });
        }
        update(seekBarRect, seekBarPoint) {
            const timeTooltip = this.getChild('timeTooltip');
            if (!timeTooltip) {
                return;
            }
            const time = this.player_.scrubbing() ? this.player_.getCache().currentTime : this.player_.currentTime();
            timeTooltip.updateTime(seekBarRect, seekBarPoint, time);
        }
    }
    PlayProgressBar.prototype.options_ = { children: [] };
    if (!browser.IS_IOS && !browser.IS_ANDROID) {
        PlayProgressBar.prototype.options_.children.push('timeTooltip');
    }
    Component.registerComponent('PlayProgressBar', PlayProgressBar);
    return PlayProgressBar;
});
define('skylark-videojs/control-bar/progress-control/mouse-time-display',[
    '../../component',
    '../../utils/fn',
    './time-tooltip'
], function (Component, Fn) {
    'use strict';
    class MouseTimeDisplay extends Component {
        constructor(player, options) {
            super(player, options);
            this.update = Fn.throttle(Fn.bind(this, this.update), Fn.UPDATE_REFRESH_INTERVAL);
        }
        createEl() {
            return super.createEl('div', { className: 'vjs-mouse-display' });
        }
        update(seekBarRect, seekBarPoint) {
            const time = seekBarPoint * this.player_.duration();
            this.getChild('timeTooltip').updateTime(seekBarRect, seekBarPoint, time, () => {
                this.el_.style.left = `${ seekBarRect.width * seekBarPoint }px`;
            });
        }
    }
    MouseTimeDisplay.prototype.options_ = { children: ['timeTooltip'] };
    Component.registerComponent('MouseTimeDisplay', MouseTimeDisplay);
    return MouseTimeDisplay;
});
define('skylark-videojs/control-bar/progress-control/seek-bar',[
    'skylark-langx-globals/document',
    '../../slider/slider',
    '../../component',
    '../../utils/browser',
    '../../utils/dom',
    '../../utils/fn',
    '../../utils/format-time',
    '../../utils/promise',
    '../../utils/keycode',
    './load-progress-bar',
    './play-progress-bar',
    './mouse-time-display'
], function (document,Slider, Component, browser, Dom, Fn, formatTime, promise, keycode) {
    'use strict';
    const STEP_SECONDS = 5;
    const PAGE_KEY_MULTIPLIER = 12;
    class SeekBar extends Slider {
        constructor(player, options) {
            super(player, options);
            this.setEventHandlers_();
        }
        setEventHandlers_() {
            this.update_ = Fn.bind(this, this.update);
            this.update = Fn.throttle(this.update_, Fn.UPDATE_REFRESH_INTERVAL);
            this.listenTo(this.player_, [
                'ended',
                'durationchange',
                'timeupdate'
            ], this.update);
            if (this.player_.liveTracker) {
                this.listenTo(this.player_.liveTracker, 'liveedgechange', this.update);
            }
            this.updateInterval = null;
            this.listenTo(this.player_, ['playing'], this.enableInterval_);
            this.listenTo(this.player_, [
                'ended',
                'pause',
                'waiting'
            ], this.disableInterval_);
            if ('hidden' in document && 'visibilityState' in document) {
                this.listenTo(document, 'visibilitychange', this.toggleVisibility_);
            }
        }
        toggleVisibility_(e) {
            if (document.hidden) {
                this.disableInterval_(e);
            } else {
                this.enableInterval_();
                this.update();
            }
        }
        enableInterval_() {
            if (this.updateInterval) {
                return;
            }
            this.updateInterval = this.setInterval(this.update, Fn.UPDATE_REFRESH_INTERVAL);
        }
        disableInterval_(e) {
            if (this.player_.liveTracker && this.player_.liveTracker.isLive() && e && e.type !== 'ended') {
                return;
            }
            if (!this.updateInterval) {
                return;
            }
            this.clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        createEl() {
            return super.createEl('div', { className: 'vjs-progress-holder' }, { 'aria-label': this.localize('Progress Bar') });
        }
        update(event) {
            const percent = super.update();
            this.requestNamedAnimationFrame('SeekBar#update', () => {
                const currentTime = this.player_.ended() ? this.player_.duration() : this.getCurrentTime_();
                const liveTracker = this.player_.liveTracker;
                let duration = this.player_.duration();
                if (liveTracker && liveTracker.isLive()) {
                    duration = this.player_.liveTracker.liveCurrentTime();
                }
                if (this.percent_ !== percent) {
                    this.el_.setAttribute('aria-valuenow', (percent * 100).toFixed(2));
                    this.percent_ = percent;
                }
                if (this.currentTime_ !== currentTime || this.duration_ !== duration) {
                    this.el_.setAttribute('aria-valuetext', this.localize('progress bar timing: currentTime={1} duration={2}', [
                        formatTime(currentTime, duration),
                        formatTime(duration, duration)
                    ], '{1} of {2}'));
                    this.currentTime_ = currentTime;
                    this.duration_ = duration;
                }
                if (this.bar) {
                    this.bar.update(Dom.getBoundingClientRect(this.el()), this.getProgress());
                }
            });
            return percent;
        }
        getCurrentTime_() {
            return this.player_.scrubbing() ? this.player_.getCache().currentTime : this.player_.currentTime();
        }
        getPercent() {
            const currentTime = this.getCurrentTime_();
            let percent;
            const liveTracker = this.player_.liveTracker;
            if (liveTracker && liveTracker.isLive()) {
                percent = (currentTime - liveTracker.seekableStart()) / liveTracker.liveWindow();
                if (liveTracker.atLiveEdge()) {
                    percent = 1;
                }
            } else {
                percent = currentTime / this.player_.duration();
            }
            return percent;
        }
        handleMouseDown(event) {
            if (!Dom.isSingleLeftClick(event)) {
                return;
            }
            event.stopPropagation();
            this.player_.scrubbing(true);
            this.videoWasPlaying = !this.player_.paused();
            this.player_.pause();
            super.handleMouseDown(event);
        }
        handleMouseMove(event) {
            if (!Dom.isSingleLeftClick(event)) {
                return;
            }
            let newTime;
            const distance = this.calculateDistance(event);
            const liveTracker = this.player_.liveTracker;
            if (!liveTracker || !liveTracker.isLive()) {
                newTime = distance * this.player_.duration();
                if (newTime === this.player_.duration()) {
                    newTime = newTime - 0.1;
                }
            } else {
                if (distance >= 0.99) {
                    liveTracker.seekToLiveEdge();
                    return;
                }
                const seekableStart = liveTracker.seekableStart();
                const seekableEnd = liveTracker.liveCurrentTime();
                newTime = seekableStart + distance * liveTracker.liveWindow();
                if (newTime >= seekableEnd) {
                    newTime = seekableEnd;
                }
                if (newTime <= seekableStart) {
                    newTime = seekableStart + 0.1;
                }
                if (newTime === Infinity) {
                    return;
                }
            }
            this.player_.currentTime(newTime);
        }
        enable() {
            super.enable();
            const mouseTimeDisplay = this.getChild('mouseTimeDisplay');
            if (!mouseTimeDisplay) {
                return;
            }
            mouseTimeDisplay.show();
        }
        disable() {
            super.disable();
            const mouseTimeDisplay = this.getChild('mouseTimeDisplay');
            if (!mouseTimeDisplay) {
                return;
            }
            mouseTimeDisplay.hide();
        }
        handleMouseUp(event) {
            super.handleMouseUp(event);
            if (event) {
                event.stopPropagation();
            }
            this.player_.scrubbing(false);
            this.player_.trigger({
                type: 'timeupdate',
                target: this,
                manuallyTriggered: true
            });
            if (this.videoWasPlaying) {
                promise.silencePromise(this.player_.play());
            } else {
                this.update_();
            }
        }
        stepForward() {
            this.player_.currentTime(this.player_.currentTime() + STEP_SECONDS);
        }
        stepBack() {
            this.player_.currentTime(this.player_.currentTime() - STEP_SECONDS);
        }
        handleAction(event) {
            if (this.player_.paused()) {
                this.player_.play();
            } else {
                this.player_.pause();
            }
        }
        handleKeyDown(event) {
            if (keycode.isEventKey(event, 'Space') || keycode.isEventKey(event, 'Enter')) {
                event.preventDefault();
                event.stopPropagation();
                this.handleAction(event);
            } else if (keycode.isEventKey(event, 'Home')) {
                event.preventDefault();
                event.stopPropagation();
                this.player_.currentTime(0);
            } else if (keycode.isEventKey(event, 'End')) {
                event.preventDefault();
                event.stopPropagation();
                this.player_.currentTime(this.player_.duration());
            } else if (/^[0-9]$/.test(keycode(event))) {
                event.preventDefault();
                event.stopPropagation();
                const gotoFraction = (keycode.codes[keycode(event)] - keycode.codes['0']) * 10 / 100;
                this.player_.currentTime(this.player_.duration() * gotoFraction);
            } else if (keycode.isEventKey(event, 'PgDn')) {
                event.preventDefault();
                event.stopPropagation();
                this.player_.currentTime(this.player_.currentTime() - STEP_SECONDS * PAGE_KEY_MULTIPLIER);
            } else if (keycode.isEventKey(event, 'PgUp')) {
                event.preventDefault();
                event.stopPropagation();
                this.player_.currentTime(this.player_.currentTime() + STEP_SECONDS * PAGE_KEY_MULTIPLIER);
            } else {
                super.handleKeyDown(event);
            }
        }
        dispose() {
            this.disableInterval_();
            thisunlistenTo(this.player_, [
                'ended',
                'durationchange',
                'timeupdate'
            ], this.update);
            if (this.player_.liveTracker) {
                this.listenTo(this.player_.liveTracker, 'liveedgechange', this.update);
            }
            this.unlistenTo(this.player_, ['playing'], this.enableInterval_);
            this.unlistenTo(this.player_, [
                'ended',
                'pause',
                'waiting'
            ], this.disableInterval_);
            if ('hidden' in document && 'visibilityState' in document) {
                this.unlistenTo(document, 'visibilitychange', this.toggleVisibility_);
            }
            super.dispose();
        }
    }
    SeekBar.prototype.options_ = {
        children: [
            'loadProgressBar',
            'playProgressBar'
        ],
        barName: 'playProgressBar'
    };
    if (!browser.IS_IOS && !browser.IS_ANDROID) {
        SeekBar.prototype.options_.children.splice(1, 0, 'mouseTimeDisplay');
    }
    Component.registerComponent('SeekBar', SeekBar);
    return SeekBar;
});
define('skylark-videojs/control-bar/progress-control/progress-control',[
    '../../component',
    '../../utils/dom',
    '../../utils/clamp',
    '../../utils/fn',
    './seek-bar'
], function (Component, Dom, clamp, Fn) {
    'use strict';
    class ProgressControl extends Component {
        constructor(player, options) {
            super(player, options);
            this.handleMouseMove = Fn.throttle(Fn.bind(this, this.handleMouseMove), Fn.UPDATE_REFRESH_INTERVAL);
            this.throttledHandleMouseSeek = Fn.throttle(Fn.bind(this, this.handleMouseSeek), Fn.UPDATE_REFRESH_INTERVAL);
            this.enable();
        }
        createEl() {
            return super.createEl('div', { className: 'vjs-progress-control vjs-control' });
        }
        handleMouseMove(event) {
            const seekBar = this.getChild('seekBar');
            if (!seekBar) {
                return;
            }
            const playProgressBar = seekBar.getChild('playProgressBar');
            const mouseTimeDisplay = seekBar.getChild('mouseTimeDisplay');
            if (!playProgressBar && !mouseTimeDisplay) {
                return;
            }
            const seekBarEl = seekBar.el();
            const seekBarRect = Dom.findPosition(seekBarEl);
            let seekBarPoint = Dom.getPointerPosition(seekBarEl, event).x;
            seekBarPoint = clamp(seekBarPoint, 0, 1);
            if (mouseTimeDisplay) {
                mouseTimeDisplay.update(seekBarRect, seekBarPoint);
            }
            if (playProgressBar) {
                playProgressBar.update(seekBarRect, seekBar.getProgress());
            }
        }
        handleMouseSeek(event) {
            const seekBar = this.getChild('seekBar');
            if (seekBar) {
                seekBar.handleMouseMove(event);
            }
        }
        enabled() {
            return this.enabled_;
        }
        disable() {
            this.children().forEach(child => child.disable && child.disable());
            if (!this.enabled()) {
                return;
            }
            this.unlistenTo([
                'mousedown',
                'touchstart'
            ], this.handleMouseDown);
            this.unlistenTo(this.el_, 'mousemove', this.handleMouseMove);
            this.handleMouseUp();
            this.addClass('disabled');
            this.enabled_ = false;
        }
        enable() {
            this.children().forEach(child => child.enable && child.enable());
            if (this.enabled()) {
                return;
            }
            this.listenTo([
                'mousedown',
                'touchstart'
            ], this.handleMouseDown);
            this.listenTo(this.el_, 'mousemove', this.handleMouseMove);
            this.removeClass('disabled');
            this.enabled_ = true;
        }
        handleMouseDown(event) {
            const doc = this.el_.ownerDocument;
            const seekBar = this.getChild('seekBar');
            if (seekBar) {
                seekBar.handleMouseDown(event);
            }
            this.listenTo(doc, 'mousemove', this.throttledHandleMouseSeek);
            this.listenTo(doc, 'touchmove', this.throttledHandleMouseSeek);
            this.listenTo(doc, 'mouseup', this.handleMouseUp);
            this.listenTo(doc, 'touchend', this.handleMouseUp);
        }
        handleMouseUp(event) {
            const doc = this.el_.ownerDocument;
            const seekBar = this.getChild('seekBar');
            if (seekBar) {
                seekBar.handleMouseUp(event);
            }
            this.unlistenTo(doc, 'mousemove', this.throttledHandleMouseSeek);
            this.unlistenTo(doc, 'touchmove', this.throttledHandleMouseSeek);
            this.unlistenTo(doc, 'mouseup', this.handleMouseUp);
            this.unlistenTo(doc, 'touchend', this.handleMouseUp);
        }
    }
    ProgressControl.prototype.options_ = { children: ['seekBar'] };
    Component.registerComponent('ProgressControl', ProgressControl);
    return ProgressControl;
});
define('skylark-videojs/control-bar/picture-in-picture-toggle',[
    'skylark-langx-globals/document',
    '../button',
    '../component'
], function (document,Button, Component) {
    'use strict';
    class PictureInPictureToggle extends Button {
        constructor(player, options) {
            super(player, options);
            this.listenTo(player, [
                'enterpictureinpicture',
                'leavepictureinpicture'
            ], this.handlePictureInPictureChange);
            this.listenTo(player, [
                'disablepictureinpicturechanged',
                'loadedmetadata'
            ], this.handlePictureInPictureEnabledChange);
            this.disable();
        }
        buildCSSClass() {
            return `vjs-picture-in-picture-control ${ super.buildCSSClass() }`;
        }
        handlePictureInPictureEnabledChange() {
            if (document.pictureInPictureEnabled && this.player_.disablePictureInPicture() === false) {
                this.enable();
            } else {
                this.disable();
            }
        }
        handlePictureInPictureChange(event) {
            if (this.player_.isInPictureInPicture()) {
                this.controlText('Exit Picture-in-Picture');
            } else {
                this.controlText('Picture-in-Picture');
            }
            this.handlePictureInPictureEnabledChange();
        }
        handleClick(event) {
            if (!this.player_.isInPictureInPicture()) {
                this.player_.requestPictureInPicture();
            } else {
                this.player_.exitPictureInPicture();
            }
        }
    }
    PictureInPictureToggle.prototype.controlText_ = 'Picture-in-Picture';
    Component.registerComponent('PictureInPictureToggle', PictureInPictureToggle);
    return PictureInPictureToggle;
});
define('skylark-videojs/control-bar/fullscreen-toggle',[
    'skylark-langx-globals/document',
    '../button',
    '../component',
], function (document,Button, Component) {
    'use strict';
    class FullscreenToggle extends Button {
        constructor(player, options) {
            super(player, options);
            this.listenTo(player, 'fullscreenchange', this.handleFullscreenChange);
            if (document[player.fsApi_.fullscreenEnabled] === false) {
                this.disable();
            }
        }
        buildCSSClass() {
            return `vjs-fullscreen-control ${ super.buildCSSClass() }`;
        }
        handleFullscreenChange(event) {
            if (this.player_.isFullscreen()) {
                this.controlText('Non-Fullscreen');
            } else {
                this.controlText('Fullscreen');
            }
        }
        handleClick(event) {
            if (!this.player_.isFullscreen()) {
                this.player_.requestFullscreen();
            } else {
                this.player_.exitFullscreen();
            }
        }
    }
    FullscreenToggle.prototype.controlText_ = 'Fullscreen';
    Component.registerComponent('FullscreenToggle', FullscreenToggle);
    return FullscreenToggle;
});
define('skylark-videojs/control-bar/volume-control/check-volume-support',[],function () {
    'use strict';
    const checkVolumeSupport = function (self, player) {
        if (player.tech_ && !player.tech_.featuresVolumeControl) {
            self.addClass('vjs-hidden');
        }
        self.listenTo(player, 'loadstart', function () {
            if (!player.tech_.featuresVolumeControl) {
                self.addClass('vjs-hidden');
            } else {
                self.removeClass('vjs-hidden');
            }
        });
    };
    return checkVolumeSupport;
});
define('skylark-videojs/control-bar/volume-control/volume-level',[
    '../../component'
], function (Component) {
    'use strict';
    class VolumeLevel extends Component {
        createEl() {
            return super.createEl('div', {
                className: 'vjs-volume-level',
                innerHTML: '<span class="vjs-control-text"></span>'
            });
        }
    }
    Component.registerComponent('VolumeLevel', VolumeLevel);
    return VolumeLevel;
});
define('skylark-videojs/control-bar/volume-control/volume-bar',[
    '../../slider/slider',
    '../../component',
    '../../utils/dom',
    './volume-level'
], function (Slider, Component, Dom) {
    'use strict';
    class VolumeBar extends Slider {
        constructor(player, options) {
            super(player, options);
            this.listenTo('slideractive', this.updateLastVolume_);
            this.listenTo(player, 'volumechange', this.updateARIAAttributes);
            player.ready(() => this.updateARIAAttributes());
        }
        createEl() {
            return super.createEl('div', { className: 'vjs-volume-bar vjs-slider-bar' }, {
                'aria-label': this.localize('Volume Level'),
                'aria-live': 'polite'
            });
        }
        handleMouseDown(event) {
            if (!Dom.isSingleLeftClick(event)) {
                return;
            }
            super.handleMouseDown(event);
        }
        handleMouseMove(event) {
            if (!Dom.isSingleLeftClick(event)) {
                return;
            }
            this.checkMuted();
            this.player_.volume(this.calculateDistance(event));
        }
        checkMuted() {
            if (this.player_.muted()) {
                this.player_.muted(false);
            }
        }
        getPercent() {
            if (this.player_.muted()) {
                return 0;
            }
            return this.player_.volume();
        }
        stepForward() {
            this.checkMuted();
            this.player_.volume(this.player_.volume() + 0.1);
        }
        stepBack() {
            this.checkMuted();
            this.player_.volume(this.player_.volume() - 0.1);
        }
        updateARIAAttributes(event) {
            const ariaValue = this.player_.muted() ? 0 : this.volumeAsPercentage_();
            this.el_.setAttribute('aria-valuenow', ariaValue);
            this.el_.setAttribute('aria-valuetext', ariaValue + '%');
        }
        volumeAsPercentage_() {
            return Math.round(this.player_.volume() * 100);
        }
        updateLastVolume_() {
            const volumeBeforeDrag = this.player_.volume();
            this.listenToOnce('sliderinactive', () => {
                if (this.player_.volume() === 0) {
                    this.player_.lastVolume_(volumeBeforeDrag);
                }
            });
        }
    }
    VolumeBar.prototype.options_ = {
        children: ['volumeLevel'],
        barName: 'volumeLevel'
    };
    VolumeBar.prototype.playerEvent = 'volumechange';
    Component.registerComponent('VolumeBar', VolumeBar);
    return VolumeBar;
});
define('skylark-videojs/control-bar/volume-control/volume-control',[
    '../../component',
    './check-volume-support',
    '../../utils/obj',
    '../../utils/fn',
    './volume-bar'
], function (Component, checkVolumeSupport, obj, Fn) {
    'use strict';
    class VolumeControl extends Component {
        constructor(player, options = {}) {
            options.vertical = options.vertical || false;
            if (typeof options.volumeBar === 'undefined' || obj.isPlain(options.volumeBar)) {
                options.volumeBar = options.volumeBar || {};
                options.volumeBar.vertical = options.vertical;
            }
            super(player, options);
            checkVolumeSupport(this, player);
            this.throttledHandleMouseMove = Fn.throttle(Fn.bind(this, this.handleMouseMove), Fn.UPDATE_REFRESH_INTERVAL);
            this.listenTo('mousedown', this.handleMouseDown);
            this.listenTo('touchstart', this.handleMouseDown);
            this.listenTo(this.volumeBar, [
                'focus',
                'slideractive'
            ], () => {
                this.volumeBar.addClass('vjs-slider-active');
                this.addClass('vjs-slider-active');
                this.trigger('slideractive');
            });
            this.listenTo(this.volumeBar, [
                'blur',
                'sliderinactive'
            ], () => {
                this.volumeBar.removeClass('vjs-slider-active');
                this.removeClass('vjs-slider-active');
                this.trigger('sliderinactive');
            });
        }
        createEl() {
            let orientationClass = 'vjs-volume-horizontal';
            if (this.options_.vertical) {
                orientationClass = 'vjs-volume-vertical';
            }
            return super.createEl('div', { className: `vjs-volume-control vjs-control ${ orientationClass }` });
        }
        handleMouseDown(event) {
            const doc = this.el_.ownerDocument;
            this.listenTo(doc, 'mousemove', this.throttledHandleMouseMove);
            this.listenTo(doc, 'touchmove', this.throttledHandleMouseMove);
            this.listenTo(doc, 'mouseup', this.handleMouseUp);
            this.listenTo(doc, 'touchend', this.handleMouseUp);
        }
        handleMouseUp(event) {
            const doc = this.el_.ownerDocument;
            this.unlistenTo(doc, 'mousemove', this.throttledHandleMouseMove);
            this.unlistenTo(doc, 'touchmove', this.throttledHandleMouseMove);
            this.unlistenTo(doc, 'mouseup', this.handleMouseUp);
            this.unlistenTo(doc, 'touchend', this.handleMouseUp);
        }
        handleMouseMove(event) {
            this.volumeBar.handleMouseMove(event);
        }
    }
    VolumeControl.prototype.options_ = { children: ['volumeBar'] };
    Component.registerComponent('VolumeControl', VolumeControl);
    return VolumeControl;
});
define('skylark-videojs/control-bar/volume-control/check-mute-support',[],function () {
    'use strict';
    const checkMuteSupport = function (self, player) {
        if (player.tech_ && !player.tech_.featuresMuteControl) {
            self.addClass('vjs-hidden');
        }
        self.listenTo(player, 'loadstart', function () {
            if (!player.tech_.featuresMuteControl) {
                self.addClass('vjs-hidden');
            } else {
                self.removeClass('vjs-hidden');
            }
        });
    };
    return checkMuteSupport;
});
define('skylark-videojs/control-bar/mute-toggle',[
    '../button',
    '../component',
    '../utils/dom',
    './volume-control/check-mute-support',
    '../utils/browser'
], function (Button, Component, Dom, checkMuteSupport, browser) {
    'use strict';
    class MuteToggle extends Button {
        constructor(player, options) {
            super(player, options);
            checkMuteSupport(this, player);
            this.listenTo(player, [
                'loadstart',
                'volumechange'
            ], this.update);
        }
        buildCSSClass() {
            return `vjs-mute-control ${ super.buildCSSClass() }`;
        }
        handleClick(event) {
            const vol = this.player_.volume();
            const lastVolume = this.player_.lastVolume_();
            if (vol === 0) {
                const volumeToSet = lastVolume < 0.1 ? 0.1 : lastVolume;
                this.player_.volume(volumeToSet);
                this.player_.muted(false);
            } else {
                this.player_.muted(this.player_.muted() ? false : true);
            }
        }
        update(event) {
            this.updateIcon_();
            this.updateControlText_();
        }
        updateIcon_() {
            const vol = this.player_.volume();
            let level = 3;
            if (browser.IS_IOS && this.player_.tech_ && this.player_.tech_.el_) {
                this.player_.muted(this.player_.tech_.el_.muted);
            }
            if (vol === 0 || this.player_.muted()) {
                level = 0;
            } else if (vol < 0.33) {
                level = 1;
            } else if (vol < 0.67) {
                level = 2;
            }
            for (let i = 0; i < 4; i++) {
                Dom.removeClass(this.el_, `vjs-vol-${ i }`);
            }
            Dom.addClass(this.el_, `vjs-vol-${ level }`);
        }
        updateControlText_() {
            const soundOff = this.player_.muted() || this.player_.volume() === 0;
            const text = soundOff ? 'Unmute' : 'Mute';
            if (this.controlText() !== text) {
                this.controlText(text);
            }
        }
    }
    MuteToggle.prototype.controlText_ = 'Mute';
    Component.registerComponent('MuteToggle', MuteToggle);
    return MuteToggle;
});
define('skylark-videojs/control-bar/volume-panel',[
    'skylark-langx-globals/document',
    '../component',
    '../utils/obj',
    '../utils/events',
    '../utils/fn',
    '../utils/keycode',
    './volume-control/volume-control',
    './mute-toggle'
], function (document, Component, obj, Events, Fn, keycode) {
    'use strict';
    class VolumePanel extends Component {
        constructor(player, options = {}) {
            if (typeof options.inline !== 'undefined') {
                options.inline = options.inline;
            } else {
                options.inline = true;
            }
            if (typeof options.volumeControl === 'undefined' || obj.isPlain(options.volumeControl)) {
                options.volumeControl = options.volumeControl || {};
                options.volumeControl.vertical = !options.inline;
            }
            super(player, options);
            this.listenTo(player, ['loadstart'], this.volumePanelState_);
            this.listenTo(this.muteToggle, 'keyup', this.handleKeyPress);
            this.listenTo(this.volumeControl, 'keyup', this.handleVolumeControlKeyUp);
            this.listenTo('keydown', this.handleKeyPress);
            this.listenTo('mouseover', this.handleMouseOver);
            this.listenTo('mouseout', this.handleMouseOut);
            this.listenTo(this.volumeControl, ['slideractive'], this.sliderActive_);
            this.listenTo(this.volumeControl, ['sliderinactive'], this.sliderInactive_);
        }
        sliderActive_() {
            this.addClass('vjs-slider-active');
        }
        sliderInactive_() {
            this.removeClass('vjs-slider-active');
        }
        volumePanelState_() {
            if (this.volumeControl.hasClass('vjs-hidden') && this.muteToggle.hasClass('vjs-hidden')) {
                this.addClass('vjs-hidden');
            }
            if (this.volumeControl.hasClass('vjs-hidden') && !this.muteToggle.hasClass('vjs-hidden')) {
                this.addClass('vjs-mute-toggle-only');
            }
        }
        createEl() {
            let orientationClass = 'vjs-volume-panel-horizontal';
            if (!this.options_.inline) {
                orientationClass = 'vjs-volume-panel-vertical';
            }
            return super.createEl('div', { className: `vjs-volume-panel vjs-control ${ orientationClass }` });
        }
        dispose() {
            this.handleMouseOut();
            super.dispose();
        }
        handleVolumeControlKeyUp(event) {
            if (keycode.isEventKey(event, 'Esc')) {
                this.muteToggle.focus();
            }
        }
        handleMouseOver(event) {
            this.addClass('vjs-hover');
            Events.on(document, 'keyup', Fn.bind(this, this.handleKeyPress));
        }
        handleMouseOut(event) {
            this.removeClass('vjs-hover');
            Events.off(document, 'keyup', Fn.bind(this, this.handleKeyPress));
        }
        handleKeyPress(event) {
            if (keycode.isEventKey(event, 'Esc')) {
                this.handleMouseOut();
            }
        }
    }
    VolumePanel.prototype.options_ = {
        children: [
            'muteToggle',
            'volumeControl'
        ]
    };
    Component.registerComponent('VolumePanel', VolumePanel);
    return VolumePanel;
});
define('skylark-videojs/menu/menu',[
    'skylark-langx-globals/document',
    '../component',
    '../utils/dom',
    '../utils/fn',
    '../utils/events',
    '../utils/keycode'
], function (document,Component, Dom, Fn, Events, keycode) {
    'use strict';
    class Menu extends Component {
        constructor(player, options) {
            super(player, options);
            if (options) {
                this.menuButton_ = options.menuButton;
            }
            this.focusedChild_ = -1;
            this.listenTo('keydown', this.handleKeyDown);
            this.boundHandleBlur_ = Fn.bind(this, this.handleBlur);
            this.boundHandleTapClick_ = Fn.bind(this, this.handleTapClick);
        }
        addEventListenerForItem(component) {
            if (!(component instanceof Component)) {
                return;
            }
            this.listenTo(component, 'blur', this.boundHandleBlur_);
            this.listenTo(component, [
                'tap',
                'click'
            ], this.boundHandleTapClick_);
        }
        removeEventListenerForItem(component) {
            if (!(component instanceof Component)) {
                return;
            }
            this.unlistenTo(component, 'blur', this.boundHandleBlur_);
            this.unlistenTo(component, [
                'tap',
                'click'
            ], this.boundHandleTapClick_);
        }
        removeChild(component) {
            if (typeof component === 'string') {
                component = this.getChild(component);
            }
            this.removeEventListenerForItem(component);
            super.removeChild(component);
        }
        addItem(component) {
            const childComponent = this.addChild(component);
            if (childComponent) {
                this.addEventListenerForItem(childComponent);
            }
        }
        createEl() {
            const contentElType = this.options_.contentElType || 'ul';
            this.contentEl_ = Dom.createEl(contentElType, { className: 'vjs-menu-content' });
            this.contentEl_.setAttribute('role', 'menu');
            const el = super.createEl('div', {
                append: this.contentEl_,
                className: 'vjs-menu'
            });
            el.appendChild(this.contentEl_);
            Events.on(el, 'click', function (event) {
                event.preventDefault();
                event.stopImmediatePropagation();
            });
            return el;
        }
        dispose() {
            this.contentEl_ = null;
            this.boundHandleBlur_ = null;
            this.boundHandleTapClick_ = null;
            super.dispose();
        }
        handleBlur(event) {
            const relatedTarget = event.relatedTarget || document.activeElement;
            if (!this.children().some(element => {
                    return element.el() === relatedTarget;
                })) {
                const btn = this.menuButton_;
                if (btn && btn.buttonPressed_ && relatedTarget !== btn.el().firstChild) {
                    btn.unpressButton();
                }
            }
        }
        handleTapClick(event) {
            if (this.menuButton_) {
                this.menuButton_.unpressButton();
                const childComponents = this.children();
                if (!Array.isArray(childComponents)) {
                    return;
                }
                const foundComponent = childComponents.filter(component => component.el() === event.target)[0];
                if (!foundComponent) {
                    return;
                }
                if (foundComponent.name() !== 'CaptionSettingsMenuItem') {
                    this.menuButton_.focus();
                }
            }
        }
        handleKeyDown(event) {
            if (keycode.isEventKey(event, 'Left') || keycode.isEventKey(event, 'Down')) {
                event.preventDefault();
                event.stopPropagation();
                this.stepForward();
            } else if (keycode.isEventKey(event, 'Right') || keycode.isEventKey(event, 'Up')) {
                event.preventDefault();
                event.stopPropagation();
                this.stepBack();
            }
        }
        stepForward() {
            let stepChild = 0;
            if (this.focusedChild_ !== undefined) {
                stepChild = this.focusedChild_ + 1;
            }
            this.focus(stepChild);
        }
        stepBack() {
            let stepChild = 0;
            if (this.focusedChild_ !== undefined) {
                stepChild = this.focusedChild_ - 1;
            }
            this.focus(stepChild);
        }
        focus(item = 0) {
            const children = this.children().slice();
            const haveTitle = children.length && children[0].hasClass('vjs-menu-title');
            if (haveTitle) {
                children.shift();
            }
            if (children.length > 0) {
                if (item < 0) {
                    item = 0;
                } else if (item >= children.length) {
                    item = children.length - 1;
                }
                this.focusedChild_ = item;
                children[item].el_.focus();
            }
        }
    }
    Component.registerComponent('Menu', Menu);
    return Menu;
});
define('skylark-videojs/menu/menu-button',[
    '../button',
    '../component',
    './menu',
    '../utils/dom',
    '../utils/fn',
    '../utils/events',
    '../utils/string-cases',
    '../utils/browser',
    '../utils/keycode'
], function (Button, Component, Menu, Dom, Fn, Events, stringCases, browser, keycode) {
    'use strict';
    class MenuButton extends Component {
        constructor(player, options = {}) {
            super(player, options);
            this.menuButton_ = new Button(player, options);
            this.menuButton_.controlText(this.controlText_);
            this.menuButton_.el_.setAttribute('aria-haspopup', 'true');
            const buttonClass = Button.prototype.buildCSSClass();
            this.menuButton_.el_.className = this.buildCSSClass() + ' ' + buttonClass;
            this.menuButton_.removeClass('vjs-control');
            this.addChild(this.menuButton_);
            this.update();
            this.enabled_ = true;
            this.listenTo(this.menuButton_, 'tap', this.handleClick);
            this.listenTo(this.menuButton_, 'click', this.handleClick);
            this.listenTo(this.menuButton_, 'keydown', this.handleKeyDown);
            this.listenTo(this.menuButton_, 'mouseenter', () => {
                this.addClass('vjs-hover');
                this.menu.show();
                Events.on(document, 'keyup', Fn.bind(this, this.handleMenuKeyUp));
            });
            this.listenTo('mouseleave', this.handleMouseLeave);
            this.listenTo('keydown', this.handleSubmenuKeyDown);
        }
        update() {
            const menu = this.createMenu();
            if (this.menu) {
                this.menu.dispose();
                this.removeChild(this.menu);
            }
            this.menu = menu;
            this.addChild(menu);
            this.buttonPressed_ = false;
            this.menuButton_.el_.setAttribute('aria-expanded', 'false');
            if (this.items && this.items.length <= this.hideThreshold_) {
                this.hide();
            } else {
                this.show();
            }
        }
        createMenu() {
            const menu = new Menu(this.player_, { menuButton: this });
            this.hideThreshold_ = 0;
            if (this.options_.title) {
                const titleEl = Dom.createEl('li', {
                    className: 'vjs-menu-title',
                    innerHTML: stringCases.toTitleCase(this.options_.title),
                    tabIndex: -1
                });
                this.hideThreshold_ += 1;
                const titleComponent = new Component(this.player_, { el: titleEl });
                menu.addItem(titleComponent);
            }
            this.items = this.createItems();
            if (this.items) {
                for (let i = 0; i < this.items.length; i++) {
                    menu.addItem(this.items[i]);
                }
            }
            return menu;
        }
        createItems() {
        }
        createEl() {
            return super.createEl('div', { className: this.buildWrapperCSSClass() }, {});
        }
        buildWrapperCSSClass() {
            let menuButtonClass = 'vjs-menu-button';
            if (this.options_.inline === true) {
                menuButtonClass += '-inline';
            } else {
                menuButtonClass += '-popup';
            }
            const buttonClass = Button.prototype.buildCSSClass();
            return `vjs-menu-button ${ menuButtonClass } ${ buttonClass } ${ super.buildCSSClass() }`;
        }
        buildCSSClass() {
            let menuButtonClass = 'vjs-menu-button';
            if (this.options_.inline === true) {
                menuButtonClass += '-inline';
            } else {
                menuButtonClass += '-popup';
            }
            return `vjs-menu-button ${ menuButtonClass } ${ super.buildCSSClass() }`;
        }
        controlText(text, el = this.menuButton_.el()) {
            return this.menuButton_.controlText(text, el);
        }
        dispose() {
            this.handleMouseLeave();
            super.dispose();
        }
        handleClick(event) {
            if (this.buttonPressed_) {
                this.unpressButton();
            } else {
                this.pressButton();
            }
        }
        handleMouseLeave(event) {
            this.removeClass('vjs-hover');
            Events.off(document, 'keyup', Fn.bind(this, this.handleMenuKeyUp));
        }
        focus() {
            this.menuButton_.focus();
        }
        blur() {
            this.menuButton_.blur();
        }
        handleKeyDown(event) {
            if (keycode.isEventKey(event, 'Esc') || keycode.isEventKey(event, 'Tab')) {
                if (this.buttonPressed_) {
                    this.unpressButton();
                }
                if (!keycode.isEventKey(event, 'Tab')) {
                    event.preventDefault();
                    this.menuButton_.focus();
                }
            } else if (keycode.isEventKey(event, 'Up') || keycode.isEventKey(event, 'Down')) {
                if (!this.buttonPressed_) {
                    event.preventDefault();
                    this.pressButton();
                }
            }
        }
        handleMenuKeyUp(event) {
            if (keycode.isEventKey(event, 'Esc') || keycode.isEventKey(event, 'Tab')) {
                this.removeClass('vjs-hover');
            }
        }
        handleSubmenuKeyPress(event) {
            this.handleSubmenuKeyDown(event);
        }
        handleSubmenuKeyDown(event) {
            if (keycode.isEventKey(event, 'Esc') || keycode.isEventKey(event, 'Tab')) {
                if (this.buttonPressed_) {
                    this.unpressButton();
                }
                if (!keycode.isEventKey(event, 'Tab')) {
                    event.preventDefault();
                    this.menuButton_.focus();
                }
            } else {
            }
        }
        pressButton() {
            if (this.enabled_) {
                this.buttonPressed_ = true;
                this.menu.show();
                this.menu.lockShowing();
                this.menuButton_.el_.setAttribute('aria-expanded', 'true');
                if (browser.IS_IOS && Dom.isInFrame()) {
                    return;
                }
                this.menu.focus();
            }
        }
        unpressButton() {
            if (this.enabled_) {
                this.buttonPressed_ = false;
                this.menu.unlockShowing();
                this.menu.hide();
                this.menuButton_.el_.setAttribute('aria-expanded', 'false');
            }
        }
        disable() {
            this.unpressButton();
            this.enabled_ = false;
            this.addClass('vjs-disabled');
            this.menuButton_.disable();
        }
        enable() {
            this.enabled_ = true;
            this.removeClass('vjs-disabled');
            this.menuButton_.enable();
        }
    }
    Component.registerComponent('MenuButton', MenuButton);
    return MenuButton;
});
define('skylark-videojs/control-bar/track-button',[
    '../menu/menu-button',
    '../component',
    '../utils/fn'
], function (MenuButton, Component, Fn) {
    'use strict';
    class TrackButton extends MenuButton {
        constructor(player, options) {
            const tracks = options.tracks;
            super(player, options);
            if (this.items.length <= 1) {
                this.hide();
            }
            if (!tracks) {
                return;
            }
            const updateHandler = Fn.bind(this, this.update);
            tracks.addEventListener('removetrack', updateHandler);
            tracks.addEventListener('addtrack', updateHandler);
            tracks.addEventListener('labelchange', updateHandler);
            this.player_.on('ready', updateHandler);
            this.player_.on('dispose', function () {
                tracks.removeEventListener('removetrack', updateHandler);
                tracks.removeEventListener('addtrack', updateHandler);
                tracks.removeEventListener('labelchange', updateHandler);
            });
        }
    }
    Component.registerComponent('TrackButton', TrackButton);
    return TrackButton;
});
define('skylark-videojs/menu/menu-keys',[],function () {
    'use strict';
    const MenuKeys = [
        'Tab',
        'Esc',
        'Up',
        'Down',
        'Right',
        'Left'
    ];
    return MenuKeys;
});
define('skylark-videojs/menu/menu-item',[
    '../clickable-component',
    '../component',
    '../utils/obj',
    './menu-keys',
    '../utils/keycode'
], function (ClickableComponent, Component, obj, MenuKeys, keycode) {
    'use strict';
    class MenuItem extends ClickableComponent {
        constructor(player, options) {
            super(player, options);
            this.selectable = options.selectable;
            this.isSelected_ = options.selected || false;
            this.multiSelectable = options.multiSelectable;
            this.selected(this.isSelected_);
            if (this.selectable) {
                if (this.multiSelectable) {
                    this.el_.setAttribute('role', 'menuitemcheckbox');
                } else {
                    this.el_.setAttribute('role', 'menuitemradio');
                }
            } else {
                this.el_.setAttribute('role', 'menuitem');
            }
        }
        createEl(type, props, attrs) {
            this.nonIconControl = true;
            return super.createEl('li', obj.assign({
                className: 'vjs-menu-item',
                innerHTML: `<span class="vjs-menu-item-text">${ this.localize(this.options_.label) }</span>`,
                tabIndex: -1
            }, props), attrs);
        }
        handleKeyDown(event) {
            if (!MenuKeys.some(key => keycode.isEventKey(event, key))) {
                super.handleKeyDown(event);
            }
        }
        handleClick(event) {
            this.selected(true);
        }
        selected(selected) {
            if (this.selectable) {
                if (selected) {
                    this.addClass('vjs-selected');
                    this.el_.setAttribute('aria-checked', 'true');
                    this.controlText(', selected');
                    this.isSelected_ = true;
                } else {
                    this.removeClass('vjs-selected');
                    this.el_.setAttribute('aria-checked', 'false');
                    this.controlText('');
                    this.isSelected_ = false;
                }
            }
        }
    }
    Component.registerComponent('MenuItem', MenuItem);
    return MenuItem;
});
define('skylark-videojs/control-bar/text-track-controls/text-track-menu-item',[
    'skylark-langx-globals/document',
    '../../menu/menu-item',
    '../../component'
], function (document,MenuItem, Component) {
    'use strict';
    class TextTrackMenuItem extends MenuItem {
        constructor(player, options) {
            const track = options.track;
            const tracks = player.textTracks();
            options.label = track.label || track.language || 'Unknown';
            options.selected = track.mode === 'showing';
            super(player, options);
            this.track = track;
            this.kinds = (options.kinds || [options.kind || this.track.kind]).filter(Boolean);
            const changeHandler = (...args) => {
                this.handleTracksChange.apply(this, args);
            };
            const selectedLanguageChangeHandler = (...args) => {
                this.handleSelectedLanguageChange.apply(this, args);
            };
            player.on([
                'loadstart',
                'texttrackchange'
            ], changeHandler);
            tracks.addEventListener('change', changeHandler);
            tracks.addEventListener('selectedlanguagechange', selectedLanguageChangeHandler);
            this.listenTo('dispose', function () {
                player.off([
                    'loadstart',
                    'texttrackchange'
                ], changeHandler);
                tracks.removeEventListener('change', changeHandler);
                tracks.removeEventListener('selectedlanguagechange', selectedLanguageChangeHandler);
            });
            if (tracks.onchange === undefined) {
                let event;
                this.listenTo([
                    'tap',
                    'click'
                ], function () {
                    if (typeof window.Event !== 'object') {
                        try {
                            event = new window.Event('change');
                        } catch (err) {
                        }
                    }
                    if (!event) {
                        event = document.createEvent('Event');
                        event.initEvent('change', true, true);
                    }
                    tracks.dispatchEvent(event);
                });
            }
            this.handleTracksChange();
        }
        handleClick(event) {
            const referenceTrack = this.track;
            const tracks = this.player_.textTracks();
            super.handleClick(event);
            if (!tracks) {
                return;
            }
            for (let i = 0; i < tracks.length; i++) {
                const track = tracks[i];
                if (this.kinds.indexOf(track.kind) === -1) {
                    continue;
                }
                if (track === referenceTrack) {
                    if (track.mode !== 'showing') {
                        track.mode = 'showing';
                    }
                } else if (track.mode !== 'disabled') {
                    track.mode = 'disabled';
                }
            }
        }
        handleTracksChange(event) {
            const shouldBeSelected = this.track.mode === 'showing';
            if (shouldBeSelected !== this.isSelected_) {
                this.selected(shouldBeSelected);
            }
        }
        handleSelectedLanguageChange(event) {
            if (this.track.mode === 'showing') {
                const selectedLanguage = this.player_.cache_.selectedLanguage;
                if (selectedLanguage && selectedLanguage.enabled && selectedLanguage.language === this.track.language && selectedLanguage.kind !== this.track.kind) {
                    return;
                }
                this.player_.cache_.selectedLanguage = {
                    enabled: true,
                    language: this.track.language,
                    kind: this.track.kind
                };
            }
        }
        dispose() {
            this.track = null;
            super.dispose();
        }
    }
    Component.registerComponent('TextTrackMenuItem', TextTrackMenuItem);
    return TextTrackMenuItem;
});
define('skylark-videojs/control-bar/text-track-controls/off-text-track-menu-item',[
    './text-track-menu-item',
    '../../component'
], function (TextTrackMenuItem, Component) {
    'use strict';
    class OffTextTrackMenuItem extends TextTrackMenuItem {
        constructor(player, options) {
            options.track = {
                player,
                kind: options.kind,
                kinds: options.kinds,
                default: false,
                mode: 'disabled'
            };
            if (!options.kinds) {
                options.kinds = [options.kind];
            }
            if (options.label) {
                options.track.label = options.label;
            } else {
                options.track.label = options.kinds.join(' and ') + ' off';
            }
            options.selectable = true;
            options.multiSelectable = false;
            super(player, options);
        }
        handleTracksChange(event) {
            const tracks = this.player().textTracks();
            let shouldBeSelected = true;
            for (let i = 0, l = tracks.length; i < l; i++) {
                const track = tracks[i];
                if (this.options_.kinds.indexOf(track.kind) > -1 && track.mode === 'showing') {
                    shouldBeSelected = false;
                    break;
                }
            }
            if (shouldBeSelected !== this.isSelected_) {
                this.selected(shouldBeSelected);
            }
        }
        handleSelectedLanguageChange(event) {
            const tracks = this.player().textTracks();
            let allHidden = true;
            for (let i = 0, l = tracks.length; i < l; i++) {
                const track = tracks[i];
                if ([
                        'captions',
                        'descriptions',
                        'subtitles'
                    ].indexOf(track.kind) > -1 && track.mode === 'showing') {
                    allHidden = false;
                    break;
                }
            }
            if (allHidden) {
                this.player_.cache_.selectedLanguage = { enabled: false };
            }
        }
    }
    Component.registerComponent('OffTextTrackMenuItem', OffTextTrackMenuItem);
    return OffTextTrackMenuItem;
});
define('skylark-videojs/control-bar/text-track-controls/text-track-button',[
    '../track-button',
    '../../component',
    './text-track-menu-item',
    './off-text-track-menu-item'
], function (TrackButton, Component, TextTrackMenuItem, OffTextTrackMenuItem) {
    'use strict';
    class TextTrackButton extends TrackButton {
        constructor(player, options = {}) {
            options.tracks = player.textTracks();
            super(player, options);
        }
        createItems(items = [], TrackMenuItem = TextTrackMenuItem) {
            let label;
            if (this.label_) {
                label = `${ this.label_ } off`;
            }
            items.push(new OffTextTrackMenuItem(this.player_, {
                kinds: this.kinds_,
                kind: this.kind_,
                label
            }));
            this.hideThreshold_ += 1;
            const tracks = this.player_.textTracks();
            if (!Array.isArray(this.kinds_)) {
                this.kinds_ = [this.kind_];
            }
            for (let i = 0; i < tracks.length; i++) {
                const track = tracks[i];
                if (this.kinds_.indexOf(track.kind) > -1) {
                    const item = new TrackMenuItem(this.player_, {
                        track,
                        kinds: this.kinds_,
                        kind: this.kind_,
                        selectable: true,
                        multiSelectable: false
                    });
                    item.addClass(`vjs-${ track.kind }-menu-item`);
                    items.push(item);
                }
            }
            return items;
        }
    }
    Component.registerComponent('TextTrackButton', TextTrackButton);
    return TextTrackButton;
});
define('skylark-videojs/control-bar/text-track-controls/chapters-track-menu-item',[
    '../../menu/menu-item',
    '../../component',
    '../../utils/fn'
], function (MenuItem, Component, Fn) {
    'use strict';
    class ChaptersTrackMenuItem extends MenuItem {
        constructor(player, options) {
            const track = options.track;
            const cue = options.cue;
            const currentTime = player.currentTime();
            options.selectable = true;
            options.multiSelectable = false;
            options.label = cue.text;
            options.selected = cue.startTime <= currentTime && currentTime < cue.endTime;
            super(player, options);
            this.track = track;
            this.cue = cue;
            track.addEventListener('cuechange', Fn.bind(this, this.update));
        }
        handleClick(event) {
            super.handleClick();
            this.player_.currentTime(this.cue.startTime);
            this.update(this.cue.startTime);
        }
        update(event) {
            const cue = this.cue;
            const currentTime = this.player_.currentTime();
            this.selected(cue.startTime <= currentTime && currentTime < cue.endTime);
        }
    }
    Component.registerComponent('ChaptersTrackMenuItem', ChaptersTrackMenuItem);
    return ChaptersTrackMenuItem;
});
define('skylark-videojs/control-bar/text-track-controls/chapters-button',[
    './text-track-button',
    '../../component',
    './chapters-track-menu-item',
    '../../utils/string-cases'
], function (TextTrackButton, Component, ChaptersTrackMenuItem, stringCases) {
    'use strict';
    class ChaptersButton extends TextTrackButton {
        constructor(player, options, ready) {
            super(player, options, ready);
        }
        buildCSSClass() {
            return `vjs-chapters-button ${ super.buildCSSClass() }`;
        }
        buildWrapperCSSClass() {
            return `vjs-chapters-button ${ super.buildWrapperCSSClass() }`;
        }
        update(event) {
            if (!this.track_ || event && (event.type === 'addtrack' || event.type === 'removetrack')) {
                this.setTrack(this.findChaptersTrack());
            }
            super.update();
        }
        setTrack(track) {
            if (this.track_ === track) {
                return;
            }
            if (!this.updateHandler_) {
                this.updateHandler_ = this.update.bind(this);
            }
            if (this.track_) {
                const remoteTextTrackEl = this.player_.remoteTextTrackEls().getTrackElementByTrack_(this.track_);
                if (remoteTextTrackEl) {
                    remoteTextTrackEl.removeEventListener('load', this.updateHandler_);
                }
                this.track_ = null;
            }
            this.track_ = track;
            if (this.track_) {
                this.track_.mode = 'hidden';
                const remoteTextTrackEl = this.player_.remoteTextTrackEls().getTrackElementByTrack_(this.track_);
                if (remoteTextTrackEl) {
                    remoteTextTrackEl.addEventListener('load', this.updateHandler_);
                }
            }
        }
        findChaptersTrack() {
            const tracks = this.player_.textTracks() || [];
            for (let i = tracks.length - 1; i >= 0; i--) {
                const track = tracks[i];
                if (track.kind === this.kind_) {
                    return track;
                }
            }
        }
        getMenuCaption() {
            if (this.track_ && this.track_.label) {
                return this.track_.label;
            }
            return this.localize(stringCases.toTitleCase(this.kind_));
        }
        createMenu() {
            this.options_.title = this.getMenuCaption();
            return super.createMenu();
        }
        createItems() {
            const items = [];
            if (!this.track_) {
                return items;
            }
            const cues = this.track_.cues;
            if (!cues) {
                return items;
            }
            for (let i = 0, l = cues.length; i < l; i++) {
                const cue = cues[i];
                const mi = new ChaptersTrackMenuItem(this.player_, {
                    track: this.track_,
                    cue
                });
                items.push(mi);
            }
            return items;
        }
    }
    ChaptersButton.prototype.kind_ = 'chapters';
    ChaptersButton.prototype.controlText_ = 'Chapters';
    Component.registerComponent('ChaptersButton', ChaptersButton);
    return ChaptersButton;
});
define('skylark-videojs/control-bar/text-track-controls/descriptions-button',[
    './text-track-button',
    '../../component',
    '../../utils/fn'
], function (TextTrackButton, Component, Fn) {
    'use strict';
    class DescriptionsButton extends TextTrackButton {
        constructor(player, options, ready) {
            super(player, options, ready);
            const tracks = player.textTracks();
            const changeHandler = Fn.bind(this, this.handleTracksChange);
            tracks.addEventListener('change', changeHandler);
            this.listenTo('dispose', function () {
                tracks.removeEventListener('change', changeHandler);
            });
        }
        handleTracksChange(event) {
            const tracks = this.player().textTracks();
            let disabled = false;
            for (let i = 0, l = tracks.length; i < l; i++) {
                const track = tracks[i];
                if (track.kind !== this.kind_ && track.mode === 'showing') {
                    disabled = true;
                    break;
                }
            }
            if (disabled) {
                this.disable();
            } else {
                this.enable();
            }
        }
        buildCSSClass() {
            return `vjs-descriptions-button ${ super.buildCSSClass() }`;
        }
        buildWrapperCSSClass() {
            return `vjs-descriptions-button ${ super.buildWrapperCSSClass() }`;
        }
    }
    DescriptionsButton.prototype.kind_ = 'descriptions';
    DescriptionsButton.prototype.controlText_ = 'Descriptions';
    Component.registerComponent('DescriptionsButton', DescriptionsButton);
    return DescriptionsButton;
});
define('skylark-videojs/control-bar/text-track-controls/subtitles-button',[
    './text-track-button',
    '../../component'
], function (TextTrackButton, Component) {
    'use strict';
    class SubtitlesButton extends TextTrackButton {
        constructor(player, options, ready) {
            super(player, options, ready);
        }
        buildCSSClass() {
            return `vjs-subtitles-button ${ super.buildCSSClass() }`;
        }
        buildWrapperCSSClass() {
            return `vjs-subtitles-button ${ super.buildWrapperCSSClass() }`;
        }
    }
    SubtitlesButton.prototype.kind_ = 'subtitles';
    SubtitlesButton.prototype.controlText_ = 'Subtitles';
    Component.registerComponent('SubtitlesButton', SubtitlesButton);
    return SubtitlesButton;
});
define('skylark-videojs/control-bar/text-track-controls/caption-settings-menu-item',[
    './text-track-menu-item',
    '../../component'
], function (TextTrackMenuItem, Component) {
    'use strict';
    class CaptionSettingsMenuItem extends TextTrackMenuItem {
        constructor(player, options) {
            options.track = {
                player,
                kind: options.kind,
                label: options.kind + ' settings',
                selectable: false,
                default: false,
                mode: 'disabled'
            };
            options.selectable = false;
            options.name = 'CaptionSettingsMenuItem';
            super(player, options);
            this.addClass('vjs-texttrack-settings');
            this.controlText(', opens ' + options.kind + ' settings dialog');
        }
        handleClick(event) {
            this.player().getChild('textTrackSettings').open();
        }
    }
    Component.registerComponent('CaptionSettingsMenuItem', CaptionSettingsMenuItem);
    return CaptionSettingsMenuItem;
});
define('skylark-videojs/control-bar/text-track-controls/captions-button',[
    './text-track-button',
    '../../component',
    './caption-settings-menu-item'
], function (TextTrackButton, Component, CaptionSettingsMenuItem) {
    'use strict';
    class CaptionsButton extends TextTrackButton {
        constructor(player, options, ready) {
            super(player, options, ready);
        }
        buildCSSClass() {
            return `vjs-captions-button ${ super.buildCSSClass() }`;
        }
        buildWrapperCSSClass() {
            return `vjs-captions-button ${ super.buildWrapperCSSClass() }`;
        }
        createItems() {
            const items = [];
            if (!(this.player().tech_ && this.player().tech_.featuresNativeTextTracks) && this.player().getChild('textTrackSettings')) {
                items.push(new CaptionSettingsMenuItem(this.player_, { kind: this.kind_ }));
                this.hideThreshold_ += 1;
            }
            return super.createItems(items);
        }
    }
    CaptionsButton.prototype.kind_ = 'captions';
    CaptionsButton.prototype.controlText_ = 'Captions';
    Component.registerComponent('CaptionsButton', CaptionsButton);
    return CaptionsButton;
});
define('skylark-videojs/control-bar/text-track-controls/subs-caps-menu-item',[
    './text-track-menu-item',
    '../../component',
    '../../utils/obj'
], function (TextTrackMenuItem, Component, obj) {
    'use strict';
    class SubsCapsMenuItem extends TextTrackMenuItem {
        createEl(type, props, attrs) {
            let innerHTML = `<span class="vjs-menu-item-text">${ this.localize(this.options_.label) }`;
            if (this.options_.track.kind === 'captions') {
                innerHTML += `
        <span aria-hidden="true" class="vjs-icon-placeholder"></span>
        <span class="vjs-control-text"> ${ this.localize('Captions') }</span>
      `;
            }
            innerHTML += '</span>';
            const el = super.createEl(type, obj.assign({ innerHTML }, props), attrs);
            return el;
        }
    }
    Component.registerComponent('SubsCapsMenuItem', SubsCapsMenuItem);
    return SubsCapsMenuItem;
});
define('skylark-videojs/control-bar/text-track-controls/subs-caps-button',[
    './text-track-button',
    '../../component',
    './caption-settings-menu-item',
    './subs-caps-menu-item',
    '../../utils/string-cases'
], function (TextTrackButton, Component, CaptionSettingsMenuItem, SubsCapsMenuItem, stringCases) {
    'use strict';
    class SubsCapsButton extends TextTrackButton {
        constructor(player, options = {}) {
            super(player, options);
            this.label_ = 'subtitles';
            if ([
                    'en',
                    'en-us',
                    'en-ca',
                    'fr-ca'
                ].indexOf(this.player_.language_) > -1) {
                this.label_ = 'captions';
            }
            this.menuButton_.controlText(stringCases.toTitleCase(this.label_));
        }
        buildCSSClass() {
            return `vjs-subs-caps-button ${ super.buildCSSClass() }`;
        }
        buildWrapperCSSClass() {
            return `vjs-subs-caps-button ${ super.buildWrapperCSSClass() }`;
        }
        createItems() {
            let items = [];
            if (!(this.player().tech_ && this.player().tech_.featuresNativeTextTracks) && this.player().getChild('textTrackSettings')) {
                items.push(new CaptionSettingsMenuItem(this.player_, { kind: this.label_ }));
                this.hideThreshold_ += 1;
            }
            items = super.createItems(items, SubsCapsMenuItem);
            return items;
        }
    }
    SubsCapsButton.prototype.kinds_ = [
        'captions',
        'subtitles'
    ];
    SubsCapsButton.prototype.controlText_ = 'Subtitles';
    Component.registerComponent('SubsCapsButton', SubsCapsButton);
    return SubsCapsButton;
});
define('skylark-videojs/control-bar/audio-track-controls/audio-track-menu-item',[
    '../../menu/menu-item',
    '../../component',
    '../../utils/obj'
], function (MenuItem, Component, obj) {
    'use strict';
    class AudioTrackMenuItem extends MenuItem {
        constructor(player, options) {
            const track = options.track;
            const tracks = player.audioTracks();
            options.label = track.label || track.language || 'Unknown';
            options.selected = track.enabled;
            super(player, options);
            this.track = track;
            this.addClass(`vjs-${ track.kind }-menu-item`);
            const changeHandler = (...args) => {
                this.handleTracksChange.apply(this, args);
            };
            tracks.addEventListener('change', changeHandler);
            this.listenTo('dispose', () => {
                tracks.removeEventListener('change', changeHandler);
            });
        }
        createEl(type, props, attrs) {
            let innerHTML = `<span class="vjs-menu-item-text">${ this.localize(this.options_.label) }`;
            if (this.options_.track.kind === 'main-desc') {
                innerHTML += `
        <span aria-hidden="true" class="vjs-icon-placeholder"></span>
        <span class="vjs-control-text"> ${ this.localize('Descriptions') }</span>
      `;
            }
            innerHTML += '</span>';
            const el = super.createEl(type, obj.assign({ innerHTML }, props), attrs);
            return el;
        }
        handleClick(event) {
            const tracks = this.player_.audioTracks();
            super.handleClick(event);
            for (let i = 0; i < tracks.length; i++) {
                const track = tracks[i];
                track.enabled = track === this.track;
            }
        }
        handleTracksChange(event) {
            this.selected(this.track.enabled);
        }
    }
    Component.registerComponent('AudioTrackMenuItem', AudioTrackMenuItem);
    return AudioTrackMenuItem;
});
define('skylark-videojs/control-bar/audio-track-controls/audio-track-button',[
    '../track-button',
    '../../component',
    './audio-track-menu-item'
], function (TrackButton, Component, AudioTrackMenuItem) {
    'use strict';
    class AudioTrackButton extends TrackButton {
        constructor(player, options = {}) {
            options.tracks = player.audioTracks();
            super(player, options);
        }
        buildCSSClass() {
            return `vjs-audio-button ${ super.buildCSSClass() }`;
        }
        buildWrapperCSSClass() {
            return `vjs-audio-button ${ super.buildWrapperCSSClass() }`;
        }
        createItems(items = []) {
            this.hideThreshold_ = 1;
            const tracks = this.player_.audioTracks();
            for (let i = 0; i < tracks.length; i++) {
                const track = tracks[i];
                items.push(new AudioTrackMenuItem(this.player_, {
                    track,
                    selectable: true,
                    multiSelectable: false
                }));
            }
            return items;
        }
    }
    AudioTrackButton.prototype.controlText_ = 'Audio Track';
    Component.registerComponent('AudioTrackButton', AudioTrackButton);
    return AudioTrackButton;
});
define('skylark-videojs/control-bar/playback-rate-menu/playback-rate-menu-item',[
    '../../menu/menu-item',
    '../../component'
], function (MenuItem, Component) {
    'use strict';
    class PlaybackRateMenuItem extends MenuItem {
        constructor(player, options) {
            const label = options.rate;
            const rate = parseFloat(label, 10);
            options.label = label;
            options.selected = rate === 1;
            options.selectable = true;
            options.multiSelectable = false;
            super(player, options);
            this.label = label;
            this.rate = rate;
            this.listenTo(player, 'ratechange', this.update);
        }
        handleClick(event) {
            super.handleClick();
            this.player().playbackRate(this.rate);
        }
        update(event) {
            this.selected(this.player().playbackRate() === this.rate);
        }
    }
    PlaybackRateMenuItem.prototype.contentElType = 'button';
    Component.registerComponent('PlaybackRateMenuItem', PlaybackRateMenuItem);
    return PlaybackRateMenuItem;
});
define('skylark-videojs/control-bar/playback-rate-menu/playback-rate-menu-button',[
    '../../menu/menu-button',
    '../../menu/menu',
    './playback-rate-menu-item',
    '../../component',
    '../../utils/dom'
], function (MenuButton, Menu, PlaybackRateMenuItem, Component, Dom) {
    'use strict';
    class PlaybackRateMenuButton extends MenuButton {
        constructor(player, options) {
            super(player, options);
            this.updateVisibility();
            this.updateLabel();
            this.listenTo(player, 'loadstart', this.updateVisibility);
            this.listenTo(player, 'ratechange', this.updateLabel);
        }
        createEl() {
            const el = super.createEl();
            this.labelEl_ = Dom.createEl('div', {
                className: 'vjs-playback-rate-value',
                innerHTML: '1x'
            });
            el.appendChild(this.labelEl_);
            return el;
        }
        dispose() {
            this.labelEl_ = null;
            super.dispose();
        }
        buildCSSClass() {
            return `vjs-playback-rate ${ super.buildCSSClass() }`;
        }
        buildWrapperCSSClass() {
            return `vjs-playback-rate ${ super.buildWrapperCSSClass() }`;
        }
        createMenu() {
            const menu = new Menu(this.player());
            const rates = this.playbackRates();
            if (rates) {
                for (let i = rates.length - 1; i >= 0; i--) {
                    menu.addChild(new PlaybackRateMenuItem(this.player(), { rate: rates[i] + 'x' }));
                }
            }
            return menu;
        }
        updateARIAAttributes() {
            this.el().setAttribute('aria-valuenow', this.player().playbackRate());
        }
        handleClick(event) {
            const currentRate = this.player().playbackRate();
            const rates = this.playbackRates();
            let newRate = rates[0];
            for (let i = 0; i < rates.length; i++) {
                if (rates[i] > currentRate) {
                    newRate = rates[i];
                    break;
                }
            }
            this.player().playbackRate(newRate);
        }
        playbackRates() {
            return this.options_.playbackRates || this.options_.playerOptions && this.options_.playerOptions.playbackRates;
        }
        playbackRateSupported() {
            return this.player().tech_ && this.player().tech_.featuresPlaybackRate && this.playbackRates() && this.playbackRates().length > 0;
        }
        updateVisibility(event) {
            if (this.playbackRateSupported()) {
                this.removeClass('vjs-hidden');
            } else {
                this.addClass('vjs-hidden');
            }
        }
        updateLabel(event) {
            if (this.playbackRateSupported()) {
                this.labelEl_.innerHTML = this.player().playbackRate() + 'x';
            }
        }
    }
    PlaybackRateMenuButton.prototype.controlText_ = 'Playback Rate';
    Component.registerComponent('PlaybackRateMenuButton', PlaybackRateMenuButton);
    return PlaybackRateMenuButton;
});
define('skylark-videojs/control-bar/spacer-controls/spacer',[
    '../../component'
], function (Component) {
    'use strict';
    class Spacer extends Component {
        buildCSSClass() {
            return `vjs-spacer ${ super.buildCSSClass() }`;
        }
        createEl() {
            return super.createEl('div', { className: this.buildCSSClass() });
        }
    }
    Component.registerComponent('Spacer', Spacer);
    return Spacer;
});
define('skylark-videojs/control-bar/spacer-controls/custom-control-spacer',[
    './spacer',
    '../../component'
], function (Spacer, Component) {
    'use strict';
    class CustomControlSpacer extends Spacer {
        buildCSSClass() {
            return `vjs-custom-control-spacer ${ super.buildCSSClass() }`;
        }
        createEl() {
            const el = super.createEl({ className: this.buildCSSClass() });
            el.innerHTML = '\xA0';
            return el;
        }
    }
    Component.registerComponent('CustomControlSpacer', CustomControlSpacer);
    return CustomControlSpacer;
});
define('skylark-videojs/control-bar/control-bar',[
    'skylark-langx-globals/document',
    '../component',
    './play-toggle',
    './time-controls/current-time-display',
    './time-controls/duration-display',
    './time-controls/time-divider',
    './time-controls/remaining-time-display',
    './live-display',
    './seek-to-live',
    './progress-control/progress-control',
    './picture-in-picture-toggle',
    './fullscreen-toggle',
    './volume-panel',
    './text-track-controls/chapters-button',
    './text-track-controls/descriptions-button',
    './text-track-controls/subtitles-button',
    './text-track-controls/captions-button',
    './text-track-controls/subs-caps-button',
    './audio-track-controls/audio-track-button',
    './playback-rate-menu/playback-rate-menu-button',
    './spacer-controls/custom-control-spacer'
], function (document,Component) {
    'use strict';
    class ControlBar extends Component {
        createEl() {
            return super.createEl('div', {
                className: 'vjs-control-bar',
                dir: 'ltr'
            });
        }
    }
    ControlBar.prototype.options_ = {
        children: [
            'playToggle',
            'volumePanel',
            'currentTimeDisplay',
            'timeDivider',
            'durationDisplay',
            'progressControl',
            'liveDisplay',
            'seekToLive',
            'remainingTimeDisplay',
            'customControlSpacer',
            'playbackRateMenuButton',
            'chaptersButton',
            'descriptionsButton',
            'subsCapsButton',
            'audioTrackButton',
            'fullscreenToggle'
        ]
    };
    if ('exitPictureInPicture' in document) {
        ControlBar.prototype.options_.children.splice(ControlBar.prototype.options_.children.length - 1, 0, 'pictureInPictureToggle');
    }
    Component.registerComponent('ControlBar', ControlBar);
    return ControlBar;
});
define('skylark-videojs/error-display',[
    './component',
    './modal-dialog'
], function (Component, ModalDialog) {
    'use strict';
    class ErrorDisplay extends ModalDialog {
        constructor(player, options) {
            super(player, options);
            this.listenTo(player, 'error', this.open);
        }
        buildCSSClass() {
            return `vjs-error-display ${ super.buildCSSClass() }`;
        }
        content() {
            const error = this.player().error();
            return error ? this.localize(error.message) : '';
        }
    }
    ErrorDisplay.prototype.options_ = Object.assign({}, ModalDialog.prototype.options_, {
        pauseOnOpen: false,
        fillAlways: true,
        temporary: false,
        uncloseable: true
    });
    Component.registerComponent('ErrorDisplay', ErrorDisplay);
    return ErrorDisplay;
});
define('skylark-videojs/tracks/text-track-settings',[
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
            this.listenTo(this.$('.vjs-done-button'), 'click', () => {
                this.saveSettings();
                this.close();
            });
            this.listenTo(this.$('.vjs-default-button'), 'click', () => {
                this.setDefaults();
                this.updateDisplay();
            });
            Obj.each(selectConfigs, config => {
                this.listenTo(this.$(config.selector), 'change', this.updateDisplay);
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
define('skylark-videojs/resize-manager',[
    './utils/fn',
    './utils/events',
    './utils/merge-options',
    './component'
], function ( Fn, Events, mergeOptions, Component) {
    'use strict';
    class ResizeManager extends Component {
        constructor(player, options) {
            let RESIZE_OBSERVER_AVAILABLE = options.ResizeObserver || window.ResizeObserver;
            if (options.ResizeObserver === null) {
                RESIZE_OBSERVER_AVAILABLE = false;
            }
            const options_ = mergeOptions({
                createEl: !RESIZE_OBSERVER_AVAILABLE,
                reportTouchActivity: false
            }, options);
            super(player, options_);
            this.ResizeObserver = options.ResizeObserver || window.ResizeObserver;
            this.loadListener_ = null;
            this.resizeObserver_ = null;
            this.debouncedHandler_ = Fn.debounce(() => {
                this.resizeHandler();
            }, 100, false, this);
            if (RESIZE_OBSERVER_AVAILABLE) {
                this.resizeObserver_ = new this.ResizeObserver(this.debouncedHandler_);
                this.resizeObserver_.observe(player.el());
            } else {
                this.loadListener_ = () => {
                    if (!this.el_ || !this.el_.contentWindow) {
                        return;
                    }
                    const debouncedHandler_ = this.debouncedHandler_;
                    let unloadListener_ = this.unloadListener_ = function () {
                        Events.off(this, 'resize', debouncedHandler_);
                        Events.off(this, 'unload', unloadListener_);
                        unloadListener_ = null;
                    };
                    Events.on(this.el_.contentWindow, 'unload', unloadListener_);
                    Events.on(this.el_.contentWindow, 'resize', debouncedHandler_);
                };
                this.listenToOnce('load', this.loadListener_);
            }
        }
        createEl() {
            return super.createEl('iframe', {
                className: 'vjs-resize-manager',
                tabIndex: -1
            }, { 'aria-hidden': 'true' });
        }
        resizeHandler() {
            if (!this.player_ || !this.player_.trigger) {
                return;
            }
            this.player_.trigger('playerresize');
        }
        dispose() {
            if (this.debouncedHandler_) {
                this.debouncedHandler_.cancel();
            }
            if (this.resizeObserver_) {
                if (this.player_.el()) {
                    this.resizeObserver_.unobserve(this.player_.el());
                }
                this.resizeObserver_.disconnect();
            }
            if (this.loadListener_) {
                this.unlistenTo('load', this.loadListener_);
            }
            if (this.el_ && this.el_.contentWindow && this.unloadListener_) {
                this.unloadListener_.call(this.el_.contentWindow);
            }
            this.ResizeObserver = null;
            this.resizeObserver = null;
            this.debouncedHandler_ = null;
            this.loadListener_ = null;
            super.dispose();
        }
    }
    Component.registerComponent('ResizeManager', ResizeManager);
    return ResizeManager;
});
define('skylark-videojs/live-tracker',[
    './component',
    './utils/merge-options',
    './utils/browser',
    './utils/fn'
], function (Component, mergeOptions, browser,  Fn) {
    'use strict';
    const defaults = {
        trackingThreshold: 30,
        liveTolerance: 15
    };
    class LiveTracker extends Component {
        constructor(player, options) {
            const options_ = mergeOptions(defaults, options, { createEl: false });
            super(player, options_);
            this.reset_();
            this.listenTo(this.player_, 'durationchange', this.handleDurationchange);
            if (browser.IE_VERSION && 'hidden' in document && 'visibilityState' in document) {
                this.listenTo(document, 'visibilitychange', this.handleVisibilityChange);
            }
        }
        handleVisibilityChange() {
            if (this.player_.duration() !== Infinity) {
                return;
            }
            if (document.hidden) {
                this.stopTracking();
            } else {
                this.startTracking();
            }
        }
        trackLive_() {
            const seekable = this.player_.seekable();
            if (!seekable || !seekable.length) {
                return;
            }
            const newTime = Number(window.performance.now().toFixed(4));
            const deltaTime = this.lastTime_ === -1 ? 0 : (newTime - this.lastTime_) / 1000;
            this.lastTime_ = newTime;
            this.pastSeekEnd_ = this.pastSeekEnd() + deltaTime;
            const liveCurrentTime = this.liveCurrentTime();
            const currentTime = this.player_.currentTime();
            let isBehind = this.player_.paused() || this.seekedBehindLive_ || Math.abs(liveCurrentTime - currentTime) > this.options_.liveTolerance;
            if (!this.timeupdateSeen_ || liveCurrentTime === Infinity) {
                isBehind = false;
            }
            if (isBehind !== this.behindLiveEdge_) {
                this.behindLiveEdge_ = isBehind;
                this.trigger('liveedgechange');
            }
        }
        handleDurationchange() {
            if (this.player_.duration() === Infinity && this.liveWindow() >= this.options_.trackingThreshold) {
                if (this.player_.options_.liveui) {
                    this.player_.addClass('vjs-liveui');
                }
                this.startTracking();
            } else {
                this.player_.removeClass('vjs-liveui');
                this.stopTracking();
            }
        }
        startTracking() {
            if (this.isTracking()) {
                return;
            }
            if (!this.timeupdateSeen_) {
                this.timeupdateSeen_ = this.player_.hasStarted();
            }
            this.trackingInterval_ = this.setInterval(this.trackLive_, Fn.UPDATE_REFRESH_INTERVAL);
            this.trackLive_();
            this.listenTo(this.player_, [
                'play',
                'pause'
            ], this.trackLive_);
            if (!this.timeupdateSeen_) {
                this.listenToOnce(this.player_, 'play', this.handlePlay);
                this.listenToOnce(this.player_, 'timeupdate', this.handleFirstTimeupdate);
            } else {
                this.listenTo(this.player_, 'seeked', this.handleSeeked);
            }
        }
        handleFirstTimeupdate() {
            this.timeupdateSeen_ = true;
            this.listenTo(this.player_, 'seeked', this.handleSeeked);
        }
        handleSeeked() {
            const timeDiff = Math.abs(this.liveCurrentTime() - this.player_.currentTime());
            this.seekedBehindLive_ = this.skipNextSeeked_ ? false : timeDiff > 2;
            this.skipNextSeeked_ = false;
            this.trackLive_();
        }
        handlePlay() {
            this.listenToOnce(this.player_, 'timeupdate', this.seekToLiveEdge);
        }
        reset_() {
            this.lastTime_ = -1;
            this.pastSeekEnd_ = 0;
            this.lastSeekEnd_ = -1;
            this.behindLiveEdge_ = true;
            this.timeupdateSeen_ = false;
            this.seekedBehindLive_ = false;
            this.skipNextSeeked_ = false;
            this.clearInterval(this.trackingInterval_);
            this.trackingInterval_ = null;

            /*
            this.unlistenTo(this.player_, [
                'play',
                'pause'
            ], this.trackLive_);
            this.unlistenTo(this.player_, 'seeked', this.handleSeeked);
            this.unlistenTo(this.player_, 'play', this.handlePlay);
            this.unlistenTo(this.player_, 'timeupdate', this.handleFirstTimeupdate);
            this.unlistenTo(this.player_, 'timeupdate', this.seekToLiveEdge);
            */
            this.unlistenTo(this.player_, [
                'play',
                'pause'
            ], this.trackLive_);
            this.unlistenTo(this.player_, 'seeked', this.handleSeeked);
            this.unlistenTo(this.player_, 'play', this.handlePlay);
            this.unlistenTo(this.player_, 'timeupdate', this.handleFirstTimeupdate);
            this.unlistenTo(this.player_, 'timeupdate', this.seekToLiveEdge);
        }
        stopTracking() {
            if (!this.isTracking()) {
                return;
            }
            this.reset_();
            this.trigger('liveedgechange');
        }
        seekableEnd() {
            const seekable = this.player_.seekable();
            const seekableEnds = [];
            let i = seekable ? seekable.length : 0;
            while (i--) {
                seekableEnds.push(seekable.end(i));
            }
            return seekableEnds.length ? seekableEnds.sort()[seekableEnds.length - 1] : Infinity;
        }
        seekableStart() {
            const seekable = this.player_.seekable();
            const seekableStarts = [];
            let i = seekable ? seekable.length : 0;
            while (i--) {
                seekableStarts.push(seekable.start(i));
            }
            return seekableStarts.length ? seekableStarts.sort()[0] : 0;
        }
        liveWindow() {
            const liveCurrentTime = this.liveCurrentTime();
            if (liveCurrentTime === Infinity) {
                return 0;
            }
            return liveCurrentTime - this.seekableStart();
        }
        isLive() {
            return this.isTracking();
        }
        atLiveEdge() {
            return !this.behindLiveEdge();
        }
        liveCurrentTime() {
            return this.pastSeekEnd() + this.seekableEnd();
        }
        pastSeekEnd() {
            const seekableEnd = this.seekableEnd();
            if (this.lastSeekEnd_ !== -1 && seekableEnd !== this.lastSeekEnd_) {
                this.pastSeekEnd_ = 0;
            }
            this.lastSeekEnd_ = seekableEnd;
            return this.pastSeekEnd_;
        }
        behindLiveEdge() {
            return this.behindLiveEdge_;
        }
        isTracking() {
            return typeof this.trackingInterval_ === 'number';
        }
        seekToLiveEdge() {
            this.seekedBehindLive_ = false;
            if (this.atLiveEdge()) {
                return;
            }
            this.skipNextSeeked_ = true;
            this.player_.currentTime(this.liveCurrentTime());
        }
        dispose() {
            this.unlistenTo(document, 'visibilitychange', this.handleVisibilityChange);
            this.stopTracking();
            super.dispose();
        }
    }
    Component.registerComponent('LiveTracker', LiveTracker);
    return LiveTracker;
});
define('skylark-videojs/tech/setup-sourceset',[
    'skylark-langx-globals/document',
    '../utils/merge-options',
    '../utils/url'
], function (document,mergeOptions, url) {
    'use strict';
    const sourcesetLoad = tech => {
        const el = tech.el();
        if (el.hasAttribute('src')) {
            tech.triggerSourceset(el.src);
            return true;
        }
        const sources = tech.$$('source');
        const srcUrls = [];
        let src = '';
        if (!sources.length) {
            return false;
        }
        for (let i = 0; i < sources.length; i++) {
            const url = sources[i].src;
            if (url && srcUrls.indexOf(url) === -1) {
                srcUrls.push(url);
            }
        }
        if (!srcUrls.length) {
            return false;
        }
        if (srcUrls.length === 1) {
            src = srcUrls[0];
        }
        tech.triggerSourceset(src);
        return true;
    };
    const innerHTMLDescriptorPolyfill = Object.defineProperty({}, 'innerHTML', {
        get() {
            return this.cloneNode(true).innerHTML;
        },
        set(v) {
            const dummy = document.createElement(this.nodeName.toLowerCase());
            dummy.innerHTML = v;
            const docFrag = document.createDocumentFragment();
            while (dummy.childNodes.length) {
                docFrag.appendChild(dummy.childNodes[0]);
            }
            this.innerText = '';
            window.Element.prototype.appendChild.call(this, docFrag);
            return this.innerHTML;
        }
    });
    const getDescriptor = (priority, prop) => {
        let descriptor = {};
        for (let i = 0; i < priority.length; i++) {
            descriptor = Object.getOwnPropertyDescriptor(priority[i], prop);
            if (descriptor && descriptor.set && descriptor.get) {
                break;
            }
        }
        descriptor.enumerable = true;
        descriptor.configurable = true;
        return descriptor;
    };
    const getInnerHTMLDescriptor = tech => getDescriptor([
        tech.el(),
        window.HTMLMediaElement.prototype,
        window.Element.prototype,
        innerHTMLDescriptorPolyfill
    ], 'innerHTML');
    const firstSourceWatch = function (tech) {
        const el = tech.el();
        if (el.resetSourceWatch_) {
            return;
        }
        const old = {};
        const innerDescriptor = getInnerHTMLDescriptor(tech);
        const appendWrapper = appendFn => (...args) => {
            const retval = appendFn.apply(el, args);
            sourcesetLoad(tech);
            return retval;
        };
        [
            'append',
            'appendChild',
            'insertAdjacentHTML'
        ].forEach(k => {
            if (!el[k]) {
                return;
            }
            old[k] = el[k];
            el[k] = appendWrapper(old[k]);
        });
        Object.defineProperty(el, 'innerHTML', mergeOptions(innerDescriptor, { set: appendWrapper(innerDescriptor.set) }));
        el.resetSourceWatch_ = () => {
            el.resetSourceWatch_ = null;
            Object.keys(old).forEach(k => {
                el[k] = old[k];
            });
            Object.defineProperty(el, 'innerHTML', innerDescriptor);
        };
        tech.one('sourceset', el.resetSourceWatch_);
    };
    const srcDescriptorPolyfill = Object.defineProperty({}, 'src', {
        get() {
            if (this.hasAttribute('src')) {
                return url.getAbsoluteURL(window.Element.prototype.getAttribute.call(this, 'src'));
            }
            return '';
        },
        set(v) {
            window.Element.prototype.setAttribute.call(this, 'src', v);
            return v;
        }
    });
    const getSrcDescriptor = tech => getDescriptor([
        tech.el(),
        window.HTMLMediaElement.prototype,
        srcDescriptorPolyfill
    ], 'src');
    const setupSourceset = function (tech) {
        if (!tech.featuresSourceset) {
            return;
        }
        const el = tech.el();
        if (el.resetSourceset_) {
            return;
        }
        const srcDescriptor = getSrcDescriptor(tech);
        const oldSetAttribute = el.setAttribute;
        const oldLoad = el.load;
        Object.defineProperty(el, 'src', mergeOptions(srcDescriptor, {
            set: v => {
                const retval = srcDescriptor.set.call(el, v);
                tech.triggerSourceset(el.src);
                return retval;
            }
        }));
        el.setAttribute = (n, v) => {
            const retval = oldSetAttribute.call(el, n, v);
            if (/src/i.test(n)) {
                tech.triggerSourceset(el.src);
            }
            return retval;
        };
        el.load = () => {
            const retval = oldLoad.call(el);
            if (!sourcesetLoad(tech)) {
                tech.triggerSourceset('');
                firstSourceWatch(tech);
            }
            return retval;
        };
        if (el.currentSrc) {
            tech.triggerSourceset(el.currentSrc);
        } else if (!sourcesetLoad(tech)) {
            firstSourceWatch(tech);
        }
        el.resetSourceset_ = () => {
            el.resetSourceset_ = null;
            el.load = oldLoad;
            el.setAttribute = oldSetAttribute;
            Object.defineProperty(el, 'src', srcDescriptor);
            if (el.resetSourceWatch_) {
                el.resetSourceWatch_();
            }
        };
    };
    return setupSourceset;
});
define('skylark-videojs/utils/define-lazy-property',[],function () {
    'use strict';
    const defineLazyProperty = function (obj, key, getValue, setter = true) {
        const set = value => Object.defineProperty(obj, key, {
            value,
            enumerable: true,
            writable: true
        });
        const options = {
            configurable: true,
            enumerable: true,
            get() {
                const value = getValue();
                set(value);
                return value;
            }
        };
        if (setter) {
            options.set = set;
        }
        return Object.defineProperty(obj, key, options);
    };
    return defineLazyProperty;
});
define('skylark-videojs/tech/html5',[
    'skylark-langx-globals/document',
    './tech',
    '../utils/dom',
    '../utils/url',
    '../utils/log',
    '../utils/browser',
    '../utils/obj',
    '../utils/merge-options',
    '../utils/string-cases',
    '../tracks/track-types',
    './setup-sourceset',
    '../utils/define-lazy-property',
    '../utils/promise'
], function (
    document,
    Tech, 
    Dom, 
    Url, 
    log, 
    browser,  
    obj, 
    mergeOptions, 
    stringCases, 
    TRACK_TYPES, 
    setupSourceset, 
    defineLazyProperty, 
    promise
) {
    'use strict';
    const NORMAL = TRACK_TYPES.NORMAL,
          REMOTE = TRACK_TYPES.REMOTE;

    class Html5 extends Tech {
        constructor(options, ready) {
            super(options, ready);
            const source = options.source;
            let crossoriginTracks = false;
            if (source && (this.el_.currentSrc !== source.src || options.tag && options.tag.initNetworkState_ === 3)) {
                this.setSource(source);
            } else {
                this.handleLateInit_(this.el_);
            }
            if (options.enableSourceset) {
                this.setupSourcesetHandling_();
            }
            this.isScrubbing_ = false;
            if (this.el_.hasChildNodes()) {
                const nodes = this.el_.childNodes;
                let nodesLength = nodes.length;
                const removeNodes = [];
                while (nodesLength--) {
                    const node = nodes[nodesLength];
                    const nodeName = node.nodeName.toLowerCase();
                    if (nodeName === 'track') {
                        if (!this.featuresNativeTextTracks) {
                            removeNodes.push(node);
                        } else {
                            this.remoteTextTrackEls().addTrackElement_(node);
                            this.remoteTextTracks().addTrack(node.track);
                            this.textTracks().addTrack(node.track);
                            if (!crossoriginTracks && !this.el_.hasAttribute('crossorigin') && Url.isCrossOrigin(node.src)) {
                                crossoriginTracks = true;
                            }
                        }
                    }
                }
                for (let i = 0; i < removeNodes.length; i++) {
                    this.el_.removeChild(removeNodes[i]);
                }
            }
            this.proxyNativeTracks_();
            if (this.featuresNativeTextTracks && crossoriginTracks) {
                log.warn("Text Tracks are being loaded from another origin but the crossorigin attribute isn't used.\n" + 'This may prevent text tracks from loading.');
            }
            this.restoreMetadataTracksInIOSNativePlayer_();
            if ((browser.TOUCH_ENABLED || browser.IS_IPHONE || browser.IS_NATIVE_ANDROID) && options.nativeControlsForTouch === true) {
                this.setControls(true);
            }
            this.proxyWebkitFullscreen_();
            this.triggerReady();
        }
        dispose() {
            if (this.el_ && this.el_.resetSourceset_) {
                this.el_.resetSourceset_();
            }
            Html5.disposeMediaElement(this.el_);
            this.options_ = null;
            super.dispose();
        }
        setupSourcesetHandling_() {
            setupSourceset(this);
        }
        restoreMetadataTracksInIOSNativePlayer_() {
            const textTracks = this.textTracks();
            let metadataTracksPreFullscreenState;
            const takeMetadataTrackSnapshot = () => {
                metadataTracksPreFullscreenState = [];
                for (let i = 0; i < textTracks.length; i++) {
                    const track = textTracks[i];
                    if (track.kind === 'metadata') {
                        metadataTracksPreFullscreenState.push({
                            track,
                            storedMode: track.mode
                        });
                    }
                }
            };
            takeMetadataTrackSnapshot();
            textTracks.addEventListener('change', takeMetadataTrackSnapshot);
            this.listenTo('dispose', () => textTracks.removeEventListener('change', takeMetadataTrackSnapshot));
            const restoreTrackMode = () => {
                for (let i = 0; i < metadataTracksPreFullscreenState.length; i++) {
                    const storedTrack = metadataTracksPreFullscreenState[i];
                    if (storedTrack.track.mode === 'disabled' && storedTrack.track.mode !== storedTrack.storedMode) {
                        storedTrack.track.mode = storedTrack.storedMode;
                    }
                }
                textTracks.removeEventListener('change', restoreTrackMode);
            };
            this.listenTo('webkitbeginfullscreen', () => {
                textTracks.removeEventListener('change', takeMetadataTrackSnapshot);
                textTracks.removeEventListener('change', restoreTrackMode);
                textTracks.addEventListener('change', restoreTrackMode);
            });
            this.listenTo('webkitendfullscreen', () => {
                textTracks.removeEventListener('change', takeMetadataTrackSnapshot);
                textTracks.addEventListener('change', takeMetadataTrackSnapshot);
                textTracks.removeEventListener('change', restoreTrackMode);
            });
        }
        overrideNative_(type, override) {
            if (override !== this[`featuresNative${ type }Tracks`]) {
                return;
            }
            const lowerCaseType = type.toLowerCase();
            if (this[`${ lowerCaseType }TracksListeners_`]) {
                Object.keys(this[`${ lowerCaseType }TracksListeners_`]).forEach(eventName => {
                    const elTracks = this.el()[`${ lowerCaseType }Tracks`];
                    elTracks.removeEventListener(eventName, this[`${ lowerCaseType }TracksListeners_`][eventName]);
                });
            }
            this[`featuresNative${ type }Tracks`] = !override;
            this[`${ lowerCaseType }TracksListeners_`] = null;
            this.proxyNativeTracksForType_(lowerCaseType);
        }
        overrideNativeAudioTracks(override) {
            this.overrideNative_('Audio', override);
        }
        overrideNativeVideoTracks(override) {
            this.overrideNative_('Video', override);
        }
        proxyNativeTracksForType_(name) {
            const props = NORMAL[name];
            const elTracks = this.el()[props.getterName];
            const techTracks = this[props.getterName]();
            if (!this[`featuresNative${ props.capitalName }Tracks`] || !elTracks || !elTracks.addEventListener) {
                return;
            }
            const listeners = {
                change: e => {
                    const event = {
                        type: 'change',
                        target: techTracks,
                        currentTarget: techTracks,
                        srcElement: techTracks
                    };
                    techTracks.trigger(event);
                    if (name === 'text') {
                        this[REMOTE.remoteText.getterName]().trigger(event);
                    }
                },
                addtrack(e) {
                    techTracks.addTrack(e.track);
                },
                removetrack(e) {
                    techTracks.removeTrack(e.track);
                }
            };
            const removeOldTracks = function () {
                const removeTracks = [];
                for (let i = 0; i < techTracks.length; i++) {
                    let found = false;
                    for (let j = 0; j < elTracks.length; j++) {
                        if (elTracks[j] === techTracks[i]) {
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        removeTracks.push(techTracks[i]);
                    }
                }
                while (removeTracks.length) {
                    techTracks.removeTrack(removeTracks.shift());
                }
            };
            this[props.getterName + 'Listeners_'] = listeners;
            Object.keys(listeners).forEach(eventName => {
                const listener = listeners[eventName];
                elTracks.addEventListener(eventName, listener);
                this.listenTo('dispose', e => elTracks.removeEventListener(eventName, listener));
            });
            this.listenTo('loadstart', removeOldTracks);
            this.listenTo('dispose', e => this.unlistenTo('loadstart', removeOldTracks));
        }
        proxyNativeTracks_() {
            NORMAL.names.forEach(name => {
                this.proxyNativeTracksForType_(name);
            });
        }
        createEl() {
            let el = this.options_.tag;
            if (!el || !(this.options_.playerElIngest || this.movingMediaElementInDOM)) {
                if (el) {
                    const clone = el.cloneNode(true);
                    if (el.parentNode) {
                        el.parentNode.insertBefore(clone, el);
                    }
                    Html5.disposeMediaElement(el);
                    el = clone;
                } else {
                    el = document.createElement('video');
                    const tagAttributes = this.options_.tag && Dom.getAttributes(this.options_.tag);
                    const attributes = mergeOptions({}, tagAttributes);
                    if (!browser.TOUCH_ENABLED || this.options_.nativeControlsForTouch !== true) {
                        delete attributes.controls;
                    }
                    Dom.setAttributes(el, obj.assign(attributes, {
                        id: this.options_.techId,
                        class: 'vjs-tech'
                    }));
                }
                el.playerId = this.options_.playerId;
            }
            if (typeof this.options_.preload !== 'undefined') {
                Dom.setAttribute(el, 'preload', this.options_.preload);
            }
            if (this.options_.disablePictureInPicture !== undefined) {
                el.disablePictureInPicture = this.options_.disablePictureInPicture;
            }
            const settingsAttrs = [
                'loop',
                'muted',
                'playsinline',
                'autoplay'
            ];
            for (let i = 0; i < settingsAttrs.length; i++) {
                const attr = settingsAttrs[i];
                const value = this.options_[attr];
                if (typeof value !== 'undefined') {
                    if (value) {
                        Dom.setAttribute(el, attr, attr);
                    } else {
                        Dom.removeAttribute(el, attr);
                    }
                    el[attr] = value;
                }
            }
            return el;
        }
        handleLateInit_(el) {
            if (el.networkState === 0 || el.networkState === 3) {
                return;
            }
            if (el.readyState === 0) {
                let loadstartFired = false;
                const setLoadstartFired = function () {
                    loadstartFired = true;
                };
                this.listenTo('loadstart', setLoadstartFired);
                const triggerLoadstart = function () {
                    if (!loadstartFired) {
                        this.trigger('loadstart');
                    }
                };
                this.listenTo('loadedmetadata', triggerLoadstart);
                this.ready(function () {
                    this.unlistenTo('loadstart', setLoadstartFired);
                    this.unlistenTo('loadedmetadata', triggerLoadstart);
                    if (!loadstartFired) {
                        this.trigger('loadstart');
                    }
                });
                return;
            }
            const eventsToTrigger = ['loadstart'];
            eventsToTrigger.push('loadedmetadata');
            if (el.readyState >= 2) {
                eventsToTrigger.push('loadeddata');
            }
            if (el.readyState >= 3) {
                eventsToTrigger.push('canplay');
            }
            if (el.readyState >= 4) {
                eventsToTrigger.push('canplaythrough');
            }
            this.ready(function () {
                eventsToTrigger.forEach(function (type) {
                    this.trigger(type);
                }, this);
            });
        }
        setScrubbing(isScrubbing) {
            this.isScrubbing_ = isScrubbing;
        }
        scrubbing() {
            return this.isScrubbing_;
        }
        setCurrentTime(seconds) {
            try {
                if (this.isScrubbing_ && this.el_.fastSeek && browser.IS_ANY_SAFARI) {
                    this.el_.fastSeek(seconds);
                } else {
                    this.el_.currentTime = seconds;
                }
            } catch (e) {
                log(e, 'Video is not ready. (Video.js)');
            }
        }
        duration() {
            if (this.el_.duration === Infinity && browser.IS_ANDROID && browser.IS_CHROME && this.el_.currentTime === 0) {
                const checkProgress = () => {
                    if (this.el_.currentTime > 0) {
                        if (this.el_.duration === Infinity) {
                            this.trigger('durationchange');
                        }
                        this.unlistenTo('timeupdate', checkProgress);
                    }
                };
                this.listenTo('timeupdate', checkProgress);
                return NaN;
            }
            return this.el_.duration || NaN;
        }
        width() {
            return this.el_.offsetWidth;
        }
        height() {
            return this.el_.offsetHeight;
        }
        proxyWebkitFullscreen_() {
            if (!('webkitDisplayingFullscreen' in this.el_)) {
                return;
            }
            const endFn = function () {
                this.trigger('fullscreenchange', { isFullscreen: false });
            };
            const beginFn = function () {
                if ('webkitPresentationMode' in this.el_ && this.el_.webkitPresentationMode !== 'picture-in-picture') {
                    this.listenToOnce('webkitendfullscreen', endFn);
                    this.trigger('fullscreenchange', {
                        isFullscreen: true,
                        nativeIOSFullscreen: true
                    });
                }
            };
            this.listenTo('webkitbeginfullscreen', beginFn);
            this.listenTo('dispose', () => {
                this.unlistenTo('webkitbeginfullscreen', beginFn);
                this.unlistenTo('webkitendfullscreen', endFn);
            });
        }
        supportsFullScreen() {
            if (typeof this.el_.webkitEnterFullScreen === 'function') {
                const userAgent = window.navigator && window.navigator.userAgent || '';
                if (/Android/.test(userAgent) || !/Chrome|Mac OS X 10.5/.test(userAgent)) {
                    return true;
                }
            }
            return false;
        }
        enterFullScreen() {
            const video = this.el_;
            if (video.paused && video.networkState <= video.HAVE_METADATA) {
                promise.silencePromise(this.el_.play());
                this.setTimeout(function () {
                    video.pause();
                    try {
                        video.webkitEnterFullScreen();
                    } catch (e) {
                        this.trigger('fullscreenerror', e);
                    }
                }, 0);
            } else {
                try {
                    video.webkitEnterFullScreen();
                } catch (e) {
                    this.trigger('fullscreenerror', e);
                }
            }
        }
        exitFullScreen() {
            if (!this.el_.webkitDisplayingFullscreen) {
                this.trigger('fullscreenerror', new Error('The video is not fullscreen'));
                return;
            }
            this.el_.webkitExitFullScreen();
        }
        requestPictureInPicture() {
            return this.el_.requestPictureInPicture();
        }
        src(src) {
            if (src === undefined) {
                return this.el_.src;
            }
            this.setSrc(src);
        }
        reset() {
            Html5.resetMediaElement(this.el_);
        }
        currentSrc() {
            if (this.currentSource_) {
                return this.currentSource_.src;
            }
            return this.el_.currentSrc;
        }
        setControls(val) {
            this.el_.controls = !!val;
        }
        addTextTrack(kind, label, language) {
            if (!this.featuresNativeTextTracks) {
                return super.addTextTrack(kind, label, language);
            }
            return this.el_.addTextTrack(kind, label, language);
        }
        createRemoteTextTrack(options) {
            if (!this.featuresNativeTextTracks) {
                return super.createRemoteTextTrack(options);
            }
            const htmlTrackElement = document.createElement('track');
            if (options.kind) {
                htmlTrackElement.kind = options.kind;
            }
            if (options.label) {
                htmlTrackElement.label = options.label;
            }
            if (options.language || options.srclang) {
                htmlTrackElement.srclang = options.language || options.srclang;
            }
            if (options.default) {
                htmlTrackElement.default = options.default;
            }
            if (options.id) {
                htmlTrackElement.id = options.id;
            }
            if (options.src) {
                htmlTrackElement.src = options.src;
            }
            return htmlTrackElement;
        }
        addRemoteTextTrack(options, manualCleanup) {
            const htmlTrackElement = super.addRemoteTextTrack(options, manualCleanup);
            if (this.featuresNativeTextTracks) {
                this.el().appendChild(htmlTrackElement);
            }
            return htmlTrackElement;
        }
        removeRemoteTextTrack(track) {
            super.removeRemoteTextTrack(track);
            if (this.featuresNativeTextTracks) {
                const tracks = this.$$('track');
                let i = tracks.length;
                while (i--) {
                    if (track === tracks[i] || track === tracks[i].track) {
                        this.el().removeChild(tracks[i]);
                    }
                }
            }
        }
        getVideoPlaybackQuality() {
            if (typeof this.el().getVideoPlaybackQuality === 'function') {
                return this.el().getVideoPlaybackQuality();
            }
            const videoPlaybackQuality = {};
            if (typeof this.el().webkitDroppedFrameCount !== 'undefined' && typeof this.el().webkitDecodedFrameCount !== 'undefined') {
                videoPlaybackQuality.droppedVideoFrames = this.el().webkitDroppedFrameCount;
                videoPlaybackQuality.totalVideoFrames = this.el().webkitDecodedFrameCount;
            }
            if (window.performance && typeof window.performance.now === 'function') {
                videoPlaybackQuality.creationTime = window.performance.now();
            } else if (window.performance && window.performance.timing && typeof window.performance.timing.navigationStart === 'number') {
                videoPlaybackQuality.creationTime = window.Date.now() - window.performance.timing.navigationStart;
            }
            return videoPlaybackQuality;
        }
    }
    defineLazyProperty(Html5, 'TEST_VID', function () {
        if (!Dom.isReal()) {
            return;
        }
        const video = document.createElement('video');
        const track = document.createElement('track');
        track.kind = 'captions';
        track.srclang = 'en';
        track.label = 'English';
        video.appendChild(track);
        return video;
    });
    Html5.isSupported = function () {
        try {
            Html5.TEST_VID.volume = 0.5;
        } catch (e) {
            return false;
        }
        return !!(Html5.TEST_VID && Html5.TEST_VID.canPlayType);
    };
    Html5.canPlayType = function (type) {
        return Html5.TEST_VID.canPlayType(type);
    };
    Html5.canPlaySource = function (srcObj, options) {
        return Html5.canPlayType(srcObj.type);
    };
    Html5.canControlVolume = function () {
        try {
            const volume = Html5.TEST_VID.volume;
            Html5.TEST_VID.volume = volume / 2 + 0.1;
            return volume !== Html5.TEST_VID.volume;
        } catch (e) {
            return false;
        }
    };
    Html5.canMuteVolume = function () {
        try {
            const muted = Html5.TEST_VID.muted;
            Html5.TEST_VID.muted = !muted;
            if (Html5.TEST_VID.muted) {
                Dom.setAttribute(Html5.TEST_VID, 'muted', 'muted');
            } else {
                Dom.removeAttribute(Html5.TEST_VID, 'muted', 'muted');
            }
            return muted !== Html5.TEST_VID.muted;
        } catch (e) {
            return false;
        }
    };
    Html5.canControlPlaybackRate = function () {
        if (browser.IS_ANDROID && browser.IS_CHROME && browser.CHROME_VERSION < 58) {
            return false;
        }
        try {
            const playbackRate = Html5.TEST_VID.playbackRate;
            Html5.TEST_VID.playbackRate = playbackRate / 2 + 0.1;
            return playbackRate !== Html5.TEST_VID.playbackRate;
        } catch (e) {
            return false;
        }
    };
    Html5.canOverrideAttributes = function () {
        try {
            const noop = () => {
            };
            Object.defineProperty(document.createElement('video'), 'src', {
                get: noop,
                set: noop
            });
            Object.defineProperty(document.createElement('audio'), 'src', {
                get: noop,
                set: noop
            });
            Object.defineProperty(document.createElement('video'), 'innerHTML', {
                get: noop,
                set: noop
            });
            Object.defineProperty(document.createElement('audio'), 'innerHTML', {
                get: noop,
                set: noop
            });
        } catch (e) {
            return false;
        }
        return true;
    };
    Html5.supportsNativeTextTracks = function () {
        return browser.IS_ANY_SAFARI || browser.IS_IOS && browser.IS_CHROME;
    };
    Html5.supportsNativeVideoTracks = function () {
        return !!(Html5.TEST_VID && Html5.TEST_VID.videoTracks);
    };
    Html5.supportsNativeAudioTracks = function () {
        return !!(Html5.TEST_VID && Html5.TEST_VID.audioTracks);
    };
    Html5.Events = [
        'loadstart',
        'suspend',
        'abort',
        'error',
        'emptied',
        'stalled',
        'loadedmetadata',
        'loadeddata',
        'canplay',
        'canplaythrough',
        'playing',
        'waiting',
        'seeking',
        'seeked',
        'ended',
        'durationchange',
        'timeupdate',
        'progress',
        'play',
        'pause',
        'ratechange',
        'resize',
        'volumechange'
    ];
    [
        [
            'featuresVolumeControl',
            'canControlVolume'
        ],
        [
            'featuresMuteControl',
            'canMuteVolume'
        ],
        [
            'featuresPlaybackRate',
            'canControlPlaybackRate'
        ],
        [
            'featuresSourceset',
            'canOverrideAttributes'
        ],
        [
            'featuresNativeTextTracks',
            'supportsNativeTextTracks'
        ],
        [
            'featuresNativeVideoTracks',
            'supportsNativeVideoTracks'
        ],
        [
            'featuresNativeAudioTracks',
            'supportsNativeAudioTracks'
        ]
    ].forEach(function ([key, fn]) {
        defineLazyProperty(Html5.prototype, key, () => Html5[fn](), true);
    });
    Html5.prototype.movingMediaElementInDOM = !browser.IS_IOS;
    Html5.prototype.featuresFullscreenResize = true;
    Html5.prototype.featuresProgressEvents = true;
    Html5.prototype.featuresTimeupdateEvents = true;
    let canPlayType;
    Html5.patchCanPlayType = function () {
        if (browser.ANDROID_VERSION >= 4 && !browser.IS_FIREFOX && !browser.IS_CHROME) {
            canPlayType = Html5.TEST_VID && Html5.TEST_VID.constructor.prototype.canPlayType;
            Html5.TEST_VID.constructor.prototype.canPlayType = function (type) {
                const mpegurlRE = /^application\/(?:x-|vnd\.apple\.)mpegurl/i;
                if (type && mpegurlRE.test(type)) {
                    return 'maybe';
                }
                return canPlayType.call(this, type);
            };
        }
    };
    Html5.unpatchCanPlayType = function () {
        const r = Html5.TEST_VID.constructor.prototype.canPlayType;
        if (canPlayType) {
            Html5.TEST_VID.constructor.prototype.canPlayType = canPlayType;
        }
        return r;
    };
    Html5.patchCanPlayType();
    Html5.disposeMediaElement = function (el) {
        if (!el) {
            return;
        }
        if (el.parentNode) {
            el.parentNode.removeChild(el);
        }
        while (el.hasChildNodes()) {
            el.removeChild(el.firstChild);
        }
        el.removeAttribute('src');
        if (typeof el.load === 'function') {
            (function () {
                try {
                    el.load();
                } catch (e) {
                }
            }());
        }
    };
    Html5.resetMediaElement = function (el) {
        if (!el) {
            return;
        }
        const sources = el.querySelectorAll('source');
        let i = sources.length;
        while (i--) {
            el.removeChild(sources[i]);
        }
        el.removeAttribute('src');
        if (typeof el.load === 'function') {
            (function () {
                try {
                    el.load();
                } catch (e) {
                }
            }());
        }
    };
    [
        'muted',
        'defaultMuted',
        'autoplay',
        'controls',
        'loop',
        'playsinline'
    ].forEach(function (prop) {
        Html5.prototype[prop] = function () {
            return this.el_[prop] || this.el_.hasAttribute(prop);
        };
    });
    [
        'muted',
        'defaultMuted',
        'autoplay',
        'loop',
        'playsinline'
    ].forEach(function (prop) {
        Html5.prototype['set' + stringCases.toTitleCase(prop)] = function (v) {
            this.el_[prop] = v;
            if (v) {
                this.el_.setAttribute(prop, prop);
            } else {
                this.el_.removeAttribute(prop);
            }
        };
    });
    [
        'paused',
        'currentTime',
        'buffered',
        'volume',
        'poster',
        'preload',
        'error',
        'seeking',
        'seekable',
        'ended',
        'playbackRate',
        'defaultPlaybackRate',
        'disablePictureInPicture',
        'played',
        'networkState',
        'readyState',
        'videoWidth',
        'videoHeight',
        'crossOrigin'
    ].forEach(function (prop) {
        Html5.prototype[prop] = function () {
            return this.el_[prop];
        };
    });
    [
        'volume',
        'src',
        'poster',
        'preload',
        'playbackRate',
        'defaultPlaybackRate',
        'disablePictureInPicture',
        'crossOrigin'
    ].forEach(function (prop) {
        Html5.prototype['set' + stringCases.toTitleCase(prop)] = function (v) {
            this.el_[prop] = v;
        };
    });
    [
        'pause',
        'load',
        'play'
    ].forEach(function (prop) {
        Html5.prototype[prop] = function () {
            return this.el_[prop]();
        };
    });
    Tech.withSourceHandlers(Html5);
    Html5.nativeSourceHandler = {};
    Html5.nativeSourceHandler.canPlayType = function (type) {
        try {
            return Html5.TEST_VID.canPlayType(type);
        } catch (e) {
            return '';
        }
    };
    Html5.nativeSourceHandler.canHandleSource = function (source, options) {
        if (source.type) {
            return Html5.nativeSourceHandler.canPlayType(source.type);
        } else if (source.src) {
            const ext = Url.getFileExtension(source.src);
            return Html5.nativeSourceHandler.canPlayType(`video/${ ext }`);
        }
        return '';
    };
    Html5.nativeSourceHandler.handleSource = function (source, tech, options) {
        tech.setSrc(source.src);
    };
    Html5.nativeSourceHandler.dispose = function () {
    };
    Html5.registerSourceHandler(Html5.nativeSourceHandler);
    Tech.registerTech('Html5', Html5);
    return Html5;
});
define('skylark-videojs/player',[
    'skylark-langx-globals/document',
    './component',
    './mixins/evented',
    './utils/events',
    './utils/dom',
    './utils/fn',
    './utils/guid',
    './utils/browser',
    './utils/log',
    './utils/string-cases',
    './utils/time-ranges',
    './utils/buffer',
    './utils/stylesheet',
    './fullscreen-api',
    './media-error',
    './utils/safeParseTuple',
    './utils/obj',
    './utils/merge-options',
    './utils/promise',
    './tracks/text-track-list-converter',
    './modal-dialog',
    './tech/tech',
    './tech/middleware',
    './tracks/track-types',
    './utils/filter-source',
    './utils/mimetypes',
    './utils/keycode',
    './tech/loader',
    './poster-image',
    './tracks/text-track-display',
    './loading-spinner',
    './big-play-button',
    './close-button',
    './control-bar/control-bar',
    './error-display',
    './tracks/text-track-settings',
    './resize-manager',
    './live-tracker',
    './tech/html5'
], function (
    document,
    Component,
    evented, 
    Events, 
    Dom, 
    Fn, 
    Guid, 
    browser, 
    log, 
    stringCases, 
    timeRages, 
    buffer, 
    stylesheet, 
    FullscreenApi, 
    MediaError, 
    safeParseTuple, 
    obj, 
    mergeOptions, 
    promise, 
    textTrackConverter, 
    ModalDialog, 
    Tech, 
    middleware, 
    TRACK_TYPES, 
    filterSource, 
    mimetypes, 
    keycode
) {
    'use strict';
    const TECH_EVENTS_RETRIGGER = [
        'progress',
        'abort',
        'suspend',
        'emptied',
        'stalled',
        'loadedmetadata',
        'loadeddata',
        'timeupdate',
        'resize',
        'volumechange',
        'texttrackchange'
    ];
    const TECH_EVENTS_QUEUE = {
        canplay: 'CanPlay',
        canplaythrough: 'CanPlayThrough',
        playing: 'Playing',
        seeked: 'Seeked'
    };
    const BREAKPOINT_ORDER = [
        'tiny',
        'xsmall',
        'small',
        'medium',
        'large',
        'xlarge',
        'huge'
    ];
    const BREAKPOINT_CLASSES = {};
    BREAKPOINT_ORDER.forEach(k => {
        const v = k.charAt(0) === 'x' ? `x-${ k.substring(1) }` : k;
        BREAKPOINT_CLASSES[k] = `vjs-layout-${ v }`;
    });
    const DEFAULT_BREAKPOINTS = {
        tiny: 210,
        xsmall: 320,
        small: 425,
        medium: 768,
        large: 1440,
        xlarge: 2560,
        huge: Infinity
    };
    class Player extends Component {
        constructor(tag, options, ready) {
            tag.id = tag.id || options.id || `vjs_video_${ Guid.newGUID() }`;
            options = obj.assign(Player.getTagSettings(tag), options);
            options.initChildren = false;
            options.createEl = false;
            options.evented = false;
            options.reportTouchActivity = false;
            if (!options.language) {
                if (typeof tag.closest === 'function') {
                    const closest = tag.closest('[lang]');
                    if (closest && closest.getAttribute) {
                        options.language = closest.getAttribute('lang');
                    }
                } else {
                    let element = tag;
                    while (element && element.nodeType === 1) {
                        if (Dom.getAttributes(element).hasOwnProperty('lang')) {
                            options.language = element.getAttribute('lang');
                            break;
                        }
                        element = element.parentNode;
                    }
                }
            }
            super(null, options, ready);
            this.boundDocumentFullscreenChange_ = e => this.documentFullscreenChange_(e);
            this.boundFullWindowOnEscKey_ = e => this.fullWindowOnEscKey(e);
            this.isFullscreen_ = false;
            this.log = log.createLogger(this.id_);
            this.fsApi_ = FullscreenApi;
            this.isPosterFromTech_ = false;
            this.queuedCallbacks_ = [];
            this.isReady_ = false;
            this.hasStarted_ = false;
            this.userActive_ = false;
            this.debugEnabled_ = false;
            if (!this.options_ || !this.options_.techOrder || !this.options_.techOrder.length) {
                throw new Error('No techOrder specified. Did you overwrite ' + 'videojs.options instead of just changing the ' + 'properties you want to override?');
            }
            this.tag = tag;
            this.tagAttributes = tag && Dom.getAttributes(tag);
            this.language(this.options_.language);
            if (options.languages) {
                const languagesToLower = {};
                Object.getOwnPropertyNames(options.languages).forEach(function (name) {
                    languagesToLower[name.toLowerCase()] = options.languages[name];
                });
                this.languages_ = languagesToLower;
            } else {
                this.languages_ = Player.prototype.options_.languages;
            }
            this.resetCache_();
            this.poster_ = options.poster || '';
            this.controls_ = !!options.controls;
            tag.controls = false;
            tag.removeAttribute('controls');
            this.changingSrc_ = false;
            this.playCallbacks_ = [];
            this.playTerminatedQueue_ = [];
            if (tag.hasAttribute('autoplay')) {
                this.autoplay(true);
            } else {
                this.autoplay(this.options_.autoplay);
            }
            if (options.plugins) {
                Object.keys(options.plugins).forEach(name => {
                    if (typeof this[name] !== 'function') {
                        throw new Error(`plugin "${ name }" does not exist`);
                    }
                });
            }
            this.scrubbing_ = false;
            this.el_ = this.createEl();
            //evented(this, { eventBusKey: 'el_' });
            if (this.fsApi_.requestFullscreen) {
                Events.on(document, this.fsApi_.fullscreenchange, this.boundDocumentFullscreenChange_);
                this.listenTo(this.fsApi_.fullscreenchange, this.boundDocumentFullscreenChange_);
            }
            if (this.fluid_) {
                this.listenTo([
                    'playerreset',
                    'resize'
                ], this.updateStyleEl_);
            }
            const playerOptionsCopy = mergeOptions(this.options_);
            if (options.plugins) {
                Object.keys(options.plugins).forEach(name => {
                    this[name](options.plugins[name]);
                });
            }
            if (options.debug) {
                this.debug(true);
            }
            this.options_.playerOptions = playerOptionsCopy;
            this.middleware_ = [];
            this.initChildren();
            this.isAudio(tag.nodeName.toLowerCase() === 'audio');
            if (this.controls()) {
                this.addClass('vjs-controls-enabled');
            } else {
                this.addClass('vjs-controls-disabled');
            }
            this.el_.setAttribute('role', 'region');
            if (this.isAudio()) {
                this.el_.setAttribute('aria-label', this.localize('Audio Player'));
            } else {
                this.el_.setAttribute('aria-label', this.localize('Video Player'));
            }
            if (this.isAudio()) {
                this.addClass('vjs-audio');
            }
            if (this.flexNotSupported_()) {
                this.addClass('vjs-no-flex');
            }
            if (browser.TOUCH_ENABLED) {
                this.addClass('vjs-touch-enabled');
            }
            if (!browser.IS_IOS) {
                this.addClass('vjs-workinghover');
            }
            Player.players[this.id_] = this;
            const majorVersion = "7";
            this.addClass(`vjs-v${ majorVersion }`);
            this.userActive(true);
            this.reportUserActivity();
            this.listenToOnce('play', this.listenForUserActivity_);
            this.listenTo('stageclick', this.handleStageClick_);
            this.listenTo('keydown', this.handleKeyDown);
            this.listenTo('languagechange', this.handleLanguagechange);
            this.breakpoints(this.options_.breakpoints);
            this.responsive(this.options_.responsive);
        }
        dispose() {
            this.trigger('dispose');
            this.unlistenTo('dispose');
            Events.off(document, this.fsApi_.fullscreenchange, this.boundDocumentFullscreenChange_);
            Events.off(document, 'keydown', this.boundFullWindowOnEscKey_);
            if (this.styleEl_ && this.styleEl_.parentNode) {
                this.styleEl_.parentNode.removeChild(this.styleEl_);
                this.styleEl_ = null;
            }
            Player.players[this.id_] = null;
            if (this.tag && this.tag.player) {
                this.tag.player = null;
            }
            if (this.el_ && this.el_.player) {
                this.el_.player = null;
            }
            if (this.tech_) {
                this.tech_.dispose();
                this.isPosterFromTech_ = false;
                this.poster_ = '';
            }
            if (this.playerElIngest_) {
                this.playerElIngest_ = null;
            }
            if (this.tag) {
                this.tag = null;
            }
            middleware.clearCacheForPlayer(this);
            TRACK_TYPES.ALL.names.forEach(name => {
                const props = TRACK_TYPES[name];
                const list = this[props.getterName]();
                if (list && list.off) {
                    list.off();
                }
            });
            super.dispose();
        }
        createEl() {
            let tag = this.tag;
            let el;
            let playerElIngest = this.playerElIngest_ = tag.parentNode && tag.parentNode.hasAttribute && tag.parentNode.hasAttribute('data-vjs-player');
            const divEmbed = this.tag.tagName.toLowerCase() === 'video-js';
            if (playerElIngest) {
                el = this.el_ = tag.parentNode;
            } else if (!divEmbed) {
                el = this.el_ = super.createEl('div');
            }
            const attrs = Dom.getAttributes(tag);
            if (divEmbed) {
                el = this.el_ = tag;
                tag = this.tag = document.createElement('video');
                while (el.children.length) {
                    tag.appendChild(el.firstChild);
                }
                if (!Dom.hasClass(el, 'video-js')) {
                    Dom.addClass(el, 'video-js');
                }
                el.appendChild(tag);
                playerElIngest = this.playerElIngest_ = el;
                Object.keys(el).forEach(k => {
                    try {
                        tag[k] = el[k];
                    } catch (e) {
                    }
                });
            }
            tag.setAttribute('tabindex', '-1');
            attrs.tabindex = '-1';
            if (browser.IE_VERSION || browser.IS_CHROME && browser.IS_WINDOWS) {
                tag.setAttribute('role', 'application');
                attrs.role = 'application';
            }
            tag.removeAttribute('width');
            tag.removeAttribute('height');
            if ('width' in attrs) {
                delete attrs.width;
            }
            if ('height' in attrs) {
                delete attrs.height;
            }
            Object.getOwnPropertyNames(attrs).forEach(function (attr) {
                if (!(divEmbed && attr === 'class')) {
                    el.setAttribute(attr, attrs[attr]);
                }
                if (divEmbed) {
                    tag.setAttribute(attr, attrs[attr]);
                }
            });
            tag.playerId = tag.id;
            tag.id += '_html5_api';
            tag.className = 'vjs-tech';
            tag.player = el.player = this;
            this.addClass('vjs-paused');
            if (window.VIDEOJS_NO_DYNAMIC_STYLE !== true) {
                this.styleEl_ = stylesheet.createStyleElement('vjs-styles-dimensions');
                const defaultsStyleEl = Dom.$('.vjs-styles-defaults');
                const head = Dom.$('head');
                head.insertBefore(this.styleEl_, defaultsStyleEl ? defaultsStyleEl.nextSibling : head.firstChild);
            }
            this.fill_ = false;
            this.fluid_ = false;
            this.width(this.options_.width);
            this.height(this.options_.height);
            this.fill(this.options_.fill);
            this.fluid(this.options_.fluid);
            this.aspectRatio(this.options_.aspectRatio);
            this.crossOrigin(this.options_.crossOrigin || this.options_.crossorigin);
            const links = tag.getElementsByTagName('a');
            for (let i = 0; i < links.length; i++) {
                const linkEl = links.item(i);
                Dom.addClass(linkEl, 'vjs-hidden');
                linkEl.setAttribute('hidden', 'hidden');
            }
            tag.initNetworkState_ = tag.networkState;
            if (tag.parentNode && !playerElIngest) {
                tag.parentNode.insertBefore(el, tag);
            }
            Dom.prependTo(tag, el);
            this.children_.unshift(tag);
            this.el_.setAttribute('lang', this.language_);
            this.el_ = el;
            return el;
        }
        crossOrigin(value) {
            if (!value) {
                return this.techGet_('crossOrigin');
            }
            if (value !== 'anonymous' && value !== 'use-credentials') {
                log.warn(`crossOrigin must be "anonymous" or "use-credentials", given "${ value }"`);
                return;
            }
            this.techCall_('setCrossOrigin', value);
            return;
        }
        width(value) {
            return this.dimension('width', value);
        }
        height(value) {
            return this.dimension('height', value);
        }
        dimension(dimension, value) {
            const privDimension = dimension + '_';
            if (value === undefined) {
                return this[privDimension] || 0;
            }
            if (value === '' || value === 'auto') {
                this[privDimension] = undefined;
                this.updateStyleEl_();
                return;
            }
            const parsedVal = parseFloat(value);
            if (isNaN(parsedVal)) {
                log.error(`Improper value "${ value }" supplied for for ${ dimension }`);
                return;
            }
            this[privDimension] = parsedVal;
            this.updateStyleEl_();
        }
        fluid(bool) {
            if (bool === undefined) {
                return !!this.fluid_;
            }
            this.fluid_ = !!bool;
            if (evented.isEvented(this)) {
                this.unlistenTo([
                    'playerreset',
                    'resize'
                ], this.updateStyleEl_);
            }
            if (bool) {
                this.addClass('vjs-fluid');
                this.fill(false);
                evented.addEventedCallback(this, () => {
                    this.listenTo([
                        'playerreset',
                        'resize'
                    ], this.updateStyleEl_);
                });
            } else {
                this.removeClass('vjs-fluid');
            }
            this.updateStyleEl_();
        }
        fill(bool) {
            if (bool === undefined) {
                return !!this.fill_;
            }
            this.fill_ = !!bool;
            if (bool) {
                this.addClass('vjs-fill');
                this.fluid(false);
            } else {
                this.removeClass('vjs-fill');
            }
        }
        aspectRatio(ratio) {
            if (ratio === undefined) {
                return this.aspectRatio_;
            }
            if (!/^\d+\:\d+$/.test(ratio)) {
                throw new Error('Improper value supplied for aspect ratio. The format should be width:height, for example 16:9.');
            }
            this.aspectRatio_ = ratio;
            this.fluid(true);
            this.updateStyleEl_();
        }
        updateStyleEl_() {
            if (window.VIDEOJS_NO_DYNAMIC_STYLE === true) {
                const width = typeof this.width_ === 'number' ? this.width_ : this.options_.width;
                const height = typeof this.height_ === 'number' ? this.height_ : this.options_.height;
                const techEl = this.tech_ && this.tech_.el();
                if (techEl) {
                    if (width >= 0) {
                        techEl.width = width;
                    }
                    if (height >= 0) {
                        techEl.height = height;
                    }
                }
                return;
            }
            let width;
            let height;
            let aspectRatio;
            let idClass;
            if (this.aspectRatio_ !== undefined && this.aspectRatio_ !== 'auto') {
                aspectRatio = this.aspectRatio_;
            } else if (this.videoWidth() > 0) {
                aspectRatio = this.videoWidth() + ':' + this.videoHeight();
            } else {
                aspectRatio = '16:9';
            }
            const ratioParts = aspectRatio.split(':');
            const ratioMultiplier = ratioParts[1] / ratioParts[0];
            if (this.width_ !== undefined) {
                width = this.width_;
            } else if (this.height_ !== undefined) {
                width = this.height_ / ratioMultiplier;
            } else {
                width = this.videoWidth() || 300;
            }
            if (this.height_ !== undefined) {
                height = this.height_;
            } else {
                height = width * ratioMultiplier;
            }
            if (/^[^a-zA-Z]/.test(this.id())) {
                idClass = 'dimensions-' + this.id();
            } else {
                idClass = this.id() + '-dimensions';
            }
            this.addClass(idClass);
            stylesheet.setTextContent(this.styleEl_, `
      .${ idClass } {
        width: ${ width }px;
        height: ${ height }px;
      }

      .${ idClass }.vjs-fluid {
        padding-top: ${ ratioMultiplier * 100 }%;
      }
    `);
        }
        loadTech_(techName, source) {
            if (this.tech_) {
                this.unloadTech_();
            }
            const titleTechName = stringCases.toTitleCase(techName);
            const camelTechName = techName.charAt(0).toLowerCase() + techName.slice(1);
            if (titleTechName !== 'Html5' && this.tag) {
                Tech.getTech('Html5').disposeMediaElement(this.tag);
                this.tag.player = null;
                this.tag = null;
            }
            this.techName_ = titleTechName;
            this.isReady_ = false;
            const autoplay = typeof this.autoplay() === 'string' ? false : this.autoplay();
            const techOptions = {
                source,
                autoplay,
                'nativeControlsForTouch': this.options_.nativeControlsForTouch,
                'playerId': this.id(),
                'techId': `${ this.id() }_${ camelTechName }_api`,
                'playsinline': this.options_.playsinline,
                'preload': this.options_.preload,
                'loop': this.options_.loop,
                'disablePictureInPicture': this.options_.disablePictureInPicture,
                'muted': this.options_.muted,
                'poster': this.poster(),
                'language': this.language(),
                'playerElIngest': this.playerElIngest_ || false,
                'vtt.js': this.options_['vtt.js'],
                'canOverridePoster': !!this.options_.techCanOverridePoster,
                'enableSourceset': this.options_.enableSourceset,
                'Promise': this.options_.Promise
            };
            TRACK_TYPES.ALL.names.forEach(name => {
                const props = TRACK_TYPES.ALL[name];
                techOptions[props.getterName] = this[props.privateName];
            });
            obj.assign(techOptions, this.options_[titleTechName]);
            obj.assign(techOptions, this.options_[camelTechName]);
            obj.assign(techOptions, this.options_[techName.toLowerCase()]);
            if (this.tag) {
                techOptions.tag = this.tag;
            }
            if (source && source.src === this.cache_.src && this.cache_.currentTime > 0) {
                techOptions.startTime = this.cache_.currentTime;
            }
            const TechClass = Tech.getTech(techName);
            if (!TechClass) {
                throw new Error(`No Tech named '${ titleTechName }' exists! '${ titleTechName }' should be registered using videojs.registerTech()'`);
            }
            this.tech_ = new TechClass(techOptions);
            this.tech_.ready(Fn.bind(this, this.handleTechReady_), true);
            textTrackConverter.jsonToTextTracks(this.textTracksJson_ || [], this.tech_);
            TECH_EVENTS_RETRIGGER.forEach(event => {
                this.listenTo(this.tech_, event, this[`handleTech${ stringCases.toTitleCase(event) }_`]);
            });
            Object.keys(TECH_EVENTS_QUEUE).forEach(event => {
                this.listenTo(this.tech_, event, eventObj => {
                    if (this.tech_.playbackRate() === 0 && this.tech_.seeking()) {
                        this.queuedCallbacks_.push({
                            callback: this[`handleTech${ TECH_EVENTS_QUEUE[event] }_`].bind(this),
                            event: eventObj
                        });
                        return;
                    }
                    this[`handleTech${ TECH_EVENTS_QUEUE[event] }_`](eventObj);
                });
            });
            this.listenTo(this.tech_, 'loadstart', this.handleTechLoadStart_);
            this.listenTo(this.tech_, 'sourceset', this.handleTechSourceset_);
            this.listenTo(this.tech_, 'waiting', this.handleTechWaiting_);
            this.listenTo(this.tech_, 'ended', this.handleTechEnded_);
            this.listenTo(this.tech_, 'seeking', this.handleTechSeeking_);
            this.listenTo(this.tech_, 'play', this.handleTechPlay_);
            this.listenTo(this.tech_, 'firstplay', this.handleTechFirstPlay_);
            this.listenTo(this.tech_, 'pause', this.handleTechPause_);
            this.listenTo(this.tech_, 'durationchange', this.handleTechDurationChange_);
            this.listenTo(this.tech_, 'fullscreenchange', this.handleTechFullscreenChange_);
            this.listenTo(this.tech_, 'fullscreenerror', this.handleTechFullscreenError_);
            this.listenTo(this.tech_, 'enterpictureinpicture', this.handleTechEnterPictureInPicture_);
            this.listenTo(this.tech_, 'leavepictureinpicture', this.handleTechLeavePictureInPicture_);
            this.listenTo(this.tech_, 'error', this.handleTechError_);
            this.listenTo(this.tech_, 'loadedmetadata', this.updateStyleEl_);
            this.listenTo(this.tech_, 'posterchange', this.handleTechPosterChange_);
            this.listenTo(this.tech_, 'textdata', this.handleTechTextData_);
            this.listenTo(this.tech_, 'ratechange', this.handleTechRateChange_);
            this.usingNativeControls(this.techGet_('controls'));
            if (this.controls() && !this.usingNativeControls()) {
                this.addTechControlsListeners_();
            }
            if (this.tech_.el().parentNode !== this.el() && (titleTechName !== 'Html5' || !this.tag)) {
                Dom.prependTo(this.tech_.el(), this.el());
            }
            if (this.tag) {
                this.tag.player = null;
                this.tag = null;
            }
        }
        unloadTech_() {
            TRACK_TYPES.ALL.names.forEach(name => {
                const props = TRACK_TYPES.ALL[name];
                this[props.privateName] = this[props.getterName]();
            });
            this.textTracksJson_ = textTrackConverter.textTracksToJson(this.tech_);
            this.isReady_ = false;
            this.tech_.dispose();
            this.tech_ = false;
            if (this.isPosterFromTech_) {
                this.poster_ = '';
                this.trigger('posterchange');
            }
            this.isPosterFromTech_ = false;
        }
        tech(safety) {
            if (safety === undefined) {
                log.warn("Using the tech directly can be dangerous. I hope you know what you're doing.\n" + 'See https://github.com/videojs/video.js/issues/2617 for more info.\n');
            }
            return this.tech_;
        }
        addTechControlsListeners_() {
            this.removeTechControlsListeners_();
            this.listenTo(this.tech_, 'mouseup', this.handleTechClick_);
            this.listenTo(this.tech_, 'dblclick', this.handleTechDoubleClick_);
            this.listenTo(this.tech_, 'touchstart', this.handleTechTouchStart_);
            this.listenTo(this.tech_, 'touchmove', this.handleTechTouchMove_);
            this.listenTo(this.tech_, 'touchend', this.handleTechTouchEnd_);
            this.listenTo(this.tech_, 'tap', this.handleTechTap_);
        }
        removeTechControlsListeners_() {
            this.unlistenTo(this.tech_, 'tap', this.handleTechTap_);
            this.unlistenTo(this.tech_, 'touchstart', this.handleTechTouchStart_);
            this.unlistenTo(this.tech_, 'touchmove', this.handleTechTouchMove_);
            this.unlistenTo(this.tech_, 'touchend', this.handleTechTouchEnd_);
            this.unlistenTo(this.tech_, 'mouseup', this.handleTechClick_);
            this.unlistenTo(this.tech_, 'dblclick', this.handleTechDoubleClick_);
        }
        handleTechReady_() {
            this.triggerReady();
            if (this.cache_.volume) {
                this.techCall_('setVolume', this.cache_.volume);
            }
            this.handleTechPosterChange_();
            this.handleTechDurationChange_();
        }
        handleTechLoadStart_() {
            this.removeClass('vjs-ended');
            this.removeClass('vjs-seeking');
            this.error(null);
            this.handleTechDurationChange_();
            if (!this.paused()) {
                this.trigger('loadstart');
                this.trigger('firstplay');
            } else {
                this.hasStarted(false);
                this.trigger('loadstart');
            }
            this.manualAutoplay_(this.autoplay());
        }
        manualAutoplay_(type) {
            if (!this.tech_ || typeof type !== 'string') {
                return;
            }
            const muted = () => {
                const previouslyMuted = this.muted();
                this.muted(true);
                const restoreMuted = () => {
                    this.muted(previouslyMuted);
                };
                this.playTerminatedQueue_.push(restoreMuted);
                const mutedPromise = this.play();
                if (!promise.isPromise(mutedPromise)) {
                    return;
                }
                return mutedPromise.catch(restoreMuted);
            };
            let promise;
            if (type === 'any' && this.muted() !== true) {
                promise = this.play();
                if (promise.isPromise(promise)) {
                    promise = promise.catch(muted);
                }
            } else if (type === 'muted' && this.muted() !== true) {
                promise = muted();
            } else {
                promise = this.play();
            }
            if (!promise.isPromise(promise)) {
                return;
            }
            return promise.then(() => {
                this.trigger({
                    type: 'autoplay-success',
                    autoplay: type
                });
            }).catch(e => {
                this.trigger({
                    type: 'autoplay-failure',
                    autoplay: type
                });
            });
        }
        updateSourceCaches_(srcObj = '') {
            let src = srcObj;
            let type = '';
            if (typeof src !== 'string') {
                src = srcObj.src;
                type = srcObj.type;
            }
            this.cache_.source = this.cache_.source || {};
            this.cache_.sources = this.cache_.sources || [];
            if (src && !type) {
                type = mimetypes.findMimetype(this, src);
            }
            this.cache_.source = mergeOptions({}, srcObj, {
                src,
                type
            });
            const matchingSources = this.cache_.sources.filter(s => s.src && s.src === src);
            const sourceElSources = [];
            const sourceEls = this.$$('source');
            const matchingSourceEls = [];
            for (let i = 0; i < sourceEls.length; i++) {
                const sourceObj = Dom.getAttributes(sourceEls[i]);
                sourceElSources.push(sourceObj);
                if (sourceObj.src && sourceObj.src === src) {
                    matchingSourceEls.push(sourceObj.src);
                }
            }
            if (matchingSourceEls.length && !matchingSources.length) {
                this.cache_.sources = sourceElSources;
            } else if (!matchingSources.length) {
                this.cache_.sources = [this.cache_.source];
            }
            this.cache_.src = src;
        }
        handleTechSourceset_(event) {
            if (!this.changingSrc_) {
                let updateSourceCaches = src => this.updateSourceCaches_(src);
                const playerSrc = this.currentSource().src;
                const eventSrc = event.src;
                if (playerSrc && !/^blob:/.test(playerSrc) && /^blob:/.test(eventSrc)) {
                    if (!this.lastSource_ || this.lastSource_.tech !== eventSrc && this.lastSource_.player !== playerSrc) {
                        updateSourceCaches = () => {
                        };
                    }
                }
                updateSourceCaches(eventSrc);
                if (!event.src) {
                    this.tech_.any([
                        'sourceset',
                        'loadstart'
                    ], e => {
                        if (e.type === 'sourceset') {
                            return;
                        }
                        const techSrc = this.techGet('currentSrc');
                        this.lastSource_.tech = techSrc;
                        this.updateSourceCaches_(techSrc);
                    });
                }
            }
            this.lastSource_ = {
                player: this.currentSource().src,
                tech: event.src
            };
            this.trigger({
                src: event.src,
                type: 'sourceset'
            });
        }
        hasStarted(request) {
            if (request === undefined) {
                return this.hasStarted_;
            }
            if (request === this.hasStarted_) {
                return;
            }
            this.hasStarted_ = request;
            if (this.hasStarted_) {
                this.addClass('vjs-has-started');
                this.trigger('firstplay');
            } else {
                this.removeClass('vjs-has-started');
            }
        }
        handleTechPlay_() {
            this.removeClass('vjs-ended');
            this.removeClass('vjs-paused');
            this.addClass('vjs-playing');
            this.hasStarted(true);
            this.trigger('play');
        }
        handleTechRateChange_() {
            if (this.tech_.playbackRate() > 0 && this.cache_.lastPlaybackRate === 0) {
                this.queuedCallbacks_.forEach(queued => queued.callback(queued.event));
                this.queuedCallbacks_ = [];
            }
            this.cache_.lastPlaybackRate = this.tech_.playbackRate();
            this.trigger('ratechange');
        }
        handleTechWaiting_() {
            this.addClass('vjs-waiting');
            this.trigger('waiting');
            const timeWhenWaiting = this.currentTime();
            const timeUpdateListener = () => {
                if (timeWhenWaiting !== this.currentTime()) {
                    this.removeClass('vjs-waiting');
                    this.unlistenTo('timeupdate', timeUpdateListener);
                }
            };
            this.listenTo('timeupdate', timeUpdateListener);
        }
        handleTechCanPlay_() {
            this.removeClass('vjs-waiting');
            this.trigger('canplay');
        }
        handleTechCanPlayThrough_() {
            this.removeClass('vjs-waiting');
            this.trigger('canplaythrough');
        }
        handleTechPlaying_() {
            this.removeClass('vjs-waiting');
            this.trigger('playing');
        }
        handleTechSeeking_() {
            this.addClass('vjs-seeking');
            this.trigger('seeking');
        }
        handleTechSeeked_() {
            this.removeClass('vjs-seeking');
            this.removeClass('vjs-ended');
            this.trigger('seeked');
        }
        handleTechFirstPlay_() {
            if (this.options_.starttime) {
                log.warn('Passing the `starttime` option to the player will be deprecated in 6.0');
                this.currentTime(this.options_.starttime);
            }
            this.addClass('vjs-has-started');
            this.trigger('firstplay');
        }
        handleTechPause_() {
            this.removeClass('vjs-playing');
            this.addClass('vjs-paused');
            this.trigger('pause');
        }
        handleTechEnded_() {
            this.addClass('vjs-ended');
            if (this.options_.loop) {
                this.currentTime(0);
                this.play();
            } else if (!this.paused()) {
                this.pause();
            }
            this.trigger('ended');
        }
        handleTechDurationChange_() {
            this.duration(this.techGet_('duration'));
        }
        handleTechClick_(event) {
            if (!Dom.isSingleLeftClick(event)) {
                return;
            }
            if (!this.controls_) {
                return;
            }
            if (this.paused()) {
                promise.silencePromise(this.play());
            } else {
                this.pause();
            }
        }
        handleTechDoubleClick_(event) {
            if (!this.controls_) {
                return;
            }
            const inAllowedEls = Array.prototype.some.call(this.$$('.vjs-control-bar, .vjs-modal-dialog'), el => el.contains(event.target));
            if (!inAllowedEls) {
                if (this.options_ === undefined || this.options_.userActions === undefined || this.options_.userActions.doubleClick === undefined || this.options_.userActions.doubleClick !== false) {
                    if (this.options_ !== undefined && this.options_.userActions !== undefined && typeof this.options_.userActions.doubleClick === 'function') {
                        this.options_.userActions.doubleClick.call(this, event);
                    } else if (this.isFullscreen()) {
                        this.exitFullscreen();
                    } else {
                        this.requestFullscreen();
                    }
                }
            }
        }
        handleTechTap_() {
            this.userActive(!this.userActive());
        }
        handleTechTouchStart_() {
            this.userWasActive = this.userActive();
        }
        handleTechTouchMove_() {
            if (this.userWasActive) {
                this.reportUserActivity();
            }
        }
        handleTechTouchEnd_(event) {
            if (event.cancelable) {
                event.preventDefault();
            }
        }
        handleStageClick_() {
            this.reportUserActivity();
        }
        toggleFullscreenClass_() {
            if (this.isFullscreen()) {
                this.addClass('vjs-fullscreen');
            } else {
                this.removeClass('vjs-fullscreen');
            }
        }
        documentFullscreenChange_(e) {
            const targetPlayer = e.target.player;
            if (targetPlayer && targetPlayer !== this) {
                return;
            }
            const el = this.el();
            let isFs = document[this.fsApi_.fullscreenElement] === el;
            if (!isFs && el.matches) {
                isFs = el.matches(':' + this.fsApi_.fullscreen);
            } else if (!isFs && el.msMatchesSelector) {
                isFs = el.msMatchesSelector(':' + this.fsApi_.fullscreen);
            }
            this.isFullscreen(isFs);
        }
        handleTechFullscreenChange_(event, data) {
            if (data) {
                if (data.nativeIOSFullscreen) {
                    this.toggleClass('vjs-ios-native-fs');
                }
                this.isFullscreen(data.isFullscreen);
            }
        }
        handleTechFullscreenError_(event, err) {
            this.trigger('fullscreenerror', err);
        }
        togglePictureInPictureClass_() {
            if (this.isInPictureInPicture()) {
                this.addClass('vjs-picture-in-picture');
            } else {
                this.removeClass('vjs-picture-in-picture');
            }
        }
        handleTechEnterPictureInPicture_(event) {
            this.isInPictureInPicture(true);
        }
        handleTechLeavePictureInPicture_(event) {
            this.isInPictureInPicture(false);
        }
        handleTechError_() {
            const error = this.tech_.error();
            this.error(error);
        }
        handleTechTextData_() {
            let data = null;
            if (arguments.length > 1) {
                data = arguments[1];
            }
            this.trigger('textdata', data);
        }
        getCache() {
            return this.cache_;
        }
        resetCache_() {
            this.cache_ = {
                currentTime: 0,
                initTime: 0,
                inactivityTimeout: this.options_.inactivityTimeout,
                duration: NaN,
                lastVolume: 1,
                lastPlaybackRate: this.defaultPlaybackRate(),
                media: null,
                src: '',
                source: {},
                sources: [],
                volume: 1
            };
        }
        techCall_(method, arg) {
            this.ready(function () {
                if (method in middleware.allowedSetters) {
                    return middleware.set(this.middleware_, this.tech_, method, arg);
                } else if (method in middleware.allowedMediators) {
                    return middleware.mediate(this.middleware_, this.tech_, method, arg);
                }
                try {
                    if (this.tech_) {
                        this.tech_[method](arg);
                    }
                } catch (e) {
                    log(e);
                    throw e;
                }
            }, true);
        }
        techGet_(method) {
            if (!this.tech_ || !this.tech_.isReady_) {
                return;
            }
            if (method in middleware.allowedGetters) {
                return middleware.get(this.middleware_, this.tech_, method);
            } else if (method in middleware.allowedMediators) {
                return middleware.mediate(this.middleware_, this.tech_, method);
            }
            try {
                return this.tech_[method]();
            } catch (e) {
                if (this.tech_[method] === undefined) {
                    log(`Video.js: ${ method } method not defined for ${ this.techName_ } playback technology.`, e);
                    throw e;
                }
                if (e.name === 'TypeError') {
                    log(`Video.js: ${ method } unavailable on ${ this.techName_ } playback technology element.`, e);
                    this.tech_.isReady_ = false;
                    throw e;
                }
                log(e);
                throw e;
            }
        }
        play() {
            const PromiseClass = this.options_.Promise || window.Promise;
            if (PromiseClass) {
                return new PromiseClass(resolve => {
                    this.play_(resolve);
                });
            }
            return this.play_();
        }
        play_(callback = promise.silencePromise) {
            this.playCallbacks_.push(callback);
            const isSrcReady = Boolean(!this.changingSrc_ && (this.src() || this.currentSrc()));
            if (this.waitToPlay_) {
                this.unlistenTo([
                    'ready',
                    'loadstart'
                ], this.waitToPlay_);
                this.waitToPlay_ = null;
            }
            if (!this.isReady_ || !isSrcReady) {
                this.waitToPlay_ = e => {
                    this.play_();
                };
                this.listenToOnce([
                    'ready',
                    'loadstart'
                ], this.waitToPlay_);
                if (!isSrcReady && (browser.IS_ANY_SAFARI || browser.IS_IOS)) {
                    this.load();
                }
                return;
            }
            const val = this.techGet_('play');
            if (val === null) {
                this.runPlayTerminatedQueue_();
            } else {
                this.runPlayCallbacks_(val);
            }
        }
        runPlayTerminatedQueue_() {
            const queue = this.playTerminatedQueue_.slice(0);
            this.playTerminatedQueue_ = [];
            queue.forEach(function (q) {
                q();
            });
        }
        runPlayCallbacks_(val) {
            const callbacks = this.playCallbacks_.slice(0);
            this.playCallbacks_ = [];
            this.playTerminatedQueue_ = [];
            callbacks.forEach(function (cb) {
                cb(val);
            });
        }
        pause() {
            this.techCall_('pause');
        }
        paused() {
            return this.techGet_('paused') === false ? false : true;
        }
        played() {
            return this.techGet_('played') || timeRages.createTimeRange(0, 0);
        }
        scrubbing(isScrubbing) {
            if (typeof isScrubbing === 'undefined') {
                return this.scrubbing_;
            }
            this.scrubbing_ = !!isScrubbing;
            this.techCall_('setScrubbing', this.scrubbing_);
            if (isScrubbing) {
                this.addClass('vjs-scrubbing');
            } else {
                this.removeClass('vjs-scrubbing');
            }
        }
        currentTime(seconds) {
            if (typeof seconds !== 'undefined') {
                if (seconds < 0) {
                    seconds = 0;
                }
                if (!this.isReady_ || this.changingSrc_ || !this.tech_ || !this.tech_.isReady_) {
                    this.cache_.initTime = seconds;
                    this.unlistenTo('canplay', this.applyInitTime_);
                    this.listenToOnce('canplay', this.applyInitTime_);
                    return;
                }
                this.techCall_('setCurrentTime', seconds);
                this.cache_.initTime = 0;
                return;
            }
            this.cache_.currentTime = this.techGet_('currentTime') || 0;
            return this.cache_.currentTime;
        }
        applyInitTime_() {
            this.currentTime(this.cache_.initTime);
        }
        duration(seconds) {
            if (seconds === undefined) {
                return this.cache_.duration !== undefined ? this.cache_.duration : NaN;
            }
            seconds = parseFloat(seconds);
            if (seconds < 0) {
                seconds = Infinity;
            }
            if (seconds !== this.cache_.duration) {
                this.cache_.duration = seconds;
                if (seconds === Infinity) {
                    this.addClass('vjs-live');
                } else {
                    this.removeClass('vjs-live');
                }
                if (!isNaN(seconds)) {
                    this.trigger('durationchange');
                }
            }
        }
        remainingTime() {
            return this.duration() - this.currentTime();
        }
        remainingTimeDisplay() {
            return Math.floor(this.duration()) - Math.floor(this.currentTime());
        }
        buffered() {
            let buffered = this.techGet_('buffered');
            if (!buffered || !buffered.length) {
                buffered = timeRages.createTimeRange(0, 0);
            }
            return buffered;
        }
        bufferedPercent() {
            return buffer.bufferedPercent(this.buffered(), this.duration());
        }
        bufferedEnd() {
            const buffered = this.buffered();
            const duration = this.duration();
            let end = buffered.end(buffered.length - 1);
            if (end > duration) {
                end = duration;
            }
            return end;
        }
        volume(percentAsDecimal) {
            let vol;
            if (percentAsDecimal !== undefined) {
                vol = Math.max(0, Math.min(1, parseFloat(percentAsDecimal)));
                this.cache_.volume = vol;
                this.techCall_('setVolume', vol);
                if (vol > 0) {
                    this.lastVolume_(vol);
                }
                return;
            }
            vol = parseFloat(this.techGet_('volume'));
            return isNaN(vol) ? 1 : vol;
        }
        muted(muted) {
            if (muted !== undefined) {
                this.techCall_('setMuted', muted);
                return;
            }
            return this.techGet_('muted') || false;
        }
        defaultMuted(defaultMuted) {
            if (defaultMuted !== undefined) {
                return this.techCall_('setDefaultMuted', defaultMuted);
            }
            return this.techGet_('defaultMuted') || false;
        }
        lastVolume_(percentAsDecimal) {
            if (percentAsDecimal !== undefined && percentAsDecimal !== 0) {
                this.cache_.lastVolume = percentAsDecimal;
                return;
            }
            return this.cache_.lastVolume;
        }
        supportsFullScreen() {
            return this.techGet_('supportsFullScreen') || false;
        }
        isFullscreen(isFS) {
            if (isFS !== undefined) {
                const oldValue = this.isFullscreen_;
                this.isFullscreen_ = Boolean(isFS);
                if (this.isFullscreen_ !== oldValue && this.fsApi_.prefixed) {
                    this.trigger('fullscreenchange');
                }
                this.toggleFullscreenClass_();
                return;
            }
            return this.isFullscreen_;
        }
        requestFullscreen(fullscreenOptions) {
            const PromiseClass = this.options_.Promise || window.Promise;
            if (PromiseClass) {
                const self = this;
                return new PromiseClass((resolve, reject) => {
                    function offHandler() {
                        self.off('fullscreenerror', errorHandler);
                        self.off('fullscreenchange', changeHandler);
                    }
                    function changeHandler() {
                        offHandler();
                        resolve();
                    }
                    function errorHandler(e, err) {
                        offHandler();
                        reject(err);
                    }
                    self.one('fullscreenchange', changeHandler);
                    self.one('fullscreenerror', errorHandler);
                    const promise = self.requestFullscreenHelper_(fullscreenOptions);
                    if (promise) {
                        promise.then(offHandler, offHandler);
                        return promise;
                    }
                });
            }
            return this.requestFullscreenHelper_();
        }
        requestFullscreenHelper_(fullscreenOptions) {
            let fsOptions;
            if (!this.fsApi_.prefixed) {
                fsOptions = this.options_.fullscreen && this.options_.fullscreen.options || {};
                if (fullscreenOptions !== undefined) {
                    fsOptions = fullscreenOptions;
                }
            }
            if (this.fsApi_.requestFullscreen) {
                const promise = this.el_[this.fsApi_.requestFullscreen](fsOptions);
                if (promise) {
                    promise.then(() => this.isFullscreen(true), () => this.isFullscreen(false));
                }
                return promise;
            } else if (this.tech_.supportsFullScreen()) {
                this.techCall_('enterFullScreen');
            } else {
                this.enterFullWindow();
            }
        }
        exitFullscreen() {
            const PromiseClass = this.options_.Promise || window.Promise;
            if (PromiseClass) {
                const self = this;
                return new PromiseClass((resolve, reject) => {
                    function offHandler() {
                        self.off('fullscreenerror', errorHandler);
                        self.off('fullscreenchange', changeHandler);
                    }
                    function changeHandler() {
                        offHandler();
                        resolve();
                    }
                    function errorHandler(e, err) {
                        offHandler();
                        reject(err);
                    }
                    self.one('fullscreenchange', changeHandler);
                    self.one('fullscreenerror', errorHandler);
                    const promise = self.exitFullscreenHelper_();
                    if (promise) {
                        promise.then(offHandler, offHandler);
                        return promise;
                    }
                });
            }
            return this.exitFullscreenHelper_();
        }
        exitFullscreenHelper_() {
            if (this.fsApi_.requestFullscreen) {
                const promise = document[this.fsApi_.exitFullscreen]();
                if (promise) {
                    promise.then(() => this.isFullscreen(false));
                }
                return promise;
            } else if (this.tech_.supportsFullScreen()) {
                this.techCall_('exitFullScreen');
            } else {
                this.exitFullWindow();
            }
        }
        enterFullWindow() {
            this.isFullscreen(true);
            this.isFullWindow = true;
            this.docOrigOverflow = document.documentElement.style.overflow;
            Events.on(document, 'keydown', this.boundFullWindowOnEscKey_);
            document.documentElement.style.overflow = 'hidden';
            Dom.addClass(document.body, 'vjs-full-window');
            this.trigger('enterFullWindow');
        }
        fullWindowOnEscKey(event) {
            if (keycode.isEventKey(event, 'Esc')) {
                if (this.isFullscreen() === true) {
                    this.exitFullscreen();
                } else {
                    this.exitFullWindow();
                }
            }
        }
        exitFullWindow() {
            this.isFullscreen(false);
            this.isFullWindow = false;
            Events.off(document, 'keydown', this.boundFullWindowOnEscKey_);
            document.documentElement.style.overflow = this.docOrigOverflow;
            Dom.removeClass(document.body, 'vjs-full-window');
            this.trigger('exitFullWindow');
        }
        disablePictureInPicture(value) {
            if (value === undefined) {
                return this.techGet_('disablePictureInPicture');
            }
            this.techCall_('setDisablePictureInPicture', value);
            this.options_.disablePictureInPicture = value;
            this.trigger('disablepictureinpicturechanged');
        }
        isInPictureInPicture(isPiP) {
            if (isPiP !== undefined) {
                this.isInPictureInPicture_ = !!isPiP;
                this.togglePictureInPictureClass_();
                return;
            }
            return !!this.isInPictureInPicture_;
        }
        requestPictureInPicture() {
            if ('pictureInPictureEnabled' in document && this.disablePictureInPicture() === false) {
                return this.techGet_('requestPictureInPicture');
            }
        }
        exitPictureInPicture() {
            if ('pictureInPictureEnabled' in document) {
                return document.exitPictureInPicture();
            }
        }
        handleKeyDown(event) {
            const {userActions} = this.options_;
            if (!userActions || !userActions.hotkeys) {
                return;
            }
            const excludeElement = el => {
                const tagName = el.tagName.toLowerCase();
                if (el.isContentEditable) {
                    return true;
                }
                const allowedInputTypes = [
                    'button',
                    'checkbox',
                    'hidden',
                    'radio',
                    'reset',
                    'submit'
                ];
                if (tagName === 'input') {
                    return allowedInputTypes.indexOf(el.type) === -1;
                }
                const excludedTags = ['textarea'];
                return excludedTags.indexOf(tagName) !== -1;
            };
            if (excludeElement(this.el_.ownerDocument.activeElement)) {
                return;
            }
            if (typeof userActions.hotkeys === 'function') {
                userActions.hotkeys.call(this, event);
            } else {
                this.handleHotkeys(event);
            }
        }
        handleHotkeys(event) {
            const hotkeys = this.options_.userActions ? this.options_.userActions.hotkeys : {};
            const {fullscreenKey = keydownEvent => keycode.isEventKey(keydownEvent, 'f'), muteKey = keydownEvent => keycode.isEventKey(keydownEvent, 'm'), playPauseKey = keydownEvent => keycode.isEventKey(keydownEvent, 'k') || keycode.isEventKey(keydownEvent, 'Space')} = hotkeys;
            if (fullscreenKey.call(this, event)) {
                event.preventDefault();
                event.stopPropagation();
                const FSToggle = Component.getComponent('FullscreenToggle');
                if (document[this.fsApi_.fullscreenEnabled] !== false) {
                    FSToggle.prototype.handleClick.call(this, event);
                }
            } else if (muteKey.call(this, event)) {
                event.preventDefault();
                event.stopPropagation();
                const MuteToggle = Component.getComponent('MuteToggle');
                MuteToggle.prototype.handleClick.call(this, event);
            } else if (playPauseKey.call(this, event)) {
                event.preventDefault();
                event.stopPropagation();
                const PlayToggle = Component.getComponent('PlayToggle');
                PlayToggle.prototype.handleClick.call(this, event);
            }
        }
        canPlayType(type) {
            let can;
            for (let i = 0, j = this.options_.techOrder; i < j.length; i++) {
                const techName = j[i];
                let tech = Tech.getTech(techName);
                if (!tech) {
                    tech = Component.getComponent(techName);
                }
                if (!tech) {
                    log.error(`The "${ techName }" tech is undefined. Skipped browser support check for that tech.`);
                    continue;
                }
                if (tech.isSupported()) {
                    can = tech.canPlayType(type);
                    if (can) {
                        return can;
                    }
                }
            }
            return '';
        }
        selectSource(sources) {
            const techs = this.options_.techOrder.map(techName => {
                return [
                    techName,
                    Tech.getTech(techName)
                ];
            }).filter(([techName, tech]) => {
                if (tech) {
                    return tech.isSupported();
                }
                log.error(`The "${ techName }" tech is undefined. Skipped browser support check for that tech.`);
                return false;
            });
            const findFirstPassingTechSourcePair = function (outerArray, innerArray, tester) {
                let found;
                outerArray.some(outerChoice => {
                    return innerArray.some(innerChoice => {
                        found = tester(outerChoice, innerChoice);
                        if (found) {
                            return true;
                        }
                    });
                });
                return found;
            };
            let foundSourceAndTech;
            const flip = fn => (a, b) => fn(b, a);
            const finder = ([techName, tech], source) => {
                if (tech.canPlaySource(source, this.options_[techName.toLowerCase()])) {
                    return {
                        source,
                        tech: techName
                    };
                }
            };
            if (this.options_.sourceOrder) {
                foundSourceAndTech = findFirstPassingTechSourcePair(sources, techs, flip(finder));
            } else {
                foundSourceAndTech = findFirstPassingTechSourcePair(techs, sources, finder);
            }
            return foundSourceAndTech || false;
        }
        src(source) {
            if (typeof source === 'undefined') {
                return this.cache_.src || '';
            }
            const sources = filterSource(source);
            if (!sources.length) {
                this.setTimeout(function () {
                    this.error({
                        code: 4,
                        message: this.localize(this.options_.notSupportedMessage)
                    });
                }, 0);
                return;
            }
            this.changingSrc_ = true;
            this.cache_.sources = sources;
            this.updateSourceCaches_(sources[0]);
            middleware.setSource(this, sources[0], (middlewareSource, mws) => {
                this.middleware_ = mws;
                this.cache_.sources = sources;
                this.updateSourceCaches_(middlewareSource);
                const err = this.src_(middlewareSource);
                if (err) {
                    if (sources.length > 1) {
                        return this.src(sources.slice(1));
                    }
                    this.changingSrc_ = false;
                    this.setTimeout(function () {
                        this.error({
                            code: 4,
                            message: this.localize(this.options_.notSupportedMessage)
                        });
                    }, 0);
                    this.triggerReady();
                    return;
                }
                middleware.setTech(mws, this.tech_);
            });
        }
        src_(source) {
            const sourceTech = this.selectSource([source]);
            if (!sourceTech) {
                return true;
            }
            if (!stringCases.titleCaseEquals(sourceTech.tech, this.techName_)) {
                this.changingSrc_ = true;
                this.loadTech_(sourceTech.tech, sourceTech.source);
                this.tech_.ready(() => {
                    this.changingSrc_ = false;
                });
                return false;
            }
            this.ready(function () {
                if (this.tech_.constructor.prototype.hasOwnProperty('setSource')) {
                    this.techCall_('setSource', source);
                } else {
                    this.techCall_('src', source.src);
                }
                this.changingSrc_ = false;
            }, true);
            return false;
        }
        load() {
            this.techCall_('load');
        }
        reset() {
            const PromiseClass = this.options_.Promise || window.Promise;
            if (this.paused() || !PromiseClass) {
                this.doReset_();
            } else {
                const playPromise = this.play();
                promise.silencePromise(playPromise.then(() => this.doReset_()));
            }
        }
        doReset_() {
            if (this.tech_) {
                this.tech_.clearTracks('text');
            }
            this.resetCache_();
            this.poster('');
            this.loadTech_(this.options_.techOrder[0], null);
            this.techCall_('reset');
            this.resetControlBarUI_();
            if (evented.isEvented(this)) {
                this.trigger('playerreset');
            }
        }
        resetControlBarUI_() {
            this.resetProgressBar_();
            this.resetPlaybackRate_();
            this.resetVolumeBar_();
        }
        resetProgressBar_() {
            this.currentTime(0);
            const {durationDisplay, remainingTimeDisplay} = this.controlBar;
            if (durationDisplay) {
                durationDisplay.updateContent();
            }
            if (remainingTimeDisplay) {
                remainingTimeDisplay.updateContent();
            }
        }
        resetPlaybackRate_() {
            this.playbackRate(this.defaultPlaybackRate());
            this.handleTechRateChange_();
        }
        resetVolumeBar_() {
            this.volume(1);
            this.trigger('volumechange');
        }
        currentSources() {
            const source = this.currentSource();
            const sources = [];
            if (Object.keys(source).length !== 0) {
                sources.push(source);
            }
            return this.cache_.sources || sources;
        }
        currentSource() {
            return this.cache_.source || {};
        }
        currentSrc() {
            return this.currentSource() && this.currentSource().src || '';
        }
        currentType() {
            return this.currentSource() && this.currentSource().type || '';
        }
        preload(value) {
            if (value !== undefined) {
                this.techCall_('setPreload', value);
                this.options_.preload = value;
                return;
            }
            return this.techGet_('preload');
        }
        autoplay(value) {
            if (value === undefined) {
                return this.options_.autoplay || false;
            }
            let techAutoplay;
            if (typeof value === 'string' && /(any|play|muted)/.test(value)) {
                this.options_.autoplay = value;
                this.manualAutoplay_(value);
                techAutoplay = false;
            } else if (!value) {
                this.options_.autoplay = false;
            } else {
                this.options_.autoplay = true;
            }
            techAutoplay = typeof techAutoplay === 'undefined' ? this.options_.autoplay : techAutoplay;
            if (this.tech_) {
                this.techCall_('setAutoplay', techAutoplay);
            }
        }
        playsinline(value) {
            if (value !== undefined) {
                this.techCall_('setPlaysinline', value);
                this.options_.playsinline = value;
                return this;
            }
            return this.techGet_('playsinline');
        }
        loop(value) {
            if (value !== undefined) {
                this.techCall_('setLoop', value);
                this.options_.loop = value;
                return;
            }
            return this.techGet_('loop');
        }
        poster(src) {
            if (src === undefined) {
                return this.poster_;
            }
            if (!src) {
                src = '';
            }
            if (src === this.poster_) {
                return;
            }
            this.poster_ = src;
            this.techCall_('setPoster', src);
            this.isPosterFromTech_ = false;
            this.trigger('posterchange');
        }
        handleTechPosterChange_() {
            if ((!this.poster_ || this.options_.techCanOverridePoster) && this.tech_ && this.tech_.poster) {
                const newPoster = this.tech_.poster() || '';
                if (newPoster !== this.poster_) {
                    this.poster_ = newPoster;
                    this.isPosterFromTech_ = true;
                    this.trigger('posterchange');
                }
            }
        }
        controls(bool) {
            if (bool === undefined) {
                return !!this.controls_;
            }
            bool = !!bool;
            if (this.controls_ === bool) {
                return;
            }
            this.controls_ = bool;
            if (this.usingNativeControls()) {
                this.techCall_('setControls', bool);
            }
            if (this.controls_) {
                this.removeClass('vjs-controls-disabled');
                this.addClass('vjs-controls-enabled');
                this.trigger('controlsenabled');
                if (!this.usingNativeControls()) {
                    this.addTechControlsListeners_();
                }
            } else {
                this.removeClass('vjs-controls-enabled');
                this.addClass('vjs-controls-disabled');
                this.trigger('controlsdisabled');
                if (!this.usingNativeControls()) {
                    this.removeTechControlsListeners_();
                }
            }
        }
        usingNativeControls(bool) {
            if (bool === undefined) {
                return !!this.usingNativeControls_;
            }
            bool = !!bool;
            if (this.usingNativeControls_ === bool) {
                return;
            }
            this.usingNativeControls_ = bool;
            if (this.usingNativeControls_) {
                this.addClass('vjs-using-native-controls');
                this.trigger('usingnativecontrols');
            } else {
                this.removeClass('vjs-using-native-controls');
                this.trigger('usingcustomcontrols');
            }
        }
        error(err) {
            if (err === undefined) {
                return this.error_ || null;
            }
            if (this.options_.suppressNotSupportedError && err && err.code === 4) {
                const triggerSuppressedError = function () {
                    this.error(err);
                };
                this.options_.suppressNotSupportedError = false;
                this.any([
                    'click',
                    'touchstart'
                ], triggerSuppressedError);
                this.listenToOnce('loadstart', function () {
                    this.unlistenTo([
                        'click',
                        'touchstart'
                    ], triggerSuppressedError);
                });
                return;
            }
            if (err === null) {
                this.error_ = err;
                this.removeClass('vjs-error');
                if (this.errorDisplay) {
                    this.errorDisplay.close();
                }
                return;
            }
            this.error_ = new MediaError(err);
            this.addClass('vjs-error');
            log.error(`(CODE:${ this.error_.code } ${ MediaError.errorTypes[this.error_.code] })`, this.error_.message, this.error_);
            this.trigger('error');
            return;
        }
        reportUserActivity(event) {
            this.userActivity_ = true;
        }
        userActive(bool) {
            if (bool === undefined) {
                return this.userActive_;
            }
            bool = !!bool;
            if (bool === this.userActive_) {
                return;
            }
            this.userActive_ = bool;
            if (this.userActive_) {
                this.userActivity_ = true;
                this.removeClass('vjs-user-inactive');
                this.addClass('vjs-user-active');
                this.trigger('useractive');
                return;
            }
            if (this.tech_) {
                this.tech_.one('mousemove', function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                });
            }
            this.userActivity_ = false;
            this.removeClass('vjs-user-active');
            this.addClass('vjs-user-inactive');
            this.trigger('userinactive');
        }
        listenForUserActivity_() {
            let mouseInProgress;
            let lastMoveX;
            let lastMoveY;
            const handleActivity = Fn.bind(this, this.reportUserActivity);
            const handleMouseMove = function (e) {
                if (e.screenX !== lastMoveX || e.screenY !== lastMoveY) {
                    lastMoveX = e.screenX;
                    lastMoveY = e.screenY;
                    handleActivity();
                }
            };
            const handleMouseDown = function () {
                handleActivity();
                this.clearInterval(mouseInProgress);
                mouseInProgress = this.setInterval(handleActivity, 250);
            };
            const handleMouseUpAndMouseLeave = function (event) {
                handleActivity();
                this.clearInterval(mouseInProgress);
            };
            this.listenTo('mousedown', handleMouseDown);
            this.listenTo('mousemove', handleMouseMove);
            this.listenTo('mouseup', handleMouseUpAndMouseLeave);
            this.listenTo('mouseleave', handleMouseUpAndMouseLeave);
            const controlBar = this.getChild('controlBar');
            if (controlBar && !browser.IS_IOS && !browser.IS_ANDROID) {
                controlBar.on('mouseenter', function (event) {
                    this.player().cache_.inactivityTimeout = this.player().options_.inactivityTimeout;
                    this.player().options_.inactivityTimeout = 0;
                });
                controlBar.on('mouseleave', function (event) {
                    this.player().options_.inactivityTimeout = this.player().cache_.inactivityTimeout;
                });
            }
            this.listenTo('keydown', handleActivity);
            this.listenTo('keyup', handleActivity);
            let inactivityTimeout;
            this.setInterval(function () {
                if (!this.userActivity_) {
                    return;
                }
                this.userActivity_ = false;
                this.userActive(true);
                this.clearTimeout(inactivityTimeout);
                const timeout = this.options_.inactivityTimeout;
                if (timeout <= 0) {
                    return;
                }
                inactivityTimeout = this.setTimeout(function () {
                    if (!this.userActivity_) {
                        this.userActive(false);
                    }
                }, timeout);
            }, 250);
        }
        playbackRate(rate) {
            if (rate !== undefined) {
                this.techCall_('setPlaybackRate', rate);
                return;
            }
            if (this.tech_ && this.tech_.featuresPlaybackRate) {
                return this.cache_.lastPlaybackRate || this.techGet_('playbackRate');
            }
            return 1;
        }
        defaultPlaybackRate(rate) {
            if (rate !== undefined) {
                return this.techCall_('setDefaultPlaybackRate', rate);
            }
            if (this.tech_ && this.tech_.featuresPlaybackRate) {
                return this.techGet_('defaultPlaybackRate');
            }
            return 1;
        }
        isAudio(bool) {
            if (bool !== undefined) {
                this.isAudio_ = !!bool;
                return;
            }
            return !!this.isAudio_;
        }
        addTextTrack(kind, label, language) {
            if (this.tech_) {
                return this.tech_.addTextTrack(kind, label, language);
            }
        }
        addRemoteTextTrack(options, manualCleanup) {
            if (this.tech_) {
                return this.tech_.addRemoteTextTrack(options, manualCleanup);
            }
        }
        removeRemoteTextTrack(obj = {}) {
            let {track} = obj;
            if (!track) {
                track = obj;
            }
            if (this.tech_) {
                return this.tech_.removeRemoteTextTrack(track);
            }
        }
        getVideoPlaybackQuality() {
            return this.techGet_('getVideoPlaybackQuality');
        }
        videoWidth() {
            return this.tech_ && this.tech_.videoWidth && this.tech_.videoWidth() || 0;
        }
        videoHeight() {
            return this.tech_ && this.tech_.videoHeight && this.tech_.videoHeight() || 0;
        }
        language(code) {
            if (code === undefined) {
                return this.language_;
            }
            if (this.language_ !== String(code).toLowerCase()) {
                this.language_ = String(code).toLowerCase();
                if (evented.isEvented(this)) {
                    this.trigger('languagechange');
                }
            }
        }
        languages() {
            return mergeOptions(Player.prototype.options_.languages, this.languages_);
        }
        toJSON() {
            const options = mergeOptions(this.options_);
            const tracks = options.tracks;
            options.tracks = [];
            for (let i = 0; i < tracks.length; i++) {
                let track = tracks[i];
                track = mergeOptions(track);
                track.player = undefined;
                options.tracks[i] = track;
            }
            return options;
        }
        createModal(content, options) {
            options = options || {};
            options.content = content || '';
            const modal = new ModalDialog(this, options);
            this.addChild(modal);
            modal.on('dispose', () => {
                this.removeChild(modal);
            });
            modal.open();
            return modal;
        }
        updateCurrentBreakpoint_() {
            if (!this.responsive()) {
                return;
            }
            const currentBreakpoint = this.currentBreakpoint();
            const currentWidth = this.currentWidth();
            for (let i = 0; i < BREAKPOINT_ORDER.length; i++) {
                const candidateBreakpoint = BREAKPOINT_ORDER[i];
                const maxWidth = this.breakpoints_[candidateBreakpoint];
                if (currentWidth <= maxWidth) {
                    if (currentBreakpoint === candidateBreakpoint) {
                        return;
                    }
                    if (currentBreakpoint) {
                        this.removeClass(BREAKPOINT_CLASSES[currentBreakpoint]);
                    }
                    this.addClass(BREAKPOINT_CLASSES[candidateBreakpoint]);
                    this.breakpoint_ = candidateBreakpoint;
                    break;
                }
            }
        }
        removeCurrentBreakpoint_() {
            const className = this.currentBreakpointClass();
            this.breakpoint_ = '';
            if (className) {
                this.removeClass(className);
            }
        }
        breakpoints(breakpoints) {
            if (breakpoints === undefined) {
                return obj.assign(this.breakpoints_);
            }
            this.breakpoint_ = '';
            this.breakpoints_ = obj.assign({}, DEFAULT_BREAKPOINTS, breakpoints);
            this.updateCurrentBreakpoint_();
            return obj.assign(this.breakpoints_);
        }
        responsive(value) {
            if (value === undefined) {
                return this.responsive_;
            }
            value = Boolean(value);
            const current = this.responsive_;
            if (value === current) {
                return;
            }
            this.responsive_ = value;
            if (value) {
                this.listenTo('playerresize', this.updateCurrentBreakpoint_);
                this.updateCurrentBreakpoint_();
            } else {
                this.unlistenTo('playerresize', this.updateCurrentBreakpoint_);
                this.removeCurrentBreakpoint_();
            }
            return value;
        }
        currentBreakpoint() {
            return this.breakpoint_;
        }
        currentBreakpointClass() {
            return BREAKPOINT_CLASSES[this.breakpoint_] || '';
        }
        loadMedia(media, ready) {
            if (!media || typeof media !== 'object') {
                return;
            }
            this.reset();
            this.cache_.media = mergeOptions(media);
            const {artwork, poster, src, textTracks} = this.cache_.media;
            if (!artwork && poster) {
                this.cache_.media.artwork = [{
                        src: poster,
                        type: mimetypes.getMimetype(poster)
                    }];
            }
            if (src) {
                this.src(src);
            }
            if (poster) {
                this.poster(poster);
            }
            if (Array.isArray(textTracks)) {
                textTracks.forEach(tt => this.addRemoteTextTrack(tt, false));
            }
            this.ready(ready);
        }
        getMedia() {
            if (!this.cache_.media) {
                const poster = this.poster();
                const src = this.currentSources();
                const textTracks = Array.prototype.map.call(this.remoteTextTracks(), tt => ({
                    kind: tt.kind,
                    label: tt.label,
                    language: tt.language,
                    src: tt.src
                }));
                const media = {
                    src,
                    textTracks
                };
                if (poster) {
                    media.poster = poster;
                    media.artwork = [{
                            src: media.poster,
                            type: mimetypes.getMimetype(media.poster)
                        }];
                }
                return media;
            }
            return mergeOptions(this.cache_.media);
        }
        static getTagSettings(tag) {
            const baseOptions = {
                sources: [],
                tracks: []
            };
            const tagOptions = Dom.getAttributes(tag);
            const dataSetup = tagOptions['data-setup'];
            if (Dom.hasClass(tag, 'vjs-fill')) {
                tagOptions.fill = true;
            }
            if (Dom.hasClass(tag, 'vjs-fluid')) {
                tagOptions.fluid = true;
            }
            if (dataSetup !== null) {
                const [err, data] = safeParseTuple(dataSetup || '{}');
                if (err) {
                    log.error(err);
                }
                obj.assign(tagOptions, data);
            }
            obj.assign(baseOptions, tagOptions);
            if (tag.hasChildNodes()) {
                const children = tag.childNodes;
                for (let i = 0, j = children.length; i < j; i++) {
                    const child = children[i];
                    const childName = child.nodeName.toLowerCase();
                    if (childName === 'source') {
                        baseOptions.sources.push(Dom.getAttributes(child));
                    } else if (childName === 'track') {
                        baseOptions.tracks.push(Dom.getAttributes(child));
                    }
                }
            }
            return baseOptions;
        }
        flexNotSupported_() {
            const elem = document.createElement('i');
            return !('flexBasis' in elem.style || 'webkitFlexBasis' in elem.style || 'mozFlexBasis' in elem.style || 'msFlexBasis' in elem.style || 'msFlexOrder' in elem.style);
        }
        debug(enabled) {
            if (enabled === undefined) {
                return this.debugEnabled_;
            }
            if (enabled) {
                this.trigger('debugon');
                this.previousLogLevel_ = this.log.level;
                this.log.level('debug');
                this.debugEnabled_ = true;
            } else {
                this.trigger('debugoff');
                this.log.level(this.previousLogLevel_);
                this.previousLogLevel_ = undefined;
                this.debugEnabled_ = false;
            }
        }
    }
    TRACK_TYPES.ALL.names.forEach(function (name) {
        const props = TRACK_TYPES.ALL[name];
        Player.prototype[props.getterName] = function () {
            if (this.tech_) {
                return this.tech_[props.getterName]();
            }
            this[props.privateName] = this[props.privateName] || new props.ListClass();
            return this[props.privateName];
        };
    });
    Player.prototype.crossorigin = Player.prototype.crossOrigin;
    Player.players = {};
    const navigator = window.navigator;
    Player.prototype.options_ = {
        techOrder: Tech.defaultTechOrder_,
        html5: {},
        inactivityTimeout: 2000,
        playbackRates: [],
        liveui: false,
        children: [
            'mediaLoader',
            'posterImage',
            'textTrackDisplay',
            'loadingSpinner',
            'bigPlayButton',
            'liveTracker',
            'controlBar',
            'errorDisplay',
            'textTrackSettings',
            'resizeManager'
        ],
        language: navigator && (navigator.languages && navigator.languages[0] || navigator.userLanguage || navigator.language) || 'en',
        languages: {},
        notSupportedMessage: 'No compatible source was found for this media.',
        fullscreen: { options: { navigationUI: 'hide' } },
        breakpoints: {},
        responsive: false
    };
    [
        'ended',
        'seeking',
        'seekable',
        'networkState',
        'readyState'
    ].forEach(function (fn) {
        Player.prototype[fn] = function () {
            return this.techGet_(fn);
        };
    });
    TECH_EVENTS_RETRIGGER.forEach(function (event) {
        Player.prototype[`handleTech${ stringCases.toTitleCase(event) }_`] = function () {
            return this.trigger(event);
        };
    });
    Component.registerComponent('Player', Player);
    return Player;
});
define('skylark-videojs/plugin',[
    './mixins/evented',
    './mixins/stateful',
    './utils/events',
    './utils/fn',
    './utils/log',
    './player'
], function (evented, stateful, Events, Fn, log, Player) {
    'use strict';
    const BASE_PLUGIN_NAME = 'plugin';
    const PLUGIN_CACHE_KEY = 'activePlugins_';
    const pluginStorage = {};
    const pluginExists = name => pluginStorage.hasOwnProperty(name);
    const getPlugin = name => pluginExists(name) ? pluginStorage[name] : undefined;
    const markPluginAsActive = (player, name) => {
        player[PLUGIN_CACHE_KEY] = player[PLUGIN_CACHE_KEY] || {};
        player[PLUGIN_CACHE_KEY][name] = true;
    };
    const triggerSetupEvent = (player, hash, before) => {
        const eventName = (before ? 'before' : '') + 'pluginsetup';
        player.trigger(eventName, hash);
        player.trigger(eventName + ':' + hash.name, hash);
    };
    const createBasicPlugin = function (name, plugin) {
        const basicPluginWrapper = function () {
            triggerSetupEvent(this, {
                name,
                plugin,
                instance: null
            }, true);
            const instance = plugin.apply(this, arguments);
            markPluginAsActive(this, name);
            triggerSetupEvent(this, {
                name,
                plugin,
                instance
            });
            return instance;
        };
        Object.keys(plugin).forEach(function (prop) {
            basicPluginWrapper[prop] = plugin[prop];
        });
        return basicPluginWrapper;
    };
    const createPluginFactory = (name, PluginSubClass) => {
        PluginSubClass.prototype.name = name;
        return function (...args) {
            triggerSetupEvent(this, {
                name,
                plugin: PluginSubClass,
                instance: null
            }, true);
            const instance = new PluginSubClass(...[
                this,
                ...args
            ]);
            this[name] = () => instance;
            triggerSetupEvent(this, instance.getEventHash());
            return instance;
        };
    };
    class Plugin {
        constructor(player) {
            if (this.constructor === Plugin) {
                throw new Error('Plugin must be sub-classed; not directly instantiated.');
            }
            this.player = player;
            if (!this.log) {
                this.log = this.player.log.createLogger(this.name);
            }
            evented(this);
            delete this.trigger;
            stateful(this, this.constructor.defaultState);
            markPluginAsActive(player, this.name);
            this.dispose = Fn.bind(this, this.dispose);
            player.on('dispose', this.dispose);
        }
        version() {
            return this.constructor.VERSION;
        }
        getEventHash(hash = {}) {
            hash.name = this.name;
            hash.plugin = this.constructor;
            hash.instance = this;
            return hash;
        }
        trigger(event, hash = {}) {
            return Events.trigger(this.eventBusEl_, event, this.getEventHash(hash));
        }
        handleStateChanged(e) {
        }
        dispose() {
            const {name, player} = this;
            this.trigger('dispose');
            this.unlistenTo();
            player.off('dispose', this.dispose);
            player[PLUGIN_CACHE_KEY][name] = false;
            this.player = this.state = null;
            player[name] = createPluginFactory(name, pluginStorage[name]);
        }
        static isBasic(plugin) {
            const p = typeof plugin === 'string' ? getPlugin(plugin) : plugin;
            return typeof p === 'function' && !Plugin.prototype.isPrototypeOf(p.prototype);
        }
        static registerPlugin(name, plugin) {
            if (typeof name !== 'string') {
                throw new Error(`Illegal plugin name, "${ name }", must be a string, was ${ typeof name }.`);
            }
            if (pluginExists(name)) {
                log.warn(`A plugin named "${ name }" already exists. You may want to avoid re-registering plugins!`);
            } else if (Player.prototype.hasOwnProperty(name)) {
                throw new Error(`Illegal plugin name, "${ name }", cannot share a name with an existing player method!`);
            }
            if (typeof plugin !== 'function') {
                throw new Error(`Illegal plugin for "${ name }", must be a function, was ${ typeof plugin }.`);
            }
            pluginStorage[name] = plugin;
            if (name !== BASE_PLUGIN_NAME) {
                if (Plugin.isBasic(plugin)) {
                    Player.prototype[name] = createBasicPlugin(name, plugin);
                } else {
                    Player.prototype[name] = createPluginFactory(name, plugin);
                }
            }
            return plugin;
        }
        static deregisterPlugin(name) {
            if (name === BASE_PLUGIN_NAME) {
                throw new Error('Cannot de-register base plugin.');
            }
            if (pluginExists(name)) {
                delete pluginStorage[name];
                delete Player.prototype[name];
            }
        }
        static getPlugins(names = Object.keys(pluginStorage)) {
            let result;
            names.forEach(name => {
                const plugin = getPlugin(name);
                if (plugin) {
                    result = result || {};
                    result[name] = plugin;
                }
            });
            return result;
        }
        static getPluginVersion(name) {
            const plugin = getPlugin(name);
            return plugin && plugin.VERSION || '';
        }
    }
    Plugin.getPlugin = getPlugin;
    Plugin.BASE_PLUGIN_NAME = BASE_PLUGIN_NAME;
    Plugin.registerPlugin(BASE_PLUGIN_NAME, Plugin);
    Player.prototype.usingPlugin = function (name) {
        return !!this[PLUGIN_CACHE_KEY] && this[PLUGIN_CACHE_KEY][name] === true;
    };
    Player.prototype.hasPlugin = function (name) {
        return !!pluginExists(name);
    };
    return Plugin;
});
define('skylark-videojs/utils/inherits',[
  "skylark-langx-constructs/inherit"
],function(inherit){
  /*
  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function");
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf(subClass, superClass);
  }
 
  return _inherits;
  */

  return inherit;
});

define('skylark-videojs/extend',[
    './utils/inherits'
], function (_inherits) {
    'use strict';
    const extend = function (superClass, subClassMethods = {}) {
        let subClass = function () {
            superClass.apply(this, arguments);
        };
        let methods = {};
        if (typeof subClassMethods === 'object') {
            if (subClassMethods.constructor !== Object.prototype.constructor) {
                subClass = subClassMethods.constructor;
            }
            methods = subClassMethods;
        } else if (typeof subClassMethods === 'function') {
            subClass = subClassMethods;
        }
        _inherits(subClass, superClass);
        if (superClass) {
            subClass.super_ = superClass;
        }
        for (const name in methods) {
            if (methods.hasOwnProperty(name)) {
                subClass.prototype[name] = methods[name];
            }
        }
        return subClass;
    };
    return extend;
});
define('skylark-videojs/video',[
    "skylark-langx-globals/window",
    'skylark-net-http/xhr',
    './setup',
    './utils/stylesheet',
    './component',
    './event-target',
    './utils/events',
    './player',
    './plugin',
    './utils/merge-options',
    './utils/fn',
    './tracks/text-track',
    './tracks/audio-track',
    './tracks/video-track',
    './utils/time-ranges',
    './utils/format-time',
    './utils/log',
    './utils/dom',
    './utils/browser',
    './utils/url',
    './utils/obj',
    './utils/computed-style',
    './extend',
    './tech/tech',
    './tech/middleware',
    './utils/define-lazy-property'
], function (
    window,
    xhr,
    setup, 
    stylesheet, 
    Component, 
    EventTarget, 
    Events, 
    Player, 
    Plugin, 
    mergeOptions, 
    Fn, 
    TextTrack, 
    AudioTrack, 
    VideoTrack, 
    timeRanges, 
    formatTime, 
    log, 
    Dom, 
    browser, 
    Url, 
    obj, 
    computedStyle, 
    extend, 
    Tech, 
    middleware, 
    defineLazyProperty
) {
    'use strict';

    var middlewareUse = middleware.use,
        TERMINATOR = middleware.TERMINATOR;


    const normalizeId = id => id.indexOf('#') === 0 ? id.slice(1) : id;
    function videojs(id, options, ready) {
        let player = videojs.getPlayer(id);
        if (player) {
            if (options) {
                log.warn(`Player "${ id }" is already initialised. Options will not be applied.`);
            }
            if (ready) {
                player.ready(ready);
            }
            return player;
        }
        const el = typeof id === 'string' ? Dom.$('#' + normalizeId(id)) : id;
        if (!Dom.isEl(el)) {
            throw new TypeError('The element or ID supplied is not valid. (videojs)');
        }
        if (!el.ownerDocument.defaultView || !el.ownerDocument.body.contains(el)) {
            log.warn('The element supplied is not included in the DOM');
        }
        options = options || {};
        videojs.hooks('beforesetup').forEach(hookFunction => {
            const opts = hookFunction(el, mergeOptions(options));
            if (!obj.isObject(opts) || Array.isArray(opts)) {
                log.error('please return an object in beforesetup hooks');
                return;
            }
            options = mergeOptions(options, opts);
        });
        const PlayerComponent = Component.getComponent('Player');
        player = new PlayerComponent(el, options, ready);
        videojs.hooks('setup').forEach(hookFunction => hookFunction(player));
        return player;
    }
    videojs.hooks_ = {};
    videojs.hooks = function (type, fn) {
        videojs.hooks_[type] = videojs.hooks_[type] || [];
        if (fn) {
            videojs.hooks_[type] = videojs.hooks_[type].concat(fn);
        }
        return videojs.hooks_[type];
    };
    videojs.hook = function (type, fn) {
        videojs.hooks(type, fn);
    };
    videojs.hookOnce = function (type, fn) {
        videojs.hooks(type, [].concat(fn).map(original => {
            const wrapper = (...args) => {
                videojs.removeHook(type, wrapper);
                return original(...args);
            };
            return wrapper;
        }));
    };
    videojs.removeHook = function (type, fn) {
        const index = videojs.hooks(type).indexOf(fn);
        if (index <= -1) {
            return false;
        }
        videojs.hooks_[type] = videojs.hooks_[type].slice();
        videojs.hooks_[type].splice(index, 1);
        return true;
    };
    if (window.VIDEOJS_NO_DYNAMIC_STYLE !== true && Dom.isReal()) {
        let style = Dom.$('.vjs-styles-defaults');
        if (!style) {
            style = stylesheet.createStyleElement('vjs-styles-defaults');
            const head = Dom.$('head');
            if (head) {
                head.insertBefore(style, head.firstChild);
            }
            stylesheet.setTextContent(style, `
      .video-js {
        width: 300px;
        height: 150px;
      }

      .vjs-fluid {
        padding-top: 56.25%
      }
    `);
        }
    }
    setup.autoSetupTimeout(1, videojs);
    videojs.VERSION = "7.11.5";
    videojs.options = Player.prototype.options_;
    videojs.getPlayers = () => Player.players;
    videojs.getPlayer = id => {
        const players = Player.players;
        let tag;
        if (typeof id === 'string') {
            const nId = normalizeId(id);
            const player = players[nId];
            if (player) {
                return player;
            }
            tag = Dom.$('#' + nId);
        } else {
            tag = id;
        }
        if (Dom.isEl(tag)) {
            const {player, playerId} = tag;
            if (player || players[playerId]) {
                return player || players[playerId];
            }
        }
    };
    videojs.getAllPlayers = () => Object.keys(Player.players).map(k => Player.players[k]).filter(Boolean);
    videojs.players = Player.players;
    videojs.getComponent = Component.getComponent;
    videojs.registerComponent = (name, comp) => {
        if (Tech.isTech(comp)) {
            log.warn(`The ${ name } tech was registered as a component. It should instead be registered using videojs.registerTech(name, tech)`);
        }
        Component.registerComponent.call(Component, name, comp);
    };
    videojs.getTech = Tech.getTech;
    videojs.registerTech = Tech.registerTech;
    videojs.use = middlewareUse;
    Object.defineProperty(videojs, 'middleware', {
        value: {},
        writeable: false,
        enumerable: true
    });
    Object.defineProperty(videojs.middleware, 'TERMINATOR', {
        value: TERMINATOR,
        writeable: false,
        enumerable: true
    });
    videojs.browser = browser;
    videojs.TOUCH_ENABLED = browser.TOUCH_ENABLED;
    videojs.extend = extend;
    videojs.mergeOptions = mergeOptions;
    videojs.bind = Fn.bind;
    videojs.registerPlugin = Plugin.registerPlugin;
    videojs.deregisterPlugin = Plugin.deregisterPlugin;
    videojs.plugin = (name, plugin) => {
        log.warn('videojs.plugin() is deprecated; use videojs.registerPlugin() instead');
        return Plugin.registerPlugin(name, plugin);
    };
    videojs.getPlugins = Plugin.getPlugins;
    videojs.getPlugin = Plugin.getPlugin;
    videojs.getPluginVersion = Plugin.getPluginVersion;
    videojs.addLanguage = function (code, data) {
        code = ('' + code).toLowerCase();
        videojs.options.languages = mergeOptions(videojs.options.languages, { [code]: data });
        return videojs.options.languages[code];
    };
    videojs.log = log;
    videojs.createLogger = log.createLogger;
    videojs.createTimeRange = videojs.undefined = timeRanges.createTimeRanges;
    videojs.formatTime = formatTime;
    videojs.setFormatTime = formatTime.setFormatTime;
    videojs.resetFormatTime = formatTime.resetFormatTime;
    videojs.parseUrl = Url.parseUrl;
    videojs.isCrossOrigin = Url.isCrossOrigin;
    videojs.EventTarget = EventTarget;
    videojs.on = Events.on;
    videojs.one = Events.one;
    videojs.off = Events.off;
    videojs.trigger = Events.trigger;
    videojs.xhr = xhr;
    videojs.TextTrack = TextTrack;
    videojs.AudioTrack = AudioTrack;
    videojs.VideoTrack = VideoTrack;
    [
        'isEl',
        'isTextNode',
        'createEl',
        'hasClass',
        'addClass',
        'removeClass',
        'toggleClass',
        'setAttributes',
        'getAttributes',
        'emptyEl',
        'appendContent',
        'insertContent'
    ].forEach(k => {
        videojs[k] = function () {
            log.warn(`videojs.${ k }() is deprecated; use videojs.dom.${ k }() instead`);
            return Dom[k].apply(null, arguments);
        };
    });
    videojs.computedStyle = computedStyle;
    videojs.dom = Dom;
    videojs.url = Url;
    videojs.defineLazyProperty = defineLazyProperty;
    return videojs;
});
define('skylark-videojs/main',[
	'skylark-langx/skylark',
    './video'
//    '@videojs/http-streaming'
], function (skylark,videojs) {
    'use strict';

    return skylark.attach("intg.videojs",videojs);
});
define('skylark-videojs', ['skylark-videojs/main'], function (main) { return main; });


},this);
//# sourceMappingURL=sourcemaps/skylark-videojs.js.map
