var allLayers = [];
var firstSymbolId;
const userLayers = ['hex5', 'hex10', 'admin1', 'admin2', 'hex1', 'ocean'];
var basemapLabels = [];
const styles = [
    {
        'title': "Satellite With Labels",
        'uri': "mapbox://styles/mapbox/satellite-streets-v11",
    },
    {
        'title': "Light",
        'uri': "mapbox://styles/mapbox/light-v10",
    },
    {
        'title': "Satellite Imagery",
        'uri': "mapbox://styles/mapbox/satellite-v9",
    },
];

addButtons();


/*Initialize Map */
mapboxgl.accessToken =    "pk.eyJ1Ijoic2ViYXN0aWFuLWNoIiwiYSI6ImNpejkxdzZ5YzAxa2gyd21udGpmaGU0dTgifQ.IrEd_tvrl6MuypVNUGU5SQ";

const map = new mapboxgl.Map({
    container: "map", // container ID
    //style: 'mapbox://styles/mapbox/light-v10?optimize=true', //?optimize=true
    style: 'mapbox://styles/mapbox/satellite-streets-v11',
    center: [-61.2, 10.4], // starting position [lng, lat]
    zoom: 9,
    preserveDrawingBuffer: true
    //maxZoom: ,
    //minZoom: 
    //pitch: 55
});

var yearList = [];
var currentTimeLayer;

var sourceData = {
    hex5Source: {
        name: 'hex5',
        layer: 'hex5_3857',
        mainId: 'hexid',
        data: null
    },
    hex10Source: {
        name: 'hex10',
        layer: 'hex10km',
        mainId: 'hexid',
        data: null
    },
    admin1Source: {
        name: 'admin1',
        mainId: 'GID_1',
        layer: 'admin1extra',
        data: null
    },
    admin2Source: {
        name: 'admin2',
        mainId: 'GID_2',
        layer: 'admin2',
        data: null
    },
    hex1Source: {
        name: 'hex1',
        layer: 'hex1',
        mainId: 'hexid',
        data: null
    },
    oceanSource: {
        name: 'ocean',
        layer: 'oceans',
        mainId: null,
        data: null
    }

}

var currentGeojsonLayers = {
    color: null,
    breaks: null,
    dataLayer: null,
    hexSize: 'hex5'
};
var legendControl;

map.on("load", function () {

    var layers = map.getStyle().layers;
    //console.log(layers);
    // Find the index of the first symbol layer in the map style
    for (var i = 0; i < layers.length; i++) {
        if (layers[i].type === 'symbol') {
            firstSymbolId = layers[i].id;
            break;
        }
    }

    map.removeLayer('admin-1-boundary')
    map.removeLayer('road-label')
    map.removeLayer('road-number-shield')
    map.removeLayer('road-exit-shield')
    map.removeLayer("admin-1-boundary-bg")
    map.removeLayer('airport-label')
    var layers = map.getStyle().layers;
    //console.log(layers);

    for (var x in layers) {

        if (layers[x].type === 'symbol' || layers[x].type === 'line') {
            basemapLabels.push(layers[x]);
        }
    }

    //console.log(layers);

    map.addControl(new mapboxgl.ScaleControl(), 'bottom-right');
    //$('.loader-gis').remove()
    //$('.download').show()
    addHexSource()
    //addTileSources()
    //justAdmin()

});


//function taken from mapbox that extracts unique features, see comment below
function getUniqueFeatures(array, comparatorProperty) {
    var existingFeatureKeys = {};
    // Because features come from tiled vector data, feature geometries may be split
    // or duplicated across tile boundaries and, as a result, features may appear
    // multiple times in query results.
    var uniqueFeatures = array.filter(function (el) {
        if (existingFeatureKeys[el.properties[comparatorProperty]]) {
            return false;
        } else {
            existingFeatureKeys[el.properties[comparatorProperty]] = true;
            return true;
        }
    });

    return uniqueFeatures;
}


function addLabels() {


    console.log($('#addLabels')[0].innerText)
    if ($('#addLabels')[0].innerText === 'Add Labels') {
        basemapLabels.forEach(function (x) {
            //console.log(x);
            map.addLayer(x);
        })
        //$('#addLabels').toggle();
        $('#addLabels')[0].innerText = 'Remove Labels'
    } else {
        basemapLabels.forEach(function (x) {
            map.removeLayer(x.id);
        })

        $('#addLabels')[0].innerText = 'Add Labels'
    }


}

function recolorBasedOnWhatsOnPage() {


    var features = map.queryRenderedFeatures({
        layers: [currentGeojsonLayers.hexSize]
    })

    //console.log(currentGeojsonLayers.hexSize);
    if (features) {

        var uniFeatures;
        if (currentGeojsonLayers.hexSize === 'admin1') {
            uniFeatures = getUniqueFeatures(features, 'GID_1');
        } else if (currentGeojsonLayers.hexSize === 'admin2') {
            uniFeatures = getUniqueFeatures(features, 'GID_2');
        } else {
            uniFeatures = getUniqueFeatures(features, 'hexid');
        }


        //console.log(uniFeatures.features);
        var selecteData = features.map(x => x.properties[currentGeojsonLayers.dataLayer])
        //console.log(selecteData);
        var breaks = chroma.limits(selecteData, 'q', 4);
        
        console.log(breaks);
        var breaks_new = [];
        var precision = 1;
        do {
            precision++;
            for (let i = 0; i < 5; i++) {
                breaks_new[i] = parseFloat(breaks[i].toPrecision(precision));                    
            }
            console.log(breaks_new);
        }    
        while (checkForDuplicates(breaks_new)&&(precision<10));
        breaks = breaks_new;          
        
        
        currentGeojsonLayers.breaks = breaks;
        //console.log(breaks)
        map.setPaintProperty(currentGeojsonLayers.hexSize, 'fill-color',
        [
          'interpolate',
          ['linear'],
          ['get', currentGeojsonLayers.dataLayer],
          breaks[0], currentGeojsonLayers.color[0],
          breaks[1], currentGeojsonLayers.color[1],
          breaks[2], currentGeojsonLayers.color[2],
          breaks[3], currentGeojsonLayers.color[3],
          breaks[4], currentGeojsonLayers.color[4],
          ]
        )

        //map.setPaintProperty(currentGeojsonLayers.hexSize, 'fill-opacity', 0.7)

        //addLegend(currentGeojsonLayers.color, breaks, currentGeojsonLayers.dataLayer)
        if (isNaN(breaks[3]) || breaks[1] == 0) {

            map.setPaintProperty(currentGeojsonLayers.hexSize, 'fill-opacity', 0.0)
            setTimeout(() => {
                map.setFilter(currentGeojsonLayers.hexSize, null)
            }, 1000);
            addNoDataLegend();
        } else {
            map.setFilter(currentGeojsonLayers.hexSize, ['>=', currentGeojsonLayers.dataLayer, 0])
            addLegend(currentGeojsonLayers.color, breaks, precision, currentGeojsonLayers.dataLayer)
            setTimeout(() => {
                map.setPaintProperty(currentGeojsonLayers.hexSize, 'fill-opacity', 0.8)
            }, 400);
        }
    }


}

//const baseMapSwitcher = document.getElementById('basemap-switch');

$('#basemap-switch').on('change', function () {

    var selectedBase = $(this)[0].value;
    //var sel = $(this).innerText;
    var currentBase = map.getStyle().name;

    console.log(selectedBase);
    console.log(currentBase);

    console.log(map.getStyle().sources)

    if (selectedBase === 'Mapbox Light') {
        console.log(basemapLabels);
        basemapLabels = [];
        var thisStyle = _.find(styles, function (o) {
            return o.title === 'Light'
        })
        map.setStyle(thisStyle.uri)

        /*} else if (selectedBase === 'Satellite With Labels') {
          var thisStyle = _.find(styles, function(o){return o.title === 'Light'})
          map.setStyle(thisStyle.uri)
        } */

        map.once('idle', function () {
            var layers = map.getStyle().layers;

            for (var i = 0; i < layers.length; i++) {
                if (layers[i].type === 'symbol') {
                    firstSymbolId = layers[i].id;
                    break;
                }
            }
            for (var x in layers) {

                if (layers[x].type === 'symbol' || layers[x].type === 'line') {
                    basemapLabels.push(layers[x]);
                }
            }

            addHexSource();
            //console.log(map.getStyle().layers);
            var current = _.find(sourceData, function (o) {
                return o.name === currentGeojsonLayers.hexSize
            })

            map.addLayer({

                'id': currentGeojsonLayers.hexSize,
                'type': 'fill',
                'source': currentGeojsonLayers.hexSize,
                'source-layer': current.layer,
                'layout': {
                    'visibility': 'visible'
                },
                'paint': {
                    'fill-color': [
              'interpolate',
              ['linear'],
              ['get', currentGeojsonLayers.dataLayer],
              currentGeojsonLayers.breaks[0], currentGeojsonLayers.color[0],
              currentGeojsonLayers.breaks[1], currentGeojsonLayers.color[1],
              currentGeojsonLayers.breaks[2], currentGeojsonLayers.color[2],
              currentGeojsonLayers.breaks[3], currentGeojsonLayers.color[3],
              currentGeojsonLayers.breaks[4], currentGeojsonLayers.color[4],
              ]
                }
            }, firstSymbolId)

            map.setFilter(currentGeojsonLayers.hexSize, ['>=', currentGeojsonLayers.dataLayer, 0])

        })
        //addHexSource();

        console.log(map.getStyle().sources)

    }






})

