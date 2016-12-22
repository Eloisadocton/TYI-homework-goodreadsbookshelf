_satellite.pushAsyncScript(function(event, target, $variables){
  window.r_injectScript('//static.criteo.net/js/ld/ld.js', function () {
    window.criteo_q = window.criteo_q || [];
    var deviceType = /Mobile|iP(hone|od|ad)|Android|BlackBerry|IEMobile/.test(navigator.userAgent) ? "m" : "d";
    window.criteo_q.push({
        event: "setAccount",
        account: 2641
    }, {
        event: "setSiteType",
        type: deviceType
    }, {
        event: "setHashedEmail",
        email: [_satellite.getVar('userHashedEmail')]
    }, {
        event: "viewItem",
        item: _satellite.getVar('sku')
    });
});
});
