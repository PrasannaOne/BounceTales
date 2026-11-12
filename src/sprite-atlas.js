(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.BounceSpriteAtlas=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function equalRect(a,b){
    return !!a&&!!b&&a.x===b.x&&a.y===b.y&&a.width===b.width&&a.height===b.height;
  }
  function equalOffset(a,b){return !!a&&!!b&&a.x===b.x&&a.y===b.y;}
  function prepare(catalogue,imageMap){
    if(!catalogue||catalogue.status!=='STATIC_SPRITE_MAPPING_AND_SCRIPT_TIMINGS_VERIFIED')
      throw new Error('Unverified static sprite catalogue');
    if(catalogue.static_sprite_count!==326||!Array.isArray(catalogue.sprites)||catalogue.sprites.length!==326)
      throw new Error('Static sprite catalogue must contain 326 sprites');
    if(!Array.isArray(catalogue.png_images)||catalogue.png_images.length!==46)
      throw new Error('Static sprite catalogue must contain 46 PNG resources');
    const byId=new Array(326),seen=new Set();
    for(const sprite of catalogue.sprites){
      const id=sprite.sprite_id,slot=sprite.image_slot,crop=sprite.crop,offset=sprite.draw_offset;
      if(!Number.isInteger(id)||id<0||id>=326||seen.has(id))throw new Error('Invalid or duplicate static sprite id '+id);
      if(!Number.isInteger(slot)||slot<0||slot>=46)throw new Error('Invalid PNG slot for sprite '+id);
      const png=catalogue.png_images[slot];
      if(!png||png.png!==sprite.png)throw new Error('PNG name mismatch for sprite '+id);
      if(!crop||![crop.x,crop.y,crop.width,crop.height].every(Number.isInteger)||crop.x<0||crop.y<0||crop.width<=0||crop.height<=0||crop.x+crop.width>png.width||crop.y+crop.height>png.height)
        throw new Error('Out-of-bounds crop for sprite '+id);
      if(!offset||![offset.x,offset.y].every(Number.isInteger))throw new Error('Invalid draw offset for sprite '+id);
      if(imageMap){
        const map=imageMap.maps&&imageMap.maps[String(id)];
        if(!map||map.type!=='simple'||map.image!==slot||map.atlasX!==crop.x||map.atlasY!==crop.y||
          map.width!==crop.width||map.height!==crop.height||map.originX!==offset.x||map.originY!==offset.y)
          throw new Error('Runtime image-map parity mismatch for sprite '+id);
      }
      byId[id]=sprite;seen.add(id);
    }
    if(seen.size!==326||byId.some(v=>!v))throw new Error('Missing static sprite descriptors');
    return Object.freeze({catalogue,byId,get(id){return Number.isInteger(id)&&id>=0&&id<byId.length?byId[id]||null:null;}});
  }
  return {prepare};
});
