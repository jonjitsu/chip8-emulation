module.exports = controller;

var utils = require('./utils'),
    defaults = {
        // element to listen to for keyboard events
        target: document.body
    };

function eventToKey(ev) {
    return ev===undefined ? undefined : ev.which;
}

function controller(options) {
    options = utils.extend(defaults, options);

    var buffer = [],
        listeners = [],
        getch = function() {
            return eventToKey(buffer.shift());
        },
        once = function(fn) {
            listeners.push(fn);
        },
        fireListeners = function() {
            var key = getch();
            listeners.forEach(function(fn) {
                fn(key);
            });
            listeners = [];
        },
        initialize = function() {
            options.target.addEventListener('keypress', function(ev) {
                buffer.push(ev);
                if( listeners.length>0 ) fireListeners();
            });
        }
    ;

    initialize();
    return {
        target: options.target,
        api: {
            keyboardGetch: getch,
            keyboardOnce: once
        }
    };
}
