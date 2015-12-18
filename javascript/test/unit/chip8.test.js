var c8 = require('../../src/chip8.js'),
    assert = require('chai').assert
;

describe('chip8', function () {
    it('can create state', function () {
        var vm = c8.create();
        assert.isObject(vm);
        assert.sameMembers(['ram', 'registers', 'stack', 'pc', 'sp', 'i', 'dt', 'st'], Object.keys(vm.state));
    });

    it('can load in data', function() {
        var vm = c8.create(),
            expected = [0x00, 0xEE, 0x15, 0xFE]
        ;

        c8.loadData(vm, expected);

        assert.deepEqual(vm.state.ram.slice(0x200, 0x200+expected.length), new Uint8Array(expected));
        assert.equal(vm.state.pc, 0x200);
    });

    it('can get next opcode', function() {
        var vm = c8.create(),
            expected = [0x00, 0xEE, 0x15, 0xFE]
        ;

        c8.loadProgram(vm, expected);

        assert.equal(0x00EE, c8.nextOpcode(vm));
    });

    it('has fonts', function() {
        var vm = c8.create(),
            zero = [0xF0, 0x90, 0x90, 0x90, 0xF0],
            eff = [0xF0, 0x80, 0xF0, 0x80, 0x80];

        assert.deepEqual(zero, c8.sliceData(vm, c8.FONT_ADDR, c8.FONT_SIZE));
        assert.deepEqual(eff, c8.sliceData(vm, c8.FONT_ADDR + (c8.FONT_SIZE*0xf), c8.FONT_SIZE));
    });

    it('has a dummy bus', function() {
        var vm = c8.create();

        assert.isDefined(vm.bus);
        c8.BUS_EVENTS.forEach(function(event) {
            assert.isFunction(vm.bus[event]);
        });
    });

    it('can mixin buses in state creation', function() {
        var m1 = { soundOn: function() {}},
            m2 = { soundOff: function() {}},
            vm = c8.create(m1, m2);

        assert.strictEqual(m1.soundOn, vm.bus.soundOn);
        assert.strictEqual(m2.soundOff, vm.bus.soundOff);
    });

    describe('opcodes', function() {

        it('[1nnn] can jump to location nnn', function() {
            var vm = c8.create(),
                opcode = 0x12EF;

            c8.process(vm, opcode);
            assert.equal(vm.state.pc, 0x2EF);
        });

        it('[2nnn] can call subroutine at nnn', function() {
            var vm = c8.create(),
                opcode = 0x23A2,
                oldPc = vm.state.pc,
                oldSp = vm.state.sp;

            c8.process(vm, opcode);
            assert.equal(vm.state.sp, oldSp+1);
            assert.equal(vm.state.stack[0], oldPc);
            assert.equal(vm.state.pc, 0x03A2);
        });

        it('[00EE] can return from a subroutine', function() {
            var vm = c8.create();

            c8.process(vm, 0x2208);
            c8.process(vm, 0x00EE);
            assert.equal(vm.state.sp, 0);
            assert.equal(vm.state.pc, 0x200);
        });

        it('[3xkk] can skip next instruction if Vx = kk', function() {
            var vm = c8.create(),
                opcode = 0x34a3;

            vm.state.registers[4]=0xa3;
            c8.process(vm, opcode);
            assert.equal(vm.state.pc, 0x202);

            opcode = 0x3312;
            c8.process(vm, opcode);
            assert.equal(vm.state.pc, 0x202);
        });

        it('[4xkk] can skip next instruction if Vx != kk', function() {
            var vm = c8.create(),
                opcode = 0x4a23;
            
            c8.process(vm, opcode);
            assert.equal(vm.state.pc, 0x202);

            opcode = 0x4a33;
            vm.state.registers[0xa]=0x33;
            c8.process(vm, opcode);
        });

        it('[5xy0] can skip next instruction if Vx = Vy', function() {
            var vm = c8.create(),
                opcode = 0x52f0;

            vm.state.registers[2]=0x17;
            c8.process(vm, opcode);
            assert.equal(vm.state.pc, 0x200);

            vm.state.registers[0xf]=0x17;
            c8.process(vm, opcode);
            assert.equal(vm.state.pc, 0x202);
        });

        it('[6xkk] can put the value kk into register Vx', function() {
            var vm = c8.create(),
                opcode = 0x6ef2;

            c8.process(vm, opcode);
            assert.equal(vm.state.registers[0xe], 0xf2);
        });

        it('[7xkk] can add the value kk to the value of register Vx, then stores the result in Vx', function() {
            var vm = c8.create(),
                opcode = 0x7b7a;

            c8.process(vm, opcode);
            assert.equal(vm.state.registers[0xb], 0x7a);

            opcode = 0x7bdd;
            c8.process(vm, opcode);
            assert.equal(vm.state.registers[0xb], (0x7a+0xdd)&0xff); 
        });

        it('[8xy0] stores the value of register Vy in register Vx', function() {
            var vm = c8.create(),
                opcode = 0x80f0;

            c8.process(vm, opcode);
            assert.equal(vm.state.registers[0x0], vm.state.registers[0xf]);
        });

        it('[8xy1] can set Vx = Vx OR Vy', function() {
            var vm = c8.create(),
                opcode = 0x8d11,
                x = 0x19, y = 0x45;

            vm.state.registers[0xd] = x;
            vm.state.registers[0x1] = y;
            c8.process(vm, opcode);
            assert.equal(vm.state.registers[0xd], x|y)
            assert.equal(vm.state.registers[0x1], y);
        });

        it('[8xy2] can set Vx = Vx AND Vy', function() {
            var vm = c8.create(),
                opcode = 0x8102,
                x = 0x19, y = 0x45;
 
            vm.state.registers[0x1] = x;
            vm.state.registers[0x0] = y;
            c8.process(vm, opcode);
            assert.equal(vm.state.registers[0x1], x&y);
            assert.equal(vm.state.registers[0x0], y);
        });

        it('[8xy3] can set Vx = Vx XOR Vy', function() {
            var vm = c8.create(),
                opcode = 0x8ab3,
                x = 0x19, y = 0x45;

            vm.state.registers[0xa] = x;
            vm.state.registers[0xb] = y;
            c8.process(vm, opcode);
            assert.equal(vm.state.registers[0xa], x^y);
            assert.equal(vm.state.registers[0xb], y);
        });

        it('[8xy4] can set Vx = Vx + Vy, set VF = carry', function() {
            // The values of Vx and Vy are added together.
            // If the result is greater than 8 bits (i.e., > 255,)
            // VF is set to 1, otherwise 0.
            // Only the lowest 8 bits of the result are kept, and stored in Vx.
            var vm = c8.create(),
                opcode = 0x8784,
                x = 0x19, y = 0x45;

            vm.state.registers[0xf] = 32;
            vm.state.registers[0x7] = x;
            vm.state.registers[0x8] = y;
            c8.process(vm, opcode);
            assert.equal(vm.state.registers[0x7], x+y);
            assert.equal(vm.state.registers[0xf], 0);  // no carry

            x+=y;
            y = 0xff;
            vm.state.registers[0x8] = y;
            c8.process(vm, opcode);
            assert.equal(vm.state.registers[0x7], (x+y)&0xff);
            assert.equal(vm.state.registers[0xf], 1);
        });

        it('[8xy5] can set Vx = Vx - Vy, set VF = NOT borrow.', function() {
            // If Vx > Vy,
            //   then VF is set to 1,
            //   otherwise 0.
            // Then Vy is subtracted from Vx, and the results stored in Vx.
            var vm = c8.create(),
                opcode = 0x8245,
                x = 0x19, y = 0x45;

            vm.state.registers[0xf] = 32;
            vm.state.registers[0x2] = x;
            vm.state.registers[0x4] = y;
            c8.process(vm, opcode);
            assert.equal(vm.state.registers[0x2], Math.abs(x-y));
            assert.equal(vm.state.registers[0xf], 0);

            x = Math.abs(x-y);
            y = 0x2;
            vm.state.registers[0x4] = y;
            c8.process(vm, opcode);
            assert.equal(vm.state.registers[0x2], Math.abs(x-y));
            assert.equal(vm.state.registers[0xf], 1);
        });

        it('[8xy6] can set Vx = Vx SHR 1', function() {
            // If the least-significant bit of Vx is 1,
            //    then VF is set to 1,
            //    otherwise 0.
            // Then Vx is divided by 2.
            var vm = c8.create(),
                opcode = 0x8016,
                x = 0x2;

            vm.state.registers[0xf] = 32;
            vm.state.registers[0x0] = x;
            c8.process(vm, opcode);
            assert.equal(vm.state.registers[0x0], x>>>1);
            assert.equal(vm.state.registers[0xf], 0);

            x = x>>>1;
            c8.process(vm, opcode);
            assert.equal(vm.state.registers[0x0], x>>>1);
            assert.equal(vm.state.registers[0xf], 1);
        });

        it('[8xy7] can set Vx = Vy - Vx, set VF = NOT borrow', function() {
            // If Vy > Vx,
            //   then VF is set to 1,
            //   otherwise 0.
            // Then Vx is subtracted from Vy, and the results stored in Vx.
            var vm = c8.create(),
                opcode = 0x8de7,
                x = 0x19, y = 0x45;
 
            vm.state.registers[0xf] = 32;
            vm.state.registers[0xd] = x;
            vm.state.registers[0xe] = y;
            c8.process(vm, opcode);
            assert.equal(vm.state.registers[0xd], y-x);
            assert.equal(vm.state.registers[0xf], 1);

            x = y-x;
            y = 0x02;
            vm.state.registers[0xe] = y;
            c8.process(vm, opcode);
            assert.equal(vm.state.registers[0xd], Math.abs(y-x));
            assert.equal(vm.state.registers[0xf], 0);
        });

        it('[8xyE] can set Vx = Vx SHL 1', function() {
            // If the most-significant bit of Vx is 1,
            //    then VF is set to 1,
            //    otherwise to 0.
            // Then Vx is multiplied by 2.
            var vm = c8.create(),
                opcode = 0x801E,
                x = 0x7f, y = 0x45;

            vm.state.registers[0xf] = 32;
            vm.state.registers[0x0] = x;
            c8.process(vm, opcode);
            assert.equal(vm.state.registers[0x0], x<<1);
            assert.equal(vm.state.registers[0xf], 0);

            x = x<<1;
            c8.process(vm, opcode);
            assert.equal(vm.state.registers[0x0], (x<<1)&0xff);
            assert.equal(vm.state.registers[0xf], 1);
        });

        it('[9xy0] can skip next instruction if Vx!=Vy', function() {
            var vm = c8.create(),
                opcode = 0x9ab0;

            vm.state.registers[0xa] = 0x11;
            vm.state.registers[0xb] = 0x11;
            c8.process(vm, opcode);
            assert.equal(vm.state.pc, 0x200);

            vm.state.registers[0xb] = 0x10;
            c8.process(vm, opcode);
            assert.equal(vm.state.pc, 0x202);
        });

        it('[Annn] can set I register to nnn', function() {
            var vm = c8.create(),
                nnn = 0x0321,
                opcode = 0xA000 + nnn
            ;

            c8.process(vm, opcode);
            assert.equal(vm.state.i, nnn);
        });

        it('[Bnnn] can jump to location nnn+V0', function() {
            var vm = c8.create(),
                v0 = 0x32;
                nnn = 0x02a1,
                opcode = 0xB000 + nnn;

            vm.state.registers[0] = 0x32;
            c8.process(vm, opcode);
            assert.equal(vm.state.pc, v0+nnn);
            // @TODO what happens in case of overflow?
        });

        it('[Cxkk] can set Vx = random byte AND kk', function() {
            var vm = c8.create(),
                x = 0xd,
                kk = 0x21,
                opcode = 0xC000 | (x<<8) | kk,
                randomByte = 0xd3;

            Math.random = function() { return randomByte/0xff; };
            c8.process(vm, opcode);
            assert.equal(vm.state.registers[x], randomByte & kk);
        });

        it('[00E0] can clear screen', function() {
            var displayClearCallCount=0,
                bus = {
                    displayClear: function() {
                        displayClearCallCount++;
                    }
                },
                vm = c8.create(bus),
                opcode = 0x00E0;

            c8.process(vm, opcode);
            assert(1===displayClearCallCount);
        });
        it('[Dxyn] can display n-byte sprite starting at memory location I at (Vx, Vy), set VF = collision', function() {
            var spy={},
                bus = {
                    displayDraw: function(x, y, sprite) {
                        spy = { x:x, y:y, sprite:sprite };
                    }
                },
                vm = c8.create(bus),
                x = 0xa, y = 0x3, n = 5,
                opcode = 0xD000 | (x<<8) | (y<<4) | n,
                row = 9, col = 17,
                expected = { x:col, y:row, sprite:c8.sliceData(vm, c8.FONT_ADDR, n) }
            ;
            vm.state.i = c8.FONT_ADDR;
            vm.state.registers[x] = col;
            vm.state.registers[y] = row;
            c8.process(vm, opcode);
            assert.deepEqual(expected, spy);
        });

        it('[Ex9E] can skip next instruction if key with the value of Vx is pressed.', function() {
            var 
                key = 0x4,
                bus = { keyboardGetch: function() { return key; } },
                vm = c8.create(bus),
                x = 0xe,
                opcode = 0xE000 | (x<<8) | 0x9E;

            c8.process(vm, opcode);
            assert(c8.PROGRAM_ENTRY===vm.state.pc);

            vm.state.registers[x] = key;
            c8.process(vm, opcode);
            assert(c8.PROGRAM_ENTRY+2===vm.state.pc);
        });

        it('[ExA1] can skip next instruction if key with the value of Vx is not pressed', function() {
            var
                key = 0x4,
                bus = { keyboardGetch: function() { return key; } },
                vm = c8.create(bus),
                x = 0xe,
                opcode = 0xE000 | (x<<8) | 0xA1;

            c8.process(vm, opcode);
            assert(c8.PROGRAM_ENTRY+2===vm.state.pc);

            vm.state.registers[x] = key;
            c8.process(vm, opcode);
            assert(c8.PROGRAM_ENTRY+2===vm.state.pc);
        });

        it('[Fx0A] can wait for a key press, store the value of the key in Vx', function(done) {
            this.timeout(500);

            var key = 0x7,
                bus = {
                    keyboardOnce: function(fn) {
                        setTimeout(fn.bind(null, key), 100);
                    }
                },
                vm = c8.create(bus),
                x = 0x5,
                opcode = 0xF000 | (x<<8) | 0x0A;

            vm.isWaiting=false;
            vm.state.registers[x]=1;
            c8.process(vm, opcode);
            assert.isTrue(vm.isWaiting);
            assert(1===vm.state.registers[x]);
            setTimeout(function() {
                assert.isFalse(vm.isWaiting);
                assert(key===vm.state.registers[x]);
                done();
            }, 200);
        });

        it('[Fx07] can set Vx = delay timer value.', function() {
            var vm = c8.create(),
                x = 0xd,
                opcode = 0xF000 | (x<<8) | 0x07;

            vm.state.registers[x] = 32;
            c8.process(vm, opcode);
            assert.equal(vm.state.registers[x], vm.state.dt);
            vm.state.dt = 2;

            c8.process(vm, opcode);
            assert.equal(vm.state.registers[x], vm.state.dt);
        });

        it('[Fx15] can set delay timer = Vx', function() {
            var vm = c8.create(),
                x = 0xd,
                opcode = 0xF000 | (x<<8) | 0x15;

            vm.state.registers[x] = 2;
            vm.state.dt = 0;
            c8.process(vm, opcode);
            assert.equal(vm.state.dt, vm.state.registers[x]);
            assert.equal(vm.state.dt, 2);
        });

        it('[Fx18] can set sound timer = Vx', function() {
            var vm = c8.create(),
                x = 0xa,
                opcode = 0xF000 | (x<<8) | 0x18;

            vm.state.registers[x]=3;
            vm.state.st=0;
            c8.process(vm, opcode);
            assert.equal(vm.state.st, vm.state.registers[x]);
            assert.equal(vm.state.st, 3);
        });

        it('[Fx1E] can set I = I + Vx', function(){
            var vm = c8.create(),
                x = 0x4,
                opcode = 0xF000 | (x<<8) | 0x1E;

            vm.state.i = 0x10;
            vm.state.registers[x] = 0xD2;
            c8.process(vm, opcode);
            assert.equal(vm.state.i, 0x10 + 0xD2);


        });

        it('[Fx29] can set I = location of sprite for digit Vx', function() {
            var vm = c8.create(),
                x = 0xd,
                opcode = 0xF000 | (x<<8) | 0x29;

            vm.state.i=0;
            vm.state.registers[x] = 0x0F;
            c8.process(vm, opcode);
            assert.equal(vm.state.i, c8.FONT_ADDR + c8.FONT_SIZE*0x0F);

            vm.state.registers[x] = 0x00;
            c8.process(vm, opcode);
            assert.equal(vm.state.i, c8.FONT_ADDR);
        });

        it('[Fx33] can store BCD representation of Vx in memory locations I, I+1, I+2', function(){
            var vm = c8.create(),
                x = 0xd,
                opcode = 0xF000 | (x<<8) | 0x33;

            vm.state.i = 0;
            vm.state.registers[x] = 0xFF;
            c8.process(vm, opcode);
            assert.deepEqual(c8.sliceData(vm, vm.state.i, vm.state.i+3), [2, 5, 5]); 
        });

        it('[Fx55] can store V0-Vx into memory starting at I', function() {
            var vm = c8.create(),
                x = 0xd,
                opcode = 0xF000 | (x<<8) | 0x55,
                expected = [], val, i;

            vm.state.i=0x100;
            for(i=0; i<=x; i++) {
                val = i + 0x23;
                expected[i] = val;
                vm.state.registers[i] = val;
            }

            c8.process(vm, opcode);
            assert.deepEqual(c8.sliceData(vm, vm.state.i, i), expected);
        });

        it('[Fx65] can load registers V0-Vx from memory starting at I', function() {
            var vm = c8.create(),
                x = 0xd,
                opcode = 0xF000 | (x<<8) | 0x65,
                expected = [], val, i;

            vm.state.i=0x100;
            for(i=0; i<=x; i++) {
                val = i + 0x23;
                expected[i] = val;
            }
            c8.loadData(vm, expected, vm.state.i);

            c8.process(vm, opcode);
            expected.forEach(function(val, reg) {
                assert.equal(val, vm.state.registers[reg]);
            });
            assert.equal(0, vm.state.registers[0xe]);
            assert.equal(0, vm.state.registers[0xf]);
        });
    });

    describe('@TODO events', function() {
        
    });
});

