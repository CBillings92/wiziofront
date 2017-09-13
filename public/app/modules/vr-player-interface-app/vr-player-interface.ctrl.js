angular.module('TourApp')
.controller('VrPlayerInterfaceCtrl', [
    '$scope',
    '$state',
    '$resource',
    'lodash',
    'WizioConfig',
    'AWSFct',
    'LoadingSpinnerFct',
    '$sce',
    'ngDrift',
    'ModalBuilderFct',
    '$stateParams',
    function($scope, $state, $resource, lodash, WizioConfig, AWSFct, LoadingSpinnerFct, $sce, ngDrift, ModalBuilderFct, $stateParams) {
        $scope.isCollapsed = false;
        $scope.isRotating = false;
        $scope.hasAccelerometer = false;


        $scope.state = $state.current.name;
        $scope.showInterface = true;
        $scope.$on('InterfaceDataReceived', function(event, data){
          LoadingSpinnerFct.show('vrPlayerLoader');
            $scope.data = data;
            $scope.media = data.media;
            $scope.showInterface = data.showInterface;
            $scope.floorPlan = data.floorPlan;
            document.getElementById('pano').addEventListener('click', onTourClick, false);
        });

        $scope.$on('ToggleFloorPlan', function(event, data) {
            menuButtonAction('toggleFloorplan');
        });

        $scope.$on('TogglePhotoList', function(event, data) {
            menuButtonAction('togglePhotoList');

        });

        window.addEventListener("devicemotion", function(event){
            if(event.rotationRate.alpha || event.rotationRate.beta || event.rotationRate.gamma)
                $scope.hasAccelerometer = true;
        });


        function onTourClick(mouseEvent) {
          wizio.onClickTriggered(mouseEvent, function(response){
            var chosenImage;
            for (var i = 0; i < $scope.media.vrphoto.length; i++) {
              if ($scope.media.vrphoto[i].title === response.object.name) {
                chosenImage = $scope.media.vrphoto[i]
                break;
              }
            }
            wizio.changeImage(chosenImage, function(response){
              return response;
            })
          })
        }
        // For photo and floorplan selection
        $scope.selectPhoto = false;
        $scope.viewFloorPlan = false;

        /* If the state calls for a full screen VR Player, remove body styling and show controls */
        if ($scope.state === 'Tour' || $scope.state === 'Demo') {
            $scope.showcontrols = true;
            $scope.showcontactinfo = true;
            $scope.showpoweredby = true;
            document.getElementsByTagName('body')[0].style["padding-bottom"] = 0;
            document.getElementsByTagName('body')[0].style["margin-bottom"] = 0;
            document.getElementById('main-content').style["height"] = "100%";

        }

        $scope.onProductPage = false;

        if ($state.current.name === 'Product') {
            $scope.onProductPage = true;
        }



        /**
         * Toggles the accelerometer on the VR player library
         * @return {undefined} [undefined]
         */
        $scope.accelerometerToggle = function() {
            $scope.toggle = !$scope.toggle;
            $scope.isRotating = !$scope.isRotating;
            wizio.toggleAccelerometer();
            return;
        }

        //FIXME don't use JQuery..
        var moveSlider = function(direction) {  // direction is 1 for forward / -1 for backward
            width =  $("#scrollthis").width();
            el = $("#scrollthis");
            currentPosition = el.scrollLeft();
            moveWidth = width * 0.5 * direction;
            // el.scrollLeft(currentPosition + moveWidth);
            el.animate({
                scrollLeft: currentPosition + moveWidth
            }, 500, function () {
                $scope.sliderCanGoForward = $scope.canSliderForward();
                $scope.sliderCanGoBackward = $scope.canSliderBackward();
            });
        };

        $scope.sliderCanGoForward = true;
        $scope.sliderCanGoBackward = false;

        $scope.canSliderBackward = function() {
            return $("#scrollthis").scrollLeft() > 0;
        };

        $scope.canSliderForward = function() {
            el = $("#scrollthis");
            width =  el.outerWidth();
            currentPosition = el.scrollLeft();
            viewportWidth = el.width();
            return currentPosition + viewportWidth < width;
        };

        $scope.moveSliderBackward = function() {
            moveSlider(-1);
        };

        $scope.moveSliderForward = function() {
            moveSlider(1);
        };


        function menuButtonAction(action) {
            if (action === 'toggleFloorplan') {
                $scope.viewFloorPlan = !$scope.viewFloorPlan;
                if ($scope.selectPhoto && $scope.viewFloorPlan) {
                    $scope.selectPhoto = !$scope.selectPhoto;
                }
            } else {
                $scope.selectPhoto = !$scope.selectPhoto;
                if ($scope.viewFloorPlan && $scope.selectPhoto) {
                    $scope.viewFloorPlan = !$scope.viewFloorPlan
                }
            }
        }

        $scope.buttonAction = menuButtonAction;


        // Allow the user to change photos
        $scope.changePhoto = function(photoIndex) {
            // LoadingSpinnerFct.show('vrPlayerLoader');
            console.dir($scope.media.vrphoto[photoIndex]);
            wizio.changeImage($scope.media.vrphoto[photoIndex], function(response){
              wizio.toggleCoordCollection();
              $scope.selectPhoto = false;
              $scope.viewFloorPlan = false;
              // LoadingSpinnerFct.hide('vrPlayerLoader');
            });
        };

        $scope.thumbnailURL = function(photoIndex) {
          if (!$state.current.name === 'Demo') {
            var SubscriptionApartmentPubId = AWSFct.utilities.modifyKeyForEnvironment($scope.media.vrphoto[0].SubscriptionApartmentPubId);
          } else {
            var SubscriptionApartmentPubId = $scope.media.vrphoto[0].SubscriptionApartmentPubId;
          }
            return WizioConfig.CLOUDFRONT_DISTRO + "180x90/" + SubscriptionApartmentPubId + "/" + $scope.media.vrphoto[photoIndex].title + '.JPG';
        }

        var hideFloorPlanButton = false;
        $scope.viewFloorPlanFunc = function() {
            $scope.$emit('ToggleFloorPlan', {});
        }

        $scope.openCloseMenu = function() {
            $scope.menuIsOpen = !$scope.menuIsOpen;
            // set floorplan button visibility
            if($scope.floorPlan){
                $scope.actions[0].show = true;
            } else {
                $scope.actions[0].show = false;
            }
        };

        $scope.agent = {};
        $scope.blank = "https://s3.amazonaws.com/' + WizioConfig.S3_EQUIRECTPHOTOS_BUCKET  + '/blank.png";
        $scope.profileUploaded = false;

    if ($state.current.name == "Demo" || $state.current.name == "Product" ) {
        $resource(WizioConfig.baseAPIURL + '/activelisting/0a68e5a9-da00-11e6-85e0-0a8adbb20c4d').query(function(response){
            $scope.profileUploaded = true;
            $scope.agent = {
                firstName: "Devon",
                lastName: "Grodkiewicz",
                email: "devon@wizio.co",
                awsProfilePhotoUrl: "https://cdn.wizio.co/profile-photos/Devon_Grodkiewicz_35.png",
                state: $state.current.name
            };

        });
    } else {
        $resource(WizioConfig.baseAPIURL + 'activelisting/:activelistingid', {activelistingid: '@activelistingid'}).query(
            {
                activelistingid: $stateParams.activelistingid
            },
            function(response) {
                $scope.agent = response[response.length - 1];
                $scope.profileUploaded = $scope.agent.awsProfilePhotoUrl;
                $scope.agent.state = $state.current.name;

            });

    }


    $scope.launchAgentProfileModal = function() {
        $scope.viewFloorPlan = false;

        ModalBuilderFct.buildComplexModal(
            'md',
            '/public/app/modules/vr-player-interface-app/modal/agent-profile-modal.view.html',
            'AgentProfileModalCtrl',
            $scope.agent)
            .then(function(response) {

            });
        };
    }
])
