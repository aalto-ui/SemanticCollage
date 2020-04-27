var current_search_results;
var current_search_results_list = [];
var highlighted_element = 'null';
var highest = 10;
var img_id = 0;
var history_id = 1;
var api_key = "xxx"; //Please register with the google cloud platform and add your own google vision API key here
var search_labels = [];
var current_image;
var inspector_toggle = 0;
var box_id = 0;
var circle_id = 0;
var text_id = 0;
var sticky_id = 0;
var multi = false;
var currentTab = 'SearchTab';
var sem = true;


/////////////////////////////////////////////////////
//
//* Tab behaviour */
//
/////////////////////////////////////////////////////


function openTab(evt, tabName) {
    currentTab = tabName;
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    $('#collageArea').appendTo(document.getElementById(tabName));
    document.getElementById(tabName).style.display = "flex";
    evt.currentTarget.className += " active";

    if (tabName == 'RationaleTab') {
        getCloudLabels('moodboard-item');
        if ($('#displayKeywords').attr('checked') == 'checked') {
            showKeywords();
        }

    }
}


// Get the element with id="defaultOpen" and click on it
document.getElementById("defaultOpen").click();


/////////////////////////////////////////////////////
//
//* Search behaviour */
//
/////////////////////////////////////////////////////


function triggerSearch() {
    $("#imgGallery").empty();
    search2();
    $(".systemStart").fadeOut("slow");
}

function focusSearch() {
    $("#search").focus();
}


$(function () {
    $('.search_area').on('focus', '#search', function () {
        $(".systemStart").show();
        if ($(this).html() == "Keywords, pictures…") {
            $(this).removeClass("idle");
            $(this).html("");
        }
        $(document).off().on('keypress', function (e) {
            if (e.which == 13) {
                triggerSearch();
                e.preventDefault();
            }
        });
    });
    $('.search_area').on('blur', '#search', function () {
        $(".systemStart").fadeOut("slow");
        if ($(this).html() == "") {
            $(this).addClass("idle");
            $(this).html("Keywords, pictures…");
        }
    });
    $('.search_area').on('click', '.systemStart', function () {
        triggerSearch();
        $(".systemStart").fadeOut("slow");
    });
});


$('#search').on('input', function (e) {
    NbImg = 0;
    var search_term_org = $("#search").html();
    search_term = search_term_org.replace("<span>", "").replace("</span>", "");
    var regex = /<img[^>]+id="([^"]+)"[^>]*>/g;
    NbImg = (search_term.match(/<img/g) || []).length;
    removeFromSearchInspector();

    if (NbImg > 0) {
        removeFromSearchInspector();
        do {
            m = regex.exec(search_term);
            if (m) {
                addToSearchInspector(m[1]);
            }
        } while (m);
    }
});

/* searchoptions drawer behaviour */

$('.searchBar').on('click', '.optionToggle', function () {
    $('.optionToggle').slideUp(100, function () {
        $('.searchOptions').slideDown();
        $(".systemStart").fadeIn('fast');
    });
});
$('.searchBar').on('click', '.searchOptions .closeParent', function () {
    $('.searchOptions').slideUp(function () {
        $('.optionToggle').slideDown(100);
        $(".systemStart").fadeOut('slow');
    });
});
$('.searchBar').on('click', 'input label', function () {
    setTimeout(function () {
        $('.searchOptions').slideUp(function () {
            $('.optionToggle').slideDown(100);
            $(".systemStart").fadeOut('slow');
        });
    }, 3000);
});



function hackedHideMenu(element) {
    var defaults = {
        trigger: "click",
        animation: "fade",
        angle: [0, 360],
        animationSpeed: "instant"
    };
    var settings = $.extend({}, defaults);
    var menu = element.children('.wheel');
    $(menu).hideIcon($(menu), settings);
}

function hackedShowMenu(element) {
    var defaults = {
        trigger: "click",
        animation: "fade",
        angle: [0, 360],
        animationSpeed: "fast"
    };
    var settings = $.extend({}, defaults);
    var menu = element.children('.wheel');
    $(menu).showIcon($(menu), settings);
}

function hideCropMenu(element) {
    $(element).find('.toolbar').remove();
}


function showCropMenu(element) {
    var newMenu = $('.toolbar').clone();
    newMenu.css('display', "initial");
    newMenu.appendTo(element);
}


function hideAnyCropMenu() {
    $('#moodboard .toolbar').remove();
    //////console.log("highlighted_element ", highlighted_element);
    if (highlighted_element != 'null') {
        if (highlighted_element["0"].classList.contains('cropper')) {
            hideCropMenu($('.highlight'));
            highlighted_element["0"].classList.remove('cropper');
            var img_id_crop = highlighted_element["0"].children["0"].children["0"].id;
            $('#moodboard #' + img_id_crop)[0].cropper.destroy();
        }
    }
}


/* selection */


$(function () {
    document.body.addEventListener('keydown', function (k) {
        //////console.log(k);
        if (k['key'] == 'Shift') {
            multi = true;
            if ($('#moodboard .highlight')) {
                hackedHideMenu($('.highlight'));
                $('#moodboard .ideal-image-container').removeClass('highlight');
            }
        } else {
            multi = false;
        }
    });


    document.body.addEventListener('keyup', function (k) {
        multi = false;
    });
});


function unselectBoardObjects() {
    $("#moodboard img").removeClass("setColor");
    $("#moodboard div").removeClass("setColor");

    $('#moodboard .ideal-image-container').removeClass("inspected");
    if ($(".inspectorList").length) {
        $('.hud').fadeOut();
        $('#moodboard .ideal-image-container').removeClass("inspected");
        $(".inspectorList").remove();
    }
    killInspectorKeywords();

    $("img").removeClass("highlight-label");
    //Do Stuff (only element clicked, not children)
    hackedHideMenu($('#moodboard .ideal-image-container'));
    //hideAnyCropMenu();

    if (!$('#moodboard .ideal-image-container').hasClass('cropper')){
        $('#moodboard .ideal-image-container').removeClass('highlight');
    }


    cancelFilter();
    $('#moodboard .multi').removeClass("multi");
    $('.text_fields').removeClass('active');
    $('.text_fields .text-editor').remove();
}

