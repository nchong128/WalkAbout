/*
 * Purpose: This file is designed to handle the JavaScript operations on the navigate.html page
 * Team: Team 174
 * Author (alphabetical): Nicholas Chong, Rhys Nelson, Ali Koraishi, Arshia Adouli
 * Last modified: 20 May 2018
*/

// Polylines, maps and markers to be manipulated throughout the code
let initialPolyline = null;
let pathPolyline = null;
let map = null;
let marker = null;

// routeNum = Route number chosen in the index.html; path = Either "server" or "user"
// positionInfo = The current position information of the user
let routeNum, path;
let userHistory = [];
let userHeading = 0;
let positionInfo;

// waypointIndex = The index of the NEXT waypoint for the user
let waypointIndex = 0;
let positionOptions = {
	enableHighAccuracy: true,
	timeout: 60000,
	maximumAge: 0
};

// Used to close the drawer after clicking
// Obtained directly from: https://github.com/google/material-design-lite/issues/1246
function closeDrawer()
{
	let d = document.querySelector('.mdl-layout');
	d.MaterialLayout.toggleDrawer();
}

// Error function when geolocation does not work
function geolocationError(error)
{
	alert("Error code: " + error.code + " | Message: " + error.message);
}

// Moves the map to the current location depending on geolocationCheck()
function goToCurrentLocation(location)
{
	currentLocation =  new google.maps.LatLng(location.coords.latitude, location.coords.longitude);
	map.panTo(currentLocation);
}

// Prompts the check for geolocation, triggering the goToCurrentLocation if successful
function geolocationCheck()
{
	// If geolocation is available, will move the map to the current location
	if (navigator.geolocation) {
		console.log("Geolocation works!");
		navigator.geolocation.getCurrentPosition(goToCurrentLocation, geolocationError, positionOptions);
	}
	// If geolocation is not available, error message shown
	else {
		console.log("Geolocation is disabled.");
	}
	
	// Closes the MDL drawer at the end of this function
	closeDrawer();
}

// Deals with updating the message for the next waypoint, including updating the distance until the 
// next waypoint and updating the direction and image for the user to the next waypoint
function nextWaypointInfo()
{
	let nextWaypointRef = document.getElementById("nextWaypoint");
	let imageRef = document.getElementById("directionImage");
	let distance = distanceToNextPoint();

	let userPositionLatLng = positionInfo.latLng;
	let nextWaypointLatLng = new google.maps.LatLng(path.specificPath(routeNum).locations[waypointIndex]);
	let userToWaypointHeading = google.maps.geometry.spherical.computeHeading(userPositionLatLng, nextWaypointLatLng);

	let turningDirection = userToWaypointHeading - userHeading;

	// Resets the previous message
	nextWaypointRef.innerHTML = "";

	// Adjustments made to the turning direction if it exceeds -180 and below or 180 and above
	if (turningDirection < -180) {
		turningDirection = turningDirection + 360;
	} 
	else if (turningDirection > 180) {
		turningDirection  = turningDirection - 360;
	}

	// Multiple choices for the directions depending on the turning direction
	if (turningDirection <= 5 && turningDirection >= -5) {
		nextWaypointRef.innerHTML = "Go straight for ";
		imageRef.src = "images/straight.svg";
	}
	else if (turningDirection > 5 && turningDirection <= 45) {
		nextWaypointRef.innerHTML = "Slight right for ";
		imageRef.src="images/slight_right.svg";
	}
	else if (turningDirection > 45 && turningDirection <= 115) {
		nextWaypointRef.innerHTML = "Go right for ";
		imageRef.src = "images/right.svg";
	}
	else if ((turningDirection > 115 && turningDirection < 180) || (turningDirection >= -180 && turningDirection < -115)) {
		nextWaypointRef.innerHTML = "Make a U-turn and continue straight for ";
		imageRef.src = "images/uturn.svg";
	}
	else if (turningDirection < -45 && turningDirection >= -115) {
		nextWaypointRef.innerHTML = "Go left for ";
		imageRef.src = "images/left.svg";
	}
	else if (turningDirection < -5 && turningDirection >= -45) {
		nextWaypointRef.innerHTML = "Slight left for ";
		imageRef.src = "images/slight_left.svg";
	}

	nextWaypointRef.innerHTML += distance.toFixed(1) + " m";
}

