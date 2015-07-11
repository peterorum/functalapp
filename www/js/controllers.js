(function()
{
    "use strict";


    var module = angular.module('functal.controllers', []);

    module.controller('AppCtrl', [function() {}]);

    module.controller('ImagesCtrl', ['functalData', '$window', '$timeout', '$scope', '$ionicScrollDelegate', '$ionicLoading', '$cordovaSocialSharing', '$localStorage', '$debounce', '$ionicSideMenuDelegate',
        function(functalData, $window, $timeout, $scope, $ionicScrollDelegate, $ionicLoading, $cordovaSocialSharing, $localStorage, $debounce, $ionicSideMenuDelegate)
        {
            //--- get images

            var getImages = function()
            {
                $ionicLoading.show(
                {
                    template: 'loading...'
                });

                functalData.getImages().then(function(result)
                {
                    $scope.images = result.data.images;

                    // set votes
                    var myLikes = $localStorage.getObject('likes', []);
                    var myDislikes = $localStorage.getObject('dislikes', []);

                    R.forEach(function(img)
                    {
                        if (R.find(function(v)
                            {
                                return v === img.name;
                            }, myLikes))
                        {
                            img.vote = 'like';
                        }

                        if (R.find(function(v)
                            {
                                return v === img.name;
                            }, myDislikes))
                        {
                            img.vote = 'dislike';
                        }
                    }, $scope.images);

                    sort();

                    $localStorage.setObject('images', $scope.images);

                    $ionicLoading.hide();

                }, function()
                {
                    // error
                    sort();

                    $ionicLoading.hide();

                });
            };

            // get new images after 5 minutes idle
            var updateImages = $debounce.debounce(
                function()
                {
                    getImages();
                    cleanVotes('likes');
                    cleanVotes('dislikes');

                }, 5 * 60000);

            //--- clear status after a while

            var clearStatus = function(image)
            {
                $timeout(function()
                {
                    image.status = '';
                }, 3000);
            };

            //--- purge

            var purgeDisliked = function()
            {
                return R.filter(function(img)
                {
                    return img.vote !== 'disliked' && img.likes >= img.dislikes;

                }, $scope.images);
            };

            // periodic remove unnecessary dislikes

            var cleanVotes = function(vote)
            {
                // just keep those that are still around

                // vote is 'like' or 'dislikes'

                var votes = $localStorage.getObject(vote, []);

                votes = R.filter(function(n)
                {
                    return !!R.find(function(i)
                    {
                        return i.name === n;
                    }, images);
                }, votes);

                votes = R.uniq(votes);

                $localStorage.setObject(vote, votes);
            };

            //--- sort

            var sort = function()
            {
                $scope.images = purgeDisliked();

                $scope.images = R.sort(function(a, b)
                {
                    var compare;

                    switch ($scope.sorting.sortBy)
                    {
                        case 'new':
                            {
                                compare = -(a.name < b.name ? -1 : a.name > b.name ? 1 : 0);

                                break;
                            }

                        case 'popular':
                            {
                                var bvotes = b.likes - b.dislikes;
                                var avotes = a.likes - a.dislikes;

                                compare = (avotes < avotes ? -1 : avotes > avotes ? 1 : 0);

                                break;
                            }

                        case 'shuffle':
                            {
                                compare = Math.random() < 0.5 ? -1 : 1;

                                break;
                            }
                    }

                    if ($scope.sorting.desc)
                    {
                        compare = -compare;
                    }

                    return compare;

                }, $scope.images);

                $scope.gotoTop();
            };

            //--- goto top of screen

            $scope.gotoTop = function()
            {
                $window.location.href = '#top';

                updateImages();

            };

            //--- infinite scroll

            $scope.showMore = function()
            {
                $scope.showCount += 4;

                console.log('showmore', $scope.showCount);

                $scope.$broadcast('scroll.infiniteScrollComplete');

                updateImages();
            };

            //--- user sort

            $scope.sortBy = function(sorter)
            {
                if (sorter === $scope.sorting.sortBy)
                {
                    $scope.sorting.desc = !$scope.sorting.desc;
                }
                else
                {
                    $scope.sorting.desc = false;
                }

                $scope.sorting.sortBy = sorter;


                $localStorage.setObject('sorting', $scope.sorting);

                sort();

                $scope.showCount = 6;

                $ionicScrollDelegate.scrollTop();

                updateImages();

            };

            // ---------------- save to camera roll

            var saveToCameraRoll = function(base64DataURL, image)
            {
                CameraRoll.saveToCameraRoll(base64DataURL, function()
                {
                    image.saved = true;
                    image.status = 'saved to your photos';
                    clearStatus(image);
                    $scope.$apply();

                }, function(err)
                {
                    image.error = 'Error : ' + err;
                    $scope.$apply();

                });
            };

            $scope.save = function(image)
            {
                image.status = 'saving to your photos...';

                var url = $scope.cdn + image.name;

                convertImgToBase64URL(url, function(base64DataURL, err)
                {
                    if (err)
                    {
                        // could be cors - try s3

                        console.log('cdn error', err);

                        url = $scope.s3 + image.name;

                        convertImgToBase64URL(url, function(base64DataURL, err)
                        {
                            if (err)
                            {
                                console.log('s3 error', err);
                                image.error = "Sorry - a system error prevented saving.";
                            }
                            else
                            {
                                saveToCameraRoll(base64DataURL, image);
                            }
                        }, 'image/jpeg');
                    }
                    else
                    {
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

            function convertImgToBase64URL(url, callback, outputFormat)
            {
                var img = new Image();
                img.crossOrigin = 'Anonymous';

                img.onload = function()
                {
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

                img.onerror = function(e)
                {
                    console.log("img error", e);
                    callback(null, e);
                };

                img.onabort = img.onerror;

                img.src = url;
            }

            //-------------- sharing

            $scope.shareAnywhere = function(image)
            {
                if (!/sharing/.test(image.status))
                {
                    image.status = 'loading sharing...';

                    $ionicLoading.show(
                    {
                        template: 'share...'
                    });

                    $timeout(function()
                    {
                        var imageUrl = $scope.cdn + image.name;

                        $cordovaSocialSharing.share("#functal", null, imageUrl, null).then(function(result)
                        {
                            $ionicLoading.hide();
                            image.status = '';
                            console.log('sharing result', result);
                        }, function(err)
                        {
                            $ionicLoading.hide();
                            image.status = '';
                            console.log('sharing error', err);
                        });
                    }, 0);
                }
            };

            //-------------- sharing

            $scope.vote = function(image, isLike)
            {
                var like, dislike;

                var myLikes = $localStorage.getObject('likes', []);
                var myDislikes = $localStorage.getObject('dislikes', []);

                if (isLike)
                {
                    if (!image.vote)
                    {
                        // new
                        image.vote = 'like';
                        like = 1;
                        dislike = 0;

                        myLikes.push(image.name);
                    }
                    else if (image.vote === 'like')
                    {
                        // unvote
                        image.vote = '';
                        like = -1;
                        dislike = 0;

                        myLikes = R.filter(function(i)
                        {
                            return i.name !== image.name;
                        }, myLikes);
                    }
                    else
                    {
                        // change
                        image.vote = 'like';
                        like = 1;
                        dislike = -1;

                        myLikes.push(image.name);

                        myDislikes = R.filter(function(i)
                        {
                            return i.name !== image.name;
                        }, myDislikes);

                    }
                }
                else // dislike
                {
                    if (!image.vote)
                    {
                        // new
                        image.vote = 'dislike';
                        like = 0;
                        dislike = 1;

                        myDislikes.push(image.name);
                    }
                    else if (image.vote === 'dislike')
                    {
                        // unvote
                        image.vote = '';
                        like = 0;
                        dislike = -1;

                        myDislikes = R.filter(function(i)
                        {
                            return i.name !== image.name;
                        }, myDislikes);
                    }
                    else
                    {
                        // change
                        image.vote = 'dislike';
                        like = -1;
                        dislike = 1;

                        myDislikes.push(image.name);

                        myLikes = R.filter(function(i)
                        {
                            return i.name !== image.name;
                        }, myLikes);
                    }
                }

                $localStorage.setObject('likes', myLikes);
                $localStorage.setObject('dislikes', myDislikes);

                // local update
                image.likes = Math.max(0, image.likes + like);
                image.dislikes = Math.max(0, image.dislikes + dislike);

                functalData.vote(image, like, dislike).then(function(result)
                {
                    if (result.status === 'ok')
                    {
                        // db update
                        images.likes = result.likes;
                        images.dislikes = result.dislikes;
                    }

                }, function()
                {
                    // error
                });

            };

            //----------------- init

            $scope.cdn = 'https://d1aienjtp63qx3.cloudfront.net/';
            $scope.s3 = 'https://s3.amazonaws.com/functal-images/';

            $scope.showCount = 6;

            $scope.images = $localStorage.getObject('images', []);

            $scope.sorting = $localStorage.getObject('sorting',
            {
                sortBy: 'shuffle',
                desc: true
            });

            getImages();
        }
    ]);
})();
