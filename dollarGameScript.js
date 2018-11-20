"use strict";
/* global document,window,console,requestAnimationFrame*/
/* jshint -W097,-W014 */ //turn off use strict and comma styling warnings

// Canvas init
var canvas = document.querySelector('canvas');
var canvasWidth = window.innerWidth-2;
var canvasHeight = window.innerHeight-2;
canvas.width = canvasWidth;
canvas.height = canvasHeight;
var c = canvas.getContext('2d');


// Constants
var standardRadius = 30;
var largeRadius = 40;

// Helper Utils


// Game State
var vertices = [];
var mouseLoc = {x:null, y: null}; // last known mouse location


// Game objects
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


// Game Init
vertices.push(new Vertex(0,0));
vertices.push(new Vertex(100,100));
vertices.push(new Vertex(300,300));


// Game Logic & Animation Loop
var animationLoop = function() {
    c.clearRect(0, 0, canvasWidth, canvasHeight); // clear canvas

    vertices.forEach(function(vertex) {
        vertex.render();
    });

    requestAnimationFrame(animationLoop);
};
animationLoop();


// Event Listeners
window.addEventListener('mousemove', function(event) {
    mouseLoc.x = event.x;
    mouseLoc.y = event.y;
});

