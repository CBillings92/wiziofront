angular.module("TourPanelApp").controller("TourPanelCtrl", [
  "$scope",
  "$resource",
  "$state",
  "WizioConfig",
  "ModalBuilderFct",
  "TourPanelFct",
  "LoadingSpinnerFct",
  "TokenSvc",
  function($scope, $resource, $state, WizioConfig, ModalBuilderFct, TourPanelFct, LoadingSpinnerFct, TokenSvc) {
    $scope.activelisting = $scope.tour;
    $scope.user = TokenSvc.decode();
    $scope.wizioAdmin = false;
    // if ($scope.user.email.includes("@wizio.co")) {
    //   $scope.wizioAdmin = true;
    // }
    new Clipboard(".clipboard");
    $scope.windowLocationOrigin = window.location.origin;
    $scope.activeListingURL = window.location.origin + "/tour/" + $scope.activelisting.pubid;
    $scope.openInNewPage = function(pubid) {
      window.open($scope.windowLocationOrigin + "/tour/" + pubid, "_blank");
    };
    $scope.currentState = $state.current.name;
    $scope.makeActiveListingPublic = function(activeListing, activelistingindex) {
      ModalBuilderFct.buildSimpleModal(
        "Cancel",
        "Ok",
        "Remove Password Protection?",
        "Removing password protection from this tour will enable anyone with the tour link to open and view the tour." +
          " The tour can be easily password protected again once the tour is made public."
      )
        .then(function(response) {
          if (response === "ok") {
            $resource(WizioConfig.baseAPIURL + "activelisting/ispublic").save(
              { pubid: activeListing.pubid, isPublic: true },
              function(response) {
                $scope.activelisting.isPublic = response.isPublic;
              }
            );
          }
        })
        .catch(function(err) {
          console.dir(err);
        });
    };

    $scope.reactivateTour = function(tour) {
      TourPanelFct.reactivateTour(tour).then(function(response) {
        $scope.$emit("ActiveListingsUpdated", {});
      });
    };

    $scope.deleteActiveListing = function(activeListing) {
      var modalConfig = {
        size: "md",
        templateUrl: WizioConfig.modals.deleteTourApp.view,
        controller: WizioConfig.modals.deleteTourApp.controller,
        modalData: {}
      };
      ModalBuilderFct.buildModalWithController(modalConfig).then(function(response) {
        if (response === "delete") {
          ModalBuilderFct.buildModalWithController({
            size: "md",
            templateUrl: WizioConfig.modals.deleteTourConfirm.view,
            controller: WizioConfig.modals.deleteTourConfirm.controller,
            modalData: { activeListing: activeListing }
          }).then(function(response) {
            $scope.$emit("ActiveListingsUpdated", {});
            return;
          });
        } else if (response === "deactivate") {
          ModalBuilderFct.buildModalWithController({
            size: "md",
            templateUrl: WizioConfig.modals.deactivateTourConfirm.view,
            controller: WizioConfig.modals.deactivateTourConfirm.controller,
            modalData: { activeListing: activeListing }
          }).then(function(response) {
            $scope.$emit("ActiveListingsUpdated", {});
            return;
          });
        } else {
          return;
        }
      });
    };

    // Generate a password for a given tour.
    $scope.generatePassword = function(activelisting, activelistingindex) {
      // Create the config object for building the TourPasswordConfirm modal
      var tourPasswordConfirmModalConfig = {
        controller: "TourPasswordConfirmModalCtrl",
        templateUrl: WizioConfig.TourPasswordApp.Views.TourPasswordConfirmModal,
        size: "md",
        modalData: {}
      };

      // Modal Workflow
      ModalBuilderFct.buildSimpleModal(
        "Cancel",
        "Ok",
        "Password Protect This Tour?",
        "If you password protect this tour, the link to this tour won't be accessible to anyone without the password. You can remove the password protection if you decide you'd like to open the tour. You will be provided the auto-generated password to your tour upon clicking 'Ok'."
      ).then(function(response) {
        if (response === "cancel") {
          return;
        } else {
          $resource(WizioConfig.baseAPIURL + "tourpassword").save(activelisting, function(response) {
            var modalData = {
              tourPassword: response,
              activeListing: activelisting
            };
            tourPasswordConfirmModalConfig.modalData = modalData;
            ModalBuilderFct.buildModalWithController(tourPasswordConfirmModalConfig).then(function(response) {
              $scope.activelisting.isPublic = false;
            });
          });
        }
      });
      return;
    };

    $scope.reassignTour = function(tour) {
      var subscription;
      var chooseSubscriptionConfig = {
        controller: WizioConfig.modals.reassignTours.main.controller,
        templateUrl: WizioConfig.modals.reassignTours.main.view,
        size: "md",
        modalData: tour
      };
      var areYouSureModalConfig = {
        controller: WizioConfig.modals.reassignTours.areYouSure.controller,
        templateUrl: WizioConfig.modals.reassignTours.areYouSure.view,
        size: "md",
        modalData: {}
      };

      ModalBuilderFct.buildModalWithController(chooseSubscriptionConfig)
        .then(function(assigneeData) {
          areYouSureModalConfig.modalData.tour = tour;
          areYouSureModalConfig.modalData.assigneeData = assigneeData;
          return ModalBuilderFct.buildModalWithController(areYouSureModalConfig);
        })
        .then(function(decision) {
          if (decision.action === "continue") {
            TourPanelFct.reassignTour(decision.tour, decision.assigneeData)
              .then(function(completion) {
                ModalBuilderFct.buildSimpleModal(
                  "",
                  "Ok",
                  "Tour Reassigned Successfully",
                  "This tour has been reassigned successfully."
                );
              })
              .catch(function(err) {
                ModalBuilderFct.buildSimpleModal(
                  "",
                  "Ok",
                  "Tour Could Not Be Reassigned",
                  "This tour could not be reassigned at this time. Please contact Cameron."
                );
              });
          }
        });
    };
  }
]);