$(function () {

    $('body').on('click', '.wheel-button', function (event) {
        event.preventDefault();
    });

    // moodboard events

    $('body').on('click', '#moodboard', function (event) {
        var target = $(event.target);
        var tid = target.attr('id');

        //////console.log("tid", tid);
        console.log("tid", tid, "tclass", tclass);
        var tclass = target.attr('class');
        $('#moodboard .menuHolder').remove();


        if (tid == "moodboard") {
            //////console.log($('#moodboard .ideal-image-container'));
            unselectBoardObjects();

        } else if (tid == null) {
            //////console.log("don't do anything");
        } else if (tid == undefined) {
            //////console.log("don't do anything");

        } else if (tid == 'c') {
            //////console.log("don't do anything");

        } else if (tid == 'c1') {
            //////console.log("don't do anything");

        } else if (tid.includes('sticky')) {
            //////console.log("don't do anything");

        } else if (tid.includes("wheel")) {
            //////console.log("don't do anything");

        } else if (tid == 'addElement') {
            //////console.log("don't do anything");
        } else if (tid == 'addElementContainer') {
            //////console.log("don't do anything");

        } else if (tid == 'font-size') {
            //////console.log("don't do anything");


        } else if (tid == 'ct') {
            //////console.log("don't do anything");

        } else if (tid == 'font-italic') {
            //////console.log("don't do anything");

        } else if (tid == 'font-family') {
            //////console.log("don't do anything");

        } else if (tid == 'font-bold') {
            //////console.log("don't do anything");

        } else if (tid == 'font-regular') {
            //////console.log("don't do anything");

        } else if (tid == 'font-color') {
            //////console.log("don't do anything");

        } else if (tid == 'text-editor') {
            //////console.log("don't do anything");

        } else if (tid == 'text-kill') {
            //////console.log("don't do anything");

        } else if (tid.includes("text_")) {
            //////console.log("don't do anything");

        } else if (tid == 'newLabel') {
            //////console.log("don't do anything");

        } else if (tid == "popMenu") {
            hackedHideMenu($('#moodboard .menuHolder'));

            //////console.log("don't do anything");
        } else if (tclass == 'text_fields') {
            //////console.log("don't do anything");

        } else if (tclass == 'text_field') {
            selected_element = target.children('input');

        } else if (multi == true) {
            if (tid.includes("img")) {
                var container = target.parents('.ideal-image-container');
                //////console.log('target.parents(\'.ideal-image-container\')',target.parents('.ideal-image-container'));
            } else {
                var container = target;
            }

            //$('#moodboard .ideal-image-container').removeClass('highlight');
            hideAnyCropMenu();
            if ($(container).hasClass('multi')) {
                $(container).removeClass('multi');
            } else {
                $(container).addClass('multi');
                hackedHideMenu($(container));
            }
        } else {

            //console.log("tid", tid, "tclass", tclass);

            $('#moodboard .ideal-image-container').removeClass("inspected");
            $(".inspectorList").remove();

            if (tid.includes("img")) {
                var container = target.parents('.ideal-image-container');
                //////console.log('target.parents(\'.ideal-image-container\')',target.parents('.ideal-image-container'));
            } else {
                var container = target;
            }

            hideAnyCropMenu();
            $('#moodboard .multi').removeClass("multi");
            $('#moodboard .ideal-image-container').removeClass('highlight');
            setTimeout(function () {
                //////console.log("container", $(container));
                $(container).addClass("highlight");
                highlighted_element = $(container);

                hackedHideMenu($('#moodboard .ideal-image-container:not(.highlight)'));


                setTimeout(function () {
                    $(container).resizable({
                        aspectRatio: true,
                        minHeight: 100,
                        minWidth: 100,
                    });


                    hackedShowMenu(container);
                    //////console.log("conatiner", container);
                    container.children('a').children('img').addClass("setColor");
                    if (container.hasClass('primitive')) {
                        selected_element = container.children('a').children('img');

                    } else {
                        selected_element = container.children('a').children('img');
                        selected_id = selected_element[0].id;
                        current_image = JSON.parse(localStorage.getItem(selected_id));
                        labels = Object.keys(current_image[0]["Labels"]);
                        filterElements(labels);
                    }

                }, 100);
            }, 10);


        }
    });

    // moodboard double click menu
    $('body').on('dblclick', '#moodboard', function (event) {
        event.preventDefault();
        if (document.selection && document.selection.empty) {
            document.selection.empty();
        } else if (window.getSelection) {
            var sel = window.getSelection();
            sel.removeAllRanges();
        }
        var target = $(event.target);
        var tid = target.attr('id');
        if (tid == "moodboard") {
            $('#moodboard .menuHolder').remove();
            var currentMousePos = {x: -1, y: -1};
            currentMousePos.x = event.pageX - 430;
            currentMousePos.y = event.pageY;
            //////console.log("x: " + currentMousePos.x + ", y: " + currentMousePos.y);
            var popMenu = '<div class="menuHolder">' +
                '<a href="#popMenu"></a>' +
                '<ul id="popMenu" class="wheel">' +
                '<li class="item"><a href="#home" name="Box" title="Box">Box</a></li>' +
                '<li class="item sticky-button"><a href="#home" name="Sticky" title="Sticky">Sticky</a></li>' +
                '<li class="item"><a href="#home" name="Circle" title="Circle">Circle</a></li>' +
                '<li class="item"><a href="#home" name="Text" title="Text">[Text]</a></li></ul></div>';
            $('#moodboard').append(popMenu);
            $('#moodboard .menuHolder').css('left', currentMousePos.x);
            $('#moodboard .menuHolder').css('top', currentMousePos.y);

            hackedShowMenu($('#moodboard .menuHolder'));

            $("#popMenu").off().on("click", function (event) {
                //////console.log("something clicked on this menu");
                backgroundFunctions(event, $(event.target).attr('name'));
            });
        }
    });

    // hide menu on resize start
    $('#moodboard').on('resizestart', '.highlight', function () {
        hackedHideMenu($('#moodboard .highlight'));
    });

    // show a new resized menu on resize stop
    $('#moodboard').on('resizestop', '.highlight', function (event, ui) {
        //fitImageSize(ui.element);
        console.log(ui);
        hackedShowMenu($('#moodboard .highlight'));
        if (ui.element.hasClass("primitive")) {
            //nothing
        } else {
            updateSaveImage($('#moodboard .highlight'), 'Width');
            updateSaveImage($('#moodboard .highlight'), 'Height');
        }
        if (currentTab == 'RationaleTab') {
            getCloudLabels('moodboard-item', 'Size');
            if ($('#displayKeywords').attr('checked') == 'checked') {
                showKeywords();
            }
        }
    });


    $('#stack .scrollable-container').on("click", function (e) {
        var element = $(".stack-item");
        hackedHideMenu(element);
    });


    $('#stack .scrollable-container').on("drag", function (e) {
        var element = $(".stack-item");
        hackedHideMenu(element);
    });


    $("#save").click(function () {
        html2canvas(document.getElementById('moodboard'), {
            useCORS: true
        })
            .then(function (canvas) {
                theCanvas = canvas;

                canvas.toBlob(function (blob) {
                    saveAs(blob, "Moodboard_" + ~~(Date.now() / 1000) + ".png");
                });
            })
            .catch(function (err) {
                //////console.log(err);
            });

    });


    $("#groupLabels").click(function () {

        var min_left = 0;
        var min_top = 0;
        var max_low_left = 0;
        var max_top_right = 0;

        var multiSelect = $('.multi').get();
        for (var i = 0; i < multiSelect.length; i++) {
            //////console.log("test", multiSelect[i]);
            t = multiSelect[i]['style']['top'].replace("px", "");
            l = multiSelect[i]['style']['left'].replace("px", "");
            w = multiSelect[i]['style']['width'].replace("px", "");
            h = multiSelect[i]['style']['height'].replace("px", "");

            if (min_left == 0) {
                min_left = l;
            } else {
                min_left = Math.min(min_left, l);
            }


            if (min_top == 0) {
                min_top = t;
            } else {
                min_top = Math.min(min_top, t);
            }

            max_low_left = Math.max(max_low_left, Number(t) + Number(h));
            max_top_right = Math.max(max_top_right, Number(l) + Number(w));
        }


        //////console.log("max", min_left, min_top, max_low_left, max_top_right);

        var containerList = []
        var board = document.getElementById('moodboard');
        var divs = board.getElementsByTagName('div');
        for (var i = 0; i < divs.length; i++) {
            if ((divs[i].classList.contains('ideal-image-container') || divs[i].classList.contains('primitive')) && !divs[i].classList.contains('multi')) {
                divs[i].setAttribute('data-html2canvas-ignore', true);
                //////console.log("to ignore",divs[i].id);

            } else if (divs[i].classList.contains('multi')) {
                containerList.push(divs[i].id);
            }
        }

        $("#moodboard div").removeClass('multi');

        html2canvas(document.getElementById("moodboard"), {
            x: document.getElementById("moodboard").parentElement.offsetLeft + min_left,
            y: min_top,
            width: max_top_right - min_left,
            height: max_low_left - min_top,
            useCORS: true,

        })
            .then(function (canvas) {
                document.body.appendChild(canvas);
                theCanvas = canvas;

                var groupImage = canvas.toDataURL();
                //////console.log('image', groupImage);

                var res = groupImage.split(",");
                queryImageLabels('groupImage', res[res.length - 1]);
                /*canvas.toBlob(function (blob) {
                    saveAs(blob, "Moodboard_" + ~~(Date.now() / 1000) + ".png");
                });*/

            })

            .catch(function (err) {
                //////console.log(err);
            });

        $("#moodboard div").removeAttr('data-html2canvas-ignore');
        setTimeout(function () {
            for (i = 0; i < containerList.length; i++) {
                $("#" + containerList[i]).addClass('multi');
            }
        }, 30);

    });


})
;


function save_mb() {
    //////console.log('here comes the inner html');
    var content = document.getElementById('collageArea').innerHTML;


    //content = content.replace("&nbsp;", "").replace('&amp', '').replace('\n', '');


    // Collect data
    var dataObj_search = {
        'content': content
    };
    var dataStr_mb = JSON.stringify(dataObj_search);

    $.ajax({
        url: "/save_mb",
        type: "POST",
        data: dataStr_mb,
        contentType: "application/json",
        dataType: "json", // Expected response data type
        cache: false
    })
        .always(function (xhr, status) {
        })
        .done(function (data) {
            // change source
            //////console.log('saved')
        })
};


/* search behavior */

function search2() {
    var NbImg = 0;
    search_labels.length = 0;
    var search_term_org = $("#search").html();
    search_term = search_term_org.replace("<span>", "").replace("</span>", "");
    var regex = /<img[^>]+id="([^"]+)"[^>]*>/g;
    var image_list = [];
    search_term_noimg = $("<p/>").html(search_term_org).text().replace(regex, " ").replace("&nbsp;", "");

    search_labels.push(search_term_noimg);
    NbImg = (search_term.match(/<img/g) || []).length;

    if (NbImg > 0) {
        // first clear the search_term of images to get the typed search terms
        do {
            m = regex.exec(search_term);
            if (m) {
                current_image = JSON.parse(localStorage.getItem(m[1]));
                image_list.push([current_image[0]["LocalAddress"], current_image[0]['Index']]);
                //////console.log("image_list: ", image_list, ", current_image: ", current_image[0]);

                current_image_labels = current_image[0]["Labels"];
                Object.keys(current_image_labels).forEach(function (key) {
                    if (current_image_labels[key] == 2) {
                        search_labels.push(String(key));
                    }
                })
                Object.keys(current_image_labels).forEach(function (key) {
                    if (current_image_labels[key] == 1) {
                        search_labels.push(String(key));
                    }
                })
            }
        } while (m);

        var searchObj = JSON.stringify(search_labels.join());
        searchAPI(searchObj);
        //console.log("searched for", searchObj);

    } else {

        var searchObj = JSON.stringify(search_labels.join());
        searchAPI(searchObj);
        console.log("searched for without image", searchObj);
    }


    //add search obj to history
    var current_history_id = 'history_item_' + history_id;
    var container_link = $('<a>', {href: '#', class: 'history-word', id: current_history_id});
    if (image_list.length > 0) {
        for (i = 0; i < image_list.length; i++) {

            var h_img = $('<img>', {src: image_list[i][0], id: image_list[i][1]});
            //h_img.data('labels',image_list[i][1]);
            container_link.prepend(h_img)
        }
        container_link.prepend($('<span>').text(search_term_noimg))
    } else {
        container_link.prepend($('<span>').text(search_term_noimg))
    }

    container_link.prependTo("#searchHistory .scrollable-container");
    history_id = history_id + 1;

    /* add event listener to history*/
    $("a.history-word").off().on("click", function (e) {

        if ($('#search').text() == "Keywords, pictures…") {
            $('#search').removeClass("idle");
            $('#search').text("");
        }

        addHistoryToSearch(e.currentTarget.id);
        addToSearchInspector(e.currentTarget.children[1].id)
    });
}


function searchAPI(searchObj) {

    console.log('to search', searchObj);
    if ($('#duck').prop('checked') == true) {
        $.ajax({
            url: "/search",
            type: "POST",
            data: searchObj,
            crossDomain: true,
            contentType: "application/json",
            dataType: "json", // Expected response data type
            cache: false
        })
            .done(function (data) {
                current_search_results = data;
                ////////console.log(current_search_results);

                for (var testUrl_id in data) {
                    runImage(current_search_results[testUrl_id], testUrl_id);
                }

                current_search_results_list = Object.keys(current_search_results);

            });
    } else if ($('#google').prop('checked') == true) {
        for (var a = 0; a < 1; a++) {
            var term = searchObj.replace('"', '').replace('"', '');

            var data = JSON.stringify(false);
            var xhr = new XMLHttpRequest();
            xhr.withCredentials = true;


            xhr.addEventListener("readystatechange", function () {
                current_search_results = {};
                if (this.readyState === 4) {
                    var jsonResponse = JSON.parse(this.responseText);
                    for (i = 0; i < 10; i++) {
                        current_search_results[i + (a * 10)] = jsonResponse['items'][i]['link']
                    }

                    //////console.log("results", current_search_results);
                    for (var testUrl_id in current_search_results) {
                        runImage(current_search_results[testUrl_id], testUrl_id);
                    }
                    current_search_results_list = Object.keys(current_search_results);


                }
            });

            xhr.open("GET", "https://www.googleapis.com/customsearch/v1?key=AIzaSyANg_bT9XwouGISw5mVyE_-mjN771Rvt4k&cx=001887709127664560539:9tipzpjf8wg&imgType=photo&searchType=image&filter=1&q=" + String(term) + "&start=" + String(1 + (a * 10)));
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.setRequestHeader("cache-control", "no-cache");
            xhr.setRequestHeader("Postman-Token", "63291d1c-d523-45af-ba23-2cb92ba9abf8");
            xhr.send(data);

        }
    } else if ($('#bing').prop('checked') == true) {


        //////console.log("bing not here yet");

    }

}


