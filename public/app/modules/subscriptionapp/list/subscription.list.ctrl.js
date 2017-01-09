angular.module('AccountApp')
    .controller('SubscriptionListCtrl', [
        '$scope',
        'SubscriptionFct',
        function($scope, SubscriptionFct) {
            // test
            SubscriptionFct.get.subscriptions()
            .then(function(response){
              $scope.subscriptions = response;
            });
            $scope.chooseSubscription = function chooseSubscription(subscription) {
                $scope.chosenSubscription = subscription;
            };

            $scope.changeSelected = function(selectedid) {

                $('.selected-plan').removeClass('selected-plan');

                var result = document.getElementById(selectedid);
                var target = angular.element(result);
                target.addClass("selected-plan");
            };

    }]);
