﻿'use strict';

module.exports = function ($stateProvider, $urlRouterProvider, $httpProvider, $provide, kAppConfig) {


    $urlRouterProvider.otherwise(kAppConfig.routing.defaultUri);

    //add safeApply function for $rootScope - called by $scope.$root.safeApply(fn)
    $provide.decorator('$rootScope', function($delegate) {
            $delegate.safeApply = function(fn) {
                var phase = $delegate.$$phase;
                if (phase === '$apply' || phase === '$digest') {
                    if (fn && typeof fn === 'function') {
                        fn();
                    }
                } else {
                    $delegate.$apply(fn);
                }
            };
            return $delegate;
        }
    );

    $stateProvider.state('root', {
        url: '',
        abstract:true,
        template: '<div ui-view></div>'
    });

    /*$httpProvider.interceptors.push(function ($q, kAppConfig, $log) {
     return {
     'response': function (response) {

     if (response.config.url.indexOf(kAppConfig.server.apiUri) === 0) {
     if (response.data.error) {
     $log.warn('KAN API request resulted with error: "' + (response.data.error || '{empty}'));
     }
     }

     return response;
     }
     };
     });*/

};
