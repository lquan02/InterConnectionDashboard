// initialize basemap
mapboxgl.accessToken = 'pk.eyJ1IjoiamFrb2J6aGFvIiwiYSI6ImNpcms2YWsyMzAwMmtmbG5icTFxZ3ZkdncifQ.P9MBej1xacybKcDN_jehvw';

const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/mapbox/light-v10', // style URL
    zoom: 10.2, // starting zoom
    maxBounds: [
        // Define the bounds within which the user can pan the map
        [-122.7, 47.4], // Southwest coordinates
        [-122.0, 47.9]  // Northeast coordinates
    ],
    center: [-122.33359685339107, 47.61195411777029] // starting center
});

map.addControl(new mapboxgl.NavigationControl(), 'top-left');

// Declare a variable to store the state data
let geojson_data;

async function fetchData() {
    const response = await fetch('data/map.geojson');
    geojson_data = await response.json();
    loadMapData();
}
fetchData();

function loadMapData() {
    map.on('load', function () {
        map.addSource('geojson_data', {
            type: 'geojson',
            data: geojson_data
        });

        map.addLayer({
            'id': 'geojson_data_layer',
            'type': 'fill',
            'source': 'geojson_data',
            'paint': {
                'fill-color': [
                    'step',      // use step expression to provide fill color based on values
                    ['get', 'SDQuintile'],  // get the SDQuintile from the data
                    '#f7f7f7',
                    1, '#d9f0a3',
                    2, '#addd8e',
                    3, '#78c679',
                    4, '#31a354',
                    5, '#006837'
                ],
                'fill-opacity': 0.7
            }
        });

        map.addLayer({
            'id': 'geojson_data_borders',
            'type': 'line',
            'source': 'geojson_data',
            'layout': {},
            'paint': {
                'line-color': "#000000",
                'line-width': 1
            }
        });

        let hoveredPolygonId = null;
        map.on('mousemove', 'geojson_data_layer', (e) => {
            if (e.features.length > 0) {
                if (hoveredPolygonId !== null) {
                    map.setFeatureState(
                        { source: 'geojson_data', id: hoveredPolygonId },
                        { hover: false }
                    );
                }
                hoveredPolygonId = e.features[0].id;
                map.setFeatureState(
                    { source: 'geojson_data', id: hoveredPolygonId },
                    { hover: true }
                );

                const feature = e.features[0];
                const coordinates = feature.geometry.coordinates.slice();
                const { CRA_NAM, SDQuintile, MedianHHIncome } = feature.properties;

                // Ensure that if the map is zoomed out such that multiple
                // copies of the feature are visible, the popup appears
                // over the copy being pointed to.
                while (Math.abs(e.lngLat.lng - coordinates[0][0][0]) > 180) {
                    coordinates[0][0][0] += e.lngLat.lng > coordinates[0][0][0] ? 360 : -360;
                }

                new mapboxgl.Popup()
                    .setLngLat(e.lngLat)
                    .setHTML(`
                        <h3>${CRA_NAM}</h3>
                        <p>SDQuintile: ${SDQuintile}</p>
                        <p>Median Household Income: $${MedianHHIncome}</p>
                    `)
                    .addTo(map);
            }
        });

        map.on('mouseleave', 'geojson_data_layer', () => {
            if (hoveredPolygonId !== null) {
                map.setFeatureState(
                    { source: 'geojson_data', id: hoveredPolygonId },
                    { hover: false }
                );
            }
            hoveredPolygonId = null;
        });

        let polygonID = null;
        map.on('click', ({ point }) => {
            const state = map.queryRenderedFeatures(point, {
                layers: ['geojson_data_layer']
            });
            if (state.length) {
                const feature = state[0];
                document.getElementById('text-description').innerHTML = `
                    <h3>${feature.properties.CRA_NAM}</h3>
                    <p>SDQuintile: ${feature.properties.SDQuintile}</p>
                    <p>Median Household Income: $${feature.properties.MedianHHIncome}</p>
                `;

                if (polygonID) {
                    map.removeFeatureState({
                        source: "geojson_data",
                        id: polygonID
                    });
                }

                polygonID = state[0].id;

                map.setFeatureState({
                    source: 'geojson_data',
                    id: polygonID,
                }, {
                    clicked: true
                });
            }
        });

        const layers = [
            'No Data',
            '1 (Lowest)',
            '2',
            '3',
            '4',
            '5 (Highest)'
        ];
        const colors = [
            '#f7f7f7',
            '#d9f0a3',
            '#addd8e',
            '#78c679',
            '#31a354',
            '#006837'
        ];

        const legend = document.getElementById('legend');
        layers.forEach((layer, i) => {
            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';

            const key = document.createElement('div');
            key.className = 'legend-key';
            key.style.backgroundColor = colors[i];

            const label = document.createElement('span');
            label.innerText = layer;
            key.appendChild(label);

            legendItem.appendChild(key);
            legend.appendChild(legendItem);
        });
    });
}