/* baseMapSwitcher.addEventListener('click', (event) => {

    const isOption = event.target.nodeName === "OPTION";
    if (!isOption) {
      return;
    }
      console.log(event);
    //console.log(event.target.value)
    //console.log(styles)
    var thisStyle = _.find(styles, function(o){return o.title === event.target.value})
    map.setStyle(thisStyle.uri)
    //map.removeLayer('admin-1-boundary')
    
    
    //console.log(map.getStyle().sources)

    map.once('idle', function(e) {

        var layers = map.getStyle().layers;
    // Find the index of the first symbol layer in the map style
            for (var i = 0; i < layers.length; i++) {
            if (layers[i].type === 'symbol') {
            firstSymbolId = layers[i].id;
            break;
            }
            }
        if(thisStyle.title === 'Satellite Imagery') {
          var last = layers.length -1;
          console.log(layers)
          console.log(last);
          console.log(layers[last]);
          firstSymbolId = layers[last].id;
        }

        if (map.getLayer('admin-1-boundary')) {
          map.removeLayer('admin-1-boundary')
        }


        console.log(firstSymbolId)

        for (var x in sourceData) {
            //console.log(sourceData[x].name)
    
            if(sourceData[x].name === 'hex5' || sourceData[x].name === 'hex1') {

                map.addSource(sourceData[x].name, {
                    'type': 'vector',
                    'promoteId': 'hexid',
                    'tiles': [
                      //otherhex
                      sourceData[x].data
                    ],
                    'minzoom': 6,
                    'maxzoom': 10
                  })
                console.log(sourceData[x].name + ';;')
    
            } else if(sourceData[x].name === 'hex10') {
              map.addSource('hex10', {
                'type': 'vector',
                //type: "geojson",
                //data: geobuf.decode(new Pbf(allData[0])),
                url: sourceData[x].data,
                promoteId: 'hexid'
              }) 
              
            } else {
                map.addSource(sourceData[x].name, {
                    type: 'geojson',
                    data: geobuf.decode(new Pbf(sourceData[x].data)),
                  })
            }
          }


          if(currentGeojsonLayers.hexSize === 'hex5') {

            map.addLayer({
              'id': currentGeojsonLayers.hexSize,
              'type': 'fill', 
              'source': currentGeojsonLayers.hexSize,
              'source-layer': 'hex5_3857',
              'paint': {
                'fill-color': 'blue',
                'fill-opacity': 0,
              }
              
              }, firstSymbolId);

          } else {
            map.addLayer({
              'id': currentGeojsonLayers.hexSize,
              'type': 'fill', 
              'source': currentGeojsonLayers.hexSize,
              'paint': {
                    'fill-color': 'blue',
                    'fill-opacity': 0,
                  
                  }
              }, firstSymbolId);

          }
        map.setFilter(currentGeojsonLayers.hexSize,['>=',currentGeojsonLayers.dataLayer, 0])

        if(thisStyle.title === 'Satellite Imagery') {
          map.moveLayer(currentGeojsonLayers.hexSize)
        }

        map.once('idle', function(e) {
         
          recolorBasedOnWhatsOnPage();
          console.log('change bins');
          //map.setPaintProperty(currentGeojsonLayers.hexSize, 'fill-opacity', 0.7)
        
        })
 
    })

    console.log(currentGeojsonLayers);

  }) */


const button3dWrapper = document.getElementById('icon3d')

button3dWrapper.addEventListener('click', (event) => {

    var id3d = currentGeojsonLayers.hexSize + '-3d'

    if (map.getLayer(id3d)) {
        //console.log('yooo')
        map.removeLayer(id3d);
        //map.setBearing(70)
        map.easeTo({
            center: map.getCenter(),
            pitch: 0,

        })
    } else {


        //rotateCamera(0)

        console.log(currentGeojsonLayers);
        var current = _.find(sourceData, function (o) {
            return o.name === currentGeojsonLayers.hexSize
        })

        map.addLayer({
            'id': id3d,
            'type': 'fill-extrusion',
            'source': currentGeojsonLayers.hexSize,
            //'source-layer': 'hex5_3857',
            'source-layer': current.layer,
            'layout': {
                'visibility': 'visible'
            },

            'paint': {
                'fill-extrusion-color': [
            'interpolate',
            ['linear'],
            ['get', currentGeojsonLayers.dataLayer],
            currentGeojsonLayers.breaks[0], currentGeojsonLayers.color[0],
            currentGeojsonLayers.breaks[1], currentGeojsonLayers.color[1],
            currentGeojsonLayers.breaks[2], currentGeojsonLayers.color[2],
            currentGeojsonLayers.breaks[3], currentGeojsonLayers.color[3],
            currentGeojsonLayers.breaks[4], currentGeojsonLayers.color[4],
            ],
                'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['get', currentGeojsonLayers.dataLayer],
              currentGeojsonLayers.breaks[0], 0,
              currentGeojsonLayers.breaks[1], 500,
              currentGeojsonLayers.breaks[2], 5000,
              currentGeojsonLayers.breaks[3], 11000,
              currentGeojsonLayers.breaks[4], 50000,
              ],

                //'fill-opacity': 0.8,

            }
        }, firstSymbolId);

        map.setFilter(id3d, ['>=', currentGeojsonLayers.dataLayer, 0])
        map.easeTo({
            center: map.getCenter(),
            pitch: 55

        })
    }
})


$("#country-select").change(function (event) {

    //console.log(this.children(":selected"));
    //var val = $(this).val();
    var val = $('#country-select option:selected').attr('id');

    console.log($(this).val());
    console.log(map.getZoom())
    //console.log(val.substr(0, val.indexOf('&')));
    //console.log(event.target);
    /*const isOption = event.target.nodeName === "OPTION";
    if (!isOption) {
      return;
    } */

    //console.log(event.target.id);

    map.setPaintProperty(currentGeojsonLayers.hexSize, 'fill-opacity', 0)
    //var currbb = _.find(names, ['GID_0', event.target.id ])
    var currbb = _.find(names, ['GID_0', val])
    //console.log(currbb);

    //sourceData.allSidsSource.lastName = currbb.NAME_0;

    var v2 = new mapboxgl.LngLatBounds([currbb.bb[0], currbb.bb[1]])
    map.fitBounds(v2, {
        linear: true,
        padding: {
            top: 10,
            bottom: 25,
            left: 15,
            right: 5
        },
        pitch: 0
    });

    if (currentGeojsonLayers.hexSize === 'hex1') {
        $('.loader-gis').show()
    }

    map.once('idle', function (e) {

        if (!map.getLayer('ocean')) {
            recolorBasedOnWhatsOnPage();
            $('.loader-gis').hide()
        }

        console.log('county select');
        //map.setPaintProperty(currentGeojsonLayers.hexSize, 'fill-opacity', 0.7)

    })
})


map.on('dragend', function (e) {
    console.log(map.getZoom())
    console.log('dragend');


    if (!(map.getLayer('ocean') || map.getLayer('hex1') || map.getZoom() > 9)) {
        console.log('recolor');
        recolorBasedOnWhatsOnPage();
    }





    /*map.once('idle', function() {
      console.log('moveend');
      recolorBasedOnWhatsOnPage();
    }) */

})

map.on('zoomend', function (e) {

    console.log(map.getZoom());
    //recolorBasedOnWhatsOnPage();



})

map.on('zoom', function (e) {


    if (map.getZoom() < 5) {

        //console.log('hi')
        $('.hexbin-change option[value="hex1"]').prop('disabled', true);
    }


    if (map.getZoom() >= 5) {

        $('.hexbin-change option[value="hex1"]').prop('disabled', false);

    }


})

addTheOnClick()

map.on('click', function (e) {

    if (map.getSource('highlightS')) {
        map.removeLayer('highlight')
        map.removeSource('highlightS')
    }

})

