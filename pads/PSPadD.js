/**
 * @fileoverview D-shape pad creator module
 */

/* global mirrorSegmentV */
/* global createArcSegment */
/* global window */

'use strict';

/**
 * @constructor
 */
function PSPadD() {
  /** @constant @default @type {number}  */
  const MAX_PAD_RAD = 0.25; // maximum pad radius
  const MIN_RAD = 0.06; // minimum radius
  const ARC_RES = 0.02;

  const padD = {
    /** number */ termLength: 0.55,
    /** number */ termWidth: 0.24,
    /** number */ padToe: 0.4, // JT
    /** number */ padHeel: 0.05, // JH
    /** number */ padSide: 0, // JS
    /** number */ maskSwell: 0.08, // Solder mask swell (0.08mm/~3mil)
    /** number */ pasteShrink: 0.08, // Paste mask shrink (0.08mm/~3mil)
    /** Array */ pasteMask: [],
    /** Array */ padShape: [],
    /** Array */ solderMask: [],
  };

  padD['update'] = function() {
    const TopEdge = padD.termWidth / 2 - padD.padSide;
    const RightEdge = padD.termLength + padD.padHeel;
    const LeftEdge = padD.padToe;
    let cx;
    let cy;

    /**
      * @param {number} r radius
      * @return {Array.<number>}
      */
    function getRightArc(r) {
      const division = Math.floor( Math.PI * r / ARC_RES);
      const stepAngle = Math.PI / division;
      return createArcSegment(
          cx, 0, r, Math.PI/2, -stepAngle, division+1);
    }
    cx = RightEdge - TopEdge;
    let padShape = getRightArc(TopEdge);
    let mask = getRightArc(TopEdge+padD.maskSwell);
    let paste = getRightArc(TopEdge-padD.pasteShrink);

    const R1 = Math.min(TopEdge * 2 * 0.25, MAX_PAD_RAD, LeftEdge);
    cx = -(LeftEdge - R1);
    cy = -(TopEdge - R1);

    /**
      * @param {number} r radius
      * @return {Array.<number>}
      */
    function getCornerArc(r) {
      const division = Math.floor( 0.5 * Math.PI * r / ARC_RES);
      const stepAngle = 0.5 * Math.PI / division;
      return createArcSegment(cx, cy, r, -Math.PI/2, -stepAngle, division+1);
    }

    if (LeftEdge > 0) {
      let arcSeg = getCornerArc(R1);
      padShape = padShape.concat(arcSeg, mirrorSegmentV(arcSeg) );
      arcSeg = getCornerArc(R1+padD.maskSwell);
      mask = mask.concat(arcSeg, mirrorSegmentV(arcSeg) );
      const T = TopEdge - padD.pasteShrink;
      const L = LeftEdge - padD.pasteShrink;
      const R2 = Math.max(T * 2 * 0.25, MIN_RAD);
      if (T>R2) {
        cx = -L + R2;
        cy = -T + R2;
        arcSeg = getCornerArc(R2);
        paste = paste.concat(arcSeg, mirrorSegmentV(arcSeg) );
      } else {
        paste.push(-L, -T, -L, T);
      }
    } else {
      padShape.push(0, -TopEdge, 0, TopEdge);
    }
    padD.padShape = padShape;
    padD.pasteMask = paste;
    padD.solderMask = mask;
  };

  padD['getPasteMask'] = function() {
    return padD.pasteMask;
  };

  padD['getPad'] = function() {
    return padD.padShape;
  };

  padD['getSolderMask'] = function() {
    return padD.solderMask;
  };

  padD['setProps'] = function(props) {
    padD.termLength = props['termLength'];
    padD.termWidth = props['termWidth'];
    padD.toe = props['toe'];
    padD.heel = props['heel'];
  };

  return padD;
}

window['PSPadD'] = PSPadD;
