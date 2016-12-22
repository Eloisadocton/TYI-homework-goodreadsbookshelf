/*global window,document,digitalData,_satellite,$,localStorage,navigator,s,Int32Array */

// AUTHOR: Copyright 2004-2016 Rawsoft, Inc. All Rights Reserved
// DESCRIPTION: Helper functions for data layer
// UPDATED: 15.08.26
/************************** RAWSOFT CUSTOM FUNCTIONS *************************/

var _globalMessagePrefix = 'BN: ';
var _globalObjectName = 'BNAnalytics';
var W = eval('window');
W[_globalObjectName] = (W[_globalObjectName] || {});
W[_globalObjectName].Logs = (W[_globalObjectName].Logs || []);
W[_globalObjectName].IsMobile = (W.location.pathname.toLowerCase().indexOf('/mobile') === 0);

/************************** BARNES AND NOBLE GLOBAL FUNCTIONS *************************/
// Global functions
// UPDATE HERE BELOW

W[_globalObjectName].isProductPage = function () {
    var success = false;
    try {
        var pt = _satellite.getVar('pageType');
        var sku = _satellite.getVar('sku');
        success = (pt === 'pdp' || pt === 'product') && (typeof (sku) !== 'undefined') && sku.length > 0;
    } catch (e) {}
    return success;
};

W[_globalObjectName].getProductsForAdobe = function (price) {
    // This only works for the PD Page, so only use it then
    var prods = '';
    try {
        // use classifications
        var req_eVar15 = (_satellite.getVar('req_eVar15') || '');
        var req_eVar62 = (_satellite.getVar('productAvailability') || '');
        var req_eVar61 = (_satellite.getVar('productRatingReviews') || '');
        prods += ";" + _satellite.getVar('sku') + ";;" + (price || 'zero') + ";;evar61=" + req_eVar61 + "|evar62=" + req_eVar62 + "|evar15=" + req_eVar15;
    } catch (e) {}
    return prods;
};

W[_globalObjectName].getCartProductsForAdobeFromDL = function () {
    var cart = window.s_getP('digitalData.cart'),
        prods = '';
    if (cart) {
        var i, p;
        for (i = 0; i < cart.item.length; i++) { //for each item in cart
            // + ';;' + (cart.item[i].price.basePrice || 'zero');
            p = ";" + cart.item[i].productInfo.sku;
            if (p) {
                prods = (prods ? (prods + ',') : '') + p;
            }
        }
    }
    return prods;
};

W[_globalObjectName].getCurrentProductsForAdobeFromDL = function (prod) {
    // NOTE: Incomplete for Jira(3611,3612,3613) - price missing
    // BUG: The format of digitalData.product & digibalData.event.product is not the same
    prod = (prod || window.s_getP('digitalData.product[0]'));
    var products = '';
    try {
        var rating = W.r_getByPath(prod, 'attributes.rating', 'zero');
        var reviews = W.r_getByPath(prod, 'attributes.reviews', 'zero');
        var rating_reviews = (rating + ':' + reviews);
        var qty = W.r_getByPath(prod, 'productInfo.qty', '1');

        // format the data
        var price = W.r_getByPath(prod, 'price.basePrice', 0);
        products = (typeof (prod.category) != 'undefined' ? prod.category.productType : '');
        products += ";" + prod.productInfo.sku + ";" + qty + ";" + (price || 'zero') + ";;evar61=" + rating_reviews + "|evar62=" + _satellite.getVar('productAvailability');
    } catch (e) {}
    return products;
};

W[_globalObjectName].getCartOpen = function (s, cookieName) {
    // Will append scOpen if needed
    // The adobe plugin does not work and secondly there are other unique scenarios for BN
    // We will however use the same cookie name to keep things consistent
    var sEvents = (s.events ? s.events : ''),
        t = new Date();

    // every 30 minutes - session time
    t.setTime(t.getTime() + 1800000);

    // do we have scAdd
    if (sEvents.indexOf('scAdd') > -1 && sEvents.indexOf('scOpen') < 0 && !s.c_r(cookieName)) {
        sEvents += ',scOpen';
        if (!s.c_w(cookieName, 1, t)) {
            s.c_w(cookieName, 1, 0);
        }
    }

    // do we have scView
    if (sEvents.indexOf('scView') > -1 && sEvents.indexOf('scOpen') < 0 && !s.c_r(cookieName)) {
        var cartItems = window.s_getP('digitalData.cart.item');
        if (cartItems && cartItems.length > 0) {
            sEvents += ',scOpen';
            if (!s.c_w(cookieName, 1, t)) {
                s.c_w(cookieName, 1, 0);
            }
        }
    }

    // If the user makes a purchase then reset scOpen
    if (sEvents.indexOf('purchase') > -1) {
        t = new Date();
        t.setTime(t.getTime() + 10000);
        if (s.c_r(cookieName) || sEvents.indexOf('scOpen') > -1) {
            if (!s.c_w(cookieName, '', t)) {
                s.c_w(cookieName, '', 0);
            }
        }
    }

    return sEvents;
};