function queryImageLabels(element, content) {
    ////console.log(content);
    var type = "LABEL_DETECTION";

    // Strip out the file prefix when you convert to json.
    var json = '{' +
        ' "requests": [' +
        '	{ ' +
        '	  "image": {' +
        '	    "content":"' + content.replace("data:image/jpeg;base64,", "") + '"' +
        '	  },' +
        '	  "features": [' +
        '	      {' +
        '	      	"type": "' + type + '",' +
        '			"maxResults": 10' +
        '	      }' +
        '	  ]' +
        '	}' +
        ']' +
        '}';


    $.ajax({
        type: 'POST',
        url: "https://vision.googleapis.com/v1/images:annotate?key=" + api_key,
        dataType: 'json',
        data: json,
        //Include headers, otherwise you get an odd 400 error.
        headers: {
            "Content-Type": "application/json",
        },

        success: function (data, textStatus, jqXHR) {
            //displayJSON(data);
            labelObj = {};
            //////console.log('vision api response', data['responses']);
            for (i = 0; i < data['responses'][0]['labelAnnotations'].length; i++) {
                var term = data['responses'][0]['labelAnnotations'][i]['description'];
                if (!Object.keys(labelObj).includes(term)) {
                    labelObj[term] = 0;
                }
            }

            setTimeout(function () {
                if (element != 'groupImage') {
                    updateSaveImage(element, 'Labels', labelObj);
                    current_image = element.children('a').children('img')[0].id;
                    current_image_src = $('#' + current_image)[0].src;
                    writeLabels(Object.keys(labelObj), current_image_src);
                } else if (element == 'groupImage') {
                    //////console.log('labels for a group', labelObj);
                    showGroupCloud(labelObj);
                } else {
                    //////console.log('what the hell are you; ', element);
                }
            }, 40);

        },
        error: function (jqXHR, textStatus, errorThrown) {
            //////console.log('ERRORS: ' + textStatus + ' ' + errorThrown);
        }
    });

}


function urlExists(url, id, timeoutT) {
    return new Promise(function (resolve, reject) {
        var timeout = timeoutT || 100000;
        var timer, img = new Image();
        img.onerror = img.onabort = function () {
            clearTimeout(timer);

            delete current_search_results[id];
            reject("error");
        };
        img.onload = function () {
            clearTimeout(timer);
            resolve("success");
        };
        timer = setTimeout(function () {
            delete current_search_results[id];
            reject("timeout");
        }, timeout);
        img.src = url;
    });
}

function runImage(url, id) {
    //renderImages(id, 'success')
    if (!url.includes('pixabay')) {
        urlExists(url, id).then(renderImages.bind(null, id));
    } else {
        //////console.log("pixa?",url);
    }
}


/* add History to Search */

function addHistoryToSearch(element) {
    //////console.log('triggered add');
    $("#search").append(' ' + $('#' + element).html());
}


/////////////////////////////////////////////////////
//
//* Images */
//
/////////////////////////////////////////////////////

/* Create image */


function renderImages(id, result) {
    ////console.log('please render', id);
    ////console.log('img id', img_id);

    if (result == "success") {
        var newImageTile = $('#widgets .ideal-image-container').clone();
        newImageTile.attr('id', 'container_' + img_id);
        //$('.searchResults').masonry( 'addItems', newImageTile )
        newImageTile.appendTo('#imgGallery');

        //console.log(sem);
        if (sem == false) {
            $("li:has('a'):contains('Inspect')").remove();
        }

        newImageTile.children('a').attr('href', '#wheel' + img_id);
        newImageTile.children('ul').attr('id', 'wheel' + img_id);

        newImageTile.children('a').children('img').attr('id', 'img_' + img_id);
        newImageTile.children('a').children('img').attr("src", current_search_results[id]);

        //////console.log("new element", newImageTile);
        make_draggable(newImageTile);

        $("#wheel" + img_id).off().on("click", function (e) {
            current_image = e.currentTarget.id.replace("wheel", "container_");
            highlighted_element = $('#' + current_image);
            wheelFunctions(e, $(e.target).attr('name'));
        });

        img_id = img_id + 1;
    }
}

function renderPrimitives(id, type, cl_name, x, y) {
    var newElement = $('#widgetPrimitive .ideal-image-container').clone();
    ////console.log("new element", newElement.children('ul').children);


    var current_name = type + '_' + id;
    newElement.attr('id', current_name);
    newElement.attr('class', cl_name);
    newElement.addClass("ideal-image-container");
    newElement.addClass("primitive");
    newElement.css({"left": x, "top": y});
    newElement.appendTo('#moodboard');

    newElement.children('a').attr('href', '#wheel' + '_' + current_name);
    newElement.children('ul').attr('id', 'wheel' + '_' + current_name);

    newElement.children('a').children('img').attr('id', 'img_' + current_name);
    newElement.children('a').children('img').attr('class', type);
    newElement.children('a').children('img').attr('src', "../static/css/icons/pixel.png");

    make_draggable(newElement);
    newElement.resizable();


    $('#wheel' + '_' + current_name).off().on("click", function (e) {
        current_image = e.currentTarget.id.replace("wheel_", "");

        highlighted_element = $('#' + current_image);

        wheelFunctions(e, $(e.target).attr('name'));

    });


    $(newElement).addClass("highlight");
    highlighted_element = $(newElement);
    hackedShowMenu(newElement);


}


/* Dragging behavior */

function make_draggable(item) {
    item.draggable({
        helper: 'clone',
        appendTo: 'body',
        scroll: false,
        distance: 5,
        appendTo: '.moodboard_canvas',
        //containment: 'document',

        start: function (event, ui) {
            unselectBoardObjects();
            var itemWidth = $(this).width();
            var itemHeight = $(this).height();

            if (item.hasClass('ui-resizable')) {
                var delta = 0;
            } else {
                var delta = 20;
            }
            $(this)
                .css('width', itemWidth + delta)
                .css('height', itemHeight + delta)
                .addClass("item-dragging")
                .addClass("mb_location");

            ui.helper.width(itemWidth + delta);
            ui.helper.height(itemHeight + delta);


        },
        stop: function (event, ui) {
            $(this).removeClass("item-dragging");
        },
    });
}

/* stack element sizer */

function stacksize(target) {
    var twidth = $(target).find('img').outerWidth() + 40;
    //////console.log(twidth);
    $(target).css('width', twidth);
}


function boardsize(target, amount) {
    //////console.log("target", target);
    var bwidth = $(target).find('img').outerWidth() + amount;
    var bheight = $(target).find('img').outerHeight() + amount;
    //////console.log(twidth);
    $(target).css('width', bwidth);
    $(target).css('height', bheight);
}

/* Dropping behavior */

