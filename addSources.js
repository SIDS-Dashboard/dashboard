function addHexSource() {
    //const hex10 = "https://sebastian-ch.github.io/sidsDataTest/data/hex10.pbf"
    //const hex5 = "https://sebastian-ch.github.io/sidsDataTest/data/hex5.pbf";
    const hex10 = 'https://sebastian-ch.github.io/sidsDataTest/data/hex10km/{z}/{x}/{y}.pbf';
    const hex5 = 'https://sebastian-ch.github.io/sidsDataTest/data/t5/{z}/{x}/{y}.pbf';
    //const admin1 = "https://sebastian-ch.github.io/sidsDataTest/data/admin1-new.pbf";
    //const admin1 = 'mapbox://sebastian-ch.7vnjgjge';
    const admin1 = 'https://sebastian-ch.github.io/sidsDataTest/data/admin1tiles/{z}/{x}/{y}.pbf'
    //const admin2 = "https://sebastian-ch.github.io/sidsDataTest/data/admin2.pbf";
    const admin2= 'https://sebastian-ch.github.io/sidsDataTest/data/admin2tiles/{z}/{x}/{y}.pbf'
    //const hex1 = 'http://localhost:8080/localTiles/hex1zip/{z}/{x}/{y}.pbf'
    const hex1 = 'https://sebastian-ch.github.io/sidsDataTest/data/hex1/{z}/{x}/{y}.pbf'
    //const hex1 = 'https://sebastian-ch.github.io/sidsDataTest/data/carnew/{z}/{x}/{y}.pbf'
    //const hex1= 'https://sebastian-ch.github.io/sidsDataTest/data/aishex1tiles2/{z}/{x}/{y}.pbf'
    //const ocean = './data/d-round.pbf';
    //const ocean = 'https://sebastian-ch.github.io/sidsDataTest/data/ocean.pbf';
    //const ocean = 'mapbox://sebastian-ch.dbe6mvw4'
    //const ocean = 'mapbox://sebastian-ch.9nfvaz3o'
    const ocean = 'https://sebastian-ch.github.io/sidsDataTest/data/oceans/{z}/{x}/{y}.pbf'
      //const ocean = 'http://localhost:8080/localTiles/oceant/{z}/{x}/{y}.pbf'
    const allSids = 'https://sebastian-ch.github.io/sidsDataTest/data/allsids/{z}/{x}/{y}.pbf'
    const hex5clipped = 'https://sebastian-ch.github.io/sidsDataTest/data/hex5clipped/{z}/{x}/{y}.pbf'
    
      //var files = [admin2]
    //var files = [admin2]
    //var promises = [];

    //files.forEach(function(url){
    //  promises.push(d3.buffer(url))
   // })

    //Promise.all(promises).then(function(allData){
      //console.log(allData[0])

      map.addSource('hex5clipped', {
        'type': 'vector',
        //type: "geojson",
        //data: geobuf.decode(new Pbf(allData[0])),
        'tiles': [
           hex5clipped
        ],
        promoteId: 'hexid'
      }) 
      sourceData.hex5clippedSource.data = hex5clipped;



      //add 10km source
      map.addSource('hex10', {
        'type': 'vector',
        //type: "geojson",
        //data: geobuf.decode(new Pbf(allData[0])),
        'tiles': [
           hex10
        ],
        promoteId: 'hexid'
      }) 
      sourceData.hex10Source.data = hex10;
      
      //add 5km
      map.addSource('hex5', {
        'type': 'vector',
        'promoteId': 'hexid',
        'tiles': [
          //otherhex
          hex5,
          
        ],
        //'minzoom': 3,
        'maxzoom': 12
      })
      sourceData.hex5Source.data = hex5;


      map.addSource('admin1', {
        'type': 'vector',
        'promoteId': 'GID_1',
        'tiles': [
          admin1
        ],
        //'minzoom': 3,
        'maxzoom': 12
      })


      sourceData.admin1Source.data = admin1;

     map.addSource('admin2', {
        'type': 'vector',
        'promoteId': 'GID_2',
        'tiles': [
          admin2
        ],
        //'minzoom': 3,
        'maxzoom': 12
      })

      sourceData.admin2Source.data = admin2;


      map.addSource('hex1', {
          'type': 'vector',
          'promoteId': 'hexid',
          'tiles': [
            hex1
          ],
          //'maxzoom': 12
      })
      sourceData.hex1Source.data = hex1;


      map.addSource('ocean', {
        'type': 'vector',
        //'url': ocean
        'tiles': [
            ocean
        ],
        'maxzoom': 10,
      })

      sourceData.oceanSource.data = ocean;


      //source-layer: allSids
      map.addSource('allsids', {
        'type': 'vector',
        //'url': ocean
        'tiles': [
            allSids
        ],
        'maxzoom': 12,
      })

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
             'line-width': 1
 
         }
     }, firstSymbolId);


        $('.loader-gis').hide()
    
  }