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
        'DashboardFct',
        function(
            $scope,
            $uibModalInstance,
            modalData,
            DashboardFct
        ) {
            alert('hello');
            $scope.handleSubmitClick = function () {
                alert('success');
                var state = modalData;
                var fileChooser = document.getElementById('file-chooser');
                var file = fileChooser.files[0];
                console.dir(state);
                if (file) {
                    DashboardFct.workflow.createTourAndFloorPlan(
                        state.address,
                        state.floorPlanModel,
                        file
                    )
                    .then(function(response){
                        LoadingSpinnerFct.hide('floorplanUpload');
                        $uibModalInstance.close(newState);
                    });
                } else {
                    alert("You haven't chosen a floor plan photo yet!");
                    return;
                }
            }
    }]);