function addTheOnClick() {
    var currentLayer;
    //var textInfo;
    if (map.getLayer('ocean')) {
        currentLayer = 'ocean';
    } else {
        currentLayer = currentGeojsonLayers.hexSize

    }



    map.on('click', currentLayer, function (e) {

        var popup = new mapboxgl.Popup({
            closeButton: true,
            closeOnClick: true
        });

        console.log(document.getElementById("infoBoxTitle").textContent)

        //console.log(currentGeojsonLayers.dataLayer);
        //console.log(e.features[0].properties)
        if (currentLayer === 'ocean') {

            var text = '<h4><b>' + document.getElementById("infoBoxTitle").textContent + '</b><br>' + e.features[0].properties['depth'].toLocaleString() + ' ' + document.getElementById("legendTitle").textContent + '</h4>'
            console.log(e.features[0].properties['depth'].toLocaleString());
        } else {

            //var coords = e.features[0].geometry.coordinates.slice();
            //console.log(e.features[0].geometry)
            var text = '<h4><b>' + document.getElementById("infoBoxTitle").textContent + '</b><br>' + e.features[0].properties[currentGeojsonLayers.dataLayer].toLocaleString() + ' ' + document.getElementById("legendTitle").textContent + '</h4>'
        }

        popup.setLngLat(e.lngLat).setHTML(text).addTo(map);
    })

}

function addAdminClick() {

    map.on('click', currentGeojsonLayers.hexSize, function (e) {

        console.log(e.features[0].properties.GID_1);
        //console.log(e.features[0].geometry);

        /*var feats = map.queryRenderedFeatures({
          layers: ['admin1'],
          filter: ['==', 'GID_1', e.features[0].id]
          
        }) */

        var rendered = map.queryRenderedFeatures({
            layers: ['admin1']
        })

        var feats = map.querySourceFeatures('admin1', {
            sourceLayer: ['admin1extra'],
            filter: ['==', 'GID_1', e.features[0].id]

        })

        //console.log(feats);
        var countries = []
        rendered.map(function (x) {
            countries.push(x.properties.NAME_0)
        })

        //console.log(_.uniq(countries));




        if (map.getSource('highlightS')) {
            map.removeLayer('highlight')
            map.removeSource('highlightS')
        }

        if (map.getSource('joined')) {
            map.removeLayer('joined')
            map.removeSource('joined')
        }

        map.addSource('highlightS', {
            type: 'geojson',
            data: {
                'type': 'FeatureCollection',
                'features': []
            }
        })

        map.addLayer({
            'id': 'highlight',
            'source': 'highlightS',
            'type': 'line',
            'paint': {
                'line-color': 'orange',
                'line-width': 3
            }
        })

        if (feats.length > 1) {

            for (var x in feats) {
                console.log(feats[x]);
                if (feats[x].geometry.type === 'MultiPolygon') {
                    feats[x].geometry.type = 'Polygon';
                    feats[x].geometry.coordinates = feats[x]._geometry.coordinates[0]
                }
            }
            var fc = turf.featureCollection(feats)
            //console.log(fc);
            var joined = turf.dissolve(fc);
            //var joined = turf.union(...fc);
            //console.log(joined);
            //map.getSource('highlightS').setData(joined)
            var allGeos = []

            map.addSource('joined', {
                type: 'geojson',
                data: {
                    'type': 'FeatureCollection',
                    'features': []
                }
            })


            map.addLayer({
                'id': 'joined',
                'source': 'joined',
                'type': 'line',
                'paint': {
                    'line-color': 'purple',
                    'line-width': 3
                }
            })

            map.getSource('joined').setData(joined)

            /*for (var x in feats) {

        allGeos.push(feats[x].geometry);
        console.log(x);
        console.log(feats[x].geometry)

        map.addSource(x, {
          type: 'geojson',
          data: {
            'type': 'FeatureCollection',
            'features': []
          }
        })

        
    
        map.addLayer({
          'id': x,
          'source': x,
          'type': 'line',
          'paint': {
            'line-color': 'orange',
            'line-width': 3
          }
        })

        map.getSource(x).setData(feats[x].geometry)



      } */

        } else {
            map.getSource('highlightS').setData(feats[0])
        }






        //console.log(e);


        //map.getSource('highlightS').setData(joinedall)

        /* var popup = new mapboxgl.Popup({
           closeButton: true,
           closeOnClick: true
           });
         //console.log(document.getElementById("infoBoxTitle").textContent)

         //console.log(currentGeojsonLayers.dataLayer);
         //console.log(e.features[0].properties)

         //var coords = e.features[0].geometry.coordinates.slice();
         //console.log(e.features[0].geometry)
         var text = '<h4><b>Country: </b>' + e.features[0].properties.NAME_0 + '</h4><h4><b>Region: </b>' + e.features[0].properties.NAME_1 + ' ' + e.features[0].properties.TYPE_1  + '</h4><b>' + document.getElementById("infoBoxTitle").textContent + '</b>: ' + e.features[0].properties[currentGeojsonLayers.dataLayer].toLocaleString() + ' ' + document.getElementById("legendTitle").textContent
         popup.setLngLat(e.lngLat).setHTML(text).addTo(map); */
    })

}


function checkForDuplicates(array) {
  let valuesAlreadySeen = []

  for (let i = 0; i < array.length; i++) {
    let value = array[i]
    if (valuesAlreadySeen.indexOf(value) !== -1) {
      return true
    }
    valuesAlreadySeen.push(value)
  }
  return false
}

function changeHexagonSize(sel) {

    //console.log(map.getStyle())
    if (map.getLayer('ocean')) {
        $('.hexsize').toggle()
        map.removeLayer('ocean');
    }

    remove3d()
    currentGeojsonLayers.hexSize = sel
    console.log(sel);

    //var slayer;

    for (var x in userLayers) {
        if (map.getLayer(userLayers[x])) {
            map.removeLayer(userLayers[x])
        }
    }



    var current = _.find(sourceData, function (o) {
        return o.name === currentGeojsonLayers.hexSize
    })
    console.log(current);
    map.addLayer({
        'id': sel,
        'type': 'fill',
        'source': sel,
        'source-layer': current.layer,
        'layout': {
            'visibility': 'visible'
        },
        'paint': {
            'fill-color': 'blue',
            'fill-opacity': 0,

        }
    }, firstSymbolId);



    if (sel === 'hex1') {
        $('.loader-gis').show()

        map.once('idle', function (e) {
            $('.loader-gis').hide()
        })

    }

    if (map.getStyle().name === 'Mapbox Satellite') {
        map.moveLayer(sel);
    }



    map.once('idle', function (e) {
        console.log('idle after hex change')
        recolorBasedOnWhatsOnPage();

        console.log('change bins');
        //map.setPaintProperty(currentGeojsonLayers.hexSize, 'fill-opacity', 0.7)

    })



    if (sel === 'admin1') {
        addAdminClick()
    } else {
        addTheOnClick();
    }

}


function remove3d() {

    var lay = map.getStyle().layers;
    //console.log(lay);
    var threedee = _.find(lay, function (o) {
        return o.type === 'fill-extrusion'
    });
    if (threedee) {
        map.removeLayer(threedee.id);
        map.easeTo({
            center: map.getCenter(),
            pitch: 0

        })
    }

}

/*map.on('moveend', function(){
  console.log(map.getZoom())
})*/

function addToLayersDrop(layers) {

    $('#layer-id').show()

    console.log(layers);
    //console.log()
    //console.log(yearList)
    var layersHolder = document.getElementById('layer-drop');
    var length = layersHolder.options.length;


    for (var i = length - 1; i >= 0; i--) {
        layersHolder.options[i] = null;
    }
    /*var firstBtn = document.createElement('option')
    firstBtn.innerHTML = 'Select Layer';
    layersHolder.appendChild(firstBtn); */

    for (var x in layers) {
        //console.log(layers[x])
        var btn = document.createElement('option')
        btn.innerHTML = layers[x].desc + ' ' + layers[x].time;
        btn.setAttribute('id', layers[x].field_name)
        btn.setAttribute('value', 'hi')
        layersHolder.appendChild(btn);
    }
    //console.log(layers.map(x => x.time));
    yearList = layers.map(x => x.time)
    //console.log(layers);
    //updateTime(layers)
    if (layers[0].title === 'Ocean Data') {
        addOcean(layers[0].field_name)
    } else {
        changeDataOnMap(layers[0].field_name)
    }

    //$('#' + layers[0].field_name).prop('selected', true);
}

function addOcean(layer) {

    $('.hexsize').toggle()

    const userLayers = ['hex5', 'hex10', 'admin1', 'admin2', 'hex1'];

    for (var x in userLayers) {
        if (map.getLayer(userLayers[x])) {
            // map.setPaintProperty(userLayers[x], 'fill-opacity', 0)
            map.removeLayer(userLayers[x])
        }

    }

    currentGeojsonLayers.breaks = [-4841, -3805, -2608, -1090, 0];
    currentGeojsonLayers.color = ['#08519c', '#3182bd', '#6baed6', '#bdd7e7', '#eff3ff']

    map.addLayer({
        'id': 'ocean',
        'type': 'fill',
        'source': 'ocean',
        'source-layer': 'oceans',
        'layout': {
            'visibility': 'visible'
        },
        'filter': ['<', 'depth', 0],
        'paint': {
            'fill-color': [
            'interpolate',
            ['linear'],
            ['get', 'depth'],
            -4841, '#08519c',
            -3805, '#3182bd',
            -2608, '#6baed6',
            -1090, '#bdd7e7',
            1322, '#eff3ff',
          ],
            'fill-opacity': 0.8,
        }
    }, firstSymbolId)


    addLegend(currentGeojsonLayers.color, currentGeojsonLayers.breaks, 2, layer)
    //addTheOnClick()

}

