/**
 * HousingKlout
 * Copyright (c) 2011 Neil Mansilla
 * For license information see the README file
 */
   
            var map;
            // var kscoreAvg = 0;
            // var kmin = 10;
            var zoom = new ZoomController(4);
            function goPin(map1, pos, msg, msg2){
                var over = new TextOverlay(msg2, 9, 4, "#000000", "8pt", "courier");
                var icon = new Icon("img/num-2.png", 2, 35, 150, 36, over);
                map1.centerOnPosition(pos, function(pos){
                    if (pos) {
                        var pin = new Pin(pos, msg, '', icon);
                        EventRegistry.addListener(pin, "click", infoShow);
                        map1.addPin(pin);
                        // pin.setMessage(msg);
                        pin.showInfoWindow();
                        // console.log("pos = "+pos);
                    }
                    else {
                        console.log("nope");
                    }
                })
            }
            
            function infoShow(p){
                map.panToPosition(p.position);
                p.showInfoWindow();
            }
            
            function init(){
                // alert("init");
                map = new Map(document.getElementById("map"));
                JSRequest.setDynamicScriptTagMode();
                map.setShapeRendering("client");
                map.authenticate(CONFIG.clientName, CONFIG.clientPassword);
                map.addCopyrightMessage("&#169; 2009 deCarta, Inc. Map and Imagery data &#169; 2009 NAVTEQ or Tele Atlas or DigitalGlobe");
                var zoom = new ZoomController(8); // zoom 1-17
                map.addZoomController(zoom);
                map.addMapTypeController(new MapTypeController());
                map.addMapOverviewController(new MapOverviewController());
            }
            
            function HK(){
				
            	if (!$("#3TapsKey").val()) {
					alert("Paste in your 3Taps developer key. If you don't\nhave one head over to:\n\nhttp://register.3taps.com/member/register");
					$("#3TapsKey").select();
					$("#3TapsKey").focus();
					return false;
				}
			
				if (!$("#KloutKey").val()) {
					alert("Paste in your Klout developer key. If you don't\nhave one head over to\n\nhttp://developer.klout.com");
					$("#KloutKey").select();
					$("#KloutKey").focus();
					return false;
				}
				
				$("#map").show();
				
                // Clear all existing pins from the map
                map.removeAllPins();
                
                // These are the search settings for 3Taps
                var lowPrice = $('#lowPrice').val();
                var highPrice = $('#highPrice').val();
                
                // This is the minimum Klout score that a listing
                // can have.
                var kmin = $('#lowKlout').val();
                
                // This is the Twitter search radius for geo-based tweets
                // used on the geocode parameter.
                // More info here: http://dev.twitter.com/doc/get/search
                var radius = '0.75mi';
                
                // 3Taps - Instantiate 3Taps JS Client
                var client = new threeTapsClient($("#3TapsKey").val());
                
                // 3Taps - Initiate a rental home search on 3Taps with the parameters below.
                // Maximum results per page is set to 100 (rpp)
                // Category RHFR = rental estate home for rent
                // Location SFO = San Francisco
                // More information on the 3Taps search API here:
                // http://developers.3taps.net/methods/search
                
                var items = client.search.search({
                    price: lowPrice + '-' + highPrice,
                    category: 'RHFR',
                    location: 'SFO',
                    retvals: 'price,location,longitude,latitude,heading,annotations,timestamp,trustedAnnotations,externalURL',
                    rpp: '100'
                }, function(TapsResults){
                
					
                    // 3Taps - Iterate through each home for rent. 
                    $.each(TapsResults.results, function(TapsKey, TapsValue){
                        var pos = "";
                        var poss = "";
                        var lat = "";
                        var lon = "";
                        if (typeof TapsValue.annotations.original_map_google === 'string') {
                        
                            // On a Craigslist listing, if a Google Maps link exists,
                            // we pull out the "loc" parameter and pass it back through 
                            // the parseaddress function (jquery plugin that uses Google Maps
                            // http://maps.google.com/maps/geo API call.
                            
                            var temp = TapsValue.annotations.original_map_google.replace("http://maps.google.com/?q=loc%3A+", "");
                            $("#addy").val(temp);
                            $("#addy").parseaddress(function(cleanaddress){
                                lat = cleanaddress['lat'];
                                lon = cleanaddress['lon'];
                                pos = new Position(lat + " " + lon);
                                poss = lat + " " + lon;
                                // We have coordinates -- so pull down the tweets
                                pullTweet(TapsValue, kmin, lat, lon, radius, pos, poss);
                                
                            });
                        }
                        
                        else {
                        
                            pos = new Position(TapsValue.latitude + " " + TapsValue.longitude);
                            poss = TapsValue.latitude + " " + TapsValue.longitude;
                            lat = TapsValue.latitude;
                            lon = TapsValue.longitude;
                            
                            // We have coordinates (just using the lat/lon meta-data from 3Taps)
                            // so lets pull down the tweets
                            pullTweet(TapsValue, kmin, lat, lon, radius, pos, poss);
                        }
                    })
                });
                map.centerOnPosition(new Position("37.77493 -122.41942", function(){
                }));
            }
            
            // pullTweet is called whenever we have a 3Taps/Craigslist listing
            // with lat/lon coordinates. This uses the Twitter Search API
            // with the 'geocode' param (lat,lon,radius). 
            function pullTweet(value, kmin, lat, lon, radius, pos, poss){
                var twit = $.getJSON('http://search.twitter.com/search.json?geocode=' + lat + ',' + lon + ',' + radius + '&callback=?', function(dataTwit){
                    var twitUsers = new Array();
                    $.each(dataTwit.results, function(TwitKey, TwitVal){
                        if (jQuery.inArray(TwitVal.from_user, twitUsers) == -1) {
                            twitUsers.push(TwitVal.from_user);
                        }
                        
                        if (TwitVal.geo != null) {
                        
                            // DeCarta - plot a pink circle on the map.
                            if (TwitVal.geo.coordinates[0]) {
                                var nP = new Position(TwitVal.geo.coordinates[0] + " " + TwitVal.geo.coordinates[1]);
                                var circle = new DDSCircle();
                                circle.setPosition(nP);
                                circle.setRadius(new Radius(0.04, new UOM("KM")));
                                circle.setBorderColor("(255.0.255)");
                                circle.setBorderWidth("1");
                                circle.setFillColor("(255.0.255)");
                                map.addOverlay(circle);
                            }
                        }
                    });
                    
                    // Klout - Search for Klout score for all unique Twitter usernames that tweeted 
                    // based on the Twitter geo-lat/lon search.
                    if (twitUsers) {
                        var klout = $.getJSON('http://api.klout.com/1/klout.json?key=' + $("#KloutKey").val() + '&users=' + twitUsers.join() + '&callback=?', function(dataKlout){
                        
                            var kscoreSum = 0;
                            // For each user, add up their Klout score.
                            $.each(dataKlout.users, function(KloutKey, KloutVal){
                                kscoreSum += KloutVal.kscore;
                            })
                            
                            // Average out the Klout score for all users two tweeted at that geo-radius
                            var kscoreAvg = Math.round((kscoreSum / dataKlout.users.length) * 100) / 100;
                            if (kscoreAvg >= kmin) {
                            
                                // Add the msg/msg2 HTML spans below and pin them up on the DeCarta map.
                                // That is, if the average Klout score is high enough.
                                var msg = "<span class='pinMsg'><a href=\"" + value.externalURL + "\" target='_blank'>" + value.heading + "</a><br />Price: $" + value.price + "<br />House Klout Score: " + kscoreAvg + "</span>";
                                var msg2 = "<span class='pinMsg'>$" + value.price + " Klout " + kscoreAvg + "</span>";
                                goPin(map, pos, msg, msg2);
                            }
                        });
                    }
                    else {
                        console.log("No tweets here");
                    }
                });
            }
            
            // Series of DeCarta functions borrowed from their docs
            function bigger(){
                map.resize(500, 1220, function(p){
                    // map.removeAllPins();
                    map.addPin(new Pin(p));
                });
            }
            
            function toggleMapOverview(){
                var overview = map.getMapOverviewController();
                if (overview.mapVisible) {
                    overview.close();
                }
                else {
                    overview.open();
                }
            }
            
            function resizeMap(){
                // IE and mozilla resize differently, to avoid too much recursion I block the resize function
                if (Utilities.ie) {
                    if (!lock) 
                        setTimeout(resizeMapWithPause, 1000);
                    lock = true;
                }
                else {
                    var size = calculate();
                    map.resize(size[0], size[1])
                }
            }
            
            function resizeMapWithPause(){
                var size = calculate();
                map.resize(size[0], size[1]);
                lock = false;
            }
            
            function calculate(){
                var frameWidth, frameHeight;
                if (self.innerWidth) {
                    frameWidth = self.innerWidth;
                    frameHeight = self.innerHeight;
                }
                else 
                    if (document.documentElement && document.documentElement.clientWidth) {
                        frameWidth = document.documentElement.clientWidth;
                        frameHeight = document.documentElement.clientHeight;
                    }
                    else 
                        if (document.body) {
                            frameWidth = document.body.clientWidth;
                            frameHeight = document.body.clientHeight;
                        }
                // pad the border
                var padding = 15;
                // get the map div offsets from the top left corner
                var top = (Utilities.getAbsoluteTop(document.getElementById("map")));
                var left = (Utilities.getAbsoluteLeft(document.getElementById("map")));
                var totTop = frameHeight - top - padding;
                var totLeft = frameWidth - left - padding;
                // make sure x and y are even numbers
                if (totTop % 2 != 0) 
                    totTop++;
                if (totLeft % 2 != 0) 
                    totLeft++;
                return [totTop, totLeft]; // array x y
            }
        
