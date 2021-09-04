var allLayers = [];
var firstSymbolId;
var oldZoom;
var oldCenter;
const userLayers = ['hex5', 'hex5clipped', 'hex10', 'admin1', 'admin2', 'hex1', 'ocean'];
var hexes = ['hex5', 'hex10', 'hex1']
var admins = ['admin1', 'admin2']
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
    {
        'title': "Mapbox Dark",
        'uri': 'mapbox://styles/mapbox/dark-v10'
    }
];

//addButtons();

/*Initialize Map */
mapboxgl.accessToken = "pk.eyJ1Ijoic2ViYXN0aWFuLWNoIiwiYSI6ImNpejkxdzZ5YzAxa2gyd21udGpmaGU0dTgifQ.IrEd_tvrl6MuypVNUGU5SQ";

const map = new mapboxgl.Map({
    container: "map", // container ID
    //style: 'mapbox://styles/mapbox/light-v10?optimize=true', //?optimize=true
    style: 'mapbox://styles/mapbox/satellite-streets-v11',
    center: [-61.2, 10.4], // starting position [lng, lat]
    zoom: 5,
    //preserveDrawingBuffer: true,
    maxZoom: 14,
    //minZoom: 
    //pitch: 55
});

var yearList = [];
var currentTimeLayer;

/*var Draw = new MapboxDraw({
  displayControlsDefault: false,
  controls: {
  polygon: true,
  trash: true
  },
  //defaultMode: 'draw_polygon'
}); */

var sourceData = {
    hex5Source: {
        name: 'hex5',
        layer: 'hex5',
        mainId: 'hexid',
        data: null
    },
    hex10Source: {
        name: 'hex10',
        layer: 'hex10',
        mainId: 'hexid',
        data: null
    },
    admin1Source: {
        name: 'admin1',
        mainId: 'GID_1',
        layer: 'admin1',
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
    },
    hex5clippedSource: {
        name: 'hex5clipped',
        layer: 'hex5clipped',
        mainId: 'hexid',
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
    map.addControl(
        new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            mapboxgl: mapboxgl,
            placeholder: 'Search for City or Country',
            //flyTo: false,
            types: 'country, place',
            clearOnBlur: true,
            marker: false
        })
    )
    //map.addControl(Draw, 'bottom-right');
    //$('.loader-gis').remove()
    //$('.download').show()
    addButtons()
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
            console.log(x);
            map.addLayer(x);
            if (x.type === 'line') {
                map.moveLayer(x.id, currentGeojsonLayers.hexSize)
            }

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

function addBivar() {
    console.log("Bivar0");
    console.log($('#addBivar')[0].innerText);
    if ($('#addBivar')[0].innerText === 'Add BiVar') {
        console.log("Bivar1");
        //$('#addBivar').toggle();
        $('#addBivar')[0].innerText = 'Remove Bivar'
    } else {

        $('#addBivar')[0].innerText = 'Add Bivar'
        console.log("Bivar2");
    }

}

function recolorBasedOnWhatsOnPage() {

    if (!map.getLayer(currentGeojsonLayers.hexSize)) {
        //console.log('no layer')
        return;
    }

    var features = map.queryRenderedFeatures({
        layers: [currentGeojsonLayers.hexSize]
    })

    //createMask(features);

    //console.log(currentGeojsonLayers.hexSize);
    if (features.length > 0) {

        var uniFeatures;
        if (currentGeojsonLayers.hexSize === 'admin1') {
            uniFeatures = getUniqueFeatures(features, 'GID_1');
        } else if (currentGeojsonLayers.hexSize === 'admin2') {
            uniFeatures = getUniqueFeatures(features, 'GID_2');
        } else {
            uniFeatures = getUniqueFeatures(features, 'hexid');
        }

        if (bi_var != '') {
            // bi-var                 
            var selecteData = uniFeatures.map(x => x.properties[main_var])
            var selecteData_biv = uniFeatures.map(x => x.properties[bi_var]);//popden
            var breaksX = chroma.limits(selecteData, 'q', 3);
            var breaksY = chroma.limits(selecteData_biv, 'q', 3);
            var bivar_colors = colorSeqSeq3['blue-pink-purple'];

            var featureCount = uniFeatures.length;
            var bivarClass = Array(featureCount).fill(0);
            var breaksX = chroma.limits(selecteData, 'q', 3);
            var breaksY = chroma.limits(selecteData_biv, 'q', 3);

            for (var i = 0; i < featureCount; i++) {
                var x = selecteData[i];
                var y = selecteData_biv[i];
                var v1, v2;
                if (x < breaksX[1])
                    v1 = 1
                else if (x < breaksX[2])
                    v1 = 2
                else v1 = 3;
                if (y < breaksY[1])
                    v2 = 1
                else if (y < breaksY[2])
                    v2 = 2
                else v2 = 3;
                switch (String(v1) + String(v2)) {
                    case "11": bivarClass[i] = 1; break;
                    case "12": bivarClass[i] = 2; break;
                    case "13": bivarClass[i] = 3; break;
                    case "21": bivarClass[i] = 4; break;
                    case "22": bivarClass[i] = 5; break;
                    case "23": bivarClass[i] = 6; break;
                    case "31": bivarClass[i] = 7; break;
                    case "32": bivarClass[i] = 8; break;
                    case "33": bivarClass[i] = 9; break;
                }
                uniFeatures[i]["properties"]["bivarClass"] = bivarClass[i];
            }

            //convert rendered features to geojson format
            var fc = turf.featureCollection(uniFeatures);

            if (map.getLayer('newone')) {
                map.removeLayer('newone');
                map.removeSource('newone');
            }

            //add new source 
            map.addSource('newone', {
                type: 'geojson',
                data: fc //data is the new geojson 
            })
            map.addLayer({
                'id': 'newone',
                'source': 'newone',
                'type': 'fill',
                'paint': {
                    'fill-color':
                        [
                            'step',
                            ['get', 'bivarClass'],
                            bivar_colors[0],
                            1, bivar_colors[1],
                            2, bivar_colors[2],
                            3, bivar_colors[3],
                            4, bivar_colors[4],
                            5, bivar_colors[5],
                            6, bivar_colors[6],
                            7, bivar_colors[7],
                            8, bivar_colors[8],
                        ],
                    'fill-opacity': 0.9,
                }
            })

        }
        else {

            //console.log(uniFeatures.features);
            var selecteData = features.map(x => x.properties[currentGeojsonLayers.dataLayer])
            //console.log(selecteData);
            var breaks = chroma.limits(selecteData, 'q', 4);

            //console.log("BREAK",breaks);
            var breaks_new = [];
            var precision = 1;
            do {
                precision++;
                for (let i = 0; i < 5; i++) {
                    breaks_new[i] = parseFloat(breaks[i].toPrecision(precision));
                }
                //console.log(breaks_new);
            }
            while (checkForDuplicates(breaks_new) && (precision < 10));
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
            //console.log(currentGeojsonLayers);

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
                addLegend(currentGeojsonLayers.color, breaks, precision, currentGeojsonLayers.dataLayer, selecteData)
                setTimeout(() => {
                    map.setPaintProperty(currentGeojsonLayers.hexSize, 'fill-opacity', 0.8)
                }, 400);
            }
        }
    }

}

