const canvas = document.getElementById("graph");
const c = canvas.getContext("2d");
const ratio = window.devicePixelRatio;
canvas.width = window.innerWidth*ratio;
canvas.height = window.innerHeight*ratio;
canvas.style.width = window.innerWidth + "px";
canvas.style.height = window.innerHeight + "px";

let initialWidth = 21;
let scale = canvas.width/initialWidth;
let cornerX = -initialWidth/2;
let cornerY = -initialWidth/20;

window.addEventListener('resize', function() {
    update();
});

let options = {
    showGridlines: true,
    showNumbers: true
}

let lcOptions = {
    showPoints: true,
    showLine: true,
    drawDerivative: false,
    points: [],
    values: []
};
let controls = {
    x: getXCoord(0),
    y: getYCoord(0),
    touchX: getXCoord(0),
    touchY: getYCoord(0),
    touchHypot: undefined,
    xPoint: 0,
    yPoint: 0,
    pressed: false
};

function onMouseMove(x, y, dx = 0, dy = 0, pressed = controls.pressed) {
    controls.touchX = x;
    controls.touchY = y;
    controls.x = x*ratio;
    controls.y = y*ratio;
    controls.xPoint = getXPoint(controls.x);
    controls.yPoint = getYPoint(controls.y);
    if (pressed) {
        cornerX -= dx/scale;
        cornerY += dy/scale;
        update();
    }
}
canvas.addEventListener('mousemove', function(e) {
    onMouseMove(e.clientX, e.clientY, e.movementX, e.movementY);
});
canvas.addEventListener('mousedown', function(e) {
    onMouseMove(e.clientX, e.clientY);
    controls.pressed = true;
});
canvas.addEventListener('mouseup', function(e) {
    controls.pressed = false;
    onMouseMove(e.clientX, e.clientY);
});

canvas.addEventListener('wheel', function(e) {
    linearTransitionScale(7/6, -e.deltaY/100, 150);
});

canvas.addEventListener('touchstart', function(e) {
    e.preventDefault();
    if (e.touches.length == 1) {
        canvas.dispatchEvent(new MouseEvent('mousedown', {
            clientX: e.touches[0].clientX,
            clientY: e.touches[0].clientY
        }));
    } else {
        if (e.touches.length != 0) {
            onMouseMove((e.touches[0].clientX+e.touches[1].clientX)/2, (e.touches[0].clientY+e.touches[1].clientY)/2, 0, 0, false);
            controls.touchHypot = Math.hypot(e.touches[0].clientX-e.touches[1].clientX, e.touches[0].clientY-e.touches[1].clientY);
        }
    }
});
canvas.addEventListener('touchend', function(e) {
    e.preventDefault();
    if (e.touches.length == 1) {
        canvas.dispatchEvent(new MouseEvent('mousedown', {
            clientX: e.touches[0].clientX,
            clientY: e.touches[0].clientY
        }));
    } else if (e.touches.length == 0) {
        canvas.dispatchEvent(new MouseEvent('mouseup'));
    } else {
        onMouseMove((e.touches[0].clientX+e.touches[1].clientX)/2, (e.touches[0].clientY+e.touches[1].clientY)/2, 0, 0, false);
        controls.touchHypot = Math.hypot(e.touches[0].clientX-e.touches[1].clientX, e.touches[0].clientY-e.touches[1].clientY);
    }
});

canvas.addEventListener('touchmove', function(e) {
    e.preventDefault();
    if (e.touches.length == 1) {
       onMouseMove(e.touches[0].clientX, e.touches[0].clientY, (e.touches[0].clientX - controls.touchX)*ratio, (e.touches[0].clientY - controls.touchY)*ratio, controls.pressed);
    } else if (e.touches.length == 2) {
        let x1 = e.touches[0].clientX;
        let y1 = e.touches[0].clientY;
        let x2 = e.touches[1].clientX;
        let y2 = e.touches[1].clientY;
        let newX = (x1+x2)/2;
        let newY = (y1+y2)/2;
        let hypot = Math.hypot(x1-x2, y1-y2);
        onMouseMove(newX, newY, (newX - controls.touchX)*ratio, (newY - controls.touchY)*ratio); 
        instantScale(hypot/controls.touchHypot);
        controls.touchHypot = hypot;
    }
});

function instantScale(multiplier) {
    let pointDistX = controls.xPoint - cornerX;
    let pointDistY = controls.yPoint - cornerY;
    scale *= multiplier;
    cornerX += pointDistX*(1-1/multiplier);
    cornerY += pointDistY*(1-1/multiplier);
    update();
}

