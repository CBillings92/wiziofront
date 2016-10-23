angular.module('UnitApp')
.controller('TransitionUnitMediaCtrl', [
    '$scope',
    '$rootScope',
    '$state',
    '$resource',
    'WizioConfig',
    '$sce',
    'lodash',
    'ModalSvc',
    function($scope, $rootScope, $state, $resource, WizioConfig, $sce, lodash, ModalSvc) {
        var panelContainer, apartmentpubid, apitoken;
        var state = $state.current.name;
        $scope.selectPhoto = false;
        $scope.style = 'margin: 0 auto;';

        panelContainer = document.getElementById('panel-container');
        panelContainer.addEventListener('click', togglePanel, false);
        // floor plan animation
        var panelOpened = false;

        function togglePanel() {
            panelOpened = !panelOpened;
            if (panelOpened) {
                this.classList.add('open');
                this.classList.remove('close');
            } else {
                this.classList.add('close');
                this.classList.remove('open');
            }
        }
        // end floorplan animation and controls

        // for loading CORS images....UGH
        $scope.trust = $sce;

        //get parameters from URL
        switch (state) {
            case 'LandingPage':
                apitoken = WizioConfig.static_vr.apikey;
                apartmentpubid = WizioConfig.static_vr.landingpage.apartmentpubid;
                break;
            case 'Demo':
                apitoken = WizioConfig.static_vr.apikey;
                apartmentpubid = WizioConfig.static_vr.demo.apartmentpubid;
                $scope.style = $scope.style + ' width:325px;';
                console.dir($scope.style);
                break;
            default:
                apitoken = $state.params.apitoken;
                apartmentpubid = $state.params.apartmentpubid;
        }
        $resource(WizioConfig.baseAPIURL + 'vr/listing/:apitoken/:apartmentid', {
            apitoken: '@apitoken',
            apartmentid: '@apartmentid',
        }).query({
            apitoken: apitoken,
            apartmentid: apartmentpubid
        }, function(result) {
            var media = result[0];
            $scope.floorplan = result[1].Floor_Plan;
            $scope.media = lodash.groupBy(media, 'type');

            console.dir($scope.media);
            var photoIndex;
            if(state === 'LandingPage'){
                //hardcoded
                photoIndex = 3;
            } else if(state === 'Demo') {
                photoIndex = 0;
            } else if(state === 'DemoOneBackBay') {
                photoIndex = 9;
            } else {
                photoIndex = 0;
            }
            if ($scope.media.vrphoto[0].awsurl) {
                // $scope.media.vrphoto = vrphotos;
                $scope.photoIndex = photoIndex;
                $scope.photoUrl = $scope.media.vrphoto[photoIndex].awsurl;
                $scope.$broadcast('IMGLOAD', {
                    media: media
                });
                // $scope.media.vrphoto = vrphotos;
                $scope.changePhoto = function(photoIndex) {
                    $scope.photoIndex = photoIndex;
                    $scope.photoUrl = $scope.media.vrphoto[photoIndex].awsurl;
                    $scope.$broadcast('CHANGE', {});
                };
            } else {
                $scope.photoUrl = $scope.media.vrphoto[photoIndex].link;
                $scope.changePhoto = function(photoIndex) {
                    $scope.photoUrl = $scope.media.vrphoto[photoIndex].link;
                };
                $scope.trust = $sce;
            }

            $scope.trust = $sce;
            $scope.mediaTab = 'unitPhotos';
        });
    }
]);