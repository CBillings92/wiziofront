angular.module('UnitApp').controller('TransitionUnitMediaCtrl', [
    '$scope',
    '$rootScope',
    '$state',
    '$resource',
    'WizioConfig',
    '$sce',
    'lodash',
    'ModalSvc',
    function($scope, $rootScope, $state, $resource, WizioConfig, $sce, lodash, ModalSvc) {
        var bodyTag = document.getElementsByTagName("BODY")[0];
        // var panelContainer;
        var apartmentpubid;
        var apitoken;
        var state = $state.current.name;
        var heightContainerElem = document.getElementById('height-container');
        // jquery workaround for vh and vw (doesn't work on apple);
        var windowHeight = $(window).height();

        // Set the margin bottom on the body to be 0 in the VR view - there is no footer
        heightContainerElem.style['padding-bottom'] = '0';

        heightContainerElem.style.height = windowHeight + 'px';

        if(state === 'NewExternalApi' || state === 'Demo'){
            bodyTag.style["margin-bottom"] = "0" ;
            $(window).resize(function(){
                heightContainerElem.style['padding-bottom'] = '0';
                heightContainerElem.style.height = $(window).height() + 'px';
            });
        }

        // For photo and floorplan selection
        $scope.selectPhoto = false;
        $scope.viewFloorPlan = false;

        // For styling VR player floorplan programatically
        $scope.style = 'margin: 0 auto; width:325px';

        // for loading CORS images....UGH
        $scope.trust = $sce;

        // If the state is the Demo page or Landing page, get the apitoken and
        // apartmentpubid from the config file, else get it from the state params
        switch (state) {
            case 'LandingPage':
                apitoken = WizioConfig.static_vr.apikey;
                apartmentpubid = WizioConfig.static_vr.landingpage.apartmentpubid;
                $scope.style = "margin: 0 auto;";
                break;
            case 'Demo':
                apitoken = WizioConfig.static_vr.apikey;
                apartmentpubid = WizioConfig.static_vr.demo.apartmentpubid;
                break;
            default:
                apitoken = $state.params.apitoken;
                apartmentpubid = $state.params.apartmentpubid;
        }

        // Get the floor plan and the apartment photos.
        $resource(WizioConfig.baseAPIURL + 'vr/listing/:apitoken/:apartmentid', {
            apitoken: '@apitoken',
            apartmentid: '@apartmentid'
        }).query({
            apitoken: apitoken,
            apartmentid: apartmentpubid
        }, function(result) {
            var media = result[0];
            $scope.floorplan = result[1].Floor_Plan;
            $scope.media = lodash.groupBy(media, 'type');

            var photoIndex;

            if (state === 'LandingPage') {
                //hardcoded
                photoIndex = 3;
            } else if (state === 'Demo') {
                photoIndex = 0;
            } else if (state === 'DemoOneBackBay') {
                photoIndex = 9;
            } else {
                photoIndex = 0;
            }

            // broadcasts a change photo event to our VR player directive
            $scope.$broadcast('CHANGE', {});

            // If the photo is stored in AWS
            if ($scope.media.vrphoto[0].awsurl) {
                // Set the photo index to the selected photo index
                $scope.photoIndex = photoIndex;
                // Get the photourl and set it on scope
                $scope.photoUrl = $scope.media.vrphoto[photoIndex].awsurl;
                // Broadcast to our VR player directive to load the new image
                $scope.$broadcast('IMGLOAD', {media: media});

                // Allow the user to change photos
                $scope.changePhoto = function(photoIndex) {
                    $scope.photoIndex = photoIndex;
                    $scope.photoUrl = $scope.media.vrphoto[photoIndex].awsurl;
                    $scope.$broadcast('CHANGE', {});
                };
            } else {
                console.dir(photoIndex + ' in bubl');
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