function linearTransitionScale(base, power, totalTime) {
    linearTransitionLoop(base, power, totalTime, performance.now(), performance.now());
}
function linearTransitionLoop(base, power, totalTime, lastTime, startTime) {
    let pointDistX = controls.xPoint - cornerX;
    let pointDistY = controls.yPoint - cornerY;
    if (lastTime - startTime >= totalTime) {
        scale *= Math.pow(base, -power*(lastTime - startTime - totalTime)/totalTime);
        cornerX += pointDistX*(1-Math.pow(base, power*(lastTime - startTime - totalTime)/totalTime));
        cornerY += pointDistY*(1-Math.pow(base, power*(lastTime - startTime - totalTime)/totalTime));
        update();
        return;
    }
    let time = performance.now();
    scale *= Math.pow(base, power*(time-lastTime)/totalTime);
    cornerX += pointDistX*(1-Math.pow(base, -power*(time-lastTime)/totalTime));
    cornerY += pointDistY*(1-Math.pow(base, -power*(time-lastTime)/totalTime));
    update();
    requestAnimationFrame(()=>{
        linearTransitionLoop(base, power, totalTime, time, startTime);
    });
}

function getCoords(point) {
    return [getXCoord(point[0]), getYCoord(point[1])];
}

function getXCoord(x) {
    return (x - cornerX)*scale;
}
function getYCoord(y) {
    return canvas.height - (y - cornerY)*scale;
}

function getPoint(coords) {
    return [getXPoint(coords[0]), getYPoint(coords[1])];
}
function getXPoint(x) {
    return x/scale + cornerX;
}
function getYPoint(y) {
    return (canvas.height-y)/scale + cornerY;
}

function drawPoints(points) {
    for (let point of points) {
        const coords = getCoords(point);
        c.beginPath();
        c.moveTo(coords[0],coords[1]);
        c.arc(coords[0], coords[1], 5*ratio, 0, 2*Math.PI);
        c.fillStyle = "rgba(60, 60, 60, 0.8)";
        c.fill();
        c.closePath();
    }
}

function confineY(y) {
    if (y < cornerY - 10) {
        y = cornerY - 10;
    } else if (y > cornerY + canvas.height/scale + 10) {
        y = cornerY+canvas.height/scale + 10;
    }
    return y;
}

function drawGeoFunctionOld(values) {
    let dx = 1/scale;
    let x = cornerX;//parseInt(cornerX) - 1/dx;
    let yCoord = getYCoord(geoValue(x, values));
    c.beginPath();
    c.lineWidth = 3;
    c.moveTo(getXCoord(x), yCoord);
    while (getXCoord(x) < canvas.width) {
        x += dx;
        const yCoord = getYCoord(geoValue(x, values));
        c.lineTo(getXCoord(x),yCoord);
    }
    c.strokeStyle = "rgb(123, 149, 201)";
    c.stroke();
    c.closePath();
}

function drawGeoFunction(values) {
    let dx = 1;
    let x = (Math.floor(cornerX)-cornerX)*scale - dx;
    c.beginPath();
    c.lineWidth = 3*ratio;
    c.moveTo(x, getYCoord(geoValue(getXPoint(x), values)));
    while (x < canvas.width) {
        x += dx;
        c.lineTo(x, getYCoord(geoValue(getXPoint(x), values)));
    }
    c.strokeStyle = "rgb(123, 149, 201)";
    c.stroke();
    c.closePath();
}

function drawDerivative(values) {
    let dx = 1;
    let x = (Math.floor(cornerX)-cornerX)*scale - dx;
    let y = getYCoord(geoValue(getXPoint(x), values));
    c.beginPath();
    c.lineWidth = 3*ratio;
    c.moveTo(x, y);
    while (x < canvas.width) {
        x += dx;
        let oldY = y;
        y = getYCoord(geoValue(getXPoint(x), values));
        let dy = y - oldY;
        c.lineTo(x, getYCoord(dy/dx));
    }
    c.strokeStyle = "rgb(201, 123, 123)";
    c.stroke();
    c.closePath();
}

function geoValue(x, values) {
    let y = 0;
    for (let i = 0; i < values.length; i++) {
        y += values[i] * Math.pow(x, i);
    }
    return y;
}

function drawFromPoints(points) {
    drawGeoFunction(simpleSolveMatrix(simpleGaussElim(functionMatrix(points))));
}

const textFont = 12*ratio + 'px "Open Sans", Arial, sans-serif';

function roundByTens(num, roundingPlace, roundingFactor) {
    let coord = num;
    if (roundingPlace >= 0) {
        coord = parseFloat(coord.toFixed(roundingPlace));
    } else {
        coord = Math.round(coord/roundingFactor)*roundingFactor;
    }
    return coord;
}

const graphTolerance = 8;