W[_globalObjectName].getReportingSuiteIDs = function () {
    /// <summary>
    /// Configuring the appropriate reporting suites based on current domain
    /// DTM automatically looks for "s_account" if its found and not empty but not used.
    /// </summary>
    /// <returns type="">comma delimited suite id's</returns>

    var isMobile = W[_globalObjectName].IsMobile;
    var env = (isMobile === true ? 'mobile' : 'full');
    var sa = 'banfulldev,banglobaldev';

    switch (W.location.hostname.toLowerCase()) {
        case 'www.barnesandnoble.com':
        case 'barnesandnoble.com':
        case 'nook.barnesandnoble.com':
        case 'stores.barnesandnoble.com':
        case 'www.nookarticles.com':
            sa = 'ban' + env + 'prod,banglobalprod';
            break;
        case 'www-dev.barnesandnoble.com':
            sa = 'ban' + env + 'dev,banglobaldev';
            break;
        case 'www-test.barnesandnoble.com':
            sa = 'ban' + env + 'qa,banglobalqa';
            break;
        case 'faf.barnesandnoble.com':
            sa = 'ban' + env + 'stage,banglobalstage';
            break;
        case 'mpreprod.barnesandnoble.com':
        case 'http://mbarnesandnoble.skavaone.com/':
            sa = 'banmobiledev,banglobaldev';
            break;
        default:
            sa = 'banfulldev,banglobaldev';
            break;
    }

    return sa;
};

W[_globalObjectName].IsDevelopment = function () {
    /// Are we in production
    var isDev = true;
    switch (W.location.hostname.toLowerCase()) {
        case 'www.barnesandnoble.com':
        case 'barnesandnoble.com':
        case 'nook.barnesandnoble.com':
        case 'stores.barnesandnoble.com':
            isDev = false;
            break;
        default:
            break;
    }
    return isDev;
};

W[_globalObjectName].getProductAvailability = function (product) {
    var results;
    if (product && product.attributes) {
        // NOTE: There are only two options now, this will need updates once more is added such as pre-order
        // or maybe we have a new digitalData.product.attributes.availability Jira Ticket
        if (product.attributes.notifyWhenStocked) {
            results = 'notify when in stock';
        }
        if (product.attributes.outOfStock) {
            results = 'out of stock';
        }
    }
    return (results || 'in stock');
};

W[_globalObjectName].getProductRatingsAndReviews = function (product) {
    var results = 'zero:zero';
    if (product && product.attributes) {
        var rating = (product.attributes.rating || 'zero');
        var reviews = (product.attributes.reviews || 'zero');
        results = (rating + ':' + reviews);
    }
    return results;
};

/************************** BARNES AND NOBLE GLOBAL FUNCTIONS *************************/
// TODO: Need to convert these to use W[_globalObjectName]

if (!W.r_getShoppingCartSkus) {
    W.r_getShoppingCartSkus = function () {
        var skus = [];
        if (digitalData.cart && digitalData.cart.item) {
            for (var i = 0; i < digitalData.cart.item.length; i++) {
                skus.push(digitalData.cart.item[i].productInfo.sku);
            }
        }
        return skus;
    };
}

if (!W.r_getTransactionSkus) {
    W.r_getTransactionSkus = function () {
        var skus = [];
        var items = window.r_getByPath(window, 'digitalData.transaction.item');
        if (items) {
            for (var i = 0; i < digitalData.transaction.item.length; i++) {
                skus.push(digitalData.transaction.item[i].productInfo.sku);
            }
        }
        return skus;
    };
}