function changeDataOnMap(selection) {

    if (map.getLayer('ocean')) {
        $('.hexsize').toggle()
        map.removeLayer('ocean');
    }
    remove3d()

    //console.log(map.getStyle().layers)
    //console.log(selection);
    currentGeojsonLayers.dataLayer = selection;
    console.log(currentGeojsonLayers)



    /*if(map.getLayoutProperty(currentGeojsonLayers.hexSize, 'visibility', 'none')) {
      map.setLayoutProperty(currentGeojsonLayers.hexSize,'visibility','visible')
    } */
    /*if(!map.getLayer(currentGeojsonLayers.hexSize)) {

      //_.find(styles, function(o){return o.title === event.target.value})
      var current = _.find(sourceData, function(o) { return o.name === currentGeojsonLayers.hexSize})
      
      //console.log(_.find(sourceData, function(o) { return o.name === currentGeojsonLayers.hexSize}))
      //console.log(current.name);
      //console.log(current);

      map.addLayer({
        'id': currentGeojsonLayers.hexSize,
        'type': 'fill', 
        'source': currentGeojsonLayers.hexSize,
        'source-layer': current.layer,
        'layout': {
          'visibility': 'visible'
          },
        'paint': {
            'fill-color': 'blue',
            'fill-opacity': 0.8,
                     
            }
        }, firstSymbolId);

      
    } */
    if (!map.getLayer(currentGeojsonLayers.hexSize)) {

        var current = _.find(sourceData, function (o) {
            return o.name === currentGeojsonLayers.hexSize
        })

        console.log(firstSymbolId);

        map.addLayer({
            'id': currentGeojsonLayers.hexSize,
            'type': 'fill',
            'source': currentGeojsonLayers.hexSize,
            'source-layer': current.layer,
            'layout': {
                'visibility': 'visible'
            },
            'paint': {
                'fill-color': 'blue',
                'fill-opacity': 0.0,

            }
        });

        if (firstSymbolId) {
            map.moveLayer(currentGeojsonLayers.hexSize, firstSymbolId);
        }


    }
    setTimeout(() => {
        var features = map.queryRenderedFeatures({
            layers: [currentGeojsonLayers.hexSize]
        })

        if (features) {

            var uniFeatures;
            if (currentGeojsonLayers.hexSize === 'admin1') {
                uniFeatures = getUniqueFeatures(features, 'GID_1');

            } else if (currentGeojsonLayers.hexSize === 'admin2') {
                uniFeatures = getUniqueFeatures(features, 'GID_2');
            } else {
                uniFeatures = getUniqueFeatures(features, 'hexid');
            }


            //console.log(uniFeatures);
            var selecteData = uniFeatures.map(x => x.properties[selection])
            //console.log(selecteData);
            var max = Math.max(...selecteData)
            var min = Math.min(...selecteData)


            //var colorz = chroma.scale(['lightyellow', 'navy']).domain([min, max], 5, 'quantiles');
            var breaks = chroma.limits(selecteData, 'q', 4);
            
            console.log(breaks);
            var breaks_new = [];
            var precision = 1;
            do {
                precision++;
                for (let i = 0; i < 5; i++) {
                    breaks_new[i] = parseFloat(breaks[i].toPrecision(precision));                    
                }
                console.log(breaks_new);
            }    
            while (checkForDuplicates(breaks_new)&&(precision<10));
            breaks = breaks_new;              
            


            var colorRamp = chroma.scale(['#fafa6e', '#2A4858']).mode('lch').colors(5) // yellow to dark-blue
            var colorRamp1 = ['#edf8fb', '#b2e2e2', '#66c2a4', '#2ca25f', '#006d2c'] // light to dark green
            var colorRamp2 = ['#f2f0f7', '#cbc9e2', '#9e9ac8', '#756bb1', '#54278f'] // light to dark purple
            var colorRamp4 = ['#ffffd4', '#fed98e', '#fe9929', '#d95f0e', '#993404'] // light to dark orange
            var gdpColor = ['#ca0020', '#f4a582', '#f7f7f7', '#92c5de', '#0571b0'] // red to white to blue (diverging)
            var pop = ['#feebe2', '#fbb4b9', '#f768a1', '#c51b8a', '#7a0177'] // light to dark pink
            var sunIndex = ['#fdfbf6', '#FAE7B9', '#FAE39B', '#FADE7C', '#FADA5E'] // light to dark yellow (too similar)
            var template = ['', '', '', '', '']
            var newSun = ['#FEF65C', '#FEE745', '#FFD82F', '#FFC918', '#FFBA01'] // light to dark yellow
            var combo = ['#fdfbf6', '#FEE745', '#FFD82F', '#FFC918', '#FFBA01'] // white to dark yellow
            var pinkish = ['#f8eff1', '#f1d2d4', '#e7a9b1', '#c65e6a', '#af3039'] // white to red
            var blues = ['#ABD7EC', '#59C1E8', '#3585DA', '#1061B0', '#003C72'] // light to dark blue
            var silvers = ['#BEBEBE', '#AFAFAF', '#9F9F9F', '#909090', '#808080'] //light to dark black
            //var pop1 = ['#f6eff7', '#bdc9e1', '#67a9cf', '#1c9099', '#016c59'] // purple to blue to green
            //console.log(colorz.classes)
            //var ramps = [colorRamp1, colorRamp2, colorRamp3, colorRamp4]
            var minty = ['#aaf0d1', '#96e6c2', '#7dd8b5', '#5ec69d', '#3eb489'] // light to dark green (too similar)
            //var colorRamp = ramps[Math.floor(Math.random() * 4)];

            if (selection.substring(0, 2) === '1a') {
                colorRamp = gdpColor;
            } else if (selection.substring(0, 2) === '1c') {
                colorRamp = pop;

            } else if (selection === '7d10') {
                colorRamp = combo
            } else if (selection === '7d5') {
                colorRamp = minty
            } else if (selection === '7d7') {
                colorRamp = blues;
            } else if (selection === '7d4') {
                colorRamp = pinkish;
            } else if (selection === '7d8') {
                colorRamp = silvers;
            } else if (selection === 'd') {
                breaks = [-4841, -3805, -2608, -1090, 1322];
                colorRamp = ['#08519c', '#3182bd', '#6baed6', '#bdd7e7', '#eff3ff']  // dark to light blue (reversed) 

            }

            currentGeojsonLayers.breaks = breaks;
            currentGeojsonLayers.color = colorRamp;

            //console.log(currentGeojsonLayers)

            /* map.setPaintProperty(currentGeojsonLayers.hexSize, 'fill-color',
             [
               'interpolate',
               ['linear'],
               ['get', selection],
               breaks[0], colorRamp[0],
               breaks[1], colorRamp[1],
               breaks[2], colorRamp[2],
               breaks[3], colorRamp[3],
               breaks[4], colorRamp[4],
               ]
             
             ) */

            map.setPaintProperty(currentGeojsonLayers.hexSize, 'fill-color',
        ['case', ['boolean', ['feature-state', 'hover'], false],
          'yellow',
        [
          'interpolate',
          ['linear'],
          ['get', selection],
          breaks[0], colorRamp[0],
          breaks[1], colorRamp[1],
          breaks[2], colorRamp[2],
          breaks[3], colorRamp[3],
          breaks[4], colorRamp[4],
          ]
        ]
            )



            //map.setFilter(currentGeojsonLayers.hexSize,['>=',selection, 0])
            if (isNaN(breaks[3]) || breaks[1] == 0) {
                //setTimeout(() => { map.setFilter(currentGeojsonLayers.hexSize, null) }, 500);

                map.setPaintProperty(currentGeojsonLayers.hexSize, 'fill-opacity', 0.0)
                setTimeout(() => {
                    map.setFilter(currentGeojsonLayers.hexSize, null)
                }, 100);
                addNoDataLegend();
            } else {
                map.setFilter(currentGeojsonLayers.hexSize, ['>=', selection, 0])
                addLegend(colorRamp, breaks, precision, selection)
                setTimeout(() => {
                    map.setPaintProperty(currentGeojsonLayers.hexSize, 'fill-opacity', 0.8)
                }, 100);
            }

            //setTimeout(() => {  map.setPaintProperty(currentGeojsonLayers.hexSize,'fill-opacity', 0.8) }, 700);
            //map.setPaintProperty(currentGeojsonLayers.hexSize,'fill-opacity', 0.8)


        }
        //}

    }, 600)
}


