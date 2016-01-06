(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

require('angular');
var lodash = require('lodash');
window._ = lodash;

var $ = require('jquery');
window.jQuery = $;
window.$ = $;

var d3 = require('d3');
window.d3 = d3;

var moment = require('moment');
window.moment = moment;
require('nvd3');

//load src module
require('./kan-app');


},{"./kan-app":2,"angular":"angular","d3":"d3","jquery":"jquery","lodash":"lodash","moment":"moment","nvd3":"nvd3"}],2:[function(require,module,exports){
'use strict';

require('./kan-app-bootstrap');

var appModule = require('./kan-app.module');
appModule.config(require('./kan-app.config'));
appModule.run(require('./kan-app.run'));


},{"./kan-app-bootstrap":3,"./kan-app.config":4,"./kan-app.module":5,"./kan-app.run":6}],3:[function(require,module,exports){
'use strict';

$(document).ready(function () {

    var $html = $('html');

    angular.bootstrap($html, ['kanApp']);
});

},{}],4:[function(require,module,exports){
'use strict';

module.exports = function ($stateProvider, $urlRouterProvider, $httpProvider, $provide) {


    $urlRouterProvider.otherwise('/about');

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

    /*$httpProvider.interceptors.push(function ($q, kanAppConfig, $log) {
     return {
     'response': function (response) {

     if (response.config.url.indexOf(kanAppConfig.server.apiUri) === 0) {
     if (response.data.error) {
     $log.warn('KAN API request resulted with error: "' + (response.data.error || '{empty}'));
     }
     }

     return response;
     }
     };
     });*/

};

},{}],5:[function(require,module,exports){
'use strict';

require('angular-ui-router');
require('../kan-shell');
require('../kan-ui-charts');
require('../kan-samples');
require('angular-nvd3');
require('ui-bootstrap');

module.exports =angular.module('kanApp',['ui.router', 'kanShell','kanUICharts','kanSamples','nvd3','ui.bootstrap',]);

},{"../kan-samples":19,"../kan-shell":25,"../kan-ui-charts":29,"angular-nvd3":"angular-nvd3","angular-ui-router":"angular-ui-router","ui-bootstrap":"ui-bootstrap"}],6:[function(require,module,exports){
'use strict';

module.exports = function ($rootScope,$state) {

    $rootScope.$state = $state;
};

},{}],7:[function(require,module,exports){
'use strict';


var appModule = require('./kan-kaltura-api.module');
appModule.run(require('./kan-kaltura-api.run'));
appModule.config(require('./kan-kaltura-api.config'));


appModule.factory('SessionInfo',require('./services/kan-session-info.factory'));
appModule.factory('kanAPIFacade',require('./services/kan-api-facade.factory'));



},{"./kan-kaltura-api.config":8,"./kan-kaltura-api.module":9,"./kan-kaltura-api.run":10,"./services/kan-api-facade.factory":11,"./services/kan-session-info.factory":12}],8:[function(require,module,exports){
'use strict';

module.exports = function () {


};

},{}],9:[function(require,module,exports){
'use strict';

module.exports = angular.module('kanKalturaAPI',[]);

},{}],10:[function(require,module,exports){
'use strict';

module.exports = function () {

};

},{}],11:[function(require,module,exports){
'use strict';

module.exports = function ($http, $q, $location, SessionInfo,$httpParamSerializer) {
    var KApi = {};

    KApi.redirectToLoginOnInvalidKS = true;

    KApi.setRedirectOnInvalidKS = function setRedirectOnInvalidKS(value) {
        KApi.redirectToLoginOnInvalidKS = value;
    }

    KApi.IE = (!!window.ActiveXObject && +(/msie\s(\d+)/i.exec(navigator.userAgent)[1])) || NaN;


    KApi.getApiUrl = function getApiUrl() {
        return SessionInfo.service_url + "/api_v3/index.php";
    }


    /**
     * @param request 	request params
     * @returns	promise object
     */
    KApi.doRequest = function doRequest (request,options) {
        // Creating a deferred object
        var deferred = $q.defer();
        // add required params
        request.ks = SessionInfo.ks;
        var method = "post";
        var sParams;
        var params;
        if (KApi.IE < 10) {
            request['callback'] = 'JSON_CALLBACK';
            request['format'] = '9';
            params = request;
            method = 'jsonp';
        }
        else {
            params = {'format' : '1'};
            sParams = this.serializeParams(request);
        }

        // TODO - use options service=report&action=getGraphs
        var url = "https://www.kaltura.com/api_v3/index.php";
        if (options)
        {
            var qs = $httpParamSerializer(options);
            url = url + '?' + qs;
        }

        $http({
            data: sParams,
            url: url,
            method: method,
            params: params,
            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
        }).success(function (data, status) {
            if (KApi.redirectToLoginOnInvalidKS) {
                if (data.objectType === "KalturaAPIException") {
                    if (data.code == "INVALID_KS") {
                      // TODO
                        deferred.reject({errorId : 'invalid-ks', errorMessage : 'Invalid partner KS'});
                    }
                    else {
                        deferred.reject({ errorMessage : data.message});
                    }
                }
                else {
                    deferred.resolve({data : data});
                }
            }
            else {
                deferred.resolve({data : data});
            }
        }).error(function(data, status) {
            console.log(data);
            deferred.reject({ errorMessage : data.message});
        });

        // Returning the promise object
        return deferred.promise;
    };


    /**
     * format params as &key1=val1&key2=val2
     * @param params
     * @returns {String}
     */
    KApi.serializeParams = function serializeParams(params, parentKey) {
        var s = '';
        for (var key in params) {
            var value = params[key];

            if (s)
            {
                s += '&';
            }
            if (angular.isObject(value))
            {
                s += serializeParams(value,key);
            }else {
                if (parentKey)
                {
                    s +=  parentKey + ':' + key + '=' + value;

                }else
                {
                    s +=  key + '=' + value;

                }
            }
        }
        return s;
    };


    KApi.getExportHandlerUrl = function getExportHandlerUrl() {
        var url = $location.absUrl();
        url = url.substring(0, url.indexOf('#/'));
        url += "#/export/[id]/[ks]";
        return url;
    }

    return KApi;
};

},{}],12:[function(require,module,exports){
'use strict';

module.exports = function ($location) {
    var sessionInfo = {};
    sessionInfo.ks = '';
    sessionInfo.pid = '';
    sessionInfo.uiconfid = '';
    sessionInfo.map_urls = [
        'a.tile.openstreetmap.org/${z}/${x}/${y}.png',
        'b.tile.openstreetmap.org/${z}/${x}/${y}.png',
        'c.tile.openstreetmap.org/${z}/${x}/${y}.png'
    ];
    sessionInfo.map_zoom_levels = 10;

    sessionInfo.setKs = function setKs(value) {
        sessionInfo.ks = value;
    };
    sessionInfo.setPid = function setPid(value) {
        sessionInfo.pid = value;
    };
    sessionInfo.setUiconfId = function setUiconfId(value) {
        sessionInfo.uiconfid = value;
    };
    sessionInfo.setServiceUrl = function setServiceUrl(value) {
        sessionInfo.service_url = value;
    };
    sessionInfo.setMapUrls = function setMapUrls(value) {
        sessionInfo.map_urls = value;
    };
    sessionInfo.setMapZoomLevels = function setZoomLevels(value) {
        sessionInfo.map_zoom_levels = value;
    };


    try {
        var kmc = window.parent.kmc;
        if (kmc && kmc.vars) {
            if (kmc.vars.ks)
                sessionInfo.ks = kmc.vars.ks;
            if (kmc.vars.partner_id)
                sessionInfo.pid = kmc.vars.partner_id;
            if (kmc.vars.service_url)
                sessionInfo.service_url = kmc.vars.service_url;
            if (kmc.vars.liveanalytics) {
                sessionInfo.uiconfid = kmc.vars.liveanalytics.player_id;
                if (kmc.vars.liveanalytics.map_urls) {
                    sessionInfo.map_urls = kmc.vars.liveanalytics.map_urls;
                }
                if (kmc.vars.liveanalytics.map_zoom_levels) {
                    var n = parseInt(kmc.vars.liveanalytics.map_zoom_levels);
                    if (n > 0) {
                        sessionInfo.map_zoom_levels = n;
                    }
                }
            }


        }
    } catch (e) {
        console.log('Could not locate parent.kmc: ' + e);
    }

    /*     if (!sessionInfo.ks) { //navigate to login
     $location.path("/login");
     } */

    return sessionInfo;
};

},{}],13:[function(require,module,exports){
'use strict';

var _ = require('lodash');

module.exports = function (kanSamplesService) {
    var self = this;


    function clearChartsData() {
        _.each(self.samples, function (sample) {
            sample.data = null;
        });

        self.samplesDescription = '';

        refreshChartsLayout();
    }

    function refreshChartsLayout() {
        _.each(self.samples, function (sample) {
            sample.refresh();
        });

    }

    function loadData(context) {

        var origin = context.origin;

        clearChartsData();

        self.loadingData = true;

        kanSamplesService.getData(origin, 'areaChart').then(function (result) {
            self.samplesDescription = result.description;

            self.samples.sample1.data = result.data;

            refreshChartsLayout();

            self.errorMessage = '';
            self.loadingData = false;
        }, function (reason) {
            self.errorMessage = "Failed to load data : '" + reason.errorMessage + "'";
            self.loadingData = false;
        });
    }

    // this configuration will be used globally and in the future should be enforced on all charts
    self.config = {
        deepWatchOptions: false,
        refreshDataOnly: false
    };

    self.filters = {
        top10: false,
        demoServer: true
    };

    self.refreshChartsLayout = refreshChartsLayout;
    self.loadData = loadData;
    self.clearChartsData = clearChartsData;

    self.errorMessage = "";
    self.loadingData = false;

    self.samples =
    {
        sample1: {
            data: null,
            api: {}, /* this object will be modified by nvd3 directive to have invokation functions */
            viewData: {},
            refresh: function () {

                // run the refresh api of the actual nvd3 directive
                if (self.samples.sample1.api.refresh) {
                    self.samples.sample1.api.refresh();
                }
            },
            options: {
                chart: {
                    type: 'stackedAreaChart',
                    height: 450,
                    margin: {
                        top: 20,
                        right: 20,
                        bottom: 30,
                        left: 100
                    },
                    x: function (d) {
                        return d[0]
                    },
                    y: function (d) {
                        return d[1];
                    },
                    color: d3.scale.category10().range(),
                    useVoronoi: false,
                    clipEdge: true,
                    duration: 100,
                    useInteractiveGuideline: true,
                    xAxis: {
                        showMaxMin: false,
                        tickFormat: function (d) {
                            return d3.time.format('%x')(new Date(d))
                        }
                    },
                    yAxis: {
                        tickFormat: function (d) {
                            return d3.format(',.2f')(d);
                        }
                    }
                }

            }
        }
    };
};

},{"lodash":"lodash"}],14:[function(require,module,exports){
'use strict';

var _ = require('lodash');

module.exports = function (kanSamplesService, $q) {
    var self = this;


    function clearChartsData() {
        _.each(self.samples, function (sample) {
            sample.description = '';
            sample.data = null;
        });

        refreshChartsLayout();
    }

    function refreshChartsLayout() {
        _.each(self.samples, function (sample) {
            sample.refresh();
        });

    }

    function loadData(context) {

        var origin = context.origin;

        clearChartsData();
        self.loadingData = true;

        var promises = [];

        promises.push(kanSamplesService.getData(origin, 'barChart'));
        promises.push(kanSamplesService.getData(origin, 'barChartCompare', {take: 3}));


        $q.all(promises).then(function (results) {
            var request1 = results[0];
            var request2 = results[1];

            self.samples.sample1.description = request1.description;
            self.samples.sample1.data = request1.data;

            self.samples.sample2.description = request1.description;
            self.samples.sample2.data = [request1.data[0]];

            self.samples.sample3.description = request2.description;
            self.samples.sample3.data = request2.data;

            refreshChartsLayout();

            self.errorMessage = '';
            self.loadingData = false;
        }, function (reason) {
            self.errorMessage = "Failed to load data : '" + reason.errorMessage + "'";
            self.loadingData = false;
        });
    }

    // this configuration will be used globally and in the future should be enforced on all charts
    self.config = {
        deepWatchOptions: false,
        refreshDataOnly: false
    };

    self.filters = {
        top10: false,
        demoServer: true
    };

    self.refreshChartsLayout = refreshChartsLayout;
    self.loadData = loadData;
    self.clearChartsData = clearChartsData;

    self.errorMessage = "";
    self.loadingData = false;

    self.samples =
    {
        sample1: {
            data: null,
            api: {}, /* this object will be modified by nvd3 directive to have invokation functions */
            viewData: {},
            refresh: function () {

                // run the refresh api of the actual nvd3 directive
                if (self.samples.sample1.api.refresh) {
                    self.samples.sample1.api.refresh();
                }
            },
            options: {
                chart: {
                    type: 'multiBarHorizontalChart',
                    height: 450,
                    x: function (d) {
                        return d.label;
                    },
                    y: function (d) {
                        return d.value;
                    },
                    useInteractiveGuideline: true,
                    margin: {
                        top: 20,
                        right: 20,
                        bottom: 60,
                        left: 150
                    },
                    showControls: true,
                    showValues: true,
                    duration: 500,
                    xAxis: {
                        showMaxMin: false
                    },
                    yAxis: {
                        axisLabel: 'Values',
                        tickFormat: function (d) {
                            return d3.format(',.2f')(d);
                        },
                    }
                }

            }
        },
        sample2: {
            data: null,
            api: {}, /* this object will be modified by nvd3 directive to have invokation functions */
            viewData: {},
            refresh: function () {

                // run the refresh api of the actual nvd3 directive
                if (self.samples.sample2.api.refresh) {
                    self.samples.sample2.api.refresh();
                }
            },
            options: {
                chart: {
                    type: 'discreteBarChart',
                    height: 450,
                    margin: {
                        top: 20,
                        right: 20,
                        bottom: 50,
                        left: 50
                    },
                    staggerLabels: true,
                    rotateLabels: true,
                    x: function (d) {
                        return d.label;
                    },
                    y: function (d) {
                        return d.value;
                    },
                    showValues: true,
                    valueFormat: function (d) {
                        return d3.format(',.4f')(d);
                    },
                    duration: 500,
                    xAxis: {
                        axisLabel: 'Browsers'
                    },
                    yAxis: {
                        axisLabel: 'Total',
                        axisLabelDistance: 0,
                        showMaxMin: false
                    }
                }

            }
        },
        sample3: {
            data: null,
            api: {}, /* this object will be modified by nvd3 directive to have invokation functions */
            viewData: {},
            refresh: function () {

                // run the refresh api of the actual nvd3 directive
                if (self.samples.sample3.api.refresh) {
                    self.samples.sample3.api.refresh();
                }
            },
            options: {
                chart: {
                    type: 'multiBarHorizontalChart',
                    height: 450,
                    x: function (d) {
                        return d.label;
                    },
                    y: function (d) {
                        return d.value;
                    },
                    useInteractiveGuideline: true,
                    margin: {
                        top: 20,
                        right: 20,
                        bottom: 60,
                        left: 150
                    },
                    showControls: true,
                    showValues: true,
                    duration: 500,
                    xAxis: {
                        showMaxMin: false
                    },
                    yAxis: {
                        axisLabel: 'Values',
                        tickFormat: function (d) {
                            return d3.format(',.2f')(d);
                        },
                    }
                }

            }
        }
    };
};

},{"lodash":"lodash"}],15:[function(require,module,exports){
'use strict';

var _ = require('lodash');

module.exports = function (kanSamplesService) {
    var self = this;



    function clearChartsData()
    {
        _.each(self.samples,function(sample)
        {
            sample.data = null;
        });

        self.samplesDescription = '';

        refreshChartsLayout();
    }

    function refreshChartsLayout()
    {
        _.each(self.samples,function(sample)
        {
            sample.refresh();
        });

    }

    function loadData(context) {

        var origin = context.origin;

        clearChartsData();

        self.loadingData = true;

        kanSamplesService.getData(origin,'lineChart').then(function(result)
            {
                self.samplesDescription = result.description;

                self.samples.sample1.data = result.data;

                var yAxisIndex = result.data.length > 1 ? Math.round(result.data.length / 2) : null;

                self.samples.sample2.data = _.map(result.data, function (item, index) {
                    var yAxisValue = yAxisIndex ? (index + 1 <= yAxisIndex ? 1 : 2) : 1;
                    return {
                        key: item.key,
                        type: 'line',
                        yAxis: yAxisValue,
                        values: item.values
                    };
                });
                self.samples.sample3.data = result.data;

                refreshChartsLayout();

                self.errorMessage = '';
                self.loadingData = false;
            },function(reason)
            {
                self.errorMessage = "Failed to load data : '" + reason.errorMessage + "'";
                self.loadingData = false;
            });

    }

    // this configuration will be used globally and in the future should be enforced on all charts
    self.config = {
        deepWatchOptions: false,
        refreshDataOnly: false
    };

    self.filters = {
        top10: false,
        demoServer : true
    };

    self.refreshChartsLayout = refreshChartsLayout;
    self.loadData = loadData;
    self.clearChartsData = clearChartsData;

    self.errorMessage = "";
    self.loadingData = false;

    self.samples =
    {
        sample1: {
            data: null,
            api: {}, /* this object will be modified by nvd3 directive to have invokation functions */
            viewData: {
                showViewFinder: true
            },
            refresh: function () {
                var chartType = self.samples.sample1.viewData.showViewFinder ? 'lineWithFocusChart' : 'lineChart';
                self.samples.sample1.options.chart.type = chartType;

                // run the refresh api of the actual nvd3 directive
                if (self.samples.sample1.api.refresh) {
                    self.samples.sample1.api.refresh();
                }
            },
            options: {
                chart: {
                    type: '',
                    height: 450,
                    margin: {
                        top: 20,
                        right: 20,
                        bottom: 60,
                        left: 55
                    },
                    useInteractiveGuideline: true,
                    transitionDuration: 500,
                    color: d3.scale.category10().range(),
                    /* Configure chart axis */
                    xAxis: {
                        axisLabel: 'Time',
                        tickFormat: function (d) {
                            return d3.time.format('%b %d')(new Date(d));
                        }
                    },
                    yAxis: {
                        axisLabel: 'Total',
                        tickFormat: function (d) {
                            return d3.format(',.1')(d);
                        }
                    },
                    /* Configure view finder axis */
                    x2Axis: {
                        axisLabel: 'Time',
                        tickFormat: function (d) {
                            return d3.time.format('%b %d')(new Date(d));
                        }
                    },
                    y2Axis: {
                        axisLabel: 'Total',
                        tickFormat: function (d) {
                            return d3.format(',.1')(d);
                        }
                    }
                }

            }
        },
        sample2: {
            data: null,
            api: {}, /* this object will be modified by nvd3 directive to have invokation functions */
            refresh: function () {
                // run the refresh api of the actual nvd3 directive
                if (self.samples.sample2.api.refresh) {
                    self.samples.sample2.api.refresh();
                }
            },
            options: {
                chart: {
                    type: 'multiChart',
                    height: 450,
                    margin: {
                        top: 30,
                        right: 60,
                        bottom: 50,
                        left: 70
                    },
                    useInteractiveGuideline: true,
                    color: d3.scale.category10().range(),
                    //useInteractiveGuideline: true,
                    transitionDuration: 500,
                    xAxis: {
                        axisLabel: 'Time',
                        tickFormat: function (d) {
                            return d3.time.format('%b %d')(new Date(d));
                        }
                    },
                    yAxis: {
                        axisLabel: 'Total',
                        tickFormat: function (d) {
                            return d3.format(',.0')(d);
                        }
                    },
                    yAxis2: {
                        axisLabel: 'Total 2',
                        tickFormat: function (d) {
                            return d3.format(',.0')(d);
                        }
                    }
                }

            }
        },
        sample3: {
            data: null,
            api: {}, /* this object will be modified by nvd3 directive to have invokation functions */
            refresh: function () {
                // run the refresh api of the actual nvd3 directive
                if (self.samples.sample3.api.refresh) {
                    self.samples.sample3.api.refresh();
                }
            },
            options: {
                chart: {
                    type: 'cumulativeLineChart',
                    height: 450,
                    margin: {
                        top: 30,
                        right: 60,
                        bottom: 50,
                        left: 70
                    },
                    showControls: false, // show/hide additional controls which are context oriented
                    useInteractiveGuideline: true,
                    y: function (d) {
                        return d.y / 100;
                    },
                    color: d3.scale.category10().range(),
                    //useInteractiveGuideline: true,
                    transitionDuration: 500,
                    xAxis: {
                        axisLabel: 'Time',
                        tickFormat: function (d) {
                            return d3.time.format('%b %d')(new Date(d));
                        }
                    },
                    yAxis: {
                        axisLabel: 'Total',
                        tickFormat: d3.format(',.1%')
                    }
                }

            }
        }
    };
};

},{"lodash":"lodash"}],16:[function(require,module,exports){
'use strict';

var _ = require('lodash');

module.exports = function (kanSamplesService) {
    var self = this;




};

},{"lodash":"lodash"}],17:[function(require,module,exports){
'use strict';

var _ = require('lodash');

module.exports = function (kanSamplesService) {
    var self = this;



    function clearChartsData()
    {
        _.each(self.samples,function(sample)
        {
            sample.data = null;
        });

        self.samplesDescription = '';

        refreshChartsLayout();
    }

    function refreshChartsLayout()
    {
        _.each(self.samples,function(sample)
        {
            sample.refresh();
        });

    }

    function loadData(context) {

        var origin = context.origin;
        clearChartsData();
        self.loadingData = true;

        kanSamplesService.getData(origin,'pieChart',{take : 5}).then(function(result)
            {
                self.samplesDescription = result.description;

                self.samples.sample1.data = result.data[0].values;

                refreshChartsLayout();

                self.errorMessage = '';
                self.loadingData = false;
            },function(reason)
            {
                self.errorMessage = "Failed to load data : '" + reason.errorMessage + "'";
                self.loadingData = false;
            });

    }

    // this configuration will be used globally and in the future should be enforced on all charts
    self.config = {
        deepWatchOptions: false,
        refreshDataOnly: false
    };

    self.filters = {
        top10: false,
        demoServer : true
    };

    self.refreshChartsLayout = refreshChartsLayout;
    self.loadData = loadData;
    self.clearChartsData = clearChartsData;

    self.errorMessage = "";
    self.loadingData = false;

    self.samples =
    {
        sample1: {
            data: null,
            api: {}, /* this object will be modified by nvd3 directive to have invokation functions */
            viewData: {
            },
            refresh: function () {

                // run the refresh api of the actual nvd3 directive
                if (self.samples.sample1.api.refresh) {
                    self.samples.sample1.api.refresh();
                }
            },
            options: {
                chart: {
                    type: 'pieChart',
                    height: 500,
                    x: function(d){return d.label;},
                    y: function(d){return d.value;},
                    color: d3.scale.category10().range(),

                    showLabels: true,
                    duration: 500,
                    labelThreshold: 0.01,
                    labelSunbeamLayout: true,
                    legend: {
                        margin: {
                            top: 5,
                            right: 35,
                            bottom: 5,
                            left: 0
                        }
                    }
                }

            }
        }
    };
};

},{"lodash":"lodash"}],18:[function(require,module,exports){
'use strict';


module.exports = function (SessionInfo) {
    function Controller() {
        var self = this;

        function submit(origin) {

            self.error = '';

            if (origin === 'live') {
                if (!self.data.ks) {
                    self.error = 'Missing partner KS value';
                    return;
                }

                SessionInfo.setKs(self.data.ks);
            }

            self.loadData({context: {origin: origin}});
        }

        self.dataFormType = 'live';
        self.data = {ks: SessionInfo.ks};
        self.submit = submit;

    }


    function Link(scope, element, attrs, ctrl) {

    }


    return {
        restrict: 'A',
        scope: {
            loadData: '&kLoadData'
        },
        templateUrl: 'kan-samples/directives/kan-sample-data-loader.html',
        controller: Controller,
        controllerAs: 'vm',
        bindToController: true,
        link: Link
    }


};

},{}],19:[function(require,module,exports){
'use strict';

var appModule = require('./kan-samples.module');
appModule.config(require('./kan-samples.config'));
appModule.run(require('./kan-samples.run'));

appModule.controller('kanLineChart',require('./controllers/charts/kan-line-chart'));
appModule.controller('kanBarChart',require('./controllers/charts/kan-bar-chart'));
appModule.controller('kanAreaChart',require('./controllers/charts/kan-area-chart'));
appModule.controller('kanMapChart',require('./controllers/charts/kan-map-chart'));
appModule.controller('kanPieChart',require('./controllers/charts/kan-pie-chart'));

appModule.service('kanSamplesService',require('./services/kan-samples-data.service'));

appModule.directive('kanSampleDataLoader',require('./directives/kan-sample-data-loader'));


},{"./controllers/charts/kan-area-chart":13,"./controllers/charts/kan-bar-chart":14,"./controllers/charts/kan-line-chart":15,"./controllers/charts/kan-map-chart":16,"./controllers/charts/kan-pie-chart":17,"./directives/kan-sample-data-loader":18,"./kan-samples.config":20,"./kan-samples.module":21,"./kan-samples.run":22,"./services/kan-samples-data.service":24}],20:[function(require,module,exports){
'use strict';

module.exports = function ($stateProvider) {
    $stateProvider.state('root.shell.samples', {
        url: '/samples',
        abstract:true,
        templateUrl: 'kan-samples/partials/samples.html'
    });

    $stateProvider.state('root.shell.samples.charts', {
        url: '/charts',
        abstract:true,
        template: '<div ui-view></div>'
    });


    $stateProvider.state('root.shell.samples.charts.about', {
        url: '/about',
        templateUrl: 'kan-samples/partials/charts/about.html'
    });


    $stateProvider.state('root.shell.samples.charts.lineChart', {
        url: '/lineChart',
        templateUrl: 'kan-samples/partials/charts/line-chart.html',
        controller : 'kanLineChart',
        controllerAs : 'vm'
    });

    $stateProvider.state('root.shell.samples.charts.areaChart', {
        url: '/areaChart',
        templateUrl: 'kan-samples/partials/charts/area-chart.html',
        controller : 'kanAreaChart',
        controllerAs : 'vm'
    });

    $stateProvider.state('root.shell.samples.charts.pieChart', {
        url: '/pieChart',
        templateUrl: 'kan-samples/partials/charts/pie-chart.html',
        controller : 'kanPieChart',
        controllerAs : 'vm'
    });

    $stateProvider.state('root.shell.samples.charts.mapChart', {
        url: '/mapChart',
        templateUrl: 'kan-samples/partials/charts/map-chart.html',
        controller : 'kanMapChart',
        controllerAs : 'vm'
    });

    $stateProvider.state('root.shell.samples.charts.barChart', {
        url: '/barChart',
        templateUrl: 'kan-samples/partials/charts/bar-chart.html',
        controller : 'kanBarChart',
        controllerAs : 'vm'
    });
};


},{}],21:[function(require,module,exports){
'use strict';

require('../kan-ui-maps');
require('../kan-kaltura-api');

module.exports = angular.module('kanSamples',['kanUIMaps','kanKalturaAPI']);

},{"../kan-kaltura-api":7,"../kan-ui-maps":34}],22:[function(require,module,exports){
arguments[4][8][0].apply(exports,arguments)
},{"dup":8}],23:[function(require,module,exports){
var storage = {
    'barChart': {
        description: 'Report: Content Reports > Content Drop-off\nFilter: from 01/12/2015 - 01/01/2016',
        data: [{
            "id": "content_dropoff",
            "data": "count_plays,392356;count_plays_25,304802;count_plays_50,287516;count_plays_75,273269;count_plays_100,252204;play_through_ratio,0.6428;",
            "objectType": "KalturaReportGraph"
        }]
    }, 'barChartCompare': {
        description: 'Report: Content Reports > Content Drop-off comparison of 3 entries\nFilter: from 01/12/2015 - 01/01/2016',
        data: [{
            "key": "Five retention reducers",
            "values": [{"label": "count_plays", "value": 493}, {
                "label": "count_plays_25",
                "value": 423
            }, {"label": "count_plays_50", "value": 419}, {
                "label": "count_plays_75",
                "value": 414
            }, {"label": "count_plays_100", "value": 405}]
        }, {
            "key": "Working with  using  and minimizing the ribbon",
            "values": [{"label": "count_plays", "value": 145}, {
                "label": "count_plays_25",
                "value": 123
            }, {"label": "count_plays_50", "value": 120}, {
                "label": "count_plays_75",
                "value": 114
            }, {"label": "count_plays_100", "value": 102}]
        }, {
            "key": "Adjusting spacing",
            "values": [{"label": "count_plays", "value": 128}, {
                "label": "count_plays_25",
                "value": 102
            }, {"label": "count_plays_50", "value": 90}, {
                "label": "count_plays_75",
                "value": 70
            }, {"label": "count_plays_100", "value": 61}]
        }]
    }

    ,
    'lineChart': {
        description: 'Report: Content Reports > Top Content\nMatrics: "Play","Minutes Viewed","Player impression"\nDimension: "Time"\nFilter: from 01/12/2015 - 01/01/2016',
        data: [{
            "id": "count_plays",
            "data": "20151206,7547;20151207,19798;20151208,20952;20151209,20235;20151210,18483;20151211,15939;20151212,6551;20151213,8141;20151214,20713;20151215,23833;20151216,18796;20151217,16575;20151218,14394;20151219,3292;20151220,3365;20151221,9351;20151222,9292;20151223,6960;20151224,2536;20151225,1432;20151226,2908;20151227,3592;20151228,9357;20151229,10756;20151230,10916;20151231,7376;20160101,4372;",
            "objectType": "KalturaReportGraph"
        }, {
            "id": "sum_time_viewed",
            "data": "20151206,10087.390;20151207,24706.067;20151208,27953.829;20151209,28227.549;20151210,26662.081;20151211,22590.403;20151212,10059.161;20151213,12209.863;20151214,28636.381;20151215,29850.094;20151216,27070.965;20151217,24417.511;20151218,21114.241;20151219,5208.618;20151220,4718.457;20151221,13166.327;20151222,13449.060;20151223,9884.208;20151224,3631.176;20151225,1961.250;20151226,4632.037;20151227,4769.126;20151228,14830.125;20151229,17105.938;20151230,18076.524;20151231,12936.632;20160101,7427.503;",
            "objectType": "KalturaReportGraph"
        }, {
            "id": "count_loads",
            "data": "20151206,8129;20151207,21353;20151208,22802;20151209,22073;20151210,20175;20151211,17311;20151212,7214;20151213,8804;20151214,22439;20151215,26029;20151216,20321;20151217,18214;20151218,15542;20151219,3691;20151220,3678;20151221,10223;20151222,10199;20151223,7494;20151224,2999;20151225,1811;20151226,3279;20151227,3986;20151228,10023;20151229,11486;20151230,11657;20151231,7965;20160101,4853;",
            "objectType": "KalturaReportGraph"
        }]
    },
    'areaChart': {
        description: 'Report: Content Reports > Top Content\nMatrics: "Play","Minutes Viewed","Player impression"\nDimension: "Time"\nFilter: from 01/12/2015 - 01/01/2016',
        data: [{
            "id": "count_plays",
            "data": "20151201,25146;20151202,23720;20151203,19717;20151204,20153;20151205,6158;20151206,7547;20151207,19798;20151208,20952;20151209,20235;20151210,18483;20151211,15939;20151212,6551;20151213,8141;20151214,20713;20151215,23833;20151216,18796;20151217,16575;20151218,14394;20151219,3292;20151220,3365;20151221,9351;20151222,9292;20151223,6960;20151224,2536;20151225,1432;20151226,2908;20151227,3592;20151228,9357;20151229,10756;20151230,10916;20151231,7376;20160101,4372;",
            "objectType": "KalturaReportGraph"
        }, {
            "id": "sum_time_viewed",
            "data": "20151201,30442.449;20151202,29358.450;20151203,26372.773;20151204,25105.553;20151205,8676.671;20151206,10087.390;20151207,24706.067;20151208,27953.829;20151209,28227.549;20151210,26662.081;20151211,22590.403;20151212,10059.161;20151213,12209.863;20151214,28636.381;20151215,29850.094;20151216,27070.965;20151217,24417.511;20151218,21114.241;20151219,5208.618;20151220,4718.457;20151221,13166.327;20151222,13449.060;20151223,9884.208;20151224,3631.176;20151225,1961.250;20151226,4632.037;20151227,4769.126;20151228,14830.125;20151229,17105.938;20151230,18076.524;20151231,12936.632;20160101,7427.503;",
            "objectType": "KalturaReportGraph"
        }, {
            "id": "count_loads",
            "data": "20151201,27497;20151202,25818;20151203,21407;20151204,21866;20151205,6637;20151206,8129;20151207,21353;20151208,22802;20151209,22073;20151210,20175;20151211,17311;20151212,7214;20151213,8804;20151214,22439;20151215,26029;20151216,20321;20151217,18214;20151218,15542;20151219,3691;20151220,3678;20151221,10223;20151222,10199;20151223,7494;20151224,2999;20151225,1811;20151226,3279;20151227,3986;20151228,10023;20151229,11486;20151230,11657;20151231,7965;20160101,4853;",
            "objectType": "KalturaReportGraph"
        }]
    },
    'pieChart': {
        description : 'Report: System Reports > Operating Systems (comparison of 5 operating systems)\nFilter: from 01/12/2015 - 01/01/2016',
data: [
            {
                "id": "count_plays",
                "data": "APPLE_WEB_KIT,41492;BLACKBERRY10,11;BOT,0;CHROME,13653;CHROME11,13;CHROME12,1;CHROME18,16;CHROME19,1;CHROME22,129;CHROME23,8;CHROME25,34;CHROME26,19;CHROME27,2;CHROME28,31;CHROME29,5;CHROME30,421;CHROME31,34;CHROME32,11;CHROME33,146;CHROME34,54;CHROME35,51;CHROME36,19;CHROME37,14;CHROME38,453;CHROME39,80;CHROME40,72;CHROME41,130;CHROME42,113;CHROME43,152;CHROME44,189;CHROME45,292;CHROME46,16495;CHROME_MOBILE,16560;COAST,4;EDGE,1076;EDGE12,2250;EDGE_MOBILE12,168;FIREFOX10,4;FIREFOX12,2;FIREFOX13,3;FIREFOX15,6;FIREFOX16,23;FIREFOX17,0;FIREFOX20,2;FIREFOX22,1;FIREFOX23,0;FIREFOX24,2;FIREFOX26,2;FIREFOX27,1;FIREFOX28,2;FIREFOX29,23;FIREFOX30,4;FIREFOX31,12;FIREFOX32,8;FIREFOX33,8;FIREFOX34,0;FIREFOX35,8;FIREFOX36,28;FIREFOX37,6;FIREFOX38,105;FIREFOX39,50;FIREFOX4,1469;FIREFOX40,61;FIREFOX41,221;FIREFOX42,5082;FIREFOX_MOBILE,92;IE,6;IE10,509;IE11,17572;IE7,170;IE8,31;IE9,296;IEMOBILE10,67;IEMOBILE11,1183;IEMOBILE9,37;MOBILE_SAFARI,27522;MOZILLA,2;OPERA,308;OPERA12,11;OPERA24,2;OPERA29,2;OPERA30,0;OPERA_MINI,0;OPERA_MOBILE,44;SAFARI,5948;SAFARI4,630;SAFARI5,134;SAFARI6,452;SAFARI7,378;SAFARI8,1304;UNKNOWN,11;",
                "objectType": "KalturaReportGraph"
            },
            {
                "id": "sum_time_viewed",
                "data": "APPLE_WEB_KIT,73843.096;BLACKBERRY10,23.028;BOT,0.000;CHROME,30006.693;CHROME11,1.726;CHROME12,0.283;CHROME18,10.350;CHROME19,1.100;CHROME22,192.413;CHROME23,28.095;CHROME25,180.124;CHROME26,20.334;CHROME27,1.017;CHROME28,58.509;CHROME29,14.758;CHROME30,730.560;CHROME31,82.501;CHROME32,8.875;CHROME33,196.829;CHROME34,109.270;CHROME35,121.390;CHROME36,22.971;CHROME37,44.924;CHROME38,762.292;CHROME39,105.490;CHROME40,94.280;CHROME41,311.974;CHROME42,132.328;CHROME43,463.462;CHROME44,455.634;CHROME45,557.236;CHROME46,37153.147;CHROME_MOBILE,30129.095;COAST,4.133;EDGE,2744.363;EDGE12,5018.998;EDGE_MOBILE12,72.525;FIREFOX10,41.266;FIREFOX12,0.825;FIREFOX13,10.983;FIREFOX15,7.633;FIREFOX16,49.135;FIREFOX17,0.000;FIREFOX20,2.233;FIREFOX22,0.000;FIREFOX23,0.000;FIREFOX24,2.517;FIREFOX26,1.779;FIREFOX27,0.317;FIREFOX28,0.000;FIREFOX29,32.074;FIREFOX30,4.292;FIREFOX31,20.615;FIREFOX32,25.092;FIREFOX33,14.095;FIREFOX34,0.000;FIREFOX35,3.979;FIREFOX36,136.642;FIREFOX37,23.284;FIREFOX38,255.076;FIREFOX39,74.179;FIREFOX4,3200.584;FIREFOX40,130.467;FIREFOX41,508.979;FIREFOX42,11131.581;FIREFOX_MOBILE,98.213;IE,2.000;IE10,892.624;IE11,37483.109;IE7,398.897;IE8,52.196;IE9,595.700;IEMOBILE10,13.883;IEMOBILE11,1857.337;IEMOBILE9,1.717;MOBILE_SAFARI,58994.711;MOZILLA,0.725;OPERA,596.981;OPERA12,56.609;OPERA24,7.075;OPERA29,2.017;OPERA30,0.000;OPERA_MINI,0.000;OPERA_MOBILE,148.148;SAFARI,14210.711;SAFARI4,952.727;SAFARI5,284.431;SAFARI6,1539.244;SAFARI7,844.590;SAFARI8,3539.068;UNKNOWN,28.425;",
                "objectType": "KalturaReportGraph"
            },
            {
                "id": "avg_time_viewed",
                "data": "APPLE_WEB_KIT,1.7796948;BLACKBERRY10,2.0934545;BOT,0.0000000;CHROME,2.1978095;CHROME11,0.1327692;CHROME12,0.2830000;CHROME18,0.6468750;CHROME19,1.1000000;CHROME22,1.4915736;CHROME23,3.5118750;CHROME25,5.2977647;CHROME26,1.0702105;CHROME27,0.5085000;CHROME28,1.8873871;CHROME29,2.9516000;CHROME30,1.7352969;CHROME31,2.4265000;CHROME32,0.8068182;CHROME33,1.3481438;CHROME34,2.0235185;CHROME35,2.3801961;CHROME36,1.2090000;CHROME37,3.2088571;CHROME38,1.6827638;CHROME39,1.3186250;CHROME40,1.3094444;CHROME41,2.3998000;CHROME42,1.1710442;CHROME43,3.0490921;CHROME44,2.4107619;CHROME45,1.9083425;CHROME46,2.2523884;CHROME_MOBILE,1.8193898;COAST,1.0332500;EDGE,2.5505232;EDGE12,2.2306658;EDGE_MOBILE12,0.4316964;FIREFOX10,10.3165000;FIREFOX12,0.4125000;FIREFOX13,3.6610000;FIREFOX15,1.2721667;FIREFOX16,2.1363043;FIREFOX17,0.0000000;FIREFOX20,1.1165000;FIREFOX22,0.0000000;FIREFOX23,0.0000000;FIREFOX24,1.2585000;FIREFOX26,0.8895000;FIREFOX27,0.3170000;FIREFOX28,0.0000000;FIREFOX29,1.3945217;FIREFOX30,1.0730000;FIREFOX31,1.7179167;FIREFOX32,3.1365000;FIREFOX33,1.7618750;FIREFOX34,0.0000000;FIREFOX35,0.4973750;FIREFOX36,4.8800714;FIREFOX37,3.8806667;FIREFOX38,2.4292952;FIREFOX39,1.4835800;FIREFOX4,2.1787502;FIREFOX40,2.1388033;FIREFOX41,2.3030724;FIREFOX42,2.1903937;FIREFOX_MOBILE,1.0675326;IE,0.3333333;IE10,1.7536817;IE11,2.1331157;IE7,2.3464529;IE8,1.6837419;IE9,2.0125000;IEMOBILE10,0.2072090;IEMOBILE11,1.5700228;IEMOBILE9,0.0464054;MOBILE_SAFARI,2.1435474;MOZILLA,0.3625000;OPERA,1.9382500;OPERA12,5.1462727;OPERA24,3.5375000;OPERA29,1.0085000;OPERA30,0.0000000;OPERA_MINI,0.0000000;OPERA_MOBILE,3.3670000;SAFARI,2.3891579;SAFARI4,1.5122651;SAFARI5,2.1226194;SAFARI6,3.4054071;SAFARI7,2.2343651;SAFARI8,2.7140092;UNKNOWN,2.5840909;",
                "objectType": "KalturaReportGraph"
            },
            {
                "id": "count_loads",
                "data": "APPLE_WEB_KIT,48261;BLACKBERRY10,16;BOT,1019;CHROME,17682;CHROME11,20;CHROME12,3;CHROME18,21;CHROME19,1;CHROME22,130;CHROME23,8;CHROME25,34;CHROME26,19;CHROME27,7;CHROME28,61;CHROME29,5;CHROME30,474;CHROME31,38;CHROME32,47;CHROME33,176;CHROME34,79;CHROME35,58;CHROME36,20;CHROME37,17;CHROME38,526;CHROME39,86;CHROME40,177;CHROME41,161;CHROME42,116;CHROME43,204;CHROME44,229;CHROME45,321;CHROME46,19584;CHROME_MOBILE,19966;COAST,4;EDGE,1400;EDGE12,2600;EDGE_MOBILE12,181;FIREFOX10,4;FIREFOX12,2;FIREFOX13,3;FIREFOX15,6;FIREFOX16,25;FIREFOX17,3;FIREFOX20,2;FIREFOX22,1;FIREFOX23,6;FIREFOX24,5;FIREFOX26,3;FIREFOX27,1;FIREFOX28,3;FIREFOX29,24;FIREFOX30,5;FIREFOX31,19;FIREFOX32,8;FIREFOX33,9;FIREFOX34,1;FIREFOX35,8;FIREFOX36,38;FIREFOX37,14;FIREFOX38,125;FIREFOX39,55;FIREFOX4,1871;FIREFOX40,73;FIREFOX41,253;FIREFOX42,6346;FIREFOX_MOBILE,223;IE,6;IE10,790;IE11,21583;IE7,169;IE8,57;IE9,460;IEMOBILE10,86;IEMOBILE11,1441;IEMOBILE9,49;MOBILE_SAFARI,37748;MOZILLA,9;OPERA,362;OPERA12,11;OPERA24,2;OPERA29,2;OPERA30,3;OPERA_MINI,1;OPERA_MOBILE,55;SAFARI,7123;SAFARI4,838;SAFARI5,162;SAFARI6,655;SAFARI7,511;SAFARI8,1541;UNKNOWN,27;",
                "objectType": "KalturaReportGraph"
            }

        ]
    }


}


module.exports = {
    get: function (key) {
        switch (key) {
            case '':
            default:
                break;
        }
        return storage[key];
    }

}

},{}],24:[function(require,module,exports){
var storage = require('../scripts/kan-samples-repository');

module.exports = function ($http, $q, kanAPIFacade) {

    var self = this;

    function getAPIDataConfiguration(key, clone) {
        var configuration = null;

        switch (key) {
            case 'dateNumberArray':
            {
                configuration = {
                    itemType: 'array',
                    keyType: 'date',
                    keyFormat: 'YYYYMMDD',
                    valueType: 'number',
                    valueFormat: ''
                };
                break;
            }
            case 'dateNumberMultiSeries':
                configuration = {
                    itemType: 'object',
                    keyName: 'x',
                    keyType: 'date',
                    keyFormat: 'YYYYMMDD',
                    valueName: 'y',
                    valueType: 'number',
                    valueFormat: ''
                };
                break;
            case 'labelNumberMultiSeries':
                configuration = {
                    itemType: 'object',
                    keyName: 'label',
                    keyType: 'text',
                    keyFormat: '',
                    valueName: 'value',
                    valueType: 'number',
                    valueFormat: ''
                };
                break;
            default:
                break;
        }

        return clone ? $.extend(true, {}, configuration) : configuration;
    }


    function parseAPIToken(value, valueType, options) {
        var result = null;

        switch (valueType) {
            case 'date':
                result = moment(value, options.format || 'YYYYMMDD').toDate();
                break;
            case 'number':
                result = parseFloat(value);
                break;
            default:
                result = value;
                break;
        }

        return result;
    }


    function convertAPIDataToKeyValueArray(data, configuration, filters) {
        var filters = $.extend({}, {take: null}, filters);
        configuration = angular.isString(configuration) ? getAPIDataConfiguration(configuration) : configuration;
        var result = null;

        if (angular.isDefined(configuration) && configuration !== null) {
            var parsedResult = _.chain(data).words(/[^;]+/g).map(function (item) {


                var token = item.split(',');
                var key = parseAPIToken(token[0], configuration.keyType, {format: configuration.keyFormat});
                var value = parseAPIToken(token[1], configuration.valueType, {format: configuration.valueFormat});

                var result = null;
                if (configuration.itemType === 'array') {
                    result = [key, value];
                } else {
                    result = {};
                    result[configuration.keyName] = key;
                    result[configuration.valueName] = value;
                }

                return result;
            });

            if (filters.take) {
                parsedResult = parsedResult.sortByOrder([configuration.valueName], ['desc']).take(filters.take);
            }

            result = parsedResult.value();
        }

        return result;
    }

    function parseResponse(requestType, responseData, filters) {
        var result = null;
        switch (requestType) {
            case 'areaChart':
                result = _.map(responseData, function (item) {
                    return {key: item.id, values: convertAPIDataToKeyValueArray(item.data, 'dateNumberArray', filters)};
                });
                break;
            case 'lineChart':
                result = _.map(responseData, function (item) {
                    return {
                        key: item.id,
                        values: convertAPIDataToKeyValueArray(item.data, 'dateNumberMultiSeries', filters)
                    };
                });
                break;
            case 'barChart':
                result = _.map(responseData, function (item) {
                    return {
                        key: item.id,
                        values: convertAPIDataToKeyValueArray(item.data, 'labelNumberMultiSeries', filters)
                    };
                });
                break;
            case 'barChartCompare':
                result = responseData;
                break;
            case 'pieChart':
                result = _.map(responseData, function (item) {
                    return {
                        key: item.id,
                        values: convertAPIDataToKeyValueArray(item.data, 'labelNumberMultiSeries', filters)
                    };
                });
                break;
            default:
                break;
        }

        return result;
    }

    function getDemoData(requestType, filters) {
        var serverData = storage.get(requestType);

        if (serverData) {
            var resultData = parseResponse(requestType, serverData.data, filters);

            return $q.resolve({description: 'Recorded request\n' + serverData.description, data: resultData});
        }else
        {
            return $q.reject({errorMessage : 'invalid request'});
        }
    }

    function getLiveData(requestType, filters) {
        var requestParams = {};
        var description = 'Live request\n';

        switch (requestType) {
            case 'barChart':
                requestParams = {
                    reportType: '2',
                    reportInputFilter: {fromDay: '20151201', toDay: '20160101'}
                };
                description += 'Report: Content Reports > Content Drop-off\nFilter: from 01/12/2015 - 01/01/2016';
                break;
            case 'lineChart':
                requestParams = {
                    reportType: '1',
                    reportInputFilter: {fromDay: '20151201', toDay: '20160101'}
                };
                description += 'Report: Content Reports > Top Content\nMatrics: (determined by response)\nDimension: "Time"\nFilter: from 01/12/2015 - 01/01/2016';
                break;
            case 'areaChart':
                requestParams = {
                    reportType: '1',
                    reportInputFilter: {fromDay: '20151201', toDay: '20160101'}
                };
                description += 'Report: Content Reports > Top Content\nMatrics: (determined by response)\nDimension: "Time"\nFilter: from 01/12/2015 - 01/01/2016';
                break;
            case 'pieChart':
                requestParams = {
                    reportType: '22',
                    reportInputFilter: {fromDay: '20151201', toDay: '20160101'}
                };
                description += 'Report: System Reports > Platforms (comparison of 5 platforms)\nFilter: from 01/12/2015 - 01/01/2016';
                break
            default:
                break;
        }

        return kanAPIFacade.doRequest(requestParams, {service: 'report', action: "getGraphs"}).then(function (result) {
            var resultData = parseResponse(requestType, result.data, filters);
            return $q.resolve({ description : description, data: resultData})
        });
    }

    function getLiveBarChartCompare()
    {
        var deferred = $q.defer();

        var tableRequestParams = {
            reportType: '2',
            pager : {pageIndex : 1, pageSize : 25},
            reportInputFilter: {fromDay: '20151201', toDay: '20160101'}
        };

         kanAPIFacade.doRequest(tableRequestParams, {service: 'report', action: "getTable"}).then(function (result) {
             var resultData = result.data;
             var data = _.map(_.words(resultData.data,/[^;]+/g),function(item)
             {
                 return  _.zipObject(_.words(resultData.header,/[^,]+/g), _.map(_.words(item,/[^,]+/g),function(item) { return /^[0-9]+$/.test(item) ? parseFloat(item) : item;}));
             });

             var filteredData = _.chain(data).sortByOrder(['count_plays'], ['desc']).take(3).map(function(item) {
                 var values = [];
                 _.forEach(item,function(value,key)
                 {
                     if (key.indexOf('count') === 0)
                     {
                         values.push({label : key, value : value});
                     }

                 });
                return {key : item['entry_name'],values : values}
             }).value();
             deferred.resolve({
                 description: 'Report: Content Reports > Content Drop-off (comparison of 3 entries)',
                 data : filteredData});
        });

        return deferred.promise;
    }

    function getData(origin, requestType, filters) {
        if (origin === 'live') {
            if (requestType === 'barChartCompare')
            {
                return getLiveBarChartCompare();
            }else {
                return getLiveData(requestType, filters);
            }
        } else {

            return getDemoData(requestType, filters);
        }
    }

    self.getData = getData;
    self.getDemoData = getDemoData;
}


},{"../scripts/kan-samples-repository":23}],25:[function(require,module,exports){
'use strict';


var appModule = require('./kan-shell.module');
appModule.config(require('./kan-shell.config'));
appModule.run(require('./kan-shell.run'));


},{"./kan-shell.config":26,"./kan-shell.module":27,"./kan-shell.run":28}],26:[function(require,module,exports){
'use strict';

module.exports = function ($stateProvider) {

    $stateProvider.state('root.shell', {
        url: '',
        abstract:true,
        templateUrl: 'kan-shell/partials/shell.html'
    });

    $stateProvider.state('root.shell.about', {
        url: '/about',
        templateUrl: 'kan-shell/partials/about.html'
    });
};

},{}],27:[function(require,module,exports){
'use strict';

module.exports = angular.module('kanShell',['ui.router']);

},{}],28:[function(require,module,exports){
arguments[4][10][0].apply(exports,arguments)
},{"dup":10}],29:[function(require,module,exports){
'use strict';


var appModule = require('./kan-ui-charts.module');
appModule.run(require('./kan-ui-charts.run'));
appModule.config(require('./kan-ui-charts.config'));


},{"./kan-ui-charts.config":30,"./kan-ui-charts.module":31,"./kan-ui-charts.run":32}],30:[function(require,module,exports){
arguments[4][8][0].apply(exports,arguments)
},{"dup":8}],31:[function(require,module,exports){
'use strict';

module.exports = angular.module('kanUICharts',[]);

},{}],32:[function(require,module,exports){
arguments[4][10][0].apply(exports,arguments)
},{"dup":10}],33:[function(require,module,exports){




module.exports = function()
{
    function Controller($scope, EntrySvc, SessionInfo) {
        var self = this;
        this.mapElement = null;
        this.slider = null;
        this.sliderTicks = null;
        this.map = null;
        this.citiesLayer = null;
        this.countriesLayer = null;
        this.dvrEnabledForEntry = false;
        this.color1 = '8ecc00';
        this.color2 = 'ff8a00';
        this.color3 = '4e4e4e';
        this.lastRequestedTime = null;

        this.init = function init(element) {
            self.mapElement = element;

            // create map
            self.map = new OpenLayers.Map('map', {theme: null});

            // create OSM layer
            var osm = new OpenLayers.Layer.OSM('OpenStreetMap', [], {numZoomLevels: SessionInfo.map_zoom_levels});
            // add target so we won't try to open in frame
            osm.attribution = "&copy; <a href='http://www.openstreetmap.org/copyright' target='_blank'>OpenStreetMap</a> contributors";
            if (SessionInfo.map_urls) {
                osm.url = self.processMapUrls(SessionInfo.map_urls);
            }
            self.map.addLayer(osm);
            self.map.zoomToMaxExtent();
            self.map.events.register('zoomend', this, function (event) {
                if (!self.citiesLayer) return; // if no layers no need to toggle.

                var zLevel = self.map.getZoom();
                if (zLevel < 4) {
                    // show countries
                    self.citiesLayer.setVisibility(false);
                    self.countriesLayer.setVisibility(true);
                }
                else {
                    // show cities
                    self.citiesLayer.setVisibility(true);
                    self.countriesLayer.setVisibility(false);
                }
            });

            // create slider
            var d = new Date();
            var t = Math.floor(d.getTime() / 1000);
            self.slider = angular.element('#mapslider');
            self.slider.slider({
                max: t,
                min: t - 129600, // 36 hrs
                value: t,
                step: 10,
                change: self.sliderChangeHandler,
                slide: function (event, ui) {
                    d = new Date(ui.value * 1000);
                    angular.element('#maptip .tooltip-inner').text(self.formatTime(d));
                    angular.element('#maptip').css('left', $(ui.handle).css('left'));
                    angular.element('#maptip').removeClass('hidden');
                }
            });

            angular.element('#mapslider .ui-slider-handle').mouseleave(function () {
                angular.element('#maptip').addClass('hidden');
                angular.element('#maptip .tooltip-inner').text("");
                angular.element('#maptip').css('left', $(this).css('left'));
            });

            // create ticks
            self.sliderTicks = angular.element('#sliderticks');
            self.createSliderTicks(t - 12960, t);

        };


        $scope.$on('gotoTime', function (event, time) {
            // show required time data on map
            self.slider.slider("option", "value", time);
        });

        /**
         * make sure the urls start with either protocol or '//'
         * @param urls Array
         * @return urls array with protocol
         */
        this.processMapUrls = function processMapUrls(urls) {
            var result = [];
            for (var i = 0; i < urls.length; i++) {
                if (urls[i].indexOf('http') == 0 && urls[i].indexOf('//') == 0) {
                    result.push(urls[i] + "/${z}/${x}/${y}.png");
                }
                else {
                    result.push('//' + urls[i] + "/${z}/${x}/${y}.png");
                }
            }
            return result;
        }

        /**
         * event handler for the slider drag
         */
        this.sliderChangeHandler = function sliderChangeHandler(event, ui) {
            angular.element('#maptip').addClass('hidden');
            angular.element('#maptip .tooltip-inner').text("");
            self.getMapData(ui.value);
        };


        /**
         * @param min, max - timestamp (seconds)
         */
        this.createSliderTicks = function createSliderTicks(min, max) {
            // remove existing ticks
            self.sliderTicks.html('');
            // create new ticks
            var step, left, label, range = max - min, cnt = 6;
            for (var i = 0; i < cnt; i++) {
                step = i / cnt;
                label = min + range * step;
                var d = new Date(Math.floor(label * 1000));
                label = self.formatTime(d);
                left = step * 100;
                self.createSliderTick(left + '%', label);
            }

        };


        this.createSliderTick = function createSliderTick(left, txt) {
            var element = document.createElement('div');
            element.style.left = left;
            element.classList.add('slidertick');
            var title = document.createElement('div');
            title.classList.add('title');
            title.innerHTML = txt;
            element.appendChild(title);
            self.sliderTicks[0].appendChild(element);
        };

        this.formatTime = function formatTime(d) {
            return d.toString().match(/(\d+:\d+:\d+)/)[1];
        };


        /**
         * create a style map for the dots
         * @param min the smallest data point value
         * @param max the largest data point value
         */
        this.createStyleMap = function createStyleMap(min, max) {
            var sRadius = 4;
            var lRadius = 10;
            var blue = this.color1;
            var orange = this.color2;
            // style
            var style = new OpenLayers.Style({
                    pointRadius: "${radius}",
                    fillColor: "${fillColor}",
                    fillOpacity: 0.8,
                    strokeColor: '#' + this.color3,
                    strokeWidth: 1,
                    strokeOpacity: 0.8,
                    title: "${tooltip}"
                },
                {
                    context: {
                        radius: function (feature) {
                            // data point size normalization
                            if (max == min) return lRadius;
                            return lRadius - ((max - feature.attributes.data) * (lRadius - sRadius) / (max - min));
                        },
                        tooltip: function (feature) {
                            var str = feature.attributes.text + ": " + feature.attributes.audience;
                            if (self.dvrEnabledForEntry) {
                                str += "\nDVR: " + feature.attributes.dvr;
                            }
                            return str;
                        },
                        fillColor: function (feature) {
                            // data point color normalization
                            var ro = parseInt(orange.substring(0, 2), 16);
                            var rb = parseInt(blue.substring(0, 2), 16);
                            var r = ro + (feature.attributes.audience / (feature.attributes.dvr + feature.attributes.audience)) * (rb - ro);
                            r = Math.round(r);
                            r = r.toString(16);
                            if (r.length === 1) r = "0" + r;

                            var go = parseInt(orange.substring(2, 4), 16);
                            var gb = parseInt(blue.substring(2, 4), 16);
                            var g = go + (feature.attributes.audience / (feature.attributes.dvr + feature.attributes.audience)) * (gb - go);
                            g = Math.round(g);
                            g = g.toString(16);
                            if (g.length === 1) g = "0" + g;

                            var bo = parseInt(orange.substring(4, 6), 16);
                            var bb = parseInt(blue.substring(4, 6), 16);
                            var b = bo + (feature.attributes.audience / (feature.attributes.dvr + feature.attributes.audience)) * (bb - bo);
                            b = Math.round(b);
                            b = b.toString(16);
                            if (b.length === 1) b = "0" + b;

                            return "#" + r + g + b;
                        }
                    }
                }
            );

            // create a styleMap with a custom default symbolizer
            var styleMap = new OpenLayers.StyleMap({
                "default": style,
                "select": {
                    fillColor: '#' + this.color1,
                    strokeColor: '#' + this.color3
                }
            });

            return styleMap;
        };


        /**
         * get data to display on map
         * @param time unix timestamp (seconds). if null, current time is used.
         */
        this.getMapData = function getMapData(time) {
            self.lastRequestedTime = time;
            EntrySvc.getMap($scope.entryId, time).then(function (data) {
                if (!data.objects || data.objects[0].timestamp == self.lastRequestedTime.toString()) {
                    self.displayData(data.objects);
                }
            });

        };


        /**
         * recreate data layers on map
         * @param value array of KalturaGeoTimeLiveStats
         */
        this.displayData = function displayData(value) {
            // remove existing layers
            if (self.citiesLayer) {
                self.map.removeLayer(self.citiesLayer);
                self.citiesLayer = null;
            }
            if (self.countriesLayer) {
                self.map.removeLayer(self.countriesLayer);
                self.countriesLayer = null;
            }
            if (value) {
                // process data to create new layers
                var countriesData = {};
                var features = new Array();
                var point;
                var min = 0;
                var max = 0;
                for (var i = 0; i < value.length; i++) {
                    var val = parseInt(value[i].audience, 10) + parseInt(value[i].dvrAudience, 10); // convert string to int
                    if (val == 0) continue; // leave out points where audience is zero - we got them because they have plays)
                    // accumulate data for country-level layer
                    if (!countriesData[value[i].country.name]) {
                        // init - keep whole value for lat/long
                        countriesData[value[i].country.name] = value[i];
                        countriesData[value[i].country.name]['audience'] = parseInt(value[i].audience, 10);
                        countriesData[value[i].country.name]['dvrAudience'] = parseInt(value[i].dvrAudience, 10);
                    }
                    else {
                        // sum audience
                        countriesData[value[i].country.name]['audience'] += parseInt(value[i].audience, 10);
                        countriesData[value[i].country.name]['dvrAudience'] += parseInt(value[i].dvrAudience, 10);
                    }
                    point = new OpenLayers.Geometry.Point(value[i].city.longitude, value[i].city.latitude).transform('EPSG:4326', 'EPSG:3857');
                    features.push(new OpenLayers.Feature.Vector(
                        point,
                        {
                            "audience": value[i].audience,
                            "dvr": value[i].dvrAudience,
                            "data": val,
                            "text": value[i].city.name
                        }
                    ));
                    // update cities min-max
                    if (min == 0 || val < min) {
                        min = val;
                    }
                    if (val > max) {
                        max = val;
                    }
                }

                // create cities layer
                var layer = self.citiesLayer = new OpenLayers.Layer.Vector('Cities', {
                    "projection": "EPSG:3857",
                    "visibility": self.map.zoom > 3,
                    "styleMap": self.createStyleMap(min, max)
                });
                layer.addFeatures(features);
                self.map.addLayer(layer);

                // create countries layer
                min = max = 0;
                features = new Array();
                for (var key in countriesData) {
                    var val = countriesData[key].audience + countriesData[key].dvrAudience;
                    point = new OpenLayers.Geometry.Point(countriesData[key].country.longitude, countriesData[key].country.latitude).transform('EPSG:4326', 'EPSG:3857');
                    features.push(new OpenLayers.Feature.Vector(
                        point,
                        {
                            "audience": countriesData[key].audience,
                            "dvr": countriesData[key].dvrAudience,
                            "data": val,
                            "text": countriesData[key].country.name
                        }
                    ));
                    // update countries min-max
                    if (min == 0 || val < min) {
                        min = val;
                    }
                    if (val > max) {
                        max = val;
                    }
                }

                // create countries layer
                layer = self.countriesLayer = new OpenLayers.Layer.Vector('Countries', {
                    "projection": "EPSG:3857",
                    "visibility": self.map.zoom < 4,
                    "styleMap": self.createStyleMap(min, max)
                });
                layer.addFeatures(features);
                self.map.addLayer(layer);

                layer.refresh();
            }
        };


        this.adjustSlider = function adjustSlider(oldmax, newmax, val) {
            var n = newmax - oldmax;
            var min = self.slider.slider("option", "min");
            self.slider.slider("option", "max", newmax);
            self.slider.slider("option", "min", min + n);
            if (val) {
                self.slider.slider("option", "value", val);
            }
            self.createSliderTicks(min + n, newmax);
        };


        /**
         * event handler for main screen update interval
         * @param event
         * @param timestamp (seconds)
         */
        this.updateScreenHandler = function updateScreenHandler(event, time) {
            time -= 60; // we only have data about 60 seconds back, so we adjust what we got
            var val = self.slider.slider("option", "value"); // current slider value
            var max = self.slider.slider("option", "max"); // max slider value
            if (val == max) {
                // we are at the right edge, auto update
                //self.getMapData(time); // adjusting the slider will also trigger the update
                // update scrollbar and handle (keep handle on right edge)
                self.adjustSlider(max, time, time);
            }
            else {
                // update range
                self.adjustSlider(max, time);
            }
            self.dvrEnabledForEntry = $scope.entry.dvrStatus == 1 // KalturaDVRStatus.ENABLED
        };

        this.timeBoundsSetHandler = function timeBoundsSetHandler(event, start, end) {
            start = parseInt(start, 10);
            end = parseInt(end, 10);
            var val = self.slider.slider("option", "value"); // current slider value
            var max = self.slider.slider("option", "max"); // max slider value
            if (val == max) {
                // we are at the right edge, stay there
                self.slider.slider("option", "max", end);
                self.slider.slider("option", "min", start);
                self.slider.slider("option", "value", end);
            }
            else {
                var updateVal = false;
                if (val < start) {
                    val = start;
                    updateVal = true;
                }
                if (val > end) {
                    val = end;
                    updateVal = true;
                }
                self.slider.slider("option", "max", end);
                self.slider.slider("option", "min", start);
                if (updateVal) {
                    self.slider.slider("option", "value", val);
                }
            }
            self.createSliderTicks(start, end);
        };

        $scope.$on('setupScreen', self.updateScreenHandler);
        $scope.$on('updateScreen', self.updateScreenHandler);
        $scope.$on('TimeBoundsSet', self.timeBoundsSetHandler);
    }


    function Link(scope,element,attrs, ctrl)
    {
        ctrl.init(element);
    }


     return {
    restrict: 'A',
    scope: {
    },
    templateUrl: 'src/kan-ui-maps/directives/kan-maps.html',
    controller: Controller,
    controllerAs: 'vm',
    bindToController: true,
    link: Link
}




}

},{}],34:[function(require,module,exports){
'use strict';


var appModule = require('./kan-ui-maps.module');
appModule.run(require('./kan-ui-maps.run'));
appModule.config(require('./kan-ui-maps.config'));
appModule.directive('kanMap',require('./directives/kan-map'));

},{"./directives/kan-map":33,"./kan-ui-maps.config":35,"./kan-ui-maps.module":36,"./kan-ui-maps.run":37}],35:[function(require,module,exports){
arguments[4][8][0].apply(exports,arguments)
},{"dup":8}],36:[function(require,module,exports){
'use strict';

module.exports = angular.module('kanUIMaps',[]);

},{}],37:[function(require,module,exports){
arguments[4][10][0].apply(exports,arguments)
},{"dup":10}]},{},[1]);
