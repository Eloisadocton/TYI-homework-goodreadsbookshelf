/*
 * Function to check if the device is an apple mobile prdouct (ipad/iphone/ipod)
 * returns true if its compatible with apple product (ipad/iphone/ipod)and false if not
 */
function isBrowseriDeviceCompatible(){
	var mobileBrowser=["iphone","ipod","ipad"];
	var uagent = navigator.userAgent.toLowerCase();
	var length=mobileBrowser.length;
	for(i=0;i<length;i++){
		if (uagent.search(mobileBrowser[i]) > -1 && uagent.search('webkit') > -1){

			return true;

		}
	}

	return false;
}
function KitCloudAPIController() {
	this.parseQueryString= function(name) {
		name = name.replace(/[\[]/,"\\[").replace(/[\]]/,"\\]");
		var regex = new RegExp("[\?&|&amp;]"+name+"=([^&#]*)");
		var results = regex.exec(window.location.href);
		return results == null ? "" : results[1];
	}
	this.parseQueryStringWithDefault= function(name, defVal) {
		name = name.replace(/[\[]/,"\\[").replace(/[\]]/,"\\]");
		var regex = new RegExp("[\?&|&amp;]"+name+"=([^&#]*)");
		var results = regex.exec(window.location.href);
		return results == null ? defVal : results[1];
	}

	this.parseQueryStringArray= function(params) {
		try{
			for(i in params){
				name=params[i];
				name = name.replace(/[\[]/,"\\[").replace(/[\]]/,"\\]");
				var regex = new RegExp("[\?&|&amp;]"+name+"=([^&#]*)");
				var results = regex.exec(window.location.href);
				if(results!=null){
					return  results[1];
				}
			}
		}catch(err){
			return "";
			console.log(err);
		}
		return "";
	}
}

var KitCloudAPI = new KitCloudAPIController();

function addCustomScriptsforHTML5Live(playerURL, callback){
	    if(!playerURL){
	    	//to be changed
	    	playerURL="http://ovp.piksel.com";
	    }
	    var scriptArray = new Array(
	    	playerURL+'/jsapi/livePlayer.js',
	    	playerURL+'/jsapi/3/jquery.countdown.js'
	    );
	    if(AKAMAI_MEDIA_ANALYTICS_CONFIG_FILE_PATH && AKAMAI_MEDIA_ANALYTICS_CONFIG_FILE_PATH != ''){
			scriptArray.push(playerURL+'/jsapi/akamaihtml5-min.js');
		}

	    var loaded = 0, i;
        function scriptLoaded() {
            loaded++;
            if (loaded === scriptArray.length) {
                callback();
            }
        }
        function loadScript(url) {
            $.ajax({
                url: url,
                dataType: "script",
                success: scriptLoaded
            });
        }
        for (i = 0; i < scriptArray.length; i++) {
            loadScript(scriptArray[i]);
        }
}

function resizePlayer () {
	var embedDiv = document.getElementById("em_container");
	var iframe = document.getElementsByTagName("iframe")[0];
	var h = embedDiv.clientHeight + "px";
	var w = embedDiv.clientWidth + "px";

	if(h !== iframe.style.height || w !==  iframe.style.width){
		iframe.style.width = w;
		iframe.style.height = h;
	}
}