//addLegend()
//add the legend

function addNoDataLegend() {

    var infoBoxTitle = document.getElementById("infoBoxTitle")
    var infoBoxText = document.getElementById("infoBoxText")
    var infoBoxLink = document.getElementById("infoBoxLink")

    infoBoxTitle.innerHTML = 'No Data for this Region';
    infoBoxText.innerHTML = '';
    infoBoxLink.innerHTML = '';

    var legendTitle = document.getElementById('legendTitle')
    var legend = document.getElementById('updateLegend')
    legend.innerHTML = '';
    legendTitle.innerHTML = ''

}

function addLegend(colors, breaks, precision, current) {

    //console.log(allLayers)

    var legData = _.find(allLayers, ['field_name', current])

    var infoBoxTitle = document.getElementById("infoBoxTitle")
    var infoBoxText = document.getElementById("infoBoxText")
    var infoBoxLink = document.getElementById("infoBoxLink")

    infoBoxTitle.innerHTML = '';
    infoBoxText.innerHTML = '';
    infoBoxLink.innerHTML = '';

    infoBoxTitle.innerHTML = legData.desc + ' ' + legData.time;
    infoBoxText.innerHTML = legData.desc_long
    infoBoxLink.innerHTML = '<strong>Reference: </strong>' + legData.source_name + ' - <a href="' + legData.link + '" target="_blank">' + legData.link + '</a>'

    var legendTitle = document.getElementById('legendTitle')
    var legend = document.getElementById('updateLegend')
    legend.innerHTML = '';
    legendTitle.innerHTML = ''
    legendTitle.innerHTML = '<span>' + legData.units + '</span>';

    for (var x in colors) {

        var containerDiv = document.createElement('div')
        containerDiv.classList.add('col-flex')
        containerDiv.classList.add('align-items-center')

        var words = document.createElement('div')
        words.classList.add('population-per-km-text')
        //words.innerHTML = Number.parseFloat(breaks[x]).toFixed(3)
        words.innerHTML = nFormatter(breaks[x], precision)
        //words.innerHTML = Number(nFormatter(breaks[x], 2))
        var hexI = document.createElement('div')
        hexI.classList.add('population-per-km-img')
        hexI.style.backgroundColor = colors[x];

        containerDiv.appendChild(words)
        containerDiv.appendChild(hexI)
        legend.appendChild(containerDiv);

    }
}


/*var hoveredStateId = null;
map.on('mousemove', currentGeojsonLayers.hexSize, function (e) {
  

    //console.log(e.features[0].properties.hexid);
  if(currentGeojsonLayers.hexSize === 'hex5') {
      if (e.features.length > 0) {

          //console.log(e.features[0]);
          if (hoveredStateId !== null) {
                  map.setFeatureState(
                  { source: currentGeojsonLayers.hexSize, sourceLayer: 'hex5_3857', id: hoveredStateId },
                  { hover: false }
                  );
              }
              hoveredStateId = e.features[0].id
              map.setFeatureState(
                  { source: currentGeojsonLayers.hexSize, sourceLayer: 'hex5_3857', id: hoveredStateId },
                  { hover: true }
                  );
          }

        } else {
          if (e.features.length > 0) {

            //console.log(e.features[0]);
            if (hoveredStateId !== null) {
                    map.setFeatureState(
                    { source: currentGeojsonLayers.hexSize, id: hoveredStateId },
                    { hover: false }
                    );
                }
                hoveredStateId = e.features[0].id
                map.setFeatureState(
                    { source: currentGeojsonLayers.hexSize, id: hoveredStateId },
                    { hover: true }
                    );
            }
        }

    });

map.on('mouseleave', currentGeojsonLayers.hexSize, function () {

  if(currentGeojsonLayers.hexSize === 'hex5') {
        if (hoveredStateId !== null) {
        map.setFeatureState(
        { source: currentGeojsonLayers.hexSize, sourceLayer: 'hex5_3857', id: hoveredStateId },
        { hover: false }
        );
        }
      } else {
        if (hoveredStateId !== null) {
          map.setFeatureState(
          { source: currentGeojsonLayers.hexSize, id: hoveredStateId },
          { hover: false }
          );
          }


      }
        hoveredStateId = null;
    }); */

/////ui js
var selection_scroller_options = {
    0: {
        'label': 'SIDS offer Pillars',
        'value': 'SIDS offer Pillars'
    },

    1: {
        'label': 'SDGs',
        'value': 'SDGs'
    },

    2: {
        'label': 'SAMOA Pathway',
        'value': 'SAMOA Pathway'
    }
};

// Predefined data for side tooltip 
/*var sdg = [
	{
		title: "No Poverty",
		content: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like)."
	},
	{
		title: "Zero Hunger",
		content: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like)."
	},
	{
		title: "Good Health and Well-being",
		content: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like)."
	},
	{
		title: "Quality Education",
		content: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like)."
	},
	{
		title: "Clean Water and Sanitation",
		content: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like)."
	},
	{
		title: "Affortable and Clean Energy",
		content: "<strong> Reference: CIESIN</strong>, it is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like)"
	},
	{
		title: "Decent Work and Economic Growth",
		content: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like)."
	},
	{
		title: "Industry Innovation and Infrastructure",
		content: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like)."
	},
	{
		title: "Reduced Inquality",
		content: "t is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like)."
	},
	{
		title: "Blue Economy 2",
		content: "<strong> Reference: CIESIN</strong>, it is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like)"
	},
	{
		title: "Blue Economy 3",
		content: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like)."
	},
	{
		title: "Blue Economy 4",
		content: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like)."
	},
	{
		title: "Blue Economy 1 ",
		content: "t is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like)."
	},
	{
		title: "Blue Economy 2",
		content: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like)."
	},
	{
		title: "Blue Economy 3",
		content: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like)."
	},
	{
		title: "Blue Economy 4",
		content: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like)."
	},
	{
		title: "Blue Economy 5",
		content: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like)."
	},
	{
		title: "Blue Economy 6",
		content: "lastIt is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like)."
	},
]; 

var arrsamoa = [
	{
		title: "1",
		content: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like)."
	},
	{
		title: "2",
		content: "<strong> Reference: CIESIN</strong>, it is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like)"
	},
	{
		title: "3",
		content: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like)."
	},
	{
		title: "Quality Education",
		content: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like)."
	},
	{
		title: "Clean Water and Sanitation",
		content: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like)."
	},
	{
		title: "Affortable and Clean Energy",
		content: "<strong> Reference: CIESIN</strong>, it is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like)"
	},
	{
		title: "Decent Work and Economic Growth",
		content: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like)."
	},
	{
		title: "Industry Innovation and Infrastructure",
		content: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like)."
	},
	{
		title: "Reduced Inquality",
		content: "t is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like)."
	},
	{
		title: "Blue Economy 2",
		content: "<strong> Reference: CIESIN</strong>, it is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like)"
	},
	{
		title: "Blue Economy 3",
		content: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like)."
	},
	{
		title: "Blue Economy 4",
		content: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like)."
	},
	{
		title: "Blue Economy 1 ",
		content: "t is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like)."
	},
	{
		title: "Blue Economy 2",
		content: "<strong> Reference: CIESIN</strong>, it is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like)"
	},
	{
		title: "Blue Economy 3",
		content: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like)."
	},
	{
		title: "Blue Economy 4",
		content: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like)."
	},
	{
		title: "Blue Economy 5",
		content: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like)."
	},
	{
		title: "Blue Economy 6",
		content: "lastIt is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like)."
	},
]; */

$('#layer-id').hide()
$('.year-timeline-wrapper').hide()

//$(document).ready(function () {
/** Collapse/Expand for Box  */
$('.collapse-btn').on('click', function () {
    $('.app-body').toggleClass('collapsed');
    $(this).toggleClass('collapsed');
});

// /** Select2 for drop downs */
//$('.form-select').select2();

/**
 * Tooltip for sdgs
 */
$(".sdgimg .carousel-item, .sdgs .icon-grid-item , .sdg-tool").mouseover(function () {
    $("#gridsdgs").removeClass("d-none");
    $("#samimg").removeClass("d-none");
    var index = $(this).data('imgid');
    $('.title-text').text(sdg[index].title);
    $('.img-tooltip-content').html(sdg[index].content);
});

$(".sdgimg .carousel-item, .grid-container,.sdg-tool ").mouseout(function () {
    $("#gridsdgs").addClass("d-none");
    $("#samimg").addClass("d-none");
});

// samoa hover events
$(".samoa .carousel-item, .samoa-grid .icon-grid-item").mouseover(function () {
    $("#gridsamoa").removeClass("d-none");
    $("#samimg").removeClass("d-none");
    var index = $(this).data('imgid');
    $('.title-text').text(arrsamoa[index].title);
    $('.img-tooltip-content').html(arrsamoa[index].content);

});

