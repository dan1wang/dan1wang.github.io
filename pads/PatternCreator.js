/**
 * @fileoverview Pattern Creator main script
 */

/* exported PatternGeometryType */
/* exported MaskStateOption, PasteStateOption */
/* exported PinModification */

/** Enum for package type
 * @readonly
 * @enum {number}
 */
const PatternGeometryType = {
  LINE: 1,
  RECT: 2,
  ELLIPSE: 3,
  POLYGON: 9,
};

/** @typedef {Object} PatternGeometryData
 * @property {PatternGeometryType} type
 * @property {Object} data
 */

/** @typedef {Object} PadStack
 * @property {Array.<PatternGeometryData>} top
 * @property {Array.<PatternGeometryData>} topPaste
 * @property {Array.<PatternGeometryData>} topMask
 * @property {Array.<PatternGeometryData>} topSilk
 * @property {Array.<PatternGeometryData>} topAssembly
 * @property {Array.<PatternGeometryData>} topKeepout
 * @property {Array.<PatternGeometryData>} bottom
 * @property {Array.<PatternGeometryData>} bottomPaste
 * @property {Array.<PatternGeometryData>} bottomMask
 * @property {Array.<PatternGeometryData>} bottomSilk
 * @property {Array.<PatternGeometryData>} bottomAssembly
 * @property {Array.<PatternGeometryData>} bottomKeepout
 */

/** @typedef {Object} PadTemplate
 * @property {number} uid - Numerically incremented id
 * @property {string} name - Name of the template
 * @property {TerminalShape} shape - Base shape (D-shape, rectangular, etc.)
 * @property {PadProperties} props - Properties (length, width, etc.)
 * @property {PadStack} padStack - Calculated pad stack
 */

/** @typedef {Object} Pad
 * @property {number} pinNumber - Pin number
 * @property {PinModification} pinMod - Specify if the pin is hidden or deleted
 * @property {number} positionX - X position
 * @property {number} positionY - Y position
 * @property {number} rotation - Rotation (counter-clockwise) in degree
 * @property {number} useTemplate - Id of the template used
 * @property {PadStack} padStack - Computed pad stack
 */

/** @typedef {Object} Pattern
 * @property {string} name - Name of the pattern
 * @property {string} refDes - RefDes prefix
 * @property {string} value - Value
 * @property {string} datasheetUrl - URI of datasheet
 * @property {string} modelUrl - URI of 3D model
 * @property {PackageType} packageType - Package type (QFN, LQFP, etc.)
 * @property {PatternProperties} props - Properties (Dimension, pitch, etc.)
 * @property {Array.<Pad>} pads - Pads
 * @property {Array.<PadTemplate>} padTemplates - Pad templates
 */

/** @typedef {Object} PatternProperties
 * @property {number} bodyWidth    (E) Vertical length of the component body
 * @property {number} bodyLength   (D) Horizontal length of the component body
 * @property {number} [bodyHeight] (?) Height of the component body
 * @property {number} termWidth    (b) Default width of the terminal/lead
 * @property {number} termLength   (L) Default length of the terminal/lead
 * @property {TerminalShape} termShape   Terminal style
 * @property {number} [pitch]      (e) Pad row pitch
 * @property {number} [pinCount]   (n) Number of pins (excluding thermal pad)
 * @property {number} JT (JT) Toe
 * @property {number} JH (JH) Heel
 * @property {number} JS (JS) Side
 */

/** @typedef {Object} PadProperties
 * @property {number} padWidth    (X1)
 * @property {number} padLength   (Y1)
 * @property {MaskStateOption} topMaskState
 * @property {MaskStateOption} bottomMaskState
 * @property {PasteStateOption} topPasteState
 * @property {PasteStateOption} bottomPasteState
 * @property {number|string} maskSwell - Mask swell (number or 'auto')
 * @property {number|string} pasteShrink - Paste shrink (number or 'auto')
 */

/** Enum for package type
 * @readonly
 * @enum {string}
 */
const PackageType = {
  QFN: 'QFN',
  LQFP: 'LQFP',
};

/** Enum for terminal shape
 * @readonly
 * @enum {string}
 */
const TerminalShape = {
  DSHAPE: 'd',
  RECT: 'r',
  CIRCULAR: 'c',
  OBLONG: 'b', // oval
  IRREGULAR: 'u',
};

/** Enum for mask state option
 * @readonly
 * @enum {number}
 */
const MaskStateOption = {COMMON: 1, OPEN: 2, TENTED: 3};

/** Enum for paste state option
 * @readonly
 * @enum {number}
 */
const PasteStateOption = {COMMON: 1, SOLDER: 2, NO_SOLDER: 3};

/** Enum for pin modification
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
      'name': (typeof name == 'string')?name:'Untitled',
      'refDes': 'U',
      'value': '',
      'datasheetUrl': '',
      'modelUrl': '',
      'packageType': PackageType.QFN,
      'props': {
        'bodyLength': 5,
        'bodyWidth': 5,
        'termLength': 0.55,
        'termWidth': 0.24,
        'termShape': TerminalShape.DSHAPE,
        'pitch': 0.5,
        'pinCount': 28,
        'JT': 0.4,
        'JH': 0.05,
        'JS': 0,
      },
      'pads': [],
      'padTemplates': [],
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

window['PatternCreator'] = new PatternCreator();
