/*
    for uploading floorplans prior to fliming. Will create a building and unit
    in the database, and then send the floorplan to the S3 bucket, creating
    a new folder for the unit to have its photos stored eventually. Folder is
    the units pubid
*/
angular.module('PhotographerApp')
    .controller('UploadFloorPlanCtrl', [
        '$scope',
        '$uibModalInstance',
        'modalData',
        function(
            $scope,
            $uibModalInstance,
            modalData
        ) {

            $scope.handleSubmitClick = function () {
                alert('success');
                var state = modalData;
                var fileChooser = document.getElementById('file-chooser');
                var file = fileChooser.files[0];

                if (file) {
                    var newState = set_floor_plan_file(state, {action: 'set_floor_plan_file', file:file})
                    console.dir(newState);
                    $uibModalInstance.close(newState);
                } else {

                }

            }

            function set_floor_plan_file(state, action) {
                var newState = {};
                Object.assign(newState, state, {file: action.file});
                return newState;
            }
        /*
            saves tho floorplan image to S3, expects to receive the key which is
            a string that states what the folder name will be in S3 for the unit.
            should be the unit's public id.

            returns a promise
        */
        function saveFloorPlanToS3(key) {
            return new $q(function(resolve, reject){
                // use some vanillaJS to get the element that the floorplan will be uploaded on
                //grab the first file in the file array (our floorplan)
                //check if the file exists
                if (file) {

                    //parameters to be sent to S3 - key is the path in the S3 bucket
                    var params = {
                        Bucket: 'equirect-photos',
                        Key: key,
                        ContentType: file.type,
                        Body: file
                    };

                    //save the floorplan to S3
                    bucket.putObject(params, function(err, data) {
                        results.innerHTML = err ? 'ERROR!' : 'UPLOADED.';
                        resolve(data);
                    });
                } else {
                    reject('Could not reach S3 - Please yell at Cameron');
                }
            });
        }
        // //vanilla JS for uploading the photo
        // var button = document.getElementById('upload-button');
        // var results = document.getElementById('results');
        // button.addEventListener('click', function() {
        // }, false);
        $scope.closeModal = function(){
            $uibModalInstance.dismiss('exit');
        }
        //send apartemnt address and unit number to the backend
        function createAddress(){
            LoadingSpinnerFct.show("floorplanUpload");
            $scope.formSubmitted = true;
            var fileChooser = document.getElementById('file-chooser');
            var noFloorPlan = false;
            if(!fileChooser.files[0]){
                noFloorPlan = true;
            }
            $resource(apiurl + 'unit')
            .save({apartmentAddress: $scope.apartment.address, floorPlanModel: $scope.apartment.floorPlanModel, user: TokenSvc.decode(), noFloorPlan: noFloorPlan}, function(response){
                if(response.message){
                  alert("Apartment already created! Search for this apartment in your account's search bar, or search for it after selecting Modify Existing Tours on your account page");
                  LoadingSpinnerFct.hide("floorplanUpload");
                  return;
                } else {
                  var key = response.SubscriptionApartment.pubid + '/floorplan.png';
                  if($scope.noFloorPlanChkBox){
                    LoadingSpinnerFct.hide('floorplanUpload');
                    $scope.formSubmitted = false;
                    alert('Unit created without a floorplan. Please click ok to continue.');
                    $uibModalInstance.close('finished');
                    return;
                  } else {
                    saveFloorPlanToS3(key)
                    .then(function(response){
                      LoadingSpinnerFct.hide('floorplanUpload');
                      $scope.formSubmitted = false;
                      alert('finished');
                      $uibModalInstance.close('finished');
                    })
                    .catch(function (err) {
                      alert(err);
                      $scope.formSubmitted = false;
                    });
                  }
                }
            });
        }

        $scope.functions = {
            saveForm: createAddress
        };
        //get the google maps corrected data
        //save it to the database
        //return the address

    }]);