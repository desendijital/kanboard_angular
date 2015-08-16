angular.module('Kanboard')

.config(function($compileProvider) {
  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|file|chrome-extension):/);
})

.config(function($translateProvider) {

  $translateProvider.registerAvailableLanguageKeys(['en', 'de'], {
      'en_US': 'en',
      'en_UK': 'en',
      'de_DE': 'de',
      'de_CH': 'de',
      'de_AT': 'de'
    })
    .determinePreferredLanguage()
    .fallbackLanguage('en')
    .useStaticFilesLoader({
      prefix: 'translation/',
      suffix: '.json'
    });
})

.config(function($routeProvider) {
    $routeProvider
      .when('/projectlist', {
        controller: 'ProjectListController',
        templateUrl: 'view/project_list.html'
      })
      .when('/settings', {
        controller: 'SettingsController',
        templateUrl: 'view/settings.html'
      })
      .when('/settings/endpoint', {
        controller: 'SettingsEndpointController',
        templateUrl: 'view/settings_endpoint.html'
      })
      .when('/settings/endpoint/:api_id', {
        controller: 'SettingsEndpointController',
        templateUrl: 'view/settings_endpoint.html'
      })
      .when('/:api_id/board/show/:projectId', {
        controller: 'ShowProjectController',
        templateUrl: 'view/board_show.html'
      })
      .when('/:api_id/board/show/:projectId/:columnId', {
        controller: 'ShowProjectController',
        templateUrl: 'view/board_show.html'
      })
      .when('/:api_id/task/show/:taskId', {
        controller: 'ShowTaskController',
        templateUrl: 'view/task_details.html'
      })
      .when('/:api_id/board/overdue/:projectId', {
        controller: 'ShowOverdueController',
        templateUrl: 'view/board_overdue.html'
      })
      .otherwise({
        redirectTo: '/projectlist'
      });
  })
  .run(function($rootScope, $location, dataFactory, navigation) {
    $rootScope.$watch(function() {
        return $location.path();
      },
      function(a) {
        // url changed
        var settings = dataFactory.getSettings();
        if (settings.rememberLastPage) {
          if (a != '/lasturl') {
            settings.lastVisitedUrl = a;
            dataFactory.setSettings(settings);
          } else {
            navigation.url(settings.lastVisitedUrl);
          }
        }
      });
  })
  .factory('navigation', ['$location', function($location) {
    return {
      home: function() {
        $location.path('/projectlist');
        $location.replace();
        console.log("Navigation: home/projectlist");
        return;
      },
      settings: function() {
        $location.path('/settings');
        $location.replace();
        console.log("Navigation: settings");
        return;
      },
      settings_endpoint: function(api_id) {
        if (api_id >= 0) {
          $location.path('/settings/endpoint/' + api_id);
        }
        else {
          $location.path('/settings/endpoint');
        }
        $location.replace();
        console.log("Navigation: settings_endpoint");
        return;
      },
      task: function(api_id, task_id) {
        $location.path('/' + api_id + '/task/show/' + task_id);
        $location.replace();
        console.log("Navigation: task");
        return;
      },
      board: function(api_id, board_id, column_id) {
        if(!column_id){
            column_id = 0;
        }
        $location.path('/' + api_id + '/board/show/' + board_id + '/' + column_id);
        $location.replace();
        console.log("Navigation: board");
        return;
      },
      url: function(url) {
        $location.path(url);
        $location.replace();
        console.log("Navigation: url => " + url);
        return;
      },
      back: function(){
          window.history.back();
      }
    }
  }])

.factory('dataFactory', ['$base64', '$http', function($base64, $http) {

  var dataFactory = {};

  dataFactory.getEndpoints = function() {
    var items = localStorage.getItem("endpoints");

    if (items === null) {
      items = [{
        "i": "0",
        "name": "Kanboard.net Demopage",
        "token": "da2776e2c7ca07b2b1169099550aa4a197024f2f7aac21212682240acc3f",
        "url": "http://demo.kanboard.net/jsonrpc.php"
      }];
    }
    else {
      items = JSON.parse(items);
      for (var i = 0; i < items.length; i++) {
        items[i].id = i;
      }
    }

    return items;
  };

  dataFactory.setEndpoints = function(endpoints) {
    return localStorage.setItem("endpoints", JSON.stringify(endpoints));
  };

  dataFactory.getSettings = function() {
    var settings = {};
    settings = localStorage.getItem("settings");
    settings = JSON.parse(settings);
    return settings;
  };

  dataFactory.setSettings = function(settings) {
    return localStorage.setItem("settings", JSON.stringify(settings));
  };

  dataFactory.getBaseUrl = function(api_id) {
    var api_config = this.getEndpoints()[api_id - 1];
    return api_config.url;
  };

  dataFactory.createConfig = function(api_id) {
    var api_config = this.getEndpoints()[api_id - 1];
    var auth = $base64.encode('jsonrpc' + ':' + api_config.token);
    var config = {
      headers: {
        'Authorization': 'Basic ' + auth
      }
    };
    return config;
  };

  dataFactory.getProjects = function(api_id) {
    var request = '{"jsonrpc": "2.0", "method": "getAllProjects", "id": ' + api_id + '}';
    return $http.post(this.getBaseUrl(api_id) + '?getAllProjects', request, this.createConfig(api_id));
  };

  dataFactory.getBoard = function(api_id, projectid) {
    var request = '{"jsonrpc": "2.0", "method": "getBoard", "id": ' + api_id + ',"params": { "project_id": ' + projectid + ' }}';
    return $http.post(this.getBaseUrl(api_id) + '?getBoard', request, this.createConfig(api_id));
  };

  dataFactory.getProjectById = function(api_id, projectid) {
    var request = '{"jsonrpc": "2.0", "method": "getProjectById", "id": ' + api_id + ',"params": { "project_id": ' + projectid + ' }}';
    return $http.post(this.getBaseUrl(api_id) + '?getProjectById', request, this.createConfig(api_id));
  };

  dataFactory.getProjectActivity = function(api_id, projectid) {
    var request = '{"jsonrpc": "2.0", "method": "getProjectActivity", "id": ' + api_id + ',"params": { "project_id": ' + projectid + ' }}';
    return $http.post(this.getBaseUrl(api_id) + '?getProjectActivity', request, this.createConfig(api_id));
  };

  dataFactory.getTaskById = function(api_id, taskid) {
    var request = '{"jsonrpc": "2.0", "method": "getTask", "id": ' + api_id + ',"params": { "task_id": ' + taskid + ' }}';
    return $http.post(this.getBaseUrl(api_id) + '?getTask', request, this.createConfig(api_id));
  };

  dataFactory.getOverdueTasks = function(api_id) {
    var request = '{"jsonrpc": "2.0", "method": "getOverdueTasks", "id": ' + api_id + '}';
    return $http.post(this.getBaseUrl(api_id) + '?getOverdueTasks', request, this.createConfig(api_id));
  };

  return dataFactory;
}]);