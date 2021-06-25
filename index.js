import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css';

import { MapboxStyleDefinition, MapboxStyleSwitcherControl } from "mapbox-gl-style-switcher";
import "mapbox-gl-style-switcher/styles.css";

import names from './data/sidsNames.json' //
import allTheLayers from './data/csv_data_new.csv'
import * as d3 from 'd3-fetch';
import Pbf from 'pbf';
import geobuf from 'geobuf';
import find from 'lodash.find'
import uniq from 'lodash.uniq'
import chroma from "chroma-js";

import addButtons from './setButtons'
import './ui-styles.css'
import addPass from "./password";
//import './style.css'




addPass()


var allLayers = []
export default allLayers
addButtons(names, allTheLayers);


/*Initialize Map */
mapboxgl.accessToken =
  "pk.eyJ1Ijoic2ViYXN0aWFuLWNoIiwiYSI6ImNpejkxdzZ5YzAxa2gyd21udGpmaGU0dTgifQ.IrEd_tvrl6MuypVNUGU5SQ";

  const map = new mapboxgl.Map({
    container: "map", // container ID
    style: 'mapbox://styles/mapbox/light-v10', //?optimize=true
    //style: 'mapbox://styles/mapbox/satellite-v9', 
    center: [-71.4, 19.1], // starting position [lng, lat]
    zoom: 7,
    //pitch: 55
  });


  var sourceData = {
      hexSource: {
        name: 'hex5',
        data: null
      },

      allSidsSource: {
        name: 'allSids-source',
        data: [],
        lastName: null
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

    const styles = [
      {title: "Light",uri: "mapbox://styles/mapbox/light-v10?optimize=true",},
      {title: "Satellite Imagery", uri: "mapbox://styles/mapbox/satellite-v9",},
      {title: "Satellite With Labels",uri: "mapbox://styles/mapbox/satellite-streets-v11",},
    ];
    
    map.addControl(new MapboxStyleSwitcherControl(styles), 'top-right');

    class MyCustomControl {
      onAdd(map){
        this.map = map;
        this.container = document.createElement('div');
        this.container.className = 'legend';
        this.container.id = 'legend'
        //this.container.textContent = 'Legend Here';
        return this.container;
      }
      onRemove(){
        this.container.parentNode.removeChild(this.container);
        this.map = undefined;
      }
    } 
    
    legendControl = new MyCustomControl(); 
    map.addControl(new mapboxgl.ScaleControl(), 'bottom-right');
    
    addHexSource()
    //addSidsSource()

    
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

  map.on('style.load', function(){

    var layers = map.getStyle().layers;
    // Find the index of the first symbol layer in the map style
    var firstSymbolId;
    for (var i = 0; i < layers.length; i++) {
    if (layers[i].type === 'symbol') {
    firstSymbolId = layers[i].id;
    break;
    }
    }
    
      if(sourceData.hexSource.data != null) {

        map.addSource(currentGeojsonLayers.hexSize, {
          type: "geojson",
        data: geobuf.decode(new Pbf(sourceData.hexSource.data)),
        })

        map.addLayer({
          'id': currentGeojsonLayers.hexSize,
          'type': 'fill', 
          'source': currentGeojsonLayers.hexSize,
          'layout': {
            'visibility': 'visible'
            },
          //'filter': ['!=', "null"],
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
                ],
              'fill-opacity': 0.7,
              
              }
          }, firstSymbolId);


          map.setFilter(currentGeojsonLayers.hexSize,['>=',currentGeojsonLayers.dataLayer, 0])

      }

  })

  
  const button3dWrapper = document.getElementById('icon3d')
  button3dWrapper.addEventListener('click', (event) => {

    var id3d = currentGeojsonLayers.hexSize + '-3d'

    if(map.getLayer(id3d)) {
     
      map.removeLayer(id3d);
      map.easeTo({
        center: map.getCenter(),
        pitch: 0
    
      })
    } else {

    
    map.addLayer({
      'id': id3d,
      'type': 'fill-extrusion', 
      'source': currentGeojsonLayers.hexSize,
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
          //'fill-opacity': 0.7,
        
          }
      });

      map.setFilter(id3d,['>=',currentGeojsonLayers.dataLayer, 0])
      map.easeTo({
        center: map.getCenter(),
        pitch: 55
    
      })

    }

  })

  const wrapper = document.getElementById('country-select');
  wrapper.addEventListener('click', (event) => {

    const isOption = event.target.nodeName === "OPTION";
    if (!isOption) {
      return;
    }

    console.log(event.target.id);

    if(!event.target.id.includes('data')) {

        var currbb = find(names, ['GID_0', event.target.id ])

        sourceData.allSidsSource.lastName = currbb.NAME_0;

        var v2 = new mapboxgl.LngLatBounds([currbb.bb[0], currbb.bb[1]])
          map.fitBounds(v2, {
          linear: true,
          padding: {top: 10, bottom:25, left: 15, right: 5},
          pitch: 0
        });

       /* map.on('moveend', function(){

          if(map.getLayer('hex')) {
          var features = map.queryRenderedFeatures({
            layers: ['hex']
          })
      
          if(features) {
      
            var uniFeatures = getUniqueFeatures(features, 'hexid');
            //console.log(uniFeatures[0].properties._mean);
            console.log(uniFeatures);
            var selecteData = uniFeatures.map(x => x.properties[currentGeojsonLayers.dataLayer])
            //console.log(selecteData);
            var max = Math.max(...selecteData)
            var min = Math.min(...selecteData)
      
      
            //var colorz = chroma.scale(['lightyellow', 'navy']).domain([min, max], 5, 'quantiles');
            var breaks = chroma.limits(selecteData, 'q', 4)
            //console.log(breaks)
           
            
            //console.log(colorz.classes)
          
            currentGeojsonLayers.breaks = breaks;
      
              map.setPaintProperty('hex', 'fill-color',
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
              map.setPaintProperty('hex','fill-opacity', 0.5)
              map.setFilter('hex',['has',currentGeojsonLayers.dataLayer])
              addLegend(colorRamp, breaks, currentGeojsonLayers.dataLayer)
      
              }
            }
        })  */
        //addSidsOutline(currbb.NAME_0);
    } 
   /*  else if(event.target.id.includes('pop3d')) {

        add3dHex(event.target.id)
        addLegend(event.target.id)

    } else if(event.target.id.includes('hex')) {

        addHex(event.target.id);
    } else if (event.target.id.includes('popd')) {

      addPopDen()

    } */
  })
  function changeHexagonSize(sel) {

    currentGeojsonLayers.hexSize = sel

    var layers = map.getStyle().layers;
    // Find the index of the first symbol layer in the map style
    var firstSymbolId;
    for (var i = 0; i < layers.length; i++) {
    if (layers[i].type === 'symbol') {
    firstSymbolId = layers[i].id;
    break;
    }
    }

    const userLayers = ['hex5', 'hex10', 'admin1', 'admin2'];

    for (var x in userLayers) {
      if(map.getLayer(userLayers[x])) {
        map.removeLayer(userLayers[x])
      }
      
    }

    //console.log(currentGeojsonLayers.breaks)

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


      if(currentGeojsonLayers.breaks != null) {

        map.setPaintProperty(sel, 'fill-color',
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
        )

        map.setPaintProperty(sel,'fill-opacity', 0.7)
        map.setFilter(sel,['>=',currentGeojsonLayers.dataLayer, 0])


      }

  }

  function changeDataOnMap(selection) {
    console.log(selection);
    currentGeojsonLayers.dataLayer = selection;

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
        } else {
          uniFeatures = getUniqueFeatures(features, 'hexid');
        }
        
        //console.log(uniFeatures[0].properties._mean);
        //console.log(uniFeatures);
        var selecteData = uniFeatures.map(x => x.properties[selection])
        console.log(selecteData);
        var max = Math.max(...selecteData)
        var min = Math.min(...selecteData)
        
        
        //var colorz = chroma.scale(['lightyellow', 'navy']).domain([min, max], 5, 'quantiles');
        var breaks = chroma.limits(selecteData, 'q', 4)
        //console.log(breaks)
        var colorRamp3 = chroma.scale(['#fafa6e','#2A4858']).mode('lch').colors(5)
        var colorRamp1 = ['#edf8fb', '#b2e2e2','#66c2a4','#2ca25f', '#006d2c' ]
        var colorRamp2 = ['#f2f0f7','#cbc9e2' ,'#9e9ac8' , '#756bb1' , '#54278f' ]
        var colorRamp4 = ['#ffffd4','#fed98e','#fe9929','#d95f0e','#993404']
        
        //console.log(colorz.classes)
        var ramps = [colorRamp1, colorRamp2, colorRamp3, colorRamp4]

        var colorRamp = ramps[Math.floor(Math.random() * 4)];

        currentGeojsonLayers.breaks = breaks;
        currentGeojsonLayers.color = colorRamp;

        //console.log(currentGeojsonLayers)

        map.setPaintProperty(currentGeojsonLayers.hexSize, 'fill-color',
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
        
        )
        
        map.setPaintProperty(currentGeojsonLayers.hexSize,'fill-opacity', 0.7)
        map.setFilter(currentGeojsonLayers.hexSize,['>=',selection, 0])
        addLegend(colorRamp, breaks, selection)

  }
}
  }
    
    //each time the map moves, repaint
   map.on('moveend', function(){

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
      console.log(breaks);
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

  })



