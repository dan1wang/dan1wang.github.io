/**
 * @fileoverview Pattern Creator main script
 */

/** @typedef {Object} PadStack
 * @property {Array} top
 * @property {Array} topPaste
 * @property {Array} topMask
 * @property {Array} topSilk
 * @property {Array} topAssembly
 * @property {Array} [bottom]
 * @property {Array} [bottomPaste]
 * @property {Array} [bottomMask]
 * @property {Array} [bottomSilk]
 * @property {Array} [bottomAssembly]
 */

/** @typedef {Object} PadTemplate
  * @property {TerminalStyle} padStyle - Pad style (D shape, rectangular, etc.)
  * @property {PadProperties} props - Pad properties (length, width, etc.)
  * @property {PadStack} padStack - Calculated pad stack

/** @typedef {Object} Pad
 * @property {number} pinNumber - Pin number
 * @property {number} pinMod - Specify if the pin is hidden or deleted
 * @property {number} positionX - X position
 * @property {number} positionY - Y position
 * @property {number} rotation - Rotation (counter-clockwise) in degree
 * @property {boolean} useDefault - Specify if the pad uses the default style
 * @property {TerminalStyle} padStyle - Pad style (D shape, rectangular, etc.)
 * @property {PadProperties} props - Pad properties (length, width, etc.)
 * @property {PadStack} padStack - Calculated pad stack
 */

/** @typedef {Object} Pattern
  * @property {string} name - Name of the pattern
  * @property {PackageType} packageType - Package type (QFN, LQFP, etc.)
  * @property {PatternProperties} props - Properties (Dimension, pitch, etc.)
  * @property {Array.<Pad>} pads - Pads
  * @property {Pad} defaultPad - Pad
  */

/** @typedef {Object} PatternProperties
  * @property {number} bodyWidth    (E) Vertical length of the component body
  * @property {number} bodyLength   (D) Horizontal length of the component body
  * @property {number} [bodyHeight] (?) Height of the component body
  * @property {number} termWidth    (b) Default width of the terminal/lead
  * @property {number} termLength   (L) Default length of the terminal/lead
  * @property {TerminalStyle} termStyle   Terminal style
  * @property {number} [pitch]      (e) Pad row pitch
  * @property {number} [pinCount]   (n) Number of pins (excluding thermal pad)
  * @property {number} JT (JT) Toe
  * @property {number} JH (JH) Heel
  * @property {number} JS (JS) Side
  */

/** @typedef {Object} PadProperties
  * @property {number} padWidth    (X1)
  * @property {number} padLength   (Y1)
  * @property {TerminalStyle} padStyle   Terminal style
  */

/** Enum for package type
 * @readonly
 * @enum {string}
 */
const PackageType = {
  QFN: 'QFN',
  LQFP: 'LQFP',
};

/** Enum for terminal style
 * @readonly
 * @enum {string}
 */
const TerminalStyle = {
  DSHAPE: 'D',
  RECT: 'R',
};

/*  exported PinModification */
/**
 * Enum for pin modification
 * @readonly
 * @enum {number}
 */
const PinModification = {
  NONE: 1,
  DELETED: 2,
  HIDDEN: 3,
};

/*
  C1 column spacing
  X1 pad width
  Y1 pad length

  ZD toe to toe
  GD heel to heel
  CPL clearance pad to epad
  CLL clearance pad to pad

  EV thermal via pitch
  V thermal via diameter
  */


/**
 * Pattern creator
 * @constructor
 */
function PatternCreator() {
  const PatternCreator = { };

  /**
   * Create a new QFN pattern
   * @param {string} name
   * @return {Pattern}
  */
  PatternCreator['newQfnPattern'] = function(name) {
    /** @type {Pattern} */
    const newPattern = {
      'name': (typeof name == 'string')?name:'New Pattern',
      'packageType': PackageType.QFN,
      'props': {
        'bodyLength': 5,
        'bodyWidth': 5,
        'termLength': 0.55,
        'termWidth': 0.24,
        'termStyle': TerminalStyle.DSHAPE,
        'pitch': 0.5,
        'pinCount': 28,
        'JT': 0.4,
        'JH': 0.05,
        'JS': 0,
      },
      'pads': [],
    };
    return newPattern;
  };

  /** Renumber pins
   * @param {number} start
   */
  PatternCreator['renumberPins'] = function(start) {

  };

  return PatternCreator;
}

window['PatternCreator'] = PatternCreator;
