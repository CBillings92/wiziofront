angular.module("ListingPageApp").controller("ListingPageCtrl", [
  "$scope",
  "$state",
  "ModalBuilderFct",
  "WizioConfig",
  function($scope, $state, ModalBuilderFct, WizioConfig) {
    $scope.isBostonPadsUnit = false;
    $scope.data = {
      Listing: {}
    };
    $scope.data.Listing.IsActive = true;
    $scope.$on("ListingDataRetrieved", function(ev, data) {
      $scope.data = data;
      $scope.data.Listing = data.SubscriptionApartment.Listing;
      $scope.data.Lease = $scope.data.Listing.Lease;
      $scope.agent = data.User;
      if ($scope.agent.BusinessName === "Boston Pads") {
        $scope.isBostonPadsUnit = true;
      }
      $scope.address = data.Apartment;
      $scope.data.Lease.LeaseStartDate = new Date($scope.data.Lease.LeaseStartDate);
      $scope.data.Lease.LeaseEndDate = new Date($scope.data.Lease.LeaseEndDate);
    });

    $scope.requestShowing = function() {
      ModalBuilderFct.buildModalWithController({
        size: "md",
        templateUrl: WizioConfig.modals.RequestShowingApp.RequestShowingForm.view,
        controller: WizioConfig.modals.RequestShowingApp.RequestShowingForm.controller,
        modalData: { agent: $scope.agent, listing: { activeListingPubId: $state.params.listingUUID } }
      })
        .then(function(response) {
          return;
        })
        .catch(function(err) {
          return;
        });
    };
    // $scope.data = {
    //   Tour: {
    //     TourId: 1
    //   },
    //   Listing: {
    //     concatAddr: "228 South Street Jamaica Plain MA 02130",
    //     unitNum: "#2",
    //     neighborhood: "Back Bay",
    //     amenitiesDescription:
    //       "Pet-Friendly, Balcony, Fireplace, Fitness center, Roof Deck, 24 Hour security, remote door bell, maintence team on site",
    //     amenities: {
    //       WasherDryer: {
    //         Description: "In Unit"
    //       },
    //       DishWasher: true,
    //       Pool: {
    //         Description: ""
    //       },
    //       Gym: false,
    //       SecureEntrance: {
    //         Description: ""
    //       },
    //       PetFriendly: {
    //         Cats: true,
    //         Dogs: true
    //       }
    //     },
    //     Bedrooms: "3 Bedrooms",
    //     Bathrooms: "1.5 Bathrooms",
    //     rent: "2100",
    //     availability: "2.17.18",
    //     rentFrequency: "per month",
    //     leaseType: "Annual",
    //     securityDeposit: {
    //       required: true,
    //       total: "2100"
    //     },
    //     firstMonthRent: {
    //       required: true,
    //       total: "2100"
    //     },
    //     lastMonthRent: {
    //       required: true,
    //       total: "2100"
    //     },
    //     brokerFee: {
    //       required: false,
    //       total: "2100"
    //     },
    //     ListingDetails:
    //       "Fantastic loft available in Downtown Lowell within a 10-15 minute walk to the commuter rail station! Hop on the T and get to Boston's North Station in 45 minutes. If you drive then it's really close to the Lowell Connector where you can get on 495 and over to Chelmsford, Methuen, or Lawrence very quickly. You are also within walking distance to all the restaurants, conveniences, and nightlife of the downtown! This is a TRUE loft converted from a warehouse."
    //   }
    // };
  }
]);
