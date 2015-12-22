var utils = require('./utils.js'),
    error = utils.error,
    debug = utils.debug,

    type  = function(opcode) {
        return opcode>>>12;
    },
    addr = function(opcode) {
        return opcode & 0x0fff;
    },
    register = function(opcode) {
        return (opcode>>>8) & 0xF;
    },
    registers = function(opcode) {
        return [
            (opcode>>>8) & 0x0F,
            (opcode>>>4) & 0x00F
        ];
    },
    y = function(opcode) {
        return (opcode>>>4) & 0x00F;
    },
    byte = function(opcode) {
        return opcode & 0x00ff;
    },
    nibble = function(opcode) {
        return opcode & 0xf;
    },
    /**
       Metadata:
       - comment
       - nnn
    **/
    token = function(opcode, instruction, operands, metadata) {
        var tok = utils.extend(
            metadata||{}, {
                opcode: opcode,
                instruction: instruction,
                operands: operands
            });
        return tok;
    },

    r2s = function(register) {
        return 'V' + register.toString(16).toUpperCase();
    },
    b2s = function(byte) {
        return '#' + byte.toString(16).toUpperCase();
    },

    decodeStatic = function(type, opcode) {
        var subtypeOrAddr = nibble3(opcode),
            i;
        if( subtypeOrAddr===0x0E0 ) {
            i = 'CLS';
        } else if( subtypeOrAddr===0x0EE ) {
            i = 'RET';
        } else {
            return decodeAddrType(type, opcode);
        }
        return token(opcode, i);
    },
    // 1nnn
    decodeAddrType = function(type, opcode) {
        var nnn = addr(opcode),
            operands = [nnn],
            i = 'ERROR';

        if( type===0x0 ) i = 'SYS';
        else if ( type===0x1 ) i = 'JP';
        else if ( type===0x2 ) i = 'CALL';
        else if ( type===0xA ) {
            i = 'LD';
            operands.unshift('I');
        } else if ( type===0xB ) {
            i = 'JP';
            operands.unshift('V0');
        } else error(opcode, 'Opcode type is not an AddrType');
        var tok = token(opcode, i, operands, {nnn: nnn});
        return tok;
    },
    decodeRegisterByteType = function(type, opcode) {
        var r = x(opcode),
            kk = nibble2(opcode),
            i;

        if( type===0x3 ) i = 'SE';
        else if( type===0x4 ) i = 'SNE';
        else if( type===0x6 ) i = 'LD';
        else if( type===0x7 ) i = 'ADD';
        else if( type===0xC ) i = 'RND';
        else error(opcode, 'Opcode type is not an RegisterByteType');

        return token(opcode, i, [r2s(r), b2s(kk)]);
    },
    decodeRegisterRegisterType = function(type, opcode) {
        var r1 = x(opcode),
            r2 = y(opcode),
            subtype = nibble(opcode),
            i;

        if( subtype===0x0 ) {
            if( type===0x5 ) i='SE';
            else if( type===0x8 ) i='LD';
            else if( type===0x9 ) i='SNE';
        }
        else if( subtype===0x1 ) i='OR';
        else if( subtype===0x2 ) i='AND';
        else if( subtype===0x3 ) i='XOR';
        else if( subtype===0x4 ) i='ADD';
        else if( subtype===0x5 ) i='SUB';
        else if( subtype===0x6 ) i='SHR';
        else if( subtype===0x7 ) i='SUBN';
        else if( subtype===0xe ) i='SHL';
        else error(opcode, 'Opcode type is not an RegisterRegisterType');

        return token(opcode, i, [r2s(r1), r2s(r2)]);
    },
    decodeRegisterRegisterNibble = function(type, opcode) {
        var r1=x(opcode),
            r2=y(opcode),
            n=nibble(opcode),
            i;
        if( type===0xd ) i='DRW';
        else error(opcode, 'Opcode type is not an RegisterRegisterNibbleType');
        return token(opcode, i, [r2s(r1), r2s(r2), b2s(n)])
    },
    decodeRegisterNibble = function(type, opcode) {
        var r = x(opcode),
            operands = [r2s(r)],
            subtype = nibble2(opcode),
            i='LD';

        if( subtype===0x9e ) i='SKP';
        else if( subtype===0xa1 ) i='SKNP';
        else if( subtype===0x07 ) operands.push('DT');
        else if( subtype===0x0a ) operands.push('K');
        else if( subtype===0x15 ) operands.unshift('DT');
        else if( subtype===0x18 ) operands.unshift('ST');
        else if( subtype===0x29 ) operands.unshift('F');
        else if( subtype===0x33 ) operands.unshift('B');
        else if( subtype===0x55 ) operands.unshift('[I]');
        else if( subtype===0x65 ) operands.push('[I]');
        else if( subtype===0x1E ) {
            i = 'ADD';
            operands.unshift('I');
        } else error(opcode, 'Opcode type is not an RegisterNibbleType');

        return token(opcode, i, operands);
    },
    decodeOpcode = function(opcode) {
        var typeMap = [
            decodeStatic,
            decodeAddrType,
            decodeAddrType,
            decodeRegisterByteType,
            decodeRegisterByteType,
            decodeRegisterRegisterType,
            decodeRegisterByteType,
            decodeRegisterByteType,
            decodeRegisterRegisterType,
            decodeRegisterRegisterType,
            decodeAddrType,
            decodeAddrType,
            decodeRegisterByteType,
            decodeRegisterRegisterNibble,
            decodeRegisterNibble,
            decodeRegisterNibble,
        ],
            opcodeType = type(opcode)
        ;
        
        if( typeof typeMap[opcodeType]==='function' ) {
            return typeMap[opcodeType](opcodeType, opcode);
        }
        error(opcode, 'Unknown opcode');
    },
    dasm = function(data) {
        var tokens = opcodeStream(data).map(decodeOpcode); 
        addJumpPoints(tokens);
        return {
            tokens: function() {
                return tokens;
            },
            toString: function() {
                return render(tokens);
            }
        }
    },

    addJumpPoints = function(tokens) {
        var nnnToIndex = function(nnn) {
            return (nnn-0x200)/2;
        };

        tokens.forEach(function(token) {
            if( token.nnn ) {
                var index = nnnToIndex(token.nnn);
                if( index>=0 ) tokens[index].label = true;
            }
        });
        return tokens;
    },

    renderOperands = function(operands) {
        return operands
            .map(function(operand) {
                if( typeof operand==='number' ) {
                    return ('000' + operand.toString(16).toUpperCase())
                        .slice(-3);
                }
                return operand.toString();
            })
            .join(', ');
    },
    renderToken = function(token) {
        var str = '\t' + token.instruction;
        if( token.operands ) str = str + '\t' + renderOperands(token.operands);
        if( token.opcode ) str = str + '\t\t\t; 0x' + utils.toHex(token.opcode);
        return str;
    },
    render = function(tokens) {
        var label = function(index, start) {
            if( start===undefined ) start = 0x200;
            return (start + index*2).toString(16).toUpperCase();
        };
        return tokens
            .reduce(function(str, token, i) {
                if( token.label ) str = str + label(i, 0x200) + ':\n';
                str = str + renderToken(token);
                return str + '\n';
            }, '')
    },

    opcodeStream = function(data) {
        var i = 0,
            nextOpcode = function(d, n) {
                return (d[n]<<8) | d[n+1];
            }
        return {
            EOS: undefined,
            next: function() {
                return nextOpcode(data, i+=2);
            },
            map: function(fn) {
                var i = 0, opcode, newData = [];

                for( i=0; i<data.length; i+=2 ) {
                    opcode = nextOpcode(data, i);
                    if( opcode===undefined ) break;
                    newData.push(fn(opcode, i));
                }
                return newData;
            }
        };
    },
    x = register,
    nibble3 = addr,
    nibble2 = byte
;
dasm.opcode = {
    type: type,
    address: addr,
    registers: registers,
    byte: byte,
    nibble: nibble,
    x: x,
    y: y,
    decode: decodeOpcode
};

dasm.renderToken = renderToken;

module.exports = dasm;
