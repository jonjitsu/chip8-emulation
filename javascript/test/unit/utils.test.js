var chai = require('chai'),
    assert = chai.assert,
    utils = require('../../src/utils.js')
    ;

describe('utils', function () {
    describe('toArray', function() {
        it('returns an array of values when given an object', function() {
            var o = { a:1, b:2, c:'3'},
                expected = [1,2,'3'];
            assert.deepEqual(expected, utils.toArray(o));
        });
    });

    describe('toBcd', function() {
        it('converts a byte to BCD', function() {
            assert.deepEqual([2,5,5], utils.toBcd(255));
            assert.deepEqual([0,0,0], utils.toBcd(0));
        });
    });

    describe('extend', function() {
        it('merges any number of objects', function() {
            var o1 = {a:1}, o2 = {b:2}, o3 = {a:2,c:4};
            assert.deepEqual({a:2,b:2,c:4}, utils.extend(o1,o2,o3));
        });
    });
});
