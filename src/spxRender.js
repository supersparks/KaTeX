/* eslint no-console:0 */

var renderToString = require('./render').renderToString;
var htmlEscape = require('html-escape');

/* eslint-disable */
/*
 * General patterns
 */

var textitPattern = /\\textit{(([^}$]|\$[^$]*\$)*?)}/g;
var textbfPattern = /\\textbf{(([^}$]|\$[^$]*\$)*?)}/g;
var backslashNCommands = /(\\n)(?!eq|otin) /g;
var newLinePattern = /\n/g;

/*
 * Maths specific patterns - tex fixes
 */

var mathlabelCmds =/\\(pound|euro|yen|times|div|degrees|pi|neq|leq|geq|propto|pm)(?=\w)/g;
var unitsSpacePattern = /([^\\ ]) (am|mm|cm|km|ft|g|hrs?|kg|lb?|mins?|ml|mph|m|oz|pm|secs?|st|s)(?!\w)/g;
var manySpacesPattern = / {3} +/g;
var threeOrMoreUnderscoresPattern = /(\\?_){3}(\\?_)*/g;
var twoUnderscoresPattern = /(\\?_){2}/g;

/*
 * Maths specific patterns - macros
 */

var vectorPattern = /\\vector{((?:[^}$]|\\$[^$]*\\$)*)}{((?:[^}$]|\\$[^$]*\\$)*)}/g;
var degreesPattern = /\\degrees/g;
var numberCommaPattern = /(\d,)(?=\d\d\d)/g;
var unescapedPercentPattern = /([^\\]|^)%/g;
var ungroupedQuestionMarkPattern = /([^{?]|^)([?]+)([^}?]|$)/g;
var uscorePattern = /\\uscore{(\d+)}/g;

/*
 * State
 */

var disableNewLinePattern = false;

/* eslint-enable */

function preprocessText(text, ignoreNewLines) {
    text = text.replace(textitPattern, '<i>$1</i>')
               .replace(textbfPattern, '<b>$1</b>');
    if (!ignoreNewLines) {
        text = text.replace(backslashNCommands, '<br/>');
        if (!disableNewLinePattern) {
            text = text.replace(newLinePattern, '<br/>');
        }
    }
    return text;
}

// The newLinePattern prevents running renderMathInElement on a document
preprocessText.disableNewLineHack = function() {
    disableNewLinePattern = true;
};

function replaceUnicodeInMath(math) {
    return math.replace(/\u2212/g, '-')
               .replace(/\u2026/g, '\\ldots')
               .replace(/\u00b0/g, '\\degrees ')
               .replace(/\u00a3/g, '\\pound ')
               .replace(/\u00d7/g, '\\times ');
}

function preprocessMath(math, includeTexFixes) {
    if (includeTexFixes) {
        math = replaceUnicodeInMath(math)
            .replace(mathlabelCmds, '\\$1 ')
            .replace(unitsSpacePattern, '$1\\,$2')
            .replace(manySpacesPattern, '\\qquad ')
            .replace(threeOrMoreUnderscoresPattern, '\\rule{2em}{0.01em}')
            .replace(twoUnderscoresPattern, '\\rule{1em}{0.01em}');
    }
    return math.replace(vectorPattern, '{$1 \\choose $2}')
               .replace(degreesPattern, '^\\circ')
               .replace(numberCommaPattern, '$1\\!\\!')
               .replace(unescapedPercentPattern, '$1\\%')
               .replace(ungroupedQuestionMarkPattern, '$1{$2}$3')
               .replace(uscorePattern, '\\rule{$1em}{0.01em}');
}

function renderMathToString(math, includeTexFixes, options) {
    return renderToString(preprocessMath(math, includeTexFixes), options);
}

function renderMixedTextToString(text, suppressWarnings, includeTexFixes) {
    var bits = text.match(/\$|(?:\\.|[^$])+/g);
    if (bits === null) {
        return '';
    }
    var isMath = false;
    for (var i = 0; i < bits.length; i++) {
        var bit = bits[i];
        if (bit === '$') {
            isMath = !isMath;
            bits[i] = '';
        } else if (isMath) {
            try {
                bits[i] = renderMathToString(bit, includeTexFixes);
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
            bit = htmlEscape(bit.replace("\\$", "$"));
            // And now this function is terribly named...
            bits[i] = preprocessText(bit);
        }
    }
    return bits.join('');
}

function renderMathInElement(elem,
                             ignoreNewLines,
                             suppressWarnings,
                             includeTexFixes) {
    var ignoredTags = [
        "script", "noscript", "style", "textarea", "pre", "code",
    ];
    for (var i = 0; i < elem.childNodes.length; i++) {
        var childNode = elem.childNodes[i];
        if (childNode.nodeType === 3) {
            // Text node
            var text = childNode.textContent;
            var math = renderMixedTextToString(
                text, suppressWarnings, includeTexFixes
            );
            // Make a temporary span to render the content
            var s = document.createElement('span');
            s.innerHTML = math;
            // Copy the spans children to make a document fragment
            var frag = document.createDocumentFragment();
            while (s.childNodes.length) {
                frag.appendChild(s.childNodes[0]);
            }
            // replace the text node with the document fragment
            i += frag.childNodes.length - 1;
            elem.replaceChild(frag, childNode);
        } else if (childNode.nodeType === 1) {
            // Element node
            var shouldRender = ignoredTags.indexOf(
                childNode.nodeName.toLowerCase()) === -1;

            if (shouldRender) {
                renderMathInElement(
                    childNode, ignoreNewLines, suppressWarnings, includeTexFixes
                );
            }
        }
        // Otherwise, it's something else, and ignore it.
    }
}

module.exports = {
    preprocessText: preprocessText,
    preprocessMath: preprocessMath,
    renderMathToString: renderMathToString,
    renderMixedTextToString: renderMixedTextToString,
    renderMathInElement: renderMathInElement,
};
