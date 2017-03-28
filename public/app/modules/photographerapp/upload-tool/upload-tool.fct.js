angular.module('PhotographerApp')
    .factory('UploadToolFct', [
        '$q',
        '$resource',
        'lodash',
        'WizioConfig',
        'TokenSvc',
        'MediaFct',
        'AWSFct',
        function($q, $resource, lodash, WizioConfig, TokenSvc, MediaFct, AWSFct){
            var API = {
                subscriptionApartment: {
                    media: $resource(WizioConfig.baseAPIURL + 'subscriptionapartment/:SubscriptionPubId/:SubscriptionApartmentPubId', {
                            SubscriptionPubId: '@SubscriptionPubId',
                            SubscriptionApartmentPubId: '@SubscriptionApartmentPubId',
                        })
                },
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

            function sortMedia(unsortedMedia) {
                var sortedMedia = {
                    pins: [],
                    amenities: []
                };
                // Check to see if there are any photos for this SubscriptionApartment
                if(Object.keys(unsortedMedia).length === 0) {
                    return sortedMedia;
                } else {
                    sortedMedia = lodash.groupBy(unsortedMedia, "isUnit");

                    // store non-unit photos in 'amenities'
                    if (sortedMedia.false){
                        sortedMedia.amenities = sortedMedia.false;
                    }
                    // some media will have isUnit = nul, make these amenities
                    if (sortedMedia.null) {
                        sortedMedia.amenities.concat(sortedMedia.null);
                    }

                    // store the isUnit photos in the pins array
                    if (sortedMedia.true) {
                        sortedMedia.pins = sortedMedia.true;
                    } else {
                        sortedMedia.pins = [];
                    }
                    sortedMedia.newMedia = [];
                    return sortedMedia;
                }
            }
            // Initialize modal for choosing a unit to upload photos to
            function initializeChooseUnitModal() {
                return $q(function(resolve, reject){
                    API.apartment.chooseParams.query({
                        param1: 'id',
                        param2: 'pubid',
                        param3: 'concatAddr',
                        param4: 'unitNum',
                        param5: "Floor_Plan",
                        param6: TokenSvc.decode().Subscriptions[0].id
                    }, function(response){
                        // For each unit, add SubscriptionApartment object as key onto it
                        for(var i = 0; i < response.length; i++){
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
                return $q(function(resolve, reject){
                    // If there is a Floor Plan, create the URL for the floor plan
                    if (apartment.Floor_Plan) {
                        var key = subscriptionApartmentPubId + '/floorplan.png';
                        var modifiedKey = AWSFct.utilities.modifyKeyForEnvironment(key);
                        apartment.Floor_Plan = "https://cdn.wizio.co/" + modifiedKey;
                    }

                    // Query for the photos of the unit
                    API.subscriptionApartment.media.query({
                        SubscriptionPubId: TokenSvc.decode().Subscriptions[0].pubid,
                        SubscriptionApartmentPubId: subscriptionApartmentPubId
                    }, function(media){
                        return resolve(media);
                    })
                })
            }

            function bulkUploadPhotos(filesArray, apartment) {
                return $q(function (resolve, reject) {
                    var key;
                    var promises = [];

                    if (filesArray.length === 0) {
                        return reject('No Files To Upload');
                    }

                    for (var i = 0; i < filesArray.length; i++) {
                        key = apartment.SubscriptionApartmentPubId + '/' + apartment.sortedMedia.newMedia[i].title + '.JPG';
                        promises.push(AWSFct.s3.equirectPhotos.uploadTourPhoto(filesArray[i], key));
                        continue;
                    }

                    $q.all(promises)
                    .then(function(response){
                        return resolve('Finished');
                    })
                })
            }

            return {
                workflow: {
                    init: initializeUploadTool
                },
                sortMedia: sortMedia,
                bulkUploadPhotos: bulkUploadPhotos,
                initializeChooseUnitModal: initializeChooseUnitModal
            }
        }
    ])
