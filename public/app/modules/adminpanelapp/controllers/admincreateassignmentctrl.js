angular.module('AdminPanelApp')
    .controller('AdminCreateAssignmentCtrl', [
        '$scope',
        'SmartSearchSvc',
        'UnitResource',
        'UnitCreateSvc',
        'TokenSvc',
        'AssignmentResource',
        function($scope, SmartSearchSvc, UnitResource, UnitCreateSvc, TokenSvc, AssignmentResource) {
            $scope.getLocation = function(val) {
                return SmartSearchSvc.smartSearch(val);
            };


            $scope.toggleMin = function() {
                $scope.minDate = $scope.minDate ? null : new Date();
            };
            $scope.toggleMin();
            $scope.maxDate = new Date(2020, 5, 22);

            $scope.open = function($event) {
                $scope.status.opened = true;
            };

            $scope.setDate = function(year, month, day) {
                $scope.dt = new Date(year, month, day);
            };

            $scope.dateOptions = {
                formatYear: 'yy',
                startingDay: 1
            };

            $scope.status = {
                opened: false
            };

            $scope.sizeLimit = 5368709120; // 5GB in Bytes
            $scope.uploadProgress = 0;
            $scope.creds = {};
            $scope.propertymanager = {};
            $scope.apartment = {};
            $scope.upload = function() {
                UnitCreateSvc.parseGeocodeData($scope.apartmentAddress, $scope.apartment, function(err, parsedApartment){
                    parsedApartment.propertyManagerInfo = $scope.propertymanager;
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
                                Bucket:"wiziouservideos"
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
                            var userinfo = TokenSvc.decode();
                            var apartment = $scope.apartmentAddress;
                            apartment = apartment.replace(/[^0-9a-zA-Z]/g, '');
                            var uniqueFileName = userinfo.email + '-' + apartment + (Math.floor((Math.random() * 80)+10));

                            var params = {
                                Key: uniqueFileName,
                                ContentType: $scope.file.type,
                                Body: $scope.file,
                                ServerSideEncryption: 'AES256'
                            };
                            bucket.putObject(params, function(err, data) {
                                    if (err) {
                                        toastr.error(err.message, err.code);
                                        $uibModalInstance.dismiss();
                                        return false;
                                    } else {
                                        // Upload Successfully Finished
                                        toastr.success('File Uploaded Successfully', 'Done');
                                        var updateData = {
                                            UserId: userinfo.id,
                                            ApartmentId: finalApartmentData.id,
                                            S3VideoId: uniqueFileName,
                                            youtubeId: $scope.assignment.youtubeId
                                        };
                                        AssignmentResource.save(updateData, function(data, status){
                                        });
                                        // Reset The Progress Bar
                                        setTimeout(function() {
                                            $scope.uploadProgress = 0;
                                            $scope.$digest();
                                        }, 10000);
                                        $uibModalInstance.close('ok');
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
