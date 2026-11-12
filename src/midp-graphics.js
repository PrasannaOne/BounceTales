(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.BounceMIDPGraphics=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  // MIDP Graphics.fillArc: 0° at 3 o'clock, positive counter-clockwise.
  // Canvas 2D uses a downward-positive screen axis, so negate the angles and
  // request its counter-clockwise sweep to preserve the original pie wedge.
  function arcAngles(startDegrees,arcDegrees){
    return {
      start:-startDegrees*Math.PI/180,
      end:-(startDegrees+arcDegrees)*Math.PI/180,
      anticlockwise:true
    };
  }
  return {arcAngles};
});
