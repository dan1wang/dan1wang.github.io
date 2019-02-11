/* xported ARC_RES, CORNER_RAD */
/* xported calcArea */
/* xported rotateSegment180, reflectSegment45 */
/* xported mirrorSegmentV, mirrorSegmentH */
/* xported offsetSegment */
/* xported createArcSegment */

/**
 * Create an arc segment
 * @nosideeffects
 * @param {Number} cx X position of center
 * @param {Number} cy Y position of center
 * @param {Number} r Radius
 * @param {Number} startAngle Starting angle
 * @param {Number} stepAngle Angle increament
 * @param {Number} nSteps Number of steps
 * @return {Array.<Number>}
 */
function createArcSegment(cx, cy, r, startAngle, stepAngle, nSteps) {
  /*
  console.log('cx:' + cx + ',cy:'+ cx + ',r:'+ r
      + ',from:'+ (startAngle*180/Math.PI) + ',step:'+ (stepAngle*180/Math.PI)+
      ',n:'+ nSteps);
  */
  const ROUNDING_F = 10000; // Round all points to 0.0001
  const newArc = new Array(nSteps * 2);
  let i = 0;
  let alpha = startAngle;
  for (let n = nSteps; n > 0; n--) {
    const x = cx + r * Math.cos(alpha);
    const y = cy + r * Math.sin(alpha);
    newArc[i] = Math.round( x * ROUNDING_F ) / ROUNDING_F;
    newArc[i+1] = Math.round( y * ROUNDING_F ) / ROUNDING_F;
    alpha += stepAngle;
    i+=2;
  }
  return newArc;
}

/**
 * Horizontally mirror a segment (with respect to local origin)
 * [x1, y1, x2, y2, ..., xn, yn] => [-xn, yn, ..., -x2, y2, -x1, y1]
 * @nosideeffects
 * @param {Array.<Number>} srcSeg
 * @return {Array.<Number>}
 */
function mirrorSegmentH(srcSeg) {
  const len = srcSeg.length;
  const newSeg = new Array(len);
  let j = len-1;
  for (let i = 0; i < len; i += 2) {
    newSeg[i] = -srcSeg[j-1]; // x1 = -xn
    newSeg[i+1] = srcSeg[j]; // y1 = yn
    j -= 2;
  }
  return newSeg;
}

/**
 * Vertically mirror a segment (with respect to local origin)
 * [x1, y1, x2, y2, ..., xn, yn] => [xn, -yn, ..., x2, -y2, x1, -y1]
 * @nosideeffects
 * @param {Array.<Number>} srcSeg
 * @return {Array.<Number>}
 */
function mirrorSegmentV(srcSeg) {
  const len = srcSeg.length;
  const newSeg = new Array(len);
  let j = len-1;
  for (let i = 0; i < len; i += 2) {
    newSeg[i] = srcSeg[j-1]; // x1 = xn
    newSeg[i+1] = -srcSeg[j]; // y1 = -yn
    j -= 2;
  }
  return newSeg;
}

/**
 * Rotate a segment by 180 degree (with respect to local origin)
 * [x1, y1, x2, y2, ..., xn, yn] => [-x1, -y1, -x2, -y2, ..., -xn, -yn]
 * @nosideeffects
 * @param {Array.<Number>} srcSeg
 * @return {Array.<Number>}
 */
function rotateSegment180(srcSeg) {
  const len = srcSeg.length;
  const newSeg = new Array(len);
  for (let i = 0; i < len; i++) {
    newSeg[i] = -srcSeg[i];
  }
  return newSeg;
}

/**
 * Reflect a segment by 45 degree line
 * [x1, y1, x2, y2, ..., xn, yn] => [yn, xn, ..., y2, x2, y1, x1]
 * @nosideeffects
 * @param {Array.<Number>} srcSeg
 * @return {Array.<Number>}
 */
function reflectSegment45(srcSeg) {
  const len = srcSeg.length;
  const newSeg = new Array(len);
  let j = len-1;
  for (let i = 0; i < len; i += 2) {
    newSeg[i] = srcSeg[j]; // x1 = yn
    newSeg[i+1] = srcSeg[j-1]; // y1 = xn
    j -= 2;
  }
  return newSeg;
}

