
(($) ->

	pharmacyTemplate = undefined

	$(document).ready ->
		(->
			# pharmacy item template
			pharmacyTemplate = document.querySelector('#pharmacy-template')
			# get user city location
			userLocation = await getCurrentUserLocation()
			# initialize the map with current user location
			mapInit userLocation
			return
		)()
		return

	###*
	# Get user location by GPS if available, or by resolving user ip with an API
	###
	getCurrentUserLocation = ->
		return new Promise (resolve, reject) ->
			navigator.geolocation.getCurrentPosition ((data) ->
				resolve
					lat: data.coords.latitude
					lng: data.coords.longitude
				return
			), ->
				$.getJSON 'http://ip-api.com/json', (location) ->
					resolve
						lat: location.lat or 30
						lng: location.lon or -9
					return
				return
			return

	###*
	# Initialize map
	###
	mapInit = (location) ->
		# initialize the map
		mainMap = L.map('ts-map-hero', zoomControl: false).setView([
			location.lat
			location.lng
		], 12)
		# map configuration
		L.tileLayer('https://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png',
			attribution: '<a href="#">Pharmalogy</a> &copy; 2021'
			maxZoom: 18
		).addTo mainMap

		L.control.zoom(position: 'topright').addTo mainMap

		# set locate me button
		L.control.locate(
			flyTo: true
			position: 'topright'
		).addTo mainMap

		###*
		# Calculate the actual range to use for search
		###
		mainMap.__proto__.getRange = ->
			mapCenter = @getCenter()
			mapZoom = @getZoom()
			mapSize = @getSize()
			# calculate the range based on the map center and mapview size (range in Km)
			156543.03392 * Math.cos(mapCenter.lat * Math.PI / 180) / 2 ** mapZoom * mapSize.x / 1000

		mainMap.invalidateSize()

		# recalculate the view when resizing
		$(window).resize () ->
			mainMap.invalidateSize()

		# store current location and range
		mainMap.lastLocation = location
		mainMap.lastRange = mainMap.getRange()
		# set markers group
		markers = mainMap.markers = L.markerClusterGroup()
		mainMap.addLayer markers
		# set listener for load event
		mainMap.whenReady updatePharmacies.bind(null, 'load')
		# set listener for zoomend event
		mainMap.on 'zoomend', updatePharmacies
		# set listener for move event
		mainMap.on 'move', updatePharmacies

		# set on pharmacy item click listener
		$(document).on 'click', '.pharmacy-item', (e) ->
			lat = $(this).attr 'lat'
			lng = $(this).attr 'lng'
			# fly to location
			mainMap.flyTo [lat, lng], 17
		return

	###*
	# Check if location is in range
	###
	isInRange = (location, center, range) ->
		ky = 40000 / 360
		kx = Math.cos(Math.PI * center.lat / 180.0) * ky
		dx = Math.abs(center.lng - (location.lng)) * kx
		dy = Math.abs(center.lat - (location.lat)) * ky
		Math.sqrt(dx * dx + dy * dy) <= range

	###*
	# Update showing pharmacies
	###
	updatePharmacies = (type, e) ->
		if !e
			e = type
		# map
		target = e.target
		# get current map center
		center = target.getCenter()
		# get current map range
		range = target.getRange()
		# check if center in range
		if e.type == 'zoomend' or type == 'load' or !isInRange(center, target.lastLocation, target.lastRange)
			# update last data
			target.lastLocation = center
			target.lastRange = target.getRange()
			# fetch new data from server
			req = 
				location:
					latitude: center.lat
					longitude: center.lng
					range: target.lastRange
			# show loading icon
			fetchPharmaciesData req, (data) ->
				# clear current markers
				target.markers.clearLayers()
				# if no data
				if data.length == 0
					# clear results container
					$('#ts-results .ts-results-wrapper').html '<div class="no-data"><span>Aucune pharmacie dans cette zone<span><div>'
					return
				
				# clear results container
				$('#ts-results .ts-results-wrapper').html ''
				# add new markers to cluster
				data.forEach (pharmacy) ->
					# add marker to markers group
					marker = L.marker [
						pharmacy.latitude
						pharmacy.longitude
					]
					target.markers.addLayer marker
					# create pharmacie
					createPharmacieItem '#ts-results .ts-results-wrapper', pharmacy
					return
				return
		return

	createPharmacieItem = (container, pharmacy) ->
		temp = pharmacyTemplate.content.querySelector 'div'
		item = document.importNode temp, true
		# add pharmacy location coordinates
		$(item).attr 'lat', pharmacy.latitude
		$(item).attr 'lng', pharmacy.longitude
		# add pharmacy name
		$(item).find('.ts-item__info h4').html pharmacy.name
		# add pharmacy address
		$(item).find('.ph-address span').html pharmacy.addresse
		# add pharmacy image
		$(item).find('.card-img.ts-item__image').css 'background-image', "url(#{pharmacy.image})"
		# append to container
		$(container).append item
		return

	###*
	# Fetch Pharmacies data from server
	###
	fetchPharmaciesData = (req, cb) ->
		# request data from server
		$.ajax
			url: 'http://localhost:8000/api/pharmacies/location'
			method: 'POST'
			data: req
			success: (res) ->
				# call callback with result data
				cb res
				return
		return
	
	return

) jQuery