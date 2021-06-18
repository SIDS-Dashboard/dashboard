import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css';

import { MapboxStyleDefinition, MapboxStyleSwitcherControl } from "mapbox-gl-style-switcher";
import "mapbox-gl-style-switcher/styles.css";

import names from './data/sidsNames.json'
import allTheLayers from './data/layerData.csv'
import * as d3 from 'd3-fetch';
import Pbf from 'pbf'
import geobuf from 'geobuf';
import find from 'lodash.find'
import uniq from 'lodash.uniq'
import chroma from "chroma-js";

import './style.css'


var allLayers = []

d3.csv(allTheLayers).then(function(d){
  //console.log(d);
  var dataHolder = document.getElementById('dataDrop')
  d.map(function(x) {
    allLayers.push(x.field_name)

    var btn1 = document.createElement("BUTTON"); 
    btn1.innerHTML = x.desc;
    btn1.classList.add('data')
    btn1.setAttribute('id', x.field_name)
    dataHolder.appendChild(btn1)

  })
  
})


var sidsHolder = document.getElementById('myDropdown');

names.map(function(x) {
    var btn = document.createElement("BUTTON"); 
    btn.innerHTML = x.NAME_0;
    btn.classList.add('sidsb')
    btn.setAttribute('id', x.GID_0)
    sidsHolder.appendChild(btn)
})



