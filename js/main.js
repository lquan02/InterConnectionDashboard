// initialize basemmap
mapboxgl.accessToken =
'pk.eyJ1IjoiamFrb2J6aGFvIiwiYSI6ImNpcms2YWsyMzAwMmtmbG5icTFxZ3ZkdncifQ.P9MBej1xacybKcDN_jehvw';
const map = new mapboxgl.Map({
container: 'map', // container ID
style: 'mapbox://styles/mapbox/light-v10', // style URL
zoom: 10.3, // starting zoom
center: [-122.33359685339107, 47.61195411777029] // starting center
});

const grades = [1000, 2000, 3000], 
colors = ['rgb(0,188,161)', 'rgb(0,212,147)', 'rgb(172,250,112)'], 
radii = [5, 15, 20];

map.on('load', () => {
map.addSource('incomeCounts', {
    type: 'geojson',
    data: 'data/HHincome.geojson'
});

map.on('click', 'incomeCounts-point', (event) => {
    new mapboxgl.Popup()
    .setLngLat(event.features[0].geometry.coordinates)
    .setHTML(`<strong>Household Income:</strong> ${event.features[0].properties.HHIncome}`)
    .addTo(map);
});

const legend = document.getElementById('legend');

var labels = ['<strong>Size</strong>'], vbreak;
for (var i = 0; i < grades.length; i++) {
    vbreak = grades[i];
    dot_radius = 2 * radii[i];
    labels.push(
    '<p class="break"><i class="dot" style="background:' + colors[i] + '; width: ' + dot_radius +
    'px; height: ' +
    dot_radius + 'px; "></i> <span class="dot-label" style="top: ' + dot_radius / 2 + 'px;">' + vbreak +
    '</span></p>');

}

legend.innerHTML = labels.join('');

map.addLayer({
    'id': 'incomeCounts-point',
    'type': 'circle',
    'source': 'incomeCounts',
    'paint': {
        'circle-radius': {
            'property': 'HHIncome',
            'stops': [
            [grades[0], radii[0]],
            [grades[1], radii[1]],
            [grades[2], radii[2]]
            ]
        },
        'circle-color': {
            'property': 'HHIncome',
            'stops': [
            [grades[0], colors[0]],
            [grades[1], colors[1]],
            [grades[2], colors[2]]
            ]
        },
        'circle-stroke-color': 'white',
        'circle-stroke-width': 1,
        'circle-opacity': 0.28
    }       
});



});

// load data and add as layer
async function geojsonFetch() {
let response = await fetch('data/map.geojson');
let seattle_data = await response.json();

map.on('load', function loadingData() {
    map.addSource('seattle_data', {
        type: 'geojson',
        data: seattle_data
    });
    map.addLayer({
        'id': 'seattle_data_layer',
        'type': 'fill',
        'source': 'seattle_data',
        'paint': {
            'fill-color': [
                'step',
                ['get', 'deathPer10k'],
                '#e5f5e0',   // stop_output_0
                0,          // stop_input_0
                '#c7e9c0',   // stop_output_1
                5,          // stop_input_1
                '#a1d99b',   // stop_output_2
                10,          // stop_input_2
                '#74c476',   // stop_output_3
                15,         // stop_input_3
                '#41ab5d',   // stop_output_4
                20,         // stop_input_4
                '#238b45',   // stop_output_5
                25,         // stop_input_5
                '#006d2c',   // stop_output_6
                30,
                "#00441b"
            ],
            'fill-outline-color': '#BBBBBB',
            'fill-opacity': 0.7,
        }
    });
    const death_layers = [
        '0 - 4',
        '5 - 9',
        '10 - 14',
        '15 - 19',
        '20 - 24',
        '25 - 29',
        '30 and more'
    ];
    const colors = [
        '#e5f5e0',
        '#c7e9c0',
        '#a1d99b',
        '#74c476',
        '#41ab5d',
        '#238b45',
        '#006d2c',
        '#00441b'
    ];
    // create legend
    const death_legend = document.getElementById('legend');
    death_legend.innerHTML = "<b>Death Cases in WA<br>(per 10,000 cases)</b><br><br>";

    death_layers.forEach((layer, i) => {
        const color = colors[i];
        const item = document.createElement('div');
        const key = document.createElement('span');
        key.className = 'legend-key';
        key.style.backgroundColor = color;

        const value = document.createElement('span');
        value.innerHTML = `${layer}`;
        item.appendChild(key);
        item.appendChild(value);
        legend.appendChild(item);
    });
});
map.on('mousemove', ({point}) => {
    const seattle_neighborhood = map.queryRenderedFeatures(point, {
        layers: ['seattle_data_layer']
    });
    document.getElementById('text-description').innerHTML = seattle_neighborhood.length ?
        `<h3>${seattle_neighborhood[0].properties.CRA_NAM} </h3><p><strong><em>${seattle_neighborhood[0].properties.NEIGHBO}</strong></em></p>` :
        `<p>Hover over a Place!</p>`;
});
}

// Call the function to fetch GeoJSON data and load the map
geojsonFetch();