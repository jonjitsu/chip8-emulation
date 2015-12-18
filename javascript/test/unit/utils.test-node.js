var chai = require('chai'),
    assert = chai.assert,
    utils = require('../../src/utils.js')
    ;

describe('utils(nodejs)', function () {
    describe('isBrowser', function () {
        it('returns false in browser', function () {
            assert.isFalse(utils.isBrowser());
        });
    });

    describe('isNodeJs', function () {
        it('returns true in browser', function () {
            assert.isTrue(utils.isNodeJs());
        });
    });
});
