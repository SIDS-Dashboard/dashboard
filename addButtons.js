function addButtons() {

    var sidsHolder = document.getElementById('country-select');

    names.map(function (x) {
        var btn = document.createElement("option");
        btn.innerHTML = x.NAME_0; //+ ' ' + x.flag;
        btn.classList.add('sidsb')
        btn.setAttribute('id', x.GID_0)
        sidsHolder.appendChild(btn)


       /* if(!(x.NAME_0 === "Pacific Region" || x.NAME_0 === 'Carribean Region' || x.NAME_0 === 'Atlantic, Indian, and South China Sea' )) { 

        
            var checkcountries = document.getElementById('download-countries');
            var newI = document.createElement('input');
            newI.type = 'checkbox'
            newI.setAttribute('id', x.NAME_0)

            var label = document.createElement('label')
            label.htmlFor = "id"
            label.appendChild(document.createTextNode('\u00A0' + x.NAME_0));


            checkcountries.appendChild(newI)
            checkcountries.appendChild(label)
            var br = document.createElement('br')
            checkcountries.appendChild(br)

        } */
    })



    d3.csv('./data/csvData.csv').then(function (d) {


        /*pillars
        1 = blue economy
        2 = climate action
        3 = digital transformation

        */
        

        d.map(function (x) {
            allLayers.push({
                'field_name': x.Field_Name,
                'title': x.Name,
                'band': x.Band,
                'sdg': x.SDG,
                'samoa_path': x.samoa_pathway,
                'pillar': x.pillars,
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
        var dataHolderBivar = document.getElementById('dataDropBivar')
        var addBasemaps = ['Satellite Imagery']

        for (var x in addBasemaps) {
            var btn2 = document.createElement("option");
            btn2.innerHTML = addBasemaps[x];
            btn2.classList.add('basemap')
            //btn2.setAttribute('id', addBasemaps[x])
            //console.log(btn2)
            dataHolder.appendChild(btn2)
        }

        /*
        for (var x in addBasemaps) {
            var btn2 = document.createElement("option");
            btn2.innerHTML = addBasemaps[x];
            btn2.classList.add('basemap')
            //btn2.setAttribute('id', addBasemaps[x])
            console.log(btn2)         
            dataHolderBivar.appendChild(btn2)
        }*/

        

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
            //console.log(btn1)            
            dataHolder.appendChild(btn1)
            //dataHolderBivar.appendChild(btn1)
        }

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
            //console.log(btn1)
            //dataHolder.appendChild(btn1)
            if (btn1.id=="depth") continue;            
            //if (btn1.id==main_var) continue;
            dataHolderBivar.appendChild(btn1)
        }
        $('#icon3d').hide()
        $('#bivar-control').hide();

    })
}