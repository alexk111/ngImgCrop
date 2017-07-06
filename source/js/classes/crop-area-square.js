'use strict';

crop.factory('cropAreaSquare', ['cropArea', function(CropArea) {
  var CropAreaSquare = function() {
    CropArea.apply(this, arguments);

    this._resizeCtrlBaseRadius = 10;
    this._resizeCtrlNormalRatio = 0.75;
    this._resizeCtrlHoverRatio = 1;
    this._iconMoveNormalRatio = 0.9;
    this._iconMoveHoverRatio = 1.2;

    this._resizeCtrlNormalRadius = this._resizeCtrlBaseRadius*this._resizeCtrlNormalRatio;
    this._resizeCtrlHoverRadius = this._resizeCtrlBaseRadius*this._resizeCtrlHoverRatio;

    this._posDragStartX=0;
    this._posDragStartY=0;
    this._posResizeStartX=0;
    this._posResizeStartY=0;
    this._posResizeStartXSize=0;
    this._posResizeStartYSize=0;

    this._resizeCtrlIsHover = -1;
    this._areaIsHover = false;
    this._resizeCtrlIsDragging = -1;
    this._areaIsDragging = false;
  };

  CropAreaSquare.prototype = new CropArea();

  // TODO: Update this to consider the aspect ratio
  CropAreaSquare.prototype._calcSquareCorners=function() {
    var hXSize=this._xSize/2;
    var hYSize=this._ySize/2;
    return [
      [this._x-hXSize, this._y-hYSize],// top left
      [this._x+hXSize, this._y-hYSize],// top right
      [this._x-hXSize, this._y+hYSize],// bottom left
      [this._x+hXSize, this._y+hYSize]// bottom right
    ];
  };

  // TODO: Update this to consider aspect ratio
  CropAreaSquare.prototype._calcSquareDimensions=function() {
    var hXSize=this._xSize/2;
    var hYSize=this._ySize/2;
    return {
      left: this._x-hXSize,
      top: this._y-hYSize,
      right: this._x+hXSize,
      bottom: this._y+hYSize
    };
  };

  CropAreaSquare.prototype._isCoordWithinArea=function(coord) {
    var squareDimensions=this._calcSquareDimensions();
    return (coord[0]>=squareDimensions.left&&coord[0]<=squareDimensions.right&&coord[1]>=squareDimensions.top&&coord[1]<=squareDimensions.bottom);
  };

  // Check if the user is resizing or moving
  CropAreaSquare.prototype._isCoordWithinResizeCtrl=function(coord) {
    var resizeIconsCenterCoords=this._calcSquareCorners();
    var res=-1;
    for(var i=0,len=resizeIconsCenterCoords.length;i<len;i++) {
      var resizeIconCenterCoords=resizeIconsCenterCoords[i];
      if(coord[0] > resizeIconCenterCoords[0] - this._resizeCtrlHoverRadius && coord[0] < resizeIconCenterCoords[0] + this._resizeCtrlHoverRadius &&
         coord[1] > resizeIconCenterCoords[1] - this._resizeCtrlHoverRadius && coord[1] < resizeIconCenterCoords[1] + this._resizeCtrlHoverRadius) {
        res=i;
        break;
      }
    }
    return res;
  };

  // TODO: Update this to consider the aspect ratio
  CropAreaSquare.prototype._drawArea=function(ctx,centerCoords,size){
    var hXSize=size[0]/2;
    var hYSize=size[1]/2;
    ctx.rect(centerCoords[0]-hXSize,centerCoords[1]-hYSize,size[0],size[1]);
  };

  CropAreaSquare.prototype.draw=function() {
    CropArea.prototype.draw.apply(this, arguments);

    // draw move icon
    this._cropCanvas.drawIconMove([this._x,this._y], this._areaIsHover?this._iconMoveHoverRatio:this._iconMoveNormalRatio);

    // draw resize cubes
    var resizeIconsCenterCoords=this._calcSquareCorners();
    for(var i=0,len=resizeIconsCenterCoords.length;i<len;i++) {
      var resizeIconCenterCoords=resizeIconsCenterCoords[i];
      this._cropCanvas.drawIconResizeCircle(resizeIconCenterCoords, this._resizeCtrlBaseRadius, this._resizeCtrlIsHover===i?this._resizeCtrlHoverRatio:this._resizeCtrlNormalRatio);
    }
  };
  // TODO: Update to make the process mouse Move respect width size and height size
  CropAreaSquare.prototype.processMouseMove=function(mouseCurX, mouseCurY) {
    var cursor='default';
    var res=false;

    this._resizeCtrlIsHover = -1;
    this._areaIsHover = false;

    if (this._areaIsDragging) {
      this._x = mouseCurX - this._posDragStartX;
      this._y = mouseCurY - this._posDragStartY;
      this._areaIsHover = true;
      cursor='move';
      res=true;
      this._events.trigger('area-move');
    } else if (this._resizeCtrlIsDragging>-1) {
      var xMulti, yMulti;
      switch(this._resizeCtrlIsDragging) {
        case 0: // Top Left
          xMulti=-1;
          yMulti=-1;
          cursor = 'nwse-resize';
          break;
        case 1: // Top Right
          xMulti=1;
          yMulti=-1;
          cursor = 'nesw-resize';
          break;
        case 2: // Bottom Left
          xMulti=-1;
          yMulti=1;
          cursor = 'nesw-resize';
          break;
        case 3: // Bottom Right
          xMulti=1;
          yMulti=1;
          cursor = 'nwse-resize';
          break;
      }
      var iFX = ((mouseCurX - this._posResizeStartX)*xMulti) + this._posResizeStartXSize;
      var iFY = ((mouseCurY - this._posResizeStartY)*yMulti) + this._posResizeStartYSize;
      // var iFR;
      // if(iFX>iFY) {
      //   iFR = this._posResizeStartSize + iFY;
      // } else {
      //   iFR = this._posResizeStartSize + iFX;
      // }
      var wasXSize=this._xSize;
      var wasYSize=this._ySize;

      // TODO: if there is an aspect ratio constrain the xSize and ySize 
      if(this._aspectRatio!=null){
        if(this._aspectRatio >= 1){// if greater than 1, then we know the height has to be constrained
          this._xSize = Math.max(this._minSize, iFX);
          this._ySize = this._xSize/this._aspectRatio;
        }else{// else we know that the width has to be constrained
          this._ySize = Math.max(this._minSize, iFY);
          this._xSize = this._ySize*this._aspectRatio;
        }
      }else{
        this._xSize = Math.max(this._minSize, iFX);
        this._ySize = Math.max(this._minSize, iFY);
      }


      
      var xPosModifier=(this._xSize-wasXSize)/2;
      var yPosModifier=(this._ySize-wasYSize)/2;
      this._x+=xPosModifier*xMulti;
      this._y+=yPosModifier*yMulti;
      this._resizeCtrlIsHover = this._resizeCtrlIsDragging;
      res=true;
      this._events.trigger('area-resize');
    } else {
      var hoveredResizeBox=this._isCoordWithinResizeCtrl([mouseCurX,mouseCurY]);
      if (hoveredResizeBox>-1) {
        switch(hoveredResizeBox) {
          case 0:
            cursor = 'nwse-resize';
            break;
          case 1:
            cursor = 'nesw-resize';
            break;
          case 2:
            cursor = 'nesw-resize';
            break;
          case 3:
            cursor = 'nwse-resize';
            break;
        }
        this._areaIsHover = false;
        this._resizeCtrlIsHover = hoveredResizeBox;
        res=true;
      } else if(this._isCoordWithinArea([mouseCurX,mouseCurY])) {
        cursor = 'move';
        this._areaIsHover = true;
        res=true;
      }
    }

    this._dontDragOutside();
    angular.element(this._ctx.canvas).css({'cursor': cursor});

    return res;
  };

  CropAreaSquare.prototype.processMouseDown=function(mouseDownX, mouseDownY) {
    var isWithinResizeCtrl=this._isCoordWithinResizeCtrl([mouseDownX,mouseDownY]);
    if (isWithinResizeCtrl>-1) {
      this._areaIsDragging = false;
      this._areaIsHover = false;
      this._resizeCtrlIsDragging = isWithinResizeCtrl;
      this._resizeCtrlIsHover = isWithinResizeCtrl;
      this._posResizeStartX=mouseDownX;
      this._posResizeStartY=mouseDownY;
      this._posResizeStartXSize = this._xSize;
      this._posResizeStartYSize = this._ySize;
      this._events.trigger('area-resize-start');
    } else if (this._isCoordWithinArea([mouseDownX,mouseDownY])) {
      this._areaIsDragging = true;
      this._areaIsHover = true;
      this._resizeCtrlIsDragging = -1;
      this._resizeCtrlIsHover = -1;
      this._posDragStartX = mouseDownX - this._x;
      this._posDragStartY = mouseDownY - this._y;
      this._events.trigger('area-move-start');
    }
  };

  CropAreaSquare.prototype.processMouseUp=function(/*mouseUpX, mouseUpY*/) {
    if(this._areaIsDragging) {
      this._areaIsDragging = false;
      this._events.trigger('area-move-end');
    }
    if(this._resizeCtrlIsDragging>-1) {
      this._resizeCtrlIsDragging = -1;
      this._events.trigger('area-resize-end');
    }
    this._areaIsHover = false;
    this._resizeCtrlIsHover = -1;

    this._posDragStartX = 0;
    this._posDragStartY = 0;
  };


  return CropAreaSquare;
}]);