/*
 * Purpose: This file deals with the JavaScript operations for adding routes
 * Team: Team 174
 * Author (alphabetical): Nicholas Chong, Rhys Nelson, Ali Koraishi, Arshia Adouli
 * Last modified: 20 May 2018
*/

// Arbitrary location set for the map to first be positioned at 
let initialLocation = {
	lat: -37.913922746706,
	lng: 145.13161360413
};

let map = null;
let marker = null;

let currentLocation;
let positionOptions = {
	enableHighAccuracy: true,
	timeout: 60000,
	maximumAge: 0
};

let locations = [];
let pathPolyline;
let markerList = [];
const STORAGE_KEY = "userRoutes";

// Used to close the drawer after clicking. This is called after every action available
// in the drawer.
// Obtained directly from: https://github.com/google/material-design-lite/issues/1246
function closeDrawer()
{
	let d = document.querySelector('.mdl-layout');
	d.MaterialLayout.toggleDrawer();
}

// Error function when geolocation does not work
function geolocationError(error)
{
	console.log("ERROR OCCURED!!! Error code: " + error.code + " | Message: " + error.message);
}

// Function called on page load to load the map and the polyline for the user-added routes
function initMap()
{
	// Initialises the global map 
	map = new google.maps.Map(document.getElementById("map"), {
		zoom: 17,
		center: initialLocation,
		fullscreenControl: false,
		streetViewControl: false
	});

	// Initialises the polyline
	pathPolyline = new google.maps.Polyline(
	{
		geodesic: true,
		strokeColor: '#FF0011',
		strokeOpacity: 1.0,
		strokeWeight: 3,
		map: map
	});
}

// Prompts the check for geolocation, triggering the goToCurrentLocation if successful
function geolocationCheck()
{
	// If geolocation is available, will move the map to the current location
	if (navigator.geolocation) {
		console.log("Geolocation works!");
		navigator.geolocation.getCurrentPosition(goToCurrentLocation, geolocationError, positionOptions);
	}
	// Geolocation is not available, error message shown
	else {
		console.log("Geolocation is disabled.");
	}
	
	closeDrawer();
}

// Moves the map to the current location depending on geolocationCheck()
function goToCurrentLocation(location)
{
	currentLocation =  new google.maps.LatLng(location.coords.latitude, location.coords.longitude);
	map.panTo(currentLocation);
}

// Function used to create the draggable marker for setting waypoints
function createMarker()
{
	if (marker == null) {
		// Initialises a marker to be placed into the map
		marker = new google.maps.Marker({
			map: map,
			position: map.getCenter(),
			draggable: true
		});
	}

	else {
		alert("Marker already created!");
	}

	closeDrawer();
}

// Function used to changing the colours of the set waypoint markers based on their
// order
function updateColours()
{
	// Sets the last marker to be pink
	markerList[markerList.length - 1].setIcon({
		size: 100,
		scale: 4,
		path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
		fillColor: 'pink',
		strokeColor: 'pink',
		rotation: 180,
	});

	// Sets the first marker to be green
	markerList[0].setIcon({
		size: 100,
		scale: 4,
		path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
		fillColor: 'green',
		strokeColor: 'green',
		rotation: 180,
	});

	// Sets every marker between the first and the last marker to be black 
	for (let markerNum = 1; markerNum < markerList.length - 1; markerNum++) {
		markerList[markerNum].setIcon({
			size: 100,
			scale: 4,
			path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
			fillColor: 'black',
			strokeColor: 'black',
			rotation: 180
		});
	}
}

// Function called when the user wants to set the waypoint down
function setWaypoint()
{
	let latLng = marker.getPosition().toJSON()

	// Saves the waypoints coordinates in locations
	locations.push(latLng);

	pathPolyline.setPath(locations);

	let pointMarker = new google.maps.Marker({
		map: map,
		position: latLng
	});

	// Saves the marker into a list, markerList and updates the colours of the markers
	markerList.push(pointMarker);
	updateColours()
	closeDrawer()
}

// Function to deal with undoing the last waypoint, including removing the marker from the map
function undoLastWaypoint()
{
	markerList[markerList.length - 1].setMap(null);
	markerList.pop()
	locations.pop()
	pathPolyline.setPath(locations);
	updateColours()
	closeDrawer()
}

// Function used to retrieve the user paths from local storage and remake the PathList
function retrieveUserPaths()
{
	if (typeof(localStorage) !== "undefined") {
		let customPathList = localStorage.getItem(STORAGE_KEY);
		customPathList = JSON.parse(customPathList);
		pathListInstance = new PathList();

		// If a custom PathList already exists, it will add the Paths into it
		if (customPathList !== null) {
			pathListInstance.initialisePathListPDO(customPathList);
		}
		return pathListInstance;
	}
	else {
		console.log("Error: localStorage is not supported by current browser.");
	}
}

// Function used to store the user paths into local storage
function storeUserPaths(pathListInstance)
{
	if (typeof(localStorage) !== "undefined") {
		let pathListToStore = JSON.stringify(pathListInstance);
		localStorage.setItem(STORAGE_KEY, pathListToStore);
	}
	
	else {
		console.log("Error: localStorage is not supported by current browser.");
	}
}

// Function called upon saving
function saveRoute()
{
	if (locations.length > 1) {
		let pathName = prompt("Enter the name of this route: ");
		let newPathInstance = new Path(pathName, locations);
		
		let customPaths = retrieveUserPaths();
		customPaths.addPath(newPathInstance);
		storeUserPaths(customPaths);
	}
	
	else {
		alert("You need to set more than one location!");
	}
}