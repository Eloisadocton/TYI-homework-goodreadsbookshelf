_satellite.pushAsyncScript(function(event, target, $variables){
  // ATG
window.r_injectScript('https://services.xg4ken.com/js/kenshoo.js', function () {
    kenshoo.match((_satellite.getVar('profileID') || ''));
});

// ATG-7634
var cat = (_satellite.getVar('subCategory1') || _satellite.getVar('productPrimaryCategory'));
window.r_injectImage('//match.xg4ken.com/fbpixel?domain=barnesandnoble.com&cat=' + cat + '&prod=' + _satellite.getVar('sku'));
});