function addOverlay(sel) {
  
  var layerName = sel + '-overlay'

  if (map.getLayer(layerName)) {
    map.removeLayer(layerName)
  } else {

    var layers = map.getStyle().layers;
    // Find the index of the first symbol layer in the map style
    var firstSymbolId;
    for (var i = 0; i < layers.length; i++) {
    if (layers[i].type === 'symbol') {
    firstSymbolId = layers[i].id;
    break;
    }
    }

    map.addLayer({
      'id': layerName,
      'type': 'line', 
      'source': sel,
      'layout': {
        'visibility': 'visible'
        },
      
      'paint': {
          'line-color': 'red',
          
          }
      }, firstSymbolId);

  }

}


//addLegend()
//add the legend
function addLegend(colors, breaks, current) {

  //console.log(allLayers)
  
  var legData = find(allLayers, ['field_name', current])

  var infoBoxTitle = document.getElementById("infoBoxTitle")
  var infoBoxText = document.getElementById("infoBoxText")
  var infoBoxLink = document.getElementById("infoBoxLink")

  infoBoxTitle.innerHTML = '';
  infoBoxText.innerHTML = '';
  infoBoxLink.innerHTML = '';

  infoBoxTitle.innerHTML = legData.title;
  infoBoxText.innerHTML = legData.desc_long
  infoBoxLink.innerHTML = '<strong>Reference: </strong>' + legData.source_name + ' - ' + legData.link.link()

  var legendTitle = document.getElementById('legendTitle')
  var legend = document.getElementById('updateLegend')
  legend.innerHTML = '';
  legendTitle.innerHTML = ''
  legendTitle.innerHTML = legData.units;

  for (var x in colors) {

    var containerDiv = document.createElement('div')
    containerDiv.classList.add('col-flex')
    containerDiv.classList.add('align-items-center')

    var words = document.createElement('div')
    words.classList.add('population-per-km-text')
    words.innerHTML = Number.parseFloat(breaks[x]).toFixed(3)
    var hexI = document.createElement('div')
    hexI.classList.add('population-per-km-img')
    hexI.style.backgroundColor = colors[x];

    containerDiv.appendChild(words)
    containerDiv.appendChild(hexI)
    legend.appendChild(containerDiv);

  }
}

  //add sources
  function addHexSource() {
    const hex10 = "https://sebastian-ch.github.io/sidsDataTest/data/10km.pbf"
    const hex5 = "https://sebastian-ch.github.io/sidsDataTest/data/hex5u.pbf";
    const admin1 = "https://sebastian-ch.github.io/sidsDataTest/data/admin1.pbf";
    const admin2 = "https://sebastian-ch.github.io/sidsDataTest/data/admin2.pbf";

    var layers = map.getStyle().layers;
    // Find the index of the first symbol layer in the map style
    var firstSymbolId;
    for (var i = 0; i < layers.length; i++) {
    if (layers[i].type === 'symbol') {
    firstSymbolId = layers[i].id;
    break;
    }
    }

    var files = [hex10, hex5, admin1]
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

      //add 5km
      map.addSource('hex5', {
        type: "geojson",
        data: geobuf.decode(new Pbf(allData[1])),
      });

      //add admin1
      map.addSource('admin1', {
        type: "geojson",
        data: geobuf.decode(new Pbf(allData[2])),
      });
      sourceData.hexSource.data = allData[1];


      //add first layer (5km)
      map.addLayer({
        'id': 'hex5',
        'type': 'fill', 
        'source': 'hex5',
        'layout': {
          'visibility': 'visible'
          },
        
        'paint': {
            'fill-color': 'blue',
            'fill-opacity': 0,
            
            
            }
        }, firstSymbolId);


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
var sdg = [
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
];

$(document).ready(function () {
	/** Collapse/Expand for Box  */
	$('.collapse-btn').on('click', function () {
		$('.app-body').toggleClass('collapsed');
		$(this).toggleClass('collapsed');
	}); 

	// /** Select2 for drop downs */
	$('.form-select').select2();

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
    /*if(this.selectedOptions[0].innerHTML === 'GDP per capita' || this.selectedOptions[0].innerHTML === 'Population Density') {
      console.log(this.selectedOptions[0])
    } else { */
      changeDataOnMap(this.selectedOptions[0].id);
    //}
    
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
	});
	/**
	 * Dynamic year list creation 
	 */
	var yearList = [1990, 1995, 2010, 2015];
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


		var year_html = `<div _style=' ${widthStyle}' data-width='${size_in_percentage}' class="year-timeline-block ${class_for_year}" data-year-idx="${i + 1}">
				 <input type="radio" name="year-selected" value="${yearList[i]}" id="year-${yearList[i]}" ${(i == 0) ? 'checked' : ''}>
				 <label for="year-${yearList[i]}">
				 <span style='${fromLeftStyle}' class="label-value">${yearList[i]}</span>
				 <span style='${fromLeftStyle}' class="circle-radio"></span>
				 </label>
			  </div>`;
		$('.year-timeline').append(year_html);

	}
	// }

	// Year selection 
	var isReachedToEnd = false;
	$('body').on('change click', 'input[name="year-selected"]', function () {
		isReachedToEnd = false;
		var yearValue = $('[name="year-selected"]:checked').val();
		console.log(yearValue);
	});

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

				console.log($('input[name="year-selected"]:checked').val());


			}, 1000);

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
		var year = $('input[name="year-selected"]:checked').val();

		console.log('Top left nav = ' + top_left_nav);
		console.log('Top right Button = ' + btnValue);
		console.log('DATASET selection = ' + datasetSelect);
		console.log('Layer selection = ' + layerSelect);
		console.log('Year selection = ' + year);
	}

	check_all_values()

});