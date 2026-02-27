/* lab activity 6 w/ Airports.geojson */

// variables declared in global scope:
var map;
var minValue;

// fx to initiate Leaflet map
function createMap(){
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
    //get min value from array
    var minValue = Math.min(...allValues)
    return minValue;
}

// fx to calc radius of ea proportional symbol
function calcPropRadius(attValue) {
    // constant factor to adj symbol sizes evenly
    var minRadius = 3;
    // Flannery Appearance Compensation formula:
    var radius = 1.0083 * Math.pow(attValue/minValue,0.5715) * minRadius
    return radius;
};

// fx to convert markers to circle markers + pop-up info
function pointToLayer(feature, latlng, attributes){
    // attribute value to pull for symbols
    var attribute = attributes[0];
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
    // return circle marker to L.geoJson pointToLayer option
    return layer;
};

// fx to add point feature circle markers to map
function createPropSymbols(data, attributes){
    // make Leaflet GeoJSON layer + add to map
    L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
};

// fx to resize proportional symbols by current attribute value
function updatePropSymbols(attribute){
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){
            // local variable for current feature properties
            var props = layer.feature.properties;
            // update radius per new attribute values
            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);
            // update pop-up content
            var popupContent = "<p><b>Airport:</b> " + props.Airport + "</p><p><b>" + attribute + ":</b> " + props[attribute] + "</p>";           
            popup = layer.getPopup();            
            popup.setContent(popupContent).update();
        };
    });
};

// fx to store attribute data in an array for use in other fx
function processData(data){
    // empty array for attributes
    var attributes = [];
    // set properties -> 1st feature in index
    var properties = data.features[0].properties;
    // push ea attribute name into array if they have "20" (yearly data only)
    for (var attribute in properties){
        if (attribute.indexOf("20") > -1){
            attributes.push(attribute);
        };
    };
    return attributes;
};

// fx for slider to sequence data
function createSequenceControls(attributes){
    // create slider - insert into panel
    var slider = "<input class='range-slider' type='range'></input>";
    document.querySelector("#panel").insertAdjacentHTML('beforeend',slider);
    // set slider attributes
    document.querySelector(".range-slider").max = 6;
    document.querySelector(".range-slider").min = 0;
    document.querySelector(".range-slider").value = 0;
    document.querySelector(".range-slider").step = 1;
    // add buttons to slider
    document.querySelector('#panel').insertAdjacentHTML('beforeend','<button class="step" id="reverse">Reverse</button>');
    document.querySelector('#panel').insertAdjacentHTML('beforeend','<button class="step" id="forward">Forward</button>');
    // 3.8 make buttons an image **
    
    // internal fx to move slider <--> increment by button w/ circular looping
    var steps = document.querySelectorAll('.step');
    steps.forEach(function(step){
        step.addEventListener("click", function(){
            var index = document.querySelector('.range-slider').value;
            if (step.id == 'forward'){ // forward button goes forward; highest -> back to 0
                index++; 
                index = index > 6 ? 0 : index;
            } else if (step.id == 'reverse'){ // reverse button goes backwards; lowest <- up to 6
                index--;
                index = index < 0 ? 6 : index;
            };
            // update slider by current step
            document.querySelector('.range-slider').value = index;
            // call update symbol fx by attribute of current step index pos
            updatePropSymbols(attributes[index]);
        })
    })

    // internal fx for event listener to update proportional symbol by current slider pos value
    document.querySelector('.range-slider').addEventListener('input', function(){    
        var index = this.value;        
        updatePropSymbols(attributes[index]);
    });
};

// fx for importing GeoJSON data
function getData(){
    // load airport data
    fetch("data/Airports.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            var attributes = processData(json);
            minValue = calcMinValue(json);
            createPropSymbols(json, attributes); //call function to create proportional symbols
            createSequenceControls(attributes);
        })
};

// map map map! 
document.addEventListener('DOMContentLoaded',createMap)