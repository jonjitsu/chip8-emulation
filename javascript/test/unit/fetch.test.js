var chai = require('chai'),
    assert = chai.assert,
    fetch = require('../../src/fetch.js')
;

describe('fetch', function() {
    describe('detectScheme', function() {

        it('can detect uri schemes', function() {
            assert.equal('file', fetch.detectScheme('file:///home/user/file.js'));
            assert.equal('file', fetch.detectScheme('file:///home/user/'));
            assert.equal('http', fetch.detectScheme('http://www.google.com/search?q=123%20abc'));
            assert.equal('https', fetch.detectScheme('https://l3.l2-a.l1.example.com?q=123%20abc'));
        });

        it('can detect file paths', function() {
            assert.equal('file', fetch.detectScheme('.'));
            assert.equal('file', fetch.detectScheme('./src/fetch.js'));
            assert.equal('file', fetch.detectScheme('..'));
            // assert.equal('file', fetch.detectScheme('../src'));
            assert.equal('file', fetch.detectScheme('test'));
            assert.equal('file', fetch.detectScheme('./test')); 
            assert.equal('file', fetch.detectScheme(__dirname + '/../unit'));
        });
    });
});
