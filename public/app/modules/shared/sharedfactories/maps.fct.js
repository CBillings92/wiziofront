angular.module('SharedFactoryApp')
    .factory('GeocoderFct', [
        '$q',
        function($q) {
            //function which takes an address
            var getLatLong = function(address) {
                //stire $q's defer method in local variable deferred
                var deferred = $q.defer();
                //some magical google code to create a new Geocoder object
                var geocoder = new google.maps.Geocoder();
                //geocode passed in address, then utilize callback function to handle asynch results
                geocoder.geocode({
                    'address': address
                }, function(results, status) {
                    //if google maps geocodes successfully resolve promise passing lat/long data through it
                    if (status === google.maps.GeocoderStatus.OK) {
                        deferred.resolve(results[0].geometry.location);
                    }
                });
                //return the deferred promise.
                return deferred.promise;
            };
            return {
                getLatLong: getLatLong
            };
        }
    ])
    .factory('MapFct', [
        'ApartmentGetSetSvc',
        '$sessionStorage',
        '$stateParams',
        '$state',
        'WizioConfig',
        function(ApartmentGetSetSvc, $sessionStorage, $stateParams, $state, WizioConfig) {
            var makeMap = function() {

                //default options for map, centered on Boston with a zoom
                //that fits most of the city: four corners jamaica plain to
                //sommerville to airport to southboston & seaport
                var mapOptions = {
                    scrollwheel: false,
                    zoom: 12,
                    center: new google.maps.LatLng(42.3601, -71.0589),
                    mapTypeId: google.maps.MapTypeId.ROADMAP
                };
                var unitList = null;

                if ($state.current.name === "Unit.Details" || $state.current.name === "Listing.Group") {
                    unitList = ApartmentGetSetSvc.get("apartmentSelected");
                } else if ($state.current.name === "Unit.Display") {
                    unitList = ApartmentGetSetSvc.get("apartmentSearch");
                }


                if (unitList.constructor !== Array) {
                    unitList = [unitList];
                }
                if (unitList.length === 0) {
                    return mapOptions;
                }

                //I am averaging all lats and longitudes to find where the best
                //place to center the map is

                var averageLatitude = null;
                var averageLongitude = null;
                if (unitList[0].apartmentData) {
                    for (i = 0; i < unitList.length; i++) {
                        averageLatitude += unitList[i].apartmentData.latitude;
                        averageLongitude += unitList[i].apartmentData.longitude;
                    }

                } else {
                    averageLatitude += unitList.latitude;
                    averageLongitude += unitList.longitude;

                }
                averageLatitude = averageLatitude / (unitList.length);
                averageLongitude = averageLongitude / (unitList.length);
                //what we want
                mapOptions = {
                    //so this should center the map properly, I still haven't
                    //figured out how we should zoom
                    scrollwheel: false,
                    zoom: 12,
                    center: new google.maps.LatLng(averageLatitude, averageLongitude),
                    mapTypeId: google.maps.MapTypeId.ROADMAP
                };

                return mapOptions;
            };

            //function that makes array of google maps markers
            var makeMarkers = function(map) {
                var markersArray = [];
                //$scope.markers = [];
                var unitList = null;
                if ($state.current.name === "Unit.Details") {
                    unitList = ApartmentGetSetSvc.get("apartmentSelected");
                } else if ($state.current.name === "Unit.Display") {
                    unitList = ApartmentGetSetSvc.get("apartmentSearch");
                }

                //test for case of only one apartment and turn into array if only one.
                if (!(Array.isArray(unitList))) {
                    unitList = [unitList];
                }
                for (i = 0; i < unitList.length; i++) {
                    createMarker(unitList[i]);
                }
                return markersArray;
                // map = null;
                // if (unit.apartmentData) {
                //     position = new google.maps.LatLng(unit.apartmentData.latitude, unit.apartmentData.longitude);
                // } else {
                //     position = new google.maps.LatLng(unit.latitude, unit.longitude);
                //
                // }

                function createMarker(unit) {

                    if (unit.apartmentData) {
                        position = new google.maps.LatLng(unit.apartmentData.latitude, unit.apartmentData.longitude);
                    } else {
                        position = new google.maps.LatLng(unit.latitude, unit.longitude);

                    }

                    var marker = new google.maps.Marker({
                        map: map,
                        position: position,
                        title: unit.apartmentData.concatAddr || unit.concatAddr,
                        icon: '/public/viewtemplates/images/brand_assets/map_pin.png'
                    });
                    //FIXME - how do we want to handle the picture
                    marker.content =
                        '<div class="infoWindowContent">' +
                            '<div style="width: 40%; display:inline-block; margin:auto;padding: 10px 15px;">' +
                                '<span class="apt-tile__favorite-btn">' +
                                    '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="20px" height="20px" viewBox="0 0 40 40" enable-background="new 0 0 40 40" xml:space="preserve">' +
                                        '<path fill="none" stroke="#000000" stroke-linecap="round" stroke-miterlimit="10" d="M20.001,37.152 C6.783,24.287,3.066,19.554,2.262,14.704C1.278,8.769,5.694,2.848,12.578,2.848c2.949,0,5.63,1.133,7.423,3.026 c1.79-1.893,4.471-3.026,7.421-3.026c6.853,0,11.306,5.893,10.315,11.856C36.952,19.449,33.479,24.031,20.001,37.152z"/>' +
                                    '</svg>' +
                                '</span>' +
                                '<p style="display: inline-block; padding-left:10px; padding-top:10px;">$' + unit.Lease.leaseData.monthlyRent +'</p>' +
                                '<a href="' + WizioConfig.frontEndURL + '#/unit/details/' + unit.Lease.leaseData.id + '">' +
                                '<button class="btn btn-small" style="display: block; padding: 2px 22px; background-color:transparent; border:1px solid #7A9DD1; color:#7A9DD1;">View</button>' +
                                '</a>' +
                            '</div>' +
                            '<div style="width: 60%; display:inline-block; margin: auto; padding: 10px 15px;">' +
                            '<div> ' +
                                '<p> Beds: ' +unit.apartmentData.beds + '</p> ' +
                                '<p> Baths: ' +unit.apartmentData.baths + '</p> ' +
                                '<p> Living Spaces: ' +unit.apartmentData.livingSpaces + '</p> ' +
                            '</div>' +
                            '</div>' +

                        '</div>';
                    var infoWindow = new google.maps.InfoWindow();
                    google.maps.event.addListener(marker, 'click', function() {
                        infoWindow.setContent('<p>' + marker.title + '</p>' + marker.content);
                        infoWindow.open(map, marker);
                    });



                    markersArray.push(marker);

                }

                return markersArray;
            };
            return {
                makeMap: makeMap,
                makeMarkers: makeMarkers
            };
        }
    ]);
