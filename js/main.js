/* lab activity 6 w/ Airports.geojson */

// variables declared in global scope:
var map;
var minValue;

// fx to initiate Leaflet map
function createMap(){
    // create the map
    map = L.map('map', {
        center: [40, -100],
        zoom: 4
    });
    // add OSM base tilelayer
    L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles courtesy of the <a href="https://usgs.gov/">U.S. Geological Survey</a>'
    }).addTo(map);
    // call getData function to load the GeoJSON data
    getData(map);
};

// fx to pull min value for dataset
function calcMinValue(data){
    // empty array for all values
    var allValues = [];
    // loop through ea airport
    for(var airport of data.features){
        // for each, loop through ea year
        for(var year = 2000; year <= 2024; year+=4){
              // get value for current year and push to array
              var value = airport.properties[String(year)];
              allValues.push(value);
        }
    }
    //get minimum value of our array
    var minValue = Math.min(...allValues)
    return minValue;
}

// fx to calc radius of ea proportional symbol
function calcPropRadius(attValue) {
    //c onstant factor to adj symbol sizes evenly
    var minRadius = 2;
    // Flannery Appearance Compensation formula
    var radius = 1.0083 * Math.pow(attValue/minValue,0.5715) * minRadius

    return radius;
};

//
function pointToLayer(feature, latlng){
    // attribute value to pull for symbols
    var attribute = "2000";

    // marker options
    var geojsonMarkerOptions = {
        radius: 8,
        fillColor: "#0084ffd7",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.2
    };

    // for ea feature, set attribute value - circle marker radius based on attribute value
    var attValue = Number(feature.properties[attribute]);
    geojsonMarkerOptions.radius = calcPropRadius(attValue);

    // create circle marker layer
    var layer = L.circleMarker(latlng, geojsonMarkerOptions);

    // popup content text string
    var popupContent = "<p><b>Airport:</b> " + feature.properties.Airport + "</p><p><b>" + attribute + ":</b> " + feature.properties[attribute] + "</p>";
    // bind popup to the circle marker, offset by radius
    layer.bindPopup(popupContent, {
        offset: new L.Point(0,-geojsonMarkerOptions.radius) 
    });

    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
};

//Add circle markers for point features to the map
function createPropSymbols(data){
    // make Leaflet GeoJSON layer + add to map
    L.geoJson(data, {
        pointToLayer: pointToLayer
    }).addTo(map);
};

//importing GeoJSON data
function getData(){
    //load airport data
    fetch("data/Airports.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            //call function to create proportional symbols
            minValue = calcMinValue(json);
            createPropSymbols(json);
        })
};

document.addEventListener('DOMContentLoaded',createMap)