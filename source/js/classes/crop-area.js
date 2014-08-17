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

    size = this._processSize(size);
    this._size = this._preventBoundaryCollision(size);
  };

  CropArea.prototype.setSizeByCorners = function (northWestCorner, southEastCorner) {

    var size = {x: northWestCorner.x,
                y: northWestCorner.y,
                w: southEastCorner.x - northWestCorner.x,
                h: southEastCorner.y - northWestCorner.y};
    this.setSize(size);
  };

  CropArea.prototype.getSouthEastBound = function () {
    return this._southEastBound(this.getSize());
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
  };


  // return a type string
  CropArea.prototype.getType = function() {
    //default to circle
    return 'circle';
  }

  /* FUNCTIONS */
  CropArea.prototype._preventBoundaryCollision=function(size) {
    var canvasH=this._ctx.canvas.height,
        canvasW=this._ctx.canvas.width;


    var nw = {x: size.x, y: size.y};
    var se = this._southEastBound(size);

    // check northwest corner
    if(nw.x<0) { nw.x=0; }
    if(nw.y<0) { nw.y=0; }

    // check southeast corner
    if(se.x>canvasW) { se.x = canvasW }
    if(se.y>canvasH) { se.y = canvasH }


    var newSize = {x: nw.x,
                   y: nw.y,
                   w: se.x - nw.x,
                   h: se.y - nw.y};

    //check size (if < min, adjust nw corner)
    if (newSize.w < this._minSize.w) {
      newSize.w = this._minSize.w;
      se = this._southEastBound(newSize);
      //adjust se corner, if it's out of bounds
      if(se.x>canvasW)
      {
        se.x = canvasW;
        //adjust nw corner according to min width
        nw.x = Math.max(se.x - canvasW, se.x - this._minSize.w);
        newSize = {x: nw.x,
                   y: nw.y,
                   w: se.x - nw.x,
                   h: se.y - nw.y};
      }
    }

    if (newSize.h < this._minSize.h) {
      newSize.h = this._minSize.h;
      se = this._southEastBound(newSize);

      if(se.y>canvasH)
      {
        se.y = canvasH;
        //adjust nw corner according to min height
        nw.y = Math.max(se.y - canvasH, se.y - this._minSize.h);
        newSize = {x: nw.x,
                   y: nw.y,
                   w: se.x - nw.x,
                   h: se.y - nw.y};
      }
    }

    //finally, enforce 1:1 aspect ratio for sqaure-like selections
    if (this.getType() === "circle" || this.getType() === "square")
    {
      newSize = {x: newSize.x,
                 y: newSize.y,
                 w: Math.min(newSize.w, newSize.h),
                 h: Math.min(newSize.w, newSize.h)};
    }
    return newSize;
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

    return {x: size.x || this._minSize.x,
            y: size.y || this._minSize.y,
            w: size.w || this._minSize.w,
            h: size.h || this._minSize.h};
  }

  CropArea.prototype._southEastBound=function(size)
  {
    return {x: size.x + size.w, y: size.y + size.h};
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