$(".samoa .carousel-item,.grid-container, .samoa-grid ").mouseout(function () {
    $("#gridsamoa").addClass("d-none");
    $("#samimg").addClass("d-none");
});

/**sdg grid hover */
$(".sdgs .icon-grid-item").click(function () {
    $("#sdg_slider .carousel-item").removeClass("active");
    var index = $(this).data('imgid');
    $("#sdg_slider div[data-imgid='" + index + "']").addClass("active");
});


/**samoa grid hover */
$(".samoa-grid .icon-grid-item").click(function () {
    $("#SAMOA_slider .carousel-item").removeClass("active");
    var index = $(this).data('imgid');
    $("#SAMOA_slider div[data-imgid='" + index + "']").addClass("active");
    console.log('add');
    console.log('remov');
});

// hover for economy
$(".BE, #tooleconnomy").mouseover(function () {
    $("#tooleconomy").removeClass("d-none");
});
$(".BE, #tooleconomy").mouseout(function () {
    $("#tooleconomy").addClass("d-none");
});

// hover action for climate action 
$(".CA, #toolclimate").mouseover(function () {
    $("#tooleclimate").removeClass("d-none");
});
$(".CA, #tooleclimate").mouseout(function () {
    $("#tooleclimate").addClass("d-none");
});

// hover action for Digital	Transformation
$(".DT, #tooldigi").mouseover(function () {
    $("#tooldigi").removeClass("d-none");
});
$(".DT, #tooldigi").mouseout(function () {
    $("#tooldigi").addClass("d-none");
});


// Button click and select
$('.button-option-select-1').on('click', function (e) {
    var btnValue = $(this).data('value');

    $('.button-option-select-1.active').removeClass('active');

    $(this).addClass('active');
    // Button value 
    console.log('Button Value: ' + btnValue);

    e.preventDefault();
});

// 
$('select[name="dataset-selection"]').on('change', function () {
    //console.log('Dataset: ' + $(this).val());
    //console.log(map.getStyle().layers)

    var legendTitle = document.getElementById('legendTitle')
    var legend = document.getElementById('updateLegend')
    legend.innerHTML = '';
    legendTitle.innerHTML = ''
    var infoBoxTitle = document.getElementById("infoBoxTitle")
    var infoBoxText = document.getElementById("infoBoxText")
    var infoBoxLink = document.getElementById("infoBoxLink")
    infoBoxTitle.innerHTML = '';
    infoBoxText.innerHTML = '';
    infoBoxLink.innerHTML = '';
    //console.log(this.selectedOptions[0].className);

    if (this.selectedOptions[0].className === 'basemap') {
        $('#layer-id').hide()
        $('#icon3d').hide()
        $('.year-timeline-wrapper').hide()
        $('.opacityslider').hide()
        $('.download').hide()

        //console.log(map.getStyle().sources)
        //console.log(styles)
        if (map.getLayer(currentGeojsonLayers.hexSize)) {
            map.removeLayer(currentGeojsonLayers.hexSize)
        }

        var lyr = this.selectedOptions[0].innerHTML;
        legend.innerHTML = '';
        legendTitle.innerHTML = ''
        infoBoxTitle.innerHTML = lyr
        infoBoxText.innerHTML = '';
        infoBoxLink.innerHTML = '';


        //var thisStyle = _.find(styles, function(o){return o.title === 'Satellite With Labels'})
        //map.setStyle(thisStyle.uri)

        if (map.getStyle().name === 'Mapbox Light') {
            var thisStyle = _.find(styles, function (o) {
                return o.title === 'Satellite With Labels'
            })
            map.setStyle(thisStyle.uri)
        }

        //console.log(basemapLabels)
        if (lyr === 'Satellite Imagery') {
            /*  basemapLabels.forEach(function(x) {
                map.removeLayer(x.id);
              })

              $('#addLabels')[0].innerText = 'Add Labels'
              //console.log($('#basemap-switch').find(":selected").text())
             */

            // var thisStyle = _.find(styles, function(o){return o.title === 'Light'})
            //map.setStyle(thisStyle.uri)
            console.log('yo');

            addLabels();

        } else if (map.getStyle().layers.length > 2) {
            console.log(map.getStyle().layers);

            //console.log(map.getStyle().layers)

        } else {

            addLabels()

        }


        //var thisStyle = _.find(styles, function(o){return o.title === lyr})
        //map.setStyle(thisStyle.uri);
        var layers = map.getStyle().layers;
        //console.log(layers);
        if (layers.length <= 2) {
            firstSymbolId = null;
        } else {
            for (var i = 0; i < layers.length; i++) {
                if (layers[i].type === 'symbol') {
                    firstSymbolId = layers[i].id;
                    break;
                }
            }
        }





    } else if (this.selectedOptions[0].innerHTML === 'GDP per Capita' || this.selectedOptions[0].innerHTML === 'Population Density') {
        //map.setPaintProperty(currentGeojsonLayers.hexSize,'fill-opacity', 0.0)
        $('.year-timeline-wrapper').show()
        $('#layer-id').hide()
        $('.opacityslider').show()
        $('.download').show()
        $('#icon3d').show()
        if (this.selectedOptions[0].innerHTML === 'Population Density') {
            //$('#icon3d').show()
        }

        var layers = [];
        //console.log(this.selectedOptions[0])
        for (var x in allLayers) {
            if (allLayers[x].title === this.selectedOptions[0].innerHTML) {
                //console.log(allLayers[x]);
                layers.push(allLayers[x]);
            }
        }
        updateTime(layers)
        //addToLayersDrop(layers);

    } else if (this.selectedOptions[0].innerHTML === 'Food Insecurity' || this.selectedOptions[0].innerHTML === 'Water Use' || this.selectedOptions[0].innerHTML === 'Development Potential Index' || this.selectedOptions[0].innerHTML === 'Ocean Data') {
        //$('#icon3d').hide()
        $('.year-timeline-wrapper').hide()
        $('.year-timeline').empty();
        $('.opacityslider').show()
        $('.download').show()
        $('#icon3d').show()
        map.setPaintProperty(currentGeojsonLayers.hexSize, 'fill-opacity', 0.0)

        var layers = [];
        //console.log(this.selectedOptions[0])
        for (var x in allLayers) {
            if (allLayers[x].title === this.selectedOptions[0].innerHTML) {
                //console.log(allLayers[x]);
                layers.push(allLayers[x]);
            }
        }

        addToLayersDrop(layers);

    } else {
        //$('#icon3d').hide()
        $('.opacityslider').show()
        $('.download').show()
        $('#icon3d').show()
        var layersHolder = document.getElementById('layer-drop');
        var length = layersHolder.options.length;

        for (var i = length - 1; i >= 0; i--) {
            layersHolder.options[i] = null;
        }
        $('#layer-id').hide()
        $('.year-timeline-wrapper').hide()
        $('.year-timeline').empty();
        changeDataOnMap(this.selectedOptions[0].id);
    }

    //changeDataOnMap(this.selectedOptions[0].id);
});

$('select[name="hexbin-change"]').on('change', function () {

    console.log(this.selectedOptions[0].value);
    changeHexagonSize(this.selectedOptions[0].value)
})



/*$('select[name="overlay-select"]').on('change', function() {

  console.log(this.selectedOptions[0].value)
  addOverlay(this.selectedOptions[0].value)

}) */


/*$('#updateLegend').click(function(e){

  var bg = $(e.target).css('background-color');
  console.log(bg)
  var r = parseInt(bg.match(/\d+/g)[0]);
  var g = parseInt(bg.match(/\d+/g)[1]);
  var b = parseInt(bg.match(/\d+/g)[2]);

  console.log(r + ' ' + g + ' ' + b + ' ')

}) */


$("input:checkbox").change(function () {

    var clicked = $(this).val();
    console.log(clicked);
    if (clicked === 'underwater-overlay') {
        addCables()

    } else if (!this.checked) {
        map.removeLayer(clicked)
    } else {

        var slayer;
        var color;
        var source;

        if (clicked === 'admin1-overlay') {
            source = 'admin1'
            slayer = 'admin1extra'
            color = 'red'
        } else if (clicked === 'admin2-overlay') {
            source = 'admin2'
            slayer = 'admin2'
            color = '#003399'
        }

        map.addLayer({
            'id': clicked,
            'type': 'line',
            'source': source,
            'source-layer': slayer,
            'layout': {
                'visibility': 'visible'
            },

            'paint': {
                'line-color': color,
                'line-width': 5

            }
        }, firstSymbolId);

        if (map.getLayer('admin1-overlay')) {
            map.moveLayer(clicked, 'admin1-overlay')

        }

        map.on('mouseover', function () {



        })

    }
    //alert($(this).val());


});


