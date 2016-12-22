BN.giftCard = BN.giftCard || {};

BN.giftCard.updatePrice = {
    init: function() {

        // Automatic update price
        BN.giftCard.updatePrice.adjustTotal();

        // Set attributes
        if($(".ws-number").length > 0){
            var wsNum = $(".ws-number");
            wsNum.attr('maxlength', 3);
            wsNum.attr('min', 10);
            wsNum.attr('max', 350);
        }

        // Input value changer
        $(".ws-number, #cardValue").on("keyup mouseup", BN.giftCard.updatePrice.adjustTotal);

        // Increment / Decrement Changer
        $('.step-controls').on('mouseup', BN.giftCard.updatePrice.adjustTotal);

        // Quantity Changer
        $("#numCards").on("change", BN.giftCard.updatePrice.adjustTotal);

        // Submit handler
        $("#submitGC").on("click", function(e) {
            e.preventDefault();

            $("#gcSubmitHidden").trigger("click");
        });
    },

    adjustTotal: function() {

        if($(".ws-number").length > 0) {
            var valTemp = $(".ws-number").val();
            
            $('.ws-number').val(valTemp.replace(/\D/g,''));

            var $cardValue = $(".ws-number").val();
        } else {
            //FALLBACK
            var valTemp = $("#cardValue").val();
            
            $('#cardValue').val(valTemp.replace(/\D/g,''));

            var $cardValue = $("#cardValue").val();
        }


        var $numCards = $("#numCards").val(),
            $cardTo = $("#cardTo").val(),
            $cardFrom = $("#cardFrom").val(),
            $gcIPcardValue = $("#gcIPcardValue"),
            $gcIPQuantity = $("#gcIPQuantity"),
            $gcIPcardTo = $("#gcIPcardTo"),
            $gcIPcardFrom = $("#gcIPcard"),
            updatedTotal = parseInt($cardValue) * parseInt($numCards),
            nan = isNaN(updatedTotal);

        if(nan) {
            $(".price").text("$0.00");
        } else {
            $(".price").text("$" + updatedTotal + ".00");
        }

        $gcIPcardValue.val($cardValue);
        $gcIPQuantity.val($numCards);
        $gcIPcardTo.val($cardTo);
        $gcIPcardFrom.val($gcIPcardFrom);
    }
}



function yesnoCheck() {
    if (document.getElementById('rentIsChecked').checked) {
        document.getElementById('wishlistAdd').style.display = 'none';
    }
    if(document.getElementById('newUsed').checked){
       document.getElementById('wishlistAdd').style.display = 'none';
    }
    else {
        document.getElementById('wishlistAdd').style.display = 'block';
    }
}

