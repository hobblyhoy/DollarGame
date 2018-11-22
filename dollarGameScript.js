"use strict";
/* global document,window,console,requestAnimationFrame,setTimeout*/
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
var edgeStandardWidth = 3;
var edgeLargeWidth = 10;

//-- Game State
var mouseLoc = {x:null, y: null}; // last known mouse location relative to canvas
var edges = [];
var vertices = [];
var adjacentList = {};
var vertexIdCount = 0;


//-- Helper Utils
var getVertexById = function(id) {
    for (var i = 0; i < vertices.length; i++) {
        if (vertices[i].id === id) return vertices[i];
    }

    throw 'unable to find vertex with id: ' + id;
};

// sets selected on provided vertex, sets all others to deselected
// id = id of vertex. Pass -1 to deselect all.
var selectVertexById = function(id) {
    var foundId = false;
    vertices.forEach(function(vertex) {
        if (vertex.id === id) {
            vertex.isSelected = true;
            foundId = true;
        } else {
            vertex.isSelected = false;
        }
    });

    if (!foundId && id >= 0) throw 'unable to find vertex with id: ' + id;
};

// set sselected on all edges to provided vertex, sets all others to deselected
// id = id of vertex. Pass -1 to deselect all.
var selectEdgesByVertexId = function(id) {
    var vertex = (id >= 0) ? getVertexById(id) : null;

    edges.forEach(function(edge) {
        // first conditional is technically not necessary, just here for code clarity
        if (vertex === null) {
            edge.isSelected = false;
        } else if (edge.vertexA === vertex || edge.vertexB === vertex) {
            edge.isSelected = true;
        } else {
            edge.isSelected = false;
        }
    });
};


//-- Game objects
var Vertex = function(x, y) {
    this.x = x;
    this.y = y;
    this.radius = standardRadius;
    this.isSelected = false; //unimplemented!
    this.id = vertexIdCount;
    vertexIdCount++;

    // update ajacentList
    adjacentList[this.id] = [];

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
        c.fillStyle = 'rgb('+ this.id + ',0,255)';
        c.fill();
    };
};

var Edge = function(vertexA, vertexB) {
    this.vertexA = vertexA;
    this.vertexB = vertexB;
    this.isSelected = false; //unimplemented
    this.lineWidth = edgeStandardWidth;

    // update ajacentList
    adjacentList[vertexA.id].push(vertexB);
    adjacentList[vertexB.id].push(vertexA);

    this.render = function() {
        // Expand or contract the line width based on isSelected
        if (this.isSelected && this.lineWidth < edgeLargeWidth) {
            this.lineWidth++;
        } else if (!this.isSelected && this.lineWidth > edgeStandardWidth) {
            this.lineWidth--;
        }

        c.beginPath();
        c.moveTo(vertexA.x, vertexA.y);
        c.lineTo(vertexB.x, vertexB.y);
        c.lineWidth = this.lineWidth;
        c.stroke();
    };

};

//-- Game Init
for (var i = 0; i < 5; i++) {
    var pos = getPosition(Math.random() * 90 + 5, Math.random() * 90 + 5);
    vertices.push(new Vertex(pos.x, pos.y));
}

edges.push(new Edge(vertices[0], vertices[1]));
edges.push(new Edge(vertices[1], vertices[2]));
edges.push(new Edge(vertices[2], vertices[0]));
edges.push(new Edge(vertices[0], vertices[3]));
edges.push(new Edge(vertices[3], vertices[4]));


//-- Game Logic & Animation Loop
var animationLoop = function() {
    c.clearRect(0, 0, canvas.width, canvas.height); // clear canvas

    edges.forEach(function(edge) {
        edge.render();
    });

    vertices.forEach(function(vertex) {
        vertex.render();
    });


    // Keep my laptop from burning a hole in my lap
    setTimeout(requestAnimationFrame.bind(this,animationLoop), 10);
    //requestAnimationFrame(animationLoop);
};
animationLoop();


//-- Event Listeners
window.addEventListener('mousemove', function(event) {
    // event gives absolute x/y coordinate on the page but we need it relative to the canvas
    var relativePos = toRelative(event);
    mouseLoc.x = relativePos.x;
    mouseLoc.y = relativePos.y;

    //console.log('(' + mouseLoc.x + '),(' + mouseLoc.y + ')');
});

window.addEventListener('click', function(event) {
    // We detect the color under the mouse and use that to determine which node we've clicked
    // probably not the most typical hit detection technique but hey it actually works pretty darn well
    // and avoids clever math with overlapping and expanding radius circles
    var clickPixel = c.getImageData(mouseLoc.x, mouseLoc.y, 1, 1).data;

    //pay attention to the click if it was on a vertice:
    var r = clickPixel[0]; //our vertice id
    var g = clickPixel[1]; //should match 0
    var b = clickPixel[2]; //should match 255
    if (r < vertices.length && g === 0 && b === 255) {
        console.log('vertex click detected on id:' + r);
        //var vertex = getVertexById(r);
        selectVertexById(r);
        selectEdgesByVertexId(r);
        //console.log(vertex);
    }
    //todo else if logic here for click on buttons
    else {
        selectVertexById(-1);
        selectEdgesByVertexId(-1);
    }

});