'use strict';

crop.factory('cropArea', ['cropCanvas', function(CropCanvas) {
  var CropArea = function(ctx, events) {
    this._ctx=ctx;
    this._events=events;

    this._minSize=80;

    this._cropCanvas=new CropCanvas(ctx);

    this._image=new Image();
    // center coords
    this._x = 0;
    this._y = 0;
    this._xSize = 200;
    this._ySize = 200;
    this._aspectRatio = 1;// Only applies to the CropAreaSquare
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
  CropArea.prototype.getXSize = function () {
    return this._xSize;
  };
  CropArea.prototype.setXSize = function (size) {
    this._xSize = Math.max(this._minSize, size);
    this._dontDragOutside();
  };

  CropArea.prototype.getYSize = function () {
    return this._ySize;
  };
  CropArea.prototype.setYSize = function (size) {
    this._ySize = Math.max(this._minSize, size);
    this._dontDragOutside();
  };

  CropArea.prototype.getMinSize = function () {
    return this._minSize;
  };
  // TODO: Refactor away from using the _size property  
  CropArea.prototype.setMinSize = function (size) {
    this._minSize = size;
    // update the size so that if the size was currently smaller, we make it bigger, else we leave it the same
    this._xSize = Math.max(this._minSize, this._xSize);
    this._ySize = Math.max(this._minSize, this._ySize);
    this._dontDragOutside();
  };

  CropArea.prototype.getAspectRatio = function() {
    return this._aspectRatio;
  }
  CropArea.prototype.setAspectRatio =  function(aspectRatio) {
    this._aspectRatio = aspectRatio;
  }

  /* FUNCTIONS */
  // TODO: Update to consider height and width seperately (remove _size)
  CropArea.prototype._dontDragOutside=function() {
    var h=this._ctx.canvas.height,
        w=this._ctx.canvas.width;
    if(this._xSize>w) { this._xSize=w; }
    if(this._ySize>h) { this._ySize=h; }
    // if the current x is smaller than the half of the crop area,
    // then we know that he width was updated from changing the minimums/maximums
    // so we need to make sure that they are at least the same
    if(this._x<this._xSize/2) { this._x=this._xSize/2; }
    // Or of somehow the x is now off of the canvas, we need to update it to be inside of the canvas
    if(this._x>w-this._xSize/2) { this._x=w-this._xSize/2; }
    // Same as above except for height and for the delta y
    if(this._y<this._ySize/2) { this._y=this._ySize/2; }
    if(this._y>h-this._ySize/2) { this._y=h-this._ySize/2; }
  };

  CropArea.prototype._drawArea=function() {};

  // TODO: update to draw based on the seperate width and height sizes
  CropArea.prototype.draw=function() {
    // Draw the image into the area
    this._cropCanvas.drawCropArea(this._image,[this._x,this._y],[this._xSize, this._ySize],this._drawArea);
  };

  CropArea.prototype.processMouseMove=function() {};

  CropArea.prototype.processMouseDown=function() {};

  CropArea.prototype.processMouseUp=function() {};

  return CropArea;
}]);