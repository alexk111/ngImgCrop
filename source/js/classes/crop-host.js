'use strict';

crop.factory('cropHost', ['$document', '$window', 'cropAreaCircle', 'cropAreaSquare', 'cropEXIF', function($document, $window, CropAreaCircle, CropAreaSquare, cropEXIF) {
  /* STATIC FUNCTIONS */

  // Get Element's Offset
  var getElementOffset=function(elem) {
      var box = elem.getBoundingClientRect();

      var body = $document[0].body;
      var docElem = $document[0].documentElement;

      var scrollTop = $window.pageYOffset || docElem.scrollTop || body.scrollTop;
      var scrollLeft = $window.pageXOffset || docElem.scrollLeft || body.scrollLeft;

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
        theArea=null;

    // Dimensions
    var minCanvasDims=[100,100],
        maxCanvasDims=[300,300];

    // Result Image size
    var resImgSize=200;

    // Result Image aspect ratio
    var resImgAspect= [1,1];

    var resImgWidth=resImgSize;

    var resImgHeight=Math.floor(resImgAspect[1] * resImgWidth / resImgAspect[0]);

    // Result Image type
    var resImgFormat='image/png';

    // Result Image quality
    var resImgQuality=null;

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
    var resetCropHost=function(cropData) {
      if(image!==null) {
        theArea.setImage(image);
        var imageDims=[image.width, image.height],
            imageRatio=image.width/image.height,
            canvasDims=imageDims,
            setX,
            setY,
            setSize,
            setHeight;

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

        setX = ctx.canvas.width/2;
        setY = ctx.canvas.height/2;
        // Set maximum cropping selection based on width
        setSize = ctx.canvas.width-1;
        setHeight = Math.floor(resImgAspect[1] * setSize / resImgAspect[0]);
        if(typeof cropData !== 'undefined' && typeof cropData.width !== 'undefined' && cropData.width > 0){
          var cur_ratio = ctx.canvas.width/image.width;
          setSize = Math.round(cropData.width*cur_ratio);
          // Keep size in-bounds
          if(setSize > ctx.canvas.width) { setSize = ctx.canvas.width-1; }
          setHeight = Math.floor(resImgAspect[1] * setSize / resImgAspect[0]);
          // Passed cropData coordinates set to top left corner, adjusted in libarary at center point...
          setX = Math.round((cropData.x*cur_ratio)+(setSize/2));
          setY = Math.round((cropData.y*cur_ratio)+(setHeight/2));
        }
        // if width causes height to extend boundry
        if(setHeight > ctx.canvas.height){
          // Set maximum cropping selection based on height
          setHeight = ctx.canvas.height-1;
          setSize = Math.floor(resImgAspect[0] * setHeight / resImgAspect[1]);
        }
        // Keep coordinates in-bounds
        if(setX + (setSize/2) > ctx.canvas.width) { setX = Math.floor(ctx.canvas.width - (setSize/2)); }
        if(setY + (setHeight/2) > ctx.canvas.height) { setY = Math.floor(ctx.canvas.height - (setHeight/2)); }

        theArea.setX(setX);
        theArea.setY(setY);
        theArea.setSize(setSize);
        

        // Set cropping selection to 200, half canvas width, or half canvas height (whichever is smallest)
        // theArea.setSize(Math.min(200, ctx.canvas.width/2, ctx.canvas.height/2));
      } else {
        elCanvas.prop('width',0).prop('height',0).css({'margin-top': 0});
      }

      drawScene();
    };

    /**
     * Returns event.changedTouches directly if event is a TouchEvent.
     * If event is a jQuery event, return changedTouches of event.originalEvent
     */
    var getChangedTouches=function(event){
      if(angular.isDefined(event.changedTouches)){
        return event.changedTouches;
      }else{
        return event.originalEvent.changedTouches;
      }
    };

    var onMouseMove=function(e) {
      if(image!==null) {
        var offset=getElementOffset(ctx.canvas),
            pageX, pageY;
        if(e.type === 'touchmove') {
          pageX=getChangedTouches(e)[0].pageX;
          pageY=getChangedTouches(e)[0].pageY;
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
          pageX=getChangedTouches(e)[0].pageX;
          pageY=getChangedTouches(e)[0].pageY;
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
          pageX=getChangedTouches(e)[0].pageX;
          pageY=getChangedTouches(e)[0].pageY;
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
      temp_canvas.width = resImgWidth;
      temp_canvas.height = resImgHeight;
      if(image!==null){
        var areaWidth = theArea.getWidth(),
            areaHeight = theArea.getHeight();
        var xRatio=image.width/ctx.canvas.width,
            yRatio=image.height/ctx.canvas.height,
            xLeft=theArea.getX()-areaWidth/2,
            yTop=theArea.getY()-areaHeight/2;

        // prevent factoring beyond the original image dimensions
        while(areaWidth*xRatio > image.width) { areaWidth--; }
        while(areaHeight*yRatio > image.height) { areaHeight--; }

        temp_ctx.drawImage(image, xLeft*xRatio, yTop*yRatio, areaWidth*xRatio, areaHeight*yRatio, 0, 0, resImgWidth, resImgHeight);
      }
      if (resImgQuality!==null ){
        return temp_canvas.toDataURL(resImgFormat, resImgQuality);
      }
      return temp_canvas.toDataURL(resImgFormat);
    };

    this.setNewImageSource=function(imageSource, cropData) {
      image=null;
      resetCropHost();
      events.trigger('image-updated');
      if(!!imageSource) {
        var newImage = new Image();
        if(imageSource.substring(0,4).toLowerCase()==='http') {
          newImage.crossOrigin = 'anonymous';
        }
        newImage.onload = function(){
          events.trigger('load-done');

          // cropEXIF.getData(newImage,function(){
          //   var orientation=cropEXIF.getTag(newImage,'Orientation');

          //   if([3,6,8].indexOf(orientation)>-1) {
          //     var canvas = $document.createElement('canvas'),
          //         ctx=canvas.getContext('2d'),
          //         cw = newImage.width, ch = newImage.height, cx = 0, cy = 0, deg=0;
          //     switch(orientation) {
          //       case 3:
          //         cx=-newImage.width;
          //         cy=-newImage.height;
          //         deg=180;
          //         break;
          //       case 6:
          //         cw = newImage.height;
          //         ch = newImage.width;
          //         cy=-newImage.height;
          //         deg=90;
          //         break;
          //       case 8:
          //         cw = newImage.height;
          //         ch = newImage.width;
          //         cx=-newImage.width;
          //         deg=270;
          //         break;
          //     }

          //     canvas.width = cw;
          //     canvas.height = ch;
          //     ctx.rotate(deg*Math.PI/180);
          //     ctx.drawImage(newImage, cx, cy);

          //     image=new Image();
          //     image.src = canvas.toDataURL('image/png');
          //   } else {
              image=newImage;
            // }
            resetCropHost(cropData);
            events.trigger('image-updated');
          // });
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
        // when the canvas clientHeight is 0 it means that the canvas is hidden, so don't resize anything!
        if(elCanvas[0].clientHeight > 0){
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

          theArea.setX(theArea.getX()*ratioNewCurWidth);
          theArea.setY(theArea.getY()*ratioNewCurHeight);
          theArea.setSize(theArea.getSize()*ratioMin);
        }
      } else {
        elCanvas.prop('width',0).prop('height',0).css({'margin-top': 0});
      }

      drawScene();

    };

    this.setAreaMinSize=function(size) {
      size=parseInt(size,10);
      if(!isNaN(size)) {
        theArea.setMinSize(size);
        drawScene();
      }
    };

    this.setResultImageSize=function(size) {
      size=parseInt(size,10);
      if(!isNaN(size)) {
        resImgSize=size;
        resImgWidth=resImgSize;
        resImgHeight=Math.floor(resImgAspect[1] * resImgWidth / resImgAspect[0]);
      }
    };

    this.setResultImageAspect=function(w, h) {
      w=parseInt(w,10);
      h=parseInt(h,10);
      if(!isNaN(w) && !isNaN(h)) {
        theArea.setAspect(w,h);
        var tempwidth = theArea.getWidth();
        // set the size with the new aspect ratio set
        theArea.setSize(tempwidth);
        resImgAspect=[w,h];
        resImgHeight=Math.floor(resImgAspect[1] * resImgWidth / resImgAspect[0]);
      }
    };

    this.setResultImageFormat=function(format) {
      resImgFormat = format;
    };

    this.setResultImageQuality=function(quality){
      quality = parseFloat(quality);
      if (!isNaN(quality) && quality>=0 && quality<=1){
        resImgQuality = quality;
      }
    };

    this.setAreaType=function(type) {
      var curSize=theArea.getSize(),
          curMinSize=theArea.getMinSize(),
          curX=theArea.getX(),
          curY=theArea.getY(),
          curRatio=theArea.getAspect();

      var AreaClass=CropAreaCircle;
      if(type==='square') {
        AreaClass=CropAreaSquare;
      }

      theArea = new AreaClass(ctx, events);
      theArea.setAspect(curRatio[0],curRatio[1]);
      theArea.setMinSize(curMinSize);
      theArea.setSize(curSize);
      theArea.setX(curX);
      theArea.setY(curY);

      // resetCropHost();
      if(image!==null) {
        theArea.setImage(image);
      }

      drawScene();
    };

    this.getArea=function() {
      return theArea;
    };

    this.getCanvas=function() {
      return ctx.canvas;
    };

    this.getImageWidth=function() {
      return (image !== null)? image.width : 0;
    };

    this.getImageHeight=function() {
      return (image !== null)? image.height : 0;
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