function addCables() {

    if (map.getLayer('underwater')) {
        map.removeLayer('underwater')
    } else if (!map.getSource('underwater-source')) {

        d3.json('./data/cable-geo.json').then(function (d) {

            map.addSource('underwater-source', {
                'type': 'geojson',
                'data': d
            })

            map.addLayer({
                'id': 'underwater',
                'type': 'line',
                'source': 'underwater-source',

                'layout': {
                    'visibility': 'visible'
                },

                'paint': {
                    'line-color': ['get', 'color'],
                    'line-width': 3
                }
            }, firstSymbolId);

        })

    } else {


        map.addLayer({
            'id': 'underwater',
            'type': 'line',
            'source': 'underwater-source',

            'layout': {
                'visibility': 'visible'
            },

            'paint': {
                'line-color': ['get', 'color'],
                'line-width': 3
            }
        }, firstSymbolId);
    }



    map.on('click', 'underwater', function (e) {
        var popup = new mapboxgl.Popup({
            closeButton: true,
            closeOnClick: true
        });


        popup.setLngLat(e.lngLat).setHTML('<b>' + e.features[0].properties['slug'] + '</b>').addTo(map);
    })

}



$('select[name="layer-selection"]').on('change', function () {
    console.log('Layer: ' + $(this).val());
    //console.log('hi');
    changeDataOnMap(this.selectedOptions[0].id)
});

var isReachedToEnd = false;

/**
 * Dynamic year list creation 
 */

function updateTime(layers) {

    $('.year-timeline-wrapper').show()
    //console.log(yearList)
    //console.log(layers);
    //var currentLayer = {}
    currentTimeLayer = layers;
    var latestTime = currentTimeLayer.slice(-1);
    changeDataOnMap(latestTime[0].field_name);

    //var startLayer = find(currentTimeLayer, function(o) {return o.time === yearValue})
    //console.log(showLayer)
    //changeDataOnMap(showLayer.field_name);
    //console.log(currentLayer)
    var yearList = currentTimeLayer.map(x => x.time)
    var year_html = ''
    //$('.year-timeline').append(year_html);
    $('.year-timeline').empty();


    if (yearList.length == 1) {
        $('.year-timeline').html(`<p class='m-0'> Data only available for ${yearList}</p>`)
        $('.year-timeline-wrapper').addClass('single-year-only');
        return;
    }

    var last_percentage = 0;

    for (var i = 0; i < yearList.length; i++) {
        var class_for_year = "";
        if (i == 0) {
            class_for_year = "alpha";
        } else if (i == yearList.length - 1) {
            class_for_year = "omega";
        }


        // 
        var totalContainerWidth = $('.year-timeline').outerWidth();

        // Calculating the pecetange of this block
        var different_first_last = yearList[yearList.length - 1] - yearList[0];


        // Now calculate the distance between the current item and the next one
        var distance_to_next = yearList[i] - yearList[0];

        if (i == yearList.length - 1) {
            console.log('is omega');
        }

        var size_in_percentage = (distance_to_next / different_first_last) * 100;
        size_in_percentage = size_in_percentage.toFixed(2);

        var widthStyle = `width: ${size_in_percentage}%;`;

        var fromLeftPosition = 0;
        var fromLeftPixels = 0;
        var fromLeftStyle = ``;

        if (i > 0 && i < (yearList.length - 1)) {
            fromLeftPosition = parseInt(size_in_percentage);
            // convert from left position to pixels
            fromLeftPixels = (fromLeftPosition / 100) * totalContainerWidth;
            fromLeftStyle = `left: ${fromLeftPixels}px;`;
        } else {
            last_percentage = parseInt(size_in_percentage);
        }

        last_percentage = fromLeftPosition;


        year_html = `<div _style=' ${widthStyle}' data-width='${size_in_percentage}' class="year-timeline-block ${class_for_year}" data-year-idx="${i + 1}">
          <input type="radio" name="year-selected" value="${yearList[i]}" id="year-${yearList[i]}" ${(i == 0) ? 'checked' : ''}>
          <label for="year-${yearList[i]}">
          <span style='${fromLeftStyle}' class="label-value">${yearList[i]}</span>
          <span style='${fromLeftStyle}' class="circle-radio"></span>
          </label>
          </div>`;
        $('.year-timeline').append(year_html);

    }




    $('body').on('change click', 'input[name="year-selected"]', function (e) {
        //e.preventDefault() //so it doesn't run twice
        isReachedToEnd = false;
        var yearValue = $('[name="year-selected"]:checked').val();
        //$('.year-timeline-block.alpha input[type="radio"').prop('checked', true);
        //console.log('-----')
        //console.log(yearValue);
        //console.log(this)
        var check = $(this).prop('checked')
        //$(this).prop('checked',true) 
        //console.log(check);
        /*if(check){
          console.log('yo')
          $(this).prop('checked',false)
          console.log(this)
        } else {
          console.log('hi')
          $(this).prop('checked',true) 
        } */
        /*if (check) {$(this).removeAttr('checked').prop('checked',false)}
        else {$(this).attr('checked', true).prop('checked',true) } */
        //console.log(this)
        //console.log(currentTimeLayer);
        var showLayer = _.find(currentTimeLayer, function (o) {
            return o.time === yearValue
        })
        //console.log(showLayer)
        changeDataOnMap(showLayer.field_name);
        //console.log(yearValue);
    });


}
// }

// Year selection 
/*	var isReachedToEnd = false;
	$('body').on('change click', 'input[name="year-selected"]', function () {
		isReachedToEnd = false;
		var yearValue = $('[name="year-selected"]:checked').val();
		console.log(yearValue);
	}); */

// play / pause
var playPauseInterval;

$('#year-play-pause').on('click', function (e) {
    var isPaused = $(this).hasClass('play');


    if (!isPaused) {
        clearInterval(playPauseInterval);
        $(this).removeClass('pause').addClass('play');
    } else {
        playPauseInterval = window.setInterval(function () {
            var $checkedBox = $('input[name="year-selected"]:checked');
            //console.log($checkedBox[0].value);
            if ($checkedBox.parent('.year-timeline-block').hasClass('omega') && isReachedToEnd) {
                $('.year-timeline-block.alpha input[type="radio"').prop('checked', true);
                isReachedToEnd = false; // Reset, once replayed 
            }
            // Reached to end 
            else if ($checkedBox.parent('.year-timeline-block').hasClass('omega')) {
                clearInterval(playPauseInterval);
                $('#year-play-pause').removeClass('pause').addClass('play');
                isReachedToEnd = true; // Flag that indicates to replay the year selection 
                return;
            }
            // Find the idx of checked item
            var currentIdx = $checkedBox.parent('.year-timeline-block').data('year-idx');

            var nextCheckedBoxIdx = currentIdx + 1;
            $('.year-selected[value=1990]').prop('checked', true)
            $('.year-timeline-block[data-year-idx="' + nextCheckedBoxIdx + '"]').find('input[name="year-selected"]').prop('checked', true);

            var currentYear = $('input[name="year-selected"]:checked').val()
            var display = _.find(currentTimeLayer, function (o) {
                return o.time === currentYear
            })
            console.log($('input[name="year-selected"]:checked').val());
            changeDataOnMap(display.field_name)


        }, 1600);

        $(this).addClass('pause').removeClass('play');
    }


    e.preventDefault();

});


/* Tabs */
$('.tab-nav').on('click', function () {

    $('.tab-nav').removeClass('active');
    $(this).addClass('active');

    var target = $(this).data('target');

    $('.tab').removeClass('active');
    $(target).addClass('active');

});


$('#volume').on("change mousemove", function () {
    console.log($(this).val());
    map.setPaintProperty(currentGeojsonLayers.hexSize, 'fill-opacity', ($(this).val() * 0.1))
    if (map.getLayer('ocean')) {
        //console.log('hi');
        map.setPaintProperty('ocean', 'fill-opacity', ($(this).val() * 0.1))

    }
})

/**
 *  Top Toolip 
 */
$('.tab-nav').on('mouseover', function () {
    var $target = $(this).data('tooltip-target');
    $($target).show();
});

$('.tab-nav').on('mouseout', function () {
    var $target = $(this).data('tooltip-target');
    $($target).hide();
});
/* END TOP TOOLTIP */
$('.selection-dropdown-arrow').on('click', function () {
    // Get <select> tag  
    var $select = $(this).parent().find('select');
    // Count options 
    var totalOpts = $select.find('option').length;
    // Get current selection s
    var currentIndex = $select.prop('selectedIndex');


    if ($(this).hasClass('up')) {
        if (currentIndex === 0) {
            currentIndex = totalOpts - 1;
            $select.prop('selectedIndex', currentIndex);
        } else {
            $select.prop('selectedIndex', currentIndex - 1);
        }
    } else if ($(this).hasClass('down')) {
        if (currentIndex === totalOpts - 1) {
            currentIndex = 0;
            $select.prop('selectedIndex', currentIndex);
        } else {
            $select.prop('selectedIndex', currentIndex + 1);
        }
    }
});

/**
 * Function to check all the values
 */
