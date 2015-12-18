
var l = console.log.bind(console),
    fs = require('fs'),
    path = require('path'),
    utils = require('./utils'),
    isExistingPath = function(p) {
        return fs.existsSync(p);
    },
    detectScheme = function detectScheme(uri) {
        var parts;
        if( (parts = /^([a-zA-Z0-9+\-.]+):\/\//.exec(uri)) ) {
            return parts[1];
        } else if( utils.isNodeJs() ) {
            if( isExistingPath(uri) ) return 'file';
            else return null;
        }

        return 'file';
    },

    fetchFile = function(path) {
        return new Promise(function(resolve, reject) {
            fs.readFile(path, function(error, data) {
                if(error) reject(error);
                resolve(data);
            });
        });
    }, 

    nodeCurl = function(uri) {
        return new Promise(function(resolve, reject) {
            require('http').get(uri, function(response) {
                var data=[];
                response
                    .on('data', function(chunk) {
                        data.push(chunk);
                    });
                response
                    .on('end', function() {
                        resolve(data.join(''));
                    });
            })
            .on('error', function(e) {
                reject(e);
            });
        });
    },
    ajaxCurl = function(uri) {
        // CORS
        // ajax
    },
    fetchHttp = function(uri) {
        return utils.isNodeJs()
            ? nodeCurl(uri)
            : ajaxCurl(uri);
    },
    fetch = function fetch(uri) {
        var scheme = detectScheme(uri);

        if( scheme==='file' ) return fetchFile(uri);
        if( /^http[s]?$/.test(scheme) ) return fetchHttp(uri);
        throw new Error('[fetch]: Cannot detect scheme for: ' + uri);
    }
;

fetch.detectScheme = detectScheme;
module.exports = fetch;
