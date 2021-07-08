var allLayers = []
var firstSymbolId;
addButtons();


/*Initialize Map */
mapboxgl.accessToken =
  "pk.eyJ1Ijoic2ViYXN0aWFuLWNoIiwiYSI6ImNpejkxdzZ5YzAxa2gyd21udGpmaGU0dTgifQ.IrEd_tvrl6MuypVNUGU5SQ";

  const map = new mapboxgl.Map({
    container: "map", // container ID
    //style: 'mapbox://styles/mapbox/light-v10?optimize=true', //?optimize=true
    style: 'mapbox://styles/mapbox/satellite-streets-v11', 
    center: [-71.4, 19.1], // starting position [lng, lat]
    zoom: 7,
    //maxZoom: ,
    //minZoom: 
    //pitch: 55
  });

  var yearList = [];
  var currentTimeLayer;

  var sourceData = {
      hex5Source: {
        name: 'hex5',
        data: null
      },
      hex10Source: {
        name: 'hex10',
        data: null
      },
      admin1Source: {
        name: 'admin1',
        data: null
      },
      admin2Source: {
        name: 'admin2',
        data: null
      },
      hex1Source: {
          name: 'hex1',
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
    // Find the index of the first symbol layer in the map style
    for (var i = 0; i < layers.length; i++) {
    if (layers[i].type === 'symbol') {
    firstSymbolId = layers[i].id;
    break;
    }
    }

    map.removeLayer('admin-1-boundary')
    map.addControl(new mapboxgl.ScaleControl(), 'bottom-right');
    //$('.loader-gis').remove()
    addHexSource()
    //addTileSources()

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

  map.on('data', function (data) {
      if (data.dataType === 'source' && data.isSourceLoaded) {
        if(data.sourceId === currentGeojsonLayers.hexSize && data.style._loaded) {
          //console.log('end')
          //changeDataOnMap(currentGeojsonLayers.dataLayer);
          //colorTheMap()
          
        }
        //console.log(map.getZoom())
        /*if(data.sourceId === currentGeojsonLayers.hexSize) {
          console.log('this: ', data)
        } */
        //console.log('data loaded', data)
        
        // stop listening to map.on('data'), if applicable
      }
    })

   /* var popup = new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: false
      });

  map.on('click', currentGeojsonLayers.hexSize, function(e){

    //console.log(currentGeojsonLayers.dataLayer);
    //console.log(e.features[0].properties)

    //var coords = e.features[0].geometry.coordinates.slice();
    console.log(e.features[0].geometry)
    var text = e.features[0].properties[currentGeojsonLayers.dataLayer]
    popup.setLngLat(e.lngLat).setHTML(text).addTo(map);
  }) */

  function recolorBasedOnWhatsOnPage() {

    var features = map.queryRenderedFeatures({
      layers: [currentGeojsonLayers.hexSize]
    })

    if(features) {

      var uniFeatures;
        if(currentGeojsonLayers.hexSize === 'admin1') {
          uniFeatures = getUniqueFeatures(features, 'GID_1');
        } else if (currentGeojsonLayers.hexSize === 'admin2') {
          uniFeatures = getUniqueFeatures(features, 'GID_2');
        } else {
          uniFeatures = getUniqueFeatures(features, 'hexid');
        }


      var selecteData = uniFeatures.map(x => x.properties[currentGeojsonLayers.dataLayer])
      //console.log(selecteData);
      var breaks = chroma.limits(selecteData, 'q', 4)
      console.log(breaks)
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
       
        map.setPaintProperty(currentGeojsonLayers.hexSize,'fill-opacity', 0.0)
        setTimeout(() => { map.setFilter(currentGeojsonLayers.hexSize, null) }, 1000);
        addNoDataLegend();
      } else {
        map.setFilter(currentGeojsonLayers.hexSize,['>=',currentGeojsonLayers.dataLayer, 0])
        addLegend(currentGeojsonLayers.color, breaks, currentGeojsonLayers.dataLayer)
        setTimeout(() => {  map.setPaintProperty(currentGeojsonLayers.hexSize,'fill-opacity', 0.8) }, 400);
      }
    } 
    

  }

  const baseMapSwitcher = document.getElementById('basemap-switch');
  const styles = [
    {'title': "Satellite With Labels",'uri': "mapbox://styles/mapbox/satellite-streets-v11",},
    {'title': "Light",'uri': "mapbox://styles/mapbox/light-v10",},
    {'title': "Satellite Imagery", 'uri': "mapbox://styles/mapbox/satellite-v9",},
   
  ];

  baseMapSwitcher.addEventListener('click', (event) => {

    const isOption = event.target.nodeName === "OPTION";
    if (!isOption) {
      return;
    }

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
                    'tiles': [
                      //otherhex
                      sourceData[x].data
                    ],
                    'minzoom': 6,
                    'maxzoom': 10
                  })
                console.log(sourceData[x].name + ';;')
    
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

  })

  
  const button3dWrapper = document.getElementById('icon3d')

  button3dWrapper.addEventListener('click', (event) => {

    var id3d = currentGeojsonLayers.hexSize + '-3d'

    if(map.getLayer(id3d)) {
      console.log('yooo')
      map.removeLayer(id3d);
      //map.setBearing(70)
      map.easeTo({
        center: map.getCenter(),
        pitch: 0,
    
      })
    } else {

    
    //rotateCamera(0)

    map.addLayer({
      'id': id3d,
      'type': 'fill-extrusion', 
      'source': currentGeojsonLayers.hexSize,
      'source-layer': 'hex5_3857',
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
            'fill-extrusion-height': ['get', currentGeojsonLayers.dataLayer]
          //'fill-opacity': 0.8,
        
          }
      }, firstSymbolId);

      map.setFilter(id3d,['>=',currentGeojsonLayers.dataLayer, 0])
      map.easeTo({
        center: map.getCenter(),
        pitch: 55
    
      })
    }
  })

  /*const flyButton = document.getElementById('button');
  flyButton.addEventListener('click', (event) => {

    map.flyTo({
      center: [-58.176, 8.718],
      zoom: 7,
      //speed: 0.1,
      essential: true

    })

    map.once('idle', function(e) {
         
      recolorBasedOnWhatsOnPage();
      //console.log('county select');
     // map.setPaintProperty(currentGeojsonLayers.hexSize, 'fill-opacity', 0.7)
    
    })


  }) */

  const wrapper = document.getElementById('country-select');
  wrapper.addEventListener('click', (event) => {
    console.log(map.getZoom())
    const isOption = event.target.nodeName === "OPTION";
    if (!isOption) {
      return;
    }

    console.log(event.target.id);

        map.setPaintProperty(currentGeojsonLayers.hexSize, 'fill-opacity', 0)
        var currbb = _.find(names, ['GID_0', event.target.id ])

        //sourceData.allSidsSource.lastName = currbb.NAME_0;

        var v2 = new mapboxgl.LngLatBounds([currbb.bb[0], currbb.bb[1]])
          map.fitBounds(v2, {
          linear: true,
          padding: {top: 10, bottom:25, left: 15, right: 5},
          pitch: 0
        });

        map.once('idle', function(e) {
         
          recolorBasedOnWhatsOnPage();
          console.log('county select');
          //map.setPaintProperty(currentGeojsonLayers.hexSize, 'fill-opacity', 0.7)
        
        })
  })


  map.on('dragend', function(e){

    console.log('dragend');
    recolorBasedOnWhatsOnPage();

    /*map.once('idle', function() {
      console.log('moveend');
      recolorBasedOnWhatsOnPage();
    }) */

  })

  /*map.on('zoomend', function(e){

    console.log('zoomend');
    recolorBasedOnWhatsOnPage();

    

  }) */




  function changeHexagonSize(sel) {

    console.log(map.getStyle())
    remove3d()
    currentGeojsonLayers.hexSize = sel
    console.log(sel);
    
    var slayer;
    const userLayers = ['hex5', 'hex10', 'admin1', 'admin2', 'hex1'];

    for (var x in userLayers) {
      if(map.getLayer(userLayers[x])) {
        map.removeLayer(userLayers[x])
      }
      
    }

    if(sel === 'hex5') {
        var slayer = 'hex5_3857';

        map.addLayer({
            'id': sel,
            'type': 'fill', 
            'source': sel,
            'source-layer': slayer,
            'layout': {
              'visibility': 'visible'
              },
              'maxzoom': 10,
              'minzoom': 6,
            
            'paint': {
                'fill-color': 'blue',
                'fill-opacity': 0,
                         
                }
            }, firstSymbolId);

    
    /*if(sel === 'hex1' || sel === 'hex5' || sel === 'hex10') {
      var slayer;
      if(sel === 'hex5'){
        slayer = 'hex5_3857'
      } else if(sel === 'hex10') {
        slayer='hex-10km'
      } else {
        slayer = 'hex-1km'
      } */

        
    } else {

        map.addLayer({
            'id': sel,
            'type': 'fill', 
            'source': sel,
            'layout': {
              'visibility': 'visible'
              },
            
            'paint': {
                'fill-color': 'blue',
                'fill-opacity': 0,
                
                
                }
            }, firstSymbolId);

    }


      if(map.getStyle().name === 'Mapbox Satellite') {
        map.moveLayer(sel);
      }

      map.once('idle', function(e) {
         
        recolorBasedOnWhatsOnPage();
        console.log('change bins');
        //map.setPaintProperty(currentGeojsonLayers.hexSize, 'fill-opacity', 0.7)
      
      })

  }

  
  function remove3d() {

    var lay = map.getStyle().layers;
    //console.log(lay);
    var threedee = _.find(lay, function(o){return o.type === 'fill-extrusion'});
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
    

      for (var i = length-1; i >= 0; i--) {
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
    
    changeDataOnMap(layers[0].field_name)
    //$('#' + layers[0].field_name).prop('selected', true);
  }

  function changeDataOnMap(selection) {

    //console.log(map.getStyle().layers)

    //console.log(selection)
    remove3d()
    //console.log(map.getStyle().layers)
    //console.log(selection);
    currentGeojsonLayers.dataLayer = selection;
    //console.log(currentGeojsonLayers.dataLayer)

    if(map.getLayoutProperty(currentGeojsonLayers.hexSize, 'visibility', 'none')) {
      map.setLayoutProperty(currentGeojsonLayers.hexSize,'visibility','visible')
    }
    if(map.getLayoutProperty(currentGeojsonLayers.hexSize, 'visibility','visible')) {

      var features = map.queryRenderedFeatures({
        layers: [currentGeojsonLayers.hexSize]
      })
  
      if(features) {

        var uniFeatures;
        if(currentGeojsonLayers.hexSize === 'admin1') {
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
        var breaks = chroma.limits(selecteData, 'q', 4)
        //console.log(breaks)
        
        var colorRamp = chroma.scale(['#fafa6e','#2A4858']).mode('lch').colors(5)
        var colorRamp1 = ['#edf8fb', '#b2e2e2','#66c2a4','#2ca25f', '#006d2c' ]
        var colorRamp2 = ['#f2f0f7','#cbc9e2' ,'#9e9ac8' , '#756bb1' , '#54278f' ]
        var colorRamp4 = ['#ffffd4','#fed98e','#fe9929','#d95f0e','#993404']
        var gdpColor = ['#ca0020','#f4a582', '#f7f7f7', '#92c5de', '#0571b0']
        var pop = ['#feebe2', '#fbb4b9', '#f768a1', '#c51b8a', '#7a0177']
        var sunIndex = ['#fdfbf6', '#FAE7B9', '#FAE39B', '#FADE7C', '#FADA5E']
        var template = ['','', '', '', '']
        var newSun = ['#FEF65C','#FEE745', '#FFD82F', '#FFC918', '#FFBA01']
        var combo = ['#fdfbf6','#FEE745', '#FFD82F', '#FFC918', '#FFBA01']
        var pinkish = ['#f8eff1','#f1d2d4', '#e7a9b1', '#c65e6a', '#af3039']
        var blues = ['#ABD7EC','#59C1E8', '#3585DA', '#1061B0', '#003C72']
        var silvers = ['#BEBEBE','#AFAFAF', '#9F9F9F', '#909090', '#808080']
        //var pop1 = ['#f6eff7', '#bdc9e1', '#67a9cf', '#1c9099', '#016c59']
        //console.log(colorz.classes)
        //var ramps = [colorRamp1, colorRamp2, colorRamp3, colorRamp4]
        var minty = ['#aaf0d1','#96e6c2', '#7dd8b5', '#5ec69d', '#3eb489']
        //var colorRamp = ramps[Math.floor(Math.random() * 4)];
        if(selection.substring(0,2) === '1a') {
          colorRamp = gdpColor;
        } else if(selection.substring(0,2) === '1c')  {
          colorRamp = pop;

        } else if( selection === '7d10') {
          colorRamp = combo
        } else if(selection === '7d5') {
          colorRamp = minty
        } else if (selection === '7d7') {
          colorRamp = blues;
        } else if (selection === '7d4') {
          colorRamp = pinkish;
        } else if (selection === '7d8') {
          colorRamp = silvers;
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
        ['case',['boolean', ['feature-state', 'hover'], false],
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
          
          map.setPaintProperty(currentGeojsonLayers.hexSize,'fill-opacity', 0.0)
          setTimeout(() => { map.setFilter(currentGeojsonLayers.hexSize, null) }, 1000);
          addNoDataLegend();
        } else {
          map.setFilter(currentGeojsonLayers.hexSize,['>=',selection, 0])
          addLegend(colorRamp, breaks, selection)
          setTimeout(() => {  map.setPaintProperty(currentGeojsonLayers.hexSize,'fill-opacity', 0.7) }, 500);
        }
        
        //setTimeout(() => {  map.setPaintProperty(currentGeojsonLayers.hexSize,'fill-opacity', 0.8) }, 700);
        //map.setPaintProperty(currentGeojsonLayers.hexSize,'fill-opacity', 0.8)
        

  }
}
  }


  

  function colorTheMap() {

    if(map.getLayer(currentGeojsonLayers.hexSize)) {
      var features = map.queryRenderedFeatures({
        layers: [currentGeojsonLayers.hexSize]
      })
  
      if(features) {
  
        var uniFeatures;
          if(currentGeojsonLayers.hexSize === 'admin1') {
            uniFeatures = getUniqueFeatures(features, 'GID_1');
          } else {
            uniFeatures = getUniqueFeatures(features, 'hexid');
          }
        //console.log(uniFeatures[0].properties._mean);
        //console.log(uniFeatures);
        var selecteData = uniFeatures.map(x => x.properties[currentGeojsonLayers.dataLayer])
        console.log(selecteData);
        var max = Math.max(...selecteData)
        var min = Math.min(...selecteData)
  
        var breaks = chroma.limits(selecteData, 'q', 4)
        //console.log(breaks);
        currentGeojsonLayers.breaks = breaks;
  
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
      }
    }

    if (isNaN(breaks[3]) || breaks[1] === 0) {
      map.setPaintProperty(currentGeojsonLayers.hexSize,'fill-opacity', 0.0)
      setTimeout(() => { map.setFilter(currentGeojsonLayers.hexSize, null) }, 500);
      addNoDataLegend();
    } else {
      map.setFilter(currentGeojsonLayers.hexSize,['>=', currentGeojsonLayers.dataLayer, 0])
      addLegend(currentGeojsonLayers.color, breaks, currentGeojsonLayers.dataLayer)
      setTimeout(() => {  map.setPaintProperty(currentGeojsonLayers.hexSize,'fill-opacity', 0.8) }, 700);
    }
  
      //addLegend(currentGeojsonLayers.color, breaks, currentGeojsonLayers.dataLayer)

  }
    
    //each time the map moves, repaint
  /* map.on('moveend', function(){
    
    if(map.getLayer(currentGeojsonLayers.hexSize)) {
    var features = map.queryRenderedFeatures({
      layers: [currentGeojsonLayers.hexSize]
    })

    if(features) {

      var uniFeatures;
        if(currentGeojsonLayers.hexSize === 'admin1') {
          uniFeatures = getUniqueFeatures(features, 'GID_1');
        } else {
          uniFeatures = getUniqueFeatures(features, 'hexid');
        }
      //console.log(uniFeatures[0].properties._mean);
      //console.log(uniFeatures);
      var selecteData = uniFeatures.map(x => x.properties[currentGeojsonLayers.dataLayer])
      console.log(selecteData);
      var max = Math.max(...selecteData)
      var min = Math.min(...selecteData)

      var breaks = chroma.limits(selecteData, 'q', 4)
      //console.log(breaks);
      currentGeojsonLayers.breaks = breaks;

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
    }
  }

    addLegend(currentGeojsonLayers.color, breaks, currentGeojsonLayers.dataLayer)
    
  }) */



function addOverlay(sel) {

  var colorz;

  if(sel ==='remove') {
      if(map.getLayer('admin1-overlay')) {
          map.removeLayer('admin1-overlay')
      }
      if(map.getLayer('admin2-overlay')) {
          map.removeLayer('admin2-overlay')
      }
  } else {

    if(sel === 'admin2') {
        colorz = 'blue'
    } else {
        colorz = 'red'
    }
    
    var layerName = sel + '-overlay'

    if (map.getLayer(layerName)) {
        map.removeLayer(layerName)
    } else {


        map.addLayer({
        'id': layerName,
        'type': 'line', 
        'source': sel,
        'layout': {
            'visibility': 'visible'
            },
        
        'paint': {
            'line-color': colorz,
            
            }
        }, firstSymbolId);

    }

  }
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
function addLegend(colors, breaks, current) {

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
    words.innerHTML = nFormatter(breaks[x], 3)
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
map.on('mousemove', 'hex5', function (e) {

    //console.log(e.features[0].properties.hexid);

    if (e.features.length > 0) {

        console.log(e.features[0]);
        
        if (hoveredStateId !== null) {
                map.setFeatureState(
                { source: 'hex5', id: hoveredStateId },
                { hover: false }
                );
            }
            hoveredStateId = e.features[0].id
            map.setFeatureState(
                { source: 'hex5', id: hoveredStateId },
                { hover: true }
                );
        }

    });

map.on('mouseleave', 'hex5', function () {
        if (hoveredStateId !== null) {
        map.setFeatureState(
        { source: 'hex5', id: hoveredStateId },
        { hover: false }
        );
        }
        hoveredStateId = null;
    }); */



  function addTileSources() {

    const hex5 = 'https://sebastian-ch.github.io/sidsDataTest/data/t5/{z}/{x}/{y}.pbf';
    //const hex5 = 'http://127.0.0.1:8080//data/t5/{z}/{x}/{y}.pbf'
    const otherhex = 'https://sebastian-ch.github.io/sidsDataTest/data/tile-hex-5km/{z}/{x}/{y}.pbf'
    //const hex1 = 'https://atlasguo.github.io/undp_sids/tile/tile-hex-1km/{z}/{x}/{y}.pbf'
    const hex1 = 'http://127.0.0.1:8080//data/t1/{z}/{x}/{y}.pbf'
    const hex10 = 'https://sebastian-ch.github.io/sidsDataTest/data/tile-hex-10km/{z}/{x}/{y}.pbf'
    

   /* map.addSource('hex10', {
      'type': 'vector',
      'tiles': [
        hex10
      ],
      'minzoom': 6,
      'maxzoom': 10
   }) */

    map.addSource('hex5', {
      'type': 'vector',
      'tiles': [
        //otherhex
        hex5
      ],
      'minzoom': 6,
      'maxzoom': 10
    })

    map.addSource('hex1', {
      'type': 'vector',
      'tiles': [
        hex1
      ],
      'minzoom': 6,
      'maxzoom': 9,
      'buffer': 0
   })

  map.addLayer({
    'id': 'hex5',
    'type': 'fill', 
    'source': 'hex5',
    //'source-layer': 'hex-5km',
    'source-layer': 'hex5_3857',
    'layout': {
      'visibility': 'visible'
      },
    
    'paint': {
        'fill-color': 'blue',
        'fill-opacity': 0,
        }
    }, firstSymbolId);

    $('.loader-gis').remove()

  }

  //add sources
  function addHexSource() {
    const hex10 = "https://sebastian-ch.github.io/sidsDataTest/data/hex10.pbf"
    //const hex5 = "https://sebastian-ch.github.io/sidsDataTest/data/hex5.pbf";
    const hex5 = 'https://sebastian-ch.github.io/sidsDataTest/data/t5/{z}/{x}/{y}.pbf';
    const admin1 = "https://sebastian-ch.github.io/sidsDataTest/data/admin1.pbf";
    const admin2 = "https://sebastian-ch.github.io/sidsDataTest/data/admin2.pbf";
    const hex1 = 'https://sebastian-ch.github.io/sidsDataTest/data/t1/{z}/{x}/{y}.pbf'
   

    var files = [hex10, admin1, admin2]
    //var files = [hex5]
    var promises = [];

    files.forEach(function(url){
      promises.push(d3.buffer(url))
    })

    Promise.all(promises).then(function(allData){

      //add 10km source
      map.addSource('hex10', {
        type: "geojson",
        data: geobuf.decode(new Pbf(allData[0])),
      }) 
      sourceData.hex10Source.data = allData[0];

      //add 5km
      map.addSource('hex5', {
        'type': 'vector',
        'tiles': [
          //otherhex
          hex5
        ],
        'minzoom': 3,
        'maxzoom': 12
      })
      sourceData.hex5Source.data = hex5;

      //add admin1
      map.addSource('admin1', {
        type: "geojson",
        data: geobuf.decode(new Pbf(allData[1])),
      });
      sourceData.admin1Source.data = allData[1];


      map.addSource('admin2', {
        type: "geojson",
        data: geobuf.decode(new Pbf(allData[2])),
      });
      sourceData.admin2Source.data = allData[2];

     /* map.addSource('hex1', {
          'type': 'vector',
          'tiles': [
            hex1
          ],
          'minzoom': 6,
          'maxzoom': 10
      }) */
      sourceData.hex1Source.data = hex1; 

      


      //add first layer (5km)
      map.addLayer({
        'id': 'hex5',
        'type': 'fill', 
        'source': 'hex5',
        //'source-layer': 'hex-5km',
        'source-layer': 'hex5_3857',
        'layout': {
          'visibility': 'visible'
          },
        
        'paint': {
            'fill-color': 'blue',
            'fill-opacity': 0,
            }
        }, firstSymbolId);

        $('.loader-gis').remove()
    })

  }


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
    //console.log(this.selectedOptions[0].id)
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

    if(this.selectedOptions[0].innerHTML === 'GDP per Capita' || this.selectedOptions[0].innerHTML === 'Population Density') {
      //map.setPaintProperty(currentGeojsonLayers.hexSize,'fill-opacity', 0.0)
      $('.year-timeline-wrapper').show()
      $('#layer-id').hide()
      if(this.selectedOptions[0].innerHTML === 'Population Density') {
        $('#icon3d').show()
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

    } else if(this.selectedOptions[0].innerHTML === 'Food Insecurity' || this.selectedOptions[0].innerHTML === 'Water Use' ||this.selectedOptions[0].innerHTML === 'Development Potential Index') {
      $('#icon3d').hide()
      $('.year-timeline-wrapper').hide()
      $('.year-timeline').empty();
      map.setPaintProperty(currentGeojsonLayers.hexSize,'fill-opacity', 0.0)
      
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
      $('#icon3d').hide()
      var layersHolder = document.getElementById('layer-drop');
      var length = layersHolder.options.length;
    
      for (var i = length-1; i >= 0; i--) {
        layersHolder.options[i] = null;
      }
      $('#layer-id').hide()
      $('.year-timeline-wrapper').hide()
      $('.year-timeline').empty();
      changeDataOnMap(this.selectedOptions[0].id);
    }
    
    //changeDataOnMap(this.selectedOptions[0].id);
	});

  $('select[name="hexbin-change"]').on('change', function() {

    console.log(this.selectedOptions[0].value);
    changeHexagonSize(this.selectedOptions[0].value)
  })

  $('select[name="overlay-select"]').on('change', function() {

    console.log(this.selectedOptions[0].value)
    addOverlay(this.selectedOptions[0].value)

  })

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
      }
      else if (i == yearList.length - 1) {
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
      var showLayer = _.find(currentTimeLayer, function(o) {return o.time === yearValue})
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
        var display = _.find(currentTimeLayer, function(o) {return o.time === currentYear})
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
			}
			else {
				$select.prop('selectedIndex', currentIndex - 1);
			}
		}
		else if ($(this).hasClass('down')) {
			if (currentIndex === totalOpts - 1) {
				currentIndex = 0;
				$select.prop('selectedIndex', currentIndex);
			}
			else {
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

		console.log('Top left nav = ' + top_left_nav);
		console.log('Top right Button = ' + btnValue);
		console.log('DATASET selection = ' + datasetSelect);
		console.log('Layer selection = ' + layerSelect);
		//console.log('Year selection = ' + year);
	}

	check_all_values()

//});
function nFormatter(num, digits) {
  var si = [
    { value: 1, symbol: "" },
    { value: 1E3, symbol: "k" },
    { value: 1E6, symbol: "M" },
    { value: 1E9, symbol: "B" }
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

function addButtons() {

    var sidsHolder = document.getElementById('country-select');
   
    names.map(function(x) {
        var btn = document.createElement("option"); 
        btn.innerHTML = x.NAME_0;
        btn.classList.add('sidsb')
        btn.setAttribute('id', x.GID_0)
        sidsHolder.appendChild(btn)
    })



    d3.csv('./data/csvData.csv').then(function(d) {

        d.map(function(x) {
            allLayers.push(
              {'field_name':x.Field_Name,
              'title': x.Name,
              'band': x.Band,
              'time': x.Temporal,
              'desc': x.Description, 
              'units': x.Unit,
              'desc_long':x.Desc_long, 
              'source_name': x.Source_Name, 
              'link': x.Source_Link
            }
            )
        })

        var dataHolder = document.getElementById('dataDrop')
        var uniqueNames = allLayers.map(x => x.title)
       
        var actualu = _.uniq(uniqueNames);

        for (var x in actualu) {
          //console.log(actualu[x]);
          var btn1 = document.createElement("option"); 
          btn1.innerHTML = actualu[x];
          btn1.classList.add('data')
          var correctFI = _.find(allLayers, function(o) {return o.title === actualu[x]})
          //console.log(correctFI);
          btn1.setAttribute('id', correctFI.field_name)
          dataHolder.appendChild(btn1) 

        }

    })

}