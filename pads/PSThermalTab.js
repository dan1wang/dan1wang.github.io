/**
 * @fileoverview Thermal tab creator module
 */

/* global offsetSegment, mirrorSegmentV, mirrorSegmentH */
/* global rotateSegment180, reflectSegment45 */
/* global createArcSegment */
/* global calcArea */
/* global window */

'use strict';

/**
 * Pad stack module for thermal tab with grid thermal
 * via layout
 * @constructor
 */
function PSThermalTab() {
  /**
   * Minimum length (mm) between two points on an arc
   *    0.02mm ≈ 0.8mil
   *    0.015mm ≈ 0.5mil
   * Used to calculate the step angle of an arc
   *    Δarc = circumference / ARC_RES = 2πr / ARC_RES
   *    Δθ   = 2π / Δarc = ARC_RES / r
   * @constant @default @type {number}
   */
  const ARC_RES = 0.02;

  /** @constant @default @type {number}  */
  const CORNER_RAD = 0.06; // Radius of rounded corners

  /** @constant @default @type {number}  */
  const MIN_PAD_SIZE = 1;
  const MAX_PAD_SIZE = 100;
  const MIN_MASK_SWELL = 0; // Do not allow SMD (solder-mask-defined) pad
  const MAX_MASK_SWELL = 1;
  const MIN_PASTE_SHRINK = 0;
  const MAX_PASTE_SHRINK = 0.5;
  const MIN_PASTE_SPACING = 0;
  // const MAX_PASTE_SPACING = 0.5; // calculated at runtime
  const MIN_VIA_DIA = 0.1;
  const MAX_VIA_DIA = 0.5;
  const MIN_VIA_RING_W = 0.015;
  const MAX_VIA_RING_W = 1;
  const VIA_LAYOUT_NONE = 0;
  const VIA_LAYOUT_GRID = 1;
  const VIA_LAYOUT_DENSE = 2;

  const thermalTab = {
    // properties
    /** number */ padLength: 3.15, // D2, horizontal length
    /** number */ padWidth: 3.15, // E2, vertical length
    /** number */ viaPitchH: 1, // Horizontal spacing of the thermal via
    /** number */ viaPitchV: 1, // Vertical spacing of the thermal via
    /** number */ viaRingWidth: 0.08, // Width of via anti-pad
    /** number */ viaDiameter: 0.3, // Thermal via hole diameter
    /** boolean */ viaTenting: false, // Via tenting
    /** number */ maskSwell: 0.08, // Solder mask swell (0.08mm/~3mil)
    /** number */ pasteShrink: 0.08, // Paste mask shrink (0.08mm/~3mil)
    /** number */ pasteSpacing: 0.25, // Spacing between stencil aperatures
    // computed values
    /** number */ viaColCount: 3,
    /** number */ viaRowCount: 3,
    /** number */ viaPosX: 1, // X position of top-right thermal via
    /** number */ viaPosY: 1, // Y position of top-right thermal via
    /** number */ viaLayout: VIA_LAYOUT_DENSE,
    /** number */ _viaLayout_int_: VIA_LAYOUT_DENSE,
    /** Array */ solderMasks: [],
    /** Array */ pasteMaskTemplates: [],
    /** Array */ pasteMasks: [],
    /** Array */ viaPositions: [],
  };

  /**
   * Generate solder masks
   * All polylines start at top-right corner.
   * All polyline vertex are ordered in clock-wise direction.
   * @return {Array.<Array.<number>>} Array of mask segments
   */
  thermalTab['updateSolderMasks'] = function() {
    const rightEdge = (thermalTab.padLength/2) + thermalTab.maskSwell;
    const topEdge = (thermalTab.padWidth/2) + thermalTab.maskSwell;
    if (thermalTab.viaTenting) {
      let centerX;
      let centerY;
      const arcR = (thermalTab.viaDiameter/2) + thermalTab.viaRingWidth;
      // ◠ 🡄
      // step angle = ARC_RES / R
      // division = angle sweep / step angle
      const division = Math.floor( Math.PI * arcR / ARC_RES);
      const stepAngle = Math.PI / division;
      const arcSeg = createArcSegment(0, 0, arcR, 0, stepAngle, division+1);

      // ─◠─◠─◠─ 🡄
      let arcM = [];
      for (let i=0; i < thermalTab.viaColCount; i += 1) {
        centerX = thermalTab.viaPosX - i * thermalTab.viaPitchH;
        arcM = arcM.concat( offsetSegment(arcSeg, centerX, 0) );
      }
      // ┌────────┐
      // └─◠─◠─◠─┘
      const solderMaskTop = [].concat(
          [rightEdge, topEdge, rightEdge, thermalTab.viaPosY],
          offsetSegment(arcM, 0, thermalTab.viaPosY),
          [-rightEdge, thermalTab.viaPosY, -rightEdge, topEdge] );
      // ┌─◡─◡─◡─┐
      // └────────┘
      const solderMaskBottom = mirrorSegmentV(solderMaskTop);
      thermalTab.solderMasks = [solderMaskTop, solderMaskBottom];
      // ┌─◡─◡─◡─┐
      // └─◠─◠─◠─┘
      if (thermalTab.viaRowCount>1) {
        const arcW = mirrorSegmentV(arcM); // ─◡─◡─◡─ 🡆
        const solderMaskMiddle = [].concat(
            [rightEdge, thermalTab.viaPitchV, rightEdge, 0],
            arcM,
            [-rightEdge, 0, -rightEdge, thermalTab.viaPitchV],
            offsetSegment(arcW, 0, thermalTab.viaPitchV) );
        for (let j=1; j < thermalTab.viaRowCount; j++) {
          centerY = thermalTab.viaPosY - j * thermalTab.viaPitchV;
          thermalTab.solderMasks
              .push(offsetSegment(solderMaskMiddle, 0, centerY) );
        }
      }
    } else {
      thermalTab.solderMasks = [[rightEdge, topEdge, rightEdge, -topEdge,
        -rightEdge, -topEdge, -rightEdge, topEdge]];
    }

    return thermalTab.solderMasks;
  };

  /**
   * Generate paste masks
   * All polylines start at top-right corner.
   * All polyline vertex are ordered in clock-wise direction.
   @return {Array.<Array.<number>>}
  */
  thermalTab['updatePasteMasks'] = function() {
    const rightEdge = (thermalTab.padLength/2)
          - thermalTab.viaPosX
          - thermalTab.pasteShrink;
    const topEdge = (thermalTab.padWidth /2)
          - thermalTab.viaPosY
          - thermalTab.pasteShrink;
    const minorArcR = CORNER_RAD;
    const mainArcR = (thermalTab.viaDiameter/2)
              + (thermalTab.viaTenting?thermalTab.viaRingWidth:0)
              + thermalTab.pasteShrink;

    /**
      * @param {number} start starting angle
      * @param {number} end end angle
      * @return {Array.<number>} mid section of bow
      */
    function bowMidSection(start, end) {
      // step angle = ARC_RES / R
      // division = angle sweep / step angle
      const sweep = end - start;
      const division = Math.abs( Math.floor( sweep * mainArcR / ARC_RES) );
      const stepAngle = sweep / division;
      return createArcSegment(0, 0, mainArcR, start, stepAngle, division+1);
    }

    /**
      * @param {number} start start angle
      * @param {number} end end angle
      * @param {number} cx X position of center
      * @param {number} cy Y position of center
      * @return {Array.<number>} tip section of bow
      */
    function bowTipSection(start, end, cx, cy) {
      /*
        If division = 5, then there are 6 points on the arc.
        Return 5 points so we don't overlap the main arc
      */
      const sweep = end - start;
      const division = Math.abs( Math.floor( sweep * minorArcR / ARC_RES) );
      const stepAngle = sweep / division;
      return createArcSegment(cx, cy, minorArcR, start, stepAngle, division);
    }


    // --------------- segBowNE ---------------------
    // generate the bow-shaped segment to the upper-right of the via
    const tempHypo = minorArcR + mainArcR;
    const tempOppo = minorArcR + thermalTab.pasteSpacing / 2;
    const THETA = Math.asin(tempOppo / tempHypo);
    const minorArcCX = Math.cos(THETA) * tempHypo;
    const minorArcCY = tempOppo;
    const minorArcSeg1 = bowTipSection(
        -Math.PI/2, -Math.PI+THETA, minorArcCX, minorArcCY);
    const minorArcSeg2 = reflectSegment45(minorArcSeg1);
    const segBowNE = [].concat(
        minorArcSeg1,
        bowMidSection(THETA, Math.PI/2 - THETA),
        minorArcSeg2,
    );
    const segBowNW = mirrorSegmentH(segBowNE); // 2nd quatrine (upper-left)
    const segBowSW = rotateSegment180(segBowNE); // 3rd quatrine (lower-left)
    const segBowSE = mirrorSegmentV(segBowNE); // 4th quatrine (lower-right)

    // small rounded corner
    /*
    let cornerArcSeg1 = [];
    minorArcStepAngle = ARC_RES / minorArcR;
    minorArcDivsion = Math.ceil(((Math.PI / 2)) / minorArcStepAngle);
    minorArcStepAngle = (Math.PI / 2) / minorArcDivsion;
    for (i = 0; i <= minorArcDivsion; i++) {
      tempAngle = Math.PI / 2 - i * minorArcStepAngle;
      cornerArcSeg1.push([
        round(minorArcR * Math.cos(tempAngle), decimals),
        round(minorArcR * Math.sin(tempAngle), decimals)
      ]);
    }
    var cornerArcSeg2 = mirrorSegmentH(cornerArcSeg1);
    var cornerArcSeg4 = mirrorSegmentV(cornerArcSeg1);
    console.log(cornerArcSeg1);
    console.log(cornerArcSeg2);
    console.log(cornerArcSeg4);
    */
    const cornerArcSeg1 = [
      /* 90° */ 0.0000, 0.0600, /* 72° */ 0.0185, 0.0571,
      /* 54° */ 0.0353, 0.0485, /* 36° */ 0.0485, 0.0353,
      /* 18° */ 0.0571, 0.0185, /* 0°  */ 0.0600, 0.0000];
    const cornerArcSeg2 = [-0.06, 0, -0.0571, 0.0185, -0.0485, 0.0353,
      -0.0353, 0.0485, -0.0185, 0.0571, -0, 0.06];
    const cornerArcSeg4 = [0.06, -0, 0.0571, -0.0185, 0.0485, -0.0353,
      0.0353, -0.0485, 0.0185, -0.0571, 0, -0.06];

    /** @return {Array.<number>} template 3 (lower-left) */
    function getTemp3() {
      return segBowSW.concat(
          offsetSegment(segBowNW, 0, -thermalTab.viaPitchV),
          offsetSegment(segBowNE,
              -thermalTab.viaPitchH, -thermalTab.viaPitchV),
          offsetSegment(segBowSE, -thermalTab.viaPitchH, 0) );
    }

    /** @return {Array.<number>} template 1 (upper-right) */
    function getTemp1() {
      const r1x = rightEdge - minorArcR;
      const r1y = topEdge - minorArcR;
      const r4x = r1x;
      const r4y = thermalTab.pasteSpacing / 2 + minorArcR;
      const r2x = thermalTab.pasteSpacing / 2 + minorArcR;
      const r2y = topEdge - minorArcR;
      /* NE r, SE r, SW bow, NW r */
      return offsetSegment( cornerArcSeg1, r1x, r1y ).concat(
          offsetSegment( cornerArcSeg4, r4x, r4y ),
          segBowNE,
          offsetSegment( cornerArcSeg2, r2x, r2y ) );
    }

    /** @return {Array.<number>} template 2 (upper-left) */
    function getTemp2() {
      const r1x = -thermalTab.pasteSpacing / 2 - minorArcR;
      const r1y = topEdge - minorArcR;
      const r2x = -thermalTab.viaPitchH
                  + thermalTab.pasteSpacing/2 + minorArcR;
      const r2y = topEdge - minorArcR;
      return offsetSegment(cornerArcSeg1, r1x, r1y).concat(
          segBowNW,
          offsetSegment(segBowNE, -thermalTab.viaPitchH, 0),
          offsetSegment(cornerArcSeg2, r2x, r2y) );
    }

    /** @return {Array.<number>} template 4 (lower-right) */
    function getTemp4() {
      const r1x = rightEdge - minorArcR;
      const r1y = -thermalTab.pasteSpacing / 2 - minorArcR;
      const r4x = r1x;
      const r4y = -thermalTab.viaPitchV
                  + thermalTab.pasteSpacing / 2 + minorArcR;
      return offsetSegment(cornerArcSeg1, r1x, r1y).concat(
          offsetSegment(cornerArcSeg4, r4x, r4y),
          offsetSegment(segBowNE, 0, -thermalTab.viaPitchV),
          segBowSE);
    }

    let template3;
    let template1;
    let template2;
    let template4;

    const denseViaLayout = (thermalTab._viaLayout_int_==VIA_LAYOUT_DENSE);

    if (denseViaLayout) {
      let ALPHA = 0; let arcRSeg;
      let BETA = 0; let arcTSeg;
      if (rightEdge >= minorArcR) {
        const arcRCX = rightEdge - minorArcR;
        const arcRCY = -mainArcR - minorArcR;
        arcRSeg = offsetSegment(
            cornerArcSeg1.slice( ((arcRCX<0.0185)?2:0) ), arcRCX, arcRCY);
      } else {
        const tempHypo = minorArcR + mainArcR;
        const tempOppo = rightEdge - minorArcR;
        ALPHA = -Math.asin(tempOppo / tempHypo); // -π/2 ... 0
        const arcRCX = tempOppo;
        const arcRCY = -(Math.cos(ALPHA) * tempHypo);
        arcRSeg = bowTipSection((Math.PI/2)-ALPHA, 0, arcRCX, arcRCY);
      }

      if (topEdge >= minorArcR) {
        BETA = 0;
        const arcTCY = topEdge - minorArcR;
        const arcTCX = -mainArcR - minorArcR;
        arcTSeg = offsetSegment(
            cornerArcSeg1.slice(0, cornerArcSeg1.length-((arcTCY<0.0185)?2:0) ),
            arcTCX, arcTCY);
      } else {
        const tempHypo = minorArcR + mainArcR;
        const tempOppo = topEdge - minorArcR;
        BETA = -Math.asin(tempOppo / tempHypo); // -π/2 ... 0
        const arcTCY = tempOppo;
        const arcTCX = -(Math.cos(BETA) * tempHypo);
        arcTSeg = bowTipSection(Math.PI/2, BETA, arcTCX, arcTCY);
      }
      // modified bow for right column of dense layout
      const segBowDR = rotateSegment180(minorArcSeg1).concat(
          bowMidSection(Math.PI + THETA, 1.5 * Math.PI - ALPHA),
          arcRSeg
      );
      const segBowDR2 = offsetSegment(
          mirrorSegmentV(segBowDR), 0, -thermalTab.viaPitchV);

      // modified bow for TOP row of dense layout
      const segBowDT = arcTSeg.concat(
          bowMidSection(Math.PI + BETA, 1.5 * Math.PI - THETA),
          rotateSegment180(minorArcSeg2)
      );
      const segBowDT2 = offsetSegment(
          mirrorSegmentH(segBowDT), -thermalTab.viaPitchH, 0);

      // modified bow for top-right corner
      const segBowDC = arcTSeg.concat(
          bowMidSection(Math.PI + BETA, 1.5 * Math.PI - ALPHA),
          arcRSeg
      );

      const segBowNE2 = offsetSegment(segBowNE,
          -thermalTab.viaPitchH, -thermalTab.viaPitchV);

      template1 = segBowDC.concat(
          segBowDR2,
          segBowNE2,
          segBowDT2
      );
      template2 = segBowDT.concat(
          offsetSegment(segBowNW, 0, -thermalTab.viaPitchV),
          segBowNE2,
          segBowDT2
      );
      template4 = segBowDR.concat(
          segBowDR2,
          segBowNE2,
          offsetSegment(segBowSE, -thermalTab.viaPitchH, 0)
      );

      template3 = getTemp3();
      thermalTab.pasteMaskTemplates =
          [template1, template2, template3, template4];
    } else {
      template3 = getTemp3();
      template1 = getTemp1();
      template2 = getTemp2();
      template4 = getTemp4();
      thermalTab.pasteMaskTemplates =
          [template1, template2, template3, template4];
    }

    let offsetX; let offsetY;
    let mask;
    let mirroredMask;

    mask = offsetSegment(template1, thermalTab.viaPosX, thermalTab.viaPosY);
    thermalTab.pasteMasks = [
      mask, // top-right
      mirrorSegmentH(mask), // top-left
      rotateSegment180(mask), // botom-left
      mirrorSegmentV(mask), // bottom-right
    ];
    let colStart; let rowStart; let colEnd; let rowEnd;
    if (denseViaLayout) {
      colStart = rowStart = 1;
      colEnd = thermalTab.viaColCount-2;
      rowEnd = thermalTab.viaRowCount-2;
    } else {
      colStart = rowStart = 0;
      colEnd = thermalTab.viaColCount-1;
      rowEnd = thermalTab.viaRowCount-1;
    }
    // top & bottom rows
    mask = offsetSegment(template2, thermalTab.viaPosX, thermalTab.viaPosY);
    mirroredMask = mirrorSegmentV(mask);
    offsetX = (denseViaLayout?-thermalTab.viaPitchH:0);
    for (let i=colStart; i<colEnd; i++) {
      // offsetX = - i * thermalTab.viaPitchH;
      thermalTab.pasteMasks.push(
          offsetSegment(mask, offsetX, 0),
          offsetSegment(mirroredMask, offsetX, 0) );
      offsetX -= thermalTab.viaPitchH;
    }
    // left & right cols
    mask = offsetSegment(template4, thermalTab.viaPosX, thermalTab.viaPosY);
    mirroredMask = mirrorSegmentH(mask);
    offsetY = (denseViaLayout?-thermalTab.viaPitchV:0);
    for (let j=colStart; j<rowEnd; j++) {
      // offsetY = - j * thermalTab.viaPitchV;
      thermalTab.pasteMasks.push(
          offsetSegment( mask, 0, offsetY),
          offsetSegment( mirroredMask, 0, offsetY) );
      offsetY -= thermalTab.viaPitchV;
    }
    // middle
    for (let i=colStart; i<colEnd; i++) {
      offsetX = thermalTab.viaPosX - (i * thermalTab.viaPitchH);
      for (let j=rowStart; j<rowEnd; j++) {
        offsetY = thermalTab.viaPosY - j * thermalTab.viaPitchV;
        thermalTab.pasteMasks.push(
            offsetSegment(template3, offsetX, offsetY));
      }
    }
    //
    return thermalTab.pasteMasks;
  };

  /**
   * Calculate paste area
   * @return {number}
   */
  thermalTab['getPasteArea'] = function() {
    let area;
    const A1 = calcArea(thermalTab.pasteMaskTemplates[0]);
    const A2 = calcArea(thermalTab.pasteMaskTemplates[1]);
    const A3 = calcArea(thermalTab.pasteMaskTemplates[2]);
    const A4 = calcArea(thermalTab.pasteMaskTemplates[3]);
    if (thermalTab._viaLayout_int_ == VIA_LAYOUT_DENSE) {
      area = (
        (A1 * 4) +
        (A2 * (thermalTab.viaColCount-3) * 2) +
        (A3 * (thermalTab.viaColCount-3) * (thermalTab.viaRowCount-3)) +
        (A4 * (thermalTab.viaRowCount-3) * 2) );
    } else {
      area = (
        (A1 * 4) +
        (A2 * (thermalTab.viaColCount-1) * 2) +
        (A3 * (thermalTab.viaColCount-1) * (thermalTab.viaRowCount-1)) +
        (A4 * (thermalTab.viaRowCount-1) * 2) );
    }
    return area;
  }; // thermalTab.getPasteArea

  /**
   * Get positions of the vias
   @return {Array.<Array.<number>>} Array of [x,y]
   */
  thermalTab['getViaPositions'] = function() {
    let i;
    let j;
    let centerX;
    let centerY;
    const positions = [];
    for (i=0; i < thermalTab.viaColCount; i += 1) {
      centerX = thermalTab.viaPosX - (i * thermalTab.viaPitchH);
      for (j=0; j < thermalTab.viaRowCount; j += 1) {
        centerY = thermalTab.viaPosY - (j * thermalTab.viaPitchV);
        positions.push([centerX, centerY]);
      }
    }
    return positions;
  }; // thermalTab.getViaPositions

  /**
  * Get pad properties.
  * @return {Object}
 */
  thermalTab['getProps'] = function() {
    let layout;
    switch (thermalTab.viaLayout) {
      case VIA_LAYOUT_DENSE: layout = 'dense'; break;
      case VIA_LAYOUT_GRID: layout = 'grid'; break;
      case VIA_LAYOUT_NONE: layout = 'none';
    }
    return {
      'padLength': thermalTab.padLength,
      'padWidth': thermalTab.padWidth,
      'viaPitchH': thermalTab.viaPitchH,
      'viaPitchV': thermalTab.viaPitchV,
      'viaRingWidth': thermalTab.viaRingWidth,
      'viaDiameter': thermalTab.viaDiameter,
      'maskSwell': thermalTab.maskSwell,
      'pasteShrink': thermalTab.pasteShrink,
      'pasteSpacing': thermalTab.pasteSpacing,
      'viaTenting': thermalTab.viaTenting,
      'viaLayout': layout,
    };
  };

  /**
  * Set pad properties. Return validated pad properties.
  * @param {Object} props
  * @return {Object}
 */
  thermalTab['setProps'] = function(props) {
    /**
     * Validate numbers
     * @param {string} propName name of property
     * @param {number} oldVal previous value
     * @param {number} min minimum value
     * @param {number} max maximum  value
     * @return {number}
     */
    function valNum(propName, oldVal, min, max) {
      if (props.hasOwnProperty(propName)) {
        const newVal = parseFloat(props[propName]);
        if (!isNaN(newVal)) {
          if (newVal < min) return min;
          if (newVal > max) return max;
          return newVal;
        }
      }
      return oldVal;
    }

    /* eslint-disable max-len */
    thermalTab.padLength = 0.01 * Math.round( 100 *
        valNum('padLength', thermalTab.padLength, MIN_PAD_SIZE, MAX_PAD_SIZE) );
    thermalTab.padWidth = 0.01 * Math.round( 100 *
        valNum('padWidth', thermalTab.padWidth, MIN_PAD_SIZE, MAX_PAD_SIZE) );
    thermalTab.maskSwell = 0.001 * Math.round( 1000 *
        valNum('maskSwell', thermalTab.maskSwell, MIN_MASK_SWELL, MAX_MASK_SWELL) );
    thermalTab.pasteShrink = 0.001 * Math.round( 1000 *
        valNum('pasteShrink', thermalTab.pasteShrink, MIN_PASTE_SHRINK, MAX_PASTE_SHRINK) );
    thermalTab.viaDiameter = 0.01 * Math.round( 100 *
        valNum('viaDiameter', thermalTab.viaDiameter, MIN_VIA_DIA, MAX_VIA_DIA) );
    thermalTab.viaRingWidth = 0.001 * Math.round( 1000 *
        valNum('viaRingWidth', thermalTab.viaRingWidth, MIN_VIA_RING_W, MAX_VIA_RING_W) );
    thermalTab.viaPitchV = 0.1 * Math.round(10 *
        valNum('viaPitchV', thermalTab.viaPitchV, 0.1, thermalTab.padWidth/2) );
    thermalTab.viaPitchH = 0.1 * Math.round(10 *
        valNum('viaPitchH', thermalTab.viaPitchH, 0.1, thermalTab.padLength/2) );

    if (props.hasOwnProperty('viaTenting')) {
      thermalTab.viaTenting = (props['viaTenting'] == true);
    }

    if (typeof props['viaLayout'] == 'string') {
      const val = props['viaLayout'].toLowerCase();
      switch (val) {
        case 'dense': thermalTab.viaLayout = VIA_LAYOUT_DENSE; break;
        case 'grid': thermalTab.viaLayout = VIA_LAYOUT_GRID; break;
        case 'none':
        default: thermalTab.viaLayout = VIA_LAYOUT_NONE; break;
      }
    }

    // location of the center of the tip arc of the "bow"
    const HYP = Math.max(
        thermalTab.viaDiameter/2 +
          (thermalTab.viaTenting?thermalTab.viaRingWidth:0) +
          thermalTab.pasteShrink + CORNER_RAD);
    const MAX_PASTE_SPACING = 0.01 * Math.round( 100 *
          (2 * (0.64 * HYP) - CORNER_RAD) ); // sin(40°) ≈ 0.64
    /* eslint-disable max-len */
    thermalTab.pasteSpacing = 0.01 * Math.round( 100 *
        valNum('pasteSpacing', thermalTab.pasteSpacing, MIN_PASTE_SPACING, MAX_PASTE_SPACING) );
    /* eslint-enable max-len */
    const OPP = thermalTab.pasteSpacing/2 + CORNER_RAD;
    const ADJ = Math.sqrt(HYP * HYP - OPP * OPP);

    // round via_spacing to 1st decimal to align with 0.1mm grid
    const minViaSpacing = Math.ceil( (ARC_RES + 2 * ADJ) * 10) / 10;
    if (thermalTab.viaPitchV<minViaSpacing) {
      thermalTab.viaPitchV=minViaSpacing;
    }
    if (thermalTab.viaPitchH<minViaSpacing) {
      thermalTab.viaPitchH=minViaSpacing;
    }

    /** @type {number} */
    const PH = thermalTab.viaPitchH;
    const PV = thermalTab.viaPitchV;
    const L = thermalTab.padLength;
    const W = thermalTab.padWidth;
    const MARGIN = 2 * (thermalTab.pasteShrink + CORNER_RAD + ARC_RES + ADJ);

    if (thermalTab.viaLayout == VIA_LAYOUT_GRID) {
      thermalTab.viaColCount = 1 + Math.floor( (L - MARGIN) / PH );
      thermalTab.viaRowCount = 1 + Math.floor( (W - MARGIN) / PV );
      thermalTab._viaLayout_int_ = VIA_LAYOUT_GRID;
    } else if (thermalTab.viaLayout == VIA_LAYOUT_DENSE) {
      const MARGIN2 = 2 * (thermalTab.viaDiameter/2 + thermalTab.viaRingWidth);
      const HDIV = Math.floor( (L - MARGIN2) / PH );
      const VDIV = Math.floor( (W - MARGIN2) / PV );
      if ( ((L - HDIV * PH ) >= MARGIN) && ((W - VDIV * PV ) >= MARGIN) ) {
        thermalTab._viaLayout_int_ = VIA_LAYOUT_GRID;
      } else {
        thermalTab._viaLayout_int_ = VIA_LAYOUT_DENSE;
      }
      thermalTab.viaColCount = HDIV + 1;
      thermalTab.viaRowCount = VDIV + 1;
    }

    thermalTab.viaPosX = 0.5 * (thermalTab.viaColCount-1) * PH;
    thermalTab.viaPosY = 0.5 * (thermalTab.viaRowCount-1) * PV;

    return thermalTab['getProps']();
  }; // thermalTab.setProps

  return thermalTab;
}

window['PSThermalTab'] = PSThermalTab;

/* TEST */
/*
const testPad = new PSThermalTab();
testPad['setProps']( {viaPitchH: 0.1, viaPitchV: 0.1, viaLayout: 'dense'} );
testPad['updatePasteMasks']();
*/
