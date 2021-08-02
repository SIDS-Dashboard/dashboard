function createMask(f) {

    var countryOutline = map.queryRenderedFeatures({
        layers: ['allsids']
    })


    var hex5s = map.queryRenderedFeatures({
        layers: ['hex5']
    })

    //console.log(countryOutline);
    var feat = turf.featureCollection(f);
    var countrygjn = turf.featureCollection(countryOutline);
    var countrycombo = turf.combine(countrygjn)
    var fcombo = turf.combine(feat);
    var fcombo_geom = fcombo.features[0].geometry;
    var country_geom = countrycombo.features[0].geometry;

    var countrymask = turf.mask(countrygjn);
    var mask_combo = turf.combine(countrymask);
    //console.log(turf.combine(countrymask));
    //console.log(fcombo.features[0].geometry);
    var mask_geom = mask_combo.features[0].geometry
    var dif = turf.difference(fcombo_geom, mask_geom);
    //var bboxClip = turf.bboxClip(feat, countrygjn)
    console.log(dif)

    var country_gjn = turf.featureCollection(countryOutline)
    console.log(country_geom);
    var hex_gjn = turf.featureCollection(hex5s)
    var hex_geo = turf.combine(hex_gjn);
    var hex_final = hex_geo.features[0].geometry;
    //console.log(turf.combine(hex_gjn));


    var combo = martinez.intersection(country_geom, hex_final)

    //console.log(countryOutline);
    if(countryOutline.length > 0) {


        map.addSource('mask', {
            'type': 'geojson',
            'data': combo
            //'data': dif
        })

        map.addLayer({
            'id': 'mask',
            'type': 'fill',
            'source': 'mask',
            'layout': {},
            'paint': {
                'fill-color': '#ADD8E6',
                'fill-opacity': 1
            }
        }, firstSymbolId);


       /* map.addSource('hex5s', {
            'type': 'geojson',
            'data': turf.featureCollection(hex5s)
            //'data': dif
        })

        map.addLayer({
            'id': 'hex5s',
            'type': 'fill',
            'source': 'hex5s',
            'layout': {},
            'paint': {
                'fill-color': 'red',
                'fill-opacity': 1
            }
        }, firstSymbolId); */




       /* if(map.getLayer('mask')) {

            //map.removeLayer('mask');
           // map.removeSource('mask');
           map.getSource('mask').setData(turf.mask(turf.featureCollection(countryOutline)))
           //map.getSource('mask').setData(dif)
        } else {

            map.addSource('mask', {
                'type': 'geojson',
                'data': turf.mask(turf.featureCollection(countryOutline))
                //'data': dif
            })

            map.addLayer({
                'id': 'mask',
                'type': 'fill',
                'source': 'mask',
                'layout': {},
                'paint': {
                    'fill-color': '#ADD8E6',
                    'fill-opacity': 1
                }
            }, firstSymbolId);

        }
        map.moveLayer('allsids', firstSymbolId) */
        //map.moveLayer('mask')

    }

}