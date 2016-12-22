/*=============================================
Define functions
=============================================*/

//Shopping Cart Adobe Analytics
function analyticsShoppingCart(event, data) {
    if(typeof s_setP !== 'undefined') {
        var $this = data.element || '',
            $parent = $this.parents('#cartItems').length > 0 ? $('#cartItems') : $('#miniCartItems'),
            index = updatedQty = '',
            productInfo = {},
            updateType = data.updateType || '',
            addedFrom = data.addedFrom || '',
            evtIndex = getAnalyticsEventCount(),
            isRental = $this.closest('.multi-product-select').length > 0 ? true : false,
            isSubscriptions = $this.closest('ul.subscriptions-container').length > 0 ? true : false,
            isInstant = data.isInstant || false,
            isMarketplace =  $this.closest('.marketplace-modal').length > 0 ? true : false,
            purchaseType = purchaseTypeLabel = '';

        // ADDING FROM NON PDP, GET UPDATED QUANTITIES
        if(data.addedFrom !== 'pdp' && data.addedFrom !== 'modal') {
            if($parent.selector === '#cartItems') {
                var skuId = $this.find('.analytics-sku-id').val().trim();

                index = getAnalyticsItemIndex(skuId);
            } else if($parent.selector === '#miniCartItems') {
                index = $parent.find('.mini-cart-item').index($this);
            }

            var initialQty = $this.find('.initial-qty').val();

            if(typeof data.updateType !== 'undefined' && data.updateType === 'remove') {
                updatedQty = 0;
            } else {
                updatedQty = $this.find('.product-quantity').val();
            }
        }

        // CALCULATE CHANGE IN QTY
        var diffQty = (typeof data.addedFrom !== 'undefined' && (data.addedFrom === 'pdp' || data.addedFrom === 'modal')) ? 1 : updatedQty - initialQty;

        // NO CHANGE
        if(diffQty === 0) {
            return false;
        }
        // GET PRODUCT DATA FROM PRODUCT OBJ
        else if(typeof data.addedFrom !== 'undefined' && data.addedFrom === 'pdp') {
            var existsProductInfo = digitalData && digitalData.product && digitalData.product[0];
            if(existsProductInfo) {
                $.extend(productInfo, digitalData.product[0]);
            }
        // GET PRODUCT DATA FROM BUTTON DATA()
        } else if(typeof data.addedFrom !== 'undefined' && data.addedFrom === 'modal') {
            var prodData = $.parseJSON($this.find('.btn-addtocart').data('analyticsdata')) || '';

            if(prodData && prodData.product[0]) {
                $.extend(productInfo, prodData.product[0]);
            } else if($.isPlainObject(prodData)) {
            	$.extend(productInfo, prodData.product);
            } else {
               	consoleError('No Product Data Available');
            }
        // GET PRODUCT DATA FROM CART OBJ
        } else {
            var existsProductInfo = digitalData && digitalData.cart && digitalData.cart.item && digitalData.cart.item[index];
            if(existsProductInfo) {
                $.extend(productInfo, digitalData.cart.item[index]);

                // EXTRA MISC INFO FROM CART OBJ
                if(productInfo.quantity) delete productInfo.quantity;
            }
        }

        // ABSOLUTE VALUE OF QTY
        //$.extend(productInfo.productInfo,{'qty': Math.abs(diffQty)});

        // POSITIVE DIFFERENCE = ADD
        if(diffQty > 0) {
            s_setP('digitalData.event['+evtIndex+'].eventInfo.eventName', 'Add to Bag');
            s_setP('digitalData.event['+evtIndex+'].eventInfo.eventAction', 'addToBag');
        // NEGATIVE DIFFERNCE = REMOVE
        } else {
            s_setP('digitalData.event['+evtIndex+'].eventInfo.eventName', 'Remove from Bag');
            s_setP('digitalData.event['+evtIndex+'].eventInfo.eventAction', 'removeFromBag');
        }

        s_setP('digitalData.event['+evtIndex+'].eventInfo.timeStamp', '' + new Date() + '');
        s_setP('digitalData.event['+evtIndex+'].category.primaryCategory', 'ShoppingBag');
        s_setP('digitalData.event['+evtIndex+'].attributes.product[0]', productInfo);

        // GET RENTAL PRICE BASED ON SELECTED OPTION
        if(isRental || isSubscriptions) {
        	var itemBasePrice = $this.find('.price.current-price').not(':hidden').text() || $this.find('.emag-price .price').not(':hidden').text();

        	itemBasePrice = Number(itemBasePrice.replace(/[^0-9\.]+/g,"")) || '';
        	s_setP('digitalData.event['+evtIndex+'].attributes.product[0].price.basePrice', itemBasePrice);
        }

        // TRACK TYPE
        if(diffQty > 0) {
        	if(isRental || isSubscriptions) {
        		purchaseTypeLabel = $this.find('label').contents().filter(function() {
            		return this.nodeType == 3;
            	}).text().trim();
        	}

        	purchaseType = purchaseTypeName($this, isInstant, isMarketplace, purchaseTypeLabel);

            s_setP('digitalData.event['+evtIndex+'].attributes.product[0].attributes.purchaseType', purchaseType);

            _satellite.track('onShoppingBagAddItem');
        } else {
            _satellite.track('onShoppingBagRemoveItem');
        }
    }
}

function purchaseTypeName(target, isInstant, isMarketplace, type) {
	var $this = target,
		instantTypePrefix = "instant_",
		addToBagTypePrefix = "addtobag_",
		itemLabel = type,
		name = isInstant ? instantTypePrefix : addToBagTypePrefix,
		labels = ['new', 'used', 'subscription', 'rent'],
		labelMatch = function(string, matchString) {
			itemLabel = itemLabel || matchString;
			return new RegExp(string, 'gi').test(itemLabel);
		};

	if(itemLabel) {
		for(var i = 0; i < labels.length; i++) {
			if(labelMatch(labels[i])) {
				name = name + labels[i];
				break;
			}
		}
	} else if(isMarketplace) {
		var condition = $this.find('[data-prop="condition"]').text().trim().toLowerCase();
		name = (condition === 'new') ? name + 'new' : name + 'used';
	} else {
		name = name + 'new';
	}

	return name;
}

