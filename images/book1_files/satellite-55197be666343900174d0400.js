_satellite.pushAsyncScript(function(event, target, $variables){
  // We will find the iframe and listen for a click event
// The Ad ID (evar65) is trickie and not sure if its meaningful to BN but its the requirement
// Will discuss on next meeting.
$('#relatedAd iframe').contents().find('#google-content-text-ad-1').click(function(){
  	s.products = '';
    s.events = 'event71';
  	s.eVar65 = _satellite.getVar('advertisingID');
    s.tl();
});
});