if (!W.r_getTransactionTotalQuantity) {
    W.r_getTransactionTotalQuantity = function () {
        var totalQty = 0;
        var items = window.r_getByPath(window, 'digitalData.transaction.item');
        if (items) {
            for (var i = 0; i < digitalData.transaction.item.length; i++) {
                totalQty += digitalData.transaction.item[i].quantity;
            }
        }
        return totalQty;
    };
}

if (!W.r_getProductsForAdobeFromDLEvent) {
    W.r_getProductsForAdobeFromDLEvent = function (eventAction) {
        // pulls the last event that matches the specified eventAction
        // and then parse it for product data into Adobe product data format.
        var evt = window.r_findDigitalDataEvent(eventAction);
        var products = '';
        if (evt) {
            products = W[_globalObjectName].getCurrentProductsForAdobeFromDL(evt.attributes.product[0]);
        }
        return products;
    };
}

/************************** RAWSOFT CUSTOM UTILITY FUNCTIONS *************************/
// DO NOT UPDATE HERE BELOW
/*************************************************************************************/

// FASTMD5 (r_md5(data,ascii,arrayOutput)) - in a closure
// ascii - set true if data consists only of ASCII chars to improve performance
// arrayOutput - if true, then the result is an array of chars (not a string)
(function (g) {
    var $0 = [], // result
        $1 = [], // tail
        $2 = [], // blocks
        $3 = [], // s1
        $4 = ("0123456789abcdef").split(""), // hex
        $5 = [], // s2
        $6 = [], // state
        $7 = false, // is state created
        $8 = 0, // len_cache
        $9 = 0, // len
        BUF = [];

    // use Int32Array if defined
    if (g.Int32Array) {
        $1 = new Int32Array(16);
        $2 = new Int32Array(16);
        $3 = new Int32Array(4);
        $5 = new Int32Array(4);
        $6 = new Int32Array(4);
        BUF = new Int32Array(4);
    } else {
        var i;
        for (i = 0; i < 16; i++) {
            $1[i] = $2[i] = 0;
        }
        for (i = 0; i < 4; i++) {
            $3[i] = $5[i] = $6[i] = BUF[i] = 0;
        }
    }

    // fill s1
    $3[0] = 128;
    $3[1] = 32768;
    $3[2] = 8388608;
    $3[3] = -2147483648;

    // fill s2
    $5[0] = 0;
    $5[1] = 8;
    $5[2] = 16;
    $5[3] = 24;

    function encode(s) {
        var utf = "",
            enc = "",
            start = 0,
            end = 0;

        for (var i = 0, j = s.length; i < j; i++) {
            var c = s.charCodeAt(i);

            if (c < 128) {
                end++;
                continue;
            } else if (c < 2048) {
                enc = String.fromCharCode((c >> 6) | 192, (c & 63) | 128);
            } else {
                enc = String.fromCharCode((c >> 12) | 224, ((c >> 6) & 63) | 128, (c & 63) | 128);
            }

            if (end > start) {
                utf += s.slice(start, end);
            }

            utf += enc;
            start = end = i + 1;
        }

        if (end > start) {
            utf += s.slice(start, j);
        }

        return utf;
    }

    function md5_update(s) {
        var i, I;

        s += "";
        $7 = false;
        $8 = $9 = s.length;

        if ($9 > 63) {
            getBlocks(s.substring(0, 64));
            md5cycle($2);
            $7 = true;

            for (i = 128; i <= $9; i += 64) {
                getBlocks(s.substring(i - 64, i));
                md5cycleAdd($2);
            }

            s = s.substring(i - 64);
            $9 = s.length;
        }

        $1[0] = $1[1] = $1[2] = $1[3] =
            $1[4] = $1[5] = $1[6] = $1[7] =
            $1[8] = $1[9] = $1[10] = $1[11] =
            $1[12] = $1[13] = $1[14] = $1[15] = 0;

        for (i = 0; i < $9; i++) {
            I = i & 3;
            if (I === 0) {
                $1[i >> 2] = s.charCodeAt(i);
            } else {
                $1[i >> 2] |= s.charCodeAt(i) << $5[I];
            }
        }
        $1[i >> 2] |= $3[i & 3];

        if (i > 55) {
            if ($7) {
                md5cycleAdd($1);
            } else {
                md5cycle($1);
                $7 = true;
            }

            return md5cycleAdd([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, $8 << 3, 0]);
        }

        $1[14] = $8 << 3;

        if ($7) {
            md5cycleAdd($1);
        } else {
            md5cycle($1);
        }
    }

    function getBlocks(s) {
        for (var i = 16; i--;) {
            var I = i << 2;
            $2[i] = s.charCodeAt(I) + (s.charCodeAt(I + 1) << 8) + (s.charCodeAt(I + 2) << 16) + (s.charCodeAt(I + 3) << 24);
        }
    }

    function md5(data, ascii, arrayOutput) {
        md5_update(ascii ? data : encode(data));

        var tmp = $6[0];
        $0[1] = $4[tmp & 15];
        $0[0] = $4[(tmp >>= 4) & 15];
        $0[3] = $4[(tmp >>= 4) & 15];
        $0[2] = $4[(tmp >>= 4) & 15];
        $0[5] = $4[(tmp >>= 4) & 15];
        $0[4] = $4[(tmp >>= 4) & 15];
        $0[7] = $4[(tmp >>= 4) & 15];
        $0[6] = $4[(tmp >>= 4) & 15];

        tmp = $6[1];
        $0[9] = $4[tmp & 15];
        $0[8] = $4[(tmp >>= 4) & 15];
        $0[11] = $4[(tmp >>= 4) & 15];
        $0[10] = $4[(tmp >>= 4) & 15];
        $0[13] = $4[(tmp >>= 4) & 15];
        $0[12] = $4[(tmp >>= 4) & 15];
        $0[15] = $4[(tmp >>= 4) & 15];
        $0[14] = $4[(tmp >>= 4) & 15];

        tmp = $6[2];
        $0[17] = $4[tmp & 15];
        $0[16] = $4[(tmp >>= 4) & 15];
        $0[19] = $4[(tmp >>= 4) & 15];
        $0[18] = $4[(tmp >>= 4) & 15];
        $0[21] = $4[(tmp >>= 4) & 15];
        $0[20] = $4[(tmp >>= 4) & 15];
        $0[23] = $4[(tmp >>= 4) & 15];
        $0[22] = $4[(tmp >>= 4) & 15];

        tmp = $6[3];
        $0[25] = $4[tmp & 15];
        $0[24] = $4[(tmp >>= 4) & 15];
        $0[27] = $4[(tmp >>= 4) & 15];
        $0[26] = $4[(tmp >>= 4) & 15];
        $0[29] = $4[(tmp >>= 4) & 15];
        $0[28] = $4[(tmp >>= 4) & 15];
        $0[31] = $4[(tmp >>= 4) & 15];
        $0[30] = $4[(tmp >>= 4) & 15];

        return arrayOutput ? $0 : $0.join("");
    }

    function R(q, a, b, x, s1, s2, t) {
        a += q + x + t;
        return ((a << s1 | a >>> s2) + b) << 0;
    }

    function md5cycle(k) {
        md5_rounds(0, 0, 0, 0, k);

        $6[0] = (BUF[0] + 1732584193) << 0;
        $6[1] = (BUF[1] - 271733879) << 0;
        $6[2] = (BUF[2] - 1732584194) << 0;
        $6[3] = (BUF[3] + 271733878) << 0;
    }

    function md5cycleAdd(k) {
        md5_rounds($6[0], $6[1], $6[2], $6[3], k);

        $6[0] = (BUF[0] + $6[0]) << 0;
        $6[1] = (BUF[1] + $6[1]) << 0;
        $6[2] = (BUF[2] + $6[2]) << 0;
        $6[3] = (BUF[3] + $6[3]) << 0;
    }

    function md5_rounds(a, b, c, d, k) {
        var bc, da;

        if ($7) {
            a = R(((c ^ d) & b) ^ d, a, b, k[0], 7, 25, -680876936);
            d = R(((b ^ c) & a) ^ c, d, a, k[1], 12, 20, -389564586);
            c = R(((a ^ b) & d) ^ b, c, d, k[2], 17, 15, 606105819);
            b = R(((d ^ a) & c) ^ a, b, c, k[3], 22, 10, -1044525330);
        } else {
            a = k[0] - 680876937;
            a = ((a << 7 | a >>> 25) - 271733879) << 0;
            d = k[1] - 117830708 + ((2004318071 & a) ^ -1732584194);
            d = ((d << 12 | d >>> 20) + a) << 0;
            c = k[2] - 1126478375 + (((a ^ -271733879) & d) ^ -271733879);
            c = ((c << 17 | c >>> 15) + d) << 0;
            b = k[3] - 1316259209 + (((d ^ a) & c) ^ a);
            b = ((b << 22 | b >>> 10) + c) << 0;
        }

        a = R(((c ^ d) & b) ^ d, a, b, k[4], 7, 25, -176418897);
        d = R(((b ^ c) & a) ^ c, d, a, k[5], 12, 20, 1200080426);
        c = R(((a ^ b) & d) ^ b, c, d, k[6], 17, 15, -1473231341);
        b = R(((d ^ a) & c) ^ a, b, c, k[7], 22, 10, -45705983);
        a = R(((c ^ d) & b) ^ d, a, b, k[8], 7, 25, 1770035416);
        d = R(((b ^ c) & a) ^ c, d, a, k[9], 12, 20, -1958414417);
        c = R(((a ^ b) & d) ^ b, c, d, k[10], 17, 15, -42063);
        b = R(((d ^ a) & c) ^ a, b, c, k[11], 22, 10, -1990404162);
        a = R(((c ^ d) & b) ^ d, a, b, k[12], 7, 25, 1804603682);
        d = R(((b ^ c) & a) ^ c, d, a, k[13], 12, 20, -40341101);
        c = R(((a ^ b) & d) ^ b, c, d, k[14], 17, 15, -1502002290);
        b = R(((d ^ a) & c) ^ a, b, c, k[15], 22, 10, 1236535329);

        a = R(((b ^ c) & d) ^ c, a, b, k[1], 5, 27, -165796510);
        d = R(((a ^ b) & c) ^ b, d, a, k[6], 9, 23, -1069501632);
        c = R(((d ^ a) & b) ^ a, c, d, k[11], 14, 18, 643717713);
        b = R(((c ^ d) & a) ^ d, b, c, k[0], 20, 12, -373897302);
        a = R(((b ^ c) & d) ^ c, a, b, k[5], 5, 27, -701558691);
        d = R(((a ^ b) & c) ^ b, d, a, k[10], 9, 23, 38016083);
        c = R(((d ^ a) & b) ^ a, c, d, k[15], 14, 18, -660478335);
        b = R(((c ^ d) & a) ^ d, b, c, k[4], 20, 12, -405537848);
        a = R(((b ^ c) & d) ^ c, a, b, k[9], 5, 27, 568446438);
        d = R(((a ^ b) & c) ^ b, d, a, k[14], 9, 23, -1019803690);
        c = R(((d ^ a) & b) ^ a, c, d, k[3], 14, 18, -187363961);
        b = R(((c ^ d) & a) ^ d, b, c, k[8], 20, 12, 1163531501);
        a = R(((b ^ c) & d) ^ c, a, b, k[13], 5, 27, -1444681467);
        d = R(((a ^ b) & c) ^ b, d, a, k[2], 9, 23, -51403784);
        c = R(((d ^ a) & b) ^ a, c, d, k[7], 14, 18, 1735328473);
        b = R(((c ^ d) & a) ^ d, b, c, k[12], 20, 12, -1926607734);

        bc = b ^ c;
        a = R(bc ^ d, a, b, k[5], 4, 28, -378558);
        d = R(bc ^ a, d, a, k[8], 11, 21, -2022574463);
        da = d ^ a;
        c = R(da ^ b, c, d, k[11], 16, 16, 1839030562);
        b = R(da ^ c, b, c, k[14], 23, 9, -35309556);
        bc = b ^ c;
        a = R(bc ^ d, a, b, k[1], 4, 28, -1530992060);
        d = R(bc ^ a, d, a, k[4], 11, 21, 1272893353);
        da = d ^ a;
        c = R(da ^ b, c, d, k[7], 16, 16, -155497632);
        b = R(da ^ c, b, c, k[10], 23, 9, -1094730640);
        bc = b ^ c;
        a = R(bc ^ d, a, b, k[13], 4, 28, 681279174);
        d = R(bc ^ a, d, a, k[0], 11, 21, -358537222);
        da = d ^ a;
        c = R(da ^ b, c, d, k[3], 16, 16, -722521979);
        b = R(da ^ c, b, c, k[6], 23, 9, 76029189);
        bc = b ^ c;
        a = R(bc ^ d, a, b, k[9], 4, 28, -640364487);
        d = R(bc ^ a, d, a, k[12], 11, 21, -421815835);
        da = d ^ a;
        c = R(da ^ b, c, d, k[15], 16, 16, 530742520);
        b = R(da ^ c, b, c, k[2], 23, 9, -995338651);

        a = R(c ^ (b | ~d), a, b, k[0], 6, 26, -198630844);
        d = R(b ^ (a | ~c), d, a, k[7], 10, 22, 1126891415);
        c = R(a ^ (d | ~b), c, d, k[14], 15, 17, -1416354905);
        b = R(d ^ (c | ~a), b, c, k[5], 21, 11, -57434055);
        a = R(c ^ (b | ~d), a, b, k[12], 6, 26, 1700485571);
        d = R(b ^ (a | ~c), d, a, k[3], 10, 22, -1894986606);
        c = R(a ^ (d | ~b), c, d, k[10], 15, 17, -1051523);
        b = R(d ^ (c | ~a), b, c, k[1], 21, 11, -2054922799);
        a = R(c ^ (b | ~d), a, b, k[8], 6, 26, 1873313359);
        d = R(b ^ (a | ~c), d, a, k[15], 10, 22, -30611744);
        c = R(a ^ (d | ~b), c, d, k[6], 15, 17, -1560198380);
        b = R(d ^ (c | ~a), b, c, k[13], 21, 11, 1309151649);
        a = R(c ^ (b | ~d), a, b, k[4], 6, 26, -145523070);
        d = R(b ^ (a | ~c), d, a, k[11], 10, 22, -1120210379);
        c = R(a ^ (d | ~b), c, d, k[2], 15, 17, 718787259);
        b = R(d ^ (c | ~a), b, c, k[9], 21, 11, -343485551);

        BUF[0] = a;
        BUF[1] = b;
        BUF[2] = c;
        BUF[3] = d;
    }

    g.r_md5 = (g.r_md5 || md5);

}(window));


