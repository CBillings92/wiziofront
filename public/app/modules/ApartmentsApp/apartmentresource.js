angular.module('ApartmentsApp')
.factory('ApartmentsResource', [
    $resource,
    function($resource){
        return $resource('http://localhost:4000/api/apartments/:action');
    }
]);
