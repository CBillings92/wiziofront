/*
    Factory for handling retrieving and posting data to our Subscription API
*/
angular.module('AccountApp')
    .factory('SubscriptionFct', [
        '$resource',
        '$q',
        'WizioConfig',
        function($resource, $q, WizioConfig) {
            var resources = {
              user: {
                registration: WizioConfig.baseAPIURL + 'user/registration'
              }
            }

            // All of our get requests
            var get = {
                subscriptions: getSubscriptions,
            }

            var post = {
              saveNewUser: saveNewUser
            }

            // Pull subscription information from database
            function getSubscriptions(){
                // Pull from database eventually
                var subscriptions = [
                    {
                        name: 'Free Trial',
                        id: '1',
                        subHeader: 'Experience the power of Wizio Virtual Reality tours for free for thirty days.',
                        costPerMonth: 0,
                        features: [
                            '25 Active Tours',
                            'Tour Creation Tool (Coming Soon)'
                        ]
                    },
                    {
                        id: '2',
                        name: 'Agent',
                        subHeader: 'Introductury tool for sharing virtual reality tours',
                        costPerMonth: 100,
                        features: [
                            '25 Active Tours',
                            'Tour Creation Toll (Coming Soon)'
                        ]
                    },
                    {
                        id: '3',
                        name: 'Broker',
                        subHeader: 'High powered tool for sharing many virtual reality tours',
                        costPerMonth: 200,
                        features: [
                            '50 Active Tours',
                            'Tour Creation Tool (Coming Soon)',
                        ]
                    },
                    {
                        id: '4',
                        name: 'Office',
                        subHeader: 'Multi-user account perfect for teams',
                        costPerMonth: 300,
                        feauters: [
                            'Unlimited Active Tours',
                            'Wizio API Access',
                            'Tour Creation Tool',
                            'Up to 25 Users ($5+ per month per additional user)'
                        ]
                    }
                ];
                return subscriptions;
            }

            function saveNewUser(user, subscription) {
              var dataForAPI = {
                user: user,
                subscription: subscription
              }
              return $q(function(response, resolve){
                $resource(resources.user.registration)
                .save(dataForAPI, function(response){
                  return resolve(response);
                })
              })
            }

            return {
                get: get,
                post: post
            };
}]);