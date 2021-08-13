function addHexSource() {

    const hex10 = 'https://sebastian-ch.github.io/sidsDataTest/data/hex10/{z}/{x}/{y}.pbf';
    const hex5 = 'https://sebastian-ch.github.io/sidsDataTest/data/hex5/{z}/{x}/{y}.pbf';
    const admin1 = 'https://sebastian-ch.github.io/sidsDataTest/data/admin1/{z}/{x}/{y}.pbf'
    const admin2= 'https://sebastian-ch.github.io/sidsDataTest/data/admin2/{z}/{x}/{y}.pbf'
    const hex1 = 'https://sebastian-ch.github.io/sidsDataTest/data/hex1/{z}/{x}/{y}.pbf'
    const ocean = 'https://sebastian-ch.github.io/sidsDataTest/data/oceans/{z}/{x}/{y}.pbf'
    const allSids = 'https://sebastian-ch.github.io/sidsDataTest/data/allsids/{z}/{x}/{y}.pbf'
    const hex5clipped = 'https://sebastian-ch.github.io/sidsDataTest/data/hex5clipped/{z}/{x}/{y}.pbf'
    
     

      map.addSource('hex5clipped', {
        'type': 'vector',
        'tiles': [
           hex5clipped
        ],
        promoteId: 'hexid'
      })
      sourceData.hex5clippedSource.data = hex5clipped;



      //add 10km source
      map.addSource('hex10', {
        'type': 'vector',
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
      })
      sourceData.hex1Source.data = hex1;


      map.addSource('ocean', {
        'type': 'vector',
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
               'line-width': 1
   
           }
       }, firstSymbolId);

      }
      


        $('.loader-gis').hide()
    
  }