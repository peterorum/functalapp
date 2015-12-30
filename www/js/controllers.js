(function() {

  "use strict";


  var module = angular.module('functal.controllers', []);

  module.controller('AppCtrl', [function() {}]);

  module.controller('ImagesCtrl', ['functalData', '$scope', '$window', '$timeout', '$ionicScrollDelegate', '$ionicLoading', '$cordovaSocialSharing', '$localStorage', '$debounce', '$ionicSideMenuDelegate',
    function(functalData, $scope, $window, $timeout, $ionicScrollDelegate, $ionicLoading, $cordovaSocialSharing, $localStorage, $debounce, $ionicSideMenuDelegate) {

      var vm = this;

      //--- get images

      var getImages = function() {

        // $ionicLoading.show(
        //   {
        //     template: 'loading...'
        //   });

        functalData.getImages().then(function(result) {

          if (result.data.images && result.data.images.length) {

            vm.images = result.data.images;

            // set votes
            var myLikes = $localStorage.getObject('likes', []);
            var myDislikes = $localStorage.getObject('dislikes', []);

            R.forEach(function(img) {

              if (R.find(function(v) {

                  return v === img.name;
                }, myLikes)) {

                img.vote = 'like';
              }

              if (R.find(function(v) {

                  return v === img.name;
                }, myDislikes)) {

                img.vote = 'dislike';
              }
            }, vm.images);

            sort();

            $localStorage.setObject('images', vm.images);

            functalData.setImageCount(vm.images.length);
          }

        }, function() {

          // error
          sort();

        }).finally(function() {
          $scope.$broadcast('scroll.refreshComplete');
          // $ionicLoading.hide();
        });
      };

      // get new images after 5 minutes idle
      var updateImages = $debounce.debounce(
        function() {

          getImages();
          cleanVotes('likes');
          cleanVotes('dislikes');

        }, 5 * 60000);

      //--- clear status after a while

      var clearStatus = function(image) {

        $timeout(function() {

          image.status = '';
        }, 3000);
      };

      //--- purge

      var purgeDisliked = function() {

        return R.filter(function(img) {

          return img.vote !== 'disliked' && (typeof img.likes === 'undefined' || img.likes >= img.dislikes);
        }, vm.images);
      };

      // periodic remove unnecessary dislikes

      var cleanVotes = function(vote) {

        // just keep those that are still around

        // vote is 'like' or 'dislikes'

        var votes = $localStorage.getObject(vote, []);

        votes = R.filter(function(n) {

          return !!R.find(function(i) {

            return i.name === n;
          }, images);
        }, votes);

        votes = R.uniq(votes);

        $localStorage.setObject(vote, votes);
      };

      //--- sort

      var sort = function() {

        vm.images = purgeDisliked();

        vm.images = R.sort(function(a, b) {

          var compare;

          switch (vm.sorting.sortBy) {

            case 'new':{
              compare = -(a.name < b.name ? -1 : a.name > b.name ? 1 : 0);

              break;
              }

            case 'popular':{
              var avotes = a.likes - a.dislikes;
              var bvotes = b.likes - b.dislikes;

              compare = -(avotes < bvotes ? -1 : avotes > bvotes ? 1 : 0);

              break;
              }

            case 'shuffle':{
              compare = Math.random() < 0.5 ? -1 : 1;

              break;
              }
          }

          if (vm.sorting.desc) {

            compare = -compare;
          }

          return compare;
        }, vm.images);

        vm.gotoTop();
      };

      //--- goto top of screen

      vm.gotoTop = function() {

        $window.location.href = '#top';

        updateImages();

      };

      //--- infinite scroll

      vm.showMore = function() {

        vm.showCount += 4;

        console.log('showmore', vm.showCount);

        $scope.$broadcast('scroll.infiniteScrollComplete');

        updateImages();
      };

      //--- user sort

      vm.sortBy = function(sorter) {

        if (sorter === vm.sorting.sortBy) {

          vm.sorting.desc = !vm.sorting.desc;
        }
        else {

          vm.sorting.desc = false;
        }

        vm.sorting.sortBy = sorter;


        $localStorage.setObject('sorting', vm.sorting);

        sort();

        vm.showCount = 6;

        $ionicScrollDelegate.scrollTop();

        updateImages();

      };

      // pull to refresh

      vm.doRefresh = function() {
        getImages();
      };

      // ---------------- save to camera roll

      var saveToCameraRoll = function(base64DataURL, image) {

        CameraRoll.saveToCameraRoll(base64DataURL, function() {

          image.saved = true;
          image.status = 'saved to your photos';
          clearStatus(image);
          vm.$apply();

        }, function(err) {

          image.error = 'Error : ' + err;
          vm.$apply();

        });
      };

      vm.save = function(image) {

        image.status = 'saving to your photos...';

        var url = vm.cdn + image.name;

        convertImgToBase64URL(url, function(base64DataURL, err) {

          if (err) {

            // could be cors - try s3

            console.log('cdn error', err);

            url = vm.s3 + image.name;

            convertImgToBase64URL(url, function(base64DataURL, err) {

              if (err) {

                console.log('s3 error', err);
                image.error = "Sorry - a system error prevented saving.";
              }
              else {

                saveToCameraRoll(base64DataURL, image);
              }
            }, 'image/jpeg');
          }
          else {

            saveToCameraRoll(base64DataURL, image);
          }


        }, 'image/jpeg');

        updateImages();

      };

      /**
       * Convert an image
       * to a base64 url
       * @param  {String}   url
       * @param  {Function} callback
       * @param  {String}   [outputFormat=image/jpeg]
       * http://stackoverflow.com/questions/6150289/how-to-convert-image-into-base64-string-using-javascript
       */

      // cors test example
      // curl -sI -H "Origin: codeindeed.com" -H "Access-Control-Request-Method: GET" https://d1aienjtp63qx3.cloudfront.net/functal-20150610070410687.jpg

      function convertImgToBase64URL(url, callback, outputFormat) {

        var img = new Image();
        img.crossOrigin = 'Anonymous';

        img.onload = function() {

          var canvas = document.createElement('CANVAS'),
            ctx = canvas.getContext('2d'),
            dataURL;

          canvas.height = img.height;
          canvas.width = img.width;

          ctx.drawImage(img, 0, 0);

          dataURL = canvas.toDataURL(outputFormat);

          callback(dataURL);

          canvas = null;
        };

        img.onerror = function(e) {

          console.log("img error", e);
          callback(null, e);
        };

        img.onabort = img.onerror;

        img.src = url;
      }

      //-------------- sharing

      vm.shareAnywhere = function(image) {

        if (!/sharing/.test(image.status)) {

          image.status = 'loading sharing...';

          $ionicLoading.show(
            {
              template: 'share...'
            });

          $timeout(function() {

            var imageUrl = vm.cdn + image.name;

            var msg = '#functal';

            if (image.title){
              msg = '"' + image.title + '" ' + msg;
            }

            msg = msg + '#functal';

            $cordovaSocialSharing.share(msg, null, imageUrl, null).then(function(result) {

              $ionicLoading.hide();
              image.status = '';
              console.log('sharing result', result);
            }, function(err) {

              $ionicLoading.hide();
              image.status = '';
              console.log('sharing error', err);
            });
          }, 0);
        }
      };

      //-------------- sharing

      vm.vote = function(image, isLike) {

        var like, dislike;

        var myLikes = $localStorage.getObject('likes', []);
        var myDislikes = $localStorage.getObject('dislikes', []);

        if (isLike) {

          if (!image.vote) {

            // new
            image.vote = 'like';
            like = 1;
            dislike = 0;

            myLikes.push(image.name);
          } else if (image.vote === 'like') {

            // unvote
            image.vote = '';
            like = -1;
            dislike = 0;

            myLikes = R.filter(function(i) {

              return i.name !== image.name;
            }, myLikes);
          }
          else {

            // change
            image.vote = 'like';
            like = 1;
            dislike = -1;

            myLikes.push(image.name);

            myDislikes = R.filter(function(i) {

              return i.name !== image.name;
            }, myDislikes);

          }
        }
        else // dislike
        {

          if (!image.vote) {

            // new
            image.vote = 'dislike';
            like = 0;
            dislike = 1;

            myDislikes.push(image.name);
          } else if (image.vote === 'dislike') {

            // unvote
            image.vote = '';
            like = 0;
            dislike = -1;

            myDislikes = R.filter(function(i) {

              return i.name !== image.name;
            }, myDislikes);
          }
          else {

            // change
            image.vote = 'dislike';
            like = -1;
            dislike = 1;

            myDislikes.push(image.name);

            myLikes = R.filter(function(i) {

              return i.name !== image.name;
            }, myLikes);
          }
        }

        $localStorage.setObject('likes', myLikes);
        $localStorage.setObject('dislikes', myDislikes);

        // local update
        image.likes = Math.max(0, image.likes + like);
        image.dislikes = Math.max(0, image.dislikes + dislike);

        functalData.vote(image, like, dislike).then(function(result) {

          if (result.status === 'ok') {

            // db update
            images.likes = result.likes;
            images.dislikes = result.dislikes;
          }

        }, function() {

          // error
        });

      };

      //----------------- init

      vm.cdn = 'https://d1aienjtp63qx3.cloudfront.net/';
      vm.s3 = 'https://s3.amazonaws.com/functal-images/';

      vm.showCount = 6;

      vm.images = $localStorage.getObject('images', []);

      vm.sorting = $localStorage.getObject('sorting',
        {
          sortBy: 'shuffle',
          desc: true
        });

      getImages();
    }
  ]);

  module.controller('HelpCtrl', ['functalData',
    function(functalData) {

      var vm = this;

      vm.imageCount = function() {
        return functalData.imageCount;
      };

    }]);
})();