if (!W.r_utf8_encode) {
    W.r_utf8_encode = function (data) {
        return window.unescape(window.encodeURIComponent(data));
    };
}

if (!W.r_utf8_decode) {
    W.r_utf8_decode = function (data) {
        return window.decodeURIComponent(window.escape(data));
    };
}

if (!W.r_removeQueryParam) {
    W.r_removeQueryParam = function (key, sourceURL) {
        var rtn = sourceURL.split("?")[0],
            param, params_arr = [],
            queryString = (sourceURL.indexOf("?") !== -1) ? sourceURL.split("?")[1] : "";
        if (queryString !== "") {
            params_arr = queryString.split("&");
            for (var i = params_arr.length - 1; i >= 0; i -= 1) {
                param = params_arr[i].split("=")[0];
                if (param === key) {
                    params_arr.splice(i, 1);
                }
            }
            rtn = (params_arr.length > 0 ? (rtn + "?" + params_arr.join("&")) : rtn);
        }
        return rtn;
    };
}

if (!W.r_round) {
    W.r_round = function (value, decimals, enforce) {
        var num = Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
        if (!enforce) {
            return num;
        }

        var exponent = Math.pow(10, decimals);
        num = Math.round((num * exponent)).toString();
        return Number(num.slice(0, -1 * decimals) + '.' + num.slice(-1 * decimals));
    };
}

