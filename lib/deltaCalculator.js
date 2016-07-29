var DiffMatchPatch  = require('diff-match-patch');


var DeltaCalculator = function() {
    'use strict';


    this.getDelta = function(oldString, newString) {

        // Find an unused char as a separator
        var separator = '§';
        if (oldString.indexOf(separator) >= 0 || newString.indexOf(separator) >= 0) {
            separator = '␡';
        }

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

        var diffResult = '';
        var charIndex = 0;
        
        diffTable.forEach(function(line) {

            if (line[1].length > 0) {
                if (line[0] === 1) {
                    diffResult += separator + charIndex + '+' + line[1];
                    charIndex = line[1].length;
                } else if (line[0] === -1) {
                    diffResult += separator + charIndex + '-' + line[1].length;
                    charIndex = line[1].length;
                } else {
                    charIndex += line[1].length;
                }
            }
        });

        // The result now looks like this:
        //  §8-1§2-1§1+th§3+r§4-1§1+x

        // It's probably not the less verbose format, but help is more than welcome!

        return diffResult;
    };

};

module.exports = new DeltaCalculator();