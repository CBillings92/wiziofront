angular.module('NavbarApp')
.controller('NavbarCtrl', [
    '$scope',
    '$state',
    function($scope, $state){
        $scope.goToLogin = function(){
            $state.go('Login');
        };
    }
]);
