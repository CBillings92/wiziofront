angular.module("TourApp").controller("TourCtrl", [
  "$scope",
  "$state",
  "WizioConfig",
  "TourFct",
  "lodash",
  "LoadingSpinnerFct",
  function($scope, $state, WizioConfig, TourFct, lodash, LoadingSpinnerFct) {
    $scope.showInterface = true;
    if ($state.current.name === "Tour" || $state.current.name === "Demo") {
      document.getElementById("site-container").style.height = "100%";
      document.getElementById("site-container").setAttribute("style", "height:100%");
      document.getElementById("main-content").style["padding-bottom"] = 0;
      document.getElementById("main-content").style["margin-bottom"] = 0;
    }
    TourFct.getContent().then(function(apiResponse) {
      $scope.$emit("ListingDataRetrieved", apiResponse);
      var media = apiResponse.media;
      LoadingSpinnerFct.show("vrPlayerLoader");
      var interfaceData = {
        floorplan: false,
        hideFloorPlanButton: true,
        media: false,
        showInterface: $scope.showInterface
      };

      var vrPlayerData = {
        media: false,
        sortedMedia: false,
        firstPhotoUrl: false,
        firstPhotoIndex: false
      };

      var sortedMedia = sortMedia(media);
      sortedMedia = addHardCodedNavPointsToMedia(sortedMedia);

      vrPlayerData.media = media;
      vrPlayerData.sortedMedia = sortedMedia;
      interfaceData.media = sortedMedia;
      /*
              Creates array of progressive image URLs and builds floorplan urls
              for each image - Media is now prepped for the VRPlayer and Interface
            */

      var preppedMedia = TourFct.prepMedia(sortedMedia);
      // firstPhoto.media = sortedMedia.vrphoto[0];
      interfaceData.media = preppedMedia;
      interfaceData.hideFloorPlanButton = true;
      if (preppedMedia.vrphoto[0].floorplan) {
        interfaceData.floorplan = true;
        interfaceData.floorplan = preppedMedia.vrphoto[0].floorplan;
        interfaceData.hideFloorPlanButton = false;
      }
      $scope.photoIndex = 0;
      $scope.$broadcast("InterfaceDataReceived", interfaceData);
      $scope.$broadcast("TourDataReceived", preppedMedia.vrphoto[0]);
    });

    function sortMedia(media) {
      return lodash.groupBy(media, "type");
    }

    function addHardCodedNavPointsToMedia(media) {
      if (
        ($state.current.name === "Demo" || $state.current.name === "Product") &&
        (WizioConfig.ENV !== "dev" && WizioConfig.ENV !== "test")
      ) {
        for (var i = 0; i < media.vrphoto.length; i++) {
          media.vrphoto[i].navpoints = TourFct.pierreHageTour1[media.vrphoto[i].title];
        }
      } else if (
        $state.params.activelistingid === "2b13cd9e-e945-4ce7-83cc-ff6182eae5d8" ||
        $state.params.activelistingid === "ec833ed7-ff2e-41e3-bb3d-49dda2e4b042"
      ) {
        for (var i = 0; i < media.vrphoto.length; i++) {
          media.vrphoto[i].navpoints = TourFct.demo2NavPointData[media.vrphoto[i].title];
        }
      } else if ($state.params.activelistingid === "ec9c1913-9bb9-4bd6-9bd5-4046ca93255a") {
        for (var i = 0; i < media.vrphoto.length; i++) {
          media.vrphoto[i].navpoints = TourFct.pierreHageTour1[media.vrphoto[i].title];
        }
      } else if ($state.params.activelistingid === "0dcfe71f-2caa-4592-a4b8-db4bb6e3cdf2") {
        for (var i = 0; i < media.vrphoto.length; i++) {
          media.vrphoto[i].navpoints = TourFct.washingtonDCTour[media.vrphoto[i].title];
        }
      } else {
        for (var i = 0; i < media.vrphoto.length; i++) {
          media.vrphoto[i].navpoints = [];
        }
      }
      return media;
    }
  }
]);
