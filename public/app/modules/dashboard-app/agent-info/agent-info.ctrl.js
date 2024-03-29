angular.module('DashboardApp').controller('AgentInfoCtrl', [
    '$scope',
    '$state',
    'AgentInfoFct',
    function($scope, $state, AgentInfoFct) {

        /**
         * Saves profile photo for current user to their profile
         * @return {} [description]
         */
        $scope.saveProfilePhoto = function() {

            var fileChooser = document.getElementById('file-chooser');
            //grab the first file in the file array (our floorplan)
            var file = fileChooser.files[0];
            AgentInfoFct.saveProfilePhoto(file)
            .then(function(response){
                return
            });
        }

        /**
         * Save the phone number of the current user to their profilePhotos
         * @return {} [description]
         */
        $scope.savePhoneNumber = function() {
            if ($scope.phoneNumber !== '' && $scope.phoneNumber.length >= 7) {
                AgentInfoFct.savePhoneNumber($scope.phoneNumber)
                    .then(function(response){
                        return;
                    })
            }

        }
    }
])
