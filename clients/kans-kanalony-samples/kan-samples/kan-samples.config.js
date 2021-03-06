'use strict';

module.exports = function ($stateProvider) {
    $stateProvider.state('root.shell.samples', {
        url: '/samples',
        abstract:true,
        templateUrl: 'samples/kan-samples/partials/samples.html'
    });

    $stateProvider.state('root.shell.samples.charts', {
        url: '/charts',
        abstract:true,
        template: '<div ui-view></div>'
    });

    $stateProvider.state('root.shell.samples.maps', {
        url: '/maps',
        abstract:true,
        template: '<div ui-view></div>'
    });


    $stateProvider.state('root.shell.samples.maps.about', {
        url: '/about',
        templateUrl: 'samples/kan-samples/partials/maps/about.html'
    });

    $stateProvider.state('root.shell.samples.maps.map', {
        url: '/mapChart',
        templateUrl: 'samples/kan-samples/partials/maps/map.html',
        controller : 'kanMap',
        controllerAs : 'vm'
    });

    $stateProvider.state('root.shell.samples.charts.about', {
        url: '/about',
        templateUrl: 'samples/kan-samples/partials/charts/about.html'
    });


    $stateProvider.state('root.shell.samples.charts.lineChart', {
        url: '/lineChart',
        templateUrl: 'samples/kan-samples/partials/charts/line-chart.html',
        controller : 'kanLineChart',
        controllerAs : 'vm'
    });

    $stateProvider.state('root.shell.samples.charts.areaChart', {
        url: '/areaChart',
        templateUrl: 'samples/kan-samples/partials/charts/area-chart.html',
        controller : 'kanAreaChart',
        controllerAs : 'vm'
    });

    $stateProvider.state('root.shell.samples.charts.pieChart', {
        url: '/pieChart',
        templateUrl: 'samples/kan-samples/partials/charts/pie-chart.html',
        controller : 'kanPieChart',
        controllerAs : 'vm'
    });



    $stateProvider.state('root.shell.samples.charts.barChart', {
        url: '/barChart',
        templateUrl: 'samples/kan-samples/partials/charts/bar-chart.html',
        controller : 'kanBarChart',
        controllerAs : 'vm'
    });
};

