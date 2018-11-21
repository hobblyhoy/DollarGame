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
canvas.height = container.offsetHeight - paddingPixelBuffer;
canvas.style.border = paddingPixelBuffer/2 + 'px solid black';
canvas.style.display = 'block';
// Location
// canvasPosition > (Absolute/Relative) > (Start/Mid/End) > (X/Y)
var canvasPosition = {
    // absolute: {
    //     top: {
    //         left: Math.floor(canvasBoundingRect.left)
    //         , center: adf
    //         , right: Math.floor(canvasBoundingRect.top)
    //     }, center: {
    //         left: Math.floor((canvasBoundingRect.right - canvasBoundingRect.left)/2)
    //         , center: asdf
    //         , right: Math.floor((canvasBoundingRect.bottom - canvasBoundingRect.top)/2)
    //     }, end: {
};

var xPositions = {
    top: 0
    , center: canvas.height/2
    , bottom: canvas.height
};
var yPositions = {
    left: 0
    , center: canvas.width/2
    , right: canvas.width
};
var toAbsolute = function (obj) {
    if (obj.x === undefined || obj.y === undefined) throw 'bad obj'
    return {
        x: obj.x + Math.floor(canvasBoundingRect.top)
        , y: obj.y + Math.floor(canvasBoundingRect.left)
    };
};
var toRelative = //stub

for (var xKey in xPositions) {
    for (var yKey in yPositions) {
        if (!canvasPosition[xKey]) canvasPosition[xKey] = {};
        var relativeCoordinates = {
            x: xPositions[xKey]
            ,y: yPositions[yKey]
        };
        canvasPosition[xKey][yKey] = relativeCoordinates;
        canvasPosition[xKey][yKey].toAbsolute = toAbsolute.bind(this);

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
vertices.push(new Vertex(0, 0));
vertices.push(new Vertex(100, 100));
// vertices.push(new Vertex(canvasPosition.relative.mid.x, canvasPosition.relative.mid.y));
// vertices.push(new Vertex(canvasPosition.relative.end.x, canvasPosition.relative.end.y));


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
    // event gives x/y coordinate on the page but we need it relative to the canvas
    var absolutePos = toRelative(event);
    mouseLoc.x = absolutePos.x;
    mouseLoc.y = absolutePos.y;

    //console.log('(' + mouseLoc.x + '),(' + mouseLoc.y + ')');
});