// GET ORIGINAL ITEM INDEX FROM BAG
function getAnalyticsItemIndex(skuId) {
    if (typeof s_setP !== 'undefined') {
        var existsCartItem = ((digitalData || {}).cart || {}).item || [];

        if(existsCartItem.length > 0) {
            for(i=0; i < existsCartItem.length; i++) {
                var existsProdInfo = (((digitalData || {}).cart || {}).item[i] || {}).productInfo;
                if(existsProdInfo) {
                     if(existsProdInfo.hasOwnProperty('sku')) {
                         var skuVal = existsProdInfo['sku'];
                         if(skuVal.trim() === skuId) return i;
                     }
                }
            }
        }
    }
}

//Adobe Analytics set previous page name via saved cookies
function setAnalyticsCookie(cookieName, cookieValue) {
    $.cookie(cookieName, cookieValue ? cookieValue.trim() : '', { expires: 365, path: '/' });
}

function trackAnalyticsPrevPage() {
	if(typeof s_setP !== 'undefined' && typeof s_getP !== 'undefined') {
	    var analyticsPageName = s_getP('digitalData.page.pageInfo.pageName'),
	        prevPageNameCookie = $.cookie('setPrevPageName'),
	        pageName = prevPageNameCookie ? prevPageNameCookie.trim() : '';

	    s_setP('digitalData.page.pageInfo.previousPageName', pageName);
	    setAnalyticsCookie('setPrevPageName', analyticsPageName);
	}
}

//Adobe Analytics Update Modal Pagename
function updateAnalyticsPageName(pageName, prodName, workId) {
	if(typeof s_setP !== 'undefined' && typeof s_getP !== 'undefined') {
        var setPageName = typeof pageName !== 'undefined' ? pageName.toLowerCase() : '',
            isModal = setPageName !== '' ? true : false,
            setPageType = '',
            isProductTypeModal = false;

        switch($.trim(setPageName)) {
            case 'login':
                setPageName = 'sign in';
                break;
            case 'register':
                setPageName = 'create account';
                break;
            case 'add-to-wishlist':
                setPageName = 'add to wishlist';
                break;
            case 'quickview':
                setPageName = 'quickview';
                isProductTypeModal = true;
                break;
            case 'marketplace':
                setPageName = 'marketplace';
                isProductTypeModal = true;
                break;
            case 'allformats':
                setPageName = 'all formats';
                isProductTypeModal = true;
                break;
            case 'puis':
                setPageName = 'instore pickup';
                break;
            case 'puis-tooltip':
                setPageName = 'instore pickup tooltip';
                break;
            case 'kc-create-account-s1':
                setPageName = 'kid\'s club create account step 1';
                break;
            case 'kc-create-account-s3':
                setPageName = 'kid\'s club create account step 2';
                break;
            case 'kc-create-account-s4':
                setPageName = 'kid\'s club create account step welcome';
                break;
            case 'kc-manage-edit-child':
                setPageName = 'kid\'s club edit child';
                break;
            case 'kc-manage-add-child':
                setPageName = 'kid\'s club add child';
                break;
            case 'm-kids-club-info':
                setPageName = 'kid\'s club info';
                break;
            case 'm-kids-club-detail':
                setPageName = 'kid\'s club your loyalty rewards';
                break;
            case 'm-used-saved-address':
                setPageName = 'saved shipping address';
                break;
            case 'm-add-shipping':
                setPageName = 'add shipping address';
                break;
            case 'm-use-saved-cc':
                setPageName = 'saved credit card';
                break;
            case 'm-add-cc':
                setPageName = 'add credit card';
                break;
            case 'member-sign-up':
                setPageName = 'n&n membership offer';
                break;
            case 'editpayment':
                setPageName = 'edit payment method';
                break;
            case 'delete-payment':
                setPageName = 'delete payment method';
                break;
            case 'editaddress':
                setPageName = 'edit shipping address';
                break;
            case 'delete-address':
                setPageName = 'delete shipping address';
                break;
        }

        setPageType = setPageName;

        if(typeof window.DEFAULT_PAGE_NAME == 'undefined') {
             window.DEFAULT_PAGE_NAME = s_getP('digitalData.page.pageInfo.pageName');
             window.DEFAULT_PAGE_TYPE = s_getP('digitalData.page.pageInfo.pageType');
        }
        if(typeof setPageName == 'undefined' || setPageName == '') {
            setPageName = window.DEFAULT_PAGE_NAME;
            setPageType = window.DEFAULT_PAGE_TYPE;
        }

        var productModalInfo = isProductTypeModal ? (' : ' + prodName + ' | ' + workId) : '';

        setPageName = setPageName + productModalInfo.toLowerCase() + (isModal==true ? ' ~ modal' : '');
        s_setP('digitalData.page.pageInfo.pageName', setPageName);
        s_setP('digitalData.page.pageInfo.pageType', setPageType);

        trackAnalyticsPrevPage();
    }
}

//Adobe Analytics Update digitalData Cart Object
function updateAnalyticsCart() {
    if (typeof s_setP !== 'undefined') {
        $.ajax({
            dataType: "json",
            url: webContextRoot + '/xhr/data/adobe-analytics-cart.jsp',
            data: '',
            success: function(data) {
                digitalData["cart"] = digitalData.cart || {};

                if(typeof s_setP !== 'undefined' && digitalData && data && data.cart) {
                	$.extend(digitalData.cart, data.cart);
                    if(!data.cart.item && digitalData.cart.item) {
                        delete digitalData.cart.item;
                    }
                }
            }
        });
    }
}

//Adobe Analytics Update digitalData Product Object
function updateAnalyticsProdObj(data, evtIndex) {
    if (typeof s_setP !== 'undefined' && typeof data !== 'undefined') {

        if(data.product && data.product.length > 0) {
            s_setP('digitalData.event['+evtIndex+'].attributes.product', data.product);
        }
    }
}

