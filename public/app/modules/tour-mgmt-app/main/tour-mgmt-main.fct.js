angular.module('TourMgmtApp')
  .factory('TourMgmtFct', [
    '$q',
    '$resource',
    '$stateParams',
    '$sessionStorage',
    'AWSFct',
    'TokenSvc',
    'WizioConfig',
    'ModalBuilderFct',
    function($q, $resource, $stateParams, $sessionStorage, AWSFct, TokenSvc, WizioConfig, ModalBuilderFct) {

      var API = {
        subscriptionApartment: {
          media: $resource(WizioConfig.baseAPIURL + 'subscriptionapartment/:SubscriptionPubId/:SubscriptionApartmentPubId', {
            SubscriptionPubId: '@SubscriptionPubId',
            SubscriptionApartmentPubId: '@SubscriptionApartmentPubId'
          })
        },
        media: $resource(WizioConfig.baseAPIURL + 'media'),
        subscriptionAptMedia: $resource(WizioConfig.baseAPIURL + 'subscriptionaptmedia'),
        apartment: {
          chooseParams: $resource(WizioConfig.baseAPIURL + 'apartment/chooseparams/:param1/:param2/:param3/:param4/:param5/:param6', {
            param1: '@id',
            param2: '@pubid',
            param3: '@concatAddr',
            param4: '@unitNum',
            param5: '@Floor_Plan',
            param6: '@subscriptionPubId'
          }),
          updateFloorPlan: $resource(WizioConfig.baseAPIURL + 'apartment/update/floorplan', {
            SubscriptionPubId: '@SubscriptionApartmentPubId',
            ApartmentId: '@ApartmentId'
          })
        }
      }


      /** initTourMgmtMainApp() description
       * initialize the tour management application.
       * -First- get data from either
       *  $stateParams or sessionStorage. if neither of these have data kick user
       *  back to Dashboard.
       * -Second- build floor plan URL if the tour has a floor plans
       * -Third- check if the data is already formatted (from session), if it is
       *  don't request data from the API again
       * -Fourth- If data is not formatted, request data from API
       * -Fifth- IF data is properly returned from API, format data
       * -Sixth- Once data is formatted, save to sessionStorage
       * @return {promise} [Object of formatted data for TourMgmtApp]
       */
      function initTourMgmtMainApp() {
        return $q(function(resolve, reject) {

          /* Get data used to initialize TourManagementApp */
          var data = getInitializationData();

          /* If there is no data in sessionStorage or state params, rerout to dashboard */
          if (data === false) {
            reject({
              status: 'err',
              message: 'Cannot access data. Please try again later.',
              payload: null
            })
          }

          /* If the apartment has a floorplan associated with it */
          if (data.Apartment.Floor_Plan) {
            data.Apartment.Floor_Plan = buildFloorPlanUrl(data.SubscriptionApartment.pubid)
          }
          console.dir(data);
          if (data.formatted) {
            /* On page refresh purge any non uploaded data */
            data.TourMedia = purgeDataOnPageRefresh(data);
            return resolve({
              status: 'success',
              message: 'Data retrieved from session',
              payload: $sessionStorage.TourMgmtApp.data
            });
          } else {

            /* Get photos associated with the tour */
            API.subscriptionApartment.media.get({
              SubscriptionPubId: TokenSvc.decode().Subscriptions[0].pubid,
              SubscriptionApartmentPubId: data.SubscriptionApartment.pubid
            }, function(response) {
              /* If response was successful, format data and return promise */
              if (response.status === 'success') {
                data.TourMedia = response.payload;
                var formattedData = formatData(data);
                if (formattedData.formatted) {
                  $sessionStorage.TourMgmtApp.data = formattedData;
                  return resolve({
                    status: 'success',
                    message: 'success',
                    payload: formattedData
                  })
                } else {
                  return reject({
                    status: 'err',
                    message: 'Could not format data at this time. Data may be missing',
                    payload: null
                  })
                }
              } else {
                return reject({
                  status: 'err',
                  message: 'Could not retrieve data at this time. Please try again later.',
                  payload: null
                });
              }
            })
          }

        })
      }

      /** buildFloorPlanUrl() descripition
       * [buildFloorPlanUrl, modify key based on env code is running in]
       * @param  {string} subscriptionApartmentPubId [36 char pubid of SubscriptionApartment]
       * @return {string}                            [URL for floorplan]
       */
      function buildFloorPlanUrl(subscriptionApartmentPubId) {
        var key = subscriptionApartmentPubId + '/floorplan.png';
        var modifiedKey = AWSFct.utilities.modifyKeyForEnvironment(key);
        var floorPlanUrl = WizioConfig.CLOUDFRONT_DISTRO + modifiedKey;
        return floorPlanUrl;
      }

      /** getInitializationData() description
       * Check if $stateParams came with data. If it didn't page was navigated to
       * directly or was reloaded. Check $sessionStorage for data. If sessionStorage
       * doesn't have data, return false to kick user back to dashboard
       * @return {[type]} [description]
       */
      function getInitializationData() {
        console.dir($stateParams.data);
        if ($stateParams.data) {
          console.dir($stateParams.data);
          $stateParams.data.newTour = $stateParams.action === 'ModifyTour' ? 0 : 1;
          $sessionStorage.TourMgmtApp = {
            data: $stateParams.data,
            action: $stateParams.action
          };
          return data = $stateParams.data;
        } else if ($sessionStorage.TourMgmtApp.data && $sessionStorage.TourMgmtApp.action === 'ModifyTour') {
          return data = $sessionStorage.TourMgmtApp.data;
        } else {
          return false;
        }
      }

      function purgeDataOnPageRefresh(data) {
        for (var i = data.TourMedia.photos.length - 1; i >= 0; i--) {
          if (data.TourMedia.photos[i].isNew) {
            data.TourMedia.photos.splice(i, 1);
          }
        }
        data.TourMedia.floorplan = null;
        data.TourMedia.pins = [];
        return data.TourMedia;
      }

      /** formatData() description
       * Foramt data for TourMgmtApp.
       * @param  {Object} data [unformatted object of data for TourMgmtApp]
       * @return {Object}      [Object of data either unformatted or formatted]
       */
      function formatData(data) {
        var formattedData = {};
        if (data.Apartment && data.SubscriptionApartment.pubid) {
          console.dir($stateParams.action);
          if ($stateParams.action === 'CreateTour') {
            formattedData = {
              Apartment: data.Apartment,
              SubscriptionApartment: data.SubscriptionApartment,
              TourMedia: {
                photos: [],
                floorplan: null
              },
              formatted: 1,
              newTour: 1
            }
          } else if ($stateParams.action === 'ModifyTour' && data.TourMedia) {
            formattedData = {
              Apartment: data.Apartment,
              SubscriptionApartment: {
                pubid: data.SubscriptionApartment.pubid,
                id: data.SubscriptionApartment.id
              },
              TourMedia: {
                photos: data.TourMedia,
                floorplan: {
                  isNew: data.Apartment.Floor_Plan ? 0 : 1
                }
              },
              formatted: 1,
              newTour: 0
            }
          }

          for (var i = 0; i < formattedData.TourMedia.photos.length; i++) {
            formattedData.TourMedia.photos[i].isNew = 0;
          }

          return formattedData;
        } else {
          data.formatted = 0
          return data;
        }
      }


      /** renamePhoto() description
       * For renaming photos. Builds rename photo modal
       * @param  {Object} photoObj [standard Photo object (media object)]
       * @return {promise}          [object promise response]
       */
      function renamePhoto(photoObj) {
        return $q(function(resolve, reject) {
          ModalBuilderFct.buildComplexModal('md', WizioConfig.uploadViews.modals.renameMedia, 'RenameMediaCtrl', photoObj).then(function(response) {
            resolve(response);
          });
        })
      }

      function buildNewPhotosArr(filelist, data) {
        var newMediaArr = [];
        for (var i = 0; i < filelist.length; i++) {
          var photo = {
            x: null,
            y: null,
            apartmentpubid: data.SubscriptionApartment.pubid,
            isUnit: 0,
            type: 'vrphoto',
            title: filelist[i].name,
            awsurl: 'https://cdn.wizio.co/' + data.SubscriptionApartment.pubid + '/',
            ApartmentId: data.Apartment.id,
            SubscriptionApartmentPubId: data.SubscriptionApartment.pubid,
            useremail: TokenSvc.decode().email,
            file: filelist[i],
            isNew: true
          }
          data.TourMedia.photos.unshift(photo);
        }
        return data.TourMedia.photos;
      }

      /**
       * Previews a single photo by setting blob or URL to htmltag src
       * @param  {Object}     photo   [standard photo object]
       * @param  {DOMElement} htmltag [DOMElement object of the elemnt you want to preview photo in]
       * @return {undefined}         []
       */
      function previewPhoto(photo, htmltag) {
        if (photo) {
          var reader = new FileReader();
          reader.addEventListener('load', function() {
            htmltag.src = reader.result
          })
          reader.readAsDataURL(photo);
          return;
        } else {
          return;
        }

      }

      /**
       * persist changes made to tour. Upload any new photos to S3 and send all
       * photos to Wizio backend to run an update or create to update all photos.
       * @param  {Object} data [Tour app data object]
       * @return {promise}      [promise]
       */
      function saveChanges(data) {
        return $q(function(resolve, reject) {
          /* Shorthand variables */
          var photosArr = data.TourMedia.photos;
          var floorplan = data.TourMedia.floorplan;
          var subscriptionAptPubId = data.SubscriptionApartment.pubid;


          for (var i = 0; i < photosArr.length; i++) {
            photosArr[i].order = i;
          }
          bulkUploadPhotosToS3(photosArr, subscriptionAptPubId, floorplan)
          .then(function(response){
            return bulkSavePhotosToWizioAPI(photosArr)
          })
          .then(function(response){
            return updateFloorPlanData(data.Apartment.id, subscriptionAptPubId)
          })
          .then(function(response){
            return resolve('finished');
          })
        })
      }

      function bulkUploadPhotosToS3(photosArr, subscriptionAptPubId, floorplan) {
        return $q(function(resolve, reject) {
          var s3PhotoKey = null;
          var s3UploadPromises = [];
          for (var i = 0; i < photosArr.length; i++) {
            if (photosArr[i].isNew) {
              s3PhotoKey = subscriptionAptPubId + '/' + photosArr[i].title + '.JPG'
              s3UploadPromises.push(AWSFct.s3.equirectPhotos.uploadTourPhoto(photosArr[i].file, s3PhotoKey))
            }
          }
          if (floorplan && floorplan.isNew) {
            s3UploadPromises.push(floorplan);
          }
          if (s3UploadPromises.length > 0) {
            $q.all(s3UploadPromises)
            .then(function(response){
              return resolve()
            })
          } else {
            return resolve()
          }
        })
      }

      function bulkSavePhotosToWizioAPI(photosArr) {
        return $q(function(resolve, reject) {
          var promisesArr = []
          for (var i = 0; i < photosArr.length; i++) {
            promisesArr.push(savePhotoToWizioAPI(photosArr[i]))
          }
          if (photosArr.length > 0) {
            $q.all(promisesArr)
            .then(function(response){
              return resolve()
            })
          } else {
            return resolve();
          }
        })
      }

      function updateFloorPlanData(floorplan, subscriptionAptPubId) {
        return $q(function(resolve, reject) {
          if (floorplan && floorplan.isNew) {
            API.apartment.updateFloorPlan.save({
              SubscriptionApartmentPubId: subscriptionAptPubId,
              ApartmentId: apartmentId
            }, function(response) {
              return resolve('Finished');
            })
          } else {
            return resolve();
          }
        })
      }

      /**
       * Iterates over array of photos and calls the previewPhoto function
       * with each individual photo and elem. If the elem isn't provided or is
       * false, default is to assign previews to the list of tour images.
       * IF you want to preview one photo, send one photo in an array
       * @param  {Array} TourMediaPhotos [array of photos to be previewed. Even one photo should be in array]
       * @param  {HTMLElement} elem            [HTMLElement to preview photo in - optional]
       * @return {undefined}                 []
       */
      function previewNewPhotos(TourMediaPhotos, elem) {
        for (var i = 0; i < TourMediaPhotos.length; i++) {
          if (TourMediaPhotos[i].isNew) {
            var previewElement = elem ? elem : document.getElementById('imgPreview' + i);
            previewPhoto(TourMediaPhotos[i].file, previewElement);
          }
        }
        return;
      }

      /**
       * Build wrapper standard photo object around floor plan file.
       * @param  {File} file [file comes from file input. An actual file.]
       * @return {Object}      [standard photo object]
       */
      function buildFloorPlanObj(file) {
        var photo = {
          apartmentpubid: data.SubscriptionApartment.pubid,
          title: 'floorplan',
          awsurl: 'https://cdn.wizio.co/' + data.SubscriptionApartment.pubid + '/floorplan.png',
          ApartmentId: data.Apartment.id,
          SubscriptionApartmentPubId: data.SubscriptionApartment.pubid,
          useremail: TokenSvc.decode().email,
          file: file,
          isNew: true,
          isFloorPlan: true
        }
        return photo;
      }

      /**
       * Used to calculate pin X and Y coords on pin drop or movement
       * @param  {Object} mouseEvent [mouse event from JS mouse click event]
       * @return {Object}            [object of pin coords]
       */
      function calculatePinXandY(mouseEvent) {
        // hardcoded values account for the size of the rectangle pin image
        // so that the bottom of the pin is where the user clicks (not the
        // top left of the box the pin is in)
        var x = (((mouseEvent.offsetX - 17) / mouseEvent.target.clientWidth) * 100).toFixed(2);
        var y = (((mouseEvent.offsetY - 35) / mouseEvent.target.clientHeight) * 100).toFixed(2);

        return {
          x: x,
          y: y
        };
      }

      /**
       * Save photo to WizioDB. Could be floorplan or tour photo
       * @param  {Object} photo [standard photo object]
       * @return {promise}       [returns API request response]
       */
      function savePhotoToWizioAPI(photo) {
        return $q(function(resolve, reject) {
          // send the object to the API
          API.media.save(photo, function(response) {
            return resolve(response);
          })
        })
      }

      /**
       * Old logic FIXME update
       * @param  {Object} photo [standard photo object]
       * @return {[type]}       [description]
       */
      function deletePhoto(photo) {
        return $q(function(resolve, reject) {
          var data = {
            MediaObject: {
              'id': photo.id
            },
            UpdatedData: {
              IsDeleted: 1
            }
          };
          API.media.delete(data, function(response) {
            console.dir(response);
            return resolve(response);
          })
        })
      }

      function rerouteAfterSave() {
        $sessionStorage.TourMgmtApp.data = null;
        $sessionStorage.TourMgmtApp.action = null;
        $state.go('Account.Dashboard');
        return;
      }


      return {
        init: {
          mainApp: initTourMgmtMainApp
        },
        photo: {
          rename: renamePhoto,
          delete: deletePhoto
        },
        newPhotos: {
          add: buildNewPhotosArr,
          preview: previewNewPhotos
        },
        floorplan: {
          buildFloorPlanObj: buildFloorPlanObj
        },
        calculatePinXandY: calculatePinXandY,
        saveChanges: saveChanges
      }
    }
  ])
