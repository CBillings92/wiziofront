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
        'ngFacebook',
        'ngStorage',
        'ngResource',
        'ngLodash',
        'ui.bootstrap',
        'angular-jwt'
    ])
    .config(function($facebookProvider) {
        $facebookProvider.setAppId('439701646205204');
    })
    //ON APP START AND DURING APP RUN
    .run([
        '$rootScope',
        '$state',
        '$http',
        '$localStorage',
        '$window',
        '$facebook',
        'jwtHelper',
        'AuthFct',
        'TokenSvc',
        function($rootScope, $state, $http, $localStorage, $window, $facebook, jwtHelper, AuthFct, TokenSvc) {

            //FACEBOOK SDK
            // Load the Facebook SDK asynchronously
            (function(d, s, id) {
                var js, fjs = d.getElementsByTagName(s)[0];
                if (d.getElementById(id)) return;
                js = d.createElement(s);
                js.id = id;
                js.src = "//connect.facebook.net/en_US/sdk.js";
                fjs.parentNode.insertBefore(js, fjs);
            }(document, 'script', 'facebook-jssdk'));

            function broadcast(user, fbLoginStatus, loginStatus){
                var fbData = {
                    user: user,
                    fbLoginStatus: fbLoginStatus,
                    loginStatus: loginStatus,
                    facebook: true
                };
                AuthFct.signin(fbData, function(data, status){
                    //do stuff with data?
                    $rootScope.isLoggedIn = true;
                });

                //$rootScop.broadcast('fbLoginBroadcast', fbData);
            }
            function facebookAuth(){
                $facebook.getLoginStatus().then(function(fbLoginStatus){
                    console.dir(fbLoginStatus);
                    switch(fbLoginStatus.status){
                        case "not authorized":
                            $rootScope.isLoggedIn = false;
                            break;
                        case "connected":
                            $facebook.api('/me').then(function(user){
                                return broadcast(user, fbLoginStatus, true);
                            });
                            break;
                        default:
                            $rootScope.isLoggedIn = false;
                    }
                });
            }

            //IF user is not authorized, assign isLoggedIn to false
                //this will be over written later if they are a standard user
            //if user is connected, get user information and pass to server
                //server will check if user exists in DB if not create user
                //Server will send back Wizio Token
                //Front end will store facebook token expiry in localStorage
            //anytime user makes a request at a protected path
                //1: Check if user is authenticated in front end
                //2: Check if the Facebook auth token expired
                //3: Send token and request to DB if hasn't expired.

            var tokenIsExp = TokenSvc.checkExp();
            var token = TokenSvc.getToken();

            //if no token exists, assign isLoggedIn to false
            //if token is expired, assign isLoggedIn to false
            //else, assign isLoggedInto to true
            if (!token) {
                //if no token, check if user is logged into facebook
                facebookAuth();
            } else if (tokenIsExp) {
                TokenSvc.deleteToken();
                facebookAuth();
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
                if (tokenIsExp) {
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