$(function () {

    $(".moodboard_canvas").droppable({
        accept: ".ideal-image-container",
        tolerance: "pointer",
        over: function (event, ui) {
        },
        out: function (event, ui) {
        },
        drop: function (event, ui) {
            //////console.log("something dropped");


            ui.draggable.css('top', ui.position.top);
            ui.draggable.css('left', ui.position.left);
            ui.draggable.css('position', 'absolute');
            ui.draggable.draggable('destroy');
            setTimeout(function () {
                make_draggable(ui.draggable);
            }, 10);


            if (ui.draggable.hasClass("moodboard-item")) {
                //////console.log("already exists");
                updateSaveImage($(ui.draggable), 'Top');
                updateSaveImage($(ui.draggable), 'Left');

                if (ui.draggable.hasClass("cropper")) {
                    hackedHideMenu($('#moodboard .highlight'));
                } else {
                    hideAnyCropMenu();

                    $('#moodboard .ideal-image-container').removeClass('highlight');
                    hackedHideMenu($('#moodboard .ideal-image-container'));
                    setTimeout(function () {

                        $(ui.draggable).addClass("highlight");
                        $(ui.draggable).resizable({
                            aspectRatio: true,
                            minHeight: 100,
                            minWidth: 100,
                        });
                        hackedShowMenu(ui.draggable);

                    }, 250);
                }
            } else if (ui.draggable.hasClass("stack-item")) {
                ui.draggable.removeClass('stack-item');
                ui.draggable.addClass("moodboard-item");

                ui.draggable.appendTo("#moodboard");
                updateSaveImage($(ui.draggable), 'Top');
                updateSaveImage($(ui.draggable), 'Left');
                boardsize($(ui.draggable), 100);

                hideAnyCropMenu();
                $('#moodboard .ideal-image-container').removeClass('highlight');
                hackedHideMenu($('#moodboard .ideal-image-container'));

                //console.log("dragged here", $(ui.draggable).children('a').children('img')[0].id);
                current_image = JSON.parse(localStorage.getItem(element.children('a').children('img')[0].id));
                var labels = current_image[0]['Labels'];
                //console.log("labels", labels);

                if (!Object.keys(labels).length) {
                    console.log("I don't have labels yet");
                    img_to_label = $(ui.draggable).children('a').children('img')[0].src;
                    ////////console.log('img_to_label', img_to_label);

                    var xhr = new XMLHttpRequest();
                    xhr.responseType = "blob";
                    xhr.open("GET", img_to_label, true);
                    xhr.onload = function (e) {
                        //console.log('to load', this.response);
                        var reader = new FileReader();
                        reader.onload = function (event) {
                            var imageAsBase64 = event.target.result;
                            var res = imageAsBase64.split(",");
                            queryImageLabels($(ui.draggable), res[res.length - 1]);


                        }
                        var file = this.response;
                        reader.readAsDataURL(file)
                    };
                    xhr.send();

                }

                setTimeout(function () {

                    $(ui.draggable).addClass("highlight");
                    $(ui.draggable).resizable({
                        aspectRatio: true,
                        minHeight: 100,
                        minWidth: 100,
                    });
                    hackedShowMenu(ui.draggable);


                }, 250);
            } else if (ui.draggable.hasClass("primitive")) {
                //////console.log("already exists");
            } else if (ui.draggable.hasClass("text_fields")) {
                //////console.log("already exists");
            } else {

                // Collect information
                $(this).append(ui.draggable);
                boardsize($(ui.draggable), 80);

                // Add highlight and add menu
                ui.draggable.addClass("moodboard-item");
                hideAnyCropMenu();
                $('#moodboard .ideal-image-container').removeClass('highlight');
                hackedHideMenu($('#moodboard .ideal-image-container'));
                setTimeout(function () {

                    $(ui.draggable).addClass("highlight");
                    $(ui.draggable).resizable({
                        aspectRatio: true,
                        minHeight: 100,
                        minWidth: 100,
                    });
                    hackedShowMenu(ui.draggable);

                }, 250);

                var src_search = ui.draggable.children('a').children('img')[0].currentSrc;
                var location_id_search = "moodboard_search";

                highlighted_element = ui.draggable;
                to_top();

                // Add image to localStorage
                saveImage($(ui.draggable), src_search);

                //colorPalette = getColorPalette($(ui.draggable));
                //updateSaveImage($(ui.draggable), 'Color', colorPalette);


                // Collect data
                var dataObj_search = {
                    'image': src_search,
                    'location': location_id_search,
                    'search_term': search_labels
                };
                var dataStr_search = JSON.stringify(dataObj_search);
                //console.log("send to save mb", dataStr_search);


                $.ajax({
                    url: "/load",
                    type: "POST",
                    data: dataStr_search,
                    contentType: "application/json",
                    dataType: "json", // Expected response data type
                    cache: false
                })
                    .always(function (xhr, status) {
                    })
                    .done(function (data) {

                        //

                        // change source
                        var src1_search = data['imgSrc'];
                        //////console.log('img', src1_search);
                        $(ui.draggable).children('a').children('img').attr("src", src1_search);
                        updateSaveImage($(ui.draggable), 'LocalAddress', src1_search);
                        updateSaveImage($(ui.draggable), 'Color', data['colorPalette']);

                        var labels = data['labels'];

                        if (labels == 0) {
                            //console.log("I don't have labels yet");
                            img_to_label = $(ui.draggable).children('a').children('img')[0].src;
                            ////////console.log('img_to_label', img_to_label);

                            var xhr = new XMLHttpRequest();
                            xhr.open("GET", img_to_label, true);
                            xhr.responseType = "blob";
                            xhr.onload = function (e) {
                                //console.log('to load', this.response);
                                var reader = new FileReader();
                                reader.onload = function (event) {
                                    var imageAsBase64 = event.target.result;
                                    var res = imageAsBase64.split(",");
                                    queryImageLabels($(ui.draggable), res[res.length - 1]);


                                }
                                var file = this.response;
                                reader.readAsDataURL(file)
                            };
                            xhr.send();

                        } else {
                            label_list = {};
                            ////////console.log("labels", labels);
                            labels.forEach(function (entry) {
                                k = entry.replace("'", "").replace("'", "");
                                label_list[k] = 0;
                                //console.log(k);
                            });
                            updateSaveImage($(ui.draggable), 'Labels', label_list);

                        }
                    })
            }
        }

    }),
        $(".mood-stack").droppable({
            accept: ".ideal-image-container",
            tolerance: "pointer",
            over: function (event, ui) {
            },
            out: function (event, ui) {

            },
            drop: function (event, ui) {

                element = $(ui.draggable);
                hackedHideMenu(element);
                hideAnyCropMenu();
                element.removeClass('highlight');

                if (ui.draggable.hasClass("stack-item")) {
                    updateSaveImage($(ui.draggable), 'Top');
                    updateSaveImage($(ui.draggable), 'Left');
                } else if (ui.draggable.hasClass("moodboard-item")) {

                    ui.draggable.removeClass('moodboard-item');
                    ui.draggable.addClass("stack-item");
                    ui.draggable.prependTo("#stack .scrollable-container");

                    ui.draggable.draggable('destroy');
                    ui.draggable.removeAttr('style');
                    updateSaveImage($(ui.draggable), 'Top');
                    updateSaveImage($(ui.draggable), 'Left');
                    stacksize(ui.draggable);
                    setTimeout(function () {
                        make_draggable(ui.draggable);
                    }, 100);


                } else if (ui.draggable.hasClass("primitive")) {
                    //////console.log("already exists");
                } else if (ui.draggable.hasClass("text_fields")) {
                    //////console.log("already exists");
                } else if (ui.draggable.hasClass("upload")) {
                    //////console.log("already exists");
                } else {


                    ui.draggable.prependTo("#stack .scrollable-container");
                    ui.draggable.addClass("stack-item");
                    //$(this).append(ui.draggable);
                    ui.draggable.css('top', ui.position.top);
                    ui.draggable.css('left', ui.position.left);
                    ui.draggable.css('position', 'absolute');
                    ui.draggable.draggable('destroy');
                    ui.draggable.removeAttr('style');
                    stacksize(ui.draggable);
                    setTimeout(function () {
                        make_draggable(ui.draggable);
                    }, 10);

                    var src_search = ui.draggable.children('a').children('img')[0].currentSrc;
                    var location_id_search = "moodboard_search";

                    highlighted_element = ui.draggable;
                    to_top();
                    saveImage($(ui.draggable), src_search);

                    // Collect data
                    var dataObj_search = {
                        'image': src_search,
                        'location': location_id_search,
                        'search_term': search_labels
                    };
                    var dataStr_search = JSON.stringify(dataObj_search);
                    //console.log("send to save", dataStr_search);

                    $.ajax({
                        url: "/load",
                        type: "POST",
                        data: dataStr_search,
                        contentType: "application/json",
                        dataType: "json", // Expected response data type
                        cache: false
                    })
                        .always(function (xhr, status) {
                        })

                        .done(function (data) {
                            // change sourcevar src1_search = data['imgSrc'];
                            $(ui.draggable).children('a').children('img').attr("src", src_search);
                            updateSaveImage($(ui.draggable), 'LocalAddress', src_search);
                            updateSaveImage($(ui.draggable), 'Color', data['colorPalette']);
                            var labels = data['labels'];
                            //
                            //console.log("labels", labels);


                            if (labels == 0) {
                                //////console.log("I don't have labels yet");
                                img_to_label = $(ui.draggable).children('a').children('img')[0].src;
                                ////////console.log('img_to_label', img_to_label);

                                var xhr = new XMLHttpRequest();
                                xhr.open("GET", img_to_label, true);
                                xhr.responseType = "blob";
                                xhr.onload = function (e) {
                                    ////////console.log('to load', this.response);
                                    var reader = new FileReader();
                                    reader.onload = function (event) {
                                        var imageAsBase64 = event.target.result;
                                        var res = imageAsBase64.split(",");
                                        queryImageLabels($(ui.draggable), res[res.length - 1]);


                                    }
                                    var file = this.response;
                                    reader.readAsDataURL(file)
                                };
                                xhr.send();

                            } else {
                                label_list = {};
                                ////////console.log("labels", labels);
                                labels.forEach(function (entry) {
                                    k = entry.replace("'", "").replace("'", "");
                                    label_list[k] = 0;
                                });
                                updateSaveImage($(ui.draggable), 'Labels', label_list);

                            }
                        })
                }
            }
        }),
        $(".searchBar").droppable({
            accept: ".ideal-image-container",
            tolerance: "pointer",
            over: function (event, ui) {

            },
            out: function (event, ui) {

            },
            drop: function (event, ui) {
                element = $(ui.draggable);
                focusSearch();

                if (document.querySelector('[contenteditable]').innerHTML == "Keywords, pictures…") {
                    document.querySelector('[contenteditable]').innerHTML = "";
                }


                document.querySelector('[contenteditable]').appendChild(element.children('a').children('img')[0].cloneNode(true));
                current_image = JSON.parse(localStorage.getItem(element.children('a').children('img')[0].id));

                if (current_image == null) {
                    img_to_label = element.children('a').children('img')[0].src;
                    console.log('img_to_label', img_to_label);
                    var location_id_search = "direct_search";

                    saveImage(element, img_to_label);

                    var dataObj_search = {
                        'image': img_to_label,
                        'location': location_id_search,
                        'search_term': search_labels
                    };
                    var dataStr_search = JSON.stringify(dataObj_search);

                    $.ajax({
                        url: "/load",
                        type: "POST",
                        data: dataStr_search,
                        contentType: "application/json",
                        dataType: "json", // Expected response data type
                        cache: false
                    })
                        .always(function (xhr, status) {
                        })

                        .done(function (data) {
                            // change source
                            var src1_search = data['imgSrc'];
                            $(ui.draggable).children('a').children('img').attr("src", src1_search);
                            updateSaveImage($(ui.draggable), 'LocalAddress', src1_search);

                            var labels = data['labels'];
                            ////////console.log("labels", labels);


                            if (labels == 0) {
                                //////console.log("I don't have labels yet");
                                img_to_label = $(ui.draggable).children('a').children('img')[0].src;
                                ////////console.log('img_to_label', img_to_label);

                                var xhr = new XMLHttpRequest();
                                xhr.open("GET", img_to_label, true);
                                xhr.responseType = "blob";
                                xhr.onload = function (e) {
                                    ////////console.log('to load', this.response);
                                    var reader = new FileReader();
                                    reader.onload = function (event) {
                                        var imageAsBase64 = event.target.result;
                                        var res = imageAsBase64.split(",");
                                        queryImageLabels($(ui.draggable), res[res.length - 1]);

                                    }
                                    var file = this.response;
                                    reader.readAsDataURL(file)
                                };
                                xhr.send();
                                setTimeout(function () {
                                    current_image = JSON.parse(localStorage.getItem(element.children('a').children('img')[0].id));
                                    current_image_id = current_image[0]["Index"];
                                    if (sem == true) {
                                        addToSearchInspector(current_image_id)
                                    }
                                }, 3000);


                            } else {
                                label_list = {};
                                ////////console.log("labels", labels);
                                labels.forEach(function (entry) {
                                    k = entry.replace("'", "").replace("'", "");
                                    label_list[k] = 0;
                                });
                                updateSaveImage($(ui.draggable), 'Labels', label_list);
                                setTimeout(function () {
                                    current_image = JSON.parse(localStorage.getItem(element.children('a').children('img')[0].id));
                                    current_image_id = current_image[0]["Index"];
                                    if (sem == true) {

                                        addToSearchInspector(current_image_id)
                                    }
                                }, 3000);

                            }
                        })
                } else {
                    current_image_id = current_image[0]["Index"];

                    //////console.log('id here', current_image_id);
                    $("#moodboard .inspectorlist").remove();
                    if (sem == true) {

                        addToSearchInspector(current_image_id)
                    }
                }
            }
        })
})
;