/**
 * Offset a segment
 * [x1, y1, ...] => [x1 + offsetX, y1 + offsetY...]
 * @nosideeffects
 * @param {Array.<Number>} srcSeg
 * @param {number} offsetX
 * @param {number} offsetY
 * @return {Array.<Number>}
 */
function offsetSegment(srcSeg, offsetX, offsetY) {
  const len = srcSeg.length;
  const newSeg = new Array(len);
  for (let i = 0; i < len; i += 2) {
    newSeg[i] = srcSeg[i] + offsetX;
    newSeg[i+1] = srcSeg[i+1] + offsetY;
  }
  return newSeg;
}

/**
 * Calculate the area of any polygon (do not close the polyline)
 * Area = 0.5 ( ( x1y2 - y1x2 ) + ( x2y3 - y2x3 ) + ... + ( xny1 - ynx1) )
 * See https://www.mathopenref.com/coordpolygonarea.html
 * @nosideeffects
 * @param {Array.<Number>} segment
 * @return {Number}
*/
function calcArea(segment) {
  const len = segment.length;
  const x1 = segment[0];
  const y1 = segment[1];
  const xn = segment[len-2];
  const yn = segment[len-1];
  let area = xn * y1 - yn * x1;
  for (let i = 2; i < len; i+=2) {
    const x2 = segment[i];
    const y2 = segment[i+1];
    const x1 = segment[i-2];
    const y1 = segment[i-1];
    area += x1 * y2 - y1 * x2;
  }
  return Math.abs(area / 2);
}

/* SVG functions */

/**
 * Remove all children
 * @param {DOMElement} el Parent element
*/
function clearElement(el) {
  while (el.lastChild) {
    el.removeChild(el.lastChild);
  }
}

const SVGNS = 'http://www.w3.org/2000/svg';

/**
 * Construct a path data from a segment
 * @param {Array.<Number>} segment
 * @return {String}
*/
function getPathDataFromSegment(segment) {
  let pathData = 'M' + segment[0] + ' ' + (-segment[1]) + ' L';
  const len = segment.length;
  for (let i = 2; i < len; i+=2) {
    pathData += ' ' + segment[i] + ' ' + (-segment[i+1]);
  }
  pathData += 'z'; // close path
  return pathData;
}

/**
 * Create a path element
 * @param {Array.<Number>} segment
 * @return {Element}
*/
function createPathFromSegment(segment) {
  const newPath = document.createElementNS(SVGNS, 'path');
  const pathData = getPathDataFromSegment(segment);
  newPath.setAttributeNS(null, 'd', pathData);
  return newPath;
}

/**
 * Construct a compositie path data from an array of segments
 * @param {Array.<Array.<number>>} segments
 * @return {String}
*/
function getCompositePathDataFromSegments(segments) {
  let pathData = '';
  segments.forEach(function(seg) {
    pathData += getPathDataFromSegment(seg);
  });
  return pathData;
}

/**
 * Create a path element with composite path
 * from an array of segments
 * @param {Array.<Array.<number>>} segments
 * @return {Element}
*/
function createCompositePath(segments) {
  const newPath = document.createElementNS(SVGNS, 'path');
  const pathData = getCompositePathDataFromSegments(segments);
  newPath.setAttributeNS(null, 'd', pathData);
  return newPath;
}

/**
 * Create a circle element
 * @param {Number} cx X position of center
 * @param {Number} cy Y position of center
 * @param {Number} r Radius
 * @return {Element}
*/
function createCircle(cx, cy, r) {
  const newCircle = document.createElementNS(SVGNS, 'circle');
  newCircle.setAttributeNS(null, 'cx', cx);
  newCircle.setAttributeNS(null, 'cy', -cy);
  newCircle.setAttributeNS(null, 'r', r);
  return newCircle;
}

