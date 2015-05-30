(function()
{
    "use strict";

    var module = angular.module('functal.services', []);

    module.factory('functalData', ['$http', function($http)
    {
        var functalData = {};

        functalData.server = 'http://functalserver.codeindeed.com:8083';
        // functalData.server = 'http://localhost:8083';

        functalData.getImages = function()
        {
            return $http.jsonp(functalData.server + '/getimages?callback=JSON_CALLBACK');
        };

        return functalData;
    }]);
})();
