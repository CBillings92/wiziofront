angular.module('PhotographerApp').factory('UploadToolFct', [
    '$q',
    '$resource',
    'lodash',
    'WizioConfig',
    'ModalBuilderFct',
    'TokenSvc',
    'MediaFct',
    'AWSFct',
    function($q, $resource, lodash, WizioConfig, ModalBuilderFct, TokenSvc, MediaFct, AWSFct) {
        var API = {
            subscriptionApartment: {
                media: $resource(WizioConfig.baseAPIURL + 'subscriptionapartment/:SubscriptionPubId/:SubscriptionApartmentPubId', {
                    SubscriptionPubId: '@SubscriptionPubId',
                    SubscriptionApartmentPubId: '@SubscriptionApartmentPubId'
                })
            },
            media: $resource(WizioConfig.baseAPIURL + 'media'),
            apartment: {
                chooseParams: $resource(WizioConfig.baseAPIURL + 'apartment/chooseparams/:param1/:param2/:param3/:param4/:param5/:param6', {
                    param1: '@id',
                    param2: '@pubid',
                    param3: '@concatAddr',
                    param4: '@unitNum',
                    param5: '@Floor_Plan',
                    param6: '@subscriptionPubId'
                })
            }
        }

        // builds the modal and handles the logic for renaming media objects
        // returns a promise from the $q library
        function renameMedia(mediaObj) {
            return $q(function(resolve, reject) {
                ModalBuilderFct.buildComplexModal('md', WizioConfig.uploadViews.modals.renameMedia, 'RenameMediaCtrl', mediaObj).then(function(response) {
                    resolve(response);
                });
            })
        }

        function sortMedia(mediaArray) {
            var sortedMedia = {
                pins: [],
                photos: mediaArray,
                newMedia: []
            };
            return sortedMedia;
        }
        // Initialize modal for choosing a unit to upload photos to
        function initializeChooseUnitModal() {
            return $q(function(resolve, reject) {
                API.apartment.chooseParams.query({
                    param1: 'id',
                    param2: 'pubid',
                    param3: 'concatAddr',
                    param4: 'unitNum',
                    param5: "Floor_Plan",
                    param6: TokenSvc.decode().Subscriptions[0].id
                }, function(response) {
                    // For each unit, add SubscriptionApartment object as key onto it
                    for (var i = 0; i < response.length; i++) {
                        response[i].SubscriptionApartment = {
                            pubid: response[i].pubid
                        };
                    }

                    return resolve(response);
                });
            })
        }
        /*
                Get the photo data for the given SubscriptionApartment for the upload tool.
            */
        function initializeUploadTool(apartment, subscriptionApartmentPubId) {
            return $q(function(resolve, reject) {
                // If there is a Floor Plan, create the URL for the floor plan
                if (apartment.Floor_Plan) {
                    var key = subscriptionApartmentPubId + '/floorplan.png';
                    var modifiedKey = AWSFct.utilities.modifyKeyForEnvironment(key);
                    apartment.Floor_Plan = WizioConfig.CLOUDFRONT_DISTRO + modifiedKey;
                }

                // Query for the photos of the unit
                API.subscriptionApartment.media.query({
                    SubscriptionPubId: TokenSvc.decode().Subscriptions[0].pubid,
                    SubscriptionApartmentPubId: subscriptionApartmentPubId
                }, function(media) {
                    return resolve(media);
                })
            })
        }

        // Save one media object to the Wizio DB. Must be a properly formed
        // Media object
        function savePhotoToWizioAPI(mediaObject) {
            return $q(function(resolve, reject) {
                // send the object to the API
                API.media.save(mediaObject, function(response) {
                    return resolve(response);
                })
            })
        }

        /*
            Create an array of 1-100, find the numbers that are already taken, remove
            those from the array of 1-100, then loop over the new photos and assign them
            names based on this array of all available numbers
        */
        function autoNameNewPhotos(photos) {
            var unavailNums = [];
            var availNums = [];
            var getNumRegex = /\d+/;
            var currPhoto;
            // Get all photos with the name of Photo ## and store the ## as unavailable
            for (var i = 0; i < photos.length; i++) {
                currPhoto = photos[i];
                if (currPhoto.title.substr(0, 5) === 'Photo') {
                    unavailNums.push(Number(currPhoto.title.match(getNumRegex)));
                }
            };
            // Create arary of all possible numbers 1-100
            for (var i = 0; i <= 100; i++) {
                availNums.push(i);
            }
            // Remove all unavailable numbers from availNums array
            for (var i = 0; i < unavailNums.length; i++) {
                for (var j = 0; j < availNums.length; j++) {
                    if(unavailNums[i] === availNums[j]){
                        availNums.splice(j,1);
                        break;
                    };
                };
            };
            // Loop over new photos and assign name based on availNums array
            for (var i = 0; i < photos.length; i++) {
                if (photos[i].isNew) {
                    photos[i].title = 'Photo ' + availNums[i];
                    photos[i].file.name = 'Photo ' + availNums[i];
                }
            }
            return photos;
        }

        /**
         * Bulk upload photos and update non-new photos. Send new photos
         * to S3 and save/update data in the database.
         * @param  {Object} apartment Contains photo data/photo files and apartment data
         * @return {[type]}           [description]
         */
        function bulkUploadPhotos(apartment) {
            return $q(function(resolve, reject) {
                var subscriptionApartmentPubId = apartment.SubscriptionApartment.pubid;
                var photos = apartment.sortedMedia.photos;
                var email = TokenSvc.decode().email;
                var key;
                var s3Promises = [];
                var wizioAPIPromises = [];

                /*
                    Find new photos and pass them to uploadTourPhoto which
                    returns a promise. Push that promise to an array.
                 */
                for (var i = 0; i < photos.length; i++) {
                    if(photos[i].isNew) {
                        key = subscriptionApartmentPubId + '/' + photos[i].title + '.JPG';
                        s3Promises.push(AWSFct.s3.equirectPhotos.uploadTourPhoto(photos[i].file, key));
                    }
                }
                // return;
                /*
                    If there are new photos to upload, wait for the s3
                    promises array to finish, then call the Wizio save/update
                    promises. Otherwise just call the wizio update promises
                 */
                if (s3Promises.length > 0) {
                    $q.all(s3Promises).then(function(response){
                        for (var i = 0; i < photos.length; i++) {
                            photos[i].userEmail = TokenSvc.decode().email;
                            wizioAPIPromises.push(savePhotoToWizioAPI(photos[i]));
                        }
                        $q.all(wizioAPIPromises).then(function(response){
                            return resolve('Finished');
                        })
                    })
                } else {
                    for (var i = 0; i < photos.length; i++) {
                        photos[i].userEmail = TokenSvc.decode().email;
                        wizioAPIPromises.push(savePhotoToWizioAPI(photos[i]));
                    }
                    $q.all(wizioAPIPromises).then(function(response){
                        return resolve('Finished');
                    })
                }

            })
        }

        return {
            workflow: {
                init: initializeUploadTool
            },
            sortMedia: sortMedia,
            bulkUploadPhotos: bulkUploadPhotos,
            initializeChooseUnitModal: initializeChooseUnitModal,
            autoNameNewPhotos: autoNameNewPhotos,
            renameMedia: renameMedia,
            saveOnePhotoToWizioAPI: savePhotoToWizioAPI
        }
    }
])
