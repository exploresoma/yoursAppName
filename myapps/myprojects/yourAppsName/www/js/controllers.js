angular.module('yourAppsName.controllers', [])

.controller('AppCtrl', function($scope, $ionicModal, $timeout) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  // Form data for the login modal
  $scope.loginData = {};

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.modal.hide();
  };

  // Open the login modal
  $scope.login = function() {
    $scope.modal.show();
  };

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    console.log('Doing login', $scope.loginData);

    // Simulate a login delay. Remove this and replace with your login
    // code if using a login system
    $timeout(function() {
      $scope.closeLogin();
    }, 1000);
  };
})

.controller('MyStocksCtrl', ['$scope',
  function($scope) {

    $scope.myStocksArray =[
      {ticker: "AAPL"},
      {ticker: "PFE"},
      {ticker: "FB"},
      {ticker: "NFLX"},
      {ticker: "BEN"},
      {ticker: "BRK-A"},
      {ticker: "INTC"},
      {ticker: "MSFT"},
      {ticker: "GE"},
      {ticker: "BAC"},
      {ticker: "C"},
      {ticker: "T"}
    ];
}])

.controller('StockCtrl', ['$scope', '$stateParams', '$window','stockDataService','dateTimeService','chartDataService',
  function($scope, $stateParams, $window, stockDataService, dateTimeService, chartDataService) {

    $scope.ticker = $stateParams.stockTicker;
    $scope.chartView = 4;
    $scope.oneYearAgeDate = dateTimeService.oneYearAgeDate();
    $scope.todayDate = dateTimeService.currentDate();

    //console.log(dateTimeService.currentDate());
    //console.log(dateTimeService.oneYearAgeDate());

    $scope.$on("$ionicView.afterEnter", function(){
      getPriceData();
      getDetailsData();
      getChartData();
    });

  $scope.chartViewFunc = function(n){
    $scope.chartView = n;
  };


  function getPriceData(){
      var promise = stockDataService.getPriceData($scope.ticker);
      promise.then(function(data){
      //  console.log(data);
        $scope.stockPriceData =data;
        if(data.chg_percent >= 0 && data !== null) {
          $scope.reactiveColor = {'background-color': '#33cd5f'};
        }else if (data.chg_percent < 0 && data !== null) {
          $scope.reactiveColor = {'background-color': '#ef473a'};
        }
      });
  }

  function getDetailsData(){
      var promise = stockDataService.getDetailsData($scope.ticker);
      promise.then(function(data){
        //console.log(data);
        $scope.stockDetailsData =data;
      });
  }

  function getChartData(){
    console.log("Before calling Chart service");
    var promise = chartDataService.getHistoricalData($scope.ticker, $scope.oneYearAgeDate, $scope.todayDate);
    promise.then(function(data){

      $scope.myData = JSON.parse(data)
        .map(function(series) {
          series.values = series.values.map(function(d) { return {x: d[0], y: d[1] }; });
          return series;
        });

    });
  }




  	var xTickFormat = function(d) {
  		var dx = $scope.myData[0].values[d] && $scope.myData[0].values[d].x || 0;
  		if (dx > 0) {
        return d3.time.format("%b %d")(new Date(dx));
  		}
  		return null;
  	};

    var x2TickFormat = function(d) {
      var dx = $scope.myData[0].values[d] && $scope.myData[0].values[d].x || 0;
      return d3.time.format('%b %Y')(new Date(dx));
    };

    var y1TickFormat = function(d) {
      return d3.format(',f')(d);
    };

    var y2TickFormat = function(d) {
      return d3.format('s')(d);
    };

    var y3TickFormat = function(d) {
      return d3.format(',.2s')(d);
    };

    var y4TickFormat = function(d) {
      return d3.format(',.2s')(d);
    };

    var xValueFunction = function(d, i) {
      return i;
    };

    var marginBottom = ($window.innerWidth /100 )*10;

  	$scope.chartOptions = {
      chartType: 'linePlusBarWithFocusChart',
      data: 'myData',
  		height: 500,
      margin: {top: 14, right: 20, bottom: marginBottom, left: 20},
      interpolate: "cardinal",
      useInteractiveGuideline: false,
      yShowMaxMin: false,
      tooltips: false,
      showLegend: false,
      useVoronoi: false,
      xShowMaxMin: false,
      xValue: xValueFunction,
      xAxisTickFormat: xTickFormat,
      x2AxisTickFormat: x2TickFormat,
      y1AxisTickFormat: y1TickFormat,
      y2AxisTickFormat: y2TickFormat,
      y3AxisTickFormat: y3TickFormat,
      y4AxisTickFormat: y4TickFormat,
      transitionDuration: 500,
      y1AxisLabel: 'Price',
      y3AxisLabel: 'Volume',
      noData: 'Loading data...'
  	};


}]);
