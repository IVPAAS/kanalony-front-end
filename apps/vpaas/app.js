(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';


var appModule = require('./ka-common-utils.module');
appModule.run(require('./ka-common-utils.run'));
appModule.config(require('./ka-common-utils.config'));

appModule.service('kaAppRoutingUtils',require('./services/ka-app-routing.service'));
appModule.service('kFormatterUtils',require('./services/ka-formatter-utils.service'));



},{"./ka-common-utils.config":2,"./ka-common-utils.module":3,"./ka-common-utils.run":4,"./services/ka-app-routing.service":5,"./services/ka-formatter-utils.service":6}],2:[function(require,module,exports){
'use strict';

module.exports = function () {


};

},{}],3:[function(require,module,exports){
'use strict';

module.exports = angular.module('kaCommonUtils',[]);

},{}],4:[function(require,module,exports){
'use strict';

module.exports = function () {

};

},{}],5:[function(require,module,exports){
"use strict";

module.exports = function($state, kAppConfig)
{
    var self = this;

    function goToDefault()
    {
        $state.go(kAppConfig.routing.defaultState);
    }

    function openExternalUri(uri)
    {
        if (!!navigator.userAgent.match(/Version\/[\d\.]+.*Safari/)) {
            return window.open(uri);
        } else {
            return window.location.replace(uri);
        }
    }

    self.openExternalUri = openExternalUri;
    self.goToDefault = goToDefault;
};

},{}],6:[function(require,module,exports){
"use strict";

module.exports = function()
{
    var self = this;

    function parseByType(input,type,format)
    {
        var result = input;

        if (type) {
            switch (type) {
                case 'date':
                    if (format) {
                        result = moment(input, format);
                    }
                    break;
                case 'number':
                    if (angular.isUndefined(input) || input === null)
                    {
                        input = 0;
                    }
                    result = parseFloat(input);
                    break;
                default:
                    break;
            }
        }

        return result;
    }

    function formatByType(input, type,format)
    {
        var result = input;
        if (input && type) {
            switch (type) {
                case 'date':
                    if (format) {
                        result = moment(input).format(format);
                    }
                    break;
                case 'number':
                    if (format) {
                        result = d3.format(format)(input);
                    }
                    break;
                default:
                    break;
            }
        }

        return result;
    }

    self.parseByType = parseByType;
    self.formatByType = formatByType;
};

},{}],7:[function(require,module,exports){
"use strict";


module.exports = function(kaKalturaAPIFacadeProvider)
{
    var handlerInfo = {service: 'report', action: 'getTable'};

    function RequestHandler($q, kaRequestsHandlerUtils, kFormatterUtils) {
        var self = this;

        var responseDescriptor = {
            fields :[
                'month_id,date,YYYYMM',
                'total_plays,number',
                'bandwidth_gb,number',
                'avg_storage_gb,number',
                'transcoding_gb,number',
                'total_media_entries,number',
                'total_end_users,number'
            ]
        };
        var defaultRequestData = {
            pager: {pageIndex: 1, pageSize: 1},
            reportInputFilter: {
                timeZoneOffset: -moment().utcOffset()
            }
        };

        function prepareRequestData(requestParams) {
            var result = _.defaultsDeep({}, defaultRequestData, requestParams);
            return result;
        }

        function validateRequestData(requestParams) {
            return { valid : true};
        }

        function handleRequest(requestParams)
        {
            var deferred = $q.defer();

            var requestValidation = validateRequestData(requestParams)

            if (requestValidation.valid)
            {
                var parsedRequestData = prepareRequestData(requestParams);

                kaRequestsHandlerUtils.invokeAPIRequest(parsedRequestData,handlerInfo).then(function(result)
                {
                    // convert header/data properties into object { header : data_value }
                    var headers = _.words(result.data.header, /[^,]+/g);
                    result = _.chain(result.data.data).words(/[^;]+/g).compact().map(function (item) {
                        var result = _.zipObject(headers, _.words(item, /[^,]+/g));

                        // traverse on result properties and handle known properties types
                        _.forIn(result, function (value, key, obj) {
                            var fieldDescriptor = _.find(responseDescriptor.fields, function (item) {
                                return item.indexOf(key + ',') === 0;
                            });

                            if (fieldDescriptor) {
                                var descriptorToken = fieldDescriptor.split(',');
                                var type = descriptorToken[1];
                                var format = descriptorToken.length >= 3 ? descriptorToken[2] : null;
                                obj[key] = kFormatterUtils.parseByType(value, type, format);
                            }
                        });

                        return result;

                    }).value();

                    deferred.resolve({data : result});
                },function(reason)
                {
                    deferred.reject(reason);
                });

            }else
            {
                deferred.reject({error: 'k-api-request-data-invalid'});
            }

            return deferred.promise;

        }

        self.handleRequest = handleRequest;
        self.validateRequestData = validateRequestData;
        self.prepareRequestData = prepareRequestData;
    }

    kaKalturaAPIFacadeProvider.registerHandler(handlerInfo,RequestHandler);
};

},{}],8:[function(require,module,exports){
"use strict";

module.exports = function(kaKalturaAPIFacadeProvider)
{
    var handlerInfo = {service: 'report', action: 'getUrlForReportAsCsv'};

    function RequestHandler($q, kaRequestsHandlerUtils) {
        var self = this;

        var defaultRequestData = {
            pager: {pageIndex: 1, pageSize: 1},
            headers:";Month,Plays (CPM),Bandwidth (GB),Avg Storage (GB),Transcoding (GB),Entries,Users",
            order : "-month_id",
            reportText:'',
            reportInputFilter: {
                timeZoneOffset: -moment().utcOffset()
            }
        }

        function prepareRequestData(requestParams) {
            var result = _.defaultsDeep({}, defaultRequestData, requestParams);
            return result;
        }

        function validateRequestData(requestParams) {
            return { valid : true};
        }

        function handleRequest(requestParams)
        {
            var deferred = $q.defer();

            var requestValidation = validateRequestData(requestParams)

            if (requestValidation.valid)
            {
                var parsedRequestData = prepareRequestData(requestParams);

                kaRequestsHandlerUtils.invokeAPIRequest(parsedRequestData,handlerInfo).then(function(result)
                {
                    deferred.resolve({csvUri : result.data});
                },function(reason)
                {
                    deferred.reject(reason);
                });

            }else
            {
                deferred.reject({error: 'k-api-request-data-invalid'});
            }

            return deferred.promise;

        }

        self.handleRequest = handleRequest;
        self.validateRequestData = validateRequestData;
        self.prepareRequestData = prepareRequestData;
    }

    kaKalturaAPIFacadeProvider.registerHandler(handlerInfo,RequestHandler);
};


},{}],9:[function(require,module,exports){
'use strict';


var appModule = require('./ka-kaltura-api.module');
appModule.run(require('./ka-kaltura-api.run'));
appModule.config(require('./ka-kaltura-api.config'));

appModule.provider('kaKalturaAPIFacade',require('./services/ka-kaltura-api-facade.provider'));

appModule.service('kaRequestsHandlerUtils',require('./services/ka-requests-handler-utils.service'));

appModule.config(require('./config/handlers/report-service/get-url-for-report-as-csv.config'));
appModule.config(require('./config/handlers/report-service/get-table.config'));

},{"./config/handlers/report-service/get-table.config":7,"./config/handlers/report-service/get-url-for-report-as-csv.config":8,"./ka-kaltura-api.config":10,"./ka-kaltura-api.module":11,"./ka-kaltura-api.run":12,"./services/ka-kaltura-api-facade.provider":13,"./services/ka-requests-handler-utils.service":14}],10:[function(require,module,exports){
arguments[4][2][0].apply(exports,arguments)
},{"dup":2}],11:[function(require,module,exports){
'use strict';

require('../ka-common-utils');
require('../ka-kmc-hoster');


module.exports = angular.module('kaKalturaAPI',['kaCommonUtils','kaKMCHoster']);

},{"../ka-common-utils":1,"../ka-kmc-hoster":15}],12:[function(require,module,exports){
arguments[4][4][0].apply(exports,arguments)
},{"dup":4}],13:[function(require,module,exports){
"use strict";

function KalturaAPIFacade($q, kalturaAPIContext, $injector) {
    var self = this;

    function invoke(service, action, requestParams) {

        var handler = kalturaAPIContext.getHandler({service : service, action:action});

        if (handler) {
            return $injector.instantiate(handler).handleRequest(requestParams);
        } else {
            return $q.reject({error: 'unknown_api_service_action'});
        }
    };


    function getKalturaAPIService()
    {
        return kalturaAPIContext.getInfo().kalturaApiUri;
    }

    function getPartnerKS()
    {
        return kalturaAPIContext.getInfo().partnerKS;
    }


    self.getPartnerKS = getPartnerKS;
    self.getKalturaAPIService = getKalturaAPIService;
    self.invoke = invoke;
};


module.exports = function () {

    var handlers = {},
        kalturaAPIContext = {
            getHandler: getHandler,
            getInfo : getInfo
        },
        info = {
            partnerKS : '',
            kalturaApiUri : ''
        };


    function getInfo()
    {
        return info;
    }

    function getHandler(handlerInfo) {
        var key = generateHandlerKey(handlerInfo);
        return handlers[key];
    }

    function generateHandlerKey(item) {
        return item.action + ";" + item.service;
    }

    function registerHandler(handlerInfo, handler) {
        var key = generateHandlerKey(handlerInfo);
        handlers[key] = handler;
    }

    function setKalturaAPIService(serviceUri)
    {
        info.kalturaApiUri = serviceUri;
    }

    function setPartnerKS(ks)
    {
        info.partnerKS = ks;
    }

    this.setPartnerKS = setPartnerKS;
    this.setKalturaAPIService = setKalturaAPIService;

    this.registerHandler = registerHandler;


    this.$get = function ($injector) {
        return $injector.instantiate(KalturaAPIFacade, {kalturaAPIContext: kalturaAPIContext});
    }
}

},{}],14:[function(require,module,exports){
'use strict';

module.exports = function ($http, $q,  $httpParamSerializer, kaKalturaAPIFacade) {

    var self = this;
    var isIE = (!!window.ActiveXObject && +(/msie\s(\d+)/i.exec(navigator.userAgent)[1])) || NaN;


    /**
     * format params as &key1=val1&key2=val2
     * @param params
     * @returns {String}
     */
    function serializeParams(params, parentKey) {
        var s = '';
        for (var key in params) {
            var value = params[key];

            if (s) {
                s += '&';
            }
            if (angular.isObject(value)) {
                s += serializeParams(value, key);
            } else {
                if (parentKey) {
                    s += parentKey + ':' + key + '=' + value;

                } else {
                    s += key + '=' + value;

                }
            }
        }
        return s;
    };


    function invokeAPIRequest(requestParams,queryParams) {


        // Creating a deferred object
        var deferred = $q.defer();

        var parsedRequestParams;
        var method;

        if (isIE < 10) {
            method = 'jsonp';
            parsedRequestParams = $.extend(true, {}, requestParams, {
                ks: kaKalturaAPIFacade.getPartnerKS(),
                'callback': 'JSON_CALLBACK',
                'format': '9'
            });
        }
        else {
            method = "post";
            parsedRequestParams = $.extend(true, {}, requestParams, {
                ks: kaKalturaAPIFacade.getPartnerKS(),
                'format': '1'
            });
        }

        var url = kaKalturaAPIFacade.getKalturaAPIService();
        if (queryParams)
        {
            url += '?' + $httpParamSerializer(queryParams);
        }

        $http({
            data: (method === 'post' ? serializeParams(parsedRequestParams) : null),
            url: url,
            method: method,
            params: (method === 'jsonp' ? parsedRequestParams : null),
            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
        }).success(function (data, status) {
            if (data.objectType === "KalturaAPIException") {
                if (data.code == "INVALID_KS") {
                    // TODO
                    deferred.reject({error: 'invalid-ks', errorMessage: 'Invalid partner KS'});
                }
                else {
                    var errorMessage = data.message || 'Failed to invoke request';
                    deferred.reject({error: 'failed-to-invoke-api-request',errorMessage: data.message});
                }
            }
            else {
                deferred.resolve({data: data});
            }
        }).error(function (data, status) {
            var errorMessage = (data ? data.message : '') || 'unkown error';
            console.log(errorMessage);
            deferred.reject({errorMessage: errorMessage});
        });

        // Returning the promise object
        return deferred.promise;
    }

    self.invokeAPIRequest = invokeAPIRequest;
};

},{}],15:[function(require,module,exports){
'use strict';


var appModule = require('./ka-kmc-hoster.module.js');
appModule.run(require('./ka-kmc-hoster.run.js'));
appModule.config(require('./ka-kmc-hoster.config.js'));

appModule.constant('kaKMCConfig',require('./services/ka-kmc-config.constant'));


},{"./ka-kmc-hoster.config.js":16,"./ka-kmc-hoster.module.js":17,"./ka-kmc-hoster.run.js":18,"./services/ka-kmc-config.constant":19}],16:[function(require,module,exports){
arguments[4][2][0].apply(exports,arguments)
},{"dup":2}],17:[function(require,module,exports){
'use strict';


module.exports = angular.module('kaKMCHoster',[]);

},{}],18:[function(require,module,exports){
arguments[4][4][0].apply(exports,arguments)
},{"dup":4}],19:[function(require,module,exports){
"use strict";

var config = {};



function extractKMC()
{
    try {
        var kmc = window.parent.kmc;
        if (kmc && kmc.vars) {
            if (kmc.vars.ks) {
                config.ks = kmc.vars.ks;
            }
            if (kmc.vars.partner_id) {
                config.pid = kmc.vars.partner_id;
            }
            if (kmc.vars.service_url)
                config.kalturaAPIUri = kmc.vars.service_url + '/api_v3/index.php';
            if (kmc.vars.liveanalytics) {
                if (kmc.vars.liveanalytics.player_id) {
                    config.live.playerId = kmc.vars.liveanalytics.player_id;
                }
                if (kmc.vars.liveanalytics.map_urls) {
                    config.live.map_urls = kmc.vars.liveanalytics.map_urls;
                }
                if (kmc.vars.liveanalytics.map_zoom_levels) {
                    var n = parseInt(kmc.vars.liveanalytics.map_zoom_levels);
                    if (n > 0) {
                        config.live.map_zoom_levels = n;
                    }
                }
            }
        }
    } catch (e) {
        console.log('Could not locate parent.kmc: ' + e);
    }
}

extractKMC();



module.exports = config;

},{}],20:[function(require,module,exports){
'use strict';


var appModule = require('./ka-ui-charts.module.js');
appModule.run(require('./ka-ui-charts.run.js'));
appModule.config(require('./ka-ui-charts.config.js'));

},{"./ka-ui-charts.config.js":21,"./ka-ui-charts.module.js":22,"./ka-ui-charts.run.js":23}],21:[function(require,module,exports){
arguments[4][2][0].apply(exports,arguments)
},{"dup":2}],22:[function(require,module,exports){
'use strict';

module.exports = angular.module('kaUICharts',[]);

},{}],23:[function(require,module,exports){
arguments[4][4][0].apply(exports,arguments)
},{"dup":4}],24:[function(require,module,exports){
"use strict";

var spin = require('spin');
module.exports = function()
{
    var loaderConfig =  {
        lines: 11, // The number of lines to draw
        length: 10, // The length of each line
        width: 6, // The line thickness
        radius: 12, // The radius of the inner circle
        corners: 1, // Corner roundness (0..1)
        rotate: 0, // The rotation offset
        direction: 1, // 1: clockwise, -1: counterclockwise
        color: [
            'rgb(0,154,218)',
            'rgb(255,221,79)',
            'rgb(0,168,134)',
            'rgb(233,44,46)',
            'rgb(181,211,52)',
            'rgb(252,237,0)',
            'rgb(0,180,209)',
            'rgb(117,192,68)',
            'rgb(232,44,46)',
            'rgb(250,166,26)',
            'rgb(0,154,218)',
            'rgb(232,44,46)',
            'rgb(255,221,79)',
            'rgb(117,192,68)',
            'rgb(232,44,46)'
        ],
        imageUrl: '',  // url for image to replace the spinner
        speed: 1.6,	// Rounds per second
        trail: 100,	// Afterglow percentage
        shadow: false, // Whether to render a shadow
        hwaccel: true, // Whether to use hardware acceleration
        className: 'spinner', // The CSS class to assign to the spinner
        zIndex: 2e9, // The z-index (defaults to 2000000000),
        top : 0,
        left : 0

    };

    function link(scope,element,attrs,ctrl)
    {
        var loader = new spin(loaderConfig);
        var isShowingLoader = false;

        element.ready(function () {
            if (attrs.isLoading) {
                scope.$watch(attrs.isLoading, function (val) {
                    if (val) {
                        if (!isShowingLoader) {
                            isShowingLoader = true;
                            loader.spin();
                            $(element.children()[0]).append(loader.el);
                        }
                    } else {
                        loader.stop();
                        isShowingLoader = false;
                    }
                });
            }
        });
    }

    return {
        restrict : 'A',
        link : link,
        template: '<div class="ka-status-notification"></div>'
    }

};

},{"spin":"spin"}],25:[function(require,module,exports){
'use strict';


var appModule = require('./ka-ui-common.module.js');
appModule.run(require('./ka-ui-common.run.js'));
appModule.config(require('./ka-ui-common.config.js'));

appModule.directive('kaStatusNotification',require('./directives/ka-status-notification'));

},{"./directives/ka-status-notification":24,"./ka-ui-common.config.js":26,"./ka-ui-common.module.js":27,"./ka-ui-common.run.js":28}],26:[function(require,module,exports){
arguments[4][2][0].apply(exports,arguments)
},{"dup":2}],27:[function(require,module,exports){
'use strict';

module.exports = angular.module('kaUICommon',[]);

},{}],28:[function(require,module,exports){
arguments[4][4][0].apply(exports,arguments)
},{"dup":4}],29:[function(require,module,exports){
"use strict";

module.exports = function($stateParams, kAppConfig, kaAppRoutingUtils)
{

    var self = this;

    function initalize()
    {
        if (!self.reportId)
        {
            kaAppRoutingUtils.goToDefault();
        }
    }


    self.reportId = $stateParams.reportId;

    initalize();

};

},{}],30:[function(require,module,exports){


module.exports = function()
{
    function Controller(kauReportsConfiguration)
    {
        var self = this;


        function initialize()
        {
            var menus = [];
            _.chain(kauReportsConfiguration).sortBy(function(item) {
                return _.at(item,'menu.order') || 100;
            }).forEach(function(item)
            {
                menus.push({state : 'root.shell.reports.report({reportId : "' + item.reportId + '"})', title : item.menu.title});
            }).value();

            self.menuItems = menus;
        }

        self.menuItems = [];

        initialize();
    }

    function Link(scope, element, attrs, ctrl) {


    }


    return {
        restrict: 'A',
        scope:true,
        controllerAs:'vm',
        templateUrl: 'kau-app/directives/kau-side-menu.html',
        controller: Controller,
        link:Link
    };
};



},{}],31:[function(require,module,exports){
'use strict';

require('../../vendors-shim-workaround');

require('./kau-app-bootstrap');

var appModule = require('./kau-app.module.js');
appModule.config(require('./kau-app.config.js'));
appModule.run(require('./kau-app.run.js'));

appModule.controller('kauReport',require('./controllers/kau-report'));

appModule.constant('kauReportsConfiguration',require('./services/kau-reports-configuration.constant.js'));

appModule.directive('kauSideMenu',require('./directives/kau-side-menu'));



},{"../../vendors-shim-workaround":50,"./controllers/kau-report":29,"./directives/kau-side-menu":30,"./kau-app-bootstrap":32,"./kau-app.config.js":33,"./kau-app.module.js":34,"./kau-app.run.js":35,"./services/kau-reports-configuration.constant.js":36}],32:[function(require,module,exports){
'use strict';


$(document).ready(function () {

    var $html = $('html');

    $.get('./app-config.json',function(data)
    {
        angular.module('kauApp').constant('kAppConfig',data);

        angular.bootstrap($html, ['kauApp']);

    });

});

},{}],33:[function(require,module,exports){
'use strict';

module.exports = function ($stateProvider, $urlRouterProvider, $httpProvider, $provide, kAppConfig,kaKMCConfig, kaKalturaAPIFacadeProvider) {


    function getQueryStringByName(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        var regex = new RegExp('[\\?&]' + name + '=([^&#]*)'),
            results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

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

    var apiUri = kaKMCConfig.kalturaAPIUri || _.get(kAppConfig,'server.apiUri');
    var partnerKS = kaKMCConfig.ks || getQueryStringByName('ks');
    kaKalturaAPIFacadeProvider.setKalturaAPIService(apiUri);
    kaKalturaAPIFacadeProvider.setPartnerKS(partnerKS);


    $stateProvider.state('root', {
        url: '',
        abstract:true,
        template: '<div ui-view></div>'
    });

    $stateProvider.state('root.shell', {
        url: '',
        abstract:true,
templateUrl: 'kau-app/partials/kau-shell.html'
    });

    $stateProvider.state('root.shell.reports', {
        url: '/reports',
        abstract:true,
templateUrl: 'kau-app/partials/kau-reports.html'
    });

    $stateProvider.state('root.shell.reports.report', {
        url: '/{reportId}',
templateUrl: 'kau-app/partials/kau-report.html',
        controller : 'kauReport',
        controllerAs : 'vm'
    });

};

},{}],34:[function(require,module,exports){
'use strict';

require('angular-ui-router');
require('angular-nvd3');
require('ui-bootstrap');
require('ngStorage');

require('../../../ka-infra/core/ka-kaltura-api');
require('../kau-reports');

module.exports =angular.module('kauApp',['ngStorage','ui.router', 'nvd3','ui.bootstrap','kauReports','kaKalturaAPI']);

},{"../../../ka-infra/core/ka-kaltura-api":9,"../kau-reports":45,"angular-nvd3":"angular-nvd3","angular-ui-router":"angular-ui-router","ngStorage":"ngStorage","ui-bootstrap":"ui-bootstrap"}],35:[function(require,module,exports){
'use strict';

module.exports = function ($rootScope,$state,kAppConfig) {

    $rootScope.$state = $state;

    $rootScope.kAppConfig = kAppConfig;
};

},{}],36:[function(require,module,exports){
"use strict";

var repository = [

        {
            reportId: 'overall',
            menu: {title: 'Overall Usage Report', order: 0},
            data: {
                reportType: 26
            },
            sections: [

                {
                    type: 'filters',
                    showOnLoading: true, // todo - should be true by default
                    showOnError: false,  // todo - should be false by default
                    options: {
                        title: 'Month to Date Usage Summary'

                    }
                },
                {
                    type: 'status',
                    showOnLoading: true, // todo - should be true by default
                    showOnError: true,
                    options: {
                        showErrors: true,
                        showLoading: true
                    }
                },
                {
                    type: 'totals',
                    showOnLoading: false,
                    showOnError: false,  // todo - should be false by default
                    options: {
                    }
                },
                {
                    type: 'table',
                    showOnLoading: false,
                    showOnError: false,  // todo - should be false by default

                    options: {
                        title: 'Monthly Usage Breakdown',
                        order: '-month_id',
                        width : '100%',
                        fields: [{
                            name: 'month_id',
                            type: 'date',
                            valueFormat: 'MMMM, YYYY',
                            title: 'Month'
                            },
                            {name: 'total_plays', type: 'number', valueFormat: ',', title: 'Plays (CPM)'},
                            {name: 'avg_storage_gb', type: 'number', valueFormat: ',.2f', title: 'Average Storage (GB)'},
                            {
                                name: 'transcoding_gb',
                                type: 'number',
                                valueFormat: ',.2f',
                                title: 'Transcoding Consumption (GB)'
                            },
                            {name: 'bandwidth_gb', type: 'number', valueFormat: ',.2f', title: 'Bandwidth Consumption (GB)'},
                            {
                                name: 'total_media_entries',
                                type: 'number',
                                valueFormat: ',',
                                title: 'Media Entries'
                            }, {
                                name: 'total_end_users',
                                type: 'number',
                                valueFormat: ',',
                                title: 'End Users'
                            }
                        ]
                    }
                }
            ]
        },
        {
            reportId: 'play',
            menu: {
                title: 'Plays Report',
                order: 0,
            },
            data: {
                reportType: 26
            },
            sections: [
                //{
                //    type: 'diagnostic',
                //    showOnLoading: true, // todo - should be true by default
                //    showOnError: true
                //},
                {
                    type: 'filters',
                    showOnLoading: true, // todo - should be true by default
                    showOnError: false,  // todo - should be false by default
                    options: {
                        filters : {
                            dateRange : true
                        }
                    }
                },
                {
                    type: 'status',
                    showOnLoading: true, // todo - should be true by default
                    showOnError: true,
                    options: {
                        showErrors: true,
                        showLoading: true
                    }
                },
                {
                    type: 'barChart',
                    showOnLoading: false,
                    showOnError: false,  // todo - should be false by default
                    options: {
                        xValue: {name: 'month_id', type: 'date', labelFormat: 'MMMM, YYYY', title: 'Month'},
                        yValue: {name: 'total_plays', type: 'number', labelFormat: ',', title: 'Plays (CPM)'}
                    }
                },
                {
                    type: 'table',
                    showOnLoading: false,
                    showOnError: false,  // todo - should be false by default

                    options: {
                        title: 'Monthly Usage Breakdown',
                        order: '-month_id',
                        width : '50%',
                        fields: [{
                            name: 'month_id',
                            type: 'date',
                            valueFormat: 'MMMM, YYYY',
                            title: 'Month'
                        }, {name: 'total_plays', type: 'number', valueFormat: ',', title: 'Plays (CPM)'}]
                    }
                }
            ]
        },
        {
            reportId: 'storage',
            menu: {title: 'Storage Report', order: 0},
            data: {
                reportType: 26
            },
            sections: [
                //{
                //    type: 'diagnostic',
                //    showOnLoading: true, // todo - should be true by default
                //    showOnError: true
                //},
                {
                    type: 'filters',
                    showOnLoading: true, // todo - should be true by default
                    showOnError: false,  // todo - should be false by default
                    options: {
                        filters : {
                            dateRange : true
                        }
                    }
                },
                {
                    type: 'status',
                    showOnLoading: true, // todo - should be true by default
                    showOnError: true,
                    options: {
                        showErrors: true,
                        showLoading: true
                    }
                },
                {
                    type: 'barChart',
                    showOnLoading: false,
                    showOnError: false,  // todo - should be false by default
                    options: {
                        xValue: {name: 'month_id', type: 'date', labelFormat: 'MMMM, YYYY', title: 'Month'},
                        yValue: {name: 'avg_storage_gb', type: 'number', labelFormat: ',.0f', title: 'Average Storage (GB)'}
                    }
                },
                {
                    type: 'table',
                    showOnLoading: false,
                    showOnError: false,  // todo - should be false by default

                    options: {
                        title: 'Monthly Usage Breakdown',
                        order: '-month_id',
                        width : '50%',
                        fields: [{
                            name: 'month_id',
                            type: 'date',
                            valueFormat: 'MMMM, YYYY',
                            title: 'Month'
                        },
                            {name: 'avg_storage_gb', type: 'number', valueFormat: ',.2f', title: 'Average Storage (GB)'}
                        ]
                    }
                }
            ]
        },
        {
            reportId: 'bandwidth',
            menu: {title: 'Bandwidth Report', order: 0},
            data: {
                reportType: 26
            },
            sections: [
                //{
                //    type: 'diagnostic',
                //    showOnLoading : true, // todo - should be true by default
                //    showOnError : true
                //},

                {
                    type: 'filters',
                    showOnLoading: true, // todo - should be true by default
                    showOnError: false,  // todo - should be false by default
                    options: {
                        filters : {
                            dateRange : true
                        }
                    }
                },
                {
                    type: 'status',
                    showOnLoading: true, // todo - should be true by default
                    showOnError: true,
                    options: {
                        showErrors: true,
                        showLoading: true
                    }
                },
                {
                    type: 'barChart',
                    showOnLoading: false,
                    showOnError: false,  // todo - should be false by default
                    options: {
                        xValue: {name: 'month_id', type: 'date', labelFormat: 'MMMM, YYYY', title: 'Month'},
                        yValue: {
                            name: 'bandwidth_gb',
                            type: 'number',
                            labelFormat: ',.0f',
                            title: 'Bandwidth Consumption (GB)'
                        }
                    }
                },
                {
                    type: 'table',
                    showOnLoading: false,
                    showOnError: false,  // todo - should be false by default

                    options: {
                        title: 'Monthly Usage Breakdown',
                        order: '-month_id',
                        width : '50%',
                        fields: [{
                            name: 'month_id',
                            type: 'date',
                            valueFormat: 'MMMM, YYYY',
                            title: 'Month'
                        },
                            {name: 'bandwidth_gb', type: 'number', valueFormat: ',.2f', title: 'Bandwidth Consumption (GB)'}
                        ]
                    }
                }]
        },
        {
            reportId: 'transcoding',
            menu: {title: 'Transcoding Consumption Report', order: 0},
            data: {
                reportType: 26
            },
            sections: [
                //{
                //    type: 'diagnostic',
                //    showOnLoading : true, // todo - should be true by default
                //    showOnError : true
                //},
                {
                    type: 'filters',
                    showOnLoading: true, // todo - should be true by default
                    showOnError: false,  // todo - should be false by default
                    options: {
                        filters : {
                            dateRange : true
                        }
                    }
                },
                {
                    type: 'status',
                    showOnLoading: true, // todo - should be true by default
                    showOnError: true,
                    options: {
                        showErrors: true,
                        showLoading: true
                    }
                },
                {
                    type: 'barChart',
                    showOnLoading: false,
                    showOnError: false,  // todo - should be false by default
                    options: {
                        xValue: {name: 'month_id', type: 'date', labelFormat: 'MMMM, YYYY', title: 'Month'},
                        yValue: {
                            name: 'transcoding_gb',
                            type: 'number',
                            labelFormat: ',.0f',
                            title: 'Transcoding Consumption (GB)'
                        }
                    }
                },
                {
                    type: 'table',
                    showOnLoading: false,
                    showOnError: false,  // todo - should be false by default

                    options: {
                        title: 'Monthly Usage Breakdown',
                        order: '-month_id',
                        width: '100%',
                        fields: [{
                            name: 'month_id',
                            type: 'date',
                            valueFormat: 'MMMM, YYYY',
                            title: 'Month'
                        }, {
                            name: 'transcoding_gb',
                            type: 'number',
                            valueFormat: ',.2f',
                            title: 'Transcoding Consumption (GB)'
                        }]
                    }
                }]
        },
        {
            reportId: 'media',
            menu: {title: 'Media Entries Report', order: 0},
            data: {
                reportType: 26
            },
            sections: [
                //{
                //    type: 'diagnostic',
                //    showOnLoading : true, // todo - should be true by default
                //    showOnError : true
                //},
                {
                    type: 'filters',
                    showOnLoading: true, // todo - should be true by default
                    showOnError: false,  // todo - should be false by default
                    options: {
                        filters : {
                            dateRange : true
                        }
                    }
                },
                {
                    type: 'status',
                    showOnLoading: true, // todo - should be true by default
                    showOnError: true,
                    options: {
                        showErrors: true,
                        showLoading: true
                    }
                },
                {
                    type: 'barChart',
                    showOnLoading: false,
                    showOnError: false,  // todo - should be false by default
                    options: {
                        xValue: {name: 'month_id', type: 'date', labelFormat: 'MMMM, YYYY', title: 'Month'},
                        yValue: {
                            name: 'total_media_entries',
                            type: 'number',
                            labelFormat: ',',
                            title: 'Total'
                        }
                    }
                },
                {
                    type: 'table',
                    showOnLoading: false,
                    showOnError: false,  // todo - should be false by default

                    options: {
                        title: 'Monthly Usage Breakdown',
                        order: '-month_id',
                        width : '50%',

                        fields: [{
                            name: 'month_id',
                            type: 'date',
                            valueFormat: 'MMMM, YYYY',
                            title: 'Month'
                        }, {
                            name: 'total_media_entries',
                            type: 'number',
                            valueFormat: ',',
                            title: 'Total'
                        }]
                    }
                }]
        },
        {
            reportId: 'users',
            menu: {title: 'End Users Report', order: 0},
            data: {
                reportType: 26
            },
            sections: [
                //{
                //    type: 'diagnostic',
                //    showOnLoading : true, // todo - should be true by default
                //    showOnError : true
                //},
                {
                    type: 'filters',
                    showOnLoading: true, // todo - should be true by default
                    showOnError: false,  // todo - should be false by default
                    options: {
                        filters : {
                            dateRange : true
                        }
                    }
                },
                {
                    type: 'status',
                    showOnLoading: true, // todo - should be true by default
                    showOnError: true,
                    options: {
                        showErrors: true,
                        showLoading: true
                    }
                },
                {
                    type: 'barChart',
                    showOnLoading: false,
                    showOnError: false,  // todo - should be false by default
                    options: {
                        xValue: {name: 'month_id', type: 'date', labelFormat: 'MMMM, YYYY', title: 'Month'},
                        yValue: {
                            name: 'total_end_users',
                            type: 'number',
                            labelFormat: ',',
                            title: 'Total'
                        }
                    }
                },
                {
                    type: 'table',
                    showOnLoading: false,
                    showOnError: false,  // todo - should be false by default

                    options: {
                        title: 'Monthly Usage Breakdown',
                        order: '-month_id',
                        width : '50%',

                        fields: [{
                            name: 'month_id',
                            type: 'date',
                            valueFormat: 'MMMM, YYYY',
                            title: 'Month'
                        }, {
                            name: 'total_end_users',
                            type: 'number',
                            valueFormat: ',',
                            title: 'Total'
                        }]
                    }
                }]
        }]
    ;

module.exports = repository;

},{}],37:[function(require,module,exports){
"use strict";


module.exports = function()
{
    function controller(kauReportsData, $timeout)
    {
        var self = this;
        var sections = [];
        var requiredReportConfigParameters =["reportId", "data.reportType"];
        var areAllSectionsLoaded = false;

        function notifyOnEvent(name, context)
        {
            _.forEach(sections,function(section)
            {
                if (section.on)
                {
                    section.on.call(null,name,context);
                }
            });
        }

        function updateStatus(statusType, context)
        {
            switch (statusType)
            {
                case "error":
                    self.reportStatus.errorMessage = context.errorMessage;
                    break;
                case "loading":
                    self.reportStatus.isLoading = context.isLoading;
                    break;
            }
        }

        function loadData() {
            if (!areAllSectionsLoaded)
            {
                return;
            }

            self.reportStatus.isLoading = true;
            self.reportStatus.errorMessage = '';


            var filters = { reportType : self.reportConfig.data.reportType };

            _.forEach(sections,function(section)
            {
                if (section.assignFilters)
                {
                    section.assignFilters.call(section,filters);
                }
            });

            kauReportsData.getReportData(filters).then(function (result) {

                self.reportData = result.data;
                self.reportStatus.hasData = true;

                _.forEach(sections,function(section)
                {
                    if (section.loadReportData)
                    {
                        section.loadReportData.call(section, result.data);
                    }
                });

                self.reportStatus.isLoading = false;
            }, function (reason) {
                self.reportData = null;
                self.reportStatus.hasData = false;
                self.reportStatus.errorMessage = "Failed to load data : '" + reason.errorMessage + "'";
                self.reportStatus.isLoading = false;
            });
        }

        function addSection(section)
        {
            sections.push(section);

            // extend section api with functions that can trigger report actions
            $.extend(section,{refreshReport : loadData});

            // wait until all sections were added to load data
            if (sections.length=== self.reportConfig.sections.length)
            {
                areAllSectionsLoaded = true;

                $timeout(function()
                {
                    // Loads the report data after all sections where registered in the next digest cycle
                    // TODO - should use more common technique.
                    loadData();
                },200);

            }
        }

        function buildReport(reportId)
        {
            var kauReportsConfiguration = kauReportsData.getReportsConfiguration();
            var reportConfig = _.find(kauReportsConfiguration,{reportId : reportId});

            if (reportConfig && _.every(requiredReportConfigParameters, _.partial(_.has, reportConfig)))
            {
                self.reportConfig = reportConfig;
            }else
            {
                console.error('Report configuration with id "' + reportId + '" is missing or has missing required information');
            }
        }

        function shouldShow(section,type)
        {
            if (section.type !== type)
            {
                return false;
            }

            return true;
        }

        self.reportStatus = {
            isLoading : true,
            errorMessage : '',
            hasData : false
        };

        self.reportData = null;
        self.reportConfig = [];
        self.reportId = '';

        self.shouldShow = shouldShow;
        self.addSection = addSection;
        self.buildReport = buildReport;
        self.loadData = loadData;

    }

    function link(scope,element,attrs,ctrl)
    {
        ctrl.buildReport(attrs.kauReport);

    }

    return {
        restrict : 'A',
        scope : {},
        link : link,
templateUrl: 'kau-reports/directives/kau-report.html',
        controller: controller,
        controllerAs : 'vm'
    }

}

},{}],38:[function(require,module,exports){
"use strict";


module.exports = function()
{
    function Controller($scope,kFormatterUtils,$timeout)
    {
        var self = this;
        var defaultOptions = {
            xValue : {},
            yValue : {}
        };

        function loadReportData(reportData)
        {
            self.grid.data = [{key: '', values: reportData}];

            if (reportData )
            {
                var itemsNumber = reportData.length;

                if (itemsNumber > 5)
                {
                    self.grid.options.chart.showValues = false;
                    self.grid.options.chart.xAxis.rotateLabels = -90;
                }else
                {
                    self.grid.options.chart.showValues = true;
                    self.grid.options.chart.xAxis.rotateLabels = 0;
                }
            }

            if (self.grid.api.updateWithData)
            {
                self.grid.api.updateWithData(self.grid.data);
            }
        }

        self.reportOptions = null;
        self.grid = {
            config : {
                deepWatchDataDepth : 0,
                deepWatchData : false
            },
            data: null,
            api: {}, /* this object will be modified by nvd3 directive to have invokation functions */
            options: {
                chart: {
                    type: 'discreteBarChart',
                    height: 450,
                    noData : '',
                    color : ['#00a1d5'],
                    margin :{
                        bottom: 150
                    },
                    staggerLabels: false,
                    x: function (d) {
                        return d[self.reportOptions.xValue.name];
                    },
                    y: function (d) {
                        return d[self.reportOptions.yValue.name];

                    },
                    showValues: false,
                    valueFormat: function (d) {
                        return d3.format(',')(d);
                    },
                    duration: 500,
                    xAxis: {
                        rotateLabels:-90,
                        tickFormat: function (d) {
                            if (self.reportOptions.xValue.labelFormat)
                            {
                                return kFormatterUtils.formatByType(d,self.reportOptions.xValue.type,self.reportOptions.xValue.labelFormat);
                            }
                            return d;
                        }
                    },
                    yAxis: {
                        axisLabel: '',
                        tickFormat: function (d) {
                            if (self.reportOptions.yValue.labelFormat)
                            {
                                return kFormatterUtils.formatByType(d,self.reportOptions.yValue.type,self.reportOptions.yValue.labelFormat);
                            }
                            return d;
                        },
                        showMaxMin: false
                    }
                }
            }
        };

        self.loadReportData = loadReportData;

        $scope.$watch('vm.options',function()
        {
            self.reportOptions = $.extend({},defaultOptions,self.options);
            self.grid.options.chart.yAxis.axisLabel = self.reportOptions.yValue.title;
        });
    }

    function Link(scope, element, attrs, ctrls) {
        var ctrl = ctrls[0];
        var reportCtrl = ctrls[1];

        // write section API
        var sectionReportAPI = {
            loadReportData : function(reportData)
            {
                ctrl.loadReportData(reportData);
            }
        };
        reportCtrl.addSection(sectionReportAPI);
    }


    return {
        restrict: 'A',
        scope:{
            options : '=kOptions',
            reportStatus : '=kReportStatus'
        },
        require: ['kauBarChartSection','^kauReport'],
        controllerAs:'vm',
        bindToController : true,
templateUrl: 'kau-reports/directives/sections/kau-bar-chart-section.html',
        controller: Controller,
        link:Link
    };
};



},{}],39:[function(require,module,exports){
"use strict";


module.exports = function()
{
    function Controller()
    {
        var self = this;

        function loadReportData(reportData)
        {
            self.reportData = reportData;
        }

        self.reportData = null;

        self.loadReportData = loadReportData;


    }

    function Link(scope, element, attrs, ctrls) {
        var ctrl = ctrls[0];
        var reportCtrl = ctrls[1];

        reportCtrl.addSection({
            loadReportData : function(reportData)
            {
                ctrl.loadReportData(reportData);
            }
        });
    }


    return {
        restrict: 'A',
        scope:{
            options : '=kOptions'
        },
        require: ['kauDiagnosticSection','^kauReport'],
        controllerAs:'vm',
        bindToController : true,
templateUrl: 'kau-reports/directives/sections/kau-diagnostic-section.html',
        controller: Controller,
        link:Link
    };
};



},{}],40:[function(require,module,exports){
"use strict";


module.exports = function()
{
    function Controller($scope,kaAppRoutingUtils,  kauReportsData,$window)
    {
        var self = this;

        function exportToCsv()
        {
            // TODO - should get report type from report configuration
            var requestParams = _.defaults({
                reportType : 26,
                reportTitle: 'Usage report'
            },self.filters);

            self.reportStatus.isLoading = true;
            self.reportStatus.errorMessage = false;
            kauReportsData.getReportCSVUri(requestParams).then(function (result) {
                self.reportStatus.isLoading = false;
                kaAppRoutingUtils.openExternalUri(result.csvUri);

            }, function (reason) {
                self.reportStatus.isLoading = false;
                self.reportStatus.errorMessage = 'Error occurred while trying to create cvs file';
            });

        }

        self.filters = { date : { startDate: moment().subtract(2, 'month').startOf('month'), endDate: moment().endOf('month')}};

        self.dateOptions = {
            max: moment().format('MM-DD-YYYY'),
            ranges: {
                'This Month': [moment().startOf('month'), moment().endOf('month')],
                'Previous Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
                'Last 3 Months': [moment().subtract(2, 'month').startOf('month'), moment().endOf('month')]
            }
        };


        self.reportAPI = {
            assignFilters : function(filters)
            {
                $.extend(filters, self.filters);
            }
        };

        self.export = exportToCsv;
        $scope.$watch('vm.filters.date',function()
        {
            if (self.reportAPI.refreshReport) {
                self.reportAPI.refreshReport.call(null);
            }
        });


    }

    function Link(scope, element, attrs, ctrls) {
        var ctrl = ctrls[0];
        var reportCtrl = ctrls[1];

        reportCtrl.addSection(ctrl.reportAPI);
    }


    return {
        restrict: 'A',
        scope:{
            reportOptions : '=kOptions',
            reportStatus : '=kReportStatus'
        },
        require: ['kauFiltersSection','^kauReport'],
        controllerAs:'vm',
        bindToController : true,
templateUrl: 'kau-reports/directives/sections/kau-filters-section.html',
        controller: Controller,
        link:Link
    };
};



},{}],41:[function(require,module,exports){
"use strict";


module.exports = function()
{
    function Controller($scope)
    {
        var self = this;

        var defaultReportOptions = {
            showErrors : false,
            showLoading : false
        };

        self.reportAPI = {

        };

        self.reportOptions = null;

        $scope.$watch('vm.options',function()
        {
            self.reportOptions = $.extend({},defaultReportOptions,self.options);
        });
    }

    function Link(scope, element, attrs, ctrls) {
        var ctrl = ctrls[0];
        var reportCtrl = ctrls[1];

        reportCtrl.addSection(ctrl.reportAPI);
    }


    return {
        restrict: 'A',
        scope:{
            options : '=kOptions',
            reportStatus : '=kReportStatus'
        },
        require: ['kauStatusSection','^kauReport'],
        controllerAs:'vm',
        bindToController : true,
templateUrl: 'kau-reports/directives/sections/kau-status-section.html',
        controller: Controller,
        link:Link
    };
};



},{}],42:[function(require,module,exports){
"use strict";


module.exports = function()
{
    function Controller($scope)
    {
        var self = this;
        var defaultOptions = {
            title : '',
            order : '',
            fields : []
        }

        function loadReportData(reportData)
        {
            self.reportData = reportData;
        }

        self.tableHeaders = null;
        self.reportData = null;
        self.reportOptions = null;
        self.title = '';

        self.loadReportData = loadReportData;

        $scope.$watch('vm.options',function()
        {
            self.reportOptions = $.extend({},defaultOptions,self.options);

            self.tableHeaders = _.map(self.reportOptions.fields, function(item) { return {name : item.title};});

        });
    }

    function Link(scope, element, attrs, ctrls) {
        var ctrl = ctrls[0];
        var reportCtrl = ctrls[1];

        reportCtrl.addSection({
            loadReportData : function(reportData)
            {
                ctrl.loadReportData(reportData);
            }
        });
    }

    return {
        restrict: 'A',
        scope:{
            options : '=kOptions',
            reportStatus : '=kReportStatus'
        },
        require: ['kauTableSection','^kauReport'],
        controllerAs:'vm',
        bindToController : true,
templateUrl: 'kau-reports/directives/sections/kau-table-section.html',
        controller: Controller,
        link:Link
    };
};



},{}],43:[function(require,module,exports){
"use strict";


module.exports = function()
{
    function Controller($scope, kauReportsData,$window)
    {
        var self = this;

        self.reportAPI = {
            loadReportData : function(reportData)
            {
                if (reportData)
                {
                    self.currentMonth =  _.find(reportData,function(item)
                    {
                        var monthValue = item['month_id'];
                       return monthValue ? monthValue.format('YYYYMM') === moment().format('YYYYMM') : false;
                    });
                }
            }
        };

        self.currentMonth = null;
    }

    function Link(scope, element, attrs, ctrls) {
        var ctrl = ctrls[0];
        var reportCtrl = ctrls[1];

        reportCtrl.addSection(ctrl.reportAPI);
    }


    return {
        restrict: 'A',
        scope:{
            reportOptions : '=kOptions',
            reportStatus : '=kReportStatus'
        },
        require: ['kauTotalsSection','^kauReport'],
        controllerAs:'vm',
        bindToController : true,
templateUrl: 'kau-reports/directives/sections/kau-totals-section.html',
        controller: Controller,
        link:Link
    };
};



},{}],44:[function(require,module,exports){
"use strict";

module.exports = function(kFormatterUtils)
{
    return function(input, type, format)
    {
       return kFormatterUtils.formatByType(input,type,format);
    }
};



},{}],45:[function(require,module,exports){
'use strict';

var appModule = require('./kau-reports.module');
appModule.config(require('./kau-reports.config'));
appModule.run(require('./kau-reports.run'));



appModule.service('kauReportsData',require('./services/kau-reports-data.service'));


appModule.directive('kauReport',require('./directives/kau-report'));

appModule.directive('kauFiltersSection',require('./directives/sections/kau-filters-section'));
appModule.directive('kauBarChartSection',require('./directives/sections/kau-bar-chart-section'));
appModule.directive('kauTableSection',require('./directives/sections/kau-table-section'));
appModule.directive('kauTotalsSection',require('./directives/sections/kau-totals-section'));
appModule.directive('kauDiagnosticSection',require('./directives/sections/kau-diagnostic-section'));
appModule.directive('kauStatusSection',require('./directives/sections/kau-status-section'));

appModule.filter('kauDynamicFilter',require('./filters/kau-dynamic-filter'));

// todo: move to core ui module

var moment = require('moment');

appModule.filter('kDate',function()
{
    return function(value)
    {
        return value ? moment(value,'YYYYMM').format('MMMM, YYYY') : value;
    };
});

},{"./directives/kau-report":37,"./directives/sections/kau-bar-chart-section":38,"./directives/sections/kau-diagnostic-section":39,"./directives/sections/kau-filters-section":40,"./directives/sections/kau-status-section":41,"./directives/sections/kau-table-section":42,"./directives/sections/kau-totals-section":43,"./filters/kau-dynamic-filter":44,"./kau-reports.config":46,"./kau-reports.module":47,"./kau-reports.run":48,"./services/kau-reports-data.service":49,"moment":"moment"}],46:[function(require,module,exports){
'use strict';

module.exports = function () {



};


},{}],47:[function(require,module,exports){
'use strict';

require('../../../ka-infra/core/ka-kaltura-api');
require('angular-daterangepicker');
require('../../../ka-infra/core/ka-common-utils');
require('../../../ka-infra/ui/ka-ui-common');
require('../../../ka-infra/ui/ka-ui-charts');


module.exports = angular.module('kauReports',['kaKalturaAPI','kaCommonUtils','daterangepicker','kaUICommon','kaUICharts']);

},{"../../../ka-infra/core/ka-common-utils":1,"../../../ka-infra/core/ka-kaltura-api":9,"../../../ka-infra/ui/ka-ui-charts":20,"../../../ka-infra/ui/ka-ui-common":25,"angular-daterangepicker":"angular-daterangepicker"}],48:[function(require,module,exports){
arguments[4][2][0].apply(exports,arguments)
},{"dup":2}],49:[function(require,module,exports){
"use strict";

module.exports = function($q, kaKalturaAPIFacade, kauReportsConfiguration)
{
    var self = this;
    var requireFiltersProperties = ["reportType","date.startDate","date.endDate"];
    var cachedReportsConfiguration;
    var cachedReportsData = {};

    function getReportCSVUri(filters)
    {
        if (filters && _.every(requireFiltersProperties, _.partial(_.has,filters))) {
            var requestParams = {
                reportType: filters.reportType,
                reportTitle : 'kaltura',
                reportInputFilter: {fromDay: moment(filters.date.startDate).format('YYYYMMDD'), toDay: moment(filters.date.endDate).format('YYYYMMDD')}
            };

            return kaKalturaAPIFacade.invoke('report','getUrlForReportAsCsv',requestParams);
        }else
        {
            return $q.reject({errorMessage: 'get report csv uri was invoked with partial/missing required filters'});

        }
    }

    function getReportData(filters)
    {
        if (filters && _.every(requireFiltersProperties, _.partial(_.has,filters))) {
            var deferred = $q.defer();

            var requestParams = {
                reportType: filters.reportType,
                reportInputFilter: {fromDay: moment(filters.date.startDate).format('YYYYMMDD'), toDay: moment(filters.date.endDate).format('YYYYMMDD')}
            };

            var cacheKey = JSON.sortify(requestParams);
            var cachedResponse = cachedReportsData[cacheKey];
            if (cachedResponse)
            {
                deferred.resolve(cachedResponse);
            }else {

                kaKalturaAPIFacade.invoke('report', 'getTable', requestParams).then(function (result) {
                    cachedReportsData[cacheKey] = result;
                    deferred.resolve(result);
                    }, function (reason) {
                        deferred.reject(reason);
                    }
                );
            }

            return deferred.promise;
        }else
        {
            return $q.reject({errorMessage: 'get report was invoked with partial/missing required filters'});

        }
    }

    function getReportsConfiguration()
    {
        if (cachedReportsConfiguration)
        {
            return cachedReportsConfiguration;
        }

        cachedReportsConfiguration = _.chain(kauReportsConfiguration).value();

        return cachedReportsConfiguration;
    }

    self.getReportCSVUri = getReportCSVUri;
    self.getReportData = getReportData;
    self.getReportsConfiguration = getReportsConfiguration;



};


},{}],50:[function(require,module,exports){
'use strict';

/* browserify-shim temoprary workaround */
// TODO: should use browserify-shim
require('angular');
var lodash = require('lodash');
window._ = lodash;

require('json.sortify');

var d3 = require('d3');
window.d3 = d3;

var moment = require('moment');
window.moment = moment;

var leaflet = require('leaflet');
window.L = leaflet;

require('nvd3');
require('dateRangePicker');

/* end of browserify-shim temoprary workaround */


},{"angular":"angular","d3":"d3","dateRangePicker":"dateRangePicker","json.sortify":"json.sortify","leaflet":"leaflet","lodash":"lodash","moment":"moment","nvd3":"nvd3"}]},{},[31]);
