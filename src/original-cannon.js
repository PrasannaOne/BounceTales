(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.BounceOriginalCannon=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  // The original manager loads `bu` as its shared cannon-polygon resource.
  // k.java animates three polygon parts through 500 ms, 100 ms and 300 ms.
  const FRAME_DURATIONS=Object.freeze([500,100,300]);
  const ANIMATION_DURATION=FRAME_DURATIONS.reduce((sum,value)=>sum+value,0);
  const LAUNCH_AT=FRAME_DURATIONS[0]+FRAME_DURATIONS[1];
  const PART_COUNT=3;
  const FRAME_COUNT=3;
  const EXPECTED_POLYGONS=PART_COUNT*(FRAME_COUNT+1);

  function createMesh(parsed){
    if(!parsed||!Array.isArray(parsed.objects))throw new TypeError('Cannon mesh requires parsed RLEF objects');
    const polygons=parsed.objects.filter(object=>object.type==='geometry');
    if(polygons.length!==EXPECTED_POLYGONS)throw new Error('Original cannon mesh must contain '+EXPECTED_POLYGONS+' polygons, found '+polygons.length);
    const parts=polygons.map((object,index)=>{
      if(!Array.isArray(object.vertices16)||!Array.isArray(object.faces)||object.faces.length%3!==0)throw new Error('Invalid original cannon polygon '+index);
      if(object.faces.some(face=>!Number.isInteger(face)||face<0||face>=object.vertices16.length))throw new Error('Invalid triangle index in original cannon polygon '+index);
      return Object.freeze({
        vertices16:Object.freeze(object.vertices16.map(point=>Object.freeze([point[0]|0,point[1]|0]))),
        faces:Object.freeze(object.faces.slice()),
        color:object.color>>>0
      });
    });
    for(let part=0;part<PART_COUNT;part++){
      const reference=parts[part];
      for(let frame=1;frame<=FRAME_COUNT;frame++){
        const candidate=parts[frame*PART_COUNT+part];
        if(candidate.vertices16.length!==reference.vertices16.length||candidate.faces.length!==reference.faces.length||candidate.color!==reference.color){
          throw new Error('Cannon animation topology mismatch at frame '+frame+', part '+part);
        }
      }
    }
    return {parts:Object.freeze(parts),durations:FRAME_DURATIONS,totalDuration:ANIMATION_DURATION,launchAt:LAUNCH_AT,restored:false};
  }

  function frameAt(mesh,elapsedMs=0,active=false){
    if(!mesh||!Array.isArray(mesh.parts)||mesh.parts.length!==EXPECTED_POLYGONS)throw new TypeError('Invalid original cannon mesh');
    const elapsed=Math.max(0,Number(elapsedMs)||0);
    if(!active)return mesh.restored?mesh.parts.slice(0,3):mesh.parts.slice(9,12);
    if(elapsed>=mesh.totalDuration)return mesh.parts.slice(0,3);
    let segment=0,segmentStart=0;
    while(segment<mesh.durations.length-1&&elapsed>=segmentStart+mesh.durations[segment]){
      segmentStart+=mesh.durations[segment++];
    }
    const ratio=(elapsed-segmentStart)/mesh.durations[segment],inverse=1-ratio;
    return Array.from({length:PART_COUNT},(_,part)=>{
      const from=mesh.parts[segment*PART_COUNT+part];
      const to=mesh.parts[((segment+1)%FRAME_COUNT)*PART_COUNT+part];
      const vertices16=from.vertices16.map((point,index)=>[
        Math.trunc(point[0]*inverse+to.vertices16[index][0]*ratio)|0,
        Math.trunc(point[1]*inverse+to.vertices16[index][1]*ratio)|0
      ]);
      return {vertices16,faces:mesh.parts[9+part].faces,color:mesh.parts[9+part].color};
    });
  }

  function resetMesh(mesh){
    if(!mesh)return false;
    mesh.restored=false;
    return true;
  }

  function reset(cannon){
    if(!cannon)return false;
    cannon.animationElapsedMs=0;
    cannon.animationActive=false;
    cannon.launchFired=false;
    return true;
  }

  function begin(cannon){
    if(!cannon)return false;
    cannon.animationElapsedMs=0;
    cannon.animationActive=true;
    cannon.launchFired=false;
    return true;
  }

  function update(cannons,deltaMs,mesh){
    if(!Array.isArray(cannons))return;
    const delta=Math.max(0,Number(deltaMs)||0);
    if(!delta)return;
    for(const cannon of cannons){
      if(!cannon.animationActive)continue;
      cannon.animationElapsedMs=Math.min(ANIMATION_DURATION,cannon.animationElapsedMs+delta);
      if(cannon.animationElapsedMs>=ANIMATION_DURATION){cannon.animationActive=false;if(mesh)mesh.restored=true;}
    }
  }

  return Object.freeze({FRAME_DURATIONS,ANIMATION_DURATION,LAUNCH_AT,PART_COUNT,EXPECTED_POLYGONS,createMesh,frameAt,resetMesh,reset,begin,update});
});
