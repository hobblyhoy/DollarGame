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

var canvasStartX = Math.floor(canvasBoundingRect.left);
var canvasStartY = Math.floor(canvasBoundingRect.top);


//-- Constants
var standardRadius = 30;
var largeRadius = 40;

//-- Helper Utils


//-- Game State
var vertices = [];
var mouseLoc = {x:null, y: null}; // last known mouse location


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
vertices.push(new Vertex(0,0));
vertices.push(new Vertex(100,100));
vertices.push(new Vertex(300,300));


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
    mouseLoc.x = event.x - canvasStartX;
    mouseLoc.y = event.y - canvasStartY;

    //console.log('(' + mouseLoc.x + '),(' + mouseLoc.y + ')');
});

