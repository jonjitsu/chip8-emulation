var chai = require('chai'),
    assert = chai.assert,
    controller = require('../../src/controller.js'),
    utils = require('../../src/utils.js')
    ;

describe('controller', function() {
    it('can create a controller', function() {
        var expected = document.createElement('input'),
            options = {
                target: expected
            },
            c = controller(options);

        assert.strictEqual(expected, c.target);
    });

    // function mockKeyEventOld(key) {
    //     //https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/KeyboardEvent
    //     var options = {
    //         key:'', code:'', location:0,
    //         ctrlKey:false, shiftKey:false, altKey:false, metaKey:false,
    //         repeat:false, isComposing:false,
    //         charCode:key, keyCode:key, which:key
    //     }
    //     return new KeyboardEvent('keypress', options);
    // }
    // //http://jsbin.com/awenaq/4
    // function mockKeyEvent(keyCode) {
    //     var eventObj = document.createEventObject ?
    //         document.createEventObject() : document.createEvent("Events");
  
    //     if(eventObj.initEvent){
    //         eventObj.initEvent("keydown", true, true);
    //     }
  
    //     eventObj.keyCode = keyCode;
    //     eventObj.which = keyCode;
    //     return eventObj;
    // }
    // function dispatchKey(key, el) {
    //     var eventObj = mockKeyEvent(key);
    //     el.dispatchEvent ? el.dispatchEvent(eventObj) : el.fireEvent("onkeydown", eventObj); 
    // }

    function mockElement() {
        return {
            count: 0,
            listener: undefined,
            addEventListener: function(eventName, fn) {
                this.listener = fn;
            }
        };
    }
    function mockKeyEvent(key) {
        return {which:key, keyCode:key, charCode:key};
    }
    it('getch: can do a non-blocking get key', function() {
        var element = mockElement(),
            options = {
                target: element,
            },
            c = controller(options);

        assert.strictEqual(undefined, c.api.keyboardGetch());
        element.listener(mockKeyEvent(77));
        assert.strictEqual(77, c.api.keyboardGetch());
    });

    it('once: can register a callback to receive the next keypress', function() {
        var element = mockElement(),
            options = {
                target: element,
            },
            c = controller(options),

            callCount = 0,
            expectedKey = 77,
            actualKey = undefined,
            expectedCb = function(key) { actualKey=key, callCount++; };


        c.api.keyboardOnce(expectedCb);
        console.log('once');
        assert.strictEqual(undefined, c.api.keyboardGetch());
        element.listener(mockKeyEvent(77));
        assert.strictEqual(expectedKey, actualKey); 
        element.listener(mockKeyEvent(77));
        assert.strictEqual(1, callCount);
    });
});