//const baseMapSwitcher = document.getElementById('basemap-switch');

$('#basemap-switch').on('change', function () {

    var selectedBase = $(this)[0].value;
    //var sel = $(this).innerText;
    var currentBase = map.getStyle().name;

    console.log(selectedBase);
    //console.log(currentBase);

    if (selectedBase === 'Mapbox Light') {
        console.log(basemapLabels);
        //basemapLabels = [];
        var thisStyle = _.find(styles, function (o) {
            return o.title === 'Light'
        })

        map.setStyle(thisStyle.uri)
        console.log(map.getStyle().sources)

    } else if (selectedBase === 'Mapbox Satellite Streets') {

        console.log(basemapLabels);

        var thisStyle = _.find(styles, function (o) {
            return o.title === 'Satellite With Labels'
        })

        map.setStyle(thisStyle.uri)
        console.log(map.getStyle().sources)
    } else if (selectedBase === 'Mapbox Dark') {

        console.log(basemapLabels);

        var thisStyle = _.find(styles, function (o) {
            return o.title === 'Mapbox Dark'
        })

        map.setStyle(thisStyle.uri)
        console.log(map.getStyle().sources)
    }

    /*} else if (selectedBase === 'Satellite With Labels') {
      var thisStyle = _.find(styles, function(o){return o.title === 'Light'})
      map.setStyle(thisStyle.uri)
    } */

    map.once('idle', function () {
        basemapLabels = [];
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
                'fill-opacity': 0.8,
                'fill-color':
                    [
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
        map.moveLayer('allsids', firstSymbolId)
        console.log(map.getStyle().layers);
    })
    //addHexSource();

    //console.log(map.getStyle().sources)
    //map.moveLayer(currentGeojsonLayers.hexSize, 'allsids')

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

        console.log('country select');
        //map.setPaintProperty(currentGeojsonLayers.hexSize, 'fill-opacity', 0.7)

    })
})

map.on('dragend', function (e) {
    //console.log(map.getZoom())
    //console.log('dragend');
    //console.log(map.getBounds());

    if (!(map.getLayer('ocean') || map.getLayer('hex1') || map.getZoom() > 9)) {
        //console.log('recolor');
        recolorBasedOnWhatsOnPage();
    }

    /*map.once('idle', function() {
      console.log('moveend');
      recolorBasedOnWhatsOnPage();
    }) */

})

map.on('zoomend', function (e) {

    //console.log(map.getZoom());
    //recolorBasedOnWhatsOnPage();

})

map.on('zoom', function (e) {

    /* var outline = map.queryRenderedFeatures({
         layers: ['allsids']
     })

     console.log(outline); */

    if (map.getZoom() < 5) {

        //console.log('hi')
        $('.hexbin-change option[value="hex1"]').prop('disabled', true);
    }

    if (map.getZoom() >= 5) {

        $('.hexbin-change option[value="hex1"]').prop('disabled', false);

    }

    /* if(map.getZoom() <= 4) {

        if(!map.getLayer('allsids')) {
            map.addLayer({
                'id': 'allsids',
                 'type': 'line',
                 'source': 'allsids',
                 'source-layer': 'allSids',
                 'layout': {
                     'visibility': 'visible'
                 },
                 'paint': {
                     'line-color': 'orange',
                     'line-width': 2

                 }
             }, firstSymbolId);

        }

    }

    if(map.getZoom() > 4) {

        if(map.getLayer('allsids')) {
            map.removeLayer('allsids')
        }

    } */

})

