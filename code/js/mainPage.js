/*
 * Purpose: This file deals with the JavaScript operations for the main index page
 * Team: Team 174
 * Author (alphabetical): Nicholas Chong, Rhys Nelson, Ali Koraishi, Arshia Adouli
 * Last modified: 20 May 2018
*/

let serverListElement = document.getElementById('serverList');
let userListElement = document.getElementById('userList');

// Callback function upon load to deal with storing the server paths and displaying the server AND
// user paths on the page
function campusRoutes(routes)
{
    if (typeof(localStorage) !== "undefined") {
        let stringfiedRoutes = JSON.stringify(routes);

        console.log("localStorage is available");
        localStorage.setItem("serverRoutes", stringfiedRoutes);
    }
    
    else {
        console.log("localStorage is not available");
    }

    // Functions called to retrieve both types of PathLists and to display them
    retrieveServerPaths();
    retrieveUserPaths();
    serverRoutesInfo();
    userRoutesInfo();
}

// Function dealing with storing the route chosen by the user and sending it into localStorage
// to be retrieved in the navigate page
function chooseRoute(routeNumber,routeType)
{
    if (typeof(localStorage) !== "undefined") {
        info = [routeNumber,routeType];
        info = JSON.stringify(info);
        localStorage.setItem("routeInfo",info);
        
        // Deals with sending the user to the next page
        location.href = "navigate.html"
    }
    
    else {
        console.log("localStorage is not available");
    }
}

// Function to deal with displaying the server routes in a table
function serverRoutesInfo()
{
    let listHTML = "<tr><b>Server Routes</b> </tr>";

    for (let i = 0; i< serverPaths.size; i++) {
    listHTML += "<tr> <td onmousedown=\"chooseRoute("+i+",'server')\" class=\"full-width mdl-data-table__cell--non-numeric\">" + "Route" + (i+1) + ": " + serverPaths.specificPath(i).title + "<br> Distance: " + serverPaths.specificPath(i).totalDistance + " | Number of turns: " + serverPaths.specificPath(i).numberOfTurns+"</div></td></tr>";
    }

    serverListElement.innerHTML = listHTML;
}

// Function to deal with displaying the user routes in a table 
function userRoutesInfo()
{
    let listHTML = "<tr><b>User Routes</b> </tr>";

    for (let i = 0; i< userPaths.size; i++) {
        listHTML += "<tr> <td onmousedown=\"chooseRoute("+i+",'user')\" class=\"full-width mdl-data-table__cell--non-numeric\">" + "Route" + (i+1) + ": " + userPaths.specificPath(i).title + "<br> Distance: " + userPaths.specificPath(i).totalDistance + " | Number of turns: " + userPaths.specificPath(i).numberOfTurns+"</div></td></tr>";
    }
    
    userListElement.innerHTML = listHTML;
}

// Script for the JSONP link appended to the bottom of the mainpage scripts
let script = document.createElement("script");
script.src = "https://eng1003.monash/api/campusnav/?campus=clayton&callback=campusRoutes";
document.body.appendChild(script);
