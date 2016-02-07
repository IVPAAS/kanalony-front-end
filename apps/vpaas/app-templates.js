angular.module('kauApp').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('ui/ka-ui-maps/directives/ka-map.html',
    "<div class=\"kan-map-container\"><leaflet lf-center=\"vm.center\" geojson=\"vm.geojson\" layers=\"vm.layers\" paths=\"vm.paths\" width=\"100%\" height=\"100%\"></leaflet><div data-ng-show=\"vm.hasData\" class=\"worldmap box\"><div data-ng-show=\"vm.selectedFeature\"><p><b>{{ vm.selectedFeature.name || vm.selectedFeature.text }}</b></p><p>Audience: {{ vm.selectedFeature.audience || 0 }}<br>DVR: {{ vm.selectedFeature.dvr || 0 }}</p></div><div ng-hide=\"vm.selectedFeature\"><b>Audience</b><p>Hover over a item</p></div></div><div data-ng-show=\"vm.hasData\" class=\"info legend\"><i style=\"background:#FFEDA0\"></i> 0–10<br><i style=\"background:#FED976\"></i> 10–20<br><i style=\"background:#FEB24C\"></i> 20–50<br><i style=\"background:#FD8D3C\"></i> 50–100<br><i style=\"background:#FC4E2A\"></i> 100–200<br><i style=\"background:#E31A1C\"></i> 200–500<br><i style=\"background:#BD0026\"></i> 500–1000<br><i style=\"background:#800026\"></i> 1000+</div></div>"
  );

}]);