/**
 * Update pad properties
*/
function updateProps() {
  const fPadLength = document.getElementById('fPadLength');
  const fPadWidth = document.getElementById('fPadWidth');
  const fMaskSwell = document.getElementById('fMaskSwell');
  const fPasteShrink = document.getElementById('fPasteShrink');
  const fPasteSpacing = document.getElementById('fPasteSpacing');
  const fViaRingWidth = document.getElementById('fViaRingWidth');
  const fViaDiameter = document.getElementById('fViaDiameter');
  const fViaPitchH = document.getElementById('fViaPitchH');
  const fViaPitchV = document.getElementById('fViaPitchV');
  const fViaLayout = document.getElementById('fViaLayout');
  const fViaTenting = document.getElementById('fViaTenting');

  let padInfo = {
    padLength: fPadLength.value,
    padWidth: fPadWidth.value,
    viaPitchV: fViaPitchV.value,
    viaPitchH: fViaPitchH.value,
    viaRingWidth: fViaRingWidth.value,
    viaDiameter: fViaDiameter.value,
    viaLayout: fViaLayout.value,
    viaTenting: fViaTenting.checked,
    maskSwell: fMaskSwell.value,
    pasteShrink: fPasteShrink.value,
    pasteSpacing: fPasteSpacing.value,
  };

  padInfo = thermalTab.setProps( padInfo );
  resetProps();

  const solderMasks = thermalTab.updateSolderMasks();
  /*
  const pathElement = document.getElementById('solderMaskFG');
  solderMasks.push(padDMask);
  const maskPathData = getCompositePathDataFromSegments(solderMasks);
  pathElement.setAttributeNS(null, 'd', maskPathData);
  */
  let rootElement = document.getElementById('solderMaskFG');
  clearElement(rootElement);
  rootElement.appendChild(createCompositePath(solderMasks));
  /* aaaaaaaaaaaaaa */
  dSolderMasks.forEach(function(item) {
    rootElement.appendChild( createPathFromSegment(item) );
  });
  dSolderMasks2.forEach(function(item) {
    rootElement.appendChild( createPathFromSegment(item) );
  });
  dSolderMasks3.forEach(function(item) {
    rootElement.appendChild( createPathFromSegment(item) );
  });
  dSolderMasks4.forEach(function(item) {
    rootElement.appendChild( createPathFromSegment(item) );
  });

  rootElement = document.getElementById('pl_assy');
  clearElement(rootElement);
  /*
  rootElement.appendChild( createCircle(1.4, 1.4, padInfo.viaDiameter/2) );
  rootElement.appendChild( createCircle(0.7, 1.4, padInfo.viaDiameter/2) );
  rootElement.appendChild( createCircle(1.4, 0.7, padInfo.viaDiameter/2) );
  */
  const viaPositions = thermalTab.getViaPositions();
  viaPositions.forEach(function(item) {
    rootElement
        .appendChild( createCircle(item[0], item[1], padInfo.viaDiameter/2) );
  });

  const pasteMasks = thermalTab.updatePasteMasks();
  const pasteArea = thermalTab.getPasteArea();

  rootElement = document.getElementById('pl_paste');
  clearElement(rootElement);
  rootElement.appendChild( createCompositePath(pasteMasks) );
  /* aaaaaaaaaaaaaa */
  dPasteMasks.forEach(function(item) {
    rootElement.appendChild( createPathFromSegment(item) );
  });
  dPasteMasks2.forEach(function(item) {
    rootElement.appendChild( createPathFromSegment(item) );
  });
  dPasteMasks3.forEach(function(item) {
    rootElement.appendChild( createPathFromSegment(item) );
  });
  dPasteMasks4.forEach(function(item) {
    rootElement.appendChild( createPathFromSegment(item) );
  });

  rootElement = document.getElementById('pl_top');
  clearElement(rootElement);
  const newRect = document.createElementNS(SVGNS, 'rect');
  newRect.setAttributeNS(null, 'width', padInfo.padLength);
  newRect.setAttributeNS(null, 'height', padInfo.padWidth);
  newRect.setAttributeNS(null, 'x', -padInfo.padLength/2);
  newRect.setAttributeNS(null, 'y', -padInfo.padWidth/2);

  rootElement.appendChild(newRect);
  /* aaaaaaaaaaaaaa */
  dPads.forEach(function(item) {
    rootElement.appendChild( createPathFromSegment(item) );
  });
  dPads2.forEach(function(item) {
    rootElement.appendChild( createPathFromSegment(item) );
  });
  dPads3.forEach(function(item) {
    rootElement.appendChild( createPathFromSegment(item) );
  });
  dPads4.forEach(function(item) {
    rootElement.appendChild( createPathFromSegment(item) );
  });

  // ************************************************************
  // Show coverage information
  // ************************************************************

  const epadArea = padInfo.padLength * padInfo.padWidth;
  const r1 = (padInfo.viaDiameter/2) +
      (padInfo.viaTenting?padInfo.viaRingWidth:0);
  const area2 = epadArea - Math.PI * r1 * r1 * viaPositions.length;
  document.getElementById('info').innerHTML =
`<p>E-pad area: ${epadArea.toFixed(2)}mm²</p>
<p>SMD area: ${(area2).toFixed(2)}mm²</p>
<p>Paste area: ${pasteArea.toFixed(2)}mm²</p>
<p>Paste/E-pad ratio: ${(100*pasteArea/epadArea).toFixed(0)}%</p>
<p>Paste/SMD area ratio: ${(100*pasteArea/area2).toFixed(0)}%<br />
(target: 50~70% [<a href="http://www.ti.com/lit/an/slua271b/slua271b.pdf"
title="TI App Report: QFN and SON PCB attachment">1</a>,
<a href="https://www.psemi.com/pdf/app_notes/an62.pdf"
title="Peregrine Semi App Report: Soldering guidelines for mounting bottom-terminated components">2</a>])</p>`;
}

