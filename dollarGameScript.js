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

// usage: position along x/y axis as a percentage of the canvas dimensions
// e.g. var bottomCenter = getPosition(50,100);
var getPosition = function(xPercent, yPercent) {
    return {
        x: Math.floor(xPercent * 0.01 * canvas.width)
        , y: Math.floor(yPercent * 0.01 * canvas.height)
    };
};


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
var topLeft = getPosition(0,0);
var bottomRight = getPosition(100,100);
var centerRight = getPosition(100,50);
var bottomCenter = getPosition(50,100);
var centerCenter = getPosition(50,50);
var northWestMidway = getPosition(25,25);

vertices.push(new Vertex(topLeft.x, topLeft.y));
vertices.push(new Vertex(bottomRight.x, bottomRight.y));
vertices.push(new Vertex(centerRight.x, centerRight.y));
vertices.push(new Vertex(bottomCenter.x, bottomCenter.y));
vertices.push(new Vertex(centerCenter.x, centerCenter.y));
vertices.push(new Vertex(northWestMidway.x, northWestMidway.y));


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

