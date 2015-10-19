angular.module('UnitApp')
    .controller('UnitDetailCtrl', [
        '$scope',
        '$state',
        '$stateParams',
        '$sessionStorage',
        '$modal',
        'lodash',
        'ApartmentGetSetSvc',
        'UnitResource',
        'AuthFct',
        'MapFct',
        'TokenSvc',
        'ProfileResource',
        'FlexGetSetSvc',
        function(
            $scope,
            $state,
            $stateParams,
            $sessionStorage,
            $modal,
            lodash,
            ApartmentGetSetSvc,
            UnitResource,
            AuthFct,
            MapFct,
            TokenSvc,
            ProfileResource,
            FlexGetSetSvc
        ) {
            //modal function
            var modal = function(templateUrl, controller, size){
                var modalInstance = $modal.open({
                    templateUrl: templateUrl,
                    controller: controller,
                    size: size
                });
                return modalInstance;
            };
            //check that the correct apartment is getting pulled
            ApartmentGetSetSvc.checkApartment(function(result) {
                $scope.apartment = result;
                MapFct.makeMap($scope.apartment, $scope);
            });
            //LOAD APARTMENT DATA end
            $scope.apply = function() {
                if(TokenSvc.checkExp()){
                    TokenSvc.deleteToken();
                    alert('Please login');
                    return $state.go('Login');
                }
                //get user data
                var user = TokenSvc.decode();
                //set apartment data and store that data in sessionStorage variable
                ApartmentGetSetSvc.set($scope.apartment, "apartmentApplyingTo");
                //If the user doesn't have a profile
                console.dir(user.ProfileId);
                if (user.ProfileId === null) {
                    //call modal function
                    var modalInstanceCreate = modal('public/viewtemplates/public/createprofilemodal.html', 'ProfileCreateModalCtrl', 'md');

                    modalInstanceCreate.result.then(function(result) {
                        $state.go('Profile.Create');
                    }, function() {

                    });
                } else {
                    //call modal function
                    ProfileResource.get({id: user.ProfileId}, function(data){
                        if(data){
                            console.dir(data);
                            var modalInstanceVerify = modal('public/app/modules/AccountApp/profileapp/viewtemplates/profileexistsmodal.html', 'ProfileExistsModalCtrl', 'lg');

                            modalInstanceVerify.result.then(function(result) {
                                switch(result){
                                    case "ok":
                                        $state.go('ApartmentApplication');
                                        break;
                                    case "edit":
                                        console.dir(data);
                                        FlexGetSetSvc.set(data);
                                        console.dir(FlexGetSetSvc.get());
                                        $state.go('Profile.Edit');
                                        break;
                                    default:
                                        alert('ERROR');
                                }
                            }, function() {
                                alert('MODAL DISMISSED');
                            });
                        } else {
                            //handle
                        }
                    });

                }
            };
        }
    ]);
