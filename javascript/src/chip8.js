
const RAMSIZE = 4096,
      PROGRAM_ENTRY = 0x200,
      FONT_ADDR = 0x00,
      FONT_SIZE = 5,
      FONTS = [
          0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
          0x20, 0x60, 0x20, 0x20, 0x70, // 1
          0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
          0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
          0x90, 0x90, 0xF0, 0x10, 0x10, // 4
          0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
          0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
          0xF0, 0x10, 0x20, 0x40, 0x40, // 7
          0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
          0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
          0xF0, 0x90, 0xF0, 0x90, 0x90, // A
          0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
          0xF0, 0x80, 0x80, 0x80, 0xF0, // C
          0xE0, 0x90, 0x90, 0x90, 0xE0, // D
          0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
          0xF0, 0x80, 0xF0, 0x80, 0x80 // F
      ],
      BUS_EVENTS = [
          // display
          'displayClear', 'displayDraw',
          // keyboard
          'keyboardGetch', 'keyboardOnce',
          // sound
          'soundOn', 'soundOff'
      ],
      // in milliseconds
      TIMER_FREQUENCY = 1000/60
;
var utils = require('./utils'),


    now = function() {
        return new Date().getTime();
    },
    timer = function(timeout) {
        var last = now();
        return {
            isDone: function() {
                var current = now();
                if( current-last >= timeout ) {
                    last = current;
                    return true;
                }
                return false;
            },
            reset: function() {
                last = now();
            }
        }
    },
    // vm.bus.fire('scr:clr');
    // colision = vm.bus.fire('scr:drw', row, col, data);
    // key = vm.bus.fire('kbd:look');
    // vm.bus.fire('snd:on');
    // vm.bus.fire('snd:off');
    
    // state.renderer.clear();
    // state.renderer.draw(row, col, data);
    // state.kbd.look();
    // state.snd.on();
    // state.snd.off();
    
    // vm.bus.scrClr();
    // vm.bus.scrDraw(row, col, data);
    // vm.bus.kbdLook();
    // vm.bus.sndOn();
    // vm.bus.sndOff();
    bus = function() {
        var bus = BUS_EVENTS.reduce(function(bus, event) {
            bus[event] = function() { debug(event, 'Event called from dummy bus'); };
            return bus;
        }, {});
        return utils.extend(bus, [].slice.call(arguments))
    },
    initFonts = function(ram, start) {
        FONTS.forEach(function(part, i) {
            ram[start+i] = part;
        });
        return ram;
    },
    // builder = function(vm) {
    //     if( typeof vm!=='object' ) vm = {};
    //     return {
    //         instance = function() { return vm; },
    //         addState: function() {
    //             vm.state = state();
    //             return this;
    //         },
    //         addBus: function() {
    //             vm.bus = bus.apply(null, arguments);
    //             return this;
    //         },
    //         addRam: function(size) {
    //             if(size===undefined) size = RAMSIZE;
    //             vm.ram = ram(size);
    //             return this;
    //         }
    //     };
    // },
    ram = function(size) {
        return initFonts(new Uint8Array(size), FONT_ADDR);
    },
    /*
      Machine state
     */
    state = function state() {
        return {
            ram: ram(RAMSIZE),
            // ram: new Uint8Array(RAMSIZE),
            registers: new Uint8Array(16),
            stack: new Uint16Array(16),
            pc: PROGRAM_ENTRY,
            sp: 0,
            i: 0,
            dt: 0,
            st: 0
        };
    },


    intervalStepper = function stepper(rateInMs) {
        if( rateInMs===undefined ) rateInMs = 1000/60;

        var id;
        return {
            start: function(fn) {
                id = setInterval(fn, rateInMs);
            },
            stop: function() {
                clearInterval(id);
            }
        };
    },
    create = function() {
        var isRunning = false,
            run = function(vm) {
                isRunning = true;
                while(isRunning) {
                    step(vm);
                    doTimers(vm);
                }
            },
            step = function(vm) {
                var opcode = nextOpcode(vm);
                debug(opcode, 'Processing...');
                process(vm, opcode);
            },
            doTimers = function(vm) {
                if( vm.state.dt>0 && vm.dtTimer.isDone() ) vm.state.dt--;
                if( vm.state.st>0 && vm.stTimer.isDone() ) vm.state.st--;
            }
        ;
        return {
            state: state(),
            bus: bus.apply(null, arguments),
            eop: 0x200,
            isWaiting: false,
            dtTimer: timer(TIMER_FREQUENCY),
            stTimer: timer(TIMER_FREQUENCY),
            stepper: intervalStepper(TIMER_FREQUENCY),
            step: function() {
                step(this)
            },
            doTimers: function() {
                doTimers(this);
            },
            run: function(stepper) {
                var vm = this;

                if( stepper===undefined ) stepper = vm.stepper;

                isRunning = true;
                stepper.start(function() {
                    if(isRunning) {
                        if( vm.isWaiting ) return;
                        step(vm); 
                        doTimers(vm);
                    } else {
                        stepper.stop();
                    }
                });
            },
            reset: function() {
                this.state.pc = PROGRAM_ENTRY;
                this.bus.displayClear();
            },
            break: function() {
                isRunning = false;
            },
            loadProgram: function(data) {
                loadProgramFromArray(this, data);
            }
        };
    },
    loadData = function(vm, data, pos) {
        if( pos===undefined ) pos = PROGRAM_ENTRY;
        vm.state.ram.set(data, pos);
    },
    sliceData = function(vm, pos, length) {
        if( pos===undefined ) {
            pos = 0; length=RAMSIZE;
        } else if( length===undefined ) {
            length=RAMSIZE;
        }
        return utils.toArray(vm.state.ram.slice(pos, pos+length));
    },
    loadProgramFromArray = function(vm, data) {
        loadData(vm, data, PROGRAM_ENTRY);
        vm.eop = PROGRAM_ENTRY + data.length;
    },
    nextOpcode = function(vm) {
        if (vm.state.pc >= vm.eop) throw new Error('End of Program'); 
        return (vm.state.ram[vm.state.pc++]<<8) | vm.state.ram[vm.state.pc++];
        // return (vm.state.ram[vm.state.pc]<<8) | vm.state.ram[vm.state.pc+1];
    },

    extractAddress = function(opcode) {
        return opcode & 0x0fff;
    },

    extractRegister = function(opcode) {
        return (opcode>>>8) & 0xF;
    },
    extractValue = function(opcode) {
        return opcode & 0x00ff;
    },

    asHex = function(code) {
        return ('0000' + code.toString(16).toUpperCase()).slice(-4);
    },
    error = function(opcode, message) {
        throw new Error('[' + asHex(opcode) + ']' + message);
    },
    debug = function(opcode, message) {
        console.log('[' + asHex(opcode) + ']' + message);
    },

    randomByte = function(start, end) {
        if( start===undefined ) {
            start=0x00; end=0xFF;
        } else if (end===undefined) {
            end = start;
            start = 0x00;
        }

        var range = end-start;
        return (Math.floor(Math.random()*range)+start)&0xFF;
    },
