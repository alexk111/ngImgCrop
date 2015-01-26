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

          if(angular.isDefined(scope.cropData) && imgWidth != 0){
            var imgRatio= imgWidth/cropCanvas.width;

            scope.cropData= {
              width: Math.round(cropArea.getWidth()*imgRatio),
              height: Math.round(cropArea.getHeight()*imgRatio),
              x: Math.round((cropArea.getX() - (cropArea.getWidth()/2))*imgRatio),
              y: Math.round((cropArea.getY() - (cropArea.getHeight()/2))*imgRatio)
            };
          }
          if(angular.isDefined(scope.originalData) && imgWidth != 0 && imgHeight != 0){
            scope.originalData= {
              width: imgWidth,
              height: imgHeight
            }
          }
          
          var resultImage=cropHost.getResultImageDataURI();
          if(storedResultImage!==resultImage) {
            storedResultImage=resultImage;
            if(angular.isDefined(scope.resultImage)) {
              scope.resultImage=resultImage;
            }
            scope.onChange({$dataURI: scope.resultImage});
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
        if(angular.isDefined(scope.cropData)){
          initCrop = scope.cropData;
        }
        cropHost.setNewImageSource(scope.image, initCrop);
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
          var aspect = scope.resultImageAspect.toLowerCase().split("x");
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