function createCORSRequest(method, url) {
    var xhr = new XMLHttpRequest();
    if ("withCredentials" in xhr) {
        // XHR for Chrome/Firefox/Opera/Safari.
        xhr.open(method, url, true);
    } else if (typeof XDomainRequest != "undefined") {
        // XDomainRequest for IE.
        xhr = new XDomainRequest();
        xhr.open(method, url);
    } else {
        // CORS not supported.
        xhr = null;
    }
    return xhr;
}


/* Save dropped image feature and labels*/

function saveImage(img, src) {
    var imgArray = [];

    //  add image descriptors to the array
    var imgIndex = img.children('a').children('img')[0].id;
    var lables = {};
    var width = img[0].style['width'];
    var height = img[0].style['height'];
    var top = img[0].style['top'];
    var left = img[0].style['left'];
    var color = {};


    imgArray.push({
        Index: imgIndex,
        Src: src,
        LocalAddress: 'not set yet',
        Color: 'not set yet',
        Labels: lables,
        Width: width,
        Height: height,
        Top: top,
        Left: left
    });

    // and save the json string into local storage
    localStorage.setItem(String(imgIndex), JSON.stringify(imgArray));
}

function updateSaveImage(img, name, value) {
    var imgIndex = img.children('a').children('img')[0].id;
    value = value || 0;

    if (value == 0) {
        lowName = name.toLowerCase();
        value = img[0].style[lowName]
    }

    /* get saved values; parse values; update value; set new saved values*/
    oldValues = localStorage.getItem(String(imgIndex));

    ValuesClear = JSON.parse(oldValues);
    //////console.log("values", value);
    ValuesClear[0][name] = value;
    newValues = JSON.stringify(ValuesClear);

    localStorage.setItem(String(imgIndex), newValues);

    if (Object.keys(ValuesClear[0]["Labels"]).length > 0) {
        if (!Object.values(ValuesClear[0]["Labels"]).includes(1) && !Object.values(ValuesClear[0]["Labels"]).includes(2)) {
            updateImageLabels(ValuesClear[0]['Index'], Object.keys(ValuesClear[0]["Labels"])[0], 2);
            updateImageLabels(ValuesClear[0]['Index'], Object.keys(ValuesClear[0]["Labels"])[1], 1);
            updateImageLabels(ValuesClear[0]['Index'], Object.keys(ValuesClear[0]["Labels"])[2], 1);
        }
    }
}

function updateImageLabels(imgIndex, labelname, value) {
    /* get saved values; parse values; update value; set new saved values*/
    //console.log(labelname);
    oldValues = localStorage.getItem(String(imgIndex));
    ValuesClear = JSON.parse(oldValues);
    ValuesClear[0]['Labels'][labelname] = value;
    newValues = JSON.stringify(ValuesClear);
    localStorage.setItem(String(imgIndex), newValues);
}

function writeLabels(labels, path) {
    var dataObj = {'labels': labels, 'path': path};
    //console.log('laberls', labels);
    var dataStr_label = JSON.stringify(dataObj);
    //console.log('laberls after ', dataStr_label);

    $.ajax({
        url: "/load_labels",
        type: "POST",
        data: dataStr_label,
        contentType: "application/json",
        dataType: "json", // Expected response data type
        cache: false
    })
        .always(function (xhr, status) {
        })

        .done(function (data) {
            //////console.log("labels written");
        });
}


/////////////////////////////////////////////////////
//
//* Menu */
//
/////////////////////////////////////////////////////


/* Menu features */

function wheelFunctions(element, action) {

    //console.log('wheelFunctions', element, action);

    if (action == 'Front') {
        to_top();
    } else if (action == 'Back') {
        to_bottom();
    } else if (action == 'Crop') {
        hideAnyCropMenu();
        setTimeout(function () {
            cropThisShit();
        }, 100);
    } else if (action == 'Delete') {
        to_delete();
    } else if (action == 'Focus') {
        select_img_part();
    } else if (action == 'Inspect') {
        hackedHideMenu($('#moodboard .highlight'));
        if ($(element.currentTarget.parentNode).hasClass('inspected')) {
            //////console.log("already shown");
        } else {
            $(element.currentTarget.parentNode).addClass('inspected');
            open_inspector($(element.currentTarget.parentNode));
        }
    } else if (action == 'Color') {

        if ($(element.currentTarget.parentNode).hasClass("primitive")) {
            change_color_primitives($(element.currentTarget.parentNode));
        } else {
            //////console.log("Nothing here yet");
            change_color_filter($(element.currentTarget.parentNode));
        }

    } else if (action == 'Resize') {
        hackedHideMenu($('#moodboard .highlight'));
    }
}

function backgroundFunctions(element, action) {
    var position = $("#moodboard .menuHolder").position();
    var x = position.left;
    var y = position.top;
    if (action == 'Box') {
        add_boxes(x, y);
    } else if (action == 'Circle') {
        add_circles(x, y);
    } else if (action == 'Text') {
        add_text(x, y);
    } else if (action == 'Sticky') {
        add_sticky(x, y)
    }
}

/* Order manipulations */

function to_top() {
    var element_move = highlighted_element["0"];
    $(element_move).css('z-index', ++highest); // increase highest by 1 and set the style
    highlighted_element = 'null'
}


function to_bottom() {
    var element_move_down = highlighted_element["0"];
    var minZ = 1;
    // var minZ = Math.min.apply(null,
    //     $.map($('div .mb_location'),
    //         function (e, n) {
    //             //////console.log($(e));
    //             return parseInt($(e).css('z-index'));
    //         }
    //     )
    // );

    $(element_move_down).css('z-index', minZ - 1); // decrease element by 1 and set the style
    highlighted_element = 'null';
    unselectBoardObjects();
}


function change_color_primitives(org_element) {
    var colorButton = org_element.children('ul').children('input')[0];
    colorButton.focus();
    colorButton.value = "#FFCC00";
    colorButton.click();

    var element = org_element.children('a').children('img')[0];
    //////console.log('element to be colored', element);

    element.click(function () {
        $("#moodboard img").removeClass("setColor");
        $("#moodboard div").removeClass("setColor");
        element.addClass("setColor");
    });

    colorButton.onchange = function () {
        if (selected_element.hasClass("setColor")) {
            if (selected_element.hasClass("texts")) {
                selected_element[0].css("color", colorButton.value);
            } else if (selected_element.hasClass("box")) {
                selected_element.css("background-color", colorButton.value);
            } else if (selected_element.hasClass("circle")) {
                selected_element.css("background-color", colorButton.value);
            }
        }
    };
}


function change_color_filter(org_element) {
    var colorButton = org_element.children('ul').children('input')[0];
    colorButton.focus();
    colorButton.value = "#FFCC00";
    colorButton.click();

    var element = org_element.children('a').children('img')[0];
    element.click(function () {
        $("#moodboard img").removeClass("setColor");
        $("#moodboard div").removeClass("setColor");
        element.addClass("setColor");
    });

    colorButton.onchange = function () {
        if (selected_element.hasClass("setColor")) {
            //////console.log(colorButton.value);
            var rgb = get_hue_from_hex(colorButton.value);
            var r = rgb[0];
            var g = rgb[1];
            var b = rgb[2];
            var hsl = rgbToHsl(r, g, b);
            var hue = hsl[0] * 360;
            var saturation = hsl[1];
            var luminosity = hsl[2];
            var filterfact = 100 / luminosity;
            $('.highlight').find('img').css({
                "filter": "hue-rotate(" + hue + "deg) saturate(" + filterfact + "%)",
                "-webkit-filter": "hue-rotate(" + hue + "deg) saturate(" + filterfact + "%)"
            });
            var shadowHue = 214 - hue;
            // $('.highlight').find('img').css('box-shadow', '0 0 25px 3px hsl('+ shadowHue +', 100%, 54%)');
        }
    };
}

function change_color_text(org_element) {

    ////console.log('org_element', org_element);
    var colorButton = org_element.children('div #text-editor').children('div').children('input')[0];
    ////console.log('colorButton', colorButton);
    colorButton.focus();
    colorButton.value = "#FFCC00";
    colorButton.click();

    var element = org_element;
    //////console.log('element to be colored', element);

    element.click(function () {
        $("#moodboard img").removeClass("setColor");
        $("#moodboard div").removeClass("setColor");
        element.addClass("setColor");
    });

    colorButton.onchange = function () {
        element.children('.text_field').css('color', colorButton.value);
    };
}


/* color conversion */
function get_hue_from_hex(hex_value) {
    var color = hex_value;
    var r = parseInt(color.substr(1, 2), 16); // Grab the hex representation of red (chars 1-2) and convert to decimal (base 10).
    var g = parseInt(color.substr(3, 2), 16);
    var b = parseInt(color.substr(5, 2), 16);
    return [r, g, b];
}

function rgbToHsl(r, g, b) {
    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if (max == min) {
        h = s = 0; // achromatic
    } else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }

    return [h, s, l];
}


/* select element part */

function select_img_part() {

}

