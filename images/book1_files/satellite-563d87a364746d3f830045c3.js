_satellite.pushAsyncScript(function(event, target, $variables){
  // ATG-3070
(function () {
    var sku = _satellite.getVar('sku');
    var ic = _satellite.getVar('internalCampaign');
    // are we looking at a product
    if (sku && ic) {
        // check length
        if (ic.length > 100) {
            window.r_dtm_error('ATG-3070: Internal Campaign - Length must be <= 100 bytes');
        }
    }
})();
});
