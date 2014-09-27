/**
 * This module contains general functions that can be used for building
 * different kinds of domTree nodes in a consistent manner.
 */

var domTree = require("./domTree");
var fontMetrics = require("./fontMetrics");
var symbols = require("./symbols");
var utils = require("./utils");

/**
 * Makes a symbolNode after translation via the list of symbols in symbols.js.
 * Correctly pulls out metrics for the character, and optionally takes a list of
 * classes to be attached to the node.
 */
var makeSymbol = function(value, style, mode, color, classes) {
    // Replace the value with its replaced value from symbol.js
    if (symbols[mode][value] && symbols[mode][value].replace) {
        value = symbols[mode][value].replace;
    }

    var metrics = fontMetrics.getCharacterMetrics(value, style);

    var symbolNode;
    if (metrics) {
        symbolNode = new domTree.symbolNode(
            value, metrics.height, metrics.depth, metrics.italic, metrics.skew,
            classes);
    } else {
        // TODO(emily): Figure out a good way to only print this in development
        typeof console !== "undefined" && console.warn(
            "No character metrics for '" + value + "' in style '" +
                style + "'");
        symbolNode = new domTree.symbolNode(value, 0, 0, 0, 0, classes);
    }

    if (color) {
        symbolNode.style.color = color;
    }

    return symbolNode;
};

/**
 * Makes a symbol in Main-Regular or AMS-Regular.
 * Used for rel, bin, open, close, inner, and punct.
 */
var mathsym = function(value, mode, color, classes) {
    // Decide what font to render the symbol in by its entry in the symbols
    // table.
    if (symbols[mode][value].font === "main") {
        return makeSymbol(value, "Main-Regular", mode, color, classes);
    } else {
        return makeSymbol(
            value, "AMS-Regular", mode, color, classes.concat(["amsrm"]));
    }
};

/**
 * Makes a symbol in the default font for mathords and textords.
 */
var mathDefault = function(value, mode, color, classes, type) {
    if (type === "mathord") {
        return mathit(value, mode, color, classes);
    } else if (type === "textord") {
        return makeSymbol(
            value, "Main-Regular", mode, color, classes.concat(["mathrm"]));
    } else {
        throw new Error("unexpected type: " + type + " in mathDefault");
    }
};

/**
 * Makes a symbol in the italic math font.
 */
var mathit = function(value, mode, color, classes) {
    if (fontMap.mathit.test(value)) {
        return makeSymbol(
            value, "Main-Italic", mode, color, classes.concat(["mainit"]));
    } else {
        return makeSymbol(
            value, "Math-Italic", mode, color, classes.concat(["mathit"]));
    }
};

/**
 * Makes letters in normal roman and all other symbols in italic math.
 */
var mathrm = function(value, mode, color, classes, type) {
    if (fontMap.mathrm.test(value)) {
        return makeSymbol(value, "Main-Regular", mode, color, classes);
    } else {
        return mathDefault(value, mode, color, classes, type);
    }
};

/**
 * Makes letters in bold roman and all other symbols in italic math.
 */
var mathbf = function(value, mode, color, classes, type) {
    if (fontMap.mathbf.test(value)) {
        return makeSymbol(
            value, "Main-Bold", mode, color, classes.concat(["mathbf"]));
    } else {
        return mathDefault(value, mode, color, classes, type);
    }
};

/**
 * Makes a symbol in the blackboard bold math font
 */
var mathbb = function(value, mode, color, classes, type) {
    if (fontMap.mathbb.test(value)) {
        return makeSymbol(
            value, "AMS-Regular", mode, color, classes.concat(["amsrm"]));
    } else {
        return mathDefault(value, mode, color, classes, type);
    }
};

/**
 * Makes a symbol in the calligraphic font
 */
var mathcal = function(value, mode, color, classes, type) {
    if (fontMap.mathcal.test(value)) {
        return makeSymbol(
            value, "Calligraphic-Regular", mode, color, classes.concat(["mathcal"]));
    } else {
        return mathDefault(value, mode, color, classes, type);
    }
};

