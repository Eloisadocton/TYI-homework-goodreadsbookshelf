_satellite.pushAsyncScript(function(event, target, $variables){
  if (_satellite.getVar('subCategory1') === 'home-gift') {
    // BUG: digitalData.product[0].category is incomplete
    window.r_injectImage('https://sp.analytics.yahoo.com/spp.pl?a=1000512917003&.yp=19978&js=no');
}

if (_satellite.getVar('subCategory1') === 'toys-games') {
    // BUG: digitalData.product[0].category is incomplete
    window.r_injectImage('https://sp.analytics.yahoo.com/spp.pl?a=1000512917003&.yp=19977&js=no');
}
});
