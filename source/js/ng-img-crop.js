'use strict';

crop.directive('imgCrop', ['$timeout', 'cropHost', 'cropPubSub', function($timeout, CropHost, CropPubSub) {
  return {
    restrict: 'E',
    scope: {
      image: '=',
      resultImage: '=',
      originalData: '=',
      cropData: '=',

      changeOnFly: '=',
      areaType: '@',
      areaMinSize: '=',
      resultImageSize: '=',
      resultImageAspect: '@',
      resultImageFormat: '@',
      resultImageQuality: '=',
      maximizeCrop: '=',

      onChange: '&',
      onLoadBegin: '&',
      onLoadDone: '&',
      onLoadError: '&'
    },
    template: '<canvas></canvas>',
    controller: ['$scope', function($scope) {
      $scope.events = new CropPubSub();
    }],
    link: function(scope, element, attrs) {
      // Init Events Manager
      var events = scope.events;
      var initialMax = true;

      // Init Crop Host
      var cropHost=new CropHost(element.find('canvas'), {}, events);

      // Store Result Image to check if it's changed
      var storedResultImage;

      var updateResultImage=function(scope) {
        if(scope.image !== ''){
          var imgWidth= cropHost.getImageWidth();
          var imgHeight= cropHost.getImageHeight();
          var cropArea = cropHost.getArea();
          var cropCanvas = cropHost.getCanvas();
          var aspectRatio = cropArea.getAspect();
          var calcHeight = Math.floor(cropArea.getWidth() * aspectRatio[1] / aspectRatio[0]);
          // if something changes and the crop ends up being taller than the allowable canvas height
          if(calcHeight > cropCanvas.height){
            // set the crop height to the canvas height
            cropArea.setHeight(cropCanvas.height);
          }

          if(angular.isDefined(scope.cropData) && imgWidth !== 0){
            var imgRatio= imgWidth/cropCanvas.width;

            scope.cropData= {
              width: Math.round(cropArea.getWidth()*imgRatio),
              height: Math.round(cropArea.getHeight()*imgRatio),
              x: Math.round((cropArea.getX() - (cropArea.getWidth()/2))*imgRatio),
              y: Math.round((cropArea.getY() - (cropArea.getHeight()/2))*imgRatio)
            };
          }
          if(angular.isDefined(scope.originalData) && imgWidth !== 0 && imgHeight !== 0){
            scope.originalData= {
              width: imgWidth,
              height: imgHeight
            };
          }
          if(angular.isDefined(scope.resultImage)){
            var resultImage=cropHost.getResultImageDataURI();
            if(storedResultImage!==resultImage) {
              storedResultImage=resultImage;
              if(angular.isDefined(scope.resultImage)) {
                scope.resultImage=resultImage;
              }
              scope.onChange({$dataURI: scope.resultImage});
            }
          }
        }
      };

      // Wrapper to safely exec functions within $apply on a running $digest cycle
      var fnSafeApply=function(fn) {
        return function(){
          $timeout(function(){
            scope.$apply(function(scope){
              fn(scope);
            });
          });
        };
      };

      // Setup CropHost Event Handlers
      events
        .on('load-start', fnSafeApply(function(scope){
          scope.onLoadBegin({});
        }))
        .on('load-done', fnSafeApply(function(scope){
          scope.onLoadDone({});
        }))
        .on('load-error', fnSafeApply(function(scope){
          scope.onLoadError({});
        }))
        .on('area-move area-resize', fnSafeApply(function(scope){
          if(!!scope.changeOnFly) {
            updateResultImage(scope);
          }
        }))
        .on('area-move-end area-resize-end image-updated', fnSafeApply(function(scope){
          updateResultImage(scope);
        }));

      // Sync CropHost with Directive's options
      scope.$watch('image',function(){
        var initCrop = {};

        // sometimes the image watcher is fired before the other scope variables are defined        
        $timeout(function(){
          var setToMaximum = (!!scope.maximizeCrop)? true : false;
          if(angular.isDefined(scope.cropData)){
            initCrop = scope.cropData;
          }
          cropHost.setNewImageSource(scope.image, setToMaximum, initCrop);
        }, 100);
      });
      scope.$watch('areaType',function(){
        cropHost.setAreaType(scope.areaType);
        updateResultImage(scope);
      });
      scope.$watch('areaMinSize',function(){
        cropHost.setAreaMinSize(scope.areaMinSize);
        updateResultImage(scope);
      });
      scope.$watch('resultImageSize',function(){
        cropHost.setResultImageSize(scope.resultImageSize);
        updateResultImage(scope);
      });
      // takes aspect ratio in string format (4x3,3x2,2x5,etc)...
      scope.$watch('resultImageAspect',function(){
        if(typeof scope.resultImageAspect !== 'undefined'){
          // split string into 2 parts
          var aspect = scope.resultImageAspect.toLowerCase().split('x');
          // if there are 2 parts, and each part is a valid integer
          if(aspect.length === 2 && !isNaN(parseInt(aspect[0],10)) && !isNaN(parseInt(aspect[1],10))){
            cropHost.setResultImageAspect(parseInt(aspect[0],10),parseInt(aspect[1],10));
            updateResultImage(scope);
          }
        }
      });
      scope.$watch('resultImageFormat',function(){
        cropHost.setResultImageFormat(scope.resultImageFormat);
        updateResultImage(scope);
      });
      scope.$watch('resultImageQuality',function(){
        cropHost.setResultImageQuality(scope.resultImageQuality);
        updateResultImage(scope);
      });
      scope.$watch('maximizeCrop',function(){
        var setToMaximum = (!!scope.maximizeCrop)? true : false;
        // the 'image' watcher will maximizeCrop, so we only want to setNewImageSource
        // if 'maxmizeCrop' is changed after the initial load
        if (angular.isDefined(scope.image) && !initialMax) {
          cropHost.setNewImageSource(scope.image, setToMaximum);
        } else {
          initialMax = false;
        }
      });

      // Update CropHost dimensions when the directive element is resized
      scope.$watch(
        function () {
          return [element[0].clientWidth, element[0].clientHeight];
        },
        function (value) {
          cropHost.setMaxDimensions(value[0],value[1]);
          updateResultImage(scope);
        },
        true
      );

      // Destroy CropHost Instance when the directive is destroying
      scope.$on('$destroy', function(){
          cropHost.destroy();
      });
    }
  };
}]);