function drawAxes(gridlines, numbers) {
    let origin = getCoords([0,0]);
    let tenPower = Math.log10(200*ratio/scale);
    let tenScale = Math.pow(10, Math.ceil(tenPower));
    let divisor = Math.pow(10, Math.ceil(tenPower)-tenPower);
    let roundingPlace = 1 - Math.ceil(tenPower);
    let roundingFactor = tenScale/10;
    let roundedDivisor = 10;
    let smallFrequency = 5;
    if (divisor <= 5 && divisor > 2) {
        roundedDivisor = 5;
        smallFrequency = 4;
    } else if (divisor < 2) {
        roundedDivisor = 2;
    }
    let repeatNumbers = tenScale/roundedDivisor;
    let repeat = repeatNumbers/smallFrequency;
    if (gridlines) {
        let x = origin[0]%(scale*repeat);
        while (x < canvas.width) {
            let coord = roundByTens(getXPoint(x), roundingPlace+smallFrequency-1, roundingFactor/smallFrequency);
            c.beginPath();
            if (Math.abs(parseFloat((10/tenScale*coord).toFixed(graphTolerance))%(10/roundedDivisor)) == 0) {
                c.lineWidth = 1*ratio;
                c.strokeStyle = "#aaa";
            } else {
                c.lineWidth = 0.5*ratio;  
                c.strokeStyle = "#ddd";
            }
            c.moveTo(x, 0);
            c.lineTo(x, canvas.height);
            c.stroke();
            c.closePath();
            x += scale*repeat;
        }
        let y = origin[1]%(scale*repeat);
        while (y < canvas.height) {
            let coord = roundByTens(getYPoint(y), roundingPlace+smallFrequency-1, roundingFactor/smallFrequency);
            c.beginPath();
            if (Math.abs(parseFloat((10/tenScale*coord).toFixed(graphTolerance))%(10/roundedDivisor)) == 0) {
                c.lineWidth = 1*ratio;
                c.strokeStyle = "#aaa";
            } else {
                c.lineWidth = 0.5*ratio;  
                c.strokeStyle = "#ddd";
            }
            c.moveTo(0,y);
            c.lineTo(canvas.width,y);
            c.stroke();
            c.closePath();
            y += scale*repeat;
        }
    }
    c.beginPath();
    c.moveTo(origin[0], 0);
    c.lineTo(origin[0], canvas.height);
    c.moveTo(0,origin[1]);
    c.lineTo(canvas.width,origin[1]);
    c.lineWidth = 2*ratio;
    c.strokeStyle = "#777";
    c.stroke();
    c.closePath();
    if (numbers) {
        c.font = textFont;
        c.textAlign = "end";
        c.textBaseline = "top";
        c.fillStyle = "#444";
        c.strokeStyle = "#fff";
        c.lineWidth = 3;
        c.strokeText(0, origin[0]-10, origin[1]+10);
        c.fillText(0, origin[0]-10, origin[1]+10);
        let x = origin[0]%(scale*repeatNumbers);
        while (x < canvas.width) {
            let coord = roundByTens(getXPoint(x), roundingPlace, roundingFactor);
            if (coord == 0) {
                x += scale*repeatNumbers;
                continue;
            }
            c.textAlign = "center";
            c.textBaseline = "top";
            c.strokeText(coord, x, origin[1]+10);
            c.fillText(coord, x, origin[1]+10);
            x += scale*repeatNumbers;
        }
        let y = origin[1]%(scale*repeatNumbers);
        while (y < canvas.height) {
            let coord = roundByTens(getYPoint(y), roundingPlace, roundingFactor);
            if (coord == 0) {
                y += scale*repeatNumbers;
                continue;
            }
            c.textAlign = "end";
            c.textBaseline = "middle";
            c.strokeText(coord, origin[0]-10, y);
            c.fillText(coord, origin[0]-10, y);
            y += scale*repeatNumbers;
        }
    }
}

function updateInformation() {
    lcOptions.values = simpleSolveMatrix(simpleGaussElim(functionMatrix(lcOptions.points)));
    $(document).trigger("updateInformation", [lcOptions.points, lcOptions.values]);
    update();
}

function update() {
    canvas.width = window.innerWidth*ratio;
    canvas.height = window.innerHeight*ratio;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    c.clearRect(0, 0, canvas.width, canvas.height);
    drawAxes(options.showGridlines, options.showNumbers);
    if (lcOptions.drawDerivative) {
        drawDerivative(lcOptions.values);
    }
    if (lcOptions.showLine && lcOptions.points.length != 0) {
        drawGeoFunction(lcOptions.values);
    }
    if (lcOptions.showPoints) {
        drawPoints(lcOptions.points);
    }
}

update();