//Adobe Analytics Update Sort View
function updateAnalyticsSortView(viewMode) {
	if(typeof s_setP !== 'undefined' && typeof s_getP !== 'undefined') {

        var evtIndex = getAnalyticsEventCount(),
        	setViewMode = viewMode,
            setPageSize = $('.view-container .selectBox-label').first().text(),
            category = s_getP('digitalData.page.category');

        s_setP('digitalData.event['+evtIndex+'].eventInfo.eventName', 'Product List View');
        s_setP('digitalData.event['+evtIndex+'].eventInfo.eventAction', 'productListView');
        s_setP('digitalData.event['+evtIndex+'].eventInfo.timeStamp', '' + new Date() + '');
        if(category) s_setP('digitalData.event['+evtIndex+'].category', category);
        s_setP('digitalData.page.attributes.productlist.pageSize', Number(setPageSize));
        s_setP('digitalData.page.attributes.productlist.viewMode', setViewMode);
        _satellite.track('onProductListView');
    }
}

function getAnalyticsEventCount() {
	if(typeof s_setP !== 'undefined' && typeof s_getP !== 'undefined') {
        return typeof s_getP('digitalData.event') == 'undefined' ? 0 : s_getP('digitalData.event').length;
    }
}

function trackOnloadErrors() {
    var $mainErr = $(document).find('.error-msg').first(),
        mainErrMsgs = [],
        errorCount = $mainErr.find('.err').length;

    if(typeof s_setP !== 'undefined' && errorCount > 0) {
        $mainErr.find('.err').each(function(index, value) {
            var $this = $(this),
                msg = $this.text().trim();

            mainErrMsgs.push(msg);
            if(index == (errorCount -1)) {trackOnError(mainErrMsgs);}
        });
    }
}

function attachDataToButton(data, btn) {
    if(data) {
    	btn.data('analyticsdata', data);
    }
}

//ATG-9056 Local Storage Referrer Object
function setLocalStorageObj(name, itemIndex) {
	if(typeof s_setP !== 'undefined' && typeof s_getP !== 'undefined') {

		var landingPageNumber = $('.search-utility .pagination ul > li > span').first().text(),
			landingPageSize = $('#listView').length > 0 ? $('#listView > li').size() : $('#gridView > li').size(),
			landingSearchTerm = $('#categoryHeaderContainer span.text').text();

		var storageObj = {
				pageNumber: s_getP('digitalData.page.attributes.productlist.pageNumber') || parseInt(landingPageNumber, 10) || '',
				pageSize: s_getP('digitalData.page.attributes.productlist.pageSize') || landingPageSize || '',
				pageName: s_getP('digitalData.page.pageInfo.pageName') || '',
				searchTerm: s_getP('digitalData.page.attributes.internalSearch.term') || landingSearchTerm || '',
				positionIndex: typeof itemIndex !== 'undefined' ? itemIndex + 1 : ''
			};

		// Put the object into storage
		if(typeof(Storage) !== "undefined") {
			// Clear the obj
			clearLocalStorageObj(name)
		    // Code for localStorage/sessionStorage.
			localStorage.setItem(name, JSON.stringify(storageObj));
		} else {
		    consoleError('Local Storage not supported');
		}
	}
}

//ATG-9056 Local Storage Referrer Object
function getLocalStorageObj(name) {
	// Get the object into storage
	if(typeof(Storage) !== "undefined") {
	    // Code for localStorage/sessionStorage.
		var storageObj = localStorage.getItem(name);
	} else {
	    consoleError('Local Storage not supported');
	}
	return JSON.parse(storageObj);
}

//ATG-9056 Local Storage Referrer Object
function clearLocalStorageObj(name) {
	if(typeof(Storage) !== "undefined") {
		localStorage.removeItem(name);
	} else {
	    consoleError('Local Storage not supported');
	}
}

// ATG-4613
function trackProdFormatsClick(formatName) {
    var evtIndex = getAnalyticsEventCount();
    s_setP('digitalData.event['+evtIndex+'].eventInfo.eventName', 'Product Format Click');
    s_setP('digitalData.event['+evtIndex+'].eventInfo.eventAction', 'productFormatClick');
    s_setP('digitalData.event['+evtIndex+'].eventInfo.timeStamp', '' + new Date() + '');
    s_setP('digitalData.event['+evtIndex+'].attributes.formatName', formatName);
    _satellite.track('onProductFormatClick');
}

// ATG-4618
function trackReviewsClick(isTrackAll, location) {
    var evtIndex = getAnalyticsEventCount();
    s_setP('digitalData.event['+evtIndex+'].eventInfo.eventName', 'Product Reviews Click');
    s_setP('digitalData.event['+evtIndex+'].eventInfo.eventAction', isTrackAll ? 'productReviewsViewAllClick' : 'productReviewsClick');
    s_setP('digitalData.event['+evtIndex+'].eventInfo.timeStamp', '' + new Date() + '');
    s_setP('digitalData.event['+evtIndex+'].attributes.location', location);
    _satellite.track('onProductReviewsClick');
}

function trackVideo(type, title) {
    var evtIndex = getAnalyticsEventCount();
    s_setP('digitalData.event['+evtIndex+'].eventInfo.eventName', 'Video');
    s_setP('digitalData.event['+evtIndex+'].eventInfo.eventAction', type);
    s_setP('digitalData.event['+evtIndex+'].eventInfo.timeStamp', '' + new Date() + '');
    s_setP('digitalData.event['+evtIndex+'].attributes.videoName', title);
    _satellite.track('onVideo');
}

// ATG-4613
function trackAllFormatsEditions() {
    var evtIndex = getAnalyticsEventCount();
    s_setP('digitalData.event['+evtIndex+'].eventInfo.eventName', 'All Available Formats Editions Click');
    s_setP('digitalData.event['+evtIndex+'].eventInfo.eventAction', 'allAvailableFormatsEditionsClick');
    s_setP('digitalData.event['+evtIndex+'].eventInfo.timeStamp', '' + new Date() + '');
    _satellite.track('onAllAvailableFormatsEditionsClick');
}

// ATG-4608
function trackProductPhotoClick(photoType) {
    var evtIndex = getAnalyticsEventCount();
    s_setP('digitalData.event['+evtIndex+'].eventInfo.eventName', 'Photo Click');
    s_setP('digitalData.event['+evtIndex+'].eventInfo.eventAction', photoType);
    s_setP('digitalData.event['+evtIndex+'].eventInfo.timeStamp', '' + new Date() + '');
    _satellite.track('onProductPhotoClick');
}