if (!W.r_extractDomain) {
    W.r_extractDomain = function (url) {
        var domain = (url.indexOf("//") > -1) ? url.split('/')[2] : url.split('/')[0];
        domain = domain.split(':')[0];
        return domain || url;
    };
}

if (!W.r_injectImage) {
    W.r_injectImage = function (url, callback, cacheBuster) {
        if (cacheBuster && cacheBuster === true) {
            url += '&_=' + new Date().getTime();
        }
        var img = new window.Image();
        if (typeof (callback) !== 'undefined') {
            img.onload = callback;
        }
        img.style.display = 'none';
        img.src = url;
    };
}

if (!W.r_injectScript) {
    W.r_injectScript = function (url, callback, cacheBuster) {
        if (cacheBuster && cacheBuster === true) {
            url += '&_=' + new Date().getTime();
        }
        if (W.jQuery) {
            $.getScript(url, callback);
        } else {
            var s = document.createElement('script');
            s.type = 'text/javascript';
            $(document).find('body').append(s);
            if (typeof (callback) !== 'undefined') {
                s.onload = callback;
            }
            s.src = url;
        }
    };
}

if (!W.r_injectIFrame) {
    W.r_injectIFrame = function (url, callback) {
        if (window.jQuery) {
            $('<iframe />', {
                src: url,
                width: 1,
                height: 1,
                frameborder: 0,
                style: 'display:none'
            }).appendTo('body');
        } else {
            var iframe = document.createElement('iframe');
            //  width="1" height="1" frameborder="0" style="display:none"
            $(document).find('body').append(iframe);
            if (typeof (callback) !== 'undefined') {
                s.onload = callback;
            }
            if (navigator.userAgent.indexOf("MSIE") === -1) {
                iframe.src = url;
            } else {
                iframe.location = url;
            }

        }
    };
}

