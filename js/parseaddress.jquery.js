   
$.fn.parseaddress = function(respondwith){  
 
    // this refers to the object that we attached the parseaddress() function to
    var address = this.val();  
    
    // create new google geocoding object
    var geocoder;
    geocoder = new GClientGeocoder();
    
    // call google's getLocations() function - it accepts two params:
    // 1st, an address to geocode, 2nd, a function to send the response to asynchronously 
    geocoder.getLocations(address, function(response) {
      
      // create an array to house the cleaned address data
      var cleanaddress = new Array();

      // create a variable to house the response code
      var responsecode = response.Status.code;
      
      // console.log(response);

      // create a nice new array of address data
      //cleanaddress['country'] = check_for_country(response);
      //cleanaddress['state'] = check_for_state(response);
      //cleanaddress['city'] = check_for_city(response);
      //cleanaddress['street'] = check_for_street(response);
      //cleanaddress['zip'] = check_for_zip(response);
      cleanaddress['lat'] = get_lat_lon(response,'lat');
      cleanaddress['lon'] = get_lat_lon(response,'lon');

      // call function to deliver back to document
      respondwith(cleanaddress);

    });

};

// some functions here to check the various key / value pairs in
// the multi-dimensional hash google returns with address data

function check_for_placemark(response) {
   if(typeof(response.Placemark) == "object") {
     return true;
   } else {
     return false;
   }
}

function check_for_country(response) {
   if(check_for_placemark(response) && response.Placemark[0].AddressDetails.Country.CountryName) {
     return response.Placemark[0].AddressDetails.Country.CountryName;
   } else {
     return false;
   }
}

function check_for_state(response) {
   if(check_for_placemark(response) && response.Placemark[0].AddressDetails.Country.AdministrativeArea != null) {
     return response.Placemark[0].AddressDetails.Country.AdministrativeArea.AdministrativeAreaName;
   } else {
     return false;
   }
}

function check_for_city(response) { 
   if(check_for_placemark(response) && typeof(response.Placemark[0].AddressDetails.Country.AdministrativeArea.Locality) == "object") {
      if(response.Placemark[0].AddressDetails.Country.AdministrativeArea.Locality.LocalityName) {
         return response.Placemark[0].AddressDetails.Country.AdministrativeArea.Locality.LocalityName;
      } else {
         return false;
      }
   } 
}

function check_for_street(response) {
   if(check_for_city(response) && typeof(response.Placemark[0].AddressDetails.Country.AdministrativeArea.Locality.Thoroughfare) == "object") {
     if(response.Placemark[0].AddressDetails.Country.AdministrativeArea.Locality.Thoroughfare.ThoroughfareName) {
        return response.Placemark[0].AddressDetails.Country.AdministrativeArea.Locality.Thoroughfare.ThoroughfareName;
     } else {
        return false;
     }      
  }
}

function check_for_zip(response) {
   if(check_for_city(response) && typeof(response.Placemark[0].AddressDetails.Country.AdministrativeArea.Locality.PostalCode) == "object") {
     if(response.Placemark[0].AddressDetails.Country.AdministrativeArea.Locality.PostalCode.PostalCodeNumber) {
        return response.Placemark[0].AddressDetails.Country.AdministrativeArea.Locality.PostalCode.PostalCodeNumber;
     } else {
        return false;
     }      
  }
}

function get_lat_lon(response,coord) {
   if(check_for_placemark(response)) {
     var points = new Array();
     points['lat'] = response.Placemark[0].Point.coordinates[1]
     points['lon'] = response.Placemark[0].Point.coordinates[0]
  
    if(coord == 'lat') {
      return points['lat'];
    } else if(coord == 'lon') {
      return points['lon'];
    } else {
      return points;
    }
  
  } else {
    return false;
  }
}