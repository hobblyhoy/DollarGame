"use strict";
/* global document,window,console,requestAnimationFrame,setTimeout*/
/* jshint -W097,-W014 */ //turn off use strict and comma styling warnings


//----- Canvas init
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
var getSize = function(widthPercent, heightPercent) {
    return {
        width: Math.floor(widthPercent * 0.01 * canvas.width)
        , height: Math.floor(heightPercent * 0.01 * canvas.height)
    };
};


//----- Constants
var STANDARD_RADIUS = 30;
var LARGE_RADIUS = 40;
var EDGE_STANDARD_WIDTH = 3;
var EDGE_LARGE_WIDTH = 10;
var BUTTON_SIZE = 40;
var BUTTON_BUFFER = 20;


//----- Game State
var mouseLoc, edges, vertices, adjacentList, vertexIdCount, actionButtons, gameHasStarted; // last known mouse location relative to canvas
var resetGameState = function() {
    mouseLoc = {x:null, y: null}; // last known mouse location relative to canvas
    edges = [];
    vertices = [];
    adjacentList = {};
    vertexIdCount = 0;
    actionButtons = [];
    gameHasStarted = false;    
};


//----- Helper Utils
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

var toggleButtons = function(isShown) {
    actionButtons.forEach(function(actionButton) {
        actionButton.isShown = isShown;
    });
};

var getSelectedVertex = function() {
    for (var i = 0; i < vertices.length; i++) {
        if (vertices[i].isSelected === true) return vertices[i];
    }

    throw 'error, no vertice selected';
};

// min and max are inclusive
var getRandomInt = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};


//----- Game objects
var Vertex = function(x, y, value) {
    this.x = x;
    this.y = y;
    this.radius = STANDARD_RADIUS;
    this.isSelected = false; //unimplemented!
    this.id = vertexIdCount;
    this.value = value;
    
    vertexIdCount++; // increment so the next id is unique
    adjacentList[this.id] = []; // update ajacentList

    this.render = function() {
        // Expand or contract the radius on mouse over OR selection
        var isMousedOver = Math.abs(mouseLoc.x - this.x) < this.radius && Math.abs(mouseLoc.y - this.y) < this.radius;
        if ((this.isSelected||isMousedOver) && this.radius < LARGE_RADIUS) {
            this.radius++;
        } else if (!this.isSelected && !isMousedOver && this.radius > STANDARD_RADIUS) {
            this.radius--;
        }

        //var color = 'rgb('+ (i*17)%256  + ',0,255)';
        // color changes happen logarithmically. 
        // colorShift moves 120 => 60 => 30 => ... => 0
        var color, shift;
        if (this.value >= 0) {
            shift = Math.floor(120 / (this.value + 1)) + 80;
            // green should run (0,200,0) => (0, 80, 0);
            color = 'rgb(0,' + shift + ',0)';
        } else {
            shift = Math.floor(120 / (this.value * -1));
            // red should run from (255,120,120) => (255,0,0)
            color = 'rgb(255,' + shift + ',' + shift + ')';
        }

        // Draw
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0,  Math.PI * 2, false);
        //c.fillStyle = 'rgb('+ this.id + ',0,255)';
        c.fillStyle = color;
        c.fill();

        c.font = '40px san-serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        //c.lineWidth = 2;
        //c.strokeStyle = 'black';
        //c.strokeText(this.value, this.x, this.y);
        c.fillStyle = 'white';
        c.fillText(this.value, this.x, this.y);
    };
};

var Edge = function(vertexA, vertexB) {
    this.vertexA = vertexA;
    this.vertexB = vertexB;
    this.isSelected = false; //unimplemented
    this.lineWidth = EDGE_STANDARD_WIDTH;

    // update ajacentList
    adjacentList[vertexA.id].push(vertexB);
    adjacentList[vertexB.id].push(vertexA);

    this.render = function() {
        // Expand or contract the line width based on isSelected
        if (this.isSelected && this.lineWidth < EDGE_LARGE_WIDTH) {
            this.lineWidth++;
        } else if (!this.isSelected && this.lineWidth > EDGE_STANDARD_WIDTH) {
            this.lineWidth--;
        }

        c.beginPath();
        c.moveTo(vertexA.x, vertexA.y);
        c.lineTo(vertexB.x, vertexB.y);
        c.lineWidth = this.lineWidth;
        c.stroke();
    };

};

