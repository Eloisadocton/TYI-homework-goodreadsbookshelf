_satellite.pushAsyncScript(function(event, target, $variables){
      var params = {
        cd: {
            content_name: _satellite.getVar('productName'),
            content_category: _satellite.getVar('productPrimaryCategory'),
            content_ids: _satellite.getVar('sku'),
            content_type: 'product',
            value: _satellite.getVar('productPrice'),
            currency: 'USD'
        },
        dl: document.location.href.toLowerCase(),
        rl: document.referrer.toLowerCase(),
        if: false,
        v: '2.0',
        ev: 'ViewContent',
        noscript: 1
    };
    // BN
    window.r_injectImage('https://www.facebook.com/tr?id=1473148549574128&' + decodeURIComponent($.param(params)), null, true);
    // NOOK
    window.r_injectImage('https://www.facebook.com/tr?id=881772185228696&' + decodeURIComponent($.param(params)), null, true);

});