function check_all_values() {
    var top_left_nav = $('.tab-nav.active span').text();
    var btnValue = $('.button-option-select-1.active').data('value');
    var datasetSelect = $('select[name="dataset-selection"]').val();
    var layerSelect = $('select[name="layer-selection"]').val();
    //var year = $('input[name="year-selected"]:checked').val();

    //console.log('Top left nav = ' + top_left_nav);
    //console.log('Top right Button = ' + btnValue);
    //console.log('DATASET selection = ' + datasetSelect);
    //console.log('Layer selection = ' + layerSelect);
    //console.log('Year selection = ' + year);
}

check_all_values()

//});
function nFormatter(num, digits) {
    var si = [
        {
            value: 1,
            symbol: ""
        },
        {
            value: 1E3,
            symbol: "K"
        },
        {
            value: 1E6,
            symbol: "M"
        },
        {
            value: 1E9,
            symbol: "B"
        }
  ];
    var rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
    var i;
    for (i = si.length - 1; i > 0; i--) {
        if (num >= si[i].value) {
            break;
        }
    }
    return (num / si[i].value).toFixed(digits).replace(rx, "$1") + si[i].symbol;
}


$('#datadownload').click(function () {




    //$('.loader-gis').show()

    map.setFilter(currentGeojsonLayers.hexSize, null)

    var features = map.queryRenderedFeatures({
        layers: [currentGeojsonLayers.hexSize]
    })

    var countries = []
    features.map(function (x) {
        countries.push(x.properties.NAME_0)
    })

    countries = _.uniq(countries);
    console.log(countries);

    var feats = map.querySourceFeatures('admin1', {
        sourceLayer: ['admin1extra'],
        filter: ['in', 'NAME_0', ...countries]

    })

    console.log(feats);


    for (var x in feats) {



    }

    map.addSource('screen', {
        type: 'geojson',
        data: {
            'type': 'FeatureCollection',
            'features': feats
            //'features': features
        }
    })

    map.addLayer({
        'id': 'screenshot',
        'source': 'screen',
        'type': 'line',
        'paint': {
            'line-color': '#66ff00',
            'line-width': 3
        }
    })


    //console.log(features);

    if (features) {

        var uniFeatures;
        if (currentGeojsonLayers.hexSize === 'admin1') {
            uniFeatures = getUniqueFeatures(features, 'GID_1');
        } else if (currentGeojsonLayers.hexSize === 'admin2') {
            uniFeatures = getUniqueFeatures(features, 'GID_2');
        } else {
            uniFeatures = getUniqueFeatures(features, 'hexid');
        }

        //console.log(features)
        //console.log(uniFeatures);


        /*map.addSource('screen', {
          type: 'geojson',
          data: {
            'type': 'FeatureCollection',
            'features': feats
            //'features': features
          }
        }) */

        /* map.addSource('screen1', {
           type: 'geojson',
           data: {
             'type': 'FeatureCollection',
             'features': features
             //'features': features
           }
         }) */




        /* map.addLayer({
           'id': 'screenshot1',
           'source': 'screen1',
           'type': 'line',
           'paint': {
             'line-color': 'red',
             'line-width': 3
           }
         }) */

        /*map.addLayer({
          'id': 'screenshot',
          'source': 'screen',
          'type': 'line',
          'paint': {
            'line-color': '#66ff00',
            'line-width': 3
          }
        }) */



        //var gdata = map.getSource('screen1')._data;



        //exportGeojson(gdata);
        //openDownloadPage(gdata);


    }





});

function openDownloadPage(gdata) {
    var allTheFieldIds = allLayers.map(x => x.field_name);
    //console.log(allTheFieldIds);
    var allchecked = [];

    $('.modal').toggle();
    //$('.loader-gis').hide()


    $('#shp').click(function () {
        var removeOnes = _.difference(allTheFieldIds, allchecked);
        exportShp(gdata, removeOnes);
    })
    $('#gjn').click(function () {

        //console.log(allchecked);
        var removeOnes = _.difference(allTheFieldIds, allchecked);
        //console.log(removeOnes)
        exportGeojson(gdata, removeOnes);
    })


    $('input:checkbox').change(function () {
        var thisid = $(this)[0].id


        if ($(this).is(":checked")) {
            allchecked.push(thisid);
        }
    })

}

function exportShp(obj, removeOnes) {

    //console.log(obj);

    for (var x in obj.features) {
        for (var y in removeOnes) {
            delete obj.features[x].properties[removeOnes[y]]
        }
    }

    const options = {
        folder: 'SIDSshapefile',
        types: {
            polygon: currentGeojsonLayers.hexSize.toString()
        }
    }
    shpwrite.download(obj, options);
    //$('.modal').toggle();

}

function exportGeojson(obj, removeOnes) {



    function mapArray(ar) {

        return _.map(ar.features, object =>
            _.omit(object, ['_vectorTileFeature', 'layer', 'source', 'sourceLayer', 'state'])
        );

    }
    var resultz = mapArray(obj)

    resultz.forEach(function (x) {
        x.geometry = x._geometry
        delete x._geometry
    })


    //console.log(resultz)






    var fc = turf.featureCollection(resultz)


    //console.log(fc)

    for (var x in fc.features) {

        for (var y in removeOnes) {

            delete fc.features[x].properties[removeOnes[y]]
        }

    }

    //console.log(fc);

    var datastring = '';
    $('.modal').toggle();

    var datastring = "data:text/json;charset=utf-8, " + encodeURIComponent(JSON.stringify(fc))
    var link = document.createElement('a');
    link.download = 'download.geojson';
    link.href = datastring
    link.click();
    link.delete;

    map.removeLayer('screenshot')
    map.removeSource('screen');
    map.removeLayer('screenshot1')
    map.removeSource('screen1');
}

$('.close').click(function () {
    map.setFilter(currentGeojsonLayers.hexSize, ['>=', currentGeojsonLayers.dataLayer, 0])
    $('.modal').toggle();
    map.removeLayer('screenshot')
    map.removeSource('screen');
    map.removeLayer('screenshot1')
    map.removeSource('screen1');

})

function addButtons() {

    var sidsHolder = document.getElementById('country-select');

    names.map(function (x) {
        var btn = document.createElement("option");
        btn.innerHTML = x.NAME_0; //+ ' ' + x.flag;
        btn.classList.add('sidsb')
        btn.setAttribute('id', x.GID_0)
        sidsHolder.appendChild(btn)
    })



    d3.csv('./data/csvData.csv').then(function (d) {

        d.map(function (x) {
            allLayers.push({
                'field_name': x.Field_Name,
                'title': x.Name,
                'band': x.Band,
                'time': x.Temporal,
                'desc': x.Description,
                'units': x.Unit,
                'desc_long': x.Desc_long,
                'source_name': x.Source_Name,
                'link': x.Source_Link
            })

            var checkbox = document.getElementById('download-attributes')
            var newI = document.createElement('input');
            newI.type = 'checkbox'
            newI.setAttribute('id', x.Field_Name)

            var label = document.createElement('label')
            label.htmlFor = "id"
            label.appendChild(document.createTextNode('\u00A0' + x.Description + ' ' + x.Temporal));


            checkbox.appendChild(newI)
            checkbox.appendChild(label)
            var br = document.createElement('br')
            checkbox.appendChild(br)



        })

        var dataHolder = document.getElementById('dataDrop')
        var addBasemaps = ['Satellite Imagery']

        for (var x in addBasemaps) {
            var btn2 = document.createElement("option");
            btn2.innerHTML = addBasemaps[x];
            btn2.classList.add('basemap')
            btn2.setAttribute('id', addBasemaps[x])
            dataHolder.appendChild(btn2)
        }

        var uniqueNames = allLayers.map(x => x.title)

        var actualu = _.uniq(uniqueNames);

        for (var x in actualu) {
            //console.log(actualu[x]);
            var btn1 = document.createElement("option");
            btn1.innerHTML = actualu[x];
            btn1.classList.add('data')
            var correctFI = _.find(allLayers, function (o) {
                return o.title === actualu[x]
            })
            //console.log(correctFI);
            btn1.setAttribute('id', correctFI.field_name)
            dataHolder.appendChild(btn1)

        }

    })
}

var checkList = document.getElementById('list1');
var items = document.getElementById('items');
checkList.getElementsByClassName('anchor')[0].onclick = function (evt) {
    if (items.classList.contains('visible')) {
        items.classList.remove('visible');
        items.style.display = "none";
    } else {
        items.classList.add('visible');
        items.style.display = "block";
    }


}

items.onblur = function (evt) {
    items.classList.remove('visible');
}

$('#close-side').click(function () {
    console.log('hi')

    if (!$('#top-right-wrap').hasClass('moved')) {
        $('#top-right-wrap').css('right', '-250px')
        $('#top-right-wrap').addClass('moved')

    } else {
        $('#top-right-wrap').css('right', '10px')
        $('#top-right-wrap').removeClass('moved')

    }

})