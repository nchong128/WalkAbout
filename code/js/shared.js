/*
 * Purpose: This file is designed to be available to all 3 HTML pages. Primarily for class creation and usage.
 * Team: Team 174
 * Author (alphabetical): Nicholas Chong, Rhys Nelson, Ali Koraishi, Arshia Adouli
 * Last modified: 20 May 2018
*/

// Global server PathList and user PathList to be available to all HTML files
let serverPaths = null;
let userPaths = null;

// Function used to retrieve the server paths, making serverPaths a PathList with the Paths from the callback link
function retrieveServerPaths()
{
    if (typeof(localStorage) !== "undefined") {
        let routesFromLocalStorage = localStorage.getItem("serverRoutes");
        routesFromLocalStorage = JSON.parse(routesFromLocalStorage);
        serverPaths = new PathList();

        // Scans through the routes obtained to create Paths and add it to the PathList
        for (let route of routesFromLocalStorage) {
            let newPath = new Path(route.title, route.locations);
            serverPaths.addPath(newPath);
        }
    }

    else {
        console.log("localStorage is not available");
    }
}

// Function used to retrieve the user paths, making userPaths a PathList with the Paths from the local storage
function retrieveUserPaths()
{
    if (typeof(localStorage) !== "undefined") {
        let userRoutesFromLocalStorage = localStorage.getItem("userRoutes");
        userRoutesFromLocalStorage = JSON.parse(userRoutesFromLocalStorage);
        
        userPaths = new PathList();
        if (userRoutesFromLocalStorage !== null)
        {
            userPaths.initialisePathListPDO(userRoutesFromLocalStorage);
        }
    }
    
    else {
        console.log("localStorage is not available");
    }
}

// Class Path to be used for handling the routes
class Path
{
    constructor(title, locations) {
        this._title = title;
        this._locations = locations;
    }

    get title() {
        return this._title;
    }

    get locations() {
        return this._locations;
    }

    get numberOfTurns() {
        this._turns = this._locations.length - 2;

        // Ensures no negative number of turns
        if (this._turns < 0) {
            return 0;
        }

        else {
            return this._turns;
        }
    }

    // Method that scans through the locations in the Path, adding the distances between locations together to find
    // the total distance
    get totalDistance() {
        this._totalDistanceCalc = 0;

        for (let i = 0; i < this._locations.length - 1; i ++) {
            this._latLngFrom = new google.maps.LatLng(this._locations[i].lat, this._locations[i].lng);
            this._latLngTo = new google.maps.LatLng(this._locations[i + 1].lat, this._locations[i + 1].lng);

            this._totalDistanceCalc += google.maps.geometry.spherical.computeDistanceBetween(this._latLngFrom,this._latLngTo);
        }

        this._totalDistanceCalc = this._totalDistanceCalc.toFixed(1);
        return this._totalDistanceCalc + "m";
    }

    // Method to allow public data objects to be initialised in a Path
    initialisePathPDO(pathObject) {
        this._title = pathObject._title;
        this._locations = pathObject._locations;
    }
}

// Class PathList to be used for handling multiple routes in one single class
class PathList
{
    constructor() {
        this._routeList = [];
    }

    get allPaths() {
        return this._routeList;
    }

    get size() {
        return this._routeList.length;
    }

    specificPath(index) {
        return this._routeList[index];
    }

    addPath(path) {
        this._routeList.push(path);
        return this._routeList;
    }

    // Method used to allow the PathList to be filled with Paths from a public data object
    initialisePathListPDO(pathObject) {
        this._routeList = [];

        for (let route = 0; route < pathObject._routeList.length; route++) {
            let path = new Path();
            path.initialisePathPDO(pathObject._routeList[route]);
            this._routeList.push(path);
        }
    }
}