/**
 * Makes a symbol in the fraktur font
 */
var mathfrak = function(value, mode, color, classes, type) {
    if (fontMap.mathfrak.test(value)) {
        return makeSymbol(
            value, "Fraktur-Regular", mode, color, classes.concat(["mathfrak"]));
    } else {
        return mathDefault(value, mode, color, classes, type);
    }
};

/**
 * Makes a symbol in the typewriter font
 */
var mathtt = function(value, mode, color, classes, type) {
    if (fontMap.mathtt.test(value)) {
        return makeSymbol(
            value, "Typewriter-Regular", mode, color, classes.concat(["mathtt"]));
    } else {
        return mathDefault(value, mode, color, classes, type);
    }
};

/**
 * Makes a symbol in the script font
 */
var mathscr = function(value, mode, color, classes, type) {
    if (fontMap.mathscr.test(value)) {
        return makeSymbol(
            value, "Script-Regular", mode, color, classes.concat(["mathscr"]));
    } else {
        return mathDefault(value, mode, color, classes, type);
    }
};

/**
 * Makes a symbol in the sans-serif font
 */
var mathsf = function(value, mode, color, classes, type) {
    if (fontMap.mathsf.test(value)) {
        return makeSymbol(
            value, "SansSerif-Regular", mode, color, classes.concat(["mathsf"]));
    } else {
        return mathDefault(value, mode, color, classes, type);
    }
};

/**
 * Calculate the height, depth, and maxFontSize of an element based on its
 * children.
 */
var sizeElementFromChildren = function(elem) {
    var height = 0;
    var depth = 0;
    var maxFontSize = 0;

    if (elem.children) {
        for (var i = 0; i < elem.children.length; i++) {
            if (elem.children[i].height > height) {
                height = elem.children[i].height;
            }
            if (elem.children[i].depth > depth) {
                depth = elem.children[i].depth;
            }
            if (elem.children[i].maxFontSize > maxFontSize) {
                maxFontSize = elem.children[i].maxFontSize;
            }
        }
    }

    elem.height = height;
    elem.depth = depth;
    elem.maxFontSize = maxFontSize;
};

/**
 * Makes a span with the given list of classes, list of children, and color.
 */
var makeSpan = function(classes, children, color) {
    var span = new domTree.span(classes, children);

    sizeElementFromChildren(span);

    if (color) {
        span.style.color = color;
    }

    return span;
};

/**
 * Makes a document fragment with the given list of children.
 */
var makeFragment = function(children) {
    var fragment = new domTree.documentFragment(children);

    sizeElementFromChildren(fragment);

    return fragment;
};

/**
 * Makes an element placed in each of the vlist elements to ensure that each
 * element has the same max font size. To do this, we create a zero-width space
 * with the correct font size.
 */
var makeFontSizer = function(options, fontSize) {
    var fontSizeInner = makeSpan([], [new domTree.symbolNode("\u200b")]);
    fontSizeInner.style.fontSize = (fontSize / options.style.sizeMultiplier) + "em";

    var fontSizer = makeSpan(
        ["fontsize-ensurer", "reset-" + options.size, "size5"],
        [fontSizeInner]);

    return fontSizer;
};

