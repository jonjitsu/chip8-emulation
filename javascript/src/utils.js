module.exports = {
    isNodeJs: function isNodeJs() {
        try {
            return Object.prototype.toString.call(global.process)==='[object process]';
        } catch(e) {
            return false;
        }        
    },
    isBrowser: function isBrowser() {
        return (function() {
            try {
                return this===window;
            } catch(e) {
                return false;
            }
        })();
    },
    isArray: isArray,
    toArray: function(obj) {
        return this.isArray(obj)
            ? obj
            : Object
            .keys(obj)
            .map(function(key) {
                return obj[key];
            });
    },
    toBcd: function(byte) {
        return [
            Math.floor(byte/100),
            Math.floor(byte%100/10),
            byte%100%10
        ];
    },
    extend: extend,
    toHex: toHex,
    error: error,
    debug: debug
};

function toHex(opcode) {
        return ('0000' + opcode.toString(16).toUpperCase()).slice(-4);
}

function error(opcode, message) {
        throw new Error('[' + toHex(opcode) + ']' + message);
}
function debug(opcode, message) {
        return;
        console.log('[' + toHex(opcode) + ']' + message);
}
function isArray(arg) {
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray
    return Object.prototype.toString.call(arg) === '[object Array]';
}

function extend() {
    
    return Array.prototype.slice.call(arguments)
        .reduce(function(o, mixin) {
            if( isArray(mixin) ) {
                mixin = extend.apply(null, mixin);
            }
            
            for(var prop in mixin) {
                if(mixin.hasOwnProperty(prop)) {
                    o[prop] = mixin[prop];
                }
            }
            return o;
        }, {});
}
