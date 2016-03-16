/* eslint no-console:0 */

var renderToString = require('./render').renderToString;
var htmlEscape = require('html-escape');

/* eslint-disable */
/*
 * General patterns
 */

var mathlabelCmds =/\\(pound|euro|yen|times|div|degrees|pi|neq|leq|geq|propto|pm)(?=\w)/g;
var textitPattern = /\\textit{(([^}$]|\$[^$]*\$)*?)}/g;
var textbfPattern = /\\textbf{(([^}$]|\$[^$]*\$)*?)}/g;
var backslashNCommands = /(\\n)(?!otin)/g;
var boldPattern = /\$\\bold{(([^}$]|\$[^$]*\$)*?)}\$/g;

/*
 * Maths specific patterns
 */

var vectorPattern = /\\vector{((?:[^}$]|\\$[^$]*\\$)*)}{((?:[^}$]|\\$[^$]*\\$)*)}/g;
var manySpacesPattern = / {3} +/g;
var unitsPattern = /([^\\ ]) (am|mm|cm|km|ft|g|hrs?|kg|lb?|mins?|ml|mph|m|oz|pm|secs?|st|s)(?!\w)/g;
var threeOrMoreUnderscoresPattern = /(\\?_){3}(\\?_)*/g;
var twoUnderscoresPattern = /(\\?_){2}/g;
var numberCommaPattern = /(\d,)(?=\d\d\d)/g;

/* eslint-enable */

function replaceUnicodeInMath(math) {
    return math.replace('\u2212', '-')
               .replace('\u2026', '\\ldots')
               .replace('\u00b0', '\\degrees ')
               .replace('\u00a3', '\\pound ')
               .replace('\u00d7', '\\times ');
}

function preprocessText(text) {
    return text.replace(mathlabelCmds, '\\$1 ')
               .replace('%', '\\%')
               .replace(textitPattern, '<i>$1</i>')
               .replace(textbfPattern, '<b>$1</b>')
               .replace(backslashNCommands, '<br/>')
               .replace(boldPattern, '<b>$1</b>');
}


function renderMathToString(math) {
    math = replaceUnicodeInMath(math)
               .replace(/\\degrees/g, '^\\circ ')
               .replace('\\bold', '\\mathbf ')
               .replace(vectorPattern, '{$1 \\choose $2}')
               .replace(unitsPattern, '$1\\,$2')
               .replace(manySpacesPattern, '\\qquad ')
               .replace(threeOrMoreUnderscoresPattern, '\\rule{2em}{0.01em}')
               .replace(twoUnderscoresPattern, '\\rule{1em}{0.01em}')
               .replace(numberCommaPattern, '$1\\!\\!');
    return renderToString(math);
}


function renderMixedTextToString(text, suppressWarnings) {
    var bits = text.match(/\$|(?:\\.|[^$])+/g);
    var isMath = false;
    for (var i = 0; i < bits.length; i++) {
        var bit = bits[i];
        if (bit === '$') {
            isMath = !isMath;
            bits[i] = '';
        } else if (isMath) {
            try {
                bits[i] = renderMathToString(bit);
            } catch (exc) {
                bits[i] = (
                    '<code class="invalid-math">' +
                    htmlEscape(bit) + '</code>'
                );
                if (!suppressWarnings) {
                    console.warn("Invalid Math", bit);
                }
            }
        } else {
            bits[i] = bit.replace("\\$", "$");
        }
    }
    return bits.join('');
}

module.exports = {
    preprocessText: preprocessText,
    renderMathToString: renderMathToString,
    renderMixedTextToString: renderMixedTextToString,
};
