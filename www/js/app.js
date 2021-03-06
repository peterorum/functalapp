// Ionic functal App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'functal' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'functal.services' is found in services.js
// 'functal.controllers' is found in controllers.js

(function()
{
    "use strict";

    var app = angular.module('functal', ['ionic', 'ionic.utils', 'ngCordova', 'functal.controllers', 'functal.services']);

    app.run(function($ionicPlatform)
    {
        $ionicPlatform.ready(function()
        {
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard)
            {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            }
            if (window.StatusBar)
            {
                // org.apache.cordova.statusbar required
                StatusBar.styleLightContent();
            }
        });
    });

    app.config(function($stateProvider, $urlRouterProvider)
    {

        // Ionic uses AngularUI Router which uses the concept of states
        // Learn more here: https://github.com/angular-ui/ui-router
        // Set up the various states which the app can be in.
        // Each state's controller can be found in controllers.js
        $stateProvider
            .state('app',
            {
                url: "/app",
                abstract: true,
                templateUrl: "templates/menu.html",
                controller: 'AppCtrl'
            })
            .state('app.images',
            {
                url: '/images',
                views:
                {
                    'menuContent':
                    {
                        templateUrl: 'templates/images.html',
                        controller: 'ImagesCtrl as vm'
                    }
                }
            })
            .state('app.help',
            {
                url: '/help',
                views:
                {
                    'menuContent':
                    {
                        templateUrl: 'templates/help.html',
                        controller: 'HelpCtrl as help'
                    }
                }
            });


        // if none of the above states are matched, use this as the fallback
        $urlRouterProvider.otherwise('/app/images');

    });

})();
