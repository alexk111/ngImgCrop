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
    this._posResizeStartSize={w: 0, h: 0};

    this._resizeCtrlIsHover = -1;
    this._areaIsHover = false;
    this._resizeCtrlIsDragging = -1;
    this._areaIsDragging = false;
  };

  CropAreaSquare.prototype = new CropArea();

  CropAreaSquare.prototype._calcSquareCorners=function() {
    var hSize=this._size.h/2;
    var c = this.getCenterPoint();
     return [
      [c.x-hSize, c.y-hSize],
      [c.x+hSize, c.y-hSize],
      [c.x-hSize, c.y+hSize],
      [c.x+hSize, c.y+hSize]
     ];
   };

   CropAreaSquare.prototype._calcSquareDimensions=function() {
    var hSize=this._size.h/2;
    var c = this.getCenterPoint();
     return {
      left: c.x-hSize,
      top: c.y-hSize,
      right: c.x+hSize,
      bottom: c.y+hSize
    }
  };

/*

//FIXME:
  CropAreaSquare.prototype._calcSquareCorners=function() {
    var size = this.getSize();
    var se = this.getSoutheastBound();
    return [
      [size.x, size.y], //northwest
      [se.x, size.y], //northeast
      [size.x, size.y], //southwest
      [se.x, se.y] //southeast
    ];
  };

  CropAreaSquare.prototype._calcSquareDimensions=function() {
    var size = this.getSize();
    var se = this.getSoutheastBound();
    return {
      left: size.x,
      top: size.y,
      right: se.x,
      bottom: se.y
    };
  };
*/

  CropAreaSquare.prototype._isCoordWithinArea=function(coord) {
    var squareDimensions=this._calcSquareDimensions();
    return (coord[0]>=squareDimensions.left&&coord[0]<=squareDimensions.right&&coord[1]>=squareDimensions.top&&coord[1]<=squareDimensions.bottom);
  };

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



  CropAreaSquare.prototype._drawArea=function(ctx,center,size){
    ctx.rect(size.x,size.y,size.w,size.h);
  };

  CropAreaSquare.prototype.draw=function() {
    CropArea.prototype.draw.apply(this, arguments);

    var center=this.getCenterPoint();
    // draw move icon
    this._cropCanvas.drawIconMove([center.x, center.y], this._areaIsHover?this._iconMoveHoverRatio:this._iconMoveNormalRatio);

    // draw resize thumbs
    var resizeIconsCenterCoords=this._calcSquareCorners();
    for(var i=0,len=resizeIconsCenterCoords.length;i<len;i++) {
      var resizeIconCenterCoords=resizeIconsCenterCoords[i];
      this._cropCanvas.drawIconResizeCircle(resizeIconCenterCoords, this._resizeCtrlBaseRadius, this._resizeCtrlIsHover===i?this._resizeCtrlHoverRatio:this._resizeCtrlNormalRatio);
    }
  };

  CropAreaSquare.prototype.processMouseMove=function(mouseCurX, mouseCurY) {
    var cursor='default';
    var res=false;

    this._resizeCtrlIsHover = -1;
    this._areaIsHover = false;

    if (this._areaIsDragging) {
      this.setCenterPoint({x: mouseCurX - this._posDragStartX,
                           y: mouseCurY - this._posDragStartY});
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
      var iFX = (mouseCurX - this._posResizeStartX)*xMulti;
      var iFY = (mouseCurY - this._posResizeStartY)*yMulti;
      var iFR;
      if(iFX>iFY) {
        iFR = this._posResizeStartSize.w + iFY;
      } else {
        iFR = this._posResizeStartSize.h + iFX;
      }
      var prevCenter = this.getCenterPoint();

      this.setSize(Math.max(this._minSize.w, iFR));

      //recenter
      this.setCenterPoint(prevCenter);

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
      this._posResizeStartSize = this._size;
      this._events.trigger('area-resize-start');
    } else if (this._isCoordWithinArea([mouseDownX,mouseDownY])) {
      this._areaIsDragging = true;
      this._areaIsHover = true;
      this._resizeCtrlIsDragging = -1;
      this._resizeCtrlIsHover = -1;
      var center = this.getCenterPoint();
      this._posDragStartX = mouseDownX - center.x;
      this._posDragStartY = mouseDownY - center.y;
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
