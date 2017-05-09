/* eslint no-console:0 */

var renderToString = require('./render').renderToString;
var htmlEscape = require('html-escape');

/* eslint-disable */
/*
 * General patterns
 */

var backslashNCommands = /\\n(?![a-zA-Z])/g;
var nonBreakingSpacePattern = /~/g;

// Mapping of Latex tags with HTML tags to replace them with. (Closing brace
// is also handled as a special case)
var latexTags = {
    "\\textbf{": "b",
    "\\textit{": "i",
    "}": ""
};

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

/* eslint-enable */

function preprocessText(text, ignoreNewLines) {
    text = text.replace(nonBreakingSpacePattern, '\xa0');
    if (!ignoreNewLines) {
        text = text.replace(backslashNCommands, '<br/>');
    }
    return text;
}

function preprocessMath(math) {
    return math.replace(vectorPattern, '{$1 \\choose $2}')
        .replace(degreesPattern, '^\\circ')
        .replace(numberCommaPattern, '$1\\!\\!')
        .replace(unescapedPercentPattern, '$1\\%')
        .replace(ungroupedQuestionMarkPattern, '$1{$2}$3')
        .replace(uscorePattern, '\\rule{$1em}{0.02em}');
}

function renderMathToString(math, options) {
    return renderToString(preprocessMath(math), options);
}

function renderMixedTextToString(text, suppressWarnings) {
    // A stack to contain html tags in the text elements that we have opened,
    // but not closed yet
    var tagStack = [];

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
            bit = htmlEscape(bit.replace("\\$", "$"));

            // Replace Latex tags such as \textbf{...} and \textit{...} with
            // HTML tags such as <b>...</b> and <i>...</i>
            bit = replaceLatexTagsWithHtmlTags(bit, tagStack);
            bits[i] = bit;
        }
    }
    return preprocessText(bits.join(''));
}

/**
 * Replaces Latex sections of a bit of a string with equivalent HTML elements.
 * At present \textbf{ ... } is replaced with <b> ... </b> and |textit{ ... }
 * is replaced with <i> ... </i>
 * @param bit The bit of the string to be modified
 * @param tagStack A stack of the open tags in the string (to allow a tag
 * opened in one bit to be closed in a following bit, preserving the
 * opening/closing order)
 * @returns {*} The modified bit of a string
 */
function replaceLatexTagsWithHtmlTags(bit, tagStack) {
    var firstTagIdx, firstTag, index, tag, lastOpenedTag;

    // Find the first Latex tag or closing brace in the bit. Replace a Latex
    // tag its corresponding HTML tag, and then push the tag onto the stack
    // to be closed when we get to the next closing brace (which might be in
    // the next bit). If we encounter a closing brace, replace it with the
    // top closing tag on the stack. Continue repeating until there are no more
    // Latex tags or closing braces in the string.
    do {
        firstTagIdx = -1;
        firstTag = null;
        index = -1;

        // Find the first Latex tag or closing brace that occurs in the bit:
        for (tag in latexTags) {
            index = bit.indexOf(tag);
            if (index !== -1 && (index < firstTagIdx || firstTagIdx === -1)) {
                firstTagIdx = index;
                firstTag = tag;
            }
        }

        // Replace the Latex tag or closing brace with HTML opening or
        // closing tag:
        if (firstTag === "}") {
            lastOpenedTag = tagStack.pop();
            if (lastOpenedTag) {
                bit = bit.replace("}", "</" + lastOpenedTag + ">");
            }
        } else if (firstTag) {
            bit = bit.replace(firstTag, "<" +  latexTags[firstTag] + ">");
            tagStack.push(latexTags[firstTag]);
        }
    } while (firstTagIdx > -1);

    return bit;
}

function renderMathInElement(elem,
                             ignoreNewLines,
                             suppressWarnings) {
    var ignoredTags = [
        "script", "noscript", "style", "textarea", "pre", "code",
    ];
    for (var i = 0; i < elem.childNodes.length; i++) {
        var childNode = elem.childNodes[i];
        if (childNode.nodeType === 3) {
            // Text node
            var text = childNode.textContent;
            var math = renderMixedTextToString(text, suppressWarnings);
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
                    childNode, ignoreNewLines, suppressWarnings
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
