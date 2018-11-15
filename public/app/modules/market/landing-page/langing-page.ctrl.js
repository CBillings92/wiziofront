angular.module("MarketApp").controller("MarketLandingPageCtrl", [
  "$scope",
  "$state",
  "$q",
  "MarketFct",
  function($scope, $state, $q, MarketFct) {
    $scope.dataLoaded = false;
    $scope.marketSearch = {
      agentId: $state.params.agentid
    };

    addEventListener("load", initMarketLandingPage, false);

    function initMarketLandingPage() {
      var input = document.getElementById("search-bar");
      console.dir(input);
      autocomplete = new google.maps.places.Autocomplete(input, {
        types: ["geocode"]
      });
    }

    $scope.submitMarketSearch = function() {
      return $q(function(resolve, reject) {
        $scope.searchInProgress = true;

        MarketFct.addDataToLocalStore(
          "wizio",
          "lastMarketSearchCriteria",
          $scope.marketSearch
        );

        MarketFct.submitMarketSearch($scope.marketSearch)
          .then(function(response) {
            $scope.dataLoaded = true;
            MarketFct.addDataToLocalStore(
              "wizio",
              "listings",
              response.payload
            );
            $state.go("SearchMarket", { area: $scope.marketSearch.addressBar });
          })
          .catch(function(err) {
            console.error(err);
          });
      });
    };
  }
]);