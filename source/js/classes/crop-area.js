'use strict';

crop.factory('cropArea', ['cropCanvas', function(CropCanvas) {
  var CropArea = function(ctx, events) {
    this._ctx=ctx;
    this._events=events;

    this._minSize=[80, 80];

    this._cropCanvas=new CropCanvas(ctx);

    this._image=new Image();
    this._x = 0;
    this._y = 0;
    this._size = [200, 200];
  };

  /* GETTERS/SETTERS */

  CropArea.prototype.getImage = function () {
    return this._image;
  };
  CropArea.prototype.setImage = function (image) {
    this._image = image;
  };

  CropArea.prototype.getX = function () {
    return this._x;
  };
  CropArea.prototype.setX = function (x) {
    this._x = x;
    this._dontDragOutside();
  };

  CropArea.prototype.getY = function () {
    return this._y;
  };
  CropArea.prototype.setY = function (y) {
    this._y = y;
    this._dontDragOutside();
  };

  CropArea.prototype.getSize = function () {
    return this._size;
  };
  CropArea.prototype.setSize = function (size) {
    this._size = [Math.max(this._minSize[0], size[0]), Math.max(this._minSize[1], size[1])];
    this._dontDragOutside();
  };

  CropArea.prototype.getMinSize = function () {
    return this._minSize;
  };
  CropArea.prototype.setMinSize = function (size) {
    this._minSize = size;
    this._size = [Math.max(this._minSize[0], this._size[0]), Math.max(this._minSize[1], this._size[1])];
    this._dontDragOutside();
  };

  /* FUNCTIONS */
  CropArea.prototype._dontDragOutside=function() {
    var h=this._ctx.canvas.height,
        w=this._ctx.canvas.width;
    if(this._size[0]>w) { this._size[0]=w; }
    if(this._size[1]>h) { this._size[1]=h; }
    if(this._x<this._size[0]/2) { this._x=this._size[0]/2; }
    if(this._x>w-this._size[0]/2) { this._x=w-this._size[0]/2; }
    if(this._y<this._size[1]/2) { this._y=this._size[1]/2; }
    if(this._y>h-this._size[1]/2) { this._y=h-this._size[1]/2; }
  };

  CropArea.prototype._drawArea=function() {};

  CropArea.prototype.draw=function() {
    // draw crop area
    this._cropCanvas.drawCropArea(this._image,[this._x,this._y],this._size,this._drawArea);
  };

  CropArea.prototype.processMouseMove=function() {};

  CropArea.prototype.processMouseDown=function() {};

  CropArea.prototype.processMouseUp=function() {};

  return CropArea;
}]);