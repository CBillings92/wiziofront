angular.module('Directives')
    .directive('uploadPhotoDirv', [
        '$resource',
        'WizioConfig',
        'LoadingSpinnerFct',
        function($resource,WizioConfig, LoadingSpinnerFct){
            return {
                restrict: 'E',
                templateUrl: 'public/app/modules/photographerapp/upload/uploadphoto.directive.view.html',
                link: function(scope, elem, attrs){
                    AWS.config.update({
                        accessKeyId: 'AKIAIPGWV5OFR73P3VLQ',
                        secretAccessKey: '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'
                    });
                    var bucket = new AWS.S3({
                        endpoint: 'https://cdn.wizio.co',
                        s3BucketEndpoint: true,
                        region: 'us-east-1',
                        // params: {
                        //     Bucket: 'equirect-photos'
                        // }
                    });

                    var fileChooser = document.getElementById('file-chooser');
                    var button = document.getElementById('upload-button');
                    var results = document.getElementById('results');
                    console.dir(scope.pin);
                    button.addEventListener('click', function() {

                        if (document.getElementById("file-chooser").value == "") {
                            alert("Please select a photo before uploading it.");
                            return;
                        };

                        LoadingSpinnerFct.show('upload-photo-loader');
                        var file = fileChooser.files[0];
                        if(scope.photoTitle === null){
                            results.innerHTML = "Please enter a title for the photo";
                            return;
                        }
                        scope.pin.title = scope.photoTitle;
                        scope.pin.awsurl += scope.photoTitle;
                        if (file) {
                            results.innerHTML = '';

                            var params = {
                                Bucket: 'equirect-photos',
                                Key:  scope.pin.SubscriptionApartmentPubId + '/' + scope.photoTitle + '.JPG',
                                ContentType: file.type,
                                Body: file
                            };
                            bucket.putObject(params, function(err, data) {
                                if(err){
                                    results.innerHTML = "ERROR";
                                } else {
                                    $resource(WizioConfig.baseAPIURL + 'media')
                                        .save(scope.pin, function(response){
                                            // alert('finished');
                                            LoadingSpinnerFct.hide('upload-photo-loader');
                                            results.innerHTML = 'UPLOADED';
                                            scope.$emit('Upload-Finished', {photoTitle: scope.photoTitle});
                                        });

                                    // scope.$emit('doneUploadingPhoto', 'OK')
                                }
                                results.innerHTML = err ? 'ERROR!' : 'UPLOADED.';
                            });
                        } else {
                            alert("Please upload a photo before continuing");
                            results.innerHTML = 'Nothing to upload.';
                            return;
                        }
                    }, false);
                }
            };
        }
    ]);