// ATG-4515
function trackOnError(errorMessages, xhr) {
    var evtIndex = getAnalyticsEventCount();
    s_setP('digitalData.event['+evtIndex+'].eventInfo.eventName', 'Error');
    s_setP('digitalData.event['+evtIndex+'].eventInfo.eventAction', 'error');
    s_setP('digitalData.event['+evtIndex+'].eventInfo.timeStamp', '' + new Date() + '');

    if(xhr && xhr.status && xhr.statusText) {
        s_setP('digitalData.event['+evtIndex+'].attributes.errorCode', xhr.status);
        s_setP('digitalData.event['+evtIndex+'].attributes.errorMessage', xhr.statusText);
    } else if(typeof errorMessages !== 'undefined') {
        $.each(errorMessages, function(index, message) {
            s_setP('digitalData.event['+evtIndex+'].attributes.errorMessage['+ index +']', message);
        });
    } else {
        var message = "An unexpected error has occurred. Please refresh your page and try again. If this problems persist, please contact customer support."
        s_setP('digitalData.event['+evtIndex+'].attributes.errorMessage', message);
    }
    _satellite.track('onError');
}

// ATG-4516
function trackSocialMediaClick(networkName) {
    var evtIndex = getAnalyticsEventCount();
    s_setP('digitalData.event['+evtIndex+'].eventInfo.eventName', 'Social Network Icon Click');
    s_setP('digitalData.event['+evtIndex+'].eventInfo.eventAction', 'socialNetworkIconClick');
    s_setP('digitalData.event['+evtIndex+'].eventInfo.timeStamp', '' + new Date() + '');
    s_setP('digitalData.event['+evtIndex+'].attributes.networkName', networkName);
    _satellite.track('onSocialNetworkClick');
}

// ATG-4619
function trackReserveInStore(revenue, quantity) {
    var evtIndex = getAnalyticsEventCount();
    s_setP('digitalData.event['+evtIndex+'].eventInfo.eventName', 'Reserve In Store');
    s_setP('digitalData.event['+evtIndex+'].eventInfo.eventAction', 'reserveInStore');
    s_setP('digitalData.event['+evtIndex+'].eventInfo.timeStamp', '' + new Date() + '');
    s_setP('digitalData.event['+evtIndex+'].attributes.revenue', revenue);
    s_setP('digitalData.event['+evtIndex+'].attributes.quantity', quantity);
    _satellite.track('onReserveInStore');
}

function trackCheckoutView(stepName, stepValue) {
	var evtIndex = getAnalyticsEventCount();
	s_setP('digitalData.event['+evtIndex+'].eventInfo.eventName', 'Checkout View');
    s_setP('digitalData.event['+evtIndex+'].eventInfo.eventAction', 'checkoutView');
    s_setP('digitalData.event['+evtIndex+'].eventInfo.timeStamp', '' + new Date() + '');
    s_setP('digitalData.event['+evtIndex+'].attributes.stepName', stepName);
    if(stepValue) s_setP('digitalData.event['+evtIndex+'].attributes.stepValue', stepValue);
    _satellite.track('onCheckoutView');
}

// ATG-4247
function trackProductView() {
    var evtIndex = getAnalyticsEventCount();
    s_setP('digitalData.event['+evtIndex+'].eventInfo.eventName', 'Product View');
    s_setP('digitalData.event['+evtIndex+'].eventInfo.eventAction', 'productView');
    s_setP('digitalData.event['+evtIndex+'].eventInfo.timeStamp', '' + new Date() + '');
    _satellite.track('onProductView');
}

// ATG-3615
function trackApplyCoupon(code, discount) {
    var evtIndex = getAnalyticsEventCount();

    s_setP( 'digitalData.event['+evtIndex+'].eventInfo.eventName', 'Coupon Code Applied' );
    s_setP( 'digitalData.event['+evtIndex+'].eventInfo.eventAction', 'couponCodeApplied' );
    s_setP( 'digitalData.event['+evtIndex+'].eventInfo.timeStamp', '' + new Date() + '' );
    s_setP( 'digitalData.event['+evtIndex+'].category.primaryCategory', 'ShoppingBag' );
    s_setP( 'digitalData.cart.price.voucherCode', code.trim() );
    s_setP( 'digitalData.cart.price.voucherDiscount', Number(discount) );
    _satellite.track('onShoppingBagCouponCodeApplied');
}

function attachEventCoupon() {
	var $form = $('#frmApplyCoupon'),
    	voucherDiscount = 0;

	$form.on('amplifiFormSuccess', function(e, data) {
		var resp = data.data,
			voucherCode = $(this).find('input[name="couponCode"]').val();

		if(resp && resp.voucherDiscount) {
			voucherDiscount = resp.voucherDiscount;
		}

		if(voucherCode) {
	        trackApplyCoupon(voucherCode, voucherDiscount);
		}
    });
		// Fix for ATG-3615  - calling the trackApplyCoupon method whenever coupon is applied - Start
		var voucherCode = $('.couponCodeVal').val();
		if (voucherCode) {
			var voucherDiscount = Number($('.discountAmount').val())*(-1);
			trackApplyCoupon(voucherCode, voucherDiscount);
		}
		// Fix for ATG-3615  - calling the trackApplyCoupon method whenever coupon is applied - End
}

// ATG-9610
function analyticsNewsletter() {
    var evtIndex = getAnalyticsEventCount();
    s_setP('digitalData.event['+evtIndex+'].eventInfo.eventName', 'Email Signup');
    s_setP('digitalData.event['+evtIndex+'].eventInfo.eventAction', 'emailSignup');
    s_setP('digitalData.event['+evtIndex+'].eventInfo.timeStamp', '' + new Date() + '');
    _satellite.track('onEmailSignup');
}

/* ============================
Barnes and Noble Namespace
=============================== */

var BN = BN || {};
BN.Analytics = BN.Analytics || {};