angular.module('kauApp').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('kau-app/directives/kau-side-menu.html',
    "<div class=\"side-menu row\"><ul><li ng-repeat=\"menuItem in vm.menuItems\" data-ui-sref-active=\"active\"><span><a data-ui-sref=\"{{menuItem.state}}\">{{menuItem.title}}</a></span></li></ul></div>"
  );


  $templateCache.put('kau-app/partials/kau-report.html',
    "<div><div data-kau-report=\"{{vm.reportId}}\"></div></div>"
  );


  $templateCache.put('kau-app/partials/kau-reports.html',
    "<div class=\"k-reports\"><div class=\"row\"><div class=\"col-xs-2\" kau-side-menu></div><div class=\"col-xs-10\" data-ui-view></div></div></div>"
  );


  $templateCache.put('kau-app/partials/kau-shell.html',
    "<div class=\"container-fluid kau-app\"><div data-ui-view></div></div>"
  );


  $templateCache.put('kau-reports/directives/kau-report.html',
    "<div class=\"row\" ka-status-notification-container><div class=\"col-xs-12\"><div data-ng-repeat=\"section in vm.reportConfig.sections\"><div class=\"row ka-report-section\"><div class=\"col-xs-12\"><div data-ng-if=\"section.type === 'filters'\" k-report-status=\"vm.reportStatus\" k-options=\"section.options\" data-kau-filters-section></div><div data-ng-if=\"section.type === 'barChart'\" k-report-status=\"vm.reportStatus\" k-options=\"section.options\" data-kau-bar-chart-section></div><div data-ng-if=\"section.type === 'table'\" k-report-status=\"vm.reportStatus\" k-options=\"section.options\" data-kau-table-section></div><div data-ng-if=\"section.type === 'totals'\" k-report-status=\"vm.reportStatus\" k-options=\"section.options\" data-kau-totals-section></div><div data-ng-if=\"section.type === 'diagnostic'\" k-report-status=\"vm.reportStatus\" k-options=\"section.options\" data-kau-diagnostic-section></div><div data-ng-if=\"section.type === 'status'\" k-report-status=\"vm.reportStatus\" k-options=\"section.options\" data-kau-status-section></div></div></div></div></div></div>"
  );


  $templateCache.put('kau-reports/directives/sections/kau-bar-chart-section.html',
    "<div class=\"k-report-chart\" data-ng-if=\"vm.reportStatus.hasData\"><div ng-if=\"vm.grid.data\"><nvd3 data-options=\"vm.grid.options\" data-data=\"vm.grid.data\" data-api=\"vm.grid.api\" data-config=\"vm.grid.config\"></nvd3></div></div>"
  );


  $templateCache.put('kau-reports/directives/sections/kau-diagnostic-section.html',
    "<div>Report Data<pre>{{vm.reportData}}</pre></div>"
  );


  $templateCache.put('kau-reports/directives/sections/kau-filters-section.html',
    "<div><div class=\"title-text\" data-ng-if=\"vm.reportOptions.title\">{{vm.reportOptions.title}}</div><form class=\"form-inline\"><div class=\"form-group\" data-ng-if=\"vm.reportOptions.filters.dateRange\">Date Range:<div class=\"date-picker\" date-range-picker ng-init=\"vm.initDateRangeControl()\" options=\"vm.dateOptions\" ng-model=\"vm.filters.date\"><i class=\"glyphicon glyphicon-calendar fa fa-calendar\"></i>&nbsp; <span></span> <b class=\"caret\"></b></div></div><div class=\"pull-right\" data-ng-show=\"!vm.reportStatus.isLoading\"><a href=\"javascript:void(0)\" data-ng-click=\"vm.export()\">Export to CSV</a></div></form></div>"
  );


  $templateCache.put('kau-reports/directives/sections/kau-status-section.html',
    "<div><div data-ng-if=\"vm.reportOptions.showErrors\" class=\"alert alert-warning\" data-ng-show=\"vm.reportStatus.errorMessage\">{{ vm.reportStatus.errorMessage }}</div><div class=\"ka-status-notification-container\"><div data-ng-if=\"vm.reportOptions.showLoading\" data-ka-status-notification is-loading=\"vm.reportStatus.isLoading\"></div></div></div>"
  );


  $templateCache.put('kau-reports/directives/sections/kau-table-section.html',
    "<div data-ng-if=\"vm.reportStatus.hasData\"><div class=\"title-text\" data-ng-if=\"vm.reportOptions.title\">{{vm.reportOptions.title}}</div><table class=\"usual-table row-fluid\" ng-style=\"{width : vm.reportOptions.width}\" data-ng-if=\"vm.tableHeaders\"><thead><tr><th data-ng-repeat=\"header in vm.tableHeaders\">{{header.name}}</th></tr></thead><tbody><tr ng-repeat=\"item in vm.reportData | orderBy : vm.reportOptions.order\" ng-class=\"{odd:$index%2==1, even:$index%2==0}\"><td ng-repeat=\"field in vm.reportOptions.fields\">{{ item[field.name] | kauDynamicFilter:field.type : field.valueFormat }}</td></tr></tbody></table></div>"
  );


  $templateCache.put('kau-reports/directives/sections/kau-totals-section.html',
    "<div class=\"ka-totals-section\" data-ng-if=\"vm.reportStatus.hasData\"><div class=\"title-text\" data-ng-if=\"vm.reportOptions.title\">{{vm.reportOptions.title}}</div><div class=\"ka-table\" ng-if=\"vm.currentMonth\"><div class=\"ka-col\"><div class=\"title\"><div>Plays</div><div>(CPM)</div></div><div class=\"value\">{{vm.currentMonth['total_plays'] | kauDynamicFilter : 'number' : ','}}</div></div><div class=\"ka-col\"><div class=\"title\"><div>Average Storage</div><div>(GB)</div></div><div class=\"value\">{{vm.currentMonth['avg_storage_gb'] | kauDynamicFilter : 'number' : ',.2f'}}</div></div><div class=\"ka-col\"><div class=\"title\"><div>Bandwidth Consumption</div><div>(GB)</div></div><div class=\"value\">{{vm.currentMonth['bandwidth_gb'] | kauDynamicFilter : 'number' : ',.2f'}}</div></div><div class=\"ka-col\"><div class=\"title\"><div>Transcoding Consumption</div><div>(GB)</div></div><div class=\"value\">{{vm.currentMonth['transcoding_gb'] | kauDynamicFilter : 'number' : ',.2f'}}</div></div><div class=\"ka-col\"><div class=\"title\">Media Entries</div><div class=\"value\">{{vm.currentMonth['total_media_entries'] | kauDynamicFilter : 'number' : ','}}</div></div><div class=\"ka-col\"><div class=\"title\">End Users</div><div class=\"value\">{{vm.currentMonth['total_end_users'] | kauDynamicFilter : 'number' : ','}}</div></div></div></div>"
  );

}]);