// Call the function to fetch GeoJSON data and load the map
geojsonFetch();

function sortToggle(arr, num){
    if(!arr[num]){
        sortTable(num, true);
        arr[num] = true;
    }else{
        sortTable(num, false);
        arr[num] = false;
    }
}

function sortTable(idx, isAsc) {
    let table = document.getElementsByTagName("table")[0];
    let tbody = table.getElementsByTagName('tbody')[0];
    //convert to arr for sorting
    let arr = Array.from(table.rows);

    //preserve top row so it doesn't get sorted
    let toprow = arr[0];
    arr.shift();
    arr = quickSort(arr, idx, isAsc);
    arr.unshift(toprow);

    while (tbody.firstChild){
        tbody.removeChild(tbody.firstChild);
    }
    arr.forEach(row => tbody.appendChild(row));
}

const quickSort = (arr, idx, isAsc) => {
    if (arr.length <= 1) {
      return arr;
    }
    let pivot = arr[0];
    let leftArr = [];
    let rightArr = [];
    for (let i = 1; i < arr.length; i++) {
        let x;
        let y;
        if(idx === 0){
            x = arr[i].getElementsByTagName("td")[idx].innerHTML;
            y = pivot.getElementsByTagName("td")[idx].innerHTML;
        }else{
            x = parseFloat(arr[i].getElementsByTagName("td")[idx].innerHTML);
            y = parseFloat(pivot.getElementsByTagName("td")[idx].innerHTML);
        }
        if(isAsc){
            if (x < y) {
                leftArr.push(arr[i]);
            } else {
                rightArr.push(arr[i]);
            }
        }else{
            if (x > y) {
                leftArr.push(arr[i]);
            } else {
                rightArr.push(arr[i]);
            } 
        } 
    }
    return [...quickSort(leftArr, idx, isAsc), pivot, ...quickSort(rightArr, idx, isAsc)];
};

function openNav() {
    document.getElementById("side-container").style.display = "block";
    document.getElementById("openbtn").style.display = "none";
}

function closeNav() {
    document.getElementById("side-container").style.display = "none";
    document.getElementById("openbtn").style.display = "block";
}

function openPopup(n) {
    if (n == 1) {
        if (document.getElementById("description-popup").style.display == "block") {
            closePopup(1);
        } else {
        closePopup(2);
        document.getElementById("description-popup").style.display = "block";
        }
    }
    else if (n == 2) {
        if (document.getElementById("acknowledge-popup").style.display == "block") {
            closePopup(2);
        } else {
            closePopup(1);
            document.getElementById("acknowledge-popup").style.display = "block";
        }
    }
}

function closePopup(n) {
    if (n == 1) {
        document.getElementById("description-popup").style.display = "none";
    }
    else if (n == 2) {
        document.getElementById("acknowledge-popup").style.display = "none";
    }
}