mapboxgl.accessToken =
  "pk.eyJ1Ijoic2ViYXN0aWFuLWNoIiwiYSI6ImNpejkxdzZ5YzAxa2gyd21udGpmaGU0dTgifQ.IrEd_tvrl6MuypVNUGU5SQ";

  const map = new mapboxgl.Map({
    container: "map", // container ID
    //style: 'mapbox://styles/mapbox/light-v10', //?optimize=true
    style: 'mapbox://styles/mapbox/satellite-v9',
    center: [0, 0], // starting position [lng, lat]
    zoom: 4, // starting zoom
  });

  //var sources = ['pop3d', 'allSids-source']

  var sourceData = {
      hexSource: {
        name: 'hex-source',
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
    dataLayer: null
  };
  var legendControl;

  map.on("load", function () {

    var nav = new mapboxgl.NavigationControl({
        visualizePitch: true
    });
    map.addControl(nav, 'top-left');

    const styles = [
      {title: "Satellite Imagery", uri: "mapbox://styles/mapbox/satellite-v9",},
      {title: "Light",uri: "mapbox://styles/mapbox/light-v10?optimize=true",},
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
    
    //map.addControl(legendControl, 'bottom-left');
    
    addHexSource()
    /* addSidsSource() */

    
  });


 /* map.on('click', function(){
    map.removeControl(myCustomControl)
  }) */

  

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

  map.on('moveend', function() {

  
  })

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

        map.addSource('hex', {
          type: "geojson",
        data: geobuf.decode(new Pbf(sourceData.hexSource.data)),
        })

        map.addLayer({
          'id': 'hex',
          'type': 'fill', 
          'source': 'hex',
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
                ],
              'fill-opacity': 0.7,
              
              }
          }, firstSymbolId);

       /* map.addSource("allSids-source", {
          type: "geojson",
          data: geobuf.decode(new Pbf(sourceData.allSidsSource.data)),
        }); */

      }

      
     /* for (var x in currentGeojsonLayers) {
        if (currentGeojsonLayers[x] === 'hex') {
          addHex();
        }
        if(currentGeojsonLayers[x] === 'outline') {
          addSidsOutline(sourceData.allSidsSource.lastName)
          //console.log('hi')
        }
        if(currentGeojsonLayers[x] === 'pop3d') {

          add3dHex();
        }
        if(currentGeojsonLayers[x] === 'popDen') {
          addPopDen();
        }

      } */

  })

  function addHexSource() {
    const hexTest = "https://sebastian-ch.github.io/sidsDataTest/data/hex5.pbf";

    d3.buffer(hexTest).then(function (data) {
      map.addSource('hex', {
        type: "geojson",
        data: geobuf.decode(new Pbf(data)),
      });
      sourceData.hexSource.data = data;


      map.addLayer({
        'id': 'hex',
        'type': 'fill', 
        'source': 'hex',
        'layout': {
          'visibility': 'visible'
          },
        
        'paint': {
            'fill-color': 'blue',
            'fill-opacity': 0,
            
            }
        });


    });


  }

  

  const wrapper = document.getElementById('myDropdown');
  wrapper.addEventListener('click', (event) => {
    const isButton = event.target.nodeName === 'BUTTON';
    if (!isButton) {
      return;
    }

    console.dir(event.target.id);

    if(!event.target.id.includes('data')) {

        var currbb = find(names, ['GID_0', event.target.id ])

        sourceData.allSidsSource.lastName = currbb.NAME_0;

        var v2 = new mapboxgl.LngLatBounds([currbb.bb[0], currbb.bb[1]])
          map.fitBounds(v2, {
          linear: true,
          padding: {top: 10, bottom:25, left: 15, right: 5},
          pitch: 0
        });
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


  const dataWrapper = document.getElementById('dataDrop');
  dataWrapper.addEventListener('click', (event) => {
    const isButton = event.target.nodeName === 'BUTTON';
    if (!isButton) {
      return;
    }

    if(map.getLayoutProperty('hex', 'visibility', 'none')) {
      map.setLayoutProperty('hex','visibility','visible')
    }
    currentGeojsonLayers.dataLayer = event.target.id
    console.dir(event.target.id);

    if(map.getLayoutProperty('hex', 'visibility','visible')) {

      var features = map.queryRenderedFeatures({
        layers: ['hex']
      })
  
      if(features) {

        var uniFeatures = getUniqueFeatures(features, 'hexid');
        //console.log(uniFeatures[0].properties._mean);
        //console.log(uniFeatures);
        var selecteData = uniFeatures.map(x => x.properties[event.target.id])
        console.log(selecteData);
        var max = Math.max(...selecteData)
        var min = Math.min(...selecteData)
  
  
        //var colorz = chroma.scale(['lightyellow', 'navy']).domain([min, max], 5, 'quantiles');
        var breaks = chroma.limits(selecteData, 'q', 4)
        console.log(breaks)
        var colorRamp = chroma.scale(['#fafa6e','#2A4858']).mode('lch').colors(5)
        //console.log(colorz.classes)
        currentGeojsonLayers.breaks = breaks;
        currentGeojsonLayers.color = colorRamp;

        map.setPaintProperty('hex', 'fill-color',
        [
          'interpolate',
          ['linear'],
          ['get', event.target.id],
          breaks[0], colorRamp[0],
          breaks[1], colorRamp[1],
          breaks[2], colorRamp[2],
          breaks[3], colorRamp[3],
          breaks[4], colorRamp[4],
          ]
        
        )
        map.setPaintProperty('hex','fill-opacity', 0.5)

        addLegend(colorRamp, breaks)
        
      } 
  
    } 

    map.easeTo({
      center: map.getCenter(),
      pitch: 0
  
    })
  
  })

//addLegend()
function addLegend(colors, breaks) {

  if(!map.hasControl(legendControl)) {
    map.addControl(legendControl, 'bottom-left')
  }

  console.log('hi')

  //map.addControl(legendControl, 'bottom-left')
  var legend = document.getElementById('legend');
  legend.innerHTML = '';
  for (var x in colors) {
    legend.innerHTML+= '<span style="background:'+ colors[x] + '"></span>' +
    '<label>'+ Number.parseFloat(breaks[x]).toFixed(2)+'</label>'

  }
    
}


function add3dHex() {

  currentGeojsonLayers = uniq(currentGeojsonLayers)
  

  if (map.getLayer('pop3d')) {
    var thisIndex = currentGeojsonLayers.indexOf('pop3d');
        if (thisIndex > -1) {
          currentGeojsonLayers.splice(thisIndex, 1);
        }
    map.removeLayer('pop3d');
  } else {
    currentGeojsonLayers.push('pop3d')
    map.addLayer({
      id: 'pop3d',
      type: "fill-extrusion",
      source: 'hex',
      layout: {
        visibility: "visible",
      },
      paint: {
        "fill-extrusion-color": [
          'interpolate',
          ['linear'],
          ['get', '_mean'],
          0,
          '#ffffcc',
          345,
          '#c7e9b4',
          2408,
          '#7fcdbb',
          7190,
          '#41b6c4',
          19764,
          '#2c7fb8',
          58223,
          '#253494',
          ],
        "fill-extrusion-height": ["get", "_mean"],
        "fill-extrusion-opacity": 0.75,
      },
    });
  }
  var v2 = new mapboxgl.LngLatBounds([
    [103.60905, 1.16639],
    [104.0858, 1.47139],
  ]);
  /*map.fitBounds(v2, {
    linear: true,
    padding: { top: 10, bottom: 25, left: 15, right: 5 },
    pitch: 55,
    }); */

  console.log(map.getCenter())

  map.easeTo({
    center: map.getCenter(),
    pitch: 55

  })
  //map.setPitch(55);


}


/*function addSidsSource() {

    const allSids = "https://sebastian-ch.github.io/sidsDataTest/data/allSids.pbf";

    d3.buffer(allSids).then(function (data) {
        map.addSource("allSids-source", {
          type: "geojson",
          data: geobuf.decode(new Pbf(data)),
        });

        sourceData.allSidsSource.data = data;
      });
  } */



function addSidsOutline(name) {

  console.log(name)
  currentGeojsonLayers = uniq(currentGeojsonLayers)
  

  if (map.getLayer("outline")) {
    map.setFilter("outline", ["==", "NAME_0", name]);
   

  } else {

    currentGeojsonLayers.push('outline')
    console.log(currentGeojsonLayers)

    map.addLayer({
      id: "outline",
      type: "line",
      source: "allSids-source",
      layout: {
        visibility: "visible",
      },
      filter: ["==", "NAME_0", name],
      paint: {
        "line-color": "red",
        /*'line-opacity': 0.3, */
        "line-width": 2,
      },
    });

  }
}