var ActionButton = function(x, y, width, height, color, content, action) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.content = content;
    this.isShown = false;

    this.isMousedOver = function() {
        return mouseLoc.x >= this.x && mouseLoc.x <= this.x + this.width
            && mouseLoc.y >= this.y && mouseLoc.y <= this.y + this.height;
    };

    this.render = function() {
        if (this.isShown) {
            c.beginPath();
            c.rect(x,y,width,height);
            c.fillStyle = this.color;
            c.fill();
            // c.lineWidth = 3;
            // c.strokeStyle = 'black';
            // c.stroke();

            c.font = 'bold ' + this.height + 'px san-serif';
            c.fillStyle = 'black';
            c.textAlign = 'center';
            c.textBaseline = 'middle';

            c.fillText(content, this.x + this.width/2, this.y + this.height/2);
        }
    };
};


//----- Animation Loop
var animationLoop = function() {
    c.clearRect(0, 0, canvas.width, canvas.height); // clear canvas

    edges.forEach(function(edge) {
        edge.render();
    });

    vertices.forEach(function(vertex) {
        vertex.render();
    });

    actionButtons.forEach(function(actionButton) {
        actionButton.render();
    });


    // Keep my laptop from burning a hole in my lap
    setTimeout(requestAnimationFrame.bind(this,animationLoop), 10);
    //requestAnimationFrame(animationLoop);
};


//----- Event Listeners
window.addEventListener('mousemove', function(event) {
    if (!gameHasStarted) return;
    // event gives absolute x/y coordinate on the page but we need it relative to the canvas
    var relativePos = toRelative(event);
    mouseLoc.x = relativePos.x;
    mouseLoc.y = relativePos.y;

    //console.log('(' + mouseLoc.x + '),(' + mouseLoc.y + ')');
});

window.addEventListener('click', function(event) {
    if (!gameHasStarted) return;
    // determine closest vertex 
    var closestVertex = { distance: Number.POSITIVE_INFINITY, vertex: null };
    vertices.forEach(function(vertex) {
        var distance = Math.sqrt(Math.pow(mouseLoc.x - vertex.x,2) + Math.pow(mouseLoc.y - vertex.y, 2));
        if (distance < closestVertex.distance) {
            closestVertex.distance = distance;
            closestVertex.vertex = vertex;
        }
    });

    // check if the cursors is over either of our action buttons
    var isMousedOverPlus = actionButtons[0].isMousedOver();
    var isMousedOverMinus = actionButtons[1].isMousedOver();
    // if: click on action buttons
    if (actionButtons[0].isShown && (isMousedOverPlus || isMousedOverMinus) ) {
        var selectedVertex = getSelectedVertex();
        var selectedVertexSiblings = adjacentList[selectedVertex.id];
        var modifier = isMousedOverPlus ? 1 : -1;

        // on a plus click you're giving that vertex's "points" to the other vertices
        // on a minus click you're pulling in the other vertices "points" to the selected vertex.
        selectedVertexSiblings.forEach(function(vertex) {
            vertex.value += modifier;
        });
        selectedVertex.value += selectedVertexSiblings.length * modifier * -1;

    // if: click on vertex
    } else if (closestVertex.distance <= LARGE_RADIUS) {
        console.log('vertex click detected on id:' + closestVertex.vertex.id);
        selectVertexById(closestVertex.vertex.id);
        selectEdgesByVertexId(closestVertex.vertex.id);
        toggleButtons(true);
    // if: click on whitespace
    } else {
        selectVertexById(-1);
        selectEdgesByVertexId(-1);
        toggleButtons(false);
    }
});