if (!W.r_dtm_warn) {
    W.r_dtm_warn = function (text) {
        if (typeof (console) !== 'undefined') {
            console.warn(_globalMessagePrefix + text);
        } else {
            _satellite.notify(text, 2);
        }
        W[_globalObjectName].Logs.push({
            message: text,
            type: 'warn'
        });
    };
}

if (!W.r_dtm_error) {
    W.r_dtm_error = function (text) {
        if (typeof (console) !== 'undefined') {
            console.error(_globalMessagePrefix + text);
        } else {
            _satellite.notify(text, 3);
        }
        W[_globalObjectName].Logs.push({
            message: text,
            type: 'error'
        });
    };
}

if (!W.r_dtm_notify) {
    W.r_dtm_notify = function (text) {
        if (typeof (console) !== 'undefined') {
            console.log(_globalMessagePrefix + text);
        } else {
            _satellite.notify(text, 1);
        }
        W[_globalObjectName].Logs.push({
            message: text,
            type: 'info'
        });
    };
}

if (!W.r_poll) {
    W.r_poll = function (fn, callback, errback, timeout, interval) {
        var endTime = Number(new Date()) + (timeout || 2000);
        interval = interval || 100;

        (function p() {
            // If the condition is met, we're done! 
            if (fn()) {
                if (typeof (callback) !== 'undefined' && callback) {
                    callback();
                }
            }
            // If the condition isn't met but the timeout hasn't elapsed, go again
            else if (Number(new Date()) < endTime) {
                window.setTimeout(p, interval);
            }
            // Didn't match and too much time, reject!
            else {
                if (typeof (errback) !== 'undefined' && errback) {
                    errback(new Error('timed out for ' + fn + ': ' + arguments));
                }
            }
        })();
    };
}