/*
  Order matters. Each index represents the type of operand.
*/
    ops = [
        function sys(state, opcode, vm) {
            if( (opcode>>>8)===0 ) {
                if( (opcode & 0x00FF)===0xE0 ) {
                    vm.bus.displayClear();
                } else if( (opcode & 0x00FF)===0xEE ) {
                    if( state.sp<=0 ) error(opcode, 'Stack pointer less than 0.');
                    state.sp--;
                    state.pc = state.stack[state.sp];
                }
            }
            // sys call 0NNN which is deprecated
            // end subroutine with 0xD4 bytedd
        },
        function jp(state, opcode) {
            state.pc = extractAddress(opcode);
        },
        function call(state, opcode) {
            state.stack[state.sp++]=state.pc;
            state.pc = extractAddress(opcode);
            if(state.sp>16) error(opcode, 'Stack pointer greater than 16.');
        },
        function se(state, opcode) {
            var reg = extractRegister(opcode),
                value = opcode & 0xff;
            if( value === state.registers[reg] ) state.pc+=2;
        },
        function sne(state, opcode) {
            var reg = extractRegister(opcode),
                value = opcode & 0xff;
            if( value !== state.registers[reg] ) state.pc+=2;
        },
        function sev(state, opcode) {
            var y = (opcode>>>4) & 0x00F,
                x = (opcode>>>8) & 0x0F;

            if( state.registers[x]===state.registers[y] ) {
                state.pc+=2;
            }
        },
        function ld(state, opcode) {
            var reg = extractRegister(opcode),
                val = extractValue(opcode);

            state.registers[reg] = val;
        },
        function add(state, opcode) {
            var reg = extractRegister(opcode),
                val = extractValue(opcode);

            //overflow no carry flag set
            state.registers[reg]+=val;
        },
        function op8xyn(state, opcode) {
            var type = opcode & 0xf,
                y = (opcode>>>4) & 0x00F,
                x = (opcode>>>8) & 0x0F,
                value;

            switch(type) {
            case 0: state.registers[x] = state.registers[y]; break;
            case 1: state.registers[x] |= state.registers[y]; break;
            case 2: state.registers[x] &= state.registers[y]; break;
            case 3: state.registers[x] ^= state.registers[y]; break;

            // If the result is greater than 8 bits (i.e., > 255,)
            // VF is set to 1, otherwise 0.
            // Only the lowest 8 bits of the result are kept, and stored in Vx.
            case 4:
                value = state.registers[x] + state.registers[y];
                state.registers[0xf] = value>0xff ? 1 : 0;
                state.registers[x] = value;
                break;

            // If Vx > Vy,
            //   then VF is set to 1,
            //   otherwise 0.
            // Then Vy is subtracted from Vx, and the results stored in Vx.
            case 5:
                state.registers[0xf] = state.registers[x]>state.registers[y] ? 1 : 0;
                state.registers[x] = Math.abs(state.registers[x]-state.registers[y]);
                break;

            // If the least-significant bit of Vx is 1,
            //    then VF is set to 1,
            //    otherwise 0.
            // Then Vx is divided by 2.
            case 6:
                state.registers[0xf] = (state.registers[x]&0x1)===1 ? 1 : 0;
                state.registers[x] = state.registers[x] >>> 1;
                break;

            // If Vy > Vx,
            //   then VF is set to 1,
            //   otherwise 0.
            // Then Vx is subtracted from Vy, and the results stored in Vx.
            case 7:
                state.registers[0xf] = state.registers[y]>state.registers[x] ? 1 : 0;
                state.registers[x] = Math.abs(state.registers[y]-state.registers[x]);
                break;

            // If the most-significant bit of Vx is 1,
            //    then VF is set to 1,
            //    otherwise to 0.
            // Then Vx is multiplied by 2.
            case 0xE:
                state.registers[0xf] = (state.registers[x]&0x80)===0 ? 0 : 1;
                state.registers[x] = state.registers[x] << 1;
                break;
            }
        },
        function snevxvy(state, opcode) {
            var y = (opcode>>>4) & 0x00F,
                x = (opcode>>>8) & 0x0F;

            if( state.registers[x]!==state.registers[y] ) state.pc+=2;
        },
        function ldi(state, opcode) {
            state.i = extractAddress(opcode);
        },
        function jpv0(state, opcode) {
            var address = extractAddress(opcode) + state.registers[0];
            if( address>0xFFF ) {
                debug(opcode, 'address overflowed. V0: ' + state.registers[0].toString());
                address = address - 0xFFF; // wrap around for now.
            }
            state.pc = address;
        },
        function rnd(state, opcode) {
            var x = (opcode>>>8) & 0x0F,
                kk = (opcode & 0xFF);

            state.registers[x] = randomByte() & kk;
        },
        function drw(state, opcode, vm) {
            var x = (opcode>>>8) & 0x0F,
                y = (opcode>>>4) & 0X00F,
                n = opcode & 0x000F;

            vm.bus.displayDraw(state.registers[x],
                                  state.registers[y],
                                  sliceData(vm, state.i, n));
        },
        function skp(state, opcode, vm) {
            var type = opcode & 0xFF,
                x = (opcode>>8) & 0xF;

            switch(type) {
            case 0x9E:
                if( state.registers[x]===vm.bus.keyboardGetch() ) state.pc+=2;
                break;
            case 0xA1:
                if( state.registers[x]!==vm.bus.keyboardGetch() ) state.pc+=2;
                break;
            default: debug(opcode, 'Unknown opcode');
            }
        },
        function opFxmn(state, opcode, vm) {
            var type = opcode & 0xFF,
                x = (opcode>>8) & 0xF;

            switch(type) {
            case 0x07: state.registers[x] = state.dt; break;
            case 0x0A:
                vm.isWaiting = true;
                vm.bus.keyboardOnce(function(key) {
                    state.registers[x]=key;
                    vm.isWaiting = false;
                });
                break;
            case 0x15:
                state.dt = state.registers[x];
                vm.dtTimer.reset();
                break;
            case 0x18:
                state.st = state.registers[x];
                vm.stTimer.reset();
                break;
            case 0x1E:
                state.i = state.i + state.registers[x];
                if( state.i>RAMSIZE ) debug(opcode, 'I register > ' + RAMSIZE);
                break;
            case 0x29:
                state.i = FONT_ADDR + FONT_SIZE * state.registers[x];
                if( state.i>RAMSIZE ) debug(opcode, 'I register > ' + RAMSIZE);
                if( state.i>FONT_ADDR + FONT_SIZE*0xF ) debug(opcode, 'I register points outside of font area');
                break;
            case 0x33:
                loadData(vm, utils.toBcd(state.registers[x]), state.i);
                break;
            case 0x55:
                for(var i=0; i<=x; i++) state.ram[state.i+i] = state.registers[i];
                break;
            case 0x65:
                for(var i=0; i<=x; i++) state.registers[i] = state.ram[state.i+i];
                break;
            default: debug(opcode, 'Unknown opcode!');
            }
        }
    ],

    process = function(vm, opcode) {
        var type = opcode >>> 12;
        ops[type](vm.state, opcode, vm);
    },





    fireEvents = function() {
        console.log('Firing events');
    },

    isRunning = true,

    run = function run() {
        while(isRunning) {
            var opcode = nextOpcode();
            console.log(opcode);
            processOpcode(opcode);
            pc += 2;
            fireEvents();
            isRunning=false;
        }
    },

    brk = function() {
        isRunning = false;
    }
;

var chip8 = {
    create: create,
    loadData: loadData,
    loadProgram: loadProgramFromArray,
    sliceData: sliceData,
    nextOpcode: nextOpcode,
    ops: ops,
    process: process,
    RAMSIZE: RAMSIZE,
    FONT_ADDR: FONT_ADDR,
    FONT_SIZE: FONT_SIZE,
    PROGRAM_ENTRY: PROGRAM_ENTRY,
    BUS_EVENTS: BUS_EVENTS
};

module.exports = chip8;