$(document).ready(function() {
    //user clicks on format
    $('#availableFormats').on('click', 'li.tab a', function(e) {
        try {
            var anchor = $(this);
            var eanUrl = anchor.attr('href');
            var eanarr = eanUrl.split('ean=');
            var ean = eanarr[1];
            var format = $(this).closest('li').find('a.tabTitle').text();

            if(typeof s_setP !== 'undefined') trackProdFormatsClick(format);

            var logParams = { 'action' : 'customer-product-format-selected', 'ean' :  ean, 'format' : format };
            makeBnLoggingCall(logParams, {'callback' : function() {location.href = eanUrl;}, 'preventDefault' : true}, e);
        } catch(err) {}
    });

    $('#otherAvailFormats').on('change', function(e) {
        try {
            var eanUrl = $(this).val();
            var eanarr = eanUrl.split('ean=');
            var ean = eanarr[1];
            var format = $(this).find(":selected").data("format");
            if(typeof s_setP !== 'undefined') trackProdFormatsClick(format);

            var logParams = { 'action' : 'customer-product-format-selected', 'ean' :  ean, 'format' : format };
            makeBnLoggingCall(logParams, {'callback' : function() {location.href = eanUrl;}, 'preventDefault' : true}, e);
        } catch(err) {}
    });

    if($('#getFreeNookSampleForm').length) {
        var $form = $('#getFreeNookSampleForm');
        BN.uXHR.Form.apply($form);
        $form.on("amplifiFormBeforeSubmit",function(){
            $('#getFreeNookSample').addClass('loading-opacity');
        }).on("amplifiFormSuccess", function (e, response) {
            $('#getFreeNookSample').removeClass('loading-opacity');
            if(typeof response.isDuplicate != 'undefined' && response.isDuplicate == 'true') {
                new BN.Modal.Browse.PDP.Duplicatesample(
                        null,
                        {
                            target: this
                        },
                        {
                            useCache: false,
                        },
                        null
                    );
            } else {
                new BN.Modal.Browse.PDP.Sampleadded(
                    null,
                    {
                        target: this
                    },
                    {
                        useCache: false,
                    },
                    null
                );
            }
        }).on("amplifiFormError",function(event,err,xhr,status,msgs){
            $('#getFreeNookSample').removeClass('loading-opacity');
        });

        openLoginModal('#getFreeNookSample',{
            type: 'explicit',
            preventDefault: "always",
            successCallback: function(e) {
                $(this).closest('form').submit();
            }
        });
    }
    //load tv episodes nook video
    if($('#episodeDetail').length) {
        var container = $('#episodeDetail');
        $.ajax({
            url: '/cartridges/ProductDetailContent/ProductDetailTypes/includes/episodes-list.jsp',
            cache: false,
            type: 'post',
            data: {'eans' : container.attr('data-eans')}
        }).done(function(data) {
            container.html(data);
            $('#lowestPriceEpisodeButton').text($('#lowestPriceEpisode').attr('data-lowpriceepisode'));
            $('.pdp-form').off();
            attachCartAction();
        });
    }

    openLoginModal('.PageContent .btn-instant-purchase',{
        preventDefault: "conditionally"
    });
    //regular form submit
    $('.btn-instant-purchase').closest('form').on('submit',function(){
        var instantPurchase = $('.btn-instant-purchase');
        $spinner.appendTo(instantPurchase.closest('aside'));
    });

    $('#gcIpForm .btn-pdp-addtocart').on('click', function() {
        var giftCardValue = $('#addToCartForm input[name="giftCard"]').val();
        $('#gcIpForm input[name="giftCard"]').val(giftCardValue);
    });

    initializeTextAreaCounter($('#cardMessage'), $('#cardMessage').parent().find('.limit-notifier'));
    //$('#cardMessage').attr("required", "required");
    $('#cardMessage').on('focus', function() {
        $(this).removeClass("user-error");
    });

    if($(".pdp-gc").length > 0) {
        BN.giftCard.updatePrice.init();
    }

    // PDP scroll to function
    $('#productInfoTabs a').click(function(e) {
        e.preventDefault();
        var setTarget = $(this).attr('href'),
            $target = $(setTarget).length > 0 ? $(setTarget): $('[name=' + setTarget.replace('#','') + ']').first(),
            targetOffset = $target.offset();
        $('html, body').animate({
            scrollTop: targetOffset.top
        }, 750);
    });

    //Read more toggle
    $(".read-more a").on("click", function(e) {
        e.preventDefault();

        var $this = $(this),
            $container = $(this).parent().parent();

        if($this.attr('aria-expanded') == 'false') {
            $this.attr('aria-expanded', 'true');
            $container.focus();
        } else {
            $this.attr('aria-expanded', 'false');
        }

        $container.toggleClass("summarized");
        $this.parent().toggleClass("fade");

        if($this.text().toLowerCase() === "read more" || $this.text().toLowerCase() === "see more") {
            $this.text("Show Less");
            $this.removeClass("down-arrowhead");
            $this.addClass("up-arrowhead");
        } else {
            $this.text("Read More");
            $this.removeClass("up-arrowhead");
            $this.addClass("down-arrowhead");
        }
    });


    //SHOW MORE TOGGLE
    $(".show-more a").on("click", function(e) {
        e.preventDefault();

        var $this = $(this),
            $container = $(this).parent().parent();

        $container.toggleClass("summarized");
        $this.parent().toggleClass("fade");

        if($this.text().toLowerCase() === "show more") {
            $this.text("Show Less");
            $this.removeClass("down-arrowhead");
            $this.addClass("up-arrowhead");
            $this.attr('aria-expanded', 'true');
            $container.focus();
        } else {
            $this.text("Show More");
            $this.removeClass("up-arrowhead");
            $this.addClass("down-arrowhead");
            $this.attr('aria-expanded', 'false');

        }
    });

    $("#CastCrew").addClass("summarized");
    $("#CastCrew .read-more").addClass("fade");
    $("#SceneIndex").addClass("summarized");
    $("#SceneIndex .read-more").addClass("fade");
    $("#Menu").addClass("summarized");
    $("#Menu .read-more").addClass("fade");

    // Hide the Read More link if less than 7 lines of text
    if ($("#SceneIndex article").height() < 168) { // 168 = approximately 7 lines of text
        $("#SceneIndex .read-more").hide();
    }

    // All formats modal
    $('a.formatModal').click(function(e) {
        e.preventDefault();
    });

    //EMAGAZINE OPTIONS
    var defaultButton = $('main[role=main] input[name=rental-options]:checked'),
        nonselectedButtons = $('main[role=main] input[name=rental-options]').not(defaultButton);

    nonselectedButtons.parents("label").siblings().slideUp("fast");
    nonselectedButtons.parents("form").siblings().slideUp("fast");
    nonselectedButtons.siblings(".price").removeClass("no-display");
    defaultButton.siblings(".price").addClass("no-display");

    $('.multi-product-select').children().each(function(i, el) {
        $(el).find('input[type=radio]').attr('checked') || $(el).addClass('grdnt-fade-white');
    });

    $('input[name=rental-options]', 'main[role=main]').on("click",function(e) {
        var $this = $(this),
            istablet = (/ipad|android|android 3.0|xoom|sch-i800|kindle/i.test(navigator.userAgent.toLowerCase())),
            radioBtns = $('main[role=main] input[name=rental-options]'),
            otherBtns = radioBtns.not($this),
            $parent = $this.parents('li'),
            $container = radioBtns.parents('.subscriptions-container');

        if($parent.is(':first-child')) {
            $container.children('li:first-child').removeClass('top-border');
        } else {
            $container.children('li:first-child').addClass('top-border');
        }

        $parent.removeClass('grdnt-fade-white');
        $parent.siblings().addClass('grdnt-fade-white');

        otherBtns.removeAttr('checked');
        otherBtns.parents("label").siblings().slideUp("fast");
        otherBtns.parents("form").siblings().slideUp("fast");
        otherBtns.siblings(".price").removeClass("no-display");

        $this.parents("label").siblings().not("select").slideDown("fast");
        $this.parents("form").siblings().slideDown("fast");
        $this.siblings(".price").addClass("no-display");

        $('.selectBox-container').css('overflow','visible');

        if (istablet) {
            $('#rentalRates').css('display', 'inline-block');
        }

    });

    $('#rentalRates').on('change', function(e) {
        var rentalValue = $('option:selected', this).attr('data-rental-rate'),
            rentalReturnDate = $('option:selected', this).attr('data-rental-return-date'),
            rentalDiscount = $('option:selected', this).attr('data-rental-discount'),
            $rentalPrice = $('.rental-price .current-price'),
            $rentalDate = $('.return-date'),
            $rentalDiscount = $('.rental-price .discount-amount-value');

        $rentalPrice.text(rentalValue);
        $rentalDate.text(rentalReturnDate);
        $rentalDiscount.text(rentalDiscount);
    });

    initImageSwitcher();
    attachCartAction();

    //expandclick
      $(".expand-cvv-container").hide();
      var chng=false;
    $(".nook-devices-apps .show").on("click", function(e) {
        $(".expand-cvv-container").toggle();
        if(chng==false){
            $(".nook-devices-apps .show img").attr("src","/static/img/sprites/tooltip-active.png");
            $(this).addClass("open");
            chng=true;
        }else{
            $(".nook-devices-apps .show img").attr("src","/static/img/sprites/plus-expand.png");
            $(this).removeClass("open");
            chng=false;
        }
    });

    // Nook Video Pdp carousel fix: Anchor tag artificats + double carousel wrapper removal
    if($("#videoInfo").length > 0) {
        var videoPageContainer = $('.par.parsys'),
            $videoInfo = $("#videoInfo"),
            carousel = videoPageContainer.find('ul[id^=video-carousel]'),
            carouselBox = videoPageContainer.children('.video-access-box-carousel'),
            carouselWrap = $videoInfo.find('.caroufredsel_wrapper'),
            randomAnchors = carouselWrap.children('a'),
            randomUlAnchors = carouselWrap.children('ul').children('a');

        //$videoInfo.children('a').find('h2').unwrap();

        // IE FIX: Remove extra carousel markup
        /*if(carousel.length == 2) {
            if($('body').hasClass('ie9')) {
                carouselBox.children('a').find('.caroufredsel_wrapper').remove();
            }
        }*/

        //Remove double carousel wrapper
        /*if($('.lt-ie9').length > 0) { // bodyClass check did not work here
            $videoInfo.unwrap();
        } else {
            carousel.unwrap();
        }*/

        //randomAnchors.remove();
        //randomUlAnchors.remove();
        carousel.children('a').remove();
    }

    // INSTANT PURCHASE HANDLER
    $('.PageContent form.ip-form').on('amplifiFormSuccess', function() {
        //console.log('success')
    }).on('amplifiFormError', function(e, data) {
        $('.mini-cart-spinner').remove();

        if(!data.response.data.instantPurchaseError && data.response.data.errors.length > 0) {
            BN.Validate.DisplayErrors($('#productDetail'), data.response.data.errors,null,null,null,data);
        } else {
            new BN.Modal.Browse.PDP.InstantPurchase(null, data.response.data, data.response.data.tplParams);
        }
    });

    var overviewObj = $('#truncatedOverview');

    if(overviewObj.length > 0) {
        if(overviewObj.children().length > 0) {
            overviewObj.children().not(':empty').last().append('&hellip;');
        } else {
            overviewObj.append('&hellip;');
        }
    }
});