//addTheOnClick()

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
            sourceLayer: ['admin1'],
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

        console.log(feats);
        if (feats.length > 1) {

            var newOne = []

            feats.forEach(function (f) {
                var geom = f.geometry
                var props = f.properties
                var id = f.id;

                if (geom.type === 'MultiPolygon') {
                    console.log(f);
                    for (var i = 0; i < geom.coordinates.length; i++) {
                        var poly = {
                            'type': 'Feature',
                            'geometry': {
                                'type': 'Polygon',
                                'coordinates': geom.coordinates[i]
                            },
                            'id': id,
                            'properties': props
                        }
                        newOne.push(poly);
                    }
                } else {
                    newOne.push(f)
                }

            })

            //console.log(turf.polygon(newOne));

            /* for (var x in feats) {
                console.log(feats[x]);
                 if (feats[x].geometry.type === 'MultiPolygon') {
                     ////console.log('multi:')
                     //console.log(feats[x]);
                     for(var z in feats[x].geometry.type)
                     //feats[x].geometry.type = 'Polygon';
                     //feats[x].geometry.coordinates = feats[x]._geometry.coordinates[0]
                 }
             } */
            //var fc = turf.featureCollection(feats)
            var fc = turf.featureCollection(newOne);
            console.log(fc);
            var joined = turf.dissolve(fc);
            //var joined = turf.union(...newOne);
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

        //console.log('change bins');
        //map.setPaintProperty(currentGeojsonLayers.hexSize, 'fill-opacity', 0.7)
        map.moveLayer(sel, 'allsids')

    })

    if (sel === 'admin1') {
        addAdminClick()
    } else {
        //addTheOnClick();
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

    //console.log(layers);
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
        $('#bivar-control').hide();
        $('#dataDropBivar').val('start');
        //document.getElementById('dataDropBivar').selectedOptions[0].innerHTML = 'Select Bivariate Dataset';
    } else {
        changeDataOnMap(layers[0].field_name)
    }

    //$('#' + layers[0].field_name).prop('selected', true);
}

function addToLayersDropBivar(layers) {
    //console.log("layer-bivar!");
    //$('#layer-id-bivar').show()

    //console.log(layers);
    //console.log()
    //console.log(yearList)
    var layersHolder = document.getElementById('layer-drop-bivar');
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
    $('#icon3d').hide()
    $('.hexsize').toggle()
    remove3d();

    const userLayers = ['hex5', 'hex5clipped', 'hex10', 'admin1', 'admin2', 'hex1'];

    for (var x in userLayers) {
        if (map.getLayer(userLayers[x])) {
            // map.setPaintProperty(userLayers[x], 'fill-opacity', 0)
            map.removeLayer(userLayers[x])
        }

    }

    currentGeojsonLayers.breaks = [-4841, -3805, -2608, -1090, 0];
    currentGeojsonLayers.color = colorSeq['ocean'];

    if (map.getLayer('ocean')) {
        map.removeLayer('ocean');
        //map.removeSource('ocean');
    }

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
                -4841, colorSeq['ocean'][0],
                -3805, colorSeq['ocean'][1],
                -2608, colorSeq['ocean'][2],
                -1090, colorSeq['ocean'][3],
                1322, colorSeq['ocean'][4],
            ],
            'fill-opacity': 0.8,
        }
    }, firstSymbolId)

    setTimeout(() => {
        var features = map.queryRenderedFeatures({
            layers: ['ocean']
        })

        if (features) {
            var uniFeatures;
            uniFeatures = getUniqueFeatures(features, 'depth');
            var selecteData = uniFeatures.map(x => x.properties['depth']);
            addLegend(currentGeojsonLayers.color, currentGeojsonLayers.breaks, 2, layer, selecteData);
        }

    }, 600)

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
    //console.log(currentGeojsonLayers)

    if (!map.getSource('hex5')) {
        //console.log('no source')
        addHexSource();
    } else {
        //console.log('source!')
    }

    if (!map.getLayer(currentGeojsonLayers.hexSize)) {

        var current = _.find(sourceData, function (o) {
            return o.name === currentGeojsonLayers.hexSize
        })

        //console.log(firstSymbolId);
        //console.log(current)

        map.addLayer({
            'id': currentGeojsonLayers.hexSize,
            'type': 'fill',
            'source': currentGeojsonLayers.hexSize,
            'source-layer': current.layer,
            'layout': {
                'visibility': 'visible'
            },
            'paint': {
                'fill-color': 'white',
                'fill-opacity': 0.01,

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

        //console.log(features);
        //createMask(features)

        if (features) {

            var uniFeatures;
            if (currentGeojsonLayers.hexSize === 'admin1') {
                uniFeatures = getUniqueFeatures(features, 'GID_1');

            } else if (currentGeojsonLayers.hexSize === 'admin2') {
                uniFeatures = getUniqueFeatures(features, 'GID_2');
            } else {
                uniFeatures = getUniqueFeatures(features, 'hexid');
            }

            var selecteData = uniFeatures.map(x => x.properties[selection])

            var breaks = chroma.limits(selecteData, 'q', 4);
            //console.log("BREAK",breaks)
            var breaks_new = [];
            var precision = 1;
            do {
                precision++;
                for (let i = 0; i < 5; i++) {
                    breaks_new[i] = parseFloat(breaks[i].toPrecision(precision));
                }
                //console.log(breaks_new);
            }
            while (checkForDuplicates(breaks_new) && (precision < 10));
            breaks = breaks_new;

            var colorRamp = colorSeq['yellow-blue'];

            if (selection.substring(0, 2) === '1a') {
                colorRamp = colorDiv['gdpColor'];
            } else if (selection.substring(0, 2) === '1c') {
                colorRamp = colorSeq['pop'];
            } else if (selection === '7d10') {
                colorRamp = colorSeq['combo'];
            } else if (selection === '7d5') {
                colorRamp = colorSeq['minty'];
            } else if (selection === '7d7') {
                colorRamp = colorSeq['blues'];
            } else if (selection === '7d4') {
                colorRamp = colorSeq['pinkish'];
            } else if (selection === '7d8') {
                colorRamp = colorSeq['silvers'];
            } else if (selection === 'd') {
                breaks = [-4841, -3805, -2608, -1090, 1322];
                colorRamp = colorSeq['ocean'];
            }

            currentGeojsonLayers.breaks = breaks;
            currentGeojsonLayers.color = colorRamp;
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
                addLegend(colorRamp, breaks, precision, selection, selecteData);
                setTimeout(() => {
                    map.setPaintProperty(currentGeojsonLayers.hexSize, 'fill-opacity', 0.8)
                }, 100);
            }

            //setTimeout(() => {  map.setPaintProperty(currentGeojsonLayers.hexSize,'fill-opacity', 0.8) }, 700);
            //map.setPaintProperty(currentGeojsonLayers.hexSize,'fill-opacity', 0.8)

        }
        //}

    }, 600)

    map.moveLayer('allsids', firstSymbolId)
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

    var element = document.getElementById("histogram");
    if (typeof (element) != 'undefined' && element != null) {
        $('#histogram').remove();
    }

}

