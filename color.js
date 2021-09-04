// This color library includes the color ramps used in dashboard.

// ----------------------------------------------
// TYPE 1: quanlitative / categorical color ramps
var colorQual = {

};

// ------------------------------
// TYPE 2: sequential color ramps
var colorSeq = {   
    'yellow-blue':chroma.scale(['#fafa6e', '#2A4858']).mode('lch').colors(5), // yellow -> dark blue
    'green':['#edf8fb', '#b2e2e2', '#66c2a4', '#2ca25f', '#006d2c'], // light -> dark green
    'purple':['#f2f0f7', '#cbc9e2', '#9e9ac8', '#756bb1', '#54278f'], // light -> dark purple
    'orange':['#ffffd4', '#fed98e', '#fe9929', '#d95f0e', '#993404'], // light -> dark orange
    'pop':['#feebe2', '#fbb4b9', '#f768a1', '#c51b8a', '#7a0177'], // light -> dark pink
    'sunIndex':['#fdfbf6', '#FAE7B9', '#FAE39B', '#FADE7C', '#FADA5E'], // light -> dark yellow (too similar)
    'newSun':['#FEF65C', '#FEE745', '#FFD82F', '#FFC918', '#FFBA01'], // light -> dark yellow
    'combo':['#fdfbf6', '#FEE745', '#FFD82F', '#FFC918', '#FFBA01'], // white -> dark yellow
    'pinkish':['#f8eff1', '#f1d2d4', '#e7a9b1', '#c65e6a', '#af3039'], // white -> red
    'blues':['#ABD7EC', '#59C1E8', '#3585DA', '#1061B0', '#003C72'], // light -> dark blue
    'silvers':['#BEBEBE', '#AFAFAF', '#9F9F9F', '#909090', '#808080'], //light -> dark black
    'minty':['#aaf0d1', '#96e6c2', '#7dd8b5', '#5ec69d', '#3eb489'], // light -> dark green (too similar)
    'ocean':['#08519c', '#3182bd', '#6baed6', '#bdd7e7', '#eff3ff'], // dark -> light blue
};
 
// -----------------------------
// TYPE 3: diverging color ramps
var colorDiv = {
    'gdpColor':['#ca0020', '#f4a582', '#f7f7f7', '#92c5de', '#0571b0'], // red -> white -> blue    
};

// -----------------------------------
// TYPE 4:  3*3 bi-variate color ramps
var colorQualSeq3 = {

};
var colorQualDiv3 = {

};
var colorSeqSeq3 = {
    'blue-red-brown':[
        '#e8e8e8', '#e4acac', '#c85a5a', // white -> red
        '#b0d5df', '#ad9ea5', '#985356',
        '#64acbe', '#627f8c', '#574249'],// blue -> brown
    'blue-pink-purple':[
        '#e8e8e8', '#d9aeca', '#c974ad', // white -> pink
        '#aecbd9', '#9f91bb', '#8f579d',
        '#74adc9', '#6573ab', '#55398e'],// blue -> purple
};
var colorSeqDiv3 = {

};
var colorDivDiv3 = {

};

// -----------------------------------
// TYPE 5:  4*4 bi-variate color ramps
var colorQualSeq4 = {

};

var colorQualDiv4 = {

};

var colorSeqSeq4 = {

};

var colorSeqDiv4 = {

};

var colorDivDiv4 = {

};