if (!W.r_injectIFrameSafeMode) {
    W.r_injectIFrameSafeMode = function (url, callback) {
        W.r_poll(function () {
            if (document.readyState === 'complete') {
                W.r_injectIFrame(url, callback);
                return true;
            }
            return false;
        });
    };
}

if (!W.r_injectIFrameAsync) {
    W.r_injectIFrameAsync = function (url, callback) {
        var d = document;
        var iframe = d.body.appendChild(d.createElement('iframe')),
            doc = iframe.contentWindow.document;

        // style the iframe with some CSS
        iframe.style.cssText = "position:absolute;width:0px;height:0px;left:0px;display:none;";

        // now modify iframe content itself
        doc.open().write('<body onload="var d = document;d.getElementsByTagName(\'head\')[0].appendChild(d.createElement(\'script\')).src=\'' + url + '\'">');

        // prep for call back
        if (typeof (callback) !== 'undefined') {
            doc.onload = callback;
        }

        // load iframe
        doc.close();
    };
}

if (!W.r_isStagingMode) {
    W.r_isStagingMode = function () {
        if (localStorage) {
            return localStorage.getItem('sdsat_stagingLibrary') === 'true';
        }
        return false;
    };
}

if (!W.r_findDigitalDataEvent) {
    W.r_findDigitalDataEvent = function (eventAction) {
        // Pulls the last event from digitalData that matches the eventAction specified
        // it will do this in reverse with an assumption we are processing the last entry
        // if this doesn't work long term then we may need to flag these object as "processed" and exclude then in loop
        try {
            var eventList = window.s_getP('digitalData.event');
            if (eventList) {
                for (var i = eventList.length; i-- > 0;) {
                    if (eventList[i].eventInfo.eventAction === eventAction) {
                        return eventList[i];
                    }
                }
            }
        } catch (e) {
            W.r_dtm_error(e.message);
        }
        return null;
    };
}

