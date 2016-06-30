    var ctx;
    var w = 20;
    var h = 20;
    var xOffset =  10;
    var yOffset =  10;
function initBlockCanvas() {
    var canvas = document.getElementById('canvasBlock');
    if (canvas.getContext){
        ctx = canvas.getContext('2d');
        ctx.font="10px Verdana";
        ctx.translate(0.5, 0.5);
        // ctx.scale(8,8)
        for (var a = 2; a < 10; a +=2) {
                ctx.strokeStyle = 'rgb(240,240,240)';
                ctx.beginPath();
                ctx.rect(xOffset + 30 - a,yOffset + 30 - a,2 * a,2 * a);
                ctx.stroke();
        }
        for (var x = 2; x < 20; x +=2) {
                ctx.strokeStyle = 'rgb(240,240,240)';
                ctx.beginPath();
                ctx.moveTo(xOffset + 40 + x,yOffset +  20);
                ctx.lineTo(xOffset + 40 + x,yOffset + 100);
                ctx.stroke();
        }
        for (var y = 2; y < 80; y +=2) {
                ctx.strokeStyle = 'rgb(240,240,240)';
                ctx.beginPath();
                ctx.moveTo(xOffset + 40,yOffset + 20 + y);
                ctx.lineTo(xOffset + 60,yOffset + 20 + y);
                ctx.stroke();
        }
        try { for (var y = yOffset; y <  600; y += h) {
              for (var x = xOffset; x < 1200; x += w) {
                ctx.strokeStyle = 'rgb(224,224,224)';
                ctx.beginPath();
                ctx.rect(x,y,w,h);
                ctx.stroke();
        }}}
        catch(err) { alert(err);}
    }
}
function rotate(pDirection,pVector) {
    var x = pVector[0];
    var z = pVector[1];
    switch (pDirection) {
        case 'E': return [ x, z]; break;
        case 'W': return [-x, z]; break;
        case 'S': return [ z,-x]; break;
        case 'N': return [-z, x]; break;
    }
}
function cBlock(pX,pY,pZ,pBlock,pKind) {
    var X,Y,Z;
    var Block;
    var Kind;
    this.X = pX;
    this.Y = pY;
    this.Z = pZ;
    this.Block = pBlock;
    this.Kind  = pKind;
}
cBlock.prototype.SetLocation = function (pX,pY,pZ) {
    this.X = pX;
    this.Y = pY;
    this.Z = pZ;
}
function cRedTorch(pX,pY,pZ,pDirection) {
    var Direction;
    this.SetLocation(pX,pY,pZ);
    this.Direction = pDirection;
}
cRedTorch.prototype = new cBlock(0,0,0,'redstone_torch',0);
cRedTorch.prototype.DrawBlock = function () {
    var lX = xOffset + this.X * w + w/2;
    var lZ = yOffset + this.Z * h + h/2;
    var upperLine = [rotate(this.Direction,[-w/2,-1]),rotate(this.Direction,[-2,-1])];
    var lowerLine = [rotate(this.Direction,[-w/2,+1]),rotate(this.Direction,[-2,+1])];
    ctx.strokeStyle = 'rgb(255,128,128)';
    ctx.beginPath();
    ctx.rect(lX-2,lZ-2,4,4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(lX + upperLine[0][0], lZ + upperLine[0][1]);
    ctx.lineTo(lX + upperLine[1][0], lZ + upperLine[1][1]);
    ctx.moveTo(lX + lowerLine[0][0], lZ + lowerLine[0][1]);
    ctx.lineTo(lX + lowerLine[1][0], lZ + lowerLine[1][1]);
    ctx.stroke();
}
function cRepeater(pX,pY,pZ,pDirection,pDelay) {
    var Direction;
    var Delay;
    this.SetLocation(pX,pY,pZ);
    this.Direction = pDirection;
    this.Delay     = pDelay;
}
cRepeater.prototype = new cBlock(0,0,0,'repeater',0);
cRepeater.prototype.DrawBlock = function () {
    var lX = xOffset + this.X * w + w/2;
    var lZ = yOffset + this.Z * h + h/2;
    var triangle = [[-7,-8], [-7,+8], [+7, 0]];
    ctx.strokeStyle = 'rgb(64,64,64)';
    ctx.beginPath();
    for (var i = 0; i < triangle.length; i++) {
        var vector = rotate(this.Direction,triangle[i]);
        var x = lX + vector[0];
        var z = lZ + vector[1];
        if (i == 0) { ctx.moveTo(x,z); } else { ctx.lineTo(x,z); }
    }
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = 'rgb(255,128,128)';
    var dots = [];
    switch(this.Delay) {
    case 1: dots = [[-2, 0]                        ]; break;
    case 2: dots = [[-4, 0],        [ 0, 0]        ]; break;
    case 3: dots = [[-4,-2],[-4,+2],[ 0, 0]        ]; break;
    case 4: dots = [[-4,-3],[-4,+3],[-2, 0],[+1, 0]]; break;
    case 5: dots = [[-4,-3],[-4,+3],[ 0,-2],[ 0,+2]]; break;
    case 6: dots = [[-4,-1],[-4,+1],[-1,-1],[-1,+1]]; break;
    }
    ctx.strokeStyle = 'rgb(255,128,128)';
    for (var i = 0; i < dots.length; i++) {
        var vector = rotate(this.Direction,dots[i]);
        ctx.beginPath();
        ctx.rect(lX + vector[0] - 1, lZ + vector[1] - 1,2,2);
        ctx.stroke();
    }
}
function cWire(pDirections = ['E','W','N','S'], pXYZ = [0,0,0]) {
    var Directions
    this.Directions = pDirections;
    this.SetLocation(pXYZ[0],pXYZ[1],pXYZ[2]);
}
cWire.prototype = new cBlock(0,0,0,'redstone_wire',0);
cWire.prototype.DrawBlock = function() {
    var vector;
    var lX = xOffset + this.X * w + w/2;
    var lZ = yOffset + this.Z * h + h/2;
    ctx.strokeStyle = 'rgb(255,128,128)';
    for (var dir = 0; dir < this.Directions.length; dir++) {
        var vector = rotate(this.Directions[dir],[w/2-1,0]);
        ctx.beginPath();
        ctx.moveTo(lX,lZ);
        ctx.lineTo(lX + vector[0], lZ + vector[1]);
        ctx.stroke();
    }
}
function DrawBlocks() {
    var directions = ['E','W','N','S'];
    for (var dir = 0; dir < directions.length; dir++) {
        lTorch = new cRedTorch(1,1,1+dir,directions[dir]);
        lTorch.DrawBlock();
        for (var delay = 1; delay <= 4; delay++) {
            lRepeater = new cRepeater(1+delay,1,1+dir,directions[dir],delay);
            lRepeater.DrawBlock();
        }
    }
    for (var x = 1; x <=4; x++) {
    for (var z = 1; z <=4; z++) {
        directions = [];
        if (x % 2 == 0) { directions.push('E'); }
        if (x > 2     ) { directions.push('W'); }
        if (z % 2 == 0) { directions.push('N'); }
        if (z > 2     ) { directions.push('S'); }
        lWire = new cWire(directions,[x,1,6+z]);
        lWire.DrawBlock();
    }}
}