crop.directive('imgCropResult', function() {
  return {
    restrict: 'A',
    scope: {
      image: '=',
      cropData: '=',
      originalData: '=',
      width: '@'
    },
    template: '<div class="imgCropResultContainer"><img /></div>',
    link: function(scope, element, attrs) {
      var result_div = angular.element(element[0].querySelector('.imgCropResultContainer'));
      var result_img = element.find('img')[0];
      var result_img_width = 0;
      var result_img_height = 0;
      var div_height = 0;
      var current_source;
      var cur_aspect;

      var watch_triggered = function() {
        // only update the resulting image, if both the image path and dimensions are set
        if(angular.isDefined(scope.image) && scope.image !== '' && angular.isDefined(scope.cropData) && typeof scope.cropData.width !== 'undefined') {
          updateImage();
        }
      };

      var updateImage = function(){
        var temp_image;
        var new_aspect = Math.round( 100 * scope.cropData.width / scope.cropData.height );
        // only change the div's height if the aspect ratio is adjusted
        if(new_aspect !== cur_aspect){
          cur_aspect = new_aspect;
          div_height = Math.round( 100000 * scope.cropData.height / scope.cropData.width ) / 1000;
          // padding scales proportionately with width, height scales to the window
          result_div.css({'padding-top': div_height+'%'});
        }
        // if the image path changes, we need to wait for it to load before updating the result
        if(scope.image !== current_source){
          current_source = scope.image;
          // only use the img.onload if we're not already passing the original dimensions in
          if(!angular.isDefined(scope.originalData) || typeof scope.originalData.width === 'undefined' || scope.originalData.width === 0){
            temp_image = new Image();
            // we need to gather the new image's natural dimensions
            // angular.element(result_img).css({ 'width' : 'auto' });
            temp_image.onload = function(){
              // save the width and height of the generated img, before we adjust it
              result_img_width = temp_image.width;
              result_img_height = temp_image.height;

              setNewData();
            };
            temp_image.src = scope.image;
          }else{
            result_img_width = scope.originalData.width;
            result_img_height = scope.originalData.height;

            setNewData();
          }
          result_img.src = scope.image;
        }else{
          setNewData();
        }
      };

      var setNewData = function(){
        // round all percentages to the nearest thousandth (pretty accurate even on larger images)
        var w = Math.round( 100000 * result_img_width / scope.cropData.width ) / 1000,
        h = Math.round( 100000 * result_img_height / scope.cropData.height ) / 1000,
        x = Math.floor( 1000 * w * scope.cropData.x / result_img_width ) * -1 / 1000,
        y = Math.floor( 1000 * h * scope.cropData.y  / result_img_height ) * -1 / 1000;
        
        angular.element(result_img).css({
          'width' : w+'%',
          'left' : x+'%',
          'top' : y+'%'
        });
      };

      scope.$watch('image', function(){
        watch_triggered();
      });
      scope.$watch('cropData', function(){
        watch_triggered();
      });
      scope.$watch('width', function(){
        // if it's an integer, append 'px' to the value
        var px = ((parseFloat(scope.width) === parseInt(scope.width)) && !isNaN(scope.width))? 'px' : '';
        element.css({ 'width' : scope.width+px });
      });
    }
  };
});