function cropThisShit() {

    showCropMenu($('#moodboard .highlight'));
    hackedHideMenu($('.highlight'));

    highlighted_element["0"].classList.add('cropper');
    var img_id_crop = highlighted_element["0"].children["0"].children["0"].id;

    var actions = document.getElementById('actions');

    var options = {
        // initialAspectRatio: 16 / 9,
        viewMode: 0,
        zoomOnWheel: false,
        zoomOnTouch: false,
        zoomable: false,
        ready: function (e) {
            //////console.log(e.type);
        },
        cropstart: function (e) {
            //////console.log(e.type, e.detail.action);
        },
        cropmove: function (e) {
            //////console.log(e.type, e.detail.action);
        },
        cropend: function (e) {
            //////console.log(e.type, e.detail.action);
        },
        crop: function (event) {
        },
    };


    actions.querySelector('.btn-group').onclick = function (event) {
        var e = event || window.event;
        var target = e.target || e.srcElement;
        var cropped;
        var result;
        var input;
        var data;

        if (!cropper) {
            return;
        }

        while (target !== this) {
            if (target.getAttribute('data-method')) {
                break;
            }

            target = target.parentNode;
        }

        if (target === this || target.disabled || target.className.indexOf('disabled') > -1) {
            return;
        }

        data = {
            method: target.getAttribute('data-method'),
            target: target.getAttribute('data-target'),
            option: target.getAttribute('data-option') || undefined,
            secondOption: target.getAttribute('data-second-option') || undefined
        };


        //////console.log("data of crop menu", data);

        cropped = cropper.cropped;

        if (data.method) {
            if (typeof data.target !== 'undefined') {
                input = document.querySelector(data.target);

                if (!target.hasAttribute('data-option') && data.target && input) {
                    try {
                        data.option = JSON.parse(input.value);
                    } catch (e) {
                        //////console.log(e.message);
                    }
                }
            }

            switch (data.method) {
                case 'rotate':
                    if (cropped && options.viewMode > 0) {
                        cropper.clear();
                    }

                    break;

                case 'getCroppedCanvas':
                    try {
                        data.option = JSON.parse(data.option);
                    } catch (e) {
                        //////console.log(e.message);
                    }

                    if (uploadedImageType === 'image/jpeg') {
                        if (!data.option) {
                            data.option = {};
                        }

                        data.option.fillColor = '#fff';
                    }

                    break;
            }

            result = cropper[data.method](data.option, data.secondOption);

            switch (data.method) {
                case 'rotate':
                    if (cropped && options.viewMode > 0) {
                        cropper.crop();
                    }

                    break;

                case 'scaleX':
                case 'scaleY':
                    target.setAttribute('data-option', -data.option);
                    break;

                case 'crop':

                    cropper.getCroppedCanvas();

                    cropper.getCroppedCanvas({
                        width: 160,
                        height: 90,
                        minWidth: 256,
                        minHeight: 256,
                        maxWidth: 4096,
                        maxHeight: 4096,
                        fillColor: '#fff',
                        imageSmoothingEnabled: false,
                        imageSmoothingQuality: 'high',
                    });

                    var dataURL = cropper.getCroppedCanvas().toDataURL();

                    var dataObj_crop = {
                        'image': dataURL,
                        'location': 'Crop',
                        'search_term': search_labels
                    };
                    var dataStr_crop = JSON.stringify(dataObj_crop);

                    // Use `jQuery.ajax` method
                    $.ajax('/load_crop', {
                        method: "POST",
                        data: dataStr_crop,
                        crossDomain: true,
                        contentType: "application/json",
                        dataType: "json", // Expected response data type
                        cache: false,

                        success: function (data) {
                            //////console.log('Upload success');
                            var src1_search = data['imgSrc'];
                            //////console.log($('#' + img_id_crop)[0]);
                            $('#' + img_id_crop)[0].src = src1_search;
                            var id = img_id_crop.split('_')[1];
                            updateSaveImage($('#container_' + id), 'LocalAddress', src1_search);
                            updateSaveImage($('#container_' + id), 'Color', data['colorPalette']);

                            //////console.log("I don't have labels yet");
                            img_to_label = $('#' + img_id_crop)[0].src;
                            ////////console.log('img_to_label', img_to_label);

                            var xhr = new XMLHttpRequest();
                            xhr.open("GET", img_to_label, true);
                            xhr.responseType = "blob";
                            xhr.onload = function (e) {
                                ////////console.log('to load', this.response);
                                var reader = new FileReader();
                                reader.onload = function (event) {
                                    var imageAsBase64 = event.target.result;
                                    var res = imageAsBase64.split(",");
                                    queryImageLabels($('#container_' + id), res[res.length - 1]);

                                }
                                var file = this.response;
                                reader.readAsDataURL(file)
                            };
                            xhr.send();


                            $('#container_' + id).width($('.cropper-crop-box').width());
                            $('#container_' + id).height($('.cropper-crop-box').height());
                            //hackedShowMenu($('#moodboard .highlight'));
                            hideCropMenu($('.highlight'));
                            cropper = null;
                            highlighted_element["0"].classList.remove('cropper');
                            $('#moodboard #' + img_id_crop)[0].cropper.destroy();


                        }
                        ,
                        error: function () {
                            //////console.log('Upload error')
                        }
                        ,
                    });
                    //});

                    break;

                case 'destroy':

                    $('#moodboard #' + img_id_crop)[0].src = originalImageURL;
                    hackedShowMenu($('#moodboard .highlight'));
                    hideCropMenu($('.highlight'));

                    //////console.log("crop destroy", $('#moodboard #' + img_id_crop));
                    highlighted_element["0"].classList.remove('cropper');
                    cropper = null;
                //$('#moodboard #' + img_id_crop)[0].cropper.destroy();


            }

            if (typeof result === 'object' && result !== cropper && input) {
                try {
                    input.value = JSON.stringify(result);
                } catch (e) {
                    //////console.log(e.message);
                }
            }
        }
    };

    cropper = new Cropper($('#moodboard #' + img_id_crop)[0], options);
    var originalImageURL = $('#moodboard #' + img_id_crop)[0].src;
// Get the Cropper.js instance after initialized

}


/* Delete Image */

function to_delete() {
    var element_delete = highlighted_element;
    var element_id = highlighted_element.attr('id');
    var element_id = element_id.substring(10);
    var keylist_id = '#palette_' + element_id;
    element_delete["0"].remove();
    $(keylist_id).remove();
    highlighted_element = 'null';
    if (currentTab == 'RationaleTab') {
        getCloudLabels('moodboard-item');
        if (klock == 'true') {
            showKeywords();
        }
    }

}


function add_boxes(x, y) {
    renderPrimitives(box_id, 'box', 'boxes', x, y);
    box_id = box_id + 1;
}


function add_circles(x, y) {
    renderPrimitives(circle_id, 'circle', 'circles', x, y);
    circle_id = circle_id + 1;
}


function add_text(x, y) {
    var x = x - 50;
    var y = y + 80;
    var text_element = $('<div>', {class: "ui-draggable ui-draggable-handle text_fields"});
    var input_element = $('<input>', {class: "text_field", id: "text_field" + text_id, type: "text"});
    input_element.appendTo(text_element);
    text_element.css({"left": x, "top": y});
    text_element.appendTo("#moodboard");
    input_element.focus();
    text_element.draggable();
    text_element.resizable();
    text_element.addClass('active');
    var textEditor = $('#text-editor').clone();
    text_element.append(textEditor);
    text_id = text_id + 1;
}

function add_sticky(x, y) {
    var x = x + 30;
    var y = y + 75;
    var W = 120
    var H = 50
    var sticky_element = "<div style='left:" + x + "px; top:" + y + "px;' class='sticky last-sticky' id='sticky_" + sticky_id + "'>"
        + "<textarea class='note-content' style='width: " + W + "px; height: " + H + "px;' placeholder='Write me :-)'/>"
        + "<span class='erase'>×</span>"
        + "</li>";
    $(sticky_element).appendTo("#moodboard");
    highlighted_element = $(".last-sticky");
    to_top();
    $("#moodboard .last-sticky").draggable();

    setTimeout(function () {
        $(".last-sticky").removeClass("last-sticky");
    }, 200);

    sticky_id = sticky_id + 1;
}


function open_inspector(current_container) {


    ////console.log("in inspector", current_container["0"].id, current_container["0"]);
    i_cont = current_container["0"].id;

    if (!$(current_container["0"]).hasClass("primitive")) {
        var theId = $('#' + i_cont).attr('id');
        var theId = theId.substring(10);
        current_image_id = 'img_' + theId;


        var newHud = $('.hud').clone();
        newHud.addClass('inspectorList');
        $('#moodboard').append(newHud);
        newHud.css('display', 'inherit');
        $(newHud).draggable({
            handle: "h2",
            containment: "document",
        });

        //////console.log("id", current_image_id);
        current_image = JSON.parse(localStorage.getItem(current_image_id));
        current_image_top = Number(current_image[0]["Top"].replace("px", ""));
        current_image_width = Number(current_image[0]["Width"].replace("px", "")); // current height
        current_image_left = Number(current_image[0]["Left"].replace("px", "")); // y coordinate
        current_image_labels = current_image[0]["Labels"];

        newHud.css('top', current_image_top);
        newHud.css('left', current_image_left + current_image_width + 5);


        if (!Object.values(ValuesClear[0]["Labels"]).includes(1) && !Object.values(ValuesClear[0]["Labels"]).includes(2)) {
            updateImageLabels(current_image[0]['Index'], Object.keys(current_image_labels)[0], 2);
            updateImageLabels(current_image[0]['Index'], Object.keys(current_image_labels)[1], 1);
            updateImageLabels(current_image[0]['Index'], Object.keys(current_image_labels)[2], 1);
            current_image = JSON.parse(localStorage.getItem(current_image_id));
            current_image_labels = current_image[0]["Labels"];
        }

        //////console.log("labels", current_image_labels);
        Object.keys(current_image_labels).forEach(function (key) {
            var listItem = document.createElement("li");
            listItem.id = key;
            listItem.dataset.src = current_image_id;
            if (current_image_labels[key] == 0) {
                listItem.className = "less";
            } else if (current_image_labels[key] == 2) {
                listItem.className = "more";
            }

            var spanItem = document.createElement("span");
            spanItem.textContent = key;
            spanItem.className = 'keyword';

            var spanItemControl = document.createElement("span");
            spanItemControl.className = "controls";

            var spanItemControlMinus = document.createElement("span");
            spanItemControlMinus.textContent = '-';
            spanItemControlMinus.className = "minus";
            spanItemControl.appendChild(spanItemControlMinus);

            var spanItemControlPlus = document.createElement("span");
            spanItemControlPlus.textContent = '+';
            spanItemControlPlus.className = "plus";
            spanItemControl.appendChild(spanItemControlPlus);


            listItem.appendChild(spanItemControl);
            listItem.appendChild(spanItem);

            $(".inspectorList ul").append(listItem);
        })
        var addElement = '<li id="addElementContainer"><i id="addElement" class="fas fa-plus-circle addItem"></i></li>';
        $(".inspectorList ul").append(addElement);


    } else {

        current_image_id = 'img_' + i_cont;
        var newHud = $('.hud').clone();
        newHud.addClass('inspectorList');
        $('#moodboard').append(newHud);
        newHud.css('display', 'inherit');


        //////console.log("id", current_image_id);
        current_image = current_container["0"];
        current_image_top = current_image.offsetTop;
        current_image_width = current_image.offsetWidth; // current height
        current_image_left = current_image.offsetLeft;// y coordinate


        newHud.css('top', current_image_top);
        newHud.css('left', current_image_left + current_image_width + 5);


        var addElement = '<li id="addElementContainer"><i id="addElement" class="fas fa-plus-circle addItem"></i></li>';
        $(".inspectorList ul").append(addElement);
    }
}