// Deals with maintaining the actions involving the next waypoint, including creating the initial polyline
// to the first waypoint, dealing with changes in the next waypoint, and alerting the user for reaching
// the final waypoint
function waypointCheck()
{
	let distanceToNextWaypoint = distanceToNextPoint();
	let lastPointIndex = path.specificPath(routeNum).locations.length - 1;
	let nextPoint = path.specificPath(routeNum).locations[waypointIndex];

	// Leads the user to the first point by setting the path from the user's location to the first point
	if (waypointIndex == 0) {
		let initialPath = [positionInfo.latLng, nextPoint];
		initialPolyline.setPath(initialPath);
	}

	// Handles updating up to the next waypoint ONLY if the accuracy is below 50m
	if ((distanceToNextWaypoint < positionInfo.accuracy) && (positionInfo.accuracy < 50)) {
		// Once the user reaches the first point, the polyline leading to the first point will be removed
		if (waypointIndex == 0) {
			initialPolyline.setMap(null);
		}

		// Once the user reaches the last point, the user is informed that they have reached the destination
		if (waypointIndex == lastPointIndex) {
			alert("You have arrived at your destination!");
		}
		else {
			waypointIndex ++;
		}
	}
}

// Function to deal with calculating and displaying the average speed and estimated time remaining on the page 
function userSpeed()
{
	// Initialisations of values to use for calculations
	let initialtime, finalTime, totalTime;
	let averageSpeed, estimatedTimeValue;

	let speedRef = document.getElementById("speed");
	let estimatedTimeRef = document.getElementById("estimatedTimeRemaining");

	let distCoveredValue = distanceCovered();
	let remainingDistValue = remainingDistance();

	// Calculation of total time the user has been navigating for
	initialTime = userHistory[0].timestamp;
	finalTime = userHistory[userHistory.length - 1].timestamp;
	totalTime = finalTime - initialTime;

	// Calculation of average speed
	averageSpeed = distCoveredValue / (totalTime * 10**-3);

	// Calculation of estimated time ONLY if the average speed is above 0.5 ms-1, else the user
	// needs to move more
	if (averageSpeed > 0.5) {
		estimatedTimeValue = remainingDistValue / averageSpeed;
		estimatedTimeValue = estimatedTimeValue.toFixed(0);
	}
	else {
		estimatedTimeValue = " - ";
	}

	averageSpeed = averageSpeed.toFixed(1);
	speedRef.innerHTML = averageSpeed + " m/s";
	estimatedTimeRef.innerHTML = estimatedTimeValue + " s";
}

function distanceToNextPoint()
{
	let nextWaypointLiteral = new google.maps.LatLng(path.specificPath(routeNum).locations[waypointIndex]);
	let distanceToNextWaypoint = google.maps.geometry.spherical.computeDistanceBetween(positionInfo.latLng, nextWaypointLiteral);

	return distanceToNextWaypoint;
}

// Function to calculate the remaining distance from the user's position to the final waypoint
function remainingDistance()
{
	let distanceToNextWaypoint = distanceToNextPoint();
	let distanceToEnd = 0, remainingDistance = 0;
	let waypointFrom, waypointTo;

	for (let waypointNum = waypointIndex; waypointNum < (path.specificPath(routeNum).locations.length) - 1; waypointNum++) {
		waypointFrom = new google.maps.LatLng(path.specificPath(routeNum).locations[waypointNum]);
		waypointTo = new google.maps.LatLng(path.specificPath(routeNum).locations[waypointNum + 1]);
		distanceToEnd += google.maps.geometry.spherical.computeDistanceBetween(waypointFrom, waypointTo);
	}

	remainingDistance = distanceToNextWaypoint + distanceToEnd;
	return remainingDistance;
}

// Function used to compute the distance the user has covered so far by scanning through the user history
// and summing the distances
function distanceCovered()
{
	let distanceCovered = 0, partialDistance;

	for (let routeNumber = 0; routeNumber < userHistory.length - 1; routeNumber++) {
		partialDistance = google.maps.geometry.spherical.computeDistanceBetween(userHistory[routeNumber].latLng, userHistory[routeNumber + 1].latLng);
		distanceCovered += partialDistance;
	}
	return distanceCovered;
}

// Function used to update the distance metrics on the navigation page
function distanceMetrics()
{
	let distanceCoveredRef = document.getElementById("distanceTravelled");
	let distanceToDestRef = document.getElementById("distanceToDestination");

	let distCoveredValue = distanceCovered();
	let remainingDistValue = remainingDistance();

	distanceCoveredRef.innerHTML = distCoveredValue.toFixed(1) + " m";
	distanceToDestRef.innerHTML = remainingDistValue.toFixed(1) + " m";
}

