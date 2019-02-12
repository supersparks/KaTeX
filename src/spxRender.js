/* eslint no-console:0 */

import {renderToString} from './render';
import {htmlEscape} from 'html-escape';

/* eslint-disable */
/*
 * General patterns
 */

const backslashNCommands = /\\n(?![a-zA-Z])/g;
const nonBreakingSpacePattern = /~/g;

// Mapping of Latex tags with HTML tags to replace them with. (Closing brace
// is also handled as a special case)
const LATEX_TAGS = {
    "\\textbf{": "b",
    "\\textit{": "i",
    "}": ""
};

/*
 * Maths specific patterns - macros
 */

const vectorPattern = /\\vector{((?:[^}$]|\\$[^$]*\\$)*)}{((?:[^}$]|\\$[^$]*\\$)*)}/g;
const degreesPattern = /\\degrees/g;
const numberCommaPattern = /(\d,)(?=\d\d\d)/g;
const unescapedPercentPattern = /([^\\]|^)%/g;
const ungroupedQuestionMarkPattern = /([^{?]|^)([?]+)([^}?]|$)/g;
const uscorePattern = /\\uscore{(\d+)}/g;

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
        .replace(uscorePattern, '\\rule{$1em}{0.03em}');
}

function renderMathToString(math, options) {
    return renderToString(preprocessMath(math), options);
}

function renderMixedTextToString(text, suppressWarnings) {
    // A stack to contain html tags in the text elements that we have opened,
    // but not closed yet
    const tagStack = [];

    const bits = text.match(/\$|(?:\\.|[^$])+/g);
    if (bits === null) {
        return '';
    }
    let isMath = false;
    for (let i = 0; i < bits.length; i++) {
        let bit = bits[i];
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
    let ret = "";
    let input = bit;
    let tag;
    let firstTag;
    let firstTagIdx;
    let index;
    let lastOpenedTag;

    while (input) {
        firstTagIdx = input.length;
        firstTag = null;
        index = -1;

        for (tag in LATEX_TAGS) { //eslint-disable-line guard-for-in
            index = input.indexOf(tag);
            if (index !== -1 && index < firstTagIdx) {
                firstTagIdx = index;
                firstTag = tag;
            }
        }
        if (firstTag) {
         // If we have a tag it must be length 1, therefore input must shrink
            ret += input.substring(0, firstTagIdx);
            input = input.substring(
                firstTagIdx + firstTag.length, input.length
            );
            if (firstTag === "}") {
                lastOpenedTag = tagStack.pop();
                if (lastOpenedTag) {
                    ret += "</" + lastOpenedTag + ">";
                } else {
                    ret += "}";
                }
            } else {
                ret += "<" +  LATEX_TAGS[firstTag] + ">";
                tagStack.push(LATEX_TAGS[firstTag]);
            }
        } else {
            // Otherwise we set input to empty, allowing the loop to break
            ret += input;
            input = "";
        }
    }

    return ret;
}

function renderMathInElement(elem,
                             ignoreNewLines,
                             suppressWarnings) {
    const ignoredTags = [
        "script", "noscript", "style", "textarea", "pre", "code",
    ];
    for (let i = 0; i < elem.childNodes.length; i++) {
        const childNode = elem.childNodes[i];
        if (childNode.nodeType === 3) {
            // Text node
            const text = childNode.textContent;
            const math = renderMixedTextToString(text, suppressWarnings);
            // Make a temporary span to render the content
            const s = document.createElement('span');
            s.innerHTML = math;
            // Copy the spans children to make a document fragment
            const frag = document.createDocumentFragment();
            while (s.childNodes.length) {
                frag.appendChild(s.childNodes[0]);
            }
            // replace the text node with the document fragment
            i += frag.childNodes.length - 1;
            elem.replaceChild(frag, childNode);
        } else if (childNode.nodeType === 1) {
            // Element node
            const shouldRender = ignoredTags.indexOf(
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

export default {
    preprocessText: preprocessText,
    preprocessMath: preprocessMath,
    renderMathToString: renderMathToString,
    renderMixedTextToString: renderMixedTextToString,
    renderMathInElement: renderMathInElement,
};
