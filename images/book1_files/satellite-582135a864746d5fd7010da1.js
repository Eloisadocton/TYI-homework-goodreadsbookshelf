_satellite.pushBlockingScript(function(event, target, $variables){
  // Temporary fix for BN/Amplifi team bug that was introduced into some micro-sites
// We should remove this code after next deployment
// Date: May 11, 2016

if (typeof(BN_EXTERNAL_DOMAIN) !== 'undefined') {

    // create fake function until next deployment
    if (typeof(getAnalyticsEventCount) === 'undefined') {
        window.getAnalyticsEventCount = function() {
            return;
        };
    }

    // create fake function until next deployment
    if (typeof(updateAnalyticsPageName) === 'undefined') {
        window.updateAnalyticsPageName = function() {
            return;
        };
    }
}


// 12:03 AM May 12
// Another bug related to mobile that needs fixing tempoararily
if(document.location.href.indexOf('mobile') > 0){
  $('.homepage .footlight .arrow-link').css('height','60px');
  $('.featured-sub-item h2').css('height','38px');
  $('.homepage .row.full-width').css('max-height','296px');
}

});
