angular.module("yourAppsName.services",[])

.factory('encodeURIService', function(){
  return {
    encode: function(string){
      //console.log(string);
      return encodeURIComponent(string)
        .replace(/\"/g, "%22")
        .replace(/\ /g, "%20")
        .replace(/[!'()]/g, escape);
    }
  };
})

.factory('dateTimeService', function($filter){

  var currentDate = function(){
    var d = new Date();
    var date = $filter('date')(d,'yyyy-MM-dd');
    return date;
  };

  var oneYearAgeDate = function(){
    var d = new Date(new Date().setDate(new Date().getDate()-365));
    var date = $filter('date')(d,'yyyy-MM-dd');
    return date;
  };

  return{
    currentDate: currentDate,
    oneYearAgeDate: oneYearAgeDate
  };

})

.factory('notesCacheService', function(CacheFactory){
  var notesCache;
  if(!CacheFactory.get('notesCache')) {

    notesCache = CacheFactory('notesCache', {
      storageMode: 'localStorage'
    });
  }
  else {
    notesCache = CacheFactory.get('notesCache');
  }

  return notesCache;
})

.factory('chartDataCacheService', function(CacheFactory){
  var chartDataCache;
  if(!CacheFactory.get('cacheDataCache')) {

    chartDataCache = CacheFactory('cacheDataCache', {
      maxAge: 60 * 60 * 8 * 1000,
      deleteOnExpire: 'aggressive',
      storageMode: 'localStorage'
    });
  }
  else {
    chartDataCache = CacheFactory.get('cacheDataCache');
  }

  return chartDataCache;
})


.factory('stockDataService', function($q,$http, encodeURIService){


  var getDetailsData =  function(ticker){

    var deferred = $q.defer(),
    query = 'select * from yahoo.finance.quotes where symbol in ("'+ticker+'")',
    url = 'http://query.yahooapis.com/v1/public/yql?q='+encodeURIService.encode(query)+'&format=json&env=store://datatables.org/alltableswithkeys';
    //console.log(url);

    $http.get(url)
    .success(function(json){
      //console.log(json.data.list.resources[0].resource.fields);
      //console.log(url);
      //console.log(json);
      var jsonData = json.query.results.quote;
      deferred.resolve(jsonData);
    })
    .error(function (error){
      console.log("Details data error: " + error );
      deferred.reject();
    });

    return deferred.promise;
  };

  var getPriceData =  function(ticker){

    var deferred = $q.defer(),
    url = "http://finance.yahoo.com/webservice/v1/symbols/" + ticker + "/quote?format=json&view=detail";
    $http.get(url)
    .success(function(json){
      //console.log(json.data.list.resources[0].resource.fields);
      //console.log(url);
      //console.log(json);
      var jsonData = json.list.resources[0].resource.fields;
      deferred.resolve(jsonData);
    })
    .error(function (error){
      console.log("Price data error: " + error );
      deferred.reject();
    });

    return deferred.promise;
  };


  return {
    getPriceData: getPriceData,
    getDetailsData: getDetailsData
  };
})


.factory('chartDataService', function($q,$http, encodeURIService, chartDataCacheService){

  var getHistoricalData = function (ticker, fromDate, todayDate){
    var deferred = $q.defer(),
    cacheKey = ticker,
    chartDataCache =  chartDataCacheService.get(cacheKey),
    query = 'select * from yahoo.finance.historicaldata where symbol = "'+ticker+'" and startDate = "'+fromDate+'" and endDate = "'+todayDate+'"';
    url = 'http://query.yahooapis.com/v1/public/yql?q='+encodeURIService.encode(query)+'&format=json&env=store://datatables.org/alltableswithkeys';

    if(chartDataCache)
    {
      deferred.resolve(chartDataCache);
    }else {
      $http.get(url)
      .success(function(json){
        //console.log(json.data.list.resources[0].resource.fields);
        //console.log(url);
        //console.log(json);
        var jsonData = json.query.results.quote;

        var priceData = [],
        volumeData =[];

        jsonData.forEach(function(dayDataObject){
          //console.log(dayDataObject);

          var dateToMills = dayDataObject.Date,
          date = Date.parse(dateToMills),
          price = parseFloat(Math.round(dayDataObject.Close*100)/100).toFixed(3),
          volume = dayDataObject.Volume,

          volumeDatum = '['+date+','+volume+']',
          priceDatum = '['+date+','+price+']';

          // console.log(volumeDatum,priceDatum);

          volumeData.unshift(volumeDatum);
          priceData.unshift(priceDatum);

        }) ;  //end of for each loop

        var formattedChartData =
        '[{'+
        			'"key":'+ '"volume",'+
        			'"bar":'+ 'true,'+
        			'"values":'+ '['+volumeData+']'+
        		'},'+
        		'{'+
        			'"key":'+ '"'+ticker+'",'+
        			'"values":'+ '['+priceData+']'+
        	'}]';

        deferred.resolve(formattedChartData);
        chartDataCacheService.put(cacheKey, formattedChartData);
      })
      .error(function (error){
        console.log("Details data error: " + error );
        deferred.reject();
      });
    }



    return deferred.promise;

  };

  return {
    getHistoricalData: getHistoricalData
  };
})



.factory('notesService', function(notesCacheService){
  return {
    getNotes: function(ticker){
      return notesCacheService.get(ticker);
    },
    addNote: function(ticker, note){
      var stockNotes = [];
      if(notesCacheService.get(ticker)){
        stockNotes = notesCacheService.get(ticker);
        stockNotes.push(note);
      } else {
        stockNotes.push(note);
      }
      notesCacheService.put(ticker, stockNotes);
    },
    deleteNote: function(ticker, index){

      var stockNotes = [];
      stockNotes = notesCacheService.get(ticker);
      stockNotes.splice(index, 1);
      notesCacheService.put(ticker, stockNotes);
    }
  };
})

.factory('newsService', function($q, $http){
  return {
    getNews: function(ticker) {
      var deferred = $q.defer(),
      x2js = new X2JS(),
      url = "https://feeds.finance.yahoo.com/rss/2.0/headline?s=" + ticker + "&region=US&lang=en-US";
      // "http://finance.yaho.com/rss/headline?s="+ticker;
      $http.get(url)
      .success(function (xml){
        var xmlDoc = x2js.parseXmlString(xml),
        json = x2js.xml2json(xmlDoc),
        jsonData = json.rss.channel.item;
        deferred.resolve(jsonData);

      })
      .error(function(error){
        deferred.reject();
        console.log("News Error ... "+ error);
      });

      return deferred.promise;
    }
  };
})
;