/**
 * Get pad properites
*/
function resetProps() {
  const fPadLength = document.getElementById('fPadLength');
  const fPadWidth = document.getElementById('fPadWidth');
  const fMaskSwell = document.getElementById('fMaskSwell');
  const fPasteShrink = document.getElementById('fPasteShrink');
  const fPasteSpacing = document.getElementById('fPasteSpacing');
  const fViaRingWidth = document.getElementById('fViaRingWidth');
  const fViaDiameter = document.getElementById('fViaDiameter');
  const fViaPitchH = document.getElementById('fViaPitchH');
  const fViaPitchV = document.getElementById('fViaPitchV');
  const fViaLayout = document.getElementById('fViaLayout');
  const fViaTenting = document.getElementById('fViaTenting');

  const padInfo = thermalTab.getProps();

  fPadLength.value = padInfo.padLength;
  fPadWidth.value = padInfo.padWidth;
  fMaskSwell.value = padInfo.maskSwell;
  fPasteShrink.value = padInfo.pasteShrink;
  fPasteSpacing.value = padInfo.pasteSpacing;
  fViaRingWidth.value = padInfo.viaRingWidth;
  fViaDiameter.value = padInfo.viaDiameter;
  fViaPitchH.value = padInfo.viaPitchH.toFixed(1);
  fViaPitchV.value = padInfo.viaPitchV.toFixed(1);
  fViaTenting.checked = padInfo.viaTenting;
  fViaLayout.value = padInfo.viaLayout;
}

window.addEventListener('load', updateProps);

/*
C1 column spacing
X1 pad width
Y1 pad length

e pad row pitch

overall width E
overall length D

ZD toe to toe
GD heel to heel
CPL clearance pad to epad
CLL clearance pad to pad

L terminal length
b terminal width

EV thermal via pitch
V thermal via diameter
*/

/* eslint-disable */
// source https://gist.github.com/branneman/8436956
if(SVGElement&&SVGElement.prototype){SVGElement.prototype.hasClass=function(className){return new RegExp('(\\s|^)'+className+'(\\s|$)').test(this.getAttribute('class'))};SVGElement.prototype.addClass=function(className){if(!this.hasClass(className)){this.setAttribute('class',this.getAttribute('class')+' '+className)}};SVGElement.prototype.removeClass=function(className){var removedClass=this.getAttribute('class').replace(new RegExp('(\\s|^)'+className+'(\\s|$)','g'),'$2');if(this.hasClass(className)){this.setAttribute('class',removedClass)}};SVGElement.prototype.toggleClass=function(className){if(this.hasClass(className)){this.removeClass(className)}else{this.addClass(className)}}}

/** Highlight a dimension group
  * @param {String} id
  */
function dim_highlight(id) {
  document.getElementById(id).addClass('dgrpH');
}
/** Un-highlight a dimension group
  * @param {String} id
  */
function dim_unhighlight(id) {
  document.getElementById(id).removeClass('dgrpH');
}

function switchMode() {
  viewMode = document.getElementById('viewMode').value;
  svg1 = document.getElementById('RePG');
  svg2 = document.getElementById('pad');
  if (viewMode == 'dark') {
    svg1.setAttribute('class','drdrk');
    svg2.setAttribute('class','drk');
  } else {
    svg1.setAttribute('class','drnat');
    svg2.setAttribute('class','nat');
  }
}

