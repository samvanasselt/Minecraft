    var gSignalCanvas;
    var gLayerCanvasses = [];
    var gSignals = [];
    var gSigShow = [];
    var gComponents = [];
    var gDisplay = [];
    var gBlocksOld = [];
    var gBlocks = [];
    var w = 8;
    var xOffset = 0;
    var yOffset = 0;
    var xScale = 20;
    var zScale = 20;
    var gMaxPower = 15;
    var gStyleWire = 'rgb(255,64,64)';
// ========================================================================== //
function cUnit(pIndexFirstBlock = 0) {
    var IndexFirstBlock;
    var IndexLastBlock;
    this.IndexFirstBlock = pIndexFirstBlock;
}
cUnit.prototype.SetIndexLastBlock = function(pIndexLastBlock) {this.IndexLastBlock = pIndexLastBlock;}
// ========================================================================== //
function initSignalCanvas() {
    var canvas = document.getElementById('canvasSignaal');
    if (canvas.getContext){
        gSignalCanvas = canvas.getContext('2d');
        gSignalCanvas.setTransform(1, 0, 0, 1, 0, 0);
        gSignalCanvas.clearRect(0, 0, canvas.width, canvas.height);
        var h = 16;
        var x0 = 100;
        gSignalCanvas.font="10px Verdana";
        try { for (var y = 10; y < 600; y += 25) {
            for (var x = x0; x < 1500; x += w) {
                gSignalCanvas.strokeStyle = 'rgb(224,224,224)';
                gSignalCanvas.beginPath();
                gSignalCanvas.rect(x,y,w,h);
                gSignalCanvas.stroke();
                if ((x - x0) % (10 * w) == 0) {
                    gSignalCanvas.strokeStyle = 'rgb(192,192,192)';
                    gSignalCanvas.beginPath();
                    gSignalCanvas.rect(x,y,1,25);
                    gSignalCanvas.stroke();
                }
        }}}
        catch(err) { alert(err);}
        for (var y = 10; y < 600; y += 25) {
            gSignalCanvas.strokeStyle = 'rgb(224,224,224)';
            gSignalCanvas.beginPath();
            gSignalCanvas.rect(0,y,x0,h);
            gSignalCanvas.stroke();
        }
    }
}
function initLayerCanvas(pCanvasnaam) {
    var canvas = document.getElementById(pCanvasnaam);
    if (canvas.getContext){
        var ctx = canvas.getContext('2d');
        var dx = 0;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font="10px Verdana";
        ctx.strokeStyle = 'rgb(199,199,199)';
        ctx.fillStyle = "rgb(207,207,207)";
        ctx.translate(0.5, 0.5);
        try { for (var z = 0; z < canvas.height; z +=     zScale) {
              for (var x = 0; x < canvas.width ; x += 2 * xScale) {
                dx = z % (2 * zScale);
                ctx.beginPath(); ctx.rect(x,z,xScale,zScale);          ctx.stroke();
                ctx.beginPath(); ctx.rect(x + xScale,z,xScale,zScale); ctx.stroke();
                ctx.beginPath(); ctx.rect(x + dx,z,xScale,zScale);     ctx.stroke();
            }
            ctx.fillText(z / zScale - 1, canvas.width - 17, z - 7);
        }}
        catch(err) { alert(err);}
        for (var x = 0; x < 20*xScale; x += xScale) {ctx.fillText(x / xScale, x + 3, canvas.height - 7);}
        gLayerCanvasses.push(ctx);
    }
}
function initCanvasses() {
    initSignalCanvas();
    gLayerCanvasses = [];
    initLayerCanvas('Alles');
    for (var i = 1; i <= 16; i++) { initLayerCanvas('Laag-' + i); }
}
// ========================================================================== //
function ShowRow(pHTML) {
     document.getElementById("foutmelding").innerHTML += pHTML;
}
function FixLength(pString, pLength) {
    if      (pString.length  > pLength) { return pString.substr(0, pLength);}
    else if (pString.length == pLength) { return pString;}
    else                                { return pString + '&nbsp;'.repeat(pLength - pString.length);}
}
function rotate(pDirection,pVector) {
    var x = pVector[0];
    var z = pVector[1];
    switch (pDirection) {
        case 'E': return [ x, z]; break;
        case 'W': return [-x, z]; break;
        case 'N': return [ z,-x]; break;
        case 'S': return [-z, x]; break;
        case 'U': return [ 0, 0]; break;
    }
}
// ========================================================================== //
function cBlockInfo(pBlocktype = 'stone', pSubtype = '') {
    var ID;         // Block ID
    var Blocktype;  // Blocktype = Minecraft block name
    var Subtype;    // Subtype (orientation / color / ...) = Minecraft block damage
    //  ------------------------------------------  //
    this.Blocktype = pBlocktype;
    this.Subtype   = pSubtype;
}
cBlockInfo.prototype.CommandTerm = function() { return (this.Subtype == '' ? this.Blocktype : this.Blocktype + this.Subtype) }
cBlockInfo.prototype.DrawBlock = function(y, ctx, pLocation) {
    lSubtype = (typeof this.Subtype == 'number') ? this.Subtype : parseInt(this.Subtype);
    switch(this.Blocktype) {
        case 'support': switch(lSubtype) {
            default: lColor = 'rgba(240,240,240,1.0)'; break;
        } break;
        case 'stone': switch(lSubtype) {
            case  0: lColor = 'rgba(192,192,192,0.3)'; break;
            default: lColor = 'rgba(128,128,128,0.3)'; break;
        } break;
        case 'stained_hardened_clay': switch(lSubtype) {
            case  3: lColor = 'rgb(128,128,255)'; break;
            case  4: lColor = 'rgb(255,255,128)'; break;
            case 14: lColor = 'rgb(255,160,128)'; break;
        } break;
        case 'stone_slab': switch(lSubtype) {
            case  3: lColor = 'rgb(128,128,255)'; break;
            case  8: lColor = 'rgb(160,160,160)'; break;
            case 10: lColor = 'rgb(255,160,128)'; break;
        } break;
        case 'stone_slab2': switch(lSubtype) {
            case  8: lColor = 'rgb(255,192,128)'; break;
        } break;
        case 'planks': switch(lSubtype) {
            case  4: lColor = 'rgb(255,207,128)'; break;
        } break;
        case 'wooden_slab': switch(lSubtype) {
            case 12: lColor = 'rgb(255,207,128)'; break;
        } break;
        case 'sandstone': switch(lSubtype) {
            case  0: lColor = 'rgba(255,255,128,0.5)'; break;
        } break;
        case 'red_sandstone': switch(lSubtype) {
            case  0: lColor = 'rgba(255,192,128,0.5)'; break;
            case  8: lColor = 'rgba(128,128,128,0.5)'; break;
            case 10: lColor = 'rgba(255,192,128,0.5)'; break;
        } break;
    }
    if (pLocation.Y == y) {
        var lX = xScale * pLocation.X;
        var lZ = zScale * pLocation.Z;
        var lL = xScale;
        var lW = zScale;
        ctx.fillStyle = lColor;
        ctx.fillRect(lX, lZ, lL, lW);
        ctx.strokeStyle = 'rgb(128,128,128)';
        ctx.rect(lX, lZ, lL, lW);
        ctx.stroke();
    }
}
function LocationBelow(pXYZ) { return [pXYZ[0],pXYZ[1] - 1,pXYZ[2]]; }
// ========================================================================== //
function cPowerInfo(pBlock, pInitialPower = 0, pDelay = 0, pSignalName = undefined, pSourceNames = undefined) {
    var Block;      //  The block whose power info this is
    var Intensity;
    var SignalName;
    var SourceNames = [];
    var Sources = [];
    var Power = [];
    var PowerLastDraw;
    //  ------------------- //
    this.Block       = pBlock;
    this.Intensity   = pInitialPower;
    this.SignalName  = (pSignalName  == undefined) ? '' : pSignalName;
    this.SourceNames = (pSourceNames == undefined) ? [] : pSourceNames;
    this.Power = [];
    this.Sources = [];
    for (var i = 0; i <= pDelay; i++) {this.Power.push(pInitialPower);}
    for (var i = 0; i < this.SourceNames.length; i++) {this.Sources.push(undefined);}
    if (this.SignalName != '') { gSignals.push(this); }
}
cPowerInfo.prototype.SetPower = function (pPower = 0) {
    for (var i = 0; i < this.Power.length; i++) {this.Power[i] = pPower;}
    this.PowerLastDraw = pPower;
}
cPowerInfo.prototype.SetSources = function () {
    this.Sources = [];
    for (var i = 0; i < this.SourceNames.length; i++) {
        lSourceName = this.SourceNames[i];
        var lIndex = SignalIndex(lSourceName);
        if (lIndex < 0) { if (lSourceName.length < 9) {ShowError('Geen component ' + lSourceName); }}
        else            { this.Sources.push(gSignals[lIndex].Block); }
    }
}
cPowerInfo.prototype.SetInput = function () {
    if (this.Power.length > 0) {
        lSourcePower = 0;
        for (var i = 0; i < this.Sources.length; i++) {
            if (lSourcePower < this.Sources[i].PowerInfo.Power[0])
               {lSourcePower = this.Sources[i].PowerInfo.Power[0]}
        }
        this.Power[this.Power.length - 1] = lSourcePower;
    }
}
cPowerInfo.prototype.Tick = function () {
    for (var i = 0; i < this.Power.length - 1; i++) {this.Power[i] = this.Power[i+1];}
}
cPowerInfo.prototype.DrawSignal = function (t, pRow) {
    var x = 100 + w * t;
    var y = 25 * pRow - this.Power[0];
    gSignalCanvas.strokeStyle = (pRow % 2 == 0) ? 'rgb(0,0,128)' : 'rgb(0,0,0)';
    gSignalCanvas.beginPath();
    gSignalCanvas.moveTo(x     , 25 * pRow - this.PowerLastDraw);
    gSignalCanvas.lineTo(x     , y);
    gSignalCanvas.lineTo(x + w, y);
    gSignalCanvas.stroke();
    this.PowerLastDraw = this.Power[0];
    return pRow + 1;
}
cPowerInfo.prototype.DrawName = function (pRow) {
    gSignalCanvas.fillText(this.SignalName, 5, 25 * pRow - 3);
}
cPowerInfo.prototype.Debug = function (pError = '') {
    var lHTML = '';
    var lWhiteSpace = '.';
    if (pError != '') { lHTML += '<b>' + FixLength(pError, 10) + '</b>'; }
    lHTML += FixLength(this.Block.BlockInfo.Blocktype + ' - ' + this.Block.BlockInfo.Subtype, 20);
    lHTML += ' | ' + this.SignalName;
    lHTML += ' | ' + this.Intensity;
    lHTML += ' | ' + this.Power.length + ' : ';
    for (var i = 0; i < this.Power.length; i++) { lHTML += ' ' + this.Power[i]; }
    lHTML += ' | ' + this.Sources.length + ' : ';
    for (var i = 0; i < this.Sources.length; i++) { lHTML += ' ' + this.Sources[i].PowerInfo.SignalName; }
    lHTML += '<br />';
    ShowRow(lHTML);
}
// -------------------------------  //
function SignalIndex(pSignalName) {
    var lIndex = -1;
    var i = 0;
    while (lIndex == -1 && i < gSignals.length) {
        if (gSignals[i].SignalName.trim() == pSignalName.trim()) {lIndex = i;}
        i++;
    }
    return lIndex;
}
// -------------------------------  //
function SetSignalsToShow() {
    var lIndex;
    var args;
    gSigShow = [];
    args = Array.from(arguments);
    for (var i = 0; i < args.length; i++) {
        lIndex = SignalIndex(args[i]);
        if (lIndex >= 0) { gSigShow.push(gSignals[lIndex]); }
    }
}
// ========================================================================== //
function PKlocation(pXYZ) {
    lPK  = ("000" + pXYZ[0]).substr(-3,3);
    lPK += ("000" + pXYZ[1]).substr(-3,3);
    lPK += ("000" + pXYZ[2]).substr(-3,3);
    return lPK;
}
function cLocation(pXYZ = [0,0,0]) {
    var PK;     // Primary Key = #XXXYYYZZZ
    var X,Y,Z;  // Location
    this.SetLocation(pXYZ);
}
cLocation.prototype.SetLocation = function (pXYZ = [0,0,0]) {
    this.X = pXYZ[0]; // this.PK  = ("000" + this.X).substr(-3,3);
    this.Y = pXYZ[1]; // this.PK += ("000" + this.Y).substr(-3,3);
    this.Z = pXYZ[2]; // this.PK += ("000" + this.Z).substr(-3,3);
    this.PK = PKlocation(pXYZ);
}
// ========================================================================== //
function cBlock(pXYZ, pBlocktype, pSubtype, pSignalName = undefined, pSignalSourceNames = undefined) {
    var Location;
    var BlockInfo;
    var PowerInfo;
    //  ------------------------------------------  //
    this.Location  = new cLocation(pXYZ);
    this.BlockInfo = new cBlockInfo(pBlocktype, pSubtype);
    this.PowerInfo = new cPowerInfo(this, 0, 0, pSignalName, pSignalSourceNames);
    gBlocks.push(this);
}
cBlock.prototype.SetInput  = function() { this.PowerInfo.SetInput(); }
cBlock.prototype.DrawBlock = function(y, ctx) { this.BlockInfo.DrawBlock(y,ctx,this.Location); }
cBlock.prototype.Debug = function (pError = '') { this.PowerInfo(); }
// ========================================================================== //
function cRedTorch(pXYZ, pOrientation, pSignalName, pSignalSourceNames) {
    var Location;
    var BlockInfo;
    var PowerInfo;
    var Orientation;
    //  ----------  //
    this.Orientation = pOrientation;
    this.Location  = new cLocation(pXYZ);
    this.BlockInfo = new cBlockInfo('redstone_torch', this.Subtype());
    this.PowerInfo = new cPowerInfo(this, gMaxPower, 1, pSignalName, pSignalSourceNames);
    gBlocks.push(this);
}
cRedTorch.prototype.Subtype = function () {
    switch (this.Orientation) {
        case 'E': return '1'; break;
        case 'W': return '2'; break;
        case 'S': return '3'; break;
        case 'N': return '4'; break;
        case 'U': return '5'; break;
    }
}
cRedTorch.prototype.SetInput = function () {
    p = this.PowerInfo;
    lSourcePower = p.Sources[0].PowerInfo.Power[0];
    p.Power[p.Power.length - 1] = (lSourcePower == 0) ? gMaxPower :  0;
}
cRedTorch.prototype.DrawBlock = function(y,ctx) {
    var lX = xOffset + this.Location.X * xScale + xScale/2;
    var lZ = yOffset + this.Location.Z * zScale + zScale/2;
    // if (0 < this.Location.Y && this.Location.Y < 5) {
    if (this.Location.Y == y) {
        // var y = [this.Location.Y-1, 4];
        // for (var i = 0; i < y.length; i++) {
            // var ctx = gLayerCanvasses[y[i]];
            var upperLine = [rotate(this.Orientation,[-xScale/2,-1]),rotate(this.Orientation,[-2,-1])];
            var lowerLine = [rotate(this.Orientation,[-xScale/2,+1]),rotate(this.Orientation,[-2,+1])];
            ctx.strokeStyle = gStyleWire;
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
}   
cRedTorch.prototype.Debug = function(pError = '') { this.Signal.Block.Debug(pError); }
// ========================================================================== //
function cRepeater(pXYZ, pOrientation, pDelay, pSignalName = 'auto', pSignalSourceNames = '') {
    var Location;
    var BlockInfo;
    var PowerInfo;
    var Orientation;
    var Locked;
    //  ----------  //
    this.Orientation = pOrientation;
    this.Locked    = false;
    this.Location  = new cLocation(pXYZ);
    this.BlockInfo = new cBlockInfo('repeater', this.Subtype());
    if (pSignalName == 'auto') {
        lSignalName =  this.Location.PK;
        lSignalSourceNames = [];
        switch(this.Orientation) {
            case 'W': lSignalSourceNames.push(PKlocation([this.Location.X + 1,this.Location.Y,this.Location.Z    ])); break;
            case 'E': lSignalSourceNames.push(PKlocation([this.Location.X - 1,this.Location.Y,this.Location.Z    ])); break;
            case 'N': lSignalSourceNames.push(PKlocation([this.Location.X    ,this.Location.Y,this.Location.Z + 1])); break;
            case 'S': lSignalSourceNames.push(PKlocation([this.Location.X    ,this.Location.Y,this.Location.Z - 1])); break;
        }
    } else {
        lSignalName =  pSignalName;
        lSignalSourceNames = pSignalSourceNames;
    }
    this.PowerInfo = new cPowerInfo(this, 0, pDelay, lSignalName, lSignalSourceNames);
    this.PowerInfo.Intensity = gMaxPower;
    gBlocks.push(this);
}
cRepeater.prototype.Subtype = function () {
    switch (this.Orientation) {
        case 'S': return '0'; break;
        case 'E': return '1'; break;
        case 'N': return '2'; break;
        case 'W': return '3'; break;
    }
}
cRepeater.prototype.SetInput = function () {
    try {
        p = this.PowerInfo;
        this.Locked = false;
        for (var lLock = 1; lLock <= p.Sources.length - 1; lLock++) {
            sp = p.Sources[lLock].PowerInfo;
            for (var s = 0; s <= sp.Power.length; s++) {
                this.Locked = this.Locked || (sp.Power[s] > 0);
            }
        }
        if (this.Locked) {
            for (var i = 1; i < p.Power.length; i++) {p.Power[i] = p.Power[0]}
        } else {
            lSourcePower = p.Sources[0].PowerInfo.Power[0];
            p.Power[p.Power.length - 1] = (lSourcePower == 0) ?  0 : gMaxPower;
        }
    }
    catch (err) { this.ErrorMessage(err); }
}
cRepeater.prototype.DrawBlock = function(y,ctx) {
    var lX = xOffset + this.Location.X * xScale + xScale/2;
    var lZ = yOffset + this.Location.Z * zScale + zScale/2;
    var  inWire = [[-xScale/2,0],[-8,0]];
    var outWire = [[ xScale/2,0],[+8,0]];
    var wires = [inWire,outWire];
    var triangle = [[-7,-8], [-7,+8], [+7, 0]];
    var dots = [];
    switch(this.PowerInfo.Power.length - 1) {
        case 1: dots = [[-2, 0]                        ]; break;
        case 2: dots = [[-4, 0],        [ 0, 0]        ]; break;
        case 3: dots = [[-4,-2],[-4,+2],[ 0, 0]        ]; break;
        case 4: dots = [[-4,-3],[-4,+3],[-2, 0],[+1, 0]]; break;
    }
    if (this.Location.Y > 8) {
            ctx.strokeStyle = 'rgb(64,64,64)';
    }
    if (this.Location.Y == y) {
        ctx.strokeStyle = 'rgb(64,64,64)';
        ctx.beginPath();
        for (var i = 0; i < triangle.length; i++) {
            var vector = rotate(this.Orientation,triangle[i]);
            var x = lX + vector[0];
            var z = lZ + vector[1];
            if (i == 0) { ctx.moveTo(x,z); } else { ctx.lineTo(x,z); }
        }
        ctx.closePath();
        ctx.stroke();
        ctx.strokeStyle = gStyleWire;
        for (var i = 0; i < dots.length; i++) {
            var vector = rotate(this.Orientation,dots[i]);
            ctx.beginPath();
            ctx.rect(lX + vector[0] - 1, lZ + vector[1] - 1,2,2);
            ctx.stroke();
        }
        for (var iw = 0; iw  < wires.length; iw++) {
            ctx.beginPath();
            for (var i = 0; i < wires[iw].length; i++) {
                var vector = rotate(this.Orientation,wires[iw][i]);
                var x = lX + vector[0];
                var z = lZ + vector[1];
                if (i == 0) { ctx.moveTo(x,z); } else { ctx.lineTo(x,z); }
            }
            ctx.stroke();
        }
    }
}
cRepeater.prototype.Debug = function(pError = '') { this.Signal.Block.Debug(pError); }
// ========================================================================== //
function cHighSlab(pXYZ, pDirectionString = 'EWNS', pBlocktype = 'stone_slab', pSubtype = '3', pSignalName = '', pSignalSourceNames = '') {
    var Location;
    var BlockInfo;
    var PowerInfo;
    var Directions;
    //  ----------  //
    this.Directions = [];
    for (var i = 0; i < pDirectionString.length; i++) { this.Directions.push(pDirectionString[i]); }
    this.Location  = new cLocation(pXYZ);
    this.BlockInfo = new cBlockInfo(pBlocktype,pSubtype);
    this.PowerInfo = new cPowerInfo(this, 0, 0, pSignalName, pSignalSourceNames);
    gBlocks.push(this);
}
cHighSlab.prototype.SetInput = function () { this.PowerInfo.SetInput(); }
cHighSlab.prototype.DrawBlock = function(y,ctx) {
    var lX = xOffset + this.Location.X * xScale + xScale/2;
    var lZ = yOffset + this.Location.Z * zScale + zScale/2;
    if (this.Location.Y == y) {
        ctx.strokeStyle = 'rgb(160,160,160)';
        ctx.beginPath();
        ctx.rect(lX-6,lZ-6,12,12);
        ctx.stroke();
        ctx.strokeStyle = 'rgb(192,192,192)';
        ctx.beginPath();
        ctx.rect(lX-2,lZ-2,4,4);
        ctx.stroke();
        for (var dir = 0; dir < this.Directions.length; dir++) {
            var upperLine = [rotate(this.Directions[dir],[xScale/2,-2]),rotate(this.Directions[dir],[+2,-2])];
            var lowerLine = [rotate(this.Directions[dir],[xScale/2,+2]),rotate(this.Directions[dir],[+2,+2])];
            ctx.beginPath();
            ctx.moveTo(lX + upperLine[0][0], lZ + upperLine[0][1]);
            ctx.lineTo(lX + upperLine[1][0], lZ + upperLine[1][1]);
            ctx.moveTo(lX + lowerLine[0][0], lZ + lowerLine[0][1]);
            ctx.lineTo(lX + lowerLine[1][0], lZ + lowerLine[1][1]);
            ctx.stroke();
        }
    }   
}
// ========================================================================== //
function cWire(pXYZ, pDirectionString = 'EWNS', pBlocktype = 'support', pSubtype = '0', pSignalName = 'auto', pSignalSourceNames = '') {
    var Location;
    var BlockInfo;
    var PowerInfo;
    var Directions;
    //  ----------  //
    this.Directions = [];
    for (var i = 0; i < pDirectionString.length; i++) { this.Directions.push(pDirectionString[i]); }
    this.Location  = new cLocation(pXYZ);
    if (pSignalName == 'auto') {
        lSignalName =  this.Location.PK;
        lSignalSourceNames = [];
        for (var y = -1; y <= 1; y++) {
        for (var i = 0; i < this.Directions.length; i++) {
            switch(this.Directions[i]) {
                case 'W': lSignalSourceNames.push(PKlocation([this.Location.X - 1,this.Location.Y + y,this.Location.Z    ]));
                case 'E': lSignalSourceNames.push(PKlocation([this.Location.X + 1,this.Location.Y + y,this.Location.Z    ]));
                case 'N': lSignalSourceNames.push(PKlocation([this.Location.X    ,this.Location.Y + y,this.Location.Z - 1]));
                case 'S': lSignalSourceNames.push(PKlocation([this.Location.X    ,this.Location.Y + y,this.Location.Z + 1]));
                break;
            }
        }}  
    } else {
        lSignalName =  pSignalName;
        lSignalSourceNames = pSignalSourceNames;
    }
    this.BlockInfo = new cBlockInfo(pBlocktype,pSubtype);
    this.PowerInfo = new cPowerInfo(this, 0, 0, lSignalName, lSignalSourceNames);
    gBlocks.push(this);
}
cWire.prototype.SetInput = function () {
    p = this.PowerInfo;
    if (p.Power.length > 0) {
        lSourcePower = 1;
        for (var i = 0; i < p.Sources.length; i++) {
            if (lSourcePower < p.Sources[i].PowerInfo.Power[0])
               {lSourcePower = p.Sources[i].PowerInfo.Power[0]}
        }
        p.Power[p.Power.length - 1] = lSourcePower - 1;
    }
}
cWire.prototype.DrawBlock = function(y,ctx) {
    var lX = xOffset + this.Location.X * xScale + xScale/2;
    var lZ = yOffset + this.Location.Z * zScale + zScale/2;
    if (this.Location.Y == y) {
        ctx.strokeStyle = gStyleWire;
        for (var dir = 0; dir < this.Directions.length; dir++) {
            var vector = rotate(this.Directions[dir],[xScale/2-1,0]);
            ctx.beginPath();
            ctx.moveTo(lX,lZ);
            ctx.lineTo(lX + vector[0], lZ + vector[1]);
            ctx.stroke();
        }
    }
}
cWire.prototype.Debug = function(pError = '') { this.PowerInfo.Block.Debug(pError); }
// ========================================================================== //
function cLever(pXYZ, pOrientation = 'E', pSignalName = '') {
    var Location;
    var BlockInfo;
    var PowerInfo;
    var Orientation;
    //  ----------  //
    this.Orientation = pOrientation;
    this.Locked    = false;
    this.Location  = new cLocation(pXYZ);
    this.BlockInfo = new cBlockInfo('lever', this.Subtype());
    this.PowerInfo = new cPowerInfo(this, 0, 0, pSignalName);
    gBlocks.push(this);
}
cLever.prototype.SetInput = function () {
    var a = 1;
}
cLever.prototype.Off = function () { this.PowerInfo.Power[0] =  0; }
cLever.prototype.On  = function () { this.PowerInfo.Power[0] = gMaxPower; }
cLever.prototype.Subtype = function () {
    switch (this.Orientation) {
        case 'S': return '0'; break; // nog controleren
        case 'E': return '1'; break;
        case 'N': return '2'; break;
        case 'W': return '3'; break;
    }
}
cLever.prototype.DrawBlock = function(y,ctx) {
    var lX = xOffset + this.Location.X * xScale + xScale/2;
    var lZ = yOffset + this.Location.Z * zScale + zScale/2;
    if (this.Location.Y == y) {
    // if (0 < this.Location.Y && this.Location.Y < 5) {
        // var y = [this.Location.Y-1, 4];
        // for (var i = 0; i < y.length; i++) {
            // var ctx = gLayerCanvasses[y[i]];
            var upperLine = [rotate(this.Orientation,[-xScale/2,-1]),rotate(this.Orientation,[-2,-1])];
            var lowerLine = [rotate(this.Orientation,[-xScale/2,+1]),rotate(this.Orientation,[-2,+1])];
            ctx.strokeStyle = 'rgb(64,64,64)';
            ctx.beginPath();
            ctx.rect(lX-1,lZ-1,2,2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(lX + upperLine[0][0], lZ + upperLine[0][1]);
            ctx.lineTo(lX + upperLine[1][0], lZ + upperLine[1][1]);
            ctx.moveTo(lX + lowerLine[0][0], lZ + lowerLine[0][1]);
            ctx.lineTo(lX + lowerLine[1][0], lZ + lowerLine[1][1]);
            ctx.stroke();
    }
}
// ========================================================================== //
function ComponentIndex (pSignal) {
    var lIndex = -1;
    var i = 0;
    while (lIndex == -1 && i < gComponents.length) {
        if (gComponents[i].Signal == pSignal) {lIndex = i;}
        i++;
    }
    return lIndex;
}
function PowerLine(pPower, pLength) {
    var lPower = pPower - pLength;
    if (lPower < 0) {lPower = 0;}
    return lPower;
}
// ========================================================================== //
function addBlockAndComponent(pBlocktype) {
    gBlocksOld.push(pBlocktype);
    gComponents.push(pBlocktype);
}
// ========================================================================== //
function ClockInit(pDelay = 4) {
    gBlocks = [];
    gSignals = [];
    new cWire    ([1,3,0], 'EW', 'sandstone', 0,'-CKw'  ,['-CK' ]);
    new cBlock   ([1,2,0], 'sandstone', 0,'-CKb'  ,['-CKw' ]);
    new cRedTorch([0,2,0], 'W'           ,' CK'   ,['-CKb']);
    new cRepeater([1,2,1], 'E', pDelay   ,'-CK'   ,[' CK' ]);
    new cWire    ([2,2,0], 'WS');
    new cWire    ([0,2,1], 'ENS');
    new cWire    ([2,2,1], 'WN');
    // u = undefined
    // new cRedTorch([0,2,0], 'W'                 ,'000002000',['001002000']);
    // new cWire    ([0,2,1], 'ENS', u,u          ,'000002001',['000002000']); gSignals[gSignals.length-1].Intensity = 14;
    // new cRepeater([1,2,1], 'E', pDelay);            
    // new cWire    ([2,2,1], 'WN');                                           gSignals[gSignals.length-1].Intensity = 14;
    // new cWire    ([2,2,0], 'WS' , u,u          ,'002002000',['002002001']); gSignals[gSignals.length-1].Intensity = 13;
    // new cWire    ([1,3,0], 'EW', 'sandstone', 0,'001003000',['002002000']); gSignals[gSignals.length-1].Intensity = 12;
    // new cBlock   ([1,2,0],       'sandstone', 0,'001002000',['001003000']); gSignals[gSignals.length-1].Intensity = 11;
}
function ClockSignals() {
    ClockInit();
    SetSignalsToShow('CK');
    // SetSignalsToShow(
     // '000002000'
    // ,'000002001'
    // ,'001002001'
    // ,'002002001'
    // ,'002002000'
    // ,'001003000'
    // ,'001002000'
    // );
    Signaal();
}
// =========================================================================== //
function PhaseClockInit(pCycleTime = 1) {
    gBlocks = [];
    gSignals = [];
    switch (pCycleTime) {
        case  1: lDelays = [1,1,2]; break;
        case  2: lDelays = [2,3,4]; break;
        default: lDelays = [1,1,2]; break;
    }
    //  Base Clock
    new cWire    ([4,2,0], 'WS');
    new cWire    ([3,2,0], 'EW');
    new cRepeater([2,2,0], 'W'   , lDelays[2]        ,' CK.3.r' ,[' CK.2.r' ]);
    new cBlock   ([1,2,0], 'sandstone', 0            ,'-CK'     ,[' CK.3.r' ]);
    new cRedTorch([0,2,0], 'W'                       ,' CK'     ,['-CK'     ]);
    new cWire    ([0,2,1], 'ENS');
    new cRepeater([1,2,1], 'E'   , lDelays[0]        ,' CK.1.r' ,[' CK'     ]);
    new cWire    ([2,2,1], 'EWS');
    new cRepeater([3,2,1], 'E'   , lDelays[1]        ,' CK.2.r' ,[' CK.1.r' ]);
    new cWire    ([4,2,1], 'WNS');
    //  Phi-0
    u = undefined
    new cWire    ([1,3,2], 'EW'  ,u,u,' CK.12'  ,[' CK'     ,' CK.1.r']);
    new cWire    ([2,4,2], 'EWN' ,u,u,' CK.23'  ,[' CK.1.r' ,' CK.2.r']);
    new cWire    ([3,3,2], 'EW'  ,u,u,' CK.p0'  ,[' CK.12'  ,' CK.23' ]);
    new cHighSlab([1,2,2], 'EW'  );
    new cHighSlab([2,3,2], 'EWN' );
    new cHighSlab([3,2,2], 'EW'  );
    new cWire    ([2,4,1], 'NS');
    new cWire    ([2,4,0], 'ES');
    new cWire    ([3,4,0], 'WE');
    new cWire    ([4,4,0], 'WE');
    new cWire    ([5,4,0], 'WE');
    new cWire    ([6,3,0], 'WS');
    new cWire    ([6,2,1], 'NS');
    new cRepeater([6,2,2], 'S'   , 1 ,'-Phi-0'  ,[' CK.p0'  ]);
    new cWire    ([6,2,3], 'NS');
    new cBlock   ([6,2,4], 'sandstone', 0);
    new cRedTorch([6,2,5], 'S'       ,' Phi-0'  ,['-Phi-0'  ]);
    //  Phi-1
    new cBlock   ([0,2,2], 'sandstone', 0            ,' CK.0.b', [' CK'     ]);
    new cBlock   ([2,2,2], 'sandstone', 0            ,' CK.1.b', [' CK.1.r' ]);
    new cBlock   ([4,2,2], 'sandstone', 0            ,' CK.2.b', [' CK.2.r' ]);
    new cWire    ([0,3,2], 'ENS');
    new cWire    ([2,3,2], 'EWNS');
    new cWire    ([4,3,2], 'WNS');
    new cRedTorch([0,2,3], 'S'                       ,'-CK.0.i' ,[' CK.0.b' ]);
    new cRedTorch([2,2,3], 'S'                       ,'-CK.1.i' ,[' CK.1.b' ]);
    new cRedTorch([4,2,3], 'S'                       ,'-CK.2.i' ,[' CK.2.b' ]);
    new cWire    ([0,2,4], 'EN');
    new cBlock   ([1,2,4], 'sandstone', 0);
    new cWire    ([1,3,4], 'EW' ,u,u,'-Phi-1'  ,['-CK.0.i' ,'-CK.1.i','-CK.2.i']);
    new cWire    ([2,2,4], 'EWN');
    new cWire    ([3,2,4], 'EW');
    new cWire    ([4,2,4], 'WN');
    new cRedTorch([1,2,5], 'S'                       ,' Phi-1'  ,['-Phi-1'  ]);
}
function PhaseClockSignals() {
    PhaseClockInit();
    SetSignalsToShow('CK','Phi-0','Phi-1');
    Signaal();
}
// =========================================================================== //
function AddInstructionClockUnit(pUnitnr, mx, mz, pSource = '') {
    var i  = pUnitnr % 2
    var dx = (i == 0) ? 1 : -1;
    var y  = (i == 0) ? 2 * pUnitnr + 2 : 2 * pUnitnr;
    var z  = (i == 0) ? 9 : 13;
    var dz = (i == 0) ? 1 : -1;
    var dWE = ['W','E'];
    var dNS = ['N','S'];
    var lPrefix = ' IC.' + pUnitnr + '.';
    var nPrefix = '-IC.' + pUnitnr + '.';
    var lSource = pSource;
    if (lSource == '') { lSource = ' IC.' + (pUnitnr - 1) + '.t'; }

    new cRepeater([mx-4*dx,y,mz-3*dz], dNS[1-i], 1,lPrefix + 'tL',['-Phi-1']);
    new cRepeater([mx+4*dx,y,mz-1*dz], dNS[i]  , 1,lPrefix + 'sL',['-Phi-0']);
    new cWire    ([mx+4*dx,y,mz], dWE[i] + dNS[i]);
    new cWire    ([mx+3*dx,y,mz], 'WE');
    new cWire    ([mx+2*dx,y,mz], 'WE');
    new cWire    ([mx+1*dx,y,mz], 'WE');
    if (i == 0) { new cWire    ([mx,y,mz], 'WE'); }
    new cWire    ([mx,y-1,mz-dz], 'NS');

    new cWire    ([mx-6*dx,y    ,mz-2*dz], dWE[1-i] + dNS[1-i]);
    new cWire    ([mx-5*dx,y    ,mz-2*dz], 'WE');
    new cRepeater([mx-4*dx,y    ,mz-2*dz], dWE[1-i], 1, lPrefix + 't' ,[lPrefix + 't.AND',lPrefix + 'tL']);
    new cWire    ([mx-3*dx,y    ,mz-2*dz], 'EW');
    new cBlock   ([mx-2*dx,y    ,mz-2*dz], 'sandstone',0);
    new cRedTorch([mx-1*dx,y    ,mz-2*dz], dWE[1-i]           ,lPrefix + 't.AND'  ,[nPrefix + 't.OR'] );
    new cWire    ([mx     ,y    ,mz-2*dz], 'EW'+dNS[1-i],undefined,undefined,nPrefix + 't.OR',[nPrefix + 's'    , 'RST'             ]);
    new cBlock   ([mx+1*dx,y    ,mz-2*dz], 'sandstone',0);
    new cRedTorch([mx+2*dx,y    ,mz-2*dz], dWE[1-i]           ,nPrefix + 's'  ,[lPrefix + 's'] );
    new cWire    ([mx+3*dx,y    ,mz-2*dz], 'WE');
    new cRepeater([mx+4*dx,y    ,mz-2*dz], dWE[1-i], 1, lPrefix + 's' ,[lSource,lPrefix + 'sL']);
    new cWire    ([mx+5*dx,y    ,mz-2*dz], 'WE');
    new cWire    ([mx+6*dx,y+1  ,mz-2*dz], 'WE' + dNS[1-i]);
    new cWire    ([mx+6*dx,y+1*i,mz-1*dz], 'NS');
    new cWire    ([mx+6*dx,y+2*i,mz     ], 'NS');
    new cWire    ([mx+6*dx,y+3*i,mz+1*dz], 'NS');

    u = undefined
    new cBlock   ([mx+6*dx,y,mz-2*dz], 'sandstone', 0,lPrefix + 'tb',[lPrefix + 't' ]);
    new cRedTorch([mx+7*dx,y,mz-2*dz], dWE[1-i]      ,nPrefix + 't' ,[lPrefix + 'tb']);
    new cWire    ([mx+8*dx,y,mz-2*dz], dWE[i] + 'NS', u, u   ,nPrefix + 'T' ,[nPrefix + 't','-CK']);
    new cBlock   ([mx+8*dx,y,mz-1*dz], 'sandstone', 0,nPrefix + 'Tb',[nPrefix + 'T' ]);
    new cRedTorch([mx+8*dx,y,mz     ], dNS[1-i]      ,lPrefix + 'T' ,[nPrefix + 'Tb']);
}
function InstructionClockInit() {
    u = undefined
    mx =  8
    mz = 12
    PhaseClockInit();
    new cLever    ([   0,2,mz-2], 'W'           , ' RST');
    for (var x = 1; x < mx; x++) new cWire    ([ x,2,mz-2], 'WE');
    new cRepeater([mx+2,2,mz-3], 'S'   , 1     ,' IC.RST.L',['-Phi-0']);
    new cRepeater([mx+4,2,mz-1], 'N'   , 1     ,' IC.0.t.L' ,['-Phi-1'     ]);

    new cHighSlab([mx  ,2,mz-2], 'WEN' , u, u  ,' IC.5R'  ,[' IC.5.t',' RST']);
    new cWire    ([mx+1,2,mz-2], 'WE');
    new cRepeater([mx+2,2,mz-2], 'E'   , 1     ,' IC.RST' ,['IC.5R', 'IC.RST.L']);
    new cWire    ([mx+3,2,mz-2], 'WE');
    new cRepeater([mx+4,2,mz-2], 'E'   , 1     ,' IC.0.t' ,[' IC.RST','IC.0.t.L']);
    new cWire    ([mx+5,2,mz-2], 'WE');
    new cWire    ([mx+6,3,mz-2], 'WES');
    new cBlock   ([mx+6,2,mz-2], 'sandstone', 0,' IC.0.tb',[' IC.0.t']);
    new cRedTorch([mx+7,2,mz-2], 'E'           ,'-IC.0.t' ,[' IC.0.tb']);
    new cWire    ([mx+8,2,mz-2], 'WNS', u, u   ,'-IC.0.T' ,['-IC.0.t','-CK']);
    new cBlock   ([mx+8,2,mz-1], 'sandstone', 0,'-IC.0.Tb',['-IC.0.T']);
    new cRedTorch([mx+8,2,mz  ], 'S'           ,' IC.0.T' ,['-IC.0.Tb']);

    new cWire    ([mx+6,2,mz-1], 'NS');
    new cWire    ([mx+6,2,mz  ], 'NS');
    new cWire    ([mx+6,2,mz+1], 'NS');

    new cWire    ([mx+0,2,mz  ], 'WE');
    new cWire    ([mx+1,2,mz  ], 'WE');
    new cWire    ([mx+2,2,mz  ], 'WE');
    new cWire    ([mx+3,2,mz  ], 'WE');
    new cWire    ([mx+4,2,mz  ], 'WN');

    AddInstructionClockUnit(1,mx,mz);
    AddInstructionClockUnit(2,mx,mz);
    AddInstructionClockUnit(3,mx,mz);
    AddInstructionClockUnit(4,mx,mz);
    AddInstructionClockUnit(5,mx,mz);

   
    gSignals[SignalIndex('RST')].Block.On();    
}
function InstructionClockSignals() {
    InstructionClockInit();
    SetSignalsToShow('CK','RST','IC.RST','IC.0.T','IC.1.T','IC.2.T','IC.3.T','IC.4.T','IC.5.T');
    Signaal();
}
// ========================================================================== //
function LockedRepeaterInit() {
    ClockInit();
    new cWire    ([0,2,2], 'ENS');
    new cWire    ([1,2,2], 'WES');
    new cRepeater([2,2,2],'E',1,' CK+1'   , [' CK'            ]);
    new cRepeater([3,2,2],'E',1,' NR'     , [' CK+1'          ]);
    new cWire    ([0,2,3], 'NS');
    new cRepeater([1,2,3],'S',1,' LR.Lock', [' CK'            ]);
    new cWire    ([0,2,4], 'EN');
    new cRepeater([1,2,4],'E',1,' LR'     , [' CK', ' LR.Lock']);

    
}
function LockedRepeaterSignals() {
    LockedRepeaterInit();
    SetSignalsToShow(' CK', ' CK+1',' NR',' LR.Lock',' LR');
    Signaal();
}
// ========================================================================== //
function FlipFlopInit() {
    new cBlock   ([11,2,3], 'sandstone', 0,' FF1.CK'     ,[' CK'     ]);
    new cRedTorch([10,2,3], 'W'           ,' FF1.In'     ,[' FF1.CK' ]);
    new cRepeater([11,2,2], 'N', 1        ,' FF1.RR.Lock',[' FF1.CK' ]);
    new cRepeater([10,2,2], 'N', 1        ,' FF1.RL.Lock',[' FF1.In' ]);
    new cRedTorch([12,2,1], 'S'           ,'-FF1.RL'     ,[' FF1.RL' ]);
    new cRepeater([11,2,1], 'W', 1        ,' FF1.RR'     ,['-FF1.RL' ,' FF1.RR.Lock']);
    new cRepeater([10,2,1], 'W', 1        ,' FF1.RL'     ,[' FF1.RR' ,' FF1.RL.Lock']);
    new cBlock   ([12,2,0], 'sandstone', 0,' FF1.Q'      ,[' FF1.RL' ]);
    new cBlock   ([11,2,8], 'sandstone', 0,' FF2.CK'     ,[' CK'     ]);
    new cRedTorch([10,2,8], 'W'           ,' FF2.In'     ,[' FF2.CK' ]);
    new cRepeater([11,2,7], 'N', 1        ,' FF2.RR.Lock',[' FF2.CK' ]);
    new cRepeater([10,2,7], 'N', 1        ,' FF2.RL.Lock',[' FF2.In' ]);
    new cRedTorch([ 9,2,6], 'S'           ,'-FF2.RR'     ,[' FF2.RR' ]);
    new cRepeater([10,2,6], 'E', 1        ,' FF2.RL'     ,['-FF2.RR' ,' FF2.RL.Lock']);
    new cRepeater([11,2,6], 'E', 1        ,' FF2.RR'     ,[' FF2.RL' ,' FF2.RR.Lock']);
    new cBlock   ([ 9,2,5], 'sandstone', 0,' FF2.Q'      ,[' FF2.RR' ]);
}
function FlipFlopSignals() {
    gComponents = [];
    ClockInit();
    FlipFlopInit();
    SetSignalsToShow
    (' CK'
    ,'FF1.CK','FF1.Q','FF2.Q'
    // ,'FF1.In','FF1.RR.Lock','FF1.RL.Lock','FF1.RR','FF1.RL','-FF1.RL'
    // ,'FF2.In','FF2.RR.Lock','FF2.RL.Lock','FF2.RR','FF2.RL','-FF2.RR'
    );
    Signaal();
}
// ========================================================================== //
function DoorInit() {
    gBlocks = [];
    gSignals = [];
    PhaseClockInit(2);
    lDoor = new cUnit(gBlocks.length);
    new cWire    ([0,2,0], 'ES');
    new cWire    ([1,2,0], 'EW');
    new cWire    ([2,2,0], 'EW');
    new cWire    ([3,2,0], 'EW');
    new cWire    ([4,2,0], 'EW');
    new cWire    ([5,2,0], 'EW');
    new cWire    ([6,2,0], 'EW');
    new cWire    ([7,2,0], 'WS');

    new cWire    ([0,3,1], 'EN');
    new cWire    ([1,4,1], 'EW');
    new cBlock    ([2,4,1], 'sandstone', 0);
    new cBlock    ([5,4,1], 'sandstone', 0);
    new cWire    ([6,4,1], 'EW');
    new cWire    ([7,3,1], 'WNS');

    new cWire    ([2,3,2], 'NS');
    new cWire    ([5,3,2], 'NS');
    new cWire    ([7,3,2], 'NS');
    
    new cWire    ([2,2,3], 'EN');
    new cWire    ([3,2,3], 'WE');
    new cWire    ([4,2,3], 'WE');
    new cWire    ([5,2,3], 'WENS');
    new cRedTorch([6,2,3], 'W'  , '006002003', ['Phi-0']);
    new cWire    ([7,3,3], 'WNS', 'sandstone');
    
    new cWire    ([5,2,4], 'NS');
    new cWire    ([7,2,4], 'NS');

    new cBlock   ([5,2,5], 'sandstone', 0);
    new cRedTorch([6,2,5], 'E' , '006002005', ['Phi-1']);
    new cWire    ([7,2,5], 'WN');
    
    lDoor.SetIndexLastBlock(gBlocks.length);
    for (i = lDoor.IndexFirstBlock; i < lDoor.IndexLastBlock; i++) { gBlocks[i].Location.Z += 8; }
    
}
function DoorSignals() {
    DoorInit();
    SetSignalsToShow
    ('CK'
    , 'Phi-0', '006002003'
    , 'Phi-1', '006002005'
    ,'000002000', '005002003'
    );
    Signaal();
}
// ========================================================================== //
function CheckComponentsAndDisplay() {
    for (var i = 0; i < gComponents.length; i++) {
        if (gComponents[i].Power       == undefined) { gComponents[i].ErrorMessage('Geen stroom');}
        if (gComponents[i].SourceNames == undefined) { gComponents[i].ErrorMessage('Geen bron');}
        gComponents[i].SetSources();
        if (gComponents[i].Sources     == undefined) { gComponents[i].ErrorMessage('Geen bron');}
    }
    for (var i = 0; i < gDisplay.length; i++) {
        if (ComponentIndex(gDisplay[i]) < 0) { ShowError('Geen component ' + gDisplay[i]); }
    }
}
// ========================================================================== //
function Signaal() {
    // for (var i = 0; i < gSignals.length; i++) { gSignals[i].SetSources();}
    // for (var i = 0; i < gBlocks.length ; i++) { gBlocks[i].PowerInfo.Debug();}
    initCanvasses();
    CheckComponentsAndDisplay();
    for (var i = 0; i < gSignals.length; i++) { gSignals[i].SetSources();}
    var lRow = 1;
    for (var i = 0; i < gSigShow.length ; i++) { gSigShow[i].DrawName(lRow); lRow++; }
    for (var y = 1; y < gLayerCanvasses.length; y++) {
        for (var i = 0; i < gBlocks.length ; i++) { gBlocks[i].DrawBlock(y, gLayerCanvasses[y]);}
        for (var i = 0; i < gBlocks.length ; i++) { gBlocks[i].DrawBlock(y, gLayerCanvasses[0]);}
    }
    for (t = 0; t < 170; t++) {
        var lRow = 1;
        if (t == 10 && SignalIndex('RST') > 0) { gSignals[SignalIndex('RST')].Block.Off();}
        if (t == 14 && SignalIndex('LR' ) > 0) { gSignals[SignalIndex('LR')].SetPower(gMaxPower);}

        // for (var i = 0; i < gSignals.length; i++) {        gSignals[i].Block.SetInput();}
        for (var intensity = gMaxPower - 1; intensity >= 0; intensity--) {
            for (var i = 0; i < gSignals.length; i++) {
                if (gSignals[i].Intensity == intensity) {
                    gSignals[i].Block.SetInput(); }
            }
        }
        for (var i = 0; i < gSignals.length; i++) {
            if (gSignals[i].Intensity == gMaxPower) {
                gSignals[i].Block.SetInput(); }
        }
        for (var i = 0; i < gSigShow.length; i++) { lRow = gSigShow[i].DrawSignal(t,lRow);}
        for (var i = 0; i < gSignals.length; i++) {        gSignals[i].Tick();}
    }
}
function InitSignals() {
    initSignalCanvas();
    initLayerCanvas('Alles');
    for (var i = 1; i <= 8; i++) { initLayerCanvas('Laag-' + i); }
    ClockSignals();
}
