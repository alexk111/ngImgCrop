'use strict';

crop.factory('cropArea', ['cropCanvas', function(CropCanvas) {
  var CropArea = function(ctx, events) {
    this._ctx=ctx;
    this._events=events;

    this._minSize={x:0, y: 0, w:80, h:80};

    this._cropCanvas=new CropCanvas(ctx);

    this._image=new Image();
    this._size = {x: 0, y: 0, w:200, h:200};
  };

  /* GETTERS/SETTERS */

  CropArea.prototype.getImage = function () {
    return this._image;
  };
  CropArea.prototype.setImage = function (image) {
    this._image = image;
  };

  CropArea.prototype.getSize = function () {
    return this._size;
  };

  CropArea.prototype.setSize = function (size) {

    this._size = {x: Math.max(this._minSize.x, size.x) ||  this._minSize.x,
                  y: Math.max(this._minSize.y, size.y) ||  this._minSize.y,
                  w: Math.max(this._minSize.w, size.w) || this._minSize.w,
                  h: Math.max(this._minSize.h, size.h) || this._minSize.h};

    this._dontDragOutside();
  };

  CropArea.prototype.getSouthEastBound = function () {
    var s = this.getSize();
    return {x: s.x + s.w, y: s.y + s.h};
  };



  CropArea.prototype.getMinSize = function () {
    return this._minSize;
  };

  CropArea.prototype.getCenterPoint = function () {
    var s = this.getSize();
    return {x: s.x + (s.w / 2),
            y: s.y + (s.h / 2) };
  };

  CropArea.prototype.setCenterPoint = function (point) {
    var s = this.getSize();
    this.setSize({x: point.x - s.w / 2, y: point.y - s.h / 2, w: s.w, h: s.h});
  };

  CropArea.prototype.setMinSize = function (size) {
    this._minSize = size;
    this.setSize(size);
    this._dontDragOutside();
  };

  /* FUNCTIONS */
  CropArea.prototype._dontDragOutside=function() {
    var h=this._ctx.canvas.height,
        w=this._ctx.canvas.width;

    if(this._size.w>w) { this._size.w=w; }
    if(this._size.w>h) { this._size.w=h; }

    //FIXME: check southeast bound
    if(this._size.x<0) { this._size.x=0; }
    if(this._size.y<0) { this._size.y=0; }
  };

  CropArea.prototype._drawArea=function() {};

  CropArea.prototype.draw=function() {
    // draw crop area
    this._cropCanvas.drawCropArea(this._image,this._size,this.getCenterPoint(),this._drawArea);
  };

  CropArea.prototype.processMouseMove=function() {};

  CropArea.prototype.processMouseDown=function() {};

  CropArea.prototype.processMouseUp=function() {};

  return CropArea;
}]);