function toggleLayer(idName, visibility) {
  document.getElementById(idName).setAttributeNS(null, 'visibility', visibility);
}
/*
'use strict';

PSPadD=function(){var a={I:.55,J:.24,M:.4,K:.05,L:0,j:.08,c:.08,G:[],F:[],H:[],update:function(){function c(a){var b=Math.floor(Math.PI*a/.02);return createArcSegment(l,0,a,Math.PI/2,-(Math.PI/b),b+1)}function d(a){var b=Math.floor(.5*Math.PI*a/.02);return createArcSegment(l,r,a,-Math.PI/2,-(.5*Math.PI/b),b+1)}var b=a.J/2-a.L,e=a.M;var l=a.I+a.K-b;var m=c(b),t=c(b+a.j),n=c(b-a.c),f=Math.min(.5*b,.25,e);l=-(e-f);var r=-(b-f);if(0<e){var h=d(f);m=m.concat(h,mirrorSegmentV(h));h=
d(f+a.j);t=t.concat(h,mirrorSegmentV(h));b-=a.c;e-=a.c;f=Math.max(.5*b,.06);b>f?(l=-e+f,r=-b+f,h=d(f),n=n.concat(h,mirrorSegmentV(h))):n.push(-e,-b,-e,b)}else m.push(0,-b,0,b);a.F=m;a.G=n;a.H=t},getPasteMask:function(){return a.G},getPad:function(){return a.F},getSolderMask:function(){return a.H},setProps:function(c){a.I=c.termLength;a.J=c.termWidth;a.O=c.toe;a.N=c.heel}};return a};

PSThermalTab=function(){var a={m:3.15,o:3.15,b:1,a:1,u:.08,s:.3,B:!1,j:.08,c:.08,g:.25,h:3,f:3,l:1,i:1,w:2,C:2,D:[],v:[],A:[],P:[],updateSolderMasks:function(){var c=a.m/2+a.j,d=a.o/2+a.j;if(a.B){var b=a.s/2+a.u;var e=Math.floor(Math.PI*b/.02);var l=createArcSegment(0,0,b,0,Math.PI/e,e+1);b=[];for(var m=0;m<a.h;m+=1)e=a.l-m*a.b,b=b.concat(offsetSegment(l,e,0));d=[].concat([c,d,c,a.i],offsetSegment(b,0,a.i),[-c,a.i,-c,d]);a.D=[d,mirrorSegmentV(d)];if(1<a.f)for(d=[].concat([c,a.a,c,0],b,[-c,
0,-c,a.a],offsetSegment(mirrorSegmentV(b),0,a.a)),b=1;b<a.f;b++)c=a.i-b*a.a,a.D.push(offsetSegment(d,0,c))}else a.D=[[c,d,c,-d,-c,-d,-c,d]];return a.D},updatePasteMasks:function(){function c(a,b){b-=a;var c=Math.abs(Math.floor(b*n/.02));return createArcSegment(0,0,n,a,b/c,c+1)}function d(a,b,c,d){b-=a;var e=Math.abs(Math.floor(.06*b/.02));return createArcSegment(c,d,.06,a,b/e,e)}function b(){return E.concat(offsetSegment(z,0,-a.a),offsetSegment(w,-a.b,-a.a),offsetSegment(A,-a.b,0))}function e(){var b=
m-.06;return offsetSegment(x,b,t-.06).concat(offsetSegment(B,b,a.g/2+.06),w,offsetSegment(C,a.g/2+.06,t-.06))}function l(){var b=m-.06;return offsetSegment(x,b,-a.g/2-.06).concat(offsetSegment(B,b,-a.a+a.g/2+.06),offsetSegment(w,0,-a.a),A)}var m=a.m/2-a.l-a.c,t=a.o/2-a.i-a.c,n=a.s/2+(a.B?a.u:0)+a.c,f=.06+n,r=.06+a.g/2,h=Math.asin(r/f),k=d(-Math.PI/2,-Math.PI+h,Math.cos(h)*f,r),v=reflectSegment45(k),w=[].concat(k,c(h,Math.PI/2-h),v),z=mirrorSegmentH(w),E=rotateSegment180(w),A=mirrorSegmentV(w),x=[0,
.06,.0185,.0571,.0353,.0485,.0485,.0353,.0571,.0185,.06,0],C=[-.06,0,-.0571,.0185,-.0485,.0353,-.0353,.0485,-.0185,.0571,-0,.06],B=[.06,-0,.0571,-.0185,.0485,-.0353,.0353,-.0485,.0185,-.0571,0,-.06];if(f=2==a.C){var g=r=0;if(.06<=m){var p=m-.06;p=offsetSegment(x.slice(.0185>p?2:0),p,-n-.06)}else p=.06+n,g=m-.06,r=-Math.asin(g/p),p=d(Math.PI/2-r,0,g,-(Math.cos(r)*p));if(.06<=t){g=0;var q=t-.06;var u=offsetSegment(x.slice(0,x.length-(.0185>q?2:0)),-n-.06,q)}else q=.06+n,u=t-.06,g=-Math.asin(u/q),u=
d(Math.PI/2,g,-(Math.cos(g)*q),u);k=rotateSegment180(k).concat(c(Math.PI+h,1.5*Math.PI-r),p);q=offsetSegment(mirrorSegmentV(k),0,-a.a);v=u.concat(c(Math.PI+g,1.5*Math.PI-h),rotateSegment180(v));var y=offsetSegment(mirrorSegmentH(v),-a.b,0);h=offsetSegment(w,-a.b,-a.a);p=u.concat(c(Math.PI+g,1.5*Math.PI-r),p).concat(q,h,y);g=v.concat(offsetSegment(z,0,-a.a),h,y);u=k.concat(q,h,offsetSegment(A,-a.b,0));r=b();a.v=[p,g,r,u]}else r=b(),p=e(),g=offsetSegment(x,-a.g/2-.06,t-.06).concat(z,offsetSegment(w,
-a.b,0),offsetSegment(C,-a.b+a.g/2+.06,t-.06)),u=l(),a.v=[p,g,r,u];k=offsetSegment(p,a.l,a.i);a.A=[k,mirrorSegmentH(k),rotateSegment180(k),mirrorSegmentV(k)];f?(q=h=1,v=a.h-2,p=a.f-2):(q=h=0,v=a.h-1,p=a.f-1);k=offsetSegment(g,a.l,a.i);y=mirrorSegmentV(k);g=f?-a.b:0;for(var D=q;D<v;D++)a.A.push(offsetSegment(k,g,0),offsetSegment(y,g,0)),g-=a.b;k=offsetSegment(u,a.l,a.i);y=mirrorSegmentH(k);f=f?-a.a:0;for(g=q;g<p;g++)a.A.push(offsetSegment(k,0,f),offsetSegment(y,0,f)),f-=a.a;for(k=q;k<v;k++)for(g=a.l-
k*a.b,q=h;q<p;q++)f=a.i-q*a.a,a.A.push(offsetSegment(r,g,f));return a.A},getPasteArea:function(){var c=calcArea(a.v[0]),d=calcArea(a.v[1]),b=calcArea(a.v[2]),e=calcArea(a.v[3]);return 2==a.C?4*c+d*(a.h-3)*2+b*(a.h-3)*(a.f-3)+e*(a.f-3)*2:4*c+d*(a.h-1)*2+b*(a.h-1)*(a.f-1)+e*(a.f-1)*2},getViaPositions:function(){var c,d,b=[];for(c=0;c<a.h;c+=1){var e=a.l-c*a.b;for(d=0;d<a.f;d+=1){var l=a.i-d*a.a;b.push([e,l])}}return b},getProps:function(){switch(a.w){case 2:var c="dense";break;case 1:c="grid";break;
case 0:c="none"}return{padLength:a.m,padWidth:a.o,viaPitchH:a.b,viaPitchV:a.a,viaRingWidth:a.u,viaDiameter:a.s,maskSwell:a.j,pasteShrink:a.c,pasteSpacing:a.g,viaTenting:a.B,viaLayout:c}},setProps:function(c){function d(a,b,d,e){return c.hasOwnProperty(a)&&(a=parseFloat(c[a]),!isNaN(a))?a<d?d:a>e?e:a:b}a.m=.01*Math.round(100*d("padLength",a.m,1,100));a.o=.01*Math.round(100*d("padWidth",a.o,1,100));a.j=.001*Math.round(1E3*d("maskSwell",a.j,0,1));a.c=.001*Math.round(1E3*d("pasteShrink",a.c,0,.5));a.s=
.01*Math.round(100*d("viaDiameter",a.s,.1,.5));a.u=.001*Math.round(1E3*d("viaRingWidth",a.u,.015,1));a.a=.1*Math.round(10*d("viaPitchV",a.a,.1,a.o/2));a.b=.1*Math.round(10*d("viaPitchH",a.b,.1,a.m/2));c.hasOwnProperty("viaTenting")&&(a.B=1==c.viaTenting);if("string"==typeof c.viaLayout)switch(c.viaLayout.toLowerCase()){case "dense":a.w=2;break;case "grid":a.w=1;break;default:a.w=0}var b=Math.max(a.s/2+(a.B?a.u:0)+a.c+.06);a.g=.01*Math.round(100*d("pasteSpacing",a.g,0,.01*Math.round(100*(1.28*b-.06))));
var e=a.g/2+.06,l=Math.sqrt(b*b-e*e);b=Math.ceil(10*(.02+2*l))/10;a.a<b&&(a.a=b);a.b<b&&(a.b=b);b=a.b;e=a.a;var m=a.m,t=a.o;l=2*(a.c+.08+l);if(1==a.w)a.h=1+Math.floor((m-l)/b),a.f=1+Math.floor((t-l)/e),a.C=1;else if(2==a.w){var n=2*(a.s/2+a.u),f=Math.floor((m-n)/b);n=Math.floor((t-n)/e);a.C=m-f*b>=l&&t-n*e>=l?1:2;a.h=f+1;a.f=n+1}a.l=.5*(a.h-1)*b;a.i=.5*(a.f-1)*e;return a.getProps()}};return a};
*/

