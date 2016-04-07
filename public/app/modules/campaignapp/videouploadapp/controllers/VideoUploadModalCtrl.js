angular.module('CampaignApp')
    .controller('VideoUploadModalCtrl', [
        '$scope',
        '$modalInstance',
        'SmartSearchSvc',
        'UnitResource',
        'UnitCreateSvc',
        'TokenSvc',
        'DescriptionModel',
        'ApartmentModel',
        'AssignmentResource',
        function($scope, $modalInstance, SmartSearchSvc, UnitResource, UnitCreateSvc, TokenSvc, DescriptionModel, ApartmentModel, AssignmentResource) {
            $scope.getLocation = function(val) {
                return SmartSearchSvc.smartSearch(val);
            };
            $scope.sizeLimit = 5368709120; // 5GB in Bytes
            $scope.uploadProgress = 0;
            $scope.creds = {};
            $scope.propertymanager = {};
            $scope.apartment = {};
            $scope.upload = function() {
                var userinfo = TokenSvc.decode();
                var apartment = ApartmentModel.build($scope.apartment);

                apartment.description = new DescriptionModel(
                    userinfo.id,
                    null,
                    $scope.apartment.description.DescriptionText);

                UnitCreateSvc.parseGeocodeData($scope.apartmentAddress, apartment, function(err, parsedApartment) {
                    UnitResource.save(parsedApartment, function(data, status) {

                        //store saved apartment data to use in AssignmentResource
                        //call later
                        var finalApartmentData = data;
                        AWS.config.update({
                            accessKeyId: 'AKIAIPGWV5OFR73P3VLQ',
                            secretAccessKey: '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'
                        });
                        AWS.config.region = 'us-east-1';
                        var bucket = new AWS.S3({
                            params: {
                                Bucket: "wiziouservideos"

                            },
                            httpOptions: {
                                timeout: 1000000000000
                            }
                        });

                        if ($scope.file) {
                            // Perform File Size Check First

                            var fileSize = Math.round(parseInt($scope.file.size));
                            if (fileSize > $scope.sizeLimit) {
                                toastr.error('Sorry, your attachment is too big. <br/> Maximum ' + $scope.fileSizeLabel() + ' file attachment allowed', 'File Too Large');
                                return false;
                            }
                            // Prepend Unique String To Prevent Overwrites
                            var apartment = $scope.apartmentAddress;
                            apartment = apartment.replace(/[^0-9a-zA-Z]/g, '');
                            var uniqueFileName = userinfo.email + '-' + apartment + "unitNum:" + apartment.unitNum + "___" + (Math.floor((Math.random() * 80) + 10));


                            var params = {
                                Key: uniqueFileName,
                                ContentType: $scope.file.type,
                                Body: $scope.file,
                                ServerSideEncryption: 'AES256'
                            };
                            bucket.putObject(params, function(err, data) {
                                    if (err) {
                                        toastr.error(err.message, err.code);
                                        $modalInstance.dismiss();
                                        return false;
                                    } else {
                                        // Upload Successfully Finished
                                        toastr.success('File Uploaded Successfully', 'Done');

                                        var updateData = {
                                            UserId: userinfo.id,
                                            ApartmentId: finalApartmentData.id,
                                            S3VideoId: uniqueFileName
                                        };
                                        AssignmentResource.save(updateData, function(data, status) {

                                        });
                                        // Reset The Progress Bar
                                        /*setTimeout(function() {
                                            $scope.uploadProgress = 0;
                                            $scope.$digest();
                                        }, 100000000);*/
                                        $modalInstance.close('ok');
                                    }
                                })
                                .on('httpUploadProgress', function(progress) {
                                    $scope.uploadProgress = Math.round(progress.loaded / progress.total * 100);
                                    $scope.$digest();
                                });
                        } else {
                            // No File Selected
                            toastr.error('Please select a file to upload');
                        }
                    });
                });
            };

            $scope.fileSizeLabel = function() {
                // Convert Bytes To MB
                return Math.round($scope.sizeLimit / (1073741824)) + 'GB';
            };

            $scope.uniqueString = function() {
                var text = "";
                var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

                for (var i = 0; i < 8; i++) {
                    text += possible.charAt(Math.floor(Math.random() * possible.length));
                }
                return text;
            };
        }
    ]);
