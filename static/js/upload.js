/* note : expects json from server : for instance : */
/*
<?php
  // ...
  die(json_encode([ 'success'=> $is_success, 'error'=> $error_msg]));
?>
*/


'use strict';

(function ($, window, document, undefined) {
    // feature detection for drag&drop upload

    var isAdvancedUpload = function () {
        var div = document.createElement('div');
        return (('draggable' in div) || ('ondragstart' in div && 'ondrop' in div)) && 'FormData' in window && 'FileReader' in window;
    }();


    // applying the effect for every form

    $('.box').each(function () {
        var $form = $(this),
            $input = $form.find('input[type="file"]'),
            $label = $form.find('label'),
            $errorMsg = $form.find('.box__error span'),
            $restart = $form.find('.box__restart'),
            droppedFiles = false;
        //showFiles = function (files) {
        //    $label.text(files.length > 1 ? ( $input.attr('data-multiple-caption') || '' ).replace('{count}', files.length) : files[0].name);
        //};

        // letting the server side to know we are going to make an Ajax request
        $form.append('<input type="hidden" name="ajax" value="1" />');

        // automatically submit the form on file select
        $input.on('change', function (e) {
            //showFiles(e.target.files);
            $form.trigger('submit');
        });


        // drag&drop files if the feature is available
        if (isAdvancedUpload) {
            $form
                .addClass('has-advanced-upload') // letting the CSS part to know drag&drop is supported by the browser
                .on('drag dragstart dragend dragover dragenter dragleave drop submit', function (e) {
                    // preventing the unwanted behaviours
                    e.preventDefault();
                    e.stopPropagation();
                })
                .on('dragover dragenter', function () //
                {
                    $form.addClass('is-dragover');
                })
                .on('dragleave dragend drop', function () {
                    $form.removeClass('is-dragover');
                })
                .on('drop', function (e) {
                    droppedFiles = e.originalEvent.dataTransfer.files; // the files that were dropped
                    //showFiles(droppedFiles);

                    $form.trigger('submit'); // automatically submit the form on file drop


                });
        }


        // if the form was submitted

        $form.on('submit', function (e) {
            // preventing the duplicate submissions if the current one is in progress
            if ($form.hasClass('is-uploading')) return false;

            $form.addClass('is-uploading').removeClass('is-error');

            if (isAdvancedUpload) // ajax file upload for modern browsers
            {
                e.preventDefault();

                // gathering the form data
                var ajaxData = new FormData($form.get(0));

                if (droppedFiles) {
                    $.each(droppedFiles, function (i, file) {
                        console.log("dropped here", file);
                        ajaxData.append('image', file);


                        console.log("ajaxData  ", ajaxData, "file  ", ajaxData.get($input.attr('name')));

                        // ajax request
                        $.ajax(
                            {
                                url: $form.attr('action'),
                                type: $form.attr('method'),
                                data: ajaxData,
                                cache: false,
                                contentType: false,
                                processData: false,
                                complete: function () {
                                    $form.removeClass('is-uploading');
                                },
                                success: function (data) {
                                    $form.addClass('is-success');
                                    //if (!data.success) $errorMsg.text(data.error);
                                    console.log("loaded");
                                    var src1_upload = data['imgSrc'];


                                    var newImageTile = $('#widgets .ideal-image-container').clone();
                                    newImageTile.attr('id', 'container_' + img_id);
                                    newImageTile.prependTo("#stack .scrollable-container");
                                    document.getElementById('container_' + img_id).classList.add('stack-item');

                                    newImageTile.children('a').attr('href', '#wheel' + img_id);
                                    newImageTile.children('ul').attr('id', 'wheel' + img_id);

                                    newImageTile.children('a').children('img').attr('id', 'img_' + img_id);
                                    newImageTile.children('a').children('img').attr("src", src1_upload);

                                    //console.log("new element", newImageTile);
                                    make_draggable(newImageTile);


                                    /* add event listener to history*/
                                    $("#wheel" + img_id).off().on("click", function (e) {

                                        current_image = e.currentTarget.id.replace("wheel", "container_");
                                        highlighted_element = $('#' + current_image);
                                        wheelFunctions(e, $(e.target).html());
                                    });

                                    img_id = img_id + 1;

                                    saveImage(newImageTile, src1_upload);

                                    updateSaveImage(newImageTile, 'Top');
                                    updateSaveImage(newImageTile, 'Left');
                                    updateSaveImage(newImageTile, 'Width');
                                    updateSaveImage(newImageTile, 'Height');
                                    updateSaveImage(newImageTile, 'LocalAddress', src1_upload);

                                    var colorPalette = data['colorPalette'];
                                    updateSaveImage(newImageTile, 'Color', colorPalette);


                                    var labels = data['labels'];
                                    ////console.log("labels", labels);


                                    if (labels == 0) {
                                        //console.log("I don't have labels yet");
                                        var img_to_label = newImageTile.children('a').children('img')[0].src;
                                        ////console.log('img_to_label', img_to_label);

                                        var xhr = new XMLHttpRequest();
                                        xhr.open("GET", img_to_label, true);
                                        xhr.responseType = "blob";
                                        xhr.onload = function (e) {
                                            ////console.log('to load', this.response);
                                            var reader = new FileReader();
                                            reader.onload = function (event) {
                                                var imageAsBase64 = event.target.result;
                                                var res = imageAsBase64.split(",");
                                                queryImageLabels(newImageTile, res[res.length - 1]);

                                            }
                                            var file = this.response;
                                            reader.readAsDataURL(file)
                                        };
                                        xhr.send();
                                        //if( !data.success ) $errorMsg.text( data.error );
                                        console.log("loaded");
                                        e.preventDefault();
                                        $form.removeClass('is-success');
                                    }
                                }
                                ,
                                error: function () {
                                    //alert( 'Error. Please, contact the webmaster!' );
                                }
                            });
                    });
                }

            } else // fallback Ajax solution upload for older browsers
            {
                var iframeName = 'uploadiframe' + new Date().getTime(),
                    $iframe = $('<iframe name="' + iframeName + '" style="display: none;"></iframe>');

                $('body').append($iframe);
                $form.attr('target', iframeName);

                console.log("down here");


                $iframe.one('load', function () {
                    var data = $.parseJSON($iframe.contents().find('body').text());
                    $form.removeClass('is-uploading').addClass(data.success == true ? 'is-success' : 'is-error').removeAttr('target');
                    if (!data.success) {
                        $errorMsg.text(data.error);
                    } else {
                        e.preventDefault();
                        $form.removeClass('is-error is-success');
                        $input.trigger('click');
                    }

                    $iframe.remove();

                });
            }
        });


        // restart the form if has a state of error/success


        // Firefox focus bug fix for file input
        $input
            .on('focus', function () {
                $input.addClass('has-focus');
            })
            .on('blur', function () {
                $input.removeClass('has-focus');
            });
    });

})(jQuery, window, document);