BN.Analytics = {
    Account: {
        init: function() {
            s_setP( 'digitalData.page.attributes.channel', 'my account' );
        }
    },
    Landing: {
        init: function() {
            s_setP( 'digitalData.page.attributes.channel', 'store fronts' );

            // ATG-9684 INTERNAL SEARCH CLICK
            $('.resultsListContainer').on('click', '.product-image > a:not(".btn-quick-view"), .product-info .product-info-title > a', function() {
                var evtIndex = getAnalyticsEventCount(),
                	isGridView = $('#gridView').length > 0 ? true : false,
                	$listView = $('#listView'),
    	            parentPromoContainer = $listView.find('.search-results-promo').parent().closest('li'),
    	            items = isGridView ? $('#gridView > li > ul > li:not(".search-results-promo")') : $('#listView > li').not(parentPromoContainer),
    	            productIndex = isGridView ? items.index($(this).closest('li')) : items.index($(this).closest('#listView > li'));

            	setLocalStorageObj('referrer', productIndex);
                return true;
            });
        }
    },
    PDP: {
        init: function() {

        	$(document).on('analytics-track-pdp', trackProductView);

            // Get and Set referrer obj from localStorage Object
            if(typeof localStorage.referrer !== 'undefined' && digitalData) {
            	s_setP('digitalData.product[0].attributes.referrer', getLocalStorageObj('referrer'));
            	clearLocalStorageObj('referrer');
            }

            $('.pdp-form').on('amplifiFormSuccess', function(e) {
                var $this = $(this),
                	data = {
            			element: $this,
            			updateType: 'add',
            			addedFrom: 'pdp'
            		};
                analyticsShoppingCart(e, data);
            });

            $('#btnAddItemToWishlist').on('click', function() {
                var evtIndex = getAnalyticsEventCount();
                s_setP('digitalData.event['+evtIndex+'].eventInfo.eventName', 'prodWishlistAdd');
            });

            // ATG-4608 Product Photo Click
            $(document).on('click', '#prodImage', function() {
                trackProductPhotoClick('photoView');
            }).on('analytics-zoom-click', function() {
                trackProductPhotoClick('photoZoom');
            });

            // ATG-8559 Product Photo Zoom
            $(document).on('analytics-zoom-click', function() {
                var evtIndex = getAnalyticsEventCount();
                s_setP('digitalData.event['+evtIndex+'].eventInfo.eventName', 'Product Photo Zoom' );
                s_setP('digitalData.event['+evtIndex+'].eventInfo.eventAction', 'productPhotoZoom');
                s_setP('digitalData.event['+evtIndex+'].eventInfo.timeStamp', '' + new Date() + '');
                _satellite.track('onProductPhotoZoom');
            });

            $('#reviews-container').on('click', function() {
                var evtIndex = getAnalyticsEventCount();
                s_setP( 'digitalData.event['+evtIndex+'].eventInfo.eventName', 'prodReviewView' );
            });

            $('#postReview').on('click', function() {
                var evtIndex = getAnalyticsEventCount();
                s_setP( 'digitalData.event['+evtIndex+'].eventInfo.eventName', 'prodReviewSubmit' );
            });

            $(document).on('click', '.gig-rating-readReviewsLink', function() {
                var evtIndex = getAnalyticsEventCount();
                s_setP( 'digitalData.event['+evtIndex+'].eventInfo.eventName', 'prodRatingView' );
            });

            // ATG-4618 Product Reviews Click
            $(document).on('analytics-reviews-clicked', function(e, data) {
                trackReviewsClick(false, data.location);
            });

            // ATG-4618 Product Reviews All Click
            $(document).on('click', '#reviews-container .reviews-view-all a', function(e) {
                e.preventDefault();
                var href = $(this).attr('href');
                trackReviewsClick(true, 'seeAllCustomerReviews');
                window.location = href;
            });

            // ATG-4618 Product Reviews More Click
            $(document).on('click', '.gig-comments-more', function() {
                trackReviewsClick(false, 'showMoreReviews');
            });

            // ATG-4613: PDP Product Formats Chicklets
            /*moving to pdp.js $('#prodSummary').on('click', '#availableFormats li a', function(e) {
                e.preventDefault();
                var $this = $(this),
                    href = $this.attr('href'),
                    formatName = $this.parent().find('.tabTitle').text();
                trackProdFormatsClick(formatName);
                window.location = href;
            }); */

            // ATG-4609 Available For Pick Up In Store Click
            $(document).on('click', '[data-modal-class="BN.Modal.Browse.PDP.ReserveTT"]', function() {
                var evtIndex = getAnalyticsEventCount();
                s_setP('digitalData.event['+evtIndex+'].eventInfo.eventName', 'Available For Pick Up In Store Click');
                s_setP('digitalData.event['+evtIndex+'].eventInfo.eventAction', 'availableForPickUpInStoreClick');
                s_setP('digitalData.event['+evtIndex+'].eventInfo.timeStamp', '' + new Date() + '');
                _satellite.track('onAvailableForPickUpInStoreClick');
            });

            // ATG-3738 Product Review/Rating Submit
            $(document).on('analytics-track-review', function(e){
            	if(typeof s_setP !== 'undefined' && typeof s_getP !== 'undefined') {
	                var evtIndex = getAnalyticsEventCount(),
	                    productInfo = s_getP('digitalData.product[0].productInfo');
	                s_setP('digitalData.event['+evtIndex+'].eventInfo.eventName', 'Product Review Submit');
	                s_setP('digitalData.event['+evtIndex+'].eventInfo.eventAction', 'productReviewSubmit');
	                s_setP('digitalData.event['+evtIndex+'].category.primaryCategory', 'Product');
	                s_setP('digitalData.event['+evtIndex+'].eventInfo.timeStamp', '' + new Date() + '');
	                s_setP('digitalData.event['+evtIndex+'].attributes.product[0].productInfo', productInfo);
	                _satellite.track('onProductReviewSubmit');
            	}
            });
        }
    },
    ShoppingBag: {
        init: function() {
            var evtIndex = getAnalyticsEventCount();

            s_setP('digitalData.page.attributes.channel', 'shopping bag');
            s_setP('digitalData.event['+evtIndex+'].eventInfo.eventName', 'Shopping Bag View');
            s_setP('digitalData.event['+evtIndex+'].eventInfo.eventAction', 'shoppingBagView');
            s_setP('digitalData.event['+evtIndex+'].eventInfo.timeStamp', '' + new Date() + '');
            _satellite.track('onShoppingBagView');

            $('.remove-item form > a').on('click', function(e) {
                var $this = $(this),
                    $parent = $this.parents('li').not('.remove-item').first(),
                    data = {
                		element: $parent,
                		updateType: 'remove'
                	};
                analyticsShoppingCart(e, data);
            });

            $('form[id^=frmUpdateQty] .update-link').on('click', function(e) {
                var $this = $(this),
                    $parent = $this.parents('.quantity').parent('li'),
                    data = {
                		element: $parent
                	};
                analyticsShoppingCart(e, data);
            });

            $('.sign-in-checkout').on('click', function() {
                trackCheckoutView('sign-in');
            });

            // TRACK APPLY COUPON
            attachEventCoupon();
        }
    },
    Checkout: {
        init: function() {
            // TRACK SIGN IN
            $('#signInLink').on('click', function() {
                trackCheckoutView('sign-in');
            });

            // TRACK APPLY COUPON
            attachEventCoupon();

            // TRACK CHECKOUT PREFERENCE: METHOD
            $(document).on('click', '[data-itemscope="PaymentMethod"] .use-address, #editPayment #addAddressSubmit', function(e) {
    			e.preventDefault();

    			var paymentMethod = 'PayPal',
    				$this = $(this);

    			if($this.hasClass('use-address') || $this.attr('id') === 'addAddressSubmit') {
    				paymentMethod = 'Credit Card';
    			}

    			trackCheckoutView('payment-info', paymentMethod)

    	        $this.closest('form').submit();
    		});

            // TRACK CHECKOUT PREFERENCE: METHOD
            $(document).on('click', '#payWPPLink, #payWCCLink, .add-cc', function() {
                var paymentMethod = 'Credit Card';

                if($(this).attr('id') === 'payWPPLink') {
                    paymentMethod = 'PayPal';
                }

                trackCheckoutView('payment-info', paymentMethod);
            });

            // ALT PAYMENT METHODS ATG-4606
            $('ul.loyalty-options form').on('amplifiFormSuccess', function() {
            	var $this = $(this),
        			formName = $this.attr('name'),
        			stepName = '';

            	switch(formName) {
	            	case 'membershipApply':
	            		stepName = 'membership-info';
	            		break;
	            	case 'reg':
	            		stepName = 'giftcard-info';
	            		break;
	            	case 'frmApplyCoupon':
	            		stepName = 'coupon-info';
	            		break;
	            	case 'bookfairApply':
	            		stepName = 'bookfair-info';
	            		break;
	            	case 'taxExempt':
	            		stepName = 'tax-exempt-info';
	            		break;
	        	}
            	if(stepName) {
            		trackCheckoutView(stepName);
            	}
            });

            // ATG-4606
            $('form.gift-wrap-form').on('amplifiFormSuccess', function() {
            	trackCheckoutView('make-it-a-gift-message-submit');
            });

            // ATG-4606
            $('.make-gift-radio').on('change', function() {
            	var isGift = $(this).val() === 'true' ? 'yes' : 'no';
            	trackCheckoutView('make-it-a-gift-selection', isGift);
            });

            // ATG-4606
            $('.edit-cart-items a').on('click', function() {
            	trackCheckoutView('edit-quantity');
            });

            // TRACK SHIP-TO
            $(document).on('click', '[data-modal-class="BN.Modal.Checkout.AddShipping"]'
            		+ ', [data-modal-class="BN.Modal.Checkout.UseSavedAddress"]'
            		+ ', [data-modal-name="m-used-saved-address"] address > a, [data-modal-name="m-used-saved-address"] .btn-submit.use-address, [data-modal-name="m-used-saved-address"] .add-shipping-address'
            		+ ', [data-modal-name="m-add-shipping"] #addAddressSubmit'
            		+ ', [data-modal-name="m-edit-shipping"] #editAddressSubmit',
            function() {
                trackCheckoutView('ship-to');
            });

            $(document).on('click', '[data-modal-class="BN.Modal.Checkout.AddCC"]'
            		+ ', [data-modal-class="BN.Modal.Checkout.UseSavedCC"]'
            		+ ', [data-modal-name="m-use-saved-cc"] address > a, [data-modal-name="m-use-saved-cc"] .btn-submit.use-address'
            		+ ', [data-modal-name="editpaymentorder"] #addAddressSubmit'
            		+ ', [data-modal-name="m-add-cc"] #addAddressSubmit',
            function() {
                // TRACK PAYMENT INFO
                trackCheckoutView('payment-info');

                // TRACK BILLING INFO
                trackCheckoutView('billing-info');
            });
        },
        trackDeliverySpeed: function() {
        	// TRACK SHIPPING METHOD
        	var labelText = $('.delivery-options').find('input[type=radio]:checked').siblings('.radio-label-text').text(),
				stepName = 'shipping-method',
				deliverySpeedText = labelText.split(':')[0].replace(/[\r\n]/g, '');
        	trackCheckoutView(stepName, deliverySpeedText);
        },
        trackDeliveryPref: function() {
        	// TRACK SHIPPING PREF
        	var labelText = $('.delivery-preferece').find('input[type=radio]:checked').siblings('.radio-label-text').text(),
				stepName = 'shipping-preference',
				deliveryPreference = 'Send each item as it is available';

			if (/send everything/i.test(labelText)) {
				deliveryPreference = 'Send everything in as few packages';
			}
			trackCheckoutView(stepName, deliveryPreference);
        },
        LoggedUser: {
            init: function() {
                // TRACK EXPRESS START
                trackCheckoutView('express-start');

                // TRACK REVIEW ITEMS
                trackCheckoutView('review-items');

                // TRACK FINAL CONFIRMATION
                trackCheckoutView('final');

                if($('#shipMethods').length > 0) {
                	BN.Analytics.Checkout.trackDeliverySpeed();
                }

                if($('#deliveryOptionsContainer form').length > 0) {
                	BN.Analytics.Checkout.trackDeliveryPref();
                }
            }
        },
        GuestUser: {
            init: function() {

            },
            shipping: function() {
                // TRACK REGULAR START
                trackCheckoutView('regular-start');

                // TRACK SHIP-TO
                trackCheckoutView('ship-to');
            },
            delivery: function() {
            	if($('#shipMethods').length > 0) {
                	BN.Analytics.Checkout.trackDeliverySpeed();
                }

            	if($('#deliveryOptionsContainer form').length > 0) {
                	BN.Analytics.Checkout.trackDeliveryPref();
                }
            },
            billing: function() {
                // TRACK PAYMENT INFO
                trackCheckoutView('payment-info');

                // TRACK BILLING INFO
                trackCheckoutView('billing-info');
            },
            review: function() {
                // TRACK FINAL CONFIRMATION
                trackCheckoutView('final');
            }
        }
    },
    Search: {
        init: function() {
        	if(typeof s_setP !== 'undefined' && typeof s_getP !== 'undefined') {
	            // ATG-8721 Search Key Tracking
	            (function() {
	            	var ntkVal = getQueryParameterByName('Ntk'),
	            		searchParam = ntkVal.length > 0 ? ntkVal : 'All';
	            	s_setP('digitalData.page.attributes.endeca.recordSearchKey', searchParam);
	            })();

	            var evtIndex = getAnalyticsEventCount(),
	                storeFrontOption = $('#searchFilterSelect').find(':selected').text(),
	                category = s_getP('digitalData.page.category');

	            s_setP('digitalData.event['+evtIndex+'].eventInfo.eventName', 'Internal Search');
	            s_setP('digitalData.event['+evtIndex+'].eventInfo.eventAction', 'internalSearch');
	            s_setP('digitalData.event['+evtIndex+'].attributes.storeFront', storeFrontOption);
	            s_setP('digitalData.event['+evtIndex+'].eventInfo.timeStamp', '' + new Date() + '');
	            if(category) s_setP('digitalData.event['+evtIndex+'].category', category);
	            _satellite.track('onInternalSearch');

	            $('#refinements .refinements dd a').on('click', function() {
	                var evtIndex = getAnalyticsEventCount();
	                s_setP( 'digitalData.event['+evtIndex+'].eventInfo.eventName', 'prodlistFilter' );
	            });

	            $('[id^=sortProducts]').on('change', function() {
	                var evtIndex = getAnalyticsEventCount();
	                s_setP( 'digitalData.event['+evtIndex+'].eventInfo.eventName', 'prodListSort' );
	            });

	            $('.landingPage .selectBox-dropdown-menu li a').on('click', function() {
	                var evtIndex = getAnalyticsEventCount();
	                s_setP( 'digitalData.event['+evtIndex+'].eventInfo.eventName', 'prodListSelect' );
	            });

	            // ATG-4617 INTERNAL SEARCH CLICK
	            $('.resultsListContainer').on('click', '.product-image > a:not(".btn-quick-view"), .product-info .product-info-title > a', function() {
	                var evtIndex = getAnalyticsEventCount(),
	                	isGridView = $('#gridView').length > 0 ? true : false,
	                    $listView = $('#listView'),
	                	parentPromoContainer = $listView.find('.search-results-promo').parent().closest('li'),
	            		items = isGridView ? $('#gridView > li > ul > li:not(".search-results-promo")') : $('#listView > li').not(parentPromoContainer),
	            		productIndex = isGridView ? items.index($(this).closest('li')) : items.index($(this).closest('#listView > li')),
	            		prodData = s_getP('digitalData.product[' + productIndex + ']');

	            	setLocalStorageObj('referrer', productIndex);

	            	s_setP('digitalData.event['+evtIndex+'].attributes.product[0]', prodData);
	                s_setP('digitalData.event['+evtIndex+'].eventInfo.eventName', 'Internal Search');
	                s_setP('digitalData.event['+evtIndex+'].eventInfo.eventAction', 'internalSearchResultsProductClick');
	                s_setP('digitalData.event['+evtIndex+'].eventInfo.timeStamp', '' + new Date() + '');
	                _satellite.track('onInternalSearchResultsProductClick');
	                return true;
	            });

	            if($('#listView').length > 0) {
	                 updateAnalyticsSortView('List');
	            } else if($('#gridView').length > 0) {
	                updateAnalyticsSortView('Grid');
	            }

	            // ATG-4613: Grid & List View, All Formats
	            /* $('.product-info').on('click', '.formats > li > a, .format > a, p:last-child > a:not([data-pdp-view="seeAllFormats"])', function(e) {
	                e.preventDefault();
	                var href = $(this).attr('href');
	                trackProdFormatsClick();
	                window.location = href;
	            }); */
	        }
        }
    },
    Thankyou: {
        init: function() {
            _satellite.track('onPurchase');
        }
    },
    Generic: {
        init: function() {
        	// Analytics email newsletter: modal
            $(document).on('analytics-email-signup', analyticsNewsletter);

            // Analytics email newsletter: footer
            $('#emailSignupForm').on('amplifiFormSuccess', analyticsNewsletter);

            // MINI CART ADD
            $(document).on('analytics-mini-cart-add', function(e) {
                var $elem = $(e.target),
                	$this = $elem.closest('.mini-cart-item'),
                	data = {
            			element: $this
            		};

                analyticsShoppingCart(e, data);
            });

            // MINI CART REMOVE
            $(document).on('analytics-mini-cart-remove', function(e) {
                var $elem = $(e.target),
                	$this = $elem.closest('.mini-cart-item'),
                	data = {
            			element: $this,
            			updateType: 'remove'
            		};

                analyticsShoppingCart(e, data);
            });

            // ATG-4604 QUICKVIEW ADD TO CART
            $(document).on('analytics-add-to-bag','[data-modal-name="quickview"] .pdp-form', function(e) {
                var $this = $(this),
                data = {
            		element: $this,
            		updateType: 'add',
            		addedFrom: 'modal'
            	};
                analyticsShoppingCart(e, data);
            });

            // ATG-4604 MARKETPLACE ADD TO CART
            $(document).on('analytics-market-add',function(e,obj) {
                var $this = $(this),
                	data = {
            			element: $(obj.currentTarget).parents('li').parents('li'),
            			updateType: 'add',
            			addedFrom: 'modal'
            		};
                analyticsShoppingCart(e, data);
            });

            // MODAL:QUICKVIEW
            $(document).on('analytics-quick-view', function(e, data) {
                var evtIndex = getAnalyticsEventCount();

                if(data && data.analytics) {
                    updateAnalyticsProdObj(data.analytics, evtIndex);
                }
                s_setP('digitalData.event['+evtIndex+'].eventInfo.eventName', 'Product Quick View');
                s_setP('digitalData.event['+evtIndex+'].eventInfo.eventAction', 'productQuickView');
                s_setP('digitalData.event['+evtIndex+'].eventInfo.timeStamp', '' + new Date() + '');
                _satellite.track('onProductQuickView');
            });

            // MODAL:ALL FORMAT & EDITIONS
            $(document).on('click', '#qvFormatsTabContent .all-formats-tab h3>a', function() {
                var evtIndex = getAnalyticsEventCount(),
                    $this = $(this),
                    formatName = $this.data('format-name');
                s_setP('digitalData.event['+evtIndex+'].eventInfo.eventName', 'Formats Editions Tab Click');
                s_setP('digitalData.event['+evtIndex+'].eventInfo.eventAction', 'formatsEditionsTabClick');
                s_setP('digitalData.event['+evtIndex+'].eventInfo.timeStamp', '' + new Date() + '');
                s_setP('digitalData.event['+evtIndex+'].attributes.formatName', formatName);
                _satellite.track('onFormatsEditionsTabClick');
            });

            // ATG-4604 ALL FORMAT & EDITIONS ADD TO CART
            $(document).on('analytics-add-to-bag','[data-modal-name="allFormats"] .pdp-form', function(e) {
                var $this = $(this),
                	$btn = $this.find('.btn-addtocart'),
                	prodData = $this.siblings('.analytics-qv-data').text(),
                    data = {
                		element: $this,
                		updateType: 'add',
                		addedFrom: 'modal'
                	};

                attachDataToButton(prodData, $btn);
                analyticsShoppingCart(e, data)
            });

            // ATG-4613: All Formats Modal Link
            $(document).on('click', '[data-modal-class="BN.Modal.Browse.Formats"]', trackAllFormatsEditions);

            // SOCIAL MEDIA
            $(document).on('click', '.bn-share-link', function() {
                var networkName = $(this).data('socialsharetype');
                trackSocialMediaClick(networkName);
            });

            // SOCIAL MEDIA FOOTER
            $(document).on('click', '.global-footer-social-links .social > li > a', function(e) {
                var $this = $(this),
                    networkName = $this.text(),
                    href = $this.attr('href');

                e.preventDefault();
                trackSocialMediaClick(networkName);
                window.location = href;
            });

            // GIFT WRAP
            $(document).on('click','#giftWrapId', function(){
                var evtIndex = getAnalyticsEventCount();
                if($(this).is(':checked')) {
                    s_setP('digitalData.event['+evtIndex+'].eventInfo.eventName', 'Gift Wrap Option Selected');
                    s_setP('digitalData.event['+evtIndex+'].eventInfo.eventAction', 'giftWrapOptionSelected');
                    s_setP('digitalData.event['+evtIndex+'].eventInfo.timeStamp', '' + new Date() + '');
                    _satellite.track('onGiftWrappedOptionSelected');
                }
            });

            // ATG-4610 Find In Store Click
            $(document).on('click','[data-modal-class="BN.Modal.Browse.PDP.Reserve"]', function(e){
                var evtIndex = getAnalyticsEventCount();
                s_setP('digitalData.event['+evtIndex+'].eventInfo.eventName', 'Find IN-Store Click');
                s_setP('digitalData.event['+evtIndex+'].eventInfo.eventAction', 'findInStoreClick');
                s_setP('digitalData.event['+evtIndex+'].eventInfo.timeStamp', '' + new Date() + '');
                _satellite.track('onFindInStoreClick');
            });

            // ATG-9346 Instant Purchase Click
            $('form.ip-form').on('amplifiFormSuccess', function(e){
                var $this = $(this),
                	isRental = $this.closest('.multi-product-select').length > 0 ? true : false,
                	parent = isRental ? 'li' : '#prodInfoContainer',
                	$pdpForm = $this.parents(parent).find('.pdp-form') || $this.siblings('.pdp-form'),
                	data = {
                		element: $pdpForm,
                		updateType: 'add',
                		addedFrom: 'pdp',
                		isInstant: true
                	};

                analyticsShoppingCart(e, data);
            });

            // TRACK ANALYTICS PAGE ONLOAD ERRRS
            trackOnloadErrors();

            // TRACK ANALYTICS PREVIOUS PAGE NAME
            var isInIframe = (window.location != window.parent.location) ? true : false;
            if(!isInIframe) {
                trackAnalyticsPrevPage();
            }

            // ATG-8669 Typeahead Tracking
            $('#headSearchTypeAheadHolder').on('click', 'a.bn-suggest-link', function(e) {
            	_satellite.track('onTypeAheadSearch');
            });
        },
        GoogleAds: function() {
            var isOverIframe = false,
                windowLostBlur = function () {
                if(isOverIframe === true) {
                    var evtIndex = getAnalyticsEventCount();
                    s_setP('digitalData.event['+evtIndex+'].eventInfo.eventName', 'Advertising');
                    s_setP('digitalData.event['+evtIndex+'].eventInfo.eventAction', 'advertisingClick');
                    s_setP('digitalData.event['+evtIndex+'].eventInfo.timeStamp', '' + new Date() + '');
                    _satellite.track('onAdvertisingClick');

                    isOverIframe = false;
                }
            };

            $('#relatedAd [id^=google_ads_iframe], #relatedAd2 [id^=google_ads_iframe], #adcontainer1 iframe').mouseenter(function(){
                isOverIframe = true;
                document.activeElement.blur();
            }).mouseleave(function(){
                isOverIframe = false;
            });

            $(window).blur(function () {
                windowLostBlur();
            });
        }
    }
}

/*=============================================
Init method for invoking functions
List additional init() methods as needed
=============================================*/
BN.Analytics.init = function(){
    BN.Analytics.Generic.init();
};

/*=============================================
Invoke init() method on .ready
=============================================*/
$(document).ready(function(){
    BN.Analytics.init();
});