/* eslint-enable */
const padD = new PSPadD();
padD.update();
/*
const padDPad = offsetSegment(padD.getPad(), -2.5, 0);
const padDMask = offsetSegment(padD.getSolderMask(), -2.5, 0);
const padDPaste = offsetSegment(padD.getPasteMask(), -2.5, 0);
*/
const pad1 = padD.getPad();
const mask1 = padD.getSolderMask();
const paste1 = padD.getPasteMask();
// 28/4 = 7, pitch 0.5
const pitch = 0.5;
let cy = 0.5 * (7-1) * pitch;
const dPads = new Array(7);
const dSolderMasks = new Array(7);
const dPasteMasks = new Array(7);
for (let j=0; j<7; j++) {
  dPads[j] = offsetSegment(pad1, -2.5, cy);
  dSolderMasks[j] = offsetSegment(mask1, -2.5, cy);
  dPasteMasks[j] = offsetSegment(paste1, -2.5, cy);
  cy -= pitch;
}

const pad2 = reflectSegment45(pad1);
const mask2 = reflectSegment45(mask1);
const paste2 = reflectSegment45(paste1);
let cx = 0.5 * (7-1) * pitch;
const dPads2 = new Array(7);
const dSolderMasks2 = new Array(7);
const dPasteMasks2 = new Array(7);
for (let j=0; j<7; j++) {
  dPads2[j] = offsetSegment(pad2, cx, -2.5);
  dSolderMasks2[j] = offsetSegment(mask2, cx, -2.5);
  dPasteMasks2[j] = offsetSegment(paste2, cx, -2.5);
  cx -= pitch;
}

