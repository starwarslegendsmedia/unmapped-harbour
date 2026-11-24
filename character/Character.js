import * as T from 'three';
export class Character {
 constructor(scene,path,size=2.6,row=0){
  this.texture=new T.TextureLoader().load(path);this.texture.colorSpace=T.SRGBColorSpace;
  this.texture.magFilter=T.NearestFilter;this.texture.minFilter=T.NearestFilter;this.texture.generateMipmaps=false;
  this.texture.repeat.set(.25,.25);this.row=row;this.time=0;this.action=null;
  this.sprite=new T.Sprite(new T.SpriteMaterial({map:this.texture,transparent:true,alphaTest:.1,depthWrite:false}));
  this.sprite.center.set(.5,.06);this.sprite.scale.set(size,size,1);scene.add(this.sprite);
 }
 set(x,z){this.sprite.position.set(x,.55,z);}
 animate(dt,moving=false,row=this.row){this.time+=dt;this.texture.offset.set((moving?Math.floor(this.time*7)%4:1)/4,(3-row)/4);}
}
