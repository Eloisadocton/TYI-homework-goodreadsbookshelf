_satellite.pushBlockingScript(function(event, target, $variables){
  if (r_isStagingMode() === true) {

    var msg = 'Adobe Staging: ' + W[_globalObjectName].getReportingSuiteIDs();
    if (typeof (s) !== 'undefined') {
        msg = 'Adobe Staging: ' + s.version + ': ' + W[_globalObjectName].getReportingSuiteIDs();
    }
    
    var div = document.createElement('div');
    div.style = 'font-weight: bold;padding: 10px;color: #333;background-color: #FF0; position: fixed; z-index: 10;font-size: 14px;font-family:cursive;';
    div.innerHTML = msg;
    div.setAttribute('class', 'adobe_state');
    document.body.insertBefore(div, document.body.firstChild);
}

});
