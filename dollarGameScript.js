"use strict";
/* global document,window,console,requestAnimationFrame*/
/* jshint -W097,-W014 */ //turn off use strict and comma styling warnings

//-- Canvas init
// Handles
var canvas = document.querySelector('canvas');
var container = document.querySelector('#canvas-container');
var canvasBoundingRect = canvas.getBoundingClientRect();
var c = canvas.getContext('2d');
// Style
var paddingPixelBuffer = 2;
canvas.width = container.offsetWidth - paddingPixelBuffer;
canvas.height = container.offsetHeight - paddingPixelBuffer - 1; //-1 necessary to keep chrome scroll bar away, idk why
canvas.style.border = paddingPixelBuffer/2 + 'px solid black';
canvas.style.display = 'block';
// Positioning
// usage: position . top|center|bottom . left|center|right [[.toAbsolute()]]
var offsetXY = function(obj, xOffset, yOffset) {
    return {
        x: obj.x + xOffset
        , y: obj.y + yOffset
    };    
};

// we use this down below on the mouse event listener which works in absolute units
var toRelative = function(obj) {
    var xOffset = -Math.floor(canvasBoundingRect.left);
    var yOffset = -Math.floor(canvasBoundingRect.top);
    return offsetXY(obj, xOffset, yOffset);
};

var yPositions = {
    top: 0
    , center: canvas.height/2
    , bottom: canvas.height
};
var xPositions = {
    left: 0
    , center: canvas.width/2
    , right: canvas.width
};
var position = {};
for (var yKey in yPositions) {
    for (var xKey in xPositions) {
        if (!position[yKey]) position[yKey] = {};
        var relativeCoordinates = {
            x: Math.floor(xPositions[xKey])
            ,y: Math.floor(yPositions[yKey])
        };
        position[yKey][xKey] = relativeCoordinates;
        //position[yKey][xKey].toAbsolute = toAbsolute.bind({}, relativeCoordinates);
    }
}


//-- Constants
var standardRadius = 30;
var largeRadius = 40;

//-- Helper Utils


//-- Game State
var vertices = [];
var mouseLoc = {x:null, y: null}; // last known mouse location relative to canvas


//-- Game objects
var Vertex = function(x, y) {
    this.x = x;
    this.y = y;
    this.radius = standardRadius;
    this.isSelected = false; //unimplemented!

    this.render = function() {
       
        // Expand or contract the radius on mouse over OR selection
        var isMousedOver = Math.abs(mouseLoc.x - this.x) < this.radius && Math.abs(mouseLoc.y - this.y) < this.radius;
        if ((this.isSelected||isMousedOver) && this.radius < largeRadius) {
            this.radius++;
        } else if (!this.isSelected && !isMousedOver && this.radius > standardRadius) {
            this.radius--;
        }

        // Draw
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0,  Math.PI * 2, false);
        c.fillStyle = 'blue';
        c.fill();
    };
};


//-- Game Init
vertices.push(new Vertex(position.top.left.x, position.top.left.y));
vertices.push(new Vertex(position.bottom.right.x, position.bottom.right.y));
vertices.push(new Vertex(position.center.right.x, position.center.right.y));
vertices.push(new Vertex(position.bottom.center.x, position.bottom.center.y));


vertices.push(new Vertex(position.center.center.x, position.center.center.y));


//-- Game Logic & Animation Loop
var animationLoop = function() {
    c.clearRect(0, 0, canvas.width, canvas.height); // clear canvas

    vertices.forEach(function(vertex) {
        vertex.render();
    });

    requestAnimationFrame(animationLoop);
};
animationLoop();


//-- Event Listeners
window.addEventListener('mousemove', function(event) {
    // event gives absolute x/y coordinate on the page but we need it relative to the canvas
    var relativePos = toRelative(event);
    mouseLoc.x = relativePos.x;
    mouseLoc.y = relativePos.y;

    console.log('(' + mouseLoc.x + '),(' + mouseLoc.y + ')');
});

