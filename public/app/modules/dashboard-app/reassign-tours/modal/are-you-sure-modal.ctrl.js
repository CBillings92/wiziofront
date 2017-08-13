angular.module('DashboardApp')
  .controller('AreYouSureModalCtrl', [
    '$scope',
    '$uibModalInstance',
    'modalData',
    function($scope, $uibModalInstance, modalData) {
      $scope.closeModal = function () {
          $uibModalInstance.close();
      };

      $scope.modalData = modalData;
      $scope.buttonAction = function(action) {
        if (action === 'continue') {
          $uibModalInstance.close({action: 'continue', tour: modalData.tour, subscription: modalData.subscription});
        } else {
          $uibModalInstance.cancel();
        }
      }
    }
  ])