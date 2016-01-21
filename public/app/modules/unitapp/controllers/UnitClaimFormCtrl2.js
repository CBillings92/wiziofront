angular.module('UnitApp')
    .controller('UnitClaimFormCtrl2', [
        '$scope',
        '$state',
        'ApartmentModel',
        'DescriptionModel',
        'SmartSearchSvc',
        'UnitFct',
        'FlexGetSetSvc',
        function($scope, $state, ApartmentModel, DescriptionModel, SmartSearchSvc, UnitFct, FlexGetSetSvc) {
            //use a ternary IF operator to figure out what state we're on
            $scope.singleUnit = ($state.current.name === 'Unit.Edit') ? true : false;

            //load the selectOptions from the unit factory
            $scope.selectOptions = UnitFct.selectOptions;

            //get the geocoded location for the smart bar
            $scope.getLocation = function(val) {
                return SmartSearchSvc.smartSearch(val, 'Staging-ApartmentClaims');
            };

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
                    [
                        {address: 10 Post Office Sq..., unitNum: 3B, beds:...}
                    ]
                ]
            */
            if($scope.singleUnit){
                FlexGetSetSvc.get('UnitToEdit');
            } else {
                $scope.containingArray = [
                    [
                        {

                        }
                    ]
                ];
            }
            //Whenever we add a new address, we want to push a new empty array
            //into containingArray with an empty object to setup the first unit
            $scope.addAddress = function() {
                $scope.containingArray.push([{

                }]);
            };
            //adding a unit just adds an empty object to the current address array
            $scope.addUnit = function(addressIndex) {
                /*
                    Grab the first apartment from the address array
                    and grab its geocoder data
                */
                var apartmentToCopy = $scope.containingArray[addressIndex][0];
                //use prototype method to copy geocoded data onto new instance
                var newApartmentInstance = ApartmentModel.copyGeocodedData(apartmentToCopy);
                //push this new instance onto the containingArray on the address array
                $scope.containingArray[addressIndex].push(newApartmentInstance);
                console.dir($scope.containingArray);
                return;
            };

            $scope.onUnitBlur = function(addressIndex, unitIndex) {
                //grab the data on the form located at the correct address array and the correct Unit object (the street and unit number)
                var unitAddressInfo = $scope.containingArray[addressIndex][unitIndex].apartmentData;
                //build a new Apartment instance with it
                var newApartment = ApartmentModel.build(unitAddressInfo);
                //call the getGeocodeData prototype function to get all needed geocoded data
                newApartment.getGeocodeData(function(response){
                    newApartment.api().findOrCreate(null, function(response){
                        console.dir(response);
                        return;
                    });
                });
            };

            //for handling descriptions on each unit
            $scope.onDescriptionBlur = function(addressIndex, unitIndex){
                //get the prpper apartment to work with
                var apartment = $scope.containingArray[addressIndex][unitIndex];
                //get the description text from the form
                var descriptionText = apartment.Description.description;
                //create a new Description instance
                var newDescription = new DescriptionModel(null, null, descriptionText);
                //get association data for description (prototype method);
                //this is UserId
                newDescription.getAssociatonData();
                //append the new Descriptions instance onto the Apartment;
                apartment.Description = newDescription;
            };

            $scope.copyUnit = function(addressIndex, unitIndex){
                //get the correct apartment out of the array
                var apartment = $scope.containingArray[addressIndex][unitIndex];
                var description = apartment.Description;
                /*
                    call the duplicate prototype method to get the apartmentData
                    FIXME this probably doesn't need to be on the prototype button
                    just in the unitfct ? ?? ? ?
                */
                //duplicate the apartment data
                var duplicateApartmentData = apartment.duplicate();
                //duplicate the description data
                var duplicateDescriptionData = description.duplicate();
                //build a new instance with this data
                var newInstance = ApartmentModel.build(duplicateApartmentData);
                newInstance.Description = DescriptionModel.build(duplicateDescriptionData);
                //push it into the address array
                $scope.containingArray[addressIndex].push(newInstance);
            };

            $scope.deleteUnit = function(addressIndex, unitIndex){
                delete $scope.containingArray[addressIndex][unitIndex];
            };
            $scope.deleteAddress = function(addressIndex, unitIndex){
                delete $scope.containingArray[addressIndex][unitIndex];
            };

            $scope.submit = function(){
                ApartmentModel.claimApi.save($scope.containingArray, function(response){

                });
            };

        }
    ]);