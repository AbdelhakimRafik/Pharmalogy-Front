
$(document).ready(async function(){

	// initialize pharmacies slider
	new Splide('.pharmacies-splide', {
		focus: 'center',
		perPage: 2
	}).mount();
	
	// pharmacy item template
	pharmacyTemplate = new DOMParser().parseFromString($('#pharmacy-template').text(), 'text/html').body.innerHTML

	// get user city location
	var userLocation = await getCurrentUserLocation()
	// initialize the map with current user location
	mapInit(userLocation)
});

/**
 * Get user location by GPS if available, or by resolving user ip with an API
 */
function getCurrentUserLocation() {
	return new Promise(function(resolve, reject){
		navigator.geolocation.getCurrentPosition(function(data){
			resolve({
				lat: data.coords.latitude,
				lng: data.coords.longitude
			})
		}, function(){
			$.getJSON('http://ip-api.com/json', function(location){
				resolve({
					lat: location.lat || 30,
					lng: location.lon || -9
				})
			})
		})
	})
}

/**
 * Initialize map 
 */
function mapInit(location){
	// initialize the map
	var mainMap = L.map('main-map').setView([location.lat, location.lng], 12)
	// map configuration
	L.tileLayer('https://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png', {
		attribution: '<a href="#">Pharmalogy</a> &copy; 2021',
		maxZoom: 18,
	}).addTo(mainMap)
	// set locate me button
	L.control.locate({
		flyTo: true
	}).addTo(mainMap)

	/**
	 * Calculate the actual range to use for search
	 */
	mainMap.__proto__.getRange = function() {
		var mapCenter = this.getCenter()
		var mapZoom = this.getZoom()
		var mapSize = this.getSize()
		// calculate the range based on the map center and mapview size (range in Km)
		return ((156543.03392 * Math.cos(mapCenter.lat * Math.PI / 180) / Math.pow(2, mapZoom)) * mapSize.x)/1000
	}

	// store current location and range
	mainMap.lastLocation = location
	mainMap.lastRange = mainMap.getRange()

	// set markers group
	var markers = mainMap.markers = L.markerClusterGroup()
	mainMap.addLayer(markers)

	// set listener for load event
	mainMap.whenReady(updatePharmacies.bind(null, 'load'))
	// set listener for zoomend event
	mainMap.on('zoomend', updatePharmacies)
	// set listener for move event
	mainMap.on('move', updatePharmacies)
}

// 
function isInRange(location, center, range){
	var ky = 40000 / 360;
	var kx = Math.cos(Math.PI * center.lat / 180.0) * ky;
	var dx = Math.abs(center.lng - location.lng) * kx;
	var dy = Math.abs(center.lat - location.lat) * ky;
	return Math.sqrt(dx * dx + dy * dy) <= range;
}

/**
 * Update showing pharmacies
 */
function updatePharmacies(type, e){
	if(!e)
		e = type
	
	// map
	var target = e.target
	// get current map center
	var center = target.getCenter()
	// get current map range
	var range = target.getRange()
	// check if center in range
	if(e.type == 'zoomend' || type == 'load' || !isInRange(center, target.lastLocation, target.lastRange)){
		// update last data
		target.lastLocation = center
		target.lastRange = target.getRange()
		// fetch new data from server
		var req = {
			location: {
				latitude: center.lat,
				longitude: center.lng,
				range: target.lastRange
			}
		}
		// show loading icon
		fetchPharmaciesData(req, function(data){
			// clear current markers
			target.markers.clearLayers()
			// add new markers to cluster
			data.forEach(pharmacy => {
				// add marker to markers group
				var marker = L.marker([pharmacy.latitude, pharmacy.longitude])
				target.markers.addLayer(marker)
				// create pharmacie
				createPharmacieItem('.splide-container', pharmacy)
			});
		})
	}
}

function createPharmacieItem(container, pharmacy) {
	var temp = pharmacyTemplate.slice(0)
	
	// add pharmacy thumb image
	var img = $(temp).find('.thumb img').attr('src', 'assets/img/grid/g-img-1.jpg')
	
	console.log(img, temp)
	
	// append to container
	$(container).append(temp)
}

/**
 * Fetch Pharmacies data from server
 */
function fetchPharmaciesData(req, cb){

	// request data from server
	$.ajax({
		url: 'http://localhost:8000/api/pharmacies/location',
		method: 'POST',
		data: req,
		success: function(res){
			// call callback with result data
			cb(res)
		}
	})
}

