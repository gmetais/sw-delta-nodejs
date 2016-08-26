var DiffMatchPatch  = require('diff-match-patch');


var DeltaCalculator = function() {
    'use strict';

    this.getDelta = function(oldString, newString) {

        // Uses the google-diff-match-patch algorithm
        // It looks good for what we need. Maybe a bit slow on large files.
        // It might be possible to tweak it for better results on minified JS and CSS files.

        var dmp = new DiffMatchPatch();
        var diffTable = dmp.diff_main(oldString, newString);

        // Let's say we want to diff these two strings:
        // oldString: "this is some test. blah blah blah"
        // newString: "this is other text. blah blah blah"

        // The result of the algorithm is a table that looks like this:
        // [ [ 0, 'this is ' ],
        //   [ -1, 's' ],
        //   [ 0, 'o' ],
        //   [ -1, 'm' ],
        //   [ 1, 'th' ],
        //   [ 0, 'e' ],
        //   [ 1, 'r' ],
        //   [ 0, ' te' ],
        //   [ -1, 's' ],
        //   [ 1, 'x' ],
        //   [ 0, 't. blah blah blah' ] ]

        // Now we're going to change the format to reduce the weight.
        // For example we don't need the chars that don't change.

        var diffBuffer = new Buffer(0);
        var charOffset = 0;
        var controlBytes, buffer, dataview;
        
        // To save bytes, we're going to store the information in a binary format.
        // There are two kind of informations: control bytes and text bytes.

        // The control bytes consist in a bitfield of 16 bits:
        // 1rst bit tells if it's an addition of caracters (1) or a removal (0)
        // bits 2-9 are the offset as an 8 bits integer (0 to 255)
        // bits 10-16 are the number of chars to delete or add, as a 7 bits integer (0 to 127)

        const CHAR_OFFSET_BITS = 8;
        const CHAR_NUMBER_BITS = 7;
        const CHAR_OFFSET_MAX = Math.pow(2, CHAR_OFFSET_BITS) - 1;
        const CHAR_NUMBER_MAX = Math.pow(2, CHAR_NUMBER_BITS) - 1;
        const CONTROL_ADD = 1;
        const CONTROL_REMOVE = 0;
        

        diffTable.forEach(function(line) {
            if (line[1].length > 0) {
                
                // We cannot write an offset longer than CHAR_OFFSET_MAX
                // When it appens, we just insert several removal of 0 chars.
                while (charOffset > CHAR_OFFSET_MAX) {
                    diffBuffer = concatBuffers(diffBuffer, getControlBytes(CONTROL_REMOVE, CHAR_OFFSET_MAX, 0));
                    charOffset -= CHAR_OFFSET_MAX;
                }


                if (line[0] === 1) {
                    // It's an addition

                    var stringToAdd = line[1];
                    var numberToAdd;
                    
                    // If the length of the string to add is longer than CHAR_NUMBER_MAX
                    // We split the string into several chunks.
                    while (stringToAdd.length > 0) {
                        numberToAdd = Math.min(stringToAdd.length, CHAR_NUMBER_MAX);
                        diffBuffer = concatBuffers(diffBuffer, getControlBytes(CONTROL_ADD, charOffset, numberToAdd));
                        diffBuffer = concatBuffers(diffBuffer, new Buffer(stringToAdd.substr(0, numberToAdd)));
                        stringToAdd = stringToAdd.substr(numberToAdd);
                        charOffset = numberToAdd;
                    }

                } else if (line[0] === -1) {
                    // It's a removal

                    var stringLength = line[1].length;
                    var numberToRemove;

                    // If the removal is longer than CHAR_NUMBER_MAX
                    // We split the removal into several removals
                    while (stringLength > 0) {
                        numberToRemove = Math.min(stringLength, CHAR_NUMBER_MAX);
                        diffBuffer = concatBuffers(diffBuffer, getControlBytes(CONTROL_REMOVE, charOffset, numberToRemove));
                        stringLength -= numberToRemove;
                        charOffset = numberToRemove;
                    }

                } else {
                    // It's a keeping

                    charOffset += line[1].length;
                }
            }
        });

        // It's probably not the less verbose format, but help is more than welcome!

        return diffBuffer;
    };

    function getControlBytes(addOrRemove, offset, numberOfChars) {
        var value = addOrRemove;
        value = value << 8;
        value += offset;
        value = value << 7;
        value += numberOfChars;

        var arrayBuffer = new ArrayBuffer(2);
        var dataview = new DataView(arrayBuffer);
        dataview.setUint16(0, value);

        return new Buffer(arrayBuffer);
    }

    // Concats the buffer b at the end of buffer a
    function concatBuffers(a, b) {
        return Buffer.concat([a, b], a.length + b.length);
    };

};

module.exports = new DeltaCalculator();