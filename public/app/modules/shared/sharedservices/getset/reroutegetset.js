angular.module('SharedServiceApp')
.service('RerouteGetSetSvc', [
    '$sessionStorage',
    function($sessionStorage){
        var dataStore = [];
        var set = function(data, sessionStorageVar){
            if(sessionStorageVar){
                $sessionStorage[sessionStorageVar] = data;
                dataStore = [];
                dataStore.push(data);
                return;
            }
            dataStore = [];
            dataStore.push(data);
            return;
        };
        var get = function(sessionStorageVar){
            if(sessionStorageVar){
                return $sessionStorage[sessionStorageVar];
            }
            if(dataStore.length === 0){
                return [];
            }
            var data = dataStore[0];
            dataStore = [];
            return data;
        };
        var reset = function(sessionStorageVar){
            if(sessionStorageVar){
                delete $sessionStorage[sessionStorageVar];
                dataStore = [];
                return;
            }
            dataStore = [];
            return;
        };

        return {
            set: set,
            get: get,
            reset: reset
        };

    }
]);
