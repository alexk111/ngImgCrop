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

    this._size = this._processSize(size);
    this._dontDragOutside();
  };

  CropArea.prototype.setSizeByCorners = function (northWestCorner, southEastCorner) {

    var size = {x: northWestCorner.x,
                y: northWestCorner.y,
                w: southEastCorner.x - northWestCorner.x,
                h: southEastCorner.y - northWestCorner.y};
    this.setSize(size);
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
    this._minSize = this._processSize(size);
    this.setSize(this._minSize);
    this._dontDragOutside();
  };

  /* FUNCTIONS */
  CropArea.prototype._dontDragOutside=function() {
    var canvasH=this._ctx.canvas.height,
        canvasW=this._ctx.canvas.width;

    var s = this.getSize();
    var se = this.getSouthEastBound();
    // copy size
    var newSize = {x: s.x, y: s.y, w:s.w, h:s.h};

    //check northwest corner
    if(s.x<0) { newSize.x=0; }
    if(s.y<0) { newSize.y=0; }

    //check southeast corner
    if(se.x>canvasW) { newSize.x=canvasW-s.w; }
    if(se.y>canvasH) { newSize.y=canvasW-s.w; }

    //check width / height
    if(s.w>canvasW) { newSize.w=canvasW; }
    if(s.h>canvasH) { newSize.h=canvasH; }

    this._size = newSize;

  };

  CropArea.prototype._drawArea=function() {};

  CropArea.prototype._processSize=function(size)
  {
    // make this polymorphic to accept a single floating point number
    // for square-like sizes (including circle)
    if (typeof size == "number")
    {
      size = {w: size, h: size};
    }
    return {x: Math.max(this._minSize.x, size.x) || this._minSize.x,
            y: Math.max(this._minSize.y, size.y) || this._minSize.y,
            w: Math.max(this._minSize.w, size.w) || this._minSize.w,
            h: Math.max(this._minSize.h, size.h) || this._minSize.h};
  }

  CropArea.prototype.draw=function() {
    // draw crop area
    this._cropCanvas.drawCropArea(this._image,this.getCenterPoint(),this._size,this._drawArea);
  };

  CropArea.prototype.processMouseMove=function() {};

  CropArea.prototype.processMouseDown=function() {};

  CropArea.prototype.processMouseUp=function() {};

  return CropArea;
}]);