$(function () {
    $("#moodboard").on("click", ".erase", function () {
        $(this).parent("div").remove();
    });
});

/* add to inspector*/

function addToSearchInspector(current_image_id) {
    current_image = JSON.parse(localStorage.getItem(current_image_id));
    current_image_labels = current_image[0]["Labels"];
    if (!Object.values(ValuesClear[0]["Labels"]).includes(1) && !Object.values(ValuesClear[0]["Labels"]).includes(2)) {
        updateImageLabels(current_image[0]['Index'], Object.keys(current_image_labels)[0], 2);
        updateImageLabels(current_image[0]['Index'], Object.keys(current_image_labels)[1], 1);
        updateImageLabels(current_image[0]['Index'], Object.keys(current_image_labels)[2], 1);
        current_image = JSON.parse(localStorage.getItem(current_image_id));
        current_image_labels = current_image[0]["Labels"];
    }

    Object.keys(current_image_labels).forEach(function (key) {
        var listItem = document.createElement("li");
        listItem.id = key;
        listItem.dataset.src = current_image_id;
        if (current_image_labels[key] == 0) {
            listItem.className = "less";
        } else if (current_image_labels[key] == 2) {
            listItem.className = "more";
        }

        var spanItem = document.createElement("span");
        spanItem.textContent = key;
        spanItem.className = 'keyword';

        var spanItemControl = document.createElement("span");
        spanItemControl.className = "controls";

        var spanItemControlMinus = document.createElement("span");
        spanItemControlMinus.textContent = '-';
        spanItemControlMinus.className = "minus";
        spanItemControl.appendChild(spanItemControlMinus);

        var spanItemControlPlus = document.createElement("span");
        spanItemControlPlus.textContent = '+';
        spanItemControlPlus.className = "plus";
        spanItemControl.appendChild(spanItemControlPlus);

        listItem.appendChild(spanItemControl);
        listItem.appendChild(spanItem);

        $(".inspector ul").append(listItem);
    })

}

function removeFromSearchInspector() {
    $(".inspector li").remove();

}


/////////////////////////////////////////////////////
//
//* Inspector */
//
/////////////////////////////////////////////////////

/* hud */

$(function () {


    /* use id here if several huds */
    $('#inspect').change(function () {
        if (this.checked) {
            $('.hud').fadeIn();
            inspector_toggle = 1;
        } else {
            $('.hud').fadeOut();
            inspector_toggle = 0;
        }
    });
    $('body').on('click', '.hud .closeParent', function () {
        $('.hud').fadeOut(function () {
            $('#inspect').prop('checked', false);
        });
    });


    $('body').on('click', '.inspector .plus', function () {
        var line = $(this).parents('li');
        var key_term = line[0].id;
        var img = line[0].dataset.src;


        if (line.hasClass('less')) {
            line.removeClass('less');
            updateImageLabels(img, key_term, 1)
        } else {
            line.addClass('more');
            updateImageLabels(img, key_term, 2)
        }
        //////console.log('after plus', line);
    });

    $('body').on('click', '.inspector .minus', function () {
        var line = $(this).parents('li');
        var key_term = line[0].id;
        var img = line[0].dataset.src;

        if (line.hasClass('more')) {
            line.removeClass('more');
            updateImageLabels(img, key_term, 1)
        } else {
            line.addClass('less');
            updateImageLabels(img, key_term, 0)
        }

        //////console.log('after minus', line);
    });

    $('body').on('click', '.hud .closeParentInspect', function (e) {
        $('.hud').fadeOut(function () {
            $('#inspect').prop('checked', false);
        });
        $('#moodboard .ideal-image-container').removeClass("inspected");
        $(".inspectorList").remove();
    });


    $('body').on('click', '.inspectorList .plus', function () {
        var line = $(this).parents('li');

        //////console.log("line", line);
        var key_term = line[0].id;
        var img = line[0].dataset.src;


        if (line.hasClass('less')) {
            line.removeClass('less');
            updateImageLabels(img, key_term, 1)
        } else {
            line.addClass('more');
            updateImageLabels(img, key_term, 2)
        }

        if (currentTab == 'RationaleTab') {
            getCloudLabels('moodboard-item');
        }
    });


    $('body').on('click', '.inspectorList .minus', function () {
        var line = $(this).parents('li');
        var key_term = line[0].id;
        var img = line[0].dataset.src;

        if (line.hasClass('more')) {
            line.removeClass('more');
            updateImageLabels(img, key_term, 1)
        } else {
            line.addClass('less');
            updateImageLabels(img, key_term, 0)
        }
        if (currentTab == 'RationaleTab') {
            getCloudLabels('moodboard-item');
        }
    });

    $('body').on('click', '.inspectorList .addItem', function (e) {
        addUserLabel(e);
    });


    $('body').on('click', '.check', function (e) {
        img = highlighted_element["0"].children["0"].children["0"].id;
        //////console.log("img", img);
        var key_term = $('#newLabel').val();
        //////console.log("key_term", key_term);
        addLabelElement(key_term);
        updateImageLabels(img, key_term, 2);


        if (currentTab == 'RationaleTab') {
            getCloudLabels('moodboard-item');
        }
    });

    $('body').on('click', '.delete', function (e) {
        $(".inspectorList #addNewElementItem").remove();
        var addElement = '<li id="addElementContainer"><i id="addElement" class="fas fa-plus-circle addItem"></i></li>';
        $(".inspectorList ul").append(addElement);
    });


});


function addLabelElement(key) {
    var listItem = document.createElement("li");
    listItem.id = key;
    listItem.dataset.src = current_image_id;
    listItem.className = "more";


    var spanItem = document.createElement("span");
    spanItem.textContent = key;
    spanItem.className = 'keyword';

    var spanItemControl = document.createElement("span");
    spanItemControl.className = "controls";

    var spanItemControlMinus = document.createElement("span");
    spanItemControlMinus.textContent = '-';
    spanItemControlMinus.className = "minus";
    spanItemControl.appendChild(spanItemControlMinus);

    var spanItemControlPlus = document.createElement("span");
    spanItemControlPlus.textContent = '+';
    spanItemControlPlus.className = "plus";
    spanItemControl.appendChild(spanItemControlPlus);

    listItem.appendChild(spanItemControl);
    listItem.appendChild(spanItem);

    //////console.log("add new element");


    $(".inspectorList #addNewElementItem").remove();
    $(".inspectorList ul").append(listItem);
    var addElement = '<li id="addElementContainer"><i id="addElement" class="fas fa-plus-circle addItem"></i></li>';
    $(".inspectorList ul").append(addElement);


}


/* display keywords */

function createKeywords() {
    klock = 'true';
    $('#moodboard .ideal-image-container').each(function (index) {
        if (!$(this).hasClass('primitive')) {
            var position = $(this).position();
            var thex = position.left;
            var theWidth = $(this).outerWidth();


            var theId = $(this).attr('id');
            var theId = theId.substring(10);
            current_image_id = 'img_' + theId;
            current_image = JSON.parse(localStorage.getItem(current_image_id));
            current_image_labels = current_image[0]["Labels"]; //list of labels
            current_image_width = current_image[0]["Width"]; //current width
            current_image_height = current_image[0]["Height"]; // current height
            current_image_top = current_image[0]["Top"]; //x coordinate
            current_image_left = current_image[0]["Left"]; // y coordinate

            current_keylist_top = current_image_top;
            current_keylist_left = thex + theWidth;
            $('#moodboard').append('<div class="keylist" id="palette_' + theId + '"><div class="handle"></div></div>');
            $('#palette_' + theId).css('top', current_keylist_top);
            $('#palette_' + theId).css('left', current_keylist_left);
            var newtop = $('#palette_' + theId).css('top') - 20;
            var newleft = $('#palette_' + theId).css('left') - 50;
            $('#palette_' + theId).css('top', newtop);
            $('#palette_' + theId).css('left', newleft);
            $('#palette_' + theId).append('<div class="content">');
            $('#palette_' + theId).draggable({handle: ".handle"});
            Object.keys(current_image_labels).forEach(function (key) {
                $('#palette_' + theId + ' .content').append(key + '<br>');
            });
        } else {
            //////console.log('here is a box');
        }
    });
}

function showKeywords() {
    $("#moodboard .keylist").remove();
    createKeywords();

    setTimeout(function () {
        $("#moodboard .keylist").fadeIn();
    }, 300);
}

function hideKeywords() {
    $("#moodboard .keylist").fadeOut();
    $("#moodboard .keylist").remove();
}

function killInspectorKeywords() {
    $("#moodboard .inspectorlist").fadeOut(function () {
        $("#moodboard .inspectorlist").remove();
    });
}


function killKeywords() {
    klock = 'false';
    $("#moodboard .keylist").fadeOut(function () {
        $("#moodboard .keylist").remove();
    });
}


$(function () {
    klock = 'false';
    $('body').on('click', '#displayKeywords', function () {
        klock = 'true';
        showKeywords();

    });

    $('body').on('click', '#nokeys', function () {
        klock = 'false';
        killKeywords();

    });
});


function addUserLabel(e) {
    var currentList = e.target.parentElement.parentElement;
    $('#addElementContainer').remove();
    var listItem = document.createElement("li");
    listItem.id = "addNewElementItem";
    var spanItem = document.createElement("input");
    spanItem.id = 'newLabel';
    var spanItemControl = document.createElement("span");
    spanItemControl.className = "controls";

    var spanItemControlCheck = document.createElement("span");

    spanItemControlCheck.className = "check";
    spanItemControl.appendChild(spanItemControlCheck);

    var spanItemControlDelete = document.createElement("span");
    spanItemControlDelete.textContent = '\u00D7';
    spanItemControlDelete.className = "delete";
    spanItemControl.appendChild(spanItemControlDelete);

    listItem.appendChild(spanItemControl);
    listItem.appendChild(spanItem);
    $(currentList).append(listItem);

}


/* display color samples */

/*
function get_allimages_colors() {
    $('#moodboard .ideal-image-container').each(function (index) {
        var theId = $(this).attr('id');
        var theId = theId.substring(10);
        current_image_id = 'img_' + theId;
        current_image = JSON.parse(localStorage.getItem(current_image_id));
        current_image_colors = current_image[0]["Color"]; //list of labels

        Object.keys(current_image_colors).forEach(function (key) {
            $('#colorSamples').prepend('<li class="' + current_image_id + '" style="background-color:rgb('+current_image_colors[key][0]+','+current_image_colors[key][1]+','+current_image_colors[key][2]+');"></li>');
        });
    });
}
 */