if (!W.r_getByPath) {
    W.r_getByPath = function (obj, path, defaultValue) {
        if (typeof (obj) !== 'object') {
            return defaultValue;
        }

        for (var i = 0, path = path.split(/[\[\]\.]/), len = path.length; i < len; i++) {
            if (path[i] && obj) {
                obj = obj[path[i]];
            }
        }

        return (typeof (defaultValue) !== 'undefined' && !obj) ? defaultValue : obj;
    };
}

if (!W.r_validateDirectCallRule) {
    W.r_validateDirectCallRule = function (name, ticket, objectPaths, actionName, actionObjectPaths) {
        if (window.r_isStagingMode() === true) {

            var ticketPrefix = (ticket || 'NoTicketSpecified'),
                i = 0,
                hasError = false;

            window.r_dtm_notify(ticketPrefix + ': ' + name);

            // check that all these object paths exist
            if (objectPaths && typeof (objectPaths) === 'object') {
                for (i = 0; i < objectPaths.length; i++) {
                    if (!window.r_getByPath(window, objectPaths[i])) {
                        window.r_dtm_error(ticketPrefix + ': Not Defined: ' + objectPaths[i]);
                        hasError = true;
                    }
                }
            }

            // Check digitalData.events
            if (actionName) {
                var dlEvent = window.r_findDigitalDataEvent(actionName);
                if (!dlEvent || dlEvent === null) {
                    window.r_dtm_error(ticketPrefix + ': Event Not Found: ' + actionName);
                } else {
                    if (actionObjectPaths && typeof (actionObjectPaths) === 'object') {
                        for (i = 0; i < actionObjectPaths.length; i++) {
                            if (!window.r_getByPath(dlEvent, actionObjectPaths[i])) {
                                window.r_dtm_error(ticketPrefix + ': Missing Event Property: ' + actionObjectPaths[i]);
                                hasError = true;
                            }
                        }
                    }
                }
            }
        }
    };
}

if (!W.r_getRandomOrd) {
    W.r_getRandomOrd = function () {
        // Only used for floodlight pixels ord=, tend to be a common number
        // that is needed
        return (String(Math.random())) * 10000000000000;
    };
}

if (!W.r_removeSpecialChars) {
    W.r_removeSpecialChars = function (content, toLower) {
        /// Remove all special chars
        var results = window.decodeURIComponent(content).replace(/[`~!@#%^&*()_|+\=÷¿?;:'",<>\{\}\[\]\\\/]/gi, '');
        if (toLower && toLower === true && results) {
            results = results.toLowerCase();
        }
        return results;
    };
}

if (!W.r_createElement) {
    W.r_createElement = function (type, attributes, innerHTML) {
        // Create an element, very useful if needed before JQuery is loaded
        var el = document.createElement(type);
        if (attributes) {
            for (var k in attributes) {
                if (attributes.hasOwnProperty(k)) {
                    el.setAttribute(k, attributes[k]);
                }
            }
        }
        if (innerHTML) {
            el.innerHTML = innerHTML;
        }
        return el;
    };
}

/************************** RAWSOFT CUSTOM QA FUNCTIONS *************************/

if (_satellite.getQueryParamCaseInsensitive('adobe_debug')) {
    var debugMode = (_satellite.getQueryParamCaseInsensitive('adobe_debug').toLowerCase() === 'true' ? true : false);
    _satellite.setDebug(debugMode);
    window.r_dtm_notify('Debug Mode Enabled = ' + (debugMode ? 'Yes' : 'No'));
}

if (_satellite.getQueryParamCaseInsensitive('adobe_staging') && localStorage) {
    var stagingMode = (_satellite.getQueryParamCaseInsensitive('adobe_staging').toLowerCase() === 'true' ? true : false);
    localStorage.setItem('sdsat_stagingLibrary', stagingMode);
    window.r_dtm_notify('Staging Mode Enabled = ' + (stagingMode ? 'Yes' : 'No'));
}

