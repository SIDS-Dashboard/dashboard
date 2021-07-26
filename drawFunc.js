

map.on('draw.create', drawCreate);
map.on('draw.delete', drawDelete);
map.on('draw.update', drawUpdate);

function drawUpdate() {
    console.log('update')
}


function drawCreate(e) {

    console.log(Draw.getAll())
    var userPolygon = e.features[0];
    console.log(userPolygon)
    console.log('create')
    var bbox = turf.bbox(userPolygon);
    //console.log(bbox);
    



    var southWest = [bbox[0], bbox[1]];
    var northEast = [bbox[2], bbox[3]];

    var northEastPointPixel = map.project(northEast);
    var southWestPointPixel = map.project(southWest);

    var features = map.queryRenderedFeatures([southWestPointPixel, northEastPointPixel], { layers: [currentGeojsonLayers.hexSize] });

    console.log(features);

    if(features.length > 0) {

    
    var filter = features.reduce(function (memo, feature) {

        //if(! (undefined === turf.intersect(feature, userPolygon))) {
          if(turf.booleanIntersects(feature, userPolygon))  {

            memo.push(feature.properties.hexid);
        }
            
            return memo;
        }, ['in', 'hexid']);

    //console.log(filter)
    map.setFilter(currentGeojsonLayers.hexSize, filter);
    
    map.once('idle', function(e) {
        var sideData = [];
        var rend = map.queryRenderedFeatures({layers: [currentGeojsonLayers.hexSize]});
        //console.log(currentGeojsonLayers.dataLayer);
        console.log(rend);
        $('#draw-sidebar').show();
        rend.forEach(function(x) {
            //console.log(x);

            sideData.push(x.properties[currentGeojsonLayers.dataLayer])
            //console.log(x.properties[currentGeojsonLayers.dataLayer])

            //console.log(x.properties.currentGeojsonLayers.dataLayer)
        })

        var legData = _.find(allLayers, ['field_name', currentGeojsonLayers.dataLayer])


        var sidebarHolder = document.getElementById('sidebar-text');
        var title = document.getElementById('sideTitle')
        var maxDiv = document.getElementById('sideMax')
        var minDiv = document.getElementById('sideMin')
        var meanDiv = document.getElementById('sideMean')


        var max = Math.max(...sideData)
        var min = Math.min(...sideData)

        var total = 0;
        for (var i = 0; i < sideData.length; i++) {
            total += sideData[i];
        }
        var mean = total / sideData.length;
        /*title.innerHTML = ''
        maxDiv.innerHTML = "";
        minDiv.innerHTML = "";
        meanDiv.innerHTML = ""; */

        title.innerHTML = '<b>'+ legData.desc + '</b>'
        maxDiv.innerHTML = "Max of Selected: " + max + ' ' + legData.units;
        minDiv.innerHTML = "Min of Selected: " + min + ' ' + legData.units;
        meanDiv.innerHTML = "Mean of Selected: " + nFormatter(mean, 2) + ' ' + legData.units;

        sidebarHolder.appendChild(title)
        sidebarHolder.appendChild(maxDiv)
        sidebarHolder.appendChild(minDiv)
        sidebarHolder.appendChild(meanDiv)



    })

}

   


}


function drawDelete() {
    console.log('delete')
}


function closeSide() {
    $('#draw-sidebar').hide();
}