const pad3 = rotateSegment180(pad1);
const mask3 = rotateSegment180(mask1);
const paste3 = rotateSegment180(paste1);
cy = 0.5 * (7-1) * pitch;
const dPads3 = new Array(7);
const dSolderMasks3 = new Array(7);
const dPasteMasks3 = new Array(7);
for (let j=0; j<7; j++) {
  dPads3[j] = offsetSegment(pad3, 2.5, cy);
  dSolderMasks3[j] = offsetSegment(mask3, 2.5, cy);
  dPasteMasks3[j] = offsetSegment(paste3, 2.5, cy);
  cy -= pitch;
}

const pad4 = rotateSegment180(pad2);
const mask4 = rotateSegment180(mask2);
const paste4 = rotateSegment180(paste2);
cx = 0.5 * (7-1) * pitch;
const dPads4 = new Array(7);
const dSolderMasks4 = new Array(7);
const dPasteMasks4 = new Array(7);
for (let j=0; j<7; j++) {
  dPads4[j] = offsetSegment(pad4, cx, 2.5);
  dSolderMasks4[j] = offsetSegment(mask4, cx, 2.5);
  dPasteMasks4[j] = offsetSegment(paste4, cx, 2.5);
  cx -= pitch;
}


const thermalTab = new PSThermalTab();
