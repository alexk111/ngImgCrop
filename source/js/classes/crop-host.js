'use strict';

crop.factory('cropHost', ['$document', 'cropAreaCircle', 'cropAreaSquare', 'cropAreaRectangle', function($document, CropAreaCircle, CropAreaSquare, CropAreaRectangle) {
  /* STATIC FUNCTIONS */

  // Get Element's Offset
  var getElementOffset=function(elem) {
      var box = elem.getBoundingClientRect();

      var body = document.body;
      var docElem = document.documentElement;

      var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
      var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;

      var clientTop = docElem.clientTop || body.clientTop || 0;
      var clientLeft = docElem.clientLeft || body.clientLeft || 0;

      var top  = box.top +  scrollTop - clientTop;
      var left = box.left + scrollLeft - clientLeft;

      return { top: Math.round(top), left: Math.round(left) };
  };

  return function(elCanvas, opts, events){
    /* PRIVATE VARIABLES */

    // Object Pointers
    var ctx=null,
        image=null,
        theArea=null,
        self=this;

    // Dimensions
    var minCanvasDims=[100,100],
        maxCanvasDims=[300,300];

    // Result Image size
    var resImgSize={w: 200, h: 200};

    /* PRIVATE FUNCTIONS */

    // Draw Scene
    function drawScene() {
      // clear canvas
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      if(image!==null) {
        // draw source image
        ctx.drawImage(image, 0, 0, ctx.canvas.width, ctx.canvas.height);

        ctx.save();

        // and make it darker
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        ctx.restore();

        // draw Area
        theArea.draw();
      }
    }

    // Resets CropHost
    var resetCropHost=function() {
      if(image!==null) {
        theArea.setImage(image);
        var imageDims=[image.width, image.height],
            imageRatio=image.width/image.height,
            canvasDims=imageDims;

        if(canvasDims[0]>maxCanvasDims[0]) {
          canvasDims[0]=maxCanvasDims[0];
          canvasDims[1]=canvasDims[0]/imageRatio;
        } else if(canvasDims[0]<minCanvasDims[0]) {
          canvasDims[0]=minCanvasDims[0];
          canvasDims[1]=canvasDims[0]/imageRatio;
        }
        if(canvasDims[1]>maxCanvasDims[1]) {
          canvasDims[1]=maxCanvasDims[1];
          canvasDims[0]=canvasDims[1]*imageRatio;
        } else if(canvasDims[1]<minCanvasDims[1]) {
          canvasDims[1]=minCanvasDims[1];
          canvasDims[0]=canvasDims[1]*imageRatio;
        }
        elCanvas.prop('width',canvasDims[0]).prop('height',canvasDims[1]).css({'margin-left': -canvasDims[0]/2+'px', 'margin-top': -canvasDims[1]/2+'px'});

        var cw = ctx.canvas.width;
        var ch = ctx.canvas.height;


        var areaType = self.getAreaType();
        // enforce 1:1 aspect ratio for square-like selections
        if ((areaType === 'circle') || (areaType === 'square')) {
          cw = ch = Math.min(cw, ch);
        }
        //allow to set a user-defined aspect ratio for rectangles
        else if (areaType === "rectangle" && theArea._aspectRatio !== null) {
          ch = cw / theArea._aspectRatio;
        }

        theArea.setSize({ w: Math.min(200, cw / 2),
                          h: Math.min(200, ch / 2)});
        //TODO: set top left corner point
        theArea.setCenterPoint({x: ctx.canvas.width/2, y: ctx.canvas.height/2});

      } else {
        elCanvas.prop('width',0).prop('height',0).css({'margin-top': 0});
      }

      drawScene();
    };

    var onMouseMove=function(e) {
      if(image!==null) {
        var offset=getElementOffset(ctx.canvas),
            pageX, pageY;
        if(e.type === 'touchmove') {
          pageX=e.changedTouches[0].pageX;
          pageY=e.changedTouches[0].pageY;
        } else {
          pageX=e.pageX;
          pageY=e.pageY;
        }
        theArea.processMouseMove(pageX-offset.left, pageY-offset.top);
        drawScene();
      }
    };

    var onMouseDown=function(e) {
      e.preventDefault();
      e.stopPropagation();
      if(image!==null) {
        var offset=getElementOffset(ctx.canvas),
            pageX, pageY;
        if(e.type === 'touchstart') {
          pageX=e.changedTouches[0].pageX;
          pageY=e.changedTouches[0].pageY;
        } else {
          pageX=e.pageX;
          pageY=e.pageY;
        }
        theArea.processMouseDown(pageX-offset.left, pageY-offset.top);
        drawScene();
      }
    };

    var onMouseUp=function(e) {
      if(image!==null) {
        var offset=getElementOffset(ctx.canvas),
            pageX, pageY;
        if(e.type === 'touchend') {
          pageX=e.changedTouches[0].pageX;
          pageY=e.changedTouches[0].pageY;
        } else {
          pageX=e.pageX;
          pageY=e.pageY;
        }
        theArea.processMouseUp(pageX-offset.left, pageY-offset.top);
        drawScene();
      }
    };


    this.getResultImageDataURI=function() {
      var temp_ctx, temp_canvas;
      temp_canvas = angular.element('<canvas></canvas>')[0];
      temp_ctx = temp_canvas.getContext('2d');
      var ris = this.getResultImageSize();
      temp_canvas.width = ris.w;
      temp_canvas.height = ris.h;
      var center = theArea.getCenterPoint();
      if(image!==null){
        temp_ctx.drawImage(image, (center.x-theArea.getSize().w/2)*(image.width/ctx.canvas.width), (center.y-theArea.getSize().h/2)*(image.height/ctx.canvas.height), theArea.getSize().w*(image.width/ctx.canvas.width), theArea.getSize().h*(image.height/ctx.canvas.height), 0, 0, ris.w, ris.h);
      }
      return temp_canvas.toDataURL();
    };

    this.setNewImageSource=function(imageSource) {
      image=null;
      resetCropHost();
      events.trigger('image-updated');
      if(!!imageSource) {
        var newImage = new Image();
        newImage.onload = function(){
          events.trigger('load-done');
          image=newImage;
          resetCropHost();
          events.trigger('image-updated');
        };
        newImage.onerror=function() {
          events.trigger('load-error');
        };
        events.trigger('load-start');
        newImage.src=imageSource;
      }
    };

    this.setMaxDimensions=function(width, height) {
      maxCanvasDims=[width,height];

      if(image!==null) {
        var curWidth=ctx.canvas.width,
            curHeight=ctx.canvas.height;

        var imageDims=[image.width, image.height],
            imageRatio=image.width/image.height,
            canvasDims=imageDims;

        if(canvasDims[0]>maxCanvasDims[0]) {
          canvasDims[0]=maxCanvasDims[0];
          canvasDims[1]=canvasDims[0]/imageRatio;
        } else if(canvasDims[0]<minCanvasDims[0]) {
          canvasDims[0]=minCanvasDims[0];
          canvasDims[1]=canvasDims[0]/imageRatio;
        }
        if(canvasDims[1]>maxCanvasDims[1]) {
          canvasDims[1]=maxCanvasDims[1];
          canvasDims[0]=canvasDims[1]*imageRatio;
        } else if(canvasDims[1]<minCanvasDims[1]) {
          canvasDims[1]=minCanvasDims[1];
          canvasDims[0]=canvasDims[1]*imageRatio;
        }
        elCanvas.prop('width',canvasDims[0]).prop('height',canvasDims[1]).css({'margin-left': -canvasDims[0]/2+'px', 'margin-top': -canvasDims[1]/2+'px'});

        var ratioNewCurWidth=ctx.canvas.width/curWidth,
            ratioNewCurHeight=ctx.canvas.height/curHeight,
            ratioMin=Math.min(ratioNewCurWidth, ratioNewCurHeight);

        //TODO: use top left corner point
        theArea.setSize({w: theArea.getSize().w * ratioMin,
                         h: theArea.getSize().h * ratioMin});
        var center = theArea.getCenterPoint();
        theArea.setCenterPoint({x: center.x*ratioNewCurWidth, y: center.y*ratioNewCurHeight});

      } else {
        elCanvas.prop('width',0).prop('height',0).css({'margin-top': 0});
      }

      drawScene();

    };

    this.setAspectRatio=function(ratio) {
      if (angular.isUndefined(ratio))
      {
        return;
      }
     ratio=parseFloat(ratio);
      if(!isNaN(ratio)) {
        theArea.setAspectRatio(ratio);
        drawScene();
      }
    };

    this.setAreaMinSize=function(size) {
      if (angular.isUndefined(size))
      {
        return;
      }
      size={w: parseInt(size.w,10),
            h: parseInt(size.h,10)};
      if(!isNaN(size.w) && !isNaN(size.h)) {
        theArea.setMinSize(size);
        drawScene();
      }
    };

    this.getResultImageSize=function() {
      if (resImgSize == "selection")
      {
        return theArea.getSize();
      }

      return resImgSize;
    };
    this.setResultImageSize=function(size) {
      if (angular.isUndefined(size))
      {
        return;
      }

      //allow setting of size to "selection" for mirroring selection's dimensions
      if (angular.isString(size) && isNaN(parseFloat(size)))
      {
        resImgSize = size;
        return;
      }

      //allow scalar values for square-like selection shapes
      var parsedSize = parseInt(size, 10);
      if (!isNaN(parsedSize))
      {
        size = {w: parsedSize,
                h: parsedSize};
      } else {
        size = {w: parseInt(size.w, 10),
                h: parseInt(size.h, 10)};
      }

      if(!isNaN(size.w) && !isNaN(size.h)) {
        resImgSize=size;
        drawScene();
      }
    };

    // returns a string of the selection area's type
    this.getAreaType=function() {
      return theArea.getType();
    };

    this.setAreaType=function(type) {
      var center = theArea.getCenterPoint();
      var curSize=theArea.getSize(),
          curMinSize=theArea.getMinSize(),
          curX= center.x,
          curY= center.y;

      var AreaClass=CropAreaCircle;
      if(type==='square') {
        AreaClass=CropAreaSquare;
      } else if (type==='rectangle')
      {
        AreaClass=CropAreaRectangle;
      }
      theArea = new AreaClass(ctx, events);
      theArea.setMinSize(curMinSize);
      theArea.setSize(curSize);

      //TODO: use top left point
      theArea.setCenterPoint({x: curX, y: curY});

      // resetCropHost();
      if(image!==null) {
        theArea.setImage(image);
      }

      drawScene();
    };

    /* Life Cycle begins */

    // Init Context var
    ctx = elCanvas[0].getContext('2d');

    // Init CropArea
    theArea = new CropAreaCircle(ctx, events);

    // Init Mouse Event Listeners
    $document.on('mousemove',onMouseMove);
    elCanvas.on('mousedown',onMouseDown);
    $document.on('mouseup',onMouseUp);

    // Init Touch Event Listeners
    $document.on('touchmove',onMouseMove);
    elCanvas.on('touchstart',onMouseDown);
    $document.on('touchend',onMouseUp);

    // CropHost Destructor
    this.destroy=function() {
      $document.off('mousemove',onMouseMove);
      elCanvas.off('mousedown',onMouseDown);
      $document.off('mouseup',onMouseMove);

      $document.off('touchmove',onMouseMove);
      elCanvas.off('touchstart',onMouseDown);
      $document.off('touchend',onMouseMove);

      elCanvas.remove();
    };
  };

}]);