//document.getElementById('create-game')
//-- Game Init
var createGame = function() {
    resetGameState();

    var userVertices = document.getElementById('vertices').valueAsNumber;
    var userEdges = document.getElementById('edges').valueAsNumber;
    var userNetMoney = document.getElementById('net-money').valueAsNumber;

    // If I catch a wild hair I'll go back and do user input checks
    // but this project is all about Canvas so ¯\_(ツ)_/¯


    // Game theory notes:
    // to guarntee its winnable:
    // net$ >= 0 && net$ >= genus
    // genus == edges - vertices + 1;
    // in some cases a game is still winnable even if the 2nd criteria is not met!
    for (var i = 0; i < userVertices; i++) {
        var pos = getPosition(Math.random() * 90 + 5, Math.random() * 90 + 5);
        vertices.push(new Vertex(pos.x, pos.y, i));
    }

    // minEdges = a single line touching each node once
    var minimumEdges = vertices.length - 1;
    // maxEdges = summation from 1 to vertices count - 1. Thx Gauss for the shortcut.
    var maximumEdges = ((vertices.length - 1) / 2) * vertices.length;
    if (userEdges > maximumEdges || userEdges < minimumEdges) {
        throw 'TODO turn this error into UI feedback for the user about bad input at some point';
    }


    // Any graph with all vertices connected can always be resolved down 
    // to a single line of connected vertices by removing edges.
    // Since we always want all vertices connected we may as well start there.
    // Theres probably a cleverer way to do that but today I want to learn Canvas, not graph theory.
    for (var i = 1; i < vertices.length; i++) {
        edges.push(new Edge(vertices[i-1], vertices[i]));
    }

    // Now we need to construct the remaining edges
    // Note: we dont want to use traversal methods because that can lead to clumping of 
    // edges localized around our starting vertex.

    // blindly add all vertices to our list of potential Edge starting points
    // we'll whittle it down later as necessary.
    var potentialStartVertices = vertices.slice();

    var remainingEdgesToPlaceCount = userEdges - edges.length;
    while (remainingEdgesToPlaceCount > 0) {
        // randomly choose a vertex from our list of potentialStartVertices.
        var startVertexIndex = getRandomInt(0, potentialStartVertices.length - 1);
        var startVertex = potentialStartVertices[startVertexIndex];

        // Generate a list of potential end vertices for our edges. Basically:
        //  (all vertecies) - (adjacent vertices) - (this vertex) = (potential end vertices)
        // Note: for efficiency we could extract this to an array outside the loop.
        // However, real world perf difference is entirely negligble so I wont.
        var potentialEndVertices = vertices.filter(function(vertex) {
            return startVertex !== vertex && adjacentList[startVertex.id].indexOf(vertex) < 0;
        });

        if (potentialEndVertices.length > 0) {
            // randomly choose a vertex from the list of possible connections
            var endVertexIndex = getRandomInt(0, potentialEndVertices.length - 1);
            var endVertex = potentialEndVertices[endVertexIndex];

            // Hurray! we now have our new random generated edge
            edges.push(new Edge(startVertex, endVertex));
            remainingEdgesToPlaceCount--;
        } else {
            // If we didn't find any potential end vertices this vertex already has
            // an edge to every other vertex.
            // Remove it from the potentialStartVertices list so we dont try to find
            // any more edges for it in the future.
            potentialStartVertices = potentialStartVertices.filter(function(vertex) {
                return vertex !== startVertex;
            });
        }
    }


    actionButtons.push(new ActionButton(BUTTON_BUFFER, canvas.height - BUTTON_SIZE - BUTTON_BUFFER, BUTTON_SIZE, BUTTON_SIZE, 'green', '+', null));
    actionButtons.push(new ActionButton(BUTTON_BUFFER*2+BUTTON_SIZE, canvas.height - BUTTON_SIZE - BUTTON_BUFFER, BUTTON_SIZE, BUTTON_SIZE, 'red', '-', null));
    
    gameHasStarted = true;
    animationLoop();
};