// Function dedicated for changing the marker and the accuracy circle, including changing radius based
// on the accuracy, moving/rotating the marker and the circle
function changeMarker()
{
	let lastIndex, lastLocation;

	// Moves the marker (and the accuracy circle) to the new location
	marker.setPosition(positionInfo.latLng);
	accuracyCircle.setCenter(positionInfo.latLng);

	// Rotates the marker relative to the last location
	lastIndex = userHistory.length - 2;
	lastLocation = userHistory[lastIndex].latLng;

	userHeading = google.maps.geometry.spherical.computeHeading(lastLocation, positionInfo.latLng);

	marker.setIcon({
		path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
		scale: 4,
		fillColor: 'red',
		fillOpacity: 0.9,
		strokeColor: 'red',
		strokeWeight: 1,
		rotation: userHeading
	});

	// Adjusts the radius of the circle based on the accuracy of the current location and the colour
	// of the circle based on the accuracy
	console.log("Accuracy " + positionInfo.accuracy);

	if (positionInfo.accuracy < 50) {
		accuracyCircle.setOptions({fillColor: 'green'});
	}
	else {
		accuracyCircle.setOptions({fillColor: 'red'});
	}

	accuracyCircle.setRadius(positionInfo.accuracy);
}

// Function called after a change in geolocation, that involves storing the user history and calling
// the required functions to deal with the rest of the operations
function updateMap(newPosition)
{
	positionInfo = {
		latLng: new google.maps.LatLng(newPosition.coords.latitude, newPosition.coords.longitude),
		accuracy: newPosition.coords.accuracy,
		timestamp: newPosition.timestamp
	};

	// Stores the current location information into userHistory
	userHistory.push(positionInfo);

	if (userHistory.length > 1) {
		changeMarker();
	}

	// Calls the remaining functions to update metrics/waypoint management/ directions
	distanceMetrics();
	userSpeed();
	waypointCheck();
	nextWaypointInfo();
}

// Callback function on page load, deals with setting the global maps, markers, polylines and to start
// listening for a change in location
function initMap()
{
	// Arbitrary location set for the map to first be positioned at
	let initialLocation = {lat: -37.913922746706, lng: 145.13161360413};
	let polylinePath, routeInfo;
	let titleRef = document.getElementById("title");

	// Retrieves both the server and user paths from local storage
	retrieveServerPaths();
	retrieveUserPaths();

	// Retrieves the route info that the user had selected in index.html from local storage. This route
	// info will determine if the route chosen is a server-made or user-made Path and will also determine
	// the route number respective to the type of path
	routeInfo = localStorage.getItem("routeInfo");
	routeInfo = JSON.parse(routeInfo);

	routeNum = routeInfo[0];

	if (routeInfo[1] == "server") {
		path = serverPaths;
	}
	else if (routeInfo[1] == "user") {
		path = userPaths;
	}

	// Sets the title of the page
	titleRef.innerHTML = path.specificPath(routeNum).title;

	// Initialises the global map
	map = new google.maps.Map(document.getElementById('map'), {
		zoom: 17,
		center: initialLocation,
		fullscreenControl: false,
		streetViewControl: false
	});

	// Initialises the global marker
	marker = new google.maps.Marker ({
		map: map,
		icon: {
			path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
			scale: 4,
			fillColor: 'red',
			fillOpacity: 0.9,
			strokeColor: 'red',
			strokeWeight: 1,
			rotation: 0
		}
	});

	// Intialises the global circle
	accuracyCircle = new google.maps.Circle ({
		map: map,
		fillColor: 'red',
		fillOpacity: 0.1,
		strokeColor: 'red',
		strokeWeight: 1,
	});

	// Initialises the polyline for the path
	pathPolyline = new google.maps.Polyline ({
		geodesic: true,
		strokeColor: '#FF0011',
		strokeOpacity: 1.0,
		strokeWeight: 3,
		map: map,
		path: path.specificPath(routeNum).locations
	});

	// Initialises the polyline for the path from the user's position to the first waypoint
	initialPolyline = new google.maps.Polyline({
		geodesic: true,
		strokeColor: '#11B9F6',
		strokeOpacity: 1.0,
		strokeWeight: 3,
		map: map
	});

	// If geolocation is available, the code will now start watching for the user's change
	// in position, triggering the updateMap function if successful, geolocationError
	// otherwise
	if (navigator.geolocation) {
		console.log("Geolocation works!");
		navigator.geolocation.watchPosition(updateMap, geolocationError, positionOptions);
	}
	// Geolocation is not available, error message shown
	else {
		console.log("Geolocation is disabled.");
	}
}
