
$(document).ready(function(){

	// initialize the map
	var mainMap = L.map('main-map').setView([30, -9], 8)
	// map configuration
	L.tileLayer('https://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png', {
		attribution: '<a href="#">Pharmalogy</a> &copy; 2021',
		maxZoom: 18,
	}).addTo(mainMap)

});