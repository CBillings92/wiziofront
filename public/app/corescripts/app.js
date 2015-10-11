//CREATE ALL TOP LEVEL APPS (create, not start)
angular.module('AccountApp', []);
angular.module('AmazonS3UploadApp', []);
angular.module('ApplicationApp', []);
angular.module('AuthApp', []);
angular.module('BlogApp', []);
angular.module('CampaignApp', []);
angular.module('LandingPageApp', []);
angular.module('NavbarApp', []);
angular.module('SellerApp', []);
angular.module('SharedControllersApp', []);
angular.module('SharedFactoryApp', []);
angular.module('SharedServiceApp', []);
angular.module('UnitApp', []);


//LOAD 'MainApp' ANGULAR module
//LOAD ALL TOP LEVEL APPLICATIONS INTO MAIN APP
angular.module('MainApp', [
        //change to UnitApp

        'AccountApp',
        'AmazonS3UploadApp',
        'ApplicationApp',
        'AuthApp',
        'BlogApp',
        'LandingPageApp',
        'CampaignApp',
        'NavbarApp',
        'SellerApp',
        'SharedControllersApp',
        'SharedFactoryApp',
        'SharedServiceApp',
        'UnitApp',
        'ui.router',
        'ngStorage',
        'ngResource',
        'ngLodash',
        'ui.bootstrap',
        'angular-jwt'
    ])
    //ON APP START AND DURING APP RUN
    .run([
        '$rootScope',
        '$state',
        '$http',
        '$localStorage',
        'jwtHelper',
        'AuthFct',
        'TokenSvc',
        function($rootScope, $state, $http, $localStorage, jwtHelper, AuthFct, TokenSvc) {
            //on angular app instantiaion check if a localStorage token exists and
            //if it's expired. Assign isLoggedIn to $rootScope accordingly
            var tokenIsExp = TokenSvc.checkExp();
            var token = TokenSvc.getToken();

            //if no token exists, assign isLoggedIn to false
            //if token is expired, assign isLoggedIn to false
            //else, assign isLoggedInto to true
            if (!token) {
                $rootScope.isLoggedIn = false;
            } else if (tokenIsExp){
                $rootScope.isLoggedIn = false;
                TokenSvc.deleteToken();
            } else {
                $rootScope.userType = TokenSvc.decode().userType;
                console.dir($rootScope.userType);
                $rootScope.isLoggedIn = true;
            }

            //Watch for angular app state changes
            $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
                //check if the state being navigated to requires login
                token = TokenSvc.getToken();
                tokenIsExp = TokenSvc.checkExp();
                if (toState && toState.data.requireLogin === true) {
                    requireLogin = true;
                } else {
                    requireLogin = false;
                }
                //check if token is expired
                if(tokenIsExp){
                    TokenSvc.deleteToken();
                }
                //if state requires login, if token exists, if its expired, login
                console.dir(token);
                if (requireLogin === true && token && tokenIsExp) {
                    event.preventDefault();
                    alert('Session is expired. Please login again');
                    $rootScope.isLoggedIn = false;
                    return $state.go('Login');
                } else if (requireLogin === true && !token) {
                    alert('Please login');
                    event.preventDefault();
                    $rootScope.isLoggedIn = false;
                    return $state.go('Login');
                } else if (!token || tokenIsExp) {
                    $rootScope.isLoggedIn = false;
                } else {
                    $rootScope.isLoggedIn = true;
                }
                return;
            });
        }
    ]);