/**
 * Makes a vertical list by stacking elements and kerns on top of each other.
 * Allows for many different ways of specifying the positioning method.
 *
 * Arguments:
 *  - children: A list of child or kern nodes to be stacked on top of each other
 *              (i.e. the first element will be at the bottom, and the last at
 *              the top). Element nodes are specified as
 *                {type: "elem", elem: node}
 *              while kern nodes are specified as
 *                {type: "kern", size: size}
 *  - positionType: The method by which the vlist should be positioned. Valid
 *                  values are:
 *                   - "individualShift": The children list only contains elem
 *                                        nodes, and each node contains an extra
 *                                        "shift" value of how much it should be
 *                                        shifted (note that shifting is always
 *                                        moving downwards). positionData is
 *                                        ignored.
 *                   - "top": The positionData specifies the topmost point of
 *                            the vlist (note this is expected to be a height,
 *                            so positive values move up)
 *                   - "bottom": The positionData specifies the bottommost point
 *                               of the vlist (note this is expected to be a
 *                               depth, so positive values move down
 *                   - "shift": The vlist will be positioned such that its
 *                              baseline is positionData away from the baseline
 *                              of the first child. Positive values move
 *                              downwards.
 *                   - "firstBaseline": The vlist will be positioned such that
 *                                      its baseline is aligned with the
 *                                      baseline of the first child.
 *                                      positionData is ignored. (this is
 *                                      equivalent to "shift" with
 *                                      positionData=0)
 *  - positionData: Data used in different ways depending on positionType
 *  - options: An Options object
 *
 */
var makeVList = function(children, positionType, positionData, options) {
    var depth;
    var currPos;
    var i;
    if (positionType === "individualShift") {
        var oldChildren = children;
        children = [oldChildren[0]];

        // Add in kerns to the list of children to get each element to be
        // shifted to the correct specified shift
        depth = -oldChildren[0].shift - oldChildren[0].elem.depth;
        currPos = depth;
        for (i = 1; i < oldChildren.length; i++) {
            var diff = -oldChildren[i].shift - currPos -
                oldChildren[i].elem.depth;
            var size = diff -
                (oldChildren[i - 1].elem.height +
                 oldChildren[i - 1].elem.depth);

            currPos = currPos + diff;

            children.push({type: "kern", size: size});
            children.push(oldChildren[i]);
        }
    } else if (positionType === "top") {
        // We always start at the bottom, so calculate the bottom by adding up
        // all the sizes
        var bottom = positionData;
        for (i = 0; i < children.length; i++) {
            if (children[i].type === "kern") {
                bottom -= children[i].size;
            } else {
                bottom -= children[i].elem.height + children[i].elem.depth;
            }
        }
        depth = bottom;
    } else if (positionType === "bottom") {
        depth = -positionData;
    } else if (positionType === "shift") {
        depth = -children[0].elem.depth - positionData;
    } else if (positionType === "firstBaseline") {
        depth = -children[0].elem.depth;
    } else {
        depth = 0;
    }

    // Make the fontSizer
    var maxFontSize = 0;
    for (i = 0; i < children.length; i++) {
        if (children[i].type === "elem") {
            maxFontSize = Math.max(maxFontSize, children[i].elem.maxFontSize);
        }
    }
    var fontSizer = makeFontSizer(options, maxFontSize);

    // Create a new list of actual children at the correct offsets
    var realChildren = [];
    currPos = depth;
    for (i = 0; i < children.length; i++) {
        if (children[i].type === "kern") {
            currPos += children[i].size;
        } else {
            var child = children[i].elem;

            var shift = -child.depth - currPos;
            currPos += child.height + child.depth;

            var childWrap = makeSpan([], [fontSizer, child]);
            childWrap.height -= shift;
            childWrap.depth += shift;
            childWrap.style.top = shift + "em";

            realChildren.push(childWrap);
        }
    }

    // Add in an element at the end with no offset to fix the calculation of
    // baselines in some browsers (namely IE, sometimes safari)
    var baselineFix = makeSpan(
        ["baseline-fix"], [fontSizer, new domTree.symbolNode("\u200b")]);
    realChildren.push(baselineFix);

    var vlist = makeSpan(["vlist"], realChildren);
    // Fix the final height and depth, in case there were kerns at the ends
    // since the makeSpan calculation won't take that in to account.
    vlist.height = Math.max(currPos, vlist.height);
    vlist.depth = Math.max(-depth, vlist.depth);
    return vlist;
};

