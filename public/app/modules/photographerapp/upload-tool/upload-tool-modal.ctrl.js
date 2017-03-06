/* FILE SUMMARY
    for uploading new photos to floor plans. Floor plans need to have been uploaded
    prior (ususally by Devon) at /photographer/upload/floorplan. This app displays
    all units with non null Floor_Plan attributes in our database along with
    their photos. Allows for uploading of photos to S3 and associating pins
    and Wizio API.
*/
angular.module('UploadPageApp').controller('UploadPageNewCtrl', [
    '$scope',
    '$resource',
    '$q',
    'filterFilter',
    'WizioConfig',
    'ModalBuilderFct',
    'lodash',
    '$uibModalInstance',
    'TokenSvc',
    'UploadFct',
    'modalData',
    'LoadingSpinnerFct',
    'AWSFct',
    'MediaFct',
    function($scope, $resource, $q, filterFilter, WizioConfig, ModalBuilderFct, lodash, $uibModalInstance, TokenSvc, UploadFct, modalData, LoadingSpinnerFct, AWSFct, MediaFct) {
        console.dir(modalData);
        var movePinFlag = false;
        var selectedPinIndex;
        var apartmentAPIResource;
        var pinAPIResource;
        var buildModal = ModalBuilderFct.buildComplexModal;
        var SubscriptionPubId = TokenSvc.decode().Subscriptions[0].pubid;
        $scope.Apartment = modalData;
        console.dir(modalData.unitNum);
        $scope.fullAddress = $scope.Apartment + ' ' + $scope.Apartment.unitNum
        $scope.searchText = {
            concatAddr: ''
        };
        $scope.amenities = [];
        $scope.displayNoFloorplanMessage = false;
        $scope.amenities = [];
        $scope.selectedUnit = false;
        $scope.pins = [];
        $scope.uploaded = false;
        $scope.showAmenityButton = false;

        $scope.closeModal= function(){
            $uibModalInstance.close();
        }

        // On selecting a unit, load the floorplan image and pins/photos
        $scope.loadFloorplan = loadFloorplan;
        // On clicking on either a pin or the floorplan, remove, move or create a pin
        $scope.makePinAction = makePinAction;
        $scope.selectedSubscriptionApartmentPubId = null;
        /*  SUMMARY - called when an address is selected from the menu - loads the floorplan
            and the photos for the unit - subScope is `this` from the element
            click in the HTML
        */
        function loadFloorplan(subScope) {
            // get the Floor_Plan URL from the selected unit
            if(modalData.Floor_Plan){

                $scope.selectedFloorplan = "https://cdn.wizio.co/" + modalData.Apartment.SubscriptionApartmentPubId + '/floorplan.png';
            } else {
                $scope.displayNoFloorplanMessage = modalData.Floor_Plan ? false : true;

            }
            $scope.unit = modalData.Apartment;
            $scope.SubscriptionApartmentPubId = $scope.unit.SubscriptionApartmentPubId;
            $scope.showAmenityButton = true;

            // Get the media data for the apartment
            $resource(WizioConfig.baseAPIURL + 'subscriptionapartment/:SubscriptionPubId/:SubscriptionApartmentPubId', {
                SubscriptionPubId: '@SubscriptionPubId',
                SubscriptionApartmentPubId: '@SubscriptionApartmentPubId',
            })
            .query({
                SubscriptionPubId: SubscriptionPubId,
                SubscriptionApartmentPubId: SubscriptionApartmentPubId
            }, function(media){
                handleExistingPhotos(media);
            });

            // // get the photos associated with the unit selected - response is
            // // array of two arrays. First array is the array of photo OBJECTS
            // // second array is object with the unit Floor_Plan URL
            // $resource(WizioConfig.baseAPIURL + 'vr/listing/:apitoken/:pubid', {
            //     apitoken: '@apitoken',
            //     pubid: '@pubid'
            // }).query({
            //     apitoken: WizioConfig.static_vr.apikey,
            //     pubid: subScope.unit.pubid
            // }, function(response) {
            //     var media = response[0];
            //     // Handle whether there are or are not photos
            //     handleExistingPhotos(media);
            //
            //     return;
            // });
        }

        function handleExistingPhotos(unsortedMedia) {
            var sortedMedia;
            // Media is an object that contains media objects as keys.
            // If there are no keys, then there are no photos so create empty arrays
            // If there are photos, break the photos up into unit and non-unit photos
            console.dir(unsortedMedia);
            if(Object.keys(unsortedMedia).length === 0){
                console.dir(unsortedMedia);
                console.dir('unsortedMedia');
                $scope.amenities = [];
                $scope.pins = [];
                return;
            } else {
                // Break up the photos by unit and non-unit
                // false means it's not a unit photo, true means it is a unit photo
                sortedMedia = lodash.groupBy(unsortedMedia, "isUnit");
                // If there are non-unit photos,
                if(sortedMedia.false){
                    $scope.amenities = sortedMedia.false;
                } else {
                    $scope.amenities = [];
                }
                // Some photos in the database will have a NULL isUnit - makes it an ammenity
                $scope.amenities.concat(sortedMedia.null);

                // Check to see if there are any unit photos, if there are...
                if(sortedMedia.true){
                    $scope.pins = sortedMedia.true;
                    return;
                } else {
                    $scope.pins = [];
                    return;
                }
            }
        }

        function bulkUploadPhotos() {
          var key;
          var promises = [];
          console.dir($scope.amenities);

          for (var i = 0; i < $scope.files.length; i++) {
            console.dir(i);
            key = modalData.SubscriptionApartmentPubId + '/' + $scope.amenities[i].title + '.JPG';
            promises.push(
              AWSFct
              .s3
              .equirectPhotos
              .uploadTourPhoto($scope.files[i], key)
            );
          }
          console.dir(promises);
          $q.all(promises)
          .then(function(response){
            return MediaFct.save.bulk.media($scope.amenities)
          })
          .then(function(response){
              alert('Finished!')
          });
        }
        $scope.bulkUploadPhotos = bulkUploadPhotos;

        /*  SUMMARY - makePinAction(mouseEvent, subScope, clickOnFloorplan)
            mouseEvent provides us with the necessary coordinates for placing and
            moving pins. It also provides us with the ID of the pin that has been
            clicked on. We use REGEX to get the index number fouind within the ID
            of the pin ID to locate it in the pins array if it needs to be moved
            or removed
            poopie pooop poop poop
        */
        function makePinAction(mouseEvent, subScope, clickOnFloorplan) {
            // Only get the pin index (from the pin html id) when a pin was selected
            if (clickOnFloorplan === false) {
                var onlyNumbersPattern = /\d+/g;
                selectedPinIndex = Number(mouseEvent.target.id.match(onlyNumbersPattern)[0]);
            }

            // If statement handles logic for dictating what action to take
            // Either removal of a pin, moving a pin, or creating a new pin
            if (clickOnFloorplan === true && movePinFlag === false) {
                createPin(mouseEvent);
            } else if (clickOnFloorplan === true && movePinFlag === true) {
                movePin(mouseEvent);
            } else {
                choosePinActionModal(selectedPinIndex);
            }
        }

        $scope.makeAmmenityAction = function makeAmmenityAction(media) {
            media.SubscriptionApartmentPubId = $scope.selectedUnit.SubscriptionApartmentPubId;
            renameMedia(media);
        }

        // Used to calculate the pin X and Y based on the mouse click
        function calculatePinXandY(mouseEvent) {
            // hardcoded values account for the size of the rectangle pin image
            // so that the bottom of the pin is where the user clicks (not the
            // top left of the box the pin is in)
            var x = (((mouseEvent.offsetX - 17) / mouseEvent.target.clientWidth) * 100).toFixed(2);
            var y = (((mouseEvent.offsetY - 35) / mouseEvent.target.clientHeight) * 100).toFixed(2);

            return {x: x, y: y};
        }

        // For moving pins after they have been placed
        function movePin(mouseEvent){
            movePinFlag = false;

            // Calculate the new pin X and Y
            var newPinPosition = calculatePinXandY(mouseEvent);

            // Get the pin that will be moved
            var pinToMove = $scope.pins[selectedPinIndex];

            pinToMove.x = newPinPosition.x;
            pinToMove.y = newPinPosition.y;

            // send the new pin data to the API to be saved
            pinAPIResource.save(pinToMove, function(response){
                alert('saved');
                return;
            });
        }

        // For deleting a pin that has been placed already
        function deletePin(pin, callback){
            // Send the request to the API to have the media record deleted
            $resource(WizioConfig.baseAPIURL + 'unit/delete/pin')
            .save({pin: pin}, function(response){
                callback(response);
            });

        }

        // When a pin is clicked provide the user a modal with possible options
        // for the already placed pins
        function choosePinActionModal(selectedPinIndex) {
            buildModal('md', 'public/app/modules/photographerapp/upload/remove-pin.modal.view.html', 'RemovePinModalCtrl', $scope.pins).then(function(result) {
                switch (result) {
                    case 'removePin':
                    deletePin($scope.pins[selectedPinIndex], function(response){
                        selectedPinIndex = $scope.pins.splice(selectedPinIndex, 1);
                    })
                    break;
                    case 'movePin':
                    movePinFlag = true;
                    break;
                    case 'renamePhoto':
                      var selectedMedia = $scope.pins[selectedPinIndex];
                      selectedMedia.SubscriptionApartmentPubId = $scope.selectedUnit.SubscriptionApartmentPubId;
                      renameMedia($scope.pins[selectedPinIndex]);
                      break;
                    case 'cancel':
                    break;
                    default:
                }
            });
        }
        function renameMedia(media) {
            UploadFct.buildModal.renameMedia(media)
            .then(function(response){
                if(response === 'exit'){
                    return;
                } else {
                    alert('Photo Renamed Successfully');
                }
            });
        }
        // function for dropping a pin on the floorplan. e is the click event
        function createPin(e) {
            // hardcoded values account for the size of the rectangle pin image
            // so that the bottom of the pin is where the user clicks (not the
            // top left of the box the pin is in)
            var x = (((e.offsetX - 17) / e.target.clientWidth) * 100).toFixed(2);
            var y = (((e.offsetY - 35) / e.target.clientHeight) * 100).toFixed(2);

            // create the pin object to be saved to the database eventually (a
            // media object)
            var pin = {
                x: x,
                y: y,
                apartmentpubid: $scope.selectedUnit.pubid,
                isUnit: 1,
                type: 'vrphoto',
                title: null,
                awsurl: 'https://cdn.wizio.co/' + $scope.selectedUnit.pubid + '/',
                ApartmentId: $scope.selectedUnit.id,
                SubscriptionApartmentPubId: $scope.selectedUnit.SubscriptionApartmentPubId
            };

            // push this pin to the $scope.pins array - will display on the
            // floorplan at this point
            $scope.pins.push(pin);
            // call $scope.$apply to manually refresh scope - needed because of
            // disconnect between angular and vanilla JS
            // $scope.$apply();

            // build and display a modal with the templateUrl and controller,
            // pass the current pin as 'modalData' into the called modal controller
            buildModal('md', 'public/app/modules/photographerapp/upload/uploadphoto.modal.view.html', 'UploadPhotoModalCtrl', pin).then(function(response) {
                // result is what's passed back from modal button selection
                if(response.result === 'cancel'){
                    $scope.pins.pop();
                }
                $scope.uploaded=true;
                return response.photoTitle;
            });
        }

        $scope.previewPhoto = previewPhoto;

        function previewPhoto(photo, htmltag) {
          return $q(function(resolve, reject){

            var file    =photo;
            var reader  = new FileReader();

            reader.addEventListener("load", function () {
              htmltag.src = reader.result;
              console.dir('IN LOAD');
            }, false);

            if (file) {
              console.dir('IN IF');
              reader.readAsDataURL(file);
            }
          })
        }

        function uploadPhotos() {
          for (var i = 0; i < $scope.amenities.length; i++) {
            $scope.amenities[i]
          }
        }

        $scope.addAmenity = function addAmenity() {
            document.getElementById('uploadMultiplePhotosInputButton')
            .onchange = function(){
              $scope.amenities = [];
                var i = 0;
                var elementId = 'imgPreview';
                var preview;
                $scope.files = [];
                // LoadingSpinnerFct.show('upload-tool-photo-preview-spinner');
                while (i < this.files.length) {
                    console.dir(this.files[i]);
                    console.dir($scope.amenities);
                    this.files[i].name = 'Photo ' + i;
                    console.dir(this.files[i].name);
                    $scope.files.push(this.files[i]);
                    $scope.amenities.push({
                        x: null,
                        y: null,
                        apartmentpubid: modalData.pubid,
                        isUnit: 1,
                        type: 'vrphoto',
                        title: 'Photo ' + i,
                        awsurl: 'https://cdn.wizio.co/' + modalData.pubid + '/',
                        ApartmentId: $scope.selectedUnit.id,
                        SubscriptionApartmentPubId: modalData.SubscriptionApartmentPubId,
                        useremail: TokenSvc.decode().email,
                        token: TokenSvc.getToken()
                    })

                    $scope.$apply();
                    preview = document.getElementById(elementId + i);
                    previewPhoto(this.files[i], preview);
                    i++;
                }
                // LoadingSpinnerFct.hide('upload-tool-photo-preview-spinner');
            }
            $('#uploadMultiplePhotosInputButton').trigger('click');

            // buildModal('md', 'public/app/modules/photographerapp/upload/uploadphoto.modal.view.html', 'UploadPhotoModalCtrl', amenity).then(function(response) {
            //     // result is what's passed back from modal button selection
            //     $scope.uploaded=true;
            //     if(response.message === 'cancel'){
            //         return;
            //     } else if (response.message === 'success'){
            //         amenity.title = response.photoTitle;
            //         $scope.amenities.push(response.photo);
            //         return;
            //     }
            //     return;
            // });
            // var amenity = {
            //     x: null,
            //     y: null,
            //     apartmentpubid: $scope.selectedUnit.pubid,
            //     isUnit: 0,
            //     type: 'vrphoto',
            //     title: null,
            //     awsurl: 'https://cdn.wizio.co/' + $scope.selectedUnit.pubid + '/',
            //     ApartmentId: $scope.selectedUnit.id,
            //     SubscriptionApartmentPubId: $scope.selectedUnit.SubscriptionApartmentPubId
            // };
            // buildModal('md', 'public/app/modules/photographerapp/upload/uploadphoto.modal.view.html', 'UploadPhotoModalCtrl', amenity).then(function(response) {
            //     // result is what's passed back from modal button selection
            //     $scope.uploaded=true;
            //     if(response.message === 'cancel'){
            //         return;
            //     } else if (response.message === 'success'){
            //         amenity.title = response.photoTitle;
            //         $scope.amenities.push(amenity);
            //         return;
            //     }
            //     return;
            // });

        };

    }
]);
