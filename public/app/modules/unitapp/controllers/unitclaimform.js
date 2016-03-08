/*
    this form is used for the creation and editing of apartments (not leases).
    you edit the beds, baths, unit number, laundry and so on
*/
angular.module('UnitApp')
    .controller('UnitClaimFormCtrl', [
        '$scope',
        '$state',
        '$q',
        'TokenSvc',
        'ApartmentModel',
        'DescriptionModel',
        'SmartSearchSvc',
        'UnitFct',
        'FlexGetSetSvc',
        'ModalSvc',
        'WizioConfig',
        function($scope, $state, $q, TokenSvc, ApartmentModel, DescriptionModel, SmartSearchSvc, UnitFct, FlexGetSetSvc, ModalSvc, WizioConfig) {
            //get the geocoded location for the smart bar
            $scope.getLocation = function(val) {
                return SmartSearchSvc.smartSearch(val, 'Staging-ApartmentClaims');
            };
            (function formPrimer() {
                //use a ternary IF operator to figure out what state we're on
                $scope.singleUnit = ($state.current.name === 'Unit.Edit') ? true : false;
                //grab the user object that is currently logged in
                $scope.user = TokenSvc.decode();
                //get the selectOptions for all of the drop downs on the form
                $scope.selectOptions = UnitFct.selectOptions;
                $scope.multiplePMBusinesses = false;
                if ($scope.user.userType === 2 || $scope.user.userType === 4) {
                    if ($scope.user.PropertyManager.length > 0) {
                        $scope.multiplePMBusinesses = true;
                        $scope.selectOptions.pmBusinesses = $scope.user.PropertyManager;
                        $scope.selectedPM = $scope.selectOptions.pmBusinesses[0];
                    }
                }
                //setup the containing object for apartments
                $scope.containingArray = [
                    []
                ];
                //if editing a unit, get that unit and push it into containing
                //object, otherwise push empty object
                if ($scope.singleUnit) {
                    console.dir(FlexGetSetSvc.get('UnitToEdit'));
                    var newApartmentInstance = ApartmentModel.build(FlexGetSetSvc.get('UnitToEdit'));
                    newApartmentInstance.apartmentData.PropertyManager = $scope.selectedPM;
                    newApartmentInstance.apartmentData.PropertyManagerId = $scope.selectedPM.id;
                    newApartmentInstance.apartmentData.UpdatedById = $scope.user.id;
                    console.dir(newApartmentInstance);
                    $scope.containingArray[0].push(newApartmentInstance);
                } else {
                    $scope.containingArray[0].push({});
                }
            })();
            //setup the containingArray for housing addresses with units
            /*
                the containing array houses arrays of objects. The arrays
                it houses are representative of an address, and each objects
                within the array is representative of a unit at that addresses
                EX:
                [
                    [
                        {address: 175 Amory St ... ..., unitNum: 2, beds:...}
                        {address: 175 Amory St ... ..., unitNum: 1, beds:...}
                    ]
                ]
            */
            function updateAddress(){

            }
            function updateUnitNum(){

            }
            var commonVariables = {
                addressIndex: null,
                unitIndex: null
            };
            function addBlankUnitToAddress(addressIndex) {
                //we're going to copy the geocoded data from the first apartment
                //at this address
                var apartmentToCopy = $scope.containingArray[addressIndex][0];
                var newApartmentInstance = ApartmentModel.copyGeocodedData(apartmentToCopy);
                newApartmentInstance.apartmentData.CreatedById = $scope.user.id;
                newApartmentInstance.apartmentData.UpdatedById = $scope.user.id;
                newApartmentInstance.apartmentData.PropertyManager = $scope.selectedPM;
                newApartmentInstance.apartmentData.PropertyManagerId = $scope.selectedPM.id;
                delete newApartmentInstance.apartmentData.id;
                $scope.containingArray[addressIndex].push(newApartmentInstance);
                return;
            }
            function copyUnit(addressIndex, unitIndex){
                var unitToDuplicate = $scope.containingArray[addressIndex][unitIndex];
                var duplicateApartmentData = unitToDuplicate.duplicate();
                var newInstance = ApartmentModel.build(duplicateApartmentData);
                newInstance.apartmentData.id = null;
                $scope.containingArray[addressIndex].push(newInstance);
                return;
            }
            function removeUnit(addressIndex, unitIndex){
                if($scope.containingArray[addressIndex].length === 1){
                    return;
                } else {
                    $scope.containingArray[addressIndex].splice(unitIndex, 1);
                    return;
                }
            }
            //reusable buildModal function that can build both types of modals
            function buildModal(type, data) {
                return $q(function(resolve, reject) {
                    if (type === 1) {
                        var modalDefaults = {
                            backdrop: true,
                            keyboard: true,
                            modalFade: true,
                            templateUrl: data.templateUrl,
                            controller: data.controller,
                            resolve: {
                                modalData: function() {
                                    return data.modalData;
                                }
                            }
                        };
                        ModalSvc.showModal(modalDefaults, {}).then(function(result) {
                            return resolve(result);
                        });
                    } else {
                        var modalOptions = {
                            closeButtonText: data.closeButtonText,
                            actionButtonText: data.actionButtonText,
                            headerText: data.headerText,
                            bodyText: data.bodyText
                        };
                        ModalSvc.showModal({}, modalOptions).then(function(result) {
                            return resolve(result);
                        });
                    }
                });
            }

            function getNewUnitGeocodeData(addressIndex, unitIndex) {
                return $q(function(resolve, reject) {
                    var unitAddressInfo = $scope.containingArray[addressIndex][unitIndex].apartmentData;
                    var newUnitInstance = ApartmentModel.build(unitAddressInfo);
                    commonVariables.addressIndex = addressIndex;
                    commonVariables.unitIndex = unitIndex;
                    newUnitInstance.getGeocodeData()
                        .then(function(response) {
                            return resolve(newUnitInstance);
                        });
                });
            }

            function findOrCreateNewUnit(unitInstance) {
                return $q(function(resolve, reject) {
                    unitInstance.api().findOrCreate(null, function(dbResponse) {
                        var dataPasser = {
                            unitInstance: unitInstance,
                            dbResponse: dbResponse
                        };
                        return resolve(dataPasser);
                    });
                });
            }

            function handleAPIResponse(data) {
                return $q(function(resolve, reject) {
                    var dbResponse = data.dbResponse;
                    var unitInstance = data.unitInstance;
                    if (dbResponse.created === true) {
                        onUnitNewlyCreated(data)
                            .then(function(unit) {
                                return resolve(unit);
                            });
                    } else {
                        onUnitCreatedPreviously(data)
                            .then(function(unit) {
                                return resolve(unit);
                            });
                    }
                });
            }

            function onUnitNewlyCreated(data) {
                return $q(function(resolve, reject) {
                    var dbResponse = data.dbResponse;
                    var unitInstance = data.unitInstance;
                    unitInstance.newlyCreated = true;
                    unitInstance.apartmentData.id = dbResponse.apartment.id;
                    unitInstance.apartmentData.CreatedById = $scope.user.id;
                    unitInstance.apartmentData.UpdatedById = $scope.user.id;
                    unitInstance.apartmentData.PropertyManager = $scope.selectedPM;
                    unitInstance.apartmentData.PropertyManagerId = $scope.selectedPM.id;
                    // unit.apartmentData.PropertyManagerId = "Unassigned";
                    $scope.containingArray[commonVariables.addressIndex][commonVariables.unitIndex] = unitInstance;
                    return resolve(unitInstance);
                });
            }

            function onUnitCreatedPreviously(data) {
                return $q(function(resolve, reject) {
                    var dbResponse = data.dbResponse;
                    var unitInstance = data.unitInstance;
                    unitInstance.newlyCreated = false;
                    unitInstance.apartmentData.UpdatedById = $scope.user.id;
                    var dataForModal = {};
                    if ($scope.user.userType === 2 && UnitFct.checkPropertyManagerOwnership(dbResponse)) {
                        dataForModal = {
                            templateUrl: WizioConfig.UnitViewsURL + "UnitVerifyModal.html",
                            controller: 'UnitVerifyModalCtrl',
                            modalData: dbResponse
                        };
                        buildModal(1, dataForModal)
                            .then(function(dbResponse) {

                            });
                    } else if ($scope.userType === 3 && $scope.user.id !== response.apartment.CreatedById) {
                        dataForModal = {
                            closeButtonText: "Close",
                            actionButtonText: "OK",
                            headerText: "This Apartment Already Exists",
                            bodyText: 'You are not permitted to edit this apartment. You can however make a public listing for this unit.'
                        };
                        buildModal(2, dataForModal)
                            .then(function(dbResponse) {

                            });
                    }
                });
            }

            function onUnitBlur(addressIndex, unitIndex) {
                getNewUnitGeocodeData(addressIndex, unitIndex)
                    .then(findOrCreateNewUnit)
                    .then(handleAPIResponse);

                return;
            }

            $scope.functions = {
                addUnit: addBlankUnitToAddress,
                onUnitBlur: onUnitBlur,
                copyUnit: copyUnit,
                removeUnit: removeUnit,
                updateAddress: updateAddress,
                updateUnitNum: updateUnitNum
            };

            $scope.submit = function() {
                ApartmentModel.claimApi($scope.containingArray, function(response) {
                    $state.go('Account.Dashboard.Main');
                });
            };

        }
    ]);