// A table of size -> font size for the different sizing functions
var sizingMultiplier = {
    size1: 0.5,
    size2: 0.7,
    size3: 0.8,
    size4: 0.9,
    size5: 1.0,
    size6: 1.2,
    size7: 1.44,
    size8: 1.73,
    size9: 2.07,
    size10: 2.49
};

// A map of spacing functions to their attributes, like size and corresponding
// CSS class
var spacingFunctions = {
    "\\qquad": {
        size: "2em",
        className: "qquad"
    },
    "\\quad": {
        size: "1em",
        className: "quad"
    },
    "\\enspace": {
        size: "0.5em",
        className: "enspace"
    },
    "\\;": {
        size: "0.277778em",
        className: "thickspace"
    },
    "\\:": {
        size: "0.22222em",
        className: "mediumspace"
    },
    "\\,": {
        size: "0.16667em",
        className: "thinspace"
    },
    "\\!": {
        size: "-0.16667em",
        className: "negativethinspace"
    }
};

var greekCapitals = [
    "\\Gamma",
    "\\Delta",
    "\\Theta",
    "\\Lambda",
    "\\Xi",
    "\\Pi",
    "\\Sigma",
    "\\Upsilon",
    "\\Phi",
    "\\Psi",
    "\\Omega"
];

/**
 * Maps TeX font commands to objects containing:
 * - variant: string used for "mathvariant" attribut in buildMathML.js
 * - test: function acception mathord/textord value, returns true if the
 *      variant or non-default font should be used.
 */
// A map between tex font commands an MathML mathvariant attribute values
var fontMap = {
    // styles
    "mathbf": {
        variant: "bold",
        test: function(value) {
            return /[a-zA-Z0-9]/.test(value.charAt(0));
        }
    },
    "mathit": {
        variant: "italic",
        // All mathords and textords should be typeset using italics in \mathit.
        // The test function has a special meaning in this case.  It determines
        // which italics font to use when building an HTML layout and wheter or
        // not to set mathvariant="italic" for MathML.
        test: function(value) {
            return /[0-9]/.test(value.charAt(0)) ||
                utils.contains(["\\imath", "\\jmath"], value) ||
                utils.contains(greekCapitals, value);
        }
    },
    "mathrm": {
        variant: "normal",
        test: function(value) {
            return /[a-zA-Z0-9]/.test(value.charAt(0));
        }
    },

    // families
    "mathbb": {
        variant: "double-struck",
        test: function(value) {
            return/[A-Zk]/.test(value.charAt(0));
        }
    },
    "mathcal": {
        variant: "script",
        test: function(value) {
            return /[A-Z]/.test(value.charAt(0));
        }
    },
    "mathfrak": {
        variant: "fraktur",
        test: function(value) {
            return /[a-zA-Z0-9]/.test(value.charAt(0));
        }
    },
    "mathscr": {
        variant: "script",
        test: function(value) {
            return /[A-Z]/.test(value.charAt(0));
        }
    },
    "mathsf": {
        variant: "sans-serif",
        test: function(value) {
            // TODO(kevinb) update this when we implement unicode
            return /[a-zA-Z0-9]/.test(value.charAt(0)) ||
                utils.contains(greekCapitals, value);
        }
    },
    "mathtt": {
        variant: "monospace",
        test: function(value) {
            // TODO(kevinb) update this when we implement unicode
            return /[a-zA-Z0-9]/.test(value.charAt(0)) ||
                utils.contains(greekCapitals, value);
        }
    }
};

module.exports = {
    makeSymbol: makeSymbol,
    fontMap: fontMap,
    mathit: mathit,
    mathrm: mathrm,
    mathbf: mathbf,
    mathbb: mathbb,
    mathcal: mathcal,
    mathfrak: mathfrak,
    mathtt: mathtt,
    mathscr: mathscr,
    mathsf: mathsf,
    mathsym: mathsym,
    makeSpan: makeSpan,
    makeFragment: makeFragment,
    makeVList: makeVList,
    sizingMultiplier: sizingMultiplier,
    spacingFunctions: spacingFunctions
};
