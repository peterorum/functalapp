(function()
{
    "use strict";

    var module = angular.module('functal.services', []);

    module.factory('functalData', ['$http', '$q', function($http, $q)
    {
        var functalData = {};

        functalData.server = 'http://functalserver.codeindeed.com:8083';
        // functalData.server = 'http://localhost:8083';

        functalData.getImages = function()
        {
            return $http.jsonp(functalData.server + '/getimages?callback=JSON_CALLBACK');
        };

        functalData.vote = function(image, like, dislike)
        {
            return $http.jsonp(functalData.server + '/vote?callback=JSON_CALLBACK',
            {
                params:
                {
                    data:
                    {
                        name: image.name,
                        like: like,
                        dislike: dislike
                    }
                }
            });
        };

        return functalData;
    }]);
})();