function sortColorSamples() {
    var sortables = $('#colorSamples > li');
    tinysort(sortables, {data: 'hue'}, {data: 'sat'}, {data: 'lum'});
}

function get_allimages_colors() {
    $('#moodboard .ideal-image-container').each(function (index) {
        var theId = $(this).attr('id');
        var theId = theId.substring(10);
        current_image_id = 'img_' + theId;
        var s = localStorage.getItem(current_image_id);
        var j = JSON.parse(s);
        var colors = j[0]['Color'];
        Object.keys(colors).forEach(function (key) {
            var hsl = rgbToHsl(colors[key][0], colors[key][1], colors[key][2]);
            var h = hsl[0];
            var s = hsl[1];
            var l = hsl[2];
            $('#colorSamples').prepend('<li data-hue="' + h + '" data-sat="' + s + '" data-lum="' + l + '" class="' + current_image_id + '" style="background-color:rgb(' + colors[key][0] + ',' + colors[key][1] + ',' + colors[key][2] + ');"></li>');
        });
        sortColorSamples();
    });
}

function refreshColorSamples() {
    $('#colorSamples').empty();
    get_allimages_colors();
}

$(function () {
    $('body').on('click', '.get-color-samples, .tablinks.reflect', function () {
        refreshColorSamples();
    });
});


/////////////////////////////////////////////////////
//
//* Tag Analysis*/
//
/////////////////////////////////////////////////////


function getCloudLabels(parentContainer, to_update) {
    ////console.log("i should be updated");

    to_update = to_update || "all";
    var sizeList = [];
    var images = document.getElementsByClassName(parentContainer);
    var img_list = [];

    for (var i = 0; i < images.length; i++) {
        img_list.push(images[i].children["0"].children["0"].id);
    }
    for (var j = 0; j < img_list.length; j++) {
        var img_data = JSON.parse(localStorage.getItem(img_list[j]));

        w = img_data[0]["Width"].replace("px", "");
        h = img_data[0]["Height"].replace("px", "");
        space = Number(h) * Number(w);

        sizeList.push([space, img_data[0]["Labels"]])
    }

    ////console.log("update", sizeList);


    if ($('#freq').prop('checked') == true) {
        //////console.log("switch freq");
        if (to_update == "all") {
            showFreqCloud(sizeList);
        } else if (to_update == "Freq") {
            showFreqCloud(sizeList);
        } else if (to_update == "Size") {
            //showSizeCloud(sizeList);
        }

    } else if ($('#size').prop('checked') == true) {
        //////console.log("switch size");
        if (to_update == "all") {
            //showFreqCloud(sizeList);
            showSizeCloud(sizeList);
        } else if (to_update == "Freq") {
            //showFreqCloud(sizeList);
        } else if (to_update == "Size") {
            showSizeCloud(sizeList);
        }
    }
}


$(function () {

    document.getElementById('freq').addEventListener("change", function () {
        //////console.log("switch changed");
        getCloudLabels('moodboard-item');
    });
    document.getElementById('size').addEventListener("change", function () {
        //////console.log("switch changed");
        getCloudLabels('moodboard-item');
    });

});


function showFreqCloud(tags) {
    var FreqList = {};

    //////console.log('tags', tags);
    Object.keys(tags).forEach(function (key) {
        var val = tags[key];
        Object.keys(val[1]).forEach(function (key) {
            var number = val[1][key];
            if (key.length > 15 && number > 0) {
                number = number - 1;
            }

            if (!(key in FreqList)) {
                FreqList[key] = number;
            } else {
                FreqList[key] = FreqList[key] + number;
            }
        })
    });

    //////console.log("reqList", FreqList);
    createCloud(FreqList, '#keywordCloud');
}


function showSizeCloud(tags) {
    var SizeList = {};
    var canvasSize = $('#moodboard').height() * $('#moodboard').width();

    //Size: height*width / canvas.height*canvas.width
    Object.keys(tags).forEach(function (key) {
        var val = tags[key];
        Object.keys(val[1]).forEach(function (key) {
            var number = val[1][key] * (val[0] / canvasSize);
            if (!(key in SizeList)) {
                SizeList[key] = number;
            } else {
                SizeList[key] = SizeList[key] + number;
            }
        })
    });
    createCloud(SizeList, '#keywordCloud')
}


function showGroupCloud(tags) {
    var GroupList = {};
    var count = Object.keys(tags).length * 2;


    Object.keys(tags).forEach(function (key) {
        GroupList[key] = count;
        count = count - 2;
    });

    //////console.log('GroupList', GroupList);
    createCloud(GroupList, '#keywordCloudGroup');


}


function createCloud(SizeList, location) {
    var words = [];
    if (Object.keys(SizeList).length > 0) {
        Object.keys(SizeList).forEach(function (key) {
            words.push({
                text: key.toString(), weight: SizeList[key], handlers:
                    {
                        click: function () {
                            highlightElements(key.toString());

                        }
                    }
            })
            ;
        })
        words.sort(function (a, b) {
            return a.value - b.value;
        });


        //////console.log('words', words);

        if ($(location).hasClass('jqcloud') == true) {
            //////console.log("here comes a cloud update");
            $(location).jQCloud('update', words, {
                fontSize: {
                    from: 0.1,
                    to: 0.03
                }
            });
        } else {
            //////console.log("here comes a cloud, or?", $(location));
            $('#keywordCloud').jQCloud(words);

            $(location).jQCloud(words, {
                fontSize: {
                    from: 0.1,
                    to: 0.03
                }
            });
        }
    }
}


function highlightElements(label) {
    hackedHideMenu($('#moodboard .ideal-image-container'));
    hideAnyCropMenu();
    $('#moodboard .ideal-image-container').removeClass('highlight');
    $("#moodboard img").removeClass("highlight-label");
    var imgListToHighlight = [];
    var images = document.getElementsByClassName('moodboard-item');
    var img_list = [];

    for (var i = 0; i < images.length; i++) {
        img_list.push(images[i].children["0"].children["0"].id);
    }

    for (var j = 0; j < img_list.length; j++) {
        var img_data = JSON.parse(localStorage.getItem(img_list[j]));

        if (Object.keys(img_data[0]["Labels"]).includes(label)) {
            imgListToHighlight.push(img_data[0]["Index"]);
        }

    }
    //////console.log("label: ", label, " in: ", imgListToHighlight);
    for (var k = 0; k < imgListToHighlight.length; k++) {
        c_name = imgListToHighlight[k];
        document.getElementById(c_name).classList.add('highlight-label');

    }

}

// filter elements in stack
// TODO : trigger on click
// TODO : cancel all on click in moodboard

function filterElements(labels) {
    // init
    hideAnyCropMenu();
    $("#stack img").removeClass("keep-me");

    var imgListToHighlight = [];

    // TODO first get keyword as as basis to filter


    // then search the stack for matching keywords

    var images = document.getElementsByClassName('stack-item');
    var img_list = [];

    for (var i = 0; i < images.length; i++) {
        img_list.push(images[i].children["0"].children["0"].id);
    }

    for (var j = 0; j < img_list.length; j++) {
        var img_data = JSON.parse(localStorage.getItem(img_list[j]));

        for (var l = 0; l < labels.length; l++) {
            //////console.log("does this: ",img_data[0]["Labels"]);
            //////console.log("contain this: ",labels[l]);

            if (Object.keys(img_data[0]["Labels"]).includes(labels[l])) {
                if (!imgListToHighlight.includes(img_data[0]["Index"])) {
                    imgListToHighlight.push(img_data[0]["Index"]);
                }

            }
        }
    }
    //////console.log("label list: ", imgListToHighlight);

    for (var k = 0; k < imgListToHighlight.length; k++) {
        c_name = imgListToHighlight[k];
        document.getElementById(c_name).classList.add('keep-me');

    }
    $("#stack").find("img.keep-me").parents(".ideal-image-container").show("slow");

    // last : hide non matching elements

    $("#stack").find("img:not(.keep-me)").parents(".ideal-image-container").hide("slow");
    $("#stackLabel").text('Related Images');
}

function cancelFilter() {
    $("#stackLabel").text('Possible Images');
    $("#stack").find("img:not(.keep-me)").parents(".ideal-image-container").show("slow", function () {
        $("#stack .keep-me").removeClass("keep-me");
    });

}


/* text fields editing */


$(function () {
    $('body').on('click', '.text_fields', function (e) {
        ////console.log('text buttons here', e);
        $('.text_fields').removeClass('active');
        $(this).addClass('active');
        if ($(this).find('#text-editor').length == 0) {
            var textEditor = $('#text-editor').clone();
            $(this).append(textEditor);
        }
    });

    /!* font family change *!/

    $('body').on('change', '#font-family', function () {
        var value = $(this).val();
        var target = $('.text_fields.active').children('.text_field');
        $(target).css('font-family', value);
    });

    /!* font size change *!/

    $('body').on('change', '#font-size', function () {
        var value = $(this).val();
        var target = $('.text_fields.active').children('.text_field');
        $(target).css('font-size', value + 'px');
    });

    /!* bold change *!/
    $('body').on('click', '#font-bold', function () {
        var value = $(this).val();
        var target = $('.text_fields.active').children('.text_field');
        $(target).css('font-weight', value);
    });

    /!* italic change *!/
    $('body').on('click', '#font-italic', function () {
        var value = $(this).val();
        var target = $('.text_fields.active').children('.text_field');
        $(target).css('font-style', value);
    });

    /!* regular change *!/
    $('body').on('click', '#font-regular', function () {
        var value = $(this).val();
        var target = $('.text_fields.active').children('.text_field');
        $(target).css('font-style', 'normal');
        $(target).css('font-weight', 'normal');
    });

    /!* color change *!/
    $('body').on('click', '#font-color', function (e) {
        ////console.log('color button here', e);
        var target = $('.text_fields.active').children('.text_field');
        change_color_text($('.text_fields.active'));
    });

    $('body').on('click', '.closeParentText', function (e) {
        ////console.log('close everything');
        $('.hud').fadeOut();
        $('.text_fields.active .text-editor').remove();
        $('.text_fields').removeClass('active');
    });

    $('body').on('click', '#text-kill', function (e) {
        ////console.log('close everything');
        $('.text_fields.active').remove();
    });


});
