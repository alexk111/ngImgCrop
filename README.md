## Live demo

[Codepen: Circle + Chargement Crop](http://codepen.io/Crackeraki/pen/avYNKP)<br>
[Codepen: Square + Init Url Crop + Maximum rendered image](http://codepen.io/Crackeraki/pen/QjmNVM)<br>
[Codepen: Rectangle Crop](http://codepen.io/Crackeraki/pen/XmEdPx)<br>
[Codepen: Rectangle With Aspect Crop](http://codepen.io/Crackeraki/pen/zvWqJM)<br>
[Codepen: Rectangle + Aspect + Array Crop](http://codepen.io/Neftedollar/pen/YydwNB)<br>

## Future Plan / Bug

1) Add option to init cropper area to max size as much as possible.

2) Add option to not resize cropper area on siders.

3) Add option to set fixed Height or Width of the crop area.

4) Wrap input(file) within plugin, so it don't have any load problems, like with angular material dialog. Make in it an area with a message inside to click for upload new file. This will be by option enabled. Rebuild all demo with this feature. Add button on work space to add new image if image given, make full options for that.

5) Add filters apply. Make an easy way to create new filters. Add some basic filters like Brightness,Contrast,Blur etc.

6) Add option to export original image resized as dataURL.

# ngImgCropFullExtended

Simple Image Crop directive for AngularJS. Enables to crop a circle, a square or a rectangle out of an image.

## Screenshots

Source image by Edgaras Maselskis