function addLegend(colors, breaks, precision, current, dataset) {

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

    //console.log("colors",colors)
    //console.log("breaks",breaks)
    //console.log("precision",precision)
    //console.log("current",current)
    //console.log("dataset",dataset)    

    // histogram
    var element = document.getElementById("histogram");
    if (typeof (element) != 'undefined' && element != null) {
        $('#histogram').remove();
    }
    $('#histogram_frame').append('<canvas id="histogram" width="320" height="130"><canvas>')
    var canvas = document.getElementById('histogram')

    // break
    var nGroup = 100
    var breaks_histogram = chroma.limits(dataset, 'e', nGroup);
    var histogram_data = Array(nGroup).fill(0);
    for (var i = 0; i < dataset.length; i++) {
        for (var j = 0; j < nGroup - 1; j++) {
            if ((dataset[i] >= breaks_histogram[j]) && (dataset[i] < breaks_histogram[j + 1])) {
                histogram_data[j] += 1
            }
        }
        if (dataset[i] >= breaks_histogram[nGroup - 1]) {
            histogram_data[nGroup - 1] += 1
        }
    }
    //count zero
    var count_zero = 0;
    for (var i = 0; i < histogram_data.length; i++) {
        if (histogram_data[i] == 0) count_zero++;
    }

    // re-calculation
    //console.log(nGroup,count_zero)
    nGroup = nGroup * ((nGroup - count_zero) / nGroup);
    breaks_histogram = chroma.limits(dataset, 'e', nGroup);
    histogram_data = Array(nGroup).fill(0);
    for (var i = 0; i < dataset.length; i++) {
        for (var j = 0; j < nGroup - 1; j++) {
            if ((dataset[i] >= breaks_histogram[j]) && (dataset[i] < breaks_histogram[j + 1])) {
                histogram_data[j] += 1
            }
        }
        if (dataset[i] >= breaks_histogram[nGroup - 1]) {
            histogram_data[nGroup - 1] += 1
        }
    }
    //console.log("Number of groups in histogram: ", nGroup);

    // color
    var break_index = 0;
    var histogram_break_count = Array(4).fill(0);
    for (var i = 0; i < nGroup; i++) {
        if (breaks_histogram[i] > breaks[break_index + 1])
            break_index += 1;
        histogram_break_count[break_index] += 1;
    }
    var colorRampNew = [];
    for (var i = 0; i < 4; i++) {
        colorRampPart = chroma.scale([colors[i], colors[i + 1]]).mode('lch').colors(histogram_break_count[i]);
        colorRampNew = colorRampNew.concat(colorRampPart);
        //console.log(colorRampNew);
    }

    // precision
    var breaks_precision = []
    for (i = 0; i < breaks_histogram.length; i++) {
        breaks_precision.push(nFormatter(breaks_histogram[i], precision))
    }
    //console.log("breaks_precision:",breaks_precision)

    //var colorRampN = chroma.scale([colors[0], colors[4]]).mode('lch').colors(nGroup) // yellow to dark-blue

    var data = {
        labels: breaks_precision.slice(0, -1),
        datasets: [{
            data: histogram_data,
            backgroundColor: colorRampNew,
        }]
    };

    var maxY = Math.pow(10, Math.ceil(Math.log10(Math.max(...histogram_data))));
    var minY = Math.pow(10, Math.ceil(Math.log10(Math.min(...histogram_data))));

    //console.log(maxY,minY);
    //console.log(Math.min(...histogram_data));
    var option = {
        responsive: true,
        tooltips: {
            enabled: true
        },
        legend: {
            display: false
        },
        annotation: {
            annotations: [
                {
                    type: "line",
                    mode: "vertical",
                    scaleID: "x-axis-0",
                    value: "70%",
                    borderColor: "black",
                    label: {
                        content: "Your Score",
                        enabled: true,
                        position: "center"
                    }
                }]
        },
        scales: {
            borderWidth: 0,
            yAxes: [{
                display: true,
                type: "logarithmic",

                ticks: {
                    //scaleStepWidth: 10,
                    maxTicksLimit: 4,
                    //autoSkip: true,
                    //stepSize:10,                                     
                    max: maxY,
                    //min: 1,
                    callback: function (value, index, values) {
                        if (value === 100000000) return "100M";
                        if (value === 10000000) return "10M";
                        if (value === 1000000) return "1M";
                        if (value === 100000) return "100K";
                        if (value === 10000) return "10K";
                        if (value === 1000) return "1K";
                        if (value === 100) return "100";
                        if (value === 10) return "10";
                        if (value === 1) return "1";
                        return null;

                    }
                },
                afterBuildTicks: function (chartObj) { //Build ticks labelling as per your need
                    chartObj.ticks = [];
                    var ticksScale = maxY;
                    while ((ticksScale > minY) && (ticksScale >= 1)) {
                        //console.log(ticksScale);
                        chartObj.ticks.push(ticksScale);
                        ticksScale /= 10;
                    }

                }

            }],
            xAxes: [{
                barPercentage: 1.0,
                categoryPercentage: 1.0,
                gridLines:
                {
                    display: true
                },
                scaleLabel:
                {
                    display: false,
                    labelString: legData.units
                },
                ticks: {
                    maxTicksLimit: 10

                }
            }]
        }
    };

    var myHistogram = Chart.Bar(canvas, {
        data: data,
        options: option
    });
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
var sdg = [
    {
        title: "No Poverty",
        content: "To end poverty in all its forms, everywhere, through a powerful commitment to leave no one behind and to reach those fathest behind first."
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
];

$('#layer-id').hide()
$('#layer-id-bivar').hide()
$('#dataDropBivar').val('start');
//document.getElementById('dataDropBivar').selectedOptions[0].innerHTML = 'Select Bivariate Dataset';
//$('#bivar-control').val(0);
$('.year-timeline-wrapper').hide()

//$(document).ready(function () {
/** Collapse/Expand for Box  */
$('.bottom-left').on('click', function () {
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

function resetData() {

    var w = $('#dataDrop')[0].options
    for (var z in w) {
        $('#dataDrop option[id=' + w[z].id + ']').show()
    }

    $('#resetData').toggle();
    console.log('ResetData!')

}
/**sdg grid hover */
$(".sdgs .icon-grid-item").click(function () {

    if (!$('#resetData').is(':visible')) {
        $('#resetData').toggle();

    }
    //$('#resetData').toggle();
    /*if($('#layer-id').is(':visible')) {
        $('#layer-id').hide()
    } */

    var w = $('#dataDrop')[0].options
    //console.log(w);
    for (var z in w) {
        //console.log(w[z].id)
        $('#dataDrop option[id=' + w[z].id + ']').show()
    }

    $("#sdg_slider .carousel-item").removeClass("active");
    var index = $(this).data('imgid');
    //console.log(index);
    var filtered = _.filter(allLayers, function (o) { return o.sdg.includes(index) })
    //console.log(allLayers)
    var filteredSDG = filtered.map(x => x.field_name)
    //console.log(filteredSDG)

    // var w = $('#dataDrop')[0].options
    for (var x in w) {
        //console.log(w[x].id)
        if (!filteredSDG.includes(w[x].id)) {
            //console.log('dropped')
            $('#dataDrop option[id=' + w[x].id + ']').hide()
        }
    }

    $("#sdg_slider div[data-imgid='" + index + "']").addClass("active");
});

/**samoa grid hover */
$(".samoa-grid .icon-grid-item").click(function () {
    if (!$('#resetData').is(':visible')) {
        $('#resetData').toggle();

    }

    var w = $('#dataDrop')[0].options
    for (var z in w) {
        $('#dataDrop option[id=' + w[z].id + ']').show()
    }

    $("#SAMOA_slider .carousel-item").removeClass("active");
    var index = $(this).data('imgid');
    $("#SAMOA_slider div[data-imgid='" + index + "']").addClass("active");
    var filtered = _.filter(allLayers, function (o) { return o.samoa_path.includes(index) })
    var filteredSamoa = filtered.map(x => x.field_name)
    //console.log(allLayers.length)
    console.log(filtered)
    console.log('add');
    console.log('remov');

    for (var x in w) {
        console.log(x)
        if (!filteredSamoa.includes(w[x].id)) {
            $('#dataDrop option[id=' + w[x].id + ']').hide()
        }
    }
});

// hover for economy
$(".BE, #tooleconnomy").mouseover(function () {
    $("#tooleconomy").removeClass("d-none");
});
$(".BE, #tooleconomy").mouseout(function () {
    $("#tooleconomy").addClass("d-none");
});

$('.BE').click(function () {
    if (!$('#resetData').is(':visible')) {
        $('#resetData').toggle();

    }
    var index = 1;
    var w = $('#dataDrop')[0].options
    for (var z in w) {
        $('#dataDrop option[id=' + w[z].id + ']').show()
    }
    console.log('BE')

    var filtered = _.filter(allLayers, function (o) { return o.pillar.includes(index) })
    var filteredBE = filtered.map(x => x.field_name)

    for (var x in w) {
        console.log(x)
        if (!filteredBE.includes(w[x].id)) {
            $('#dataDrop option[id=' + w[x].id + ']').hide()
        }
    }

})
$('.CA').click(function () {
    if (!$('#resetData').is(':visible')) {
        $('#resetData').toggle();

    }
    var index = 2;
    var w = $('#dataDrop')[0].options
    for (var z in w) {
        $('#dataDrop option[id=' + w[z].id + ']').show()
    }

    console.log('CA')

    var filtered = _.filter(allLayers, function (o) { return o.pillar.includes(index) })
    var filteredCA = filtered.map(x => x.field_name)

    for (var x in w) {
        console.log(x)
        if (!filteredCA.includes(w[x].id)) {
            $('#dataDrop option[id=' + w[x].id + ']').hide()
        }
    }
})

$('.DT').click(function () {
    if (!$('#resetData').is(':visible')) {
        $('#resetData').toggle();

    }
    var index = 3;
    var w = $('#dataDrop')[0].options
    for (var z in w) {
        $('#dataDrop option[id=' + w[z].id + ']').show()
    }
    console.log('DT')

    var filtered = _.filter(allLayers, function (o) { return o.pillar.includes(index) })
    var filteredDT = filtered.map(x => x.field_name)

    for (var x in w) {
        console.log(x)
        if (!filteredDT.includes(w[x].id)) {
            $('#dataDrop option[id=' + w[x].id + ']').hide()
        }
    }
})

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

// better to find a different way to avoid global variables
var main_var = '';
var bi_var = '';

$('select[name="dataset-selection"]').on('change', function () {
    //console.log('Dataset: ' + $(this).val());
    //console.log(map.getStyle().layers)

    if (map.getLayer('newone')) {
        map.removeLayer('newone');
        map.removeSource('newone');
    }
    if ($(this).val() != 'start')
        $('#bivar-control').show();
    else
        $('#bivar-control').hide();
    $('#histogram_frame').show();

    main_var = this.selectedOptions[0].id;
    bi_var = '';

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
    //document.getElementById('dataDropBivar').selectedOptions[0].innerHTML = 'Select Bivariate Dataset';
    $('#dataDropBivar').val('start');

    if (this.selectedOptions[0].className === 'basemap') {
        $('#bivar-control').hide();

        //document.getElementById('dataDropBivar').selectedOptions[0].innerHTML = 'Select Bivariate Dataset';
        $('#layer-id').hide()
        $('#icon3d').hide()
        $('.year-timeline-wrapper').hide()
        $('.opacityslider').hide()
        $('.download').hide()
        //map.removeControl(Draw);
        //console.log('basemap')
        //console.log(map.getStyle().sources)
        //console.log(styles)
        if (map.getLayer(currentGeojsonLayers.hexSize)) {
            map.removeLayer(currentGeojsonLayers.hexSize)
        }

        var lyr = this.selectedOptions[0].innerHTML;
        legend.innerHTML = '';
        legendTitle.innerHTML = '';
        infoBoxTitle.innerHTML = lyr;
        infoBoxText.innerHTML = '';
        infoBoxLink.innerHTML = '';

        var element = document.getElementById("histogram");
        if (typeof (element) != 'undefined' && element != null) {
            $('#histogram').remove();
        }

        //if (map.getStyle().name != 'Mapbox Satellite Streets') {

        var thisStyle = _.find(styles, function (o) {
            return o.title === 'Satellite With Labels'
        })
        map.setStyle(thisStyle.uri)
        //addHexSource()
        //addLabels();
        //console.log('hi')
        //}

        //addLabels();
        var layers = map.getStyle().layers;

        if (layers.length <= 3) {
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
        //console.log(this.selectedOptions[0].innerHTML)
        $('.year-timeline-wrapper').show()
        $('#layer-id').hide()
        $('.opacityslider').show()
        $('.download').show()
        $('#icon3d').show()
        //map.addControl(Draw, 'bottom-right');

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
        //map.addControl(Draw, 'bottom-right');
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
        addToLayersDropBivar(layers);

    } else {
        //$('#icon3d').hide()
        $('.opacityslider').show()
        $('.download').show()
        $('#icon3d').show()
        //map.addControl(Draw, 'bottom-right');
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

$('select[name="dataset-selection-bivar"]').on('change', function () {

    $('#histogram_frame').hide();
    if (this.selectedOptions[0].innerHTML == 'Select Bivariate Dataset') {
        bi_var = '';
        if (map.getLayer('newone')) {
            map.removeLayer('newone');
            map.removeSource('newone');
        }
    } else {
        bi_var = this.selectedOptions[0].id;
        var features = map.queryRenderedFeatures({
            layers: [currentGeojsonLayers.hexSize]
        })

        if (features) {
            console.log();

            var uniFeatures;
            if (currentGeojsonLayers.hexSize === 'admin1') {
                uniFeatures = getUniqueFeatures(features, 'GID_1');

            } else if (currentGeojsonLayers.hexSize === 'admin2') {
                uniFeatures = getUniqueFeatures(features, 'GID_2');
            } else {
                uniFeatures = getUniqueFeatures(features, 'hexid');
            }

            // bi-var
            var selection = main_var;
            var selection_bivar = bi_var;

            var selecteData = uniFeatures.map(x => x.properties[selection])
            var selecteData_biv = uniFeatures.map(x => x.properties[selection_bivar]);//popden
            var breaksX = chroma.limits(selecteData, 'q', 3);
            var breaksY = chroma.limits(selecteData_biv, 'q', 3);
            var bivar_colors = colorSeqSeq3['blue-pink-purple'];

            var featureCount = uniFeatures.length;
            var bivarClass = Array(featureCount).fill(0);
            var breaksX = chroma.limits(selecteData, 'q', 3);
            var breaksY = chroma.limits(selecteData_biv, 'q', 3);

            for (var i = 0; i < featureCount; i++) {
                var x = selecteData[i];
                var y = selecteData_biv[i];
                var v1, v2;
                if (x < breaksX[1])
                    v1 = 1
                else if (x < breaksX[2])
                    v1 = 2
                else v1 = 3;
                if (y < breaksY[1])
                    v2 = 1
                else if (y < breaksY[2])
                    v2 = 2
                else v2 = 3;
                switch (String(v1) + String(v2)) {
                    case "11": bivarClass[i] = 1; break;
                    case "12": bivarClass[i] = 2; break;
                    case "13": bivarClass[i] = 3; break;
                    case "21": bivarClass[i] = 4; break;
                    case "22": bivarClass[i] = 5; break;
                    case "23": bivarClass[i] = 6; break;
                    case "31": bivarClass[i] = 7; break;
                    case "32": bivarClass[i] = 8; break;
                    case "33": bivarClass[i] = 9; break;
                }
                uniFeatures[i]["properties"]["bivarClass"] = bivarClass[i];
            }

            //convert rendered features to geojson format
            var fc = turf.featureCollection(uniFeatures);

            if (map.getLayer('newone')) {
                map.removeLayer('newone');
                map.removeSource('newone');
            }

            //add new source 
            map.addSource('newone', {
                type: 'geojson',
                data: fc //data is the new geojson 
            })
            map.addLayer({
                'id': 'newone',
                'source': 'newone',
                'type': 'fill',
                'paint': {
                    'fill-color':
                        [
                            'step',
                            ['get', 'bivarClass'],
                            bivar_colors[0],
                            1, bivar_colors[1],
                            2, bivar_colors[2],
                            3, bivar_colors[3],
                            4, bivar_colors[4],
                            5, bivar_colors[5],
                            6, bivar_colors[6],
                            7, bivar_colors[7],
                            8, bivar_colors[8],
                        ],
                    'fill-opacity': 0.9,
                }
            })

        }
    }

});

$('select[name="hexbin-change"]').on('change', function () {

    console.log(this.selectedOptions[0].value);
    changeHexagonSize(this.selectedOptions[0].value)
})

/*$('select[name="overlay-select"]').on('change', function() {

/*$('#updateLegend').click(function(e){

  var bg = $(e.target).css('background-color');
  console.log(bg)
  var r = parseInt(bg.match(/\d+/g)[0]);
  var g = parseInt(bg.match(/\d+/g)[1]);
  var b = parseInt(bg.match(/\d+/g)[2]);

  console.log(r + ' ' + g + ' ' + b + ' ')

}) */

//$("input:checkbox").change(function () {
$("input[name=overlay]").change(function () {

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
            slayer = 'admin1'
            color = 'red'
        } else if (clicked === 'admin2-overlay') {
            source = 'admin2'
            slayer = 'admin2'
            color = '#003399'
        } else if (clicked === 'allsids') {
            //console.log('sids!')
            source = 'allsids'
            slayer = 'allSids'
            color = 'orange'
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
                'line-width': 1

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
                    'line-width': 2
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
            //console.log('is omega');
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
    //console.log($(this).val());
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

//screenshot button functions
$('#screenshot').click(function () {

    $('#top-right-wrap').toggle();
    html2canvas($('#map'), {
        onrendered: function (canvas) {
            console.log(canvas);
            var img = canvas.toDataURL();
            window.open(img)
        }
    });

    setTimeout(() => { $('#top-right-wrap').toggle() }, 1000)
    //$('.population-density-box')
    //$('.population-per-km')

})

//download button functions
$('#datadownload').click(function () {

    console.log(currentGeojsonLayers.hexSize)
    //openDownloadPage()

    if (hexes.includes(currentGeojsonLayers.hexSize)) {

        var features = map.queryRenderedFeatures({
            layers: [currentGeojsonLayers.hexSize]
        })

        if (features) {

            var uniFeatures;
            uniFeatures = getUniqueFeatures(features, 'hexid');

            //console.log(features)
            //console.log(uniFeatures);

            map.addSource('screen', {
                type: 'geojson',
                data: {
                    'type': 'FeatureCollection',

                    'features': uniFeatures
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

            var gdata = uniFeatures//map.getSource('screen')._data;

            //exportGeojson(gdata);
            openDownloadPage(currentGeojsonLayers.hexSize, gdata);

        }

    } else if (admins.includes(currentGeojsonLayers.hexSize)) {

        console.log('hi')
        var features = map.queryRenderedFeatures({
            layers: ['allsids']
        })

        console.log(features)
        var currentC = features.map(x => x.properties.NAME_0)

        console.log(currentC);

        var features1 = map.queryRenderedFeatures({
            layers: [currentGeojsonLayers.hexSize]
        })

        newOne = []

        var propers = {}

        features1.forEach(function (f) {
            var geom = f.geometry
            var props = f.properties
            var id = f.id;
            propers[id] = props

            if (geom.type === 'MultiPolygon') {
                console.log(f);
                for (var i = 0; i < geom.coordinates.length; i++) {
                    var poly = {
                        'type': 'Feature',
                        'geometry': {
                            'type': 'Polygon',
                            'coordinates': geom.coordinates[i]
                        },
                        'id': id,
                        'properties': props
                    }
                    newOne.push(poly);
                }
            } else {
                newOne.push(f)
            }

        })

        var fc = turf.featureCollection(newOne)
        console.log(fc);

        var propName = 'GID_2'

        if (currentGeojsonLayers.hexSize === 'admin1') {
            propName = 'GID_1'
        }

        var diss = turf.dissolve(fc, { propertyName: propName })

        for (var x in diss.features) {
            if (currentGeojsonLayers.hexSize === 'admin2') {
                var curr = diss.features[x].properties.GID_2;
            } else {
                var curr = diss.features[x].properties.GID_1;
            }

            console.log(curr)

            diss.features[x].properties = propers[curr]
        }

        console.log(diss)
        openDownloadPage(currentGeojsonLayers.hexSize, diss);

        map.addSource('screen', {
            type: 'geojson',
            data: {
                'type': 'FeatureCollection',

                'features': []
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

        map.getSource('screen').setData(diss)

    }

});

function openDownloadPage(hexsize, gdata) {
    //console.log(gdata);

    var allTheFieldIds = allLayers.map(x => x.field_name);
    var allCountries = names.map(x => x.NAME_0)
    //console.log(allTheFieldIds);
    var allCountriesChecked = [];
    var allAttributesChecked = [];
    var allResolutionsChecked = [];
    var removeOnes = _.difference(allTheFieldIds, allAttributesChecked);
    $('.modal').toggle();
    //$('.loader-gis').hide()

    $('#shp').click(function () {
        exportShp(hexsize, gdata, removeOnes);
    })
    $('#gjn').click(function () {
        exportGeojson(hexsize, gdata, removeOnes);

    })

    /* $(':checkbox[name=res]').on('click', function(){

         var checkedBoxlength=$(':checkbox[name=res]:checked').length;
             if(checkedBoxlength>1){
                 alert('Only 1 Resolution at a time');
                 return false;
             }
     }) */

    $('input:checkbox').change(function () {

        var thisid = $(this)[0].id
        allAttributesChecked.push(thisid);

        /*   if ($(this).is(":checked")) {

               if(allCountries.includes(thisid)) {
                   allCountriesChecked.push(thisid)
               } else if(userLayers.includes(thisid)) {
                   allResolutionsChecked.push(thisid)
               } else {
                   allAttributesChecked.push(thisid);
               }
           } */
    })

}

function exportShp(hexsize, obj, removeOnes) {

    var fc = obj;

    if (hexes.includes(hexsize)) {
        fc = turf.featureCollection(obj)
    }

    //console.log(obj);

    var fc = turf.featureCollection(obj)

    for (var x in fc.features) {
        for (var y in removeOnes) {
            delete fc.features[x].properties[removeOnes[y]]
        }
    }

    console.log(fc)

    const options = {
        folder: 'SIDSshapefile',
        types: {
            polygon: currentGeojsonLayers.hexSize.toString()
        }
    }
    shpwrite.download(fc, options);
    $('.modal').toggle();

}

function exportGeojson(hexsize, gdata, removeOnes) {

    var fc = gdata;

    if (hexes.includes(hexsize)) {
        fc = turf.featureCollection(gdata)
    }

    //var fc = turf.featureCollection(gdata)

    convertThis(fc);

    //var webdata = encodeURIComponent(JSON.stringify(fc))

    //window.open('http://geojson.io/#data=data:application/json,' + webdata);

    function convertThis(fc) {

        //console.log(fc)

        //var fc = turf.featureCollection(feats)
        for (var x in fc.features) {

            for (var y in removeOnes) {

                delete fc.features[x].properties[removeOnes[y]]
            }

        }
        var webdata = encodeURIComponent(JSON.stringify(fc))

        window.open('http://geojson.io/#data=data:application/json,' + webdata);

        /*function mapArray(ar) {

            return _.map(ar.features, object =>
                _.omit(object, ['_vectorTileFeature', 'layer', 'source', 'sourceLayer', 'state'])
            );

        }
        var resultz = mapArray(feats)
        console.log(resultz);

        resultz.forEach(function (x) {
            x.geometry = x._geometry
            delete x._geometry
        }) */

    }

    //console.log(resultz)

    /* var fc = turf.featureCollection(resultz)

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
     link.delete; */

    var datastring = '';
    $('.modal').toggle();
    map.removeLayer('screenshot')
    map.removeSource('screen');

}

$('.close').click(function () {
    map.setFilter(currentGeojsonLayers.hexSize, ['>=', currentGeojsonLayers.dataLayer, 0])
    $('.modal').toggle();
    // map.setZoom(oldZoom);
    //map.setCenter(oldCenter)
    map.removeLayer('screenshot')
    map.removeSource('screen');

})

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
    $(this).toggleClass('collapsed');
    console.log('hi')

    if (!$('#top-right-wrap').hasClass('moved')) {
        $('#top-right-wrap').css('right', '-250px')
        $('#top-right-wrap').addClass('moved')

    } else {
        $('#top-right-wrap').css('right', '10px')
        $('#top-right-wrap').removeClass('moved')

    }

})