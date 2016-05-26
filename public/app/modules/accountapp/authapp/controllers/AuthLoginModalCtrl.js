angular.module('AccountApp')
    .controller('AuthLoginModalCtrl', [
        '$scope',
        '$state',
        '$uibModalInstance',
        'AuthFct',
        'WizioConfig',
        function($scope, $state,$uibModalInstance, AuthFct, WizioConfig) {
            function modalDefaults(templateUrl, controller, accountType) {
                return {
                    backdrop: true,
                    keyboard: true,
                    modalFade: true,
                    templateUrl: templateUrl,
                    controller: controller,
                    resolve: {
                        data: function() {
                            return accountType;
                        }
                    }
                };
            }
            var authViews = WizioConfig.AccountAuthViewsURL;

            $scope.closeModal = function() {
                $uibModalInstance.close();
            };

            $scope.forgotPassword = function() {
                $state.go('SendResetEmail');
                return $uibModalInstance.close('ok');
            };

            $scope.requestLogin = function() {
                var userData = {
                    email: $scope.email,
                    password: $scope.password
                };
                AuthFct.signin(userData,
                    function(res) {
                        if(res !== 'failed'){
                            return $uibModalInstance.close('ok');
                        } else {
                            $scope.email = "";
                            $scope.password = "";
                        }

                    });
            };

        }
    ]);