![Circle Crop](https://raw.githubusercontent.com/CrackerakiUA/ngImgCropFullExtended/master/screenshots/circle.png "Circle Crop")

![Square Crop](https://raw.githubusercontent.com/CrackerakiUA/ngImgCropFullExtended/master/screenshots/square.png "Square Crop")

![Rectangle Crop](https://raw.githubusercontent.com/CrackerakiUA/ngImgCropFullExtended/master/screenshots/rectangle.png "Rectangle Crop")

## Requirements

- AngularJS
- Modern Browser supporting <canvas>

## Browser/device support

### PC

| IE | Edge | Firefox | Chrome  |
| --- | ---- | ------- | ------- |
| 11 |  12  |    44   |    45   |

### Mobile

|   iOS Safari  | Chrome | Firefox |
| ------------- | ------ | ------- |
|      9        |   46   |    41   |

## Installing

### Download

You have three options to get the files:
- [Download ngImgCropExtended](https://github.com/CrackerakiUA/ngImgCropExtended/archive/master.zip) files from GitHub.
- Use Bower to download the files. Just run `bower install ngImgCropFullExtended`.
- Use Meteor to download the files. Just run `meteor add correpw:ng-img-crop-full-extended`.

### Add files

Add the scripts to your application. Make sure the `ng-img-crop.js` file is inserted **after** the `angular.js` library:

```html
<script src="angular.js"></script>
<script src="ng-img-crop.js"></script>
<link rel="stylesheet" type="text/css" href="ng-img-crop.css">
```

### Add a dependancy

Add the image crop module as a dependancy to your application module:

```js
var myAppModule = angular.module('MyApp', ['ngImgCrop']);
```

## Usage

1. Add the image crop directive `<img-crop>` to the HTML file where you want to use an image crop control. *Note:* a container, you place the directive to, should have some pre-defined size (absolute or relative to its parent). That's required, because the image crop control fits the size of its container.
2. Bind the directive to a source image property (using **image=""** option). The directive will read the image data from that property and watch for updates. The property can be a url to an image, or a data uri.
3. Bind the directive to a result image property (using **result-image=""** option). On each update, the directive will put the content of the crop area to that property in the data uri format.
4. Set up the options that make sense to your application.
5. Done!

## Result image

The result image will always be a square for the both circle and square area types. It's highly recommended to store the image as a square on your back-end, because this will enable you to easily update your pics later, if you decide to implement some design changes. Showing a square image as a circle on the front-end is not a problem - it is as easy as adding a *border-radius* style for that image in a css.

* Notice for mobile device:
Using Data URI is very slow on mobile device, 6x slower. (http://www.mobify.com/blog/data-uris-are-slow-on-mobile/)
Use instead blobUrl.

## Example code

The following code enables to select an image using a file input and crop it. The cropped image data is inserted into img each time the crop area updates.

```html
<html>
<head>
  <script src="angular.js"></script>
  <script src="ng-img-crop.js"></script>
  <link rel="stylesheet" type="text/css" href="ng-img-crop.css">
  <style>
    .cropArea {
      background: #E4E4E4;
      overflow: hidden;
      width:500px;
      height:350px;
    }
  </style>
  <script>
    angular.module('app', ['ngImgCrop'])
      .controller('Ctrl', function($scope) {
        $scope.myImage='';
        $scope.myCroppedImage='';

        var handleFileSelect=function(evt) {
          var file=evt.currentTarget.files[0];
          var reader = new FileReader();
          reader.onload = function (evt) {
            $scope.$apply(function($scope){
              $scope.myImage=evt.target.result;
            });
          };
          reader.readAsDataURL(file);
        };
        angular.element(document.querySelector('#fileInput')).on('change',handleFileSelect);
      });
  </script>
</head>
<body ng-app="app" ng-controller="Ctrl">
  <div>Select an image file: <input type="file" id="fileInput" /></div>
  <div class="cropArea">
    <img-crop image="myImage" result-image="myCroppedImage"></img-crop>
  </div>
  <div>Cropped Image:</div>
  <div><img ng-src="{{myCroppedImage}}" /></div>
</body>
</html>
```

## Options

```html
<img-crop
    image="{string}"
    result-image="{string}"
    result-array-image="{array}"
    result-blob="{string}"
    url-blob="{string}"
    area-coords="myAreaCoords"
   [change-on-fly="{boolean}"]
   [area-type="{circle|square|rectangle}"]
   [area-min-size="{ number|{w:number,h:number} }"]
   [result-image-size="{ number|{w:number,h:number}|[{w:number,h:number},{w:number,h:number},...] }"]
   [result-image-format="{string}"]
   [result-image-quality="{number}"]
   [aspect-ratio="{number}"]
   [dominant-color="{string}"]
   [palette-color="{string}"]
   [palette-color-length="{number}"]
   [on-change="{expression}"]
   [on-load-begin="{expression"]
   [on-load-done="{expression"]
   [on-load-error="{expression"]
></img-crop>
```

### image

Assignable angular expression to data-bind to. NgImgCrop gets an image for cropping from it.

* Notice for mobile device:
Using Data URI is very slow on mobile device, 6x slower. (http://www.mobify.com/blog/data-uris-are-slow-on-mobile/)
Provide instead a blob.

### result-image

Assignable angular expression to data-bind to. NgImgCrop puts a data uri of a cropped image into it.

### result-blob

Assignable angular expression to data-bind to. NgImgCrop puts a blob of a cropped image into it.

### url-blob

Assignable angular expression to data-bind to. NgImgCrop puts an url blob of a cropped image into it.

### change-on-fly

*Optional*. By default, to reduce CPU usage, when a user drags/resizes the crop area, the result image is only updated after the user stops dragging/resizing. Set true to always update the result image as the user drags/resizes the crop area.

### area-type

*Optional*. Type of the crop area. Possible values: circle|square|rectangle. Default: circle.

### area-min-size

*Optional*. Min. width/height of the crop area (in pixels). Default: 80.

### result-image-size

*Optional*. Width/height of the result image (in pixels). Default: 200. 
'selection' renders an image of the size of the area selected.
'max' maximizes the rendered image.

### result-array-image

While you have added an array inside of option result-image-size you will have option to get array of dataURI alogside with width and height requested.

### result-image-format

*Optional*. Format of result image. Possible values include image/jpeg, image/png, and image/webp. Browser support varies. Default: image/png.

### result-image-quality

*Optional*. Quality of result image. Possible values between 0.0 and 1.0 inclusive. Default: browser default.

### aspect-ratio

*Optional*. For rectangle area type. Maintain aspect ratio by scale width/height number.

### dominant-color

*Optional*. Provide dominant color for image using color-thief (https://github.com/lokesh/color-thief).

### palette-color

*Optional*. Provide a color palette for image using color-thief (https://github.com/lokesh/color-thief).

### palette-color-length

*Optional*. Provide a color palette for image using color-thief (https://github.com/lokesh/color-thief).

### on-change

*Optional*. Expression to evaluate upon changing the cropped part of the image. The cropped image data is available as $dataURI.

### on-load-begin

*Optional*. Expression to evaluate when the source image starts loading.

### on-load-done

*Optional*. Expression to evaluate when the source image successfully loaded.

### on-load-error

*Optional*. Expression to evaluate when the source image didn't load.

### chargement

*Optional*. Allow you to modify text of loading message.


## License

See the [LICENSE](https://github.com/alexk111/CrackerakiUA/blob/master/LICENSE) file.

