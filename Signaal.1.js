    var gSignalCanvas;
    var gLayerCanvasses = [];
    var gSignals = [];
    var gSigShow = [];
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
function cUnit(pUnitName, pIndexFirstBlock = 0) {
    var UnitName;
    var IndexFirstBlock;
    var IndexLastBlock;
    this.UnitName        = pUnitName;
    this.IndexFirstBlock = pIndexFirstBlock;
}
cUnit.prototype.SetIndexLastBlock = function(pIndexLastBlock) {this.IndexLastBlock = pIndexLastBlock;}
cUnit.prototype.Move = function(pXYZ) {
    for (var i = this.IndexFirstBlock; i < this.IndexLastBlock; i++) gBlocks[i].Location.Move(pXYZ);
}
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
    initLayerCanvas('Bovenaanzicht');
    for (var i = 1; i <= 16; i++) { initLayerCanvas('Laag-' + i); }
    initLayerCanvas('Onderaanzicht');
}
// ========================================================================== //
function ShowError(pHTML) { document.getElementById("foutmelding").innerHTML += pHTML; }
function DebugShow(pHTML) { document.getElementById("debug").innerHTML += pHTML; }
function DebugClear()     { document.getElementById("debug").innerHTML = '';     }
function FixLength(pString, pLength) {
    if      (pString.length  > pLength) { return pString.substr(0, pLength);}
    else if (pString.length == pLength) { return pString;}
    else                                { return pString + '&nbsp;'.repeat(pLength - pString.length);}
}
function rotate(pDirection,pVector) {
    var x = pVector[0];
    var z = pVector[1];
    switch (pDirection) {
        case 'w': return [-x, z]; break; case 'W': return [-x, z]; break; case 'M': return [-x, z]; break;
        case 'e': return [ x, z]; break; case 'E': return [ x, z]; break; case 'F': return [ x, z]; break;
        case 'n': return [ z,-x]; break; case 'N': return [ z,-x]; break; case 'H': return [ z,-x]; break;
        case 's': return [-z, x]; break; case 'S': return [-z, x]; break; case 'Z': return [-z, x]; break;
        case 'd': return [ 0, 0]; break; case 'U': return [ 0, 0]; break; case 'U': return [ 0, 0]; break;
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
            case  1: lColor = 'rgba(255,204,153,0.5)'; break;    //  1 = FFCC99 = Oranje
            case  3: lColor = 'rgba(128,128,255,0.5)'; break;    //  3 = 8080FF = Lichtblauw
            case  4: lColor = 'rgba(255,255,128,0.5)'; break;    //  4 = FFFF80 = Geel
            case  5: lColor = 'rgba(153,204,  0,0.5)'; break;    //  5 = 99CC00 = Lichtgroen
            case 14: lColor = 'rgba(255,160,128,0.5)'; break;    // 14 = FFA080 = Rood
            //  0 = Wit
            //  2 = Magenta
            //  6 = Roze
            //  7 = Donkergrijs
            //  8 = Lichtgrijs
            //  9 = Cyaan ~ Grijs
            // 10 = Paars
            // 11 = Blauw
            // 12 = Bruin
            // 13 = Groen
            // 15 = Zwart
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
    var Distance;
    var SignalName;
    var SourceType; // Auto = Automatic, Dir = From Directions, Name = From pSignalSourceNames
    var SourceNames = [];
    var Sources = [];
    var Power = [];
    var PowerLastDraw;
    //  ------------------- //
    this.Block       = pBlock;
    this.Distance    = pInitialPower;
    this.SourceType  = (pSignalName  == 'Auto') ? pSignalName : (pSignalName  == 'Dir') ? pSignalName : 'Name';
    this.SignalName  = (pSignalName  == undefined) ? '' : pSignalName.trim();
    this.SourceNames = (pSourceNames == undefined) ? [] : pSourceNames;
    this.Power = [];
    this.Sources = [];
    for (var i = 0; i <= pDelay; i++) {this.Power.push(pInitialPower);}
    if (this.SignalName != '') { gSignals.push(this); }
    this.PowerLastDraw = pInitialPower;
}
cPowerInfo.prototype.SetPower = function (pPower = 0) {
    for (var i = 0; i < this.Power.length; i++) {this.Power[i] = pPower;}
}
cPowerInfo.prototype.SetSignalName = function () {
    switch (this.SourceType) {
        case 'Auto': if (this.SignalName == '' || this.SignalName == 'Auto') this.SignalName = this.Block.Location.PK; break;
        case 'Dir' : if (this.SignalName == '' || this.SignalName == 'Dir' ) this.SignalName = this.Block.Location.PK; break;
        case 'Name': if (this.SignalName == '' || this.SignalName == 'Name') this.SignalName = this.Block.Location.PK; break;
    }
    if (this.SignalName.length == 9 && !isNaN(this.SignalName)) this.SignalName = this.Block.Location.PK;
}
cPowerInfo.prototype.SetSources = function () {
    switch (this.SourceType) {
        case 'Auto': break; // Nog in te vullen
        case 'Dir' : this.Block.DirSourceNames();
                     break;
        case 'Name': break;
    }
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
cPowerInfo.prototype.UpdateLastDraw = function () { this.PowerLastDraw = this.Power[0]; }
cPowerInfo.prototype.DrawSignal = function (t, pRow) {
    var x = 100 + w * t;
    var y = 25 * pRow - this.Power[0];
    gSignalCanvas.strokeStyle = (pRow % 2 == 0) ? 'rgb(0,0,128)' : 'rgb(0,0,0)';
    gSignalCanvas.beginPath();
    gSignalCanvas.moveTo(x     , 25 * pRow - this.PowerLastDraw);
    gSignalCanvas.lineTo(x     , y);
    gSignalCanvas.lineTo(x + w, y);
    gSignalCanvas.stroke();
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
    lHTML += ' |' + FixLength(this.Block.Location.X, 2);
    lHTML += ',' + FixLength(this.Block.Location.Y, 2);
    lHTML += ',' + FixLength(this.Block.Location.Z, 2);
    lHTML += ' | ' + FixLength(this.SignalName.trim(), 10);
    lHTML += ' | ' + FixLength(' ' + this.Distance, 3);
    lPower = ''; for (var i = 0; i < this.Power.length; i++) { lPower += ' ' + this.Power[i]; }
    lHTML += ' | ' + this.Power.length + ' : ' + FixLength(lPower, 12);
    lHTML += ' | ' + this.Sources.length + ' : ';
    for (var i = 0; i < this.Sources.length; i++) { lHTML += ' ' + this.Sources[i].PowerInfo.SignalName; }
    lHTML += '<br />';
    DebugShow(lHTML);
}
// -------------------------------  //
function SignalIndex(pSignalName) {
    var lIndex = -1;
    var i = 0;
    var lSignalName = pSignalName.trim()
    while (lIndex == -1 && i < gSignals.length) {
        if (gSignals[i].SignalName        == lSignalName) {lIndex = i;}
        if (gSignals[i].Block.Location.PK == lSignalName) {lIndex = i;}
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
function cLocation(pXYZ = [0,0,0]) {
    var PK;     // Primary Key = #XXXYYYZZZ
    var X,Y,Z;  // Location
    this.SetLocation(pXYZ);
}
cLocation.prototype.SetLocation = function(pXYZ = [0,0,0]) {
    this.X = pXYZ[0];
    this.Y = pXYZ[1];
    this.Z = pXYZ[2];
    this.PK = this.PKlocation();
}
cLocation.prototype.Move = function(pXYZ = [0,0,0]) {
    this.X += pXYZ[0];
    this.Y += pXYZ[1];
    this.Z += pXYZ[2];
    this.PK = this.PKlocation();
}
cLocation.prototype.PKlocation = function(pVector = [0,0,0]) {
    lPK  = ("000" + (this.X + pVector[0])).substr(-3,3);
    lPK += ("000" + (this.Y + pVector[1])).substr(-3,3);
    lPK += ("000" + (this.Z + pVector[2])).substr(-3,3);
    return lPK;
}
// ========================================================================== //
function cClockBlock(pSignalName, pFrequency = 2) {
    var Location;
    var BlockInfo;
    var PowerInfo;
    var Frequency;
    this.Frequency = pFrequency;
    this.Location  = new cLocation([0,0,0]);
    this.BlockInfo = new cBlockInfo('sandstone', 0);
    this.PowerInfo = new cPowerInfo(this, 0, 0, pSignalName);
    this.PowerInfo.Distance = gMaxPower;
    gBlocks.push(this);
}
cClockBlock.prototype.DirSourceNames = function () {}
cClockBlock.prototype.DrawBlock      = function () {}
cClockBlock.prototype.SetInput       = function (t) {
    p = this.PowerInfo;
    if ((t % this.Frequency) == 0) p.Power[0] = (p.Power[0] == 0) ? gMaxPower :  0;
}
// ========================================================================== //
function cBloc2(pXYZ, pSignalName, pSourceDirections = 'WENS', pDestinDirections = '') {
    lBlock = new cBlock(pXYZ, 'sandstone', 0, 'Dir');
    lBlock.SetDirections( pSourceDirections, pDestinDirections);
    if (pSignalName != '') lBlock.PowerInfo.SignalName = pSignalName;
    for (var i = 0; i < pDestinDirections.length; i++) {
        if (lBlock.DestinDirections.indexOf(pDestinDirections[i]) < 0)
            lBlock.DestinDirections.push(pDestinDirections[i]);
    }
}
// ========================================================================== //
function cBlock(pXYZ, pBlocktype, pSubtype, pSignalName = undefined, pSignalSourceNames = undefined) {
    var Location;
    var BlockInfo;
    var PowerInfo;
    var SourceDirections;
    var DestinDirections;
    //  ----------  //
    this.Location  = new cLocation(pXYZ);
    this.BlockInfo = new cBlockInfo(pBlocktype, pSubtype);
    this.PowerInfo = new cPowerInfo(this, 0, 0, pSignalName, pSignalSourceNames);
    gBlocks.push(this);
}
cBlock.prototype.SetDirections = function (pSourceDirections, pDestinDirections) {
    this.SourceDirections = [];
    this.DestinDirections = [];
    for (var i = 0; i < pSourceDirections.length; i++) { this.SourceDirections.push(pSourceDirections[i]); }
    for (var i = 0; i < pDestinDirections.length; i++) { this.DestinDirections.push(pDestinDirections[i]); }
}
cBlock.prototype.DirSourceNames = function () {
    p = this.PowerInfo;
    p.SourceNames = [];
    for (var i = 0; i < this.SourceDirections.length; i++) {
        switch(this.SourceDirections[i]) {
            case 'w': lVector = [-1,-1, 0]; break; case 'W': lVector = [-1, 0, 0]; break; case 'M': lVector = [-1,+1, 0]; break;
            case 'e': lVector = [+1,-1, 0]; break; case 'E': lVector = [+1, 0, 0]; break; case 'F': lVector = [+1,+1, 0]; break;
            case 'n': lVector = [ 0,-1,-1]; break; case 'N': lVector = [ 0, 0,-1]; break; case 'H': lVector = [ 0,+1,-1]; break;
            case 's': lVector = [ 0,-1,+1]; break; case 'S': lVector = [ 0, 0,+1]; break; case 'Z': lVector = [ 0,+1,+1]; break;
            case 'd': lVector = [ 0,-1, 0]; break;                                        case 'U': lVector = [ 0,+1, 0]; break;
            default : lVector = [ 0, 0, 0]; break;
        }
        p.SourceNames.push(this.Location.PKlocation(lVector));
    }
}
cBlock.prototype.SetInput  = function() {
    p = this.PowerInfo;
    if (p.Power.length > 0) {
        var lSourcePower = 0;
        for (var i = 0; i < p.Sources.length; i++) {
            if (lSourcePower < p.Sources[i].PowerInfo.Power[0])
               {lSourcePower = p.Sources[i].PowerInfo.Power[0]}
        }
        var lDecay = 1;
        if (lSourcePower < lDecay) lSourcePower = lDecay;
        p.Power[p.Power.length - 1] = lSourcePower - lDecay;
    }
}
cBlock.prototype.DrawBlock = function(y, ctx) { this.BlockInfo.DrawBlock(y,ctx,this.Location); }
cBlock.prototype.Debug = function (pError = '') {
    var lHTML = '';
    var p = this.PowerInfo;
    if (pError != '') { lHTML += '<br/><b>' + pError + '</b>'; }
    lHTML += '<br/>' + this.Signal;
    lHTML += ' | ' + this.Blocktype + this.Subtype;
    lHTML += ' | ' + p.Power.length + ' Power: ';
    for (var i = 0; i < p.Power.length; i++) { lHTML += ' ' + p.Power[i]; }
    lHTML += ' | ' + p.Sources.length + ' Sources: ';
    for (var i = 0; i < p.Sources.length; i++) { lHTML += ' ' + p.Sources[i].PowerInfo.SignalName; }
    ShowError(lHTML);
}
// ========================================================================== //
function cRedTorch(pXYZ, pOrientation, pSignalName = 'Dir', pSignalSourceNames) {
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
cRedTorch.prototype.DirSourceNames = function() {
    p = this.PowerInfo;
    p.SourceNames = [];
    switch(this.Orientation) {
        case 'W': lVector = [+1, 0, 0]; break;
        case 'E': lVector = [-1, 0, 0]; break;
        case 'N': lVector = [ 0, 0,+1]; break;
        case 'S': lVector = [ 0, 0,-1]; break;
        case 'U': lVector = [ 0,-1, 0]; break;
        case 'U': lVector = [ 0,-1, 0]; break;
    }
    p.SourceNames.push(this.Location.PKlocation(lVector));
}
cRedTorch.prototype.Subtype = function () {
    switch (this.Orientation) {
        case 'E': return '1'; break;
        case 'W': return '2'; break;
        case 'S': return '3'; break;
        case 'N': return '4'; break;
        case 'U': return '5'; break;
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
    if (this.Location.Y == y) {
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
function cRepeater(pXYZ, pOrientation, pDelay, pSignalName = 'Dir', pSignalSourceNames = '') {
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
    this.PowerInfo = new cPowerInfo(this, 0, pDelay, pSignalName, pSignalSourceNames);
    this.PowerInfo.Distance = gMaxPower;
    gBlocks.push(this);
}
cRepeater.prototype.DirSourceNames = function() {
    p = this.PowerInfo;
    p.SourceNames = [];
    switch(this.Orientation) {
        case 'W': lVector = [+1, 0, 0]; break;
        case 'E': lVector = [-1, 0, 0]; break;
        case 'N': lVector = [ 0, 0,+1]; break;
        case 'S': lVector = [ 0, 0,-1]; break;
    }
    p.SourceNames.push(this.Location.PKlocation(lVector));
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
    catch (err) { this.Debug(err); }
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
cHighSlab.prototype.DirSourceNames = function() {}
cHighSlab.prototype.SetInput = function () { this.PowerInfo.SetInput(); }
cHighSlab.prototype.DrawBlock = function(y,ctx) {
    var lX = xOffset + this.Location.X * xScale + xScale/2;
    var lZ = yOffset + this.Location.Z * zScale + zScale/2;
    if (this.Location.Y == y) {
        ctx.strokeStyle = 'rgb(160,160,160)';
        ctx.beginPath();
        // ctx.rect(lX-6,lZ-6,12,12);
        ctx.rect(lX-8,lZ-8,16,16);
        ctx.stroke();
        ctx.strokeStyle = 'rgb(192,192,192)';
        ctx.beginPath();
        ctx.rect(lX-2,lZ-2,4,4);
        ctx.stroke();
        for (var dir = 0; dir < this.Directions.length; dir++) {
            // var upperLine = [rotate(this.Directions[dir],[xScale/2,-2]),rotate(this.Directions[dir],[+2,-2])];
            // var lowerLine = [rotate(this.Directions[dir],[xScale/2,+2]),rotate(this.Directions[dir],[+2,+2])];
            // ctx.beginPath();
            // ctx.moveTo(lX + upperLine[0][0], lZ + upperLine[0][1]);
            // ctx.lineTo(lX + upperLine[1][0], lZ + upperLine[1][1]);
            // ctx.moveTo(lX + lowerLine[0][0], lZ + lowerLine[0][1]);
            // ctx.lineTo(lX + lowerLine[1][0], lZ + lowerLine[1][1]);
            // ctx.stroke();
            var lLine = [rotate(this.Directions[dir],[xScale/2,0]),rotate(this.Directions[dir],[+2,0])];
            ctx.beginPath();
            ctx.moveTo(lX + lLine[0][0], lZ + lLine[0][1]);
            ctx.lineTo(lX + lLine[1][0], lZ + lLine[1][1]);
            ctx.stroke();
        }
    }
}
// ========================================================================== //
function cWir3(pXYZ, pSourceDirections = 'WENS', pDestinDirections = '') {
    cWir2(pXYZ, '', pSourceDirections, pDestinDirections);
}
function cWir2(pXYZ, pSignalName, pSourceDirections = 'WENS', pDestinDirections = '') {
    lWire = new cWire(pXYZ, pSourceDirections, 'redstone_wire', 0, 'Dir');
    if (pSignalName != '') lWire.PowerInfo.SignalName = pSignalName;
    for (var i = 0; i < pDestinDirections.length; i++) {
        if (lWire.DestinDirections.indexOf(pDestinDirections[i]) < 0)
            lWire.DestinDirections.push(pDestinDirections[i]);
    }
}
// ========================================================================== //
function cWire(pXYZ, pDirectionString = 'wensdWENSUMFHZ', pBlocktype = 'wire', pSubtype = '0', pSignalName = 'Auto', pSignalSourceNames = '') {
    var Location;
    var BlockInfo;
    var PowerInfo;
    var SourceDirections;
    var DestinDirections;
    //  ----------  //
    this.SourceDirections = [];
    this.DestinDirections = [];
    for (var i = 0; i < pDirectionString.length; i++) { this.SourceDirections.push(pDirectionString[i]); }
    for (var i = 0; i < pDirectionString.length; i++) { this.DestinDirections.push(pDirectionString[i]); }
    this.Location  = new cLocation(pXYZ);
    this.BlockInfo = new cBlockInfo(pBlocktype,pSubtype);
    this.PowerInfo = new cPowerInfo(this, 0, 0, pSignalName, pSignalSourceNames);
    gBlocks.push(this);
}
cWire.prototype.DirSourceNames = function () {
    p = this.PowerInfo;
    p.SourceNames = [];
    for (var i = 0; i < this.SourceDirections.length; i++) {
        switch(this.SourceDirections[i]) {
            case 'w': lVector = [-1,-1, 0]; break; case 'W': lVector = [-1, 0, 0]; break; case 'M': lVector = [-1,+1, 0]; break;
            case 'e': lVector = [+1,-1, 0]; break; case 'E': lVector = [+1, 0, 0]; break; case 'F': lVector = [+1,+1, 0]; break;
            case 'n': lVector = [ 0,-1,-1]; break; case 'N': lVector = [ 0, 0,-1]; break; case 'H': lVector = [ 0,+1,-1]; break;
            case 's': lVector = [ 0,-1,+1]; break; case 'S': lVector = [ 0, 0,+1]; break; case 'Z': lVector = [ 0,+1,+1]; break;
            case 'd': lVector = [ 0,-1, 0]; break;                                        case 'U': lVector = [ 0,+1, 0]; break;
            default : lVector = [ 0, 0, 0]; alert('Onbekende richting ' + this.SourceDirections[i] + ' voor cWire'); break;
        }
        p.SourceNames.push(this.Location.PKlocation(lVector));
    }
}
cWire.prototype.SetInput = function () {
    p = this.PowerInfo;
    if (p.Power.length > 0) {
        var lSourcePower = 0;
        for (var i = 0; i < p.Sources.length; i++) {
            if (lSourcePower < p.Sources[i].PowerInfo.Power[0])
               {lSourcePower = p.Sources[i].PowerInfo.Power[0]}
        }
        var lDecay = 1;
        if (lSourcePower < lDecay) lSourcePower = lDecay;
        p.Power[p.Power.length - 1] = lSourcePower - lDecay;
    }
}
cWire.prototype.DrawBlock = function(y,ctx) {
    var lX = xOffset + this.Location.X * xScale + xScale/2;
    var lZ = yOffset + this.Location.Z * zScale + zScale/2;
    if (this.Location.Y == y) {
        ctx.strokeStyle = gStyleWire;
        for (var dir = 0; dir < this.DestinDirections.length; dir++) {
            var vector = rotate(this.DestinDirections[dir],[xScale/2-1,0]);
            ctx.beginPath();
            ctx.moveTo(lX,lZ);
            ctx.lineTo(lX + vector[0], lZ + vector[1]);
            ctx.stroke();
        }
        for (var dir = 0; dir < this.SourceDirections.length; dir++) {
            var vector = rotate(this.SourceDirections[dir],[xScale/2-3,0]);
            var apex1 = rotate(this.SourceDirections[dir],[+2,+2])
            var apex2 = rotate(this.SourceDirections[dir],[+2,-2])
            ctx.beginPath();
            ctx.moveTo(lX + vector[0]           , lZ + vector[1]           );
            ctx.lineTo(lX + vector[0] + apex1[0], lZ + vector[1] + apex1[1]);
            ctx.lineTo(lX + vector[0] + apex2[0], lZ + vector[1] + apex2[1]);
            ctx.closePath();
            ctx.stroke();
        }
    }
}
cWire.prototype.Debug = function(pError = '') { this.Signal.Block.Debug(pError); }
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
    this.PowerInfo.Distance = gMaxPower;
    gBlocks.push(this);
}
cLever.prototype.DirSourceNames = function() {}
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
function cButton(pXYZ, pOrientation = 'E', pSignalName = '') {
    var Location;
    var BlockInfo;
    var PowerInfo;
    var Orientation;
    //  ----------  //
    this.Orientation = pOrientation;
    this.Locked    = false;
    this.Location  = new cLocation(pXYZ);
    this.BlockInfo = new cBlockInfo('button', this.Subtype());
    this.PowerInfo = new cPowerInfo(this, 0, 12, pSignalName);
    this.PowerInfo.Distance = gMaxPower;
    gBlocks.push(this);
}
cButton.prototype.DirSourceNames = function() {}
cButton.prototype.SetInput = function () {
    var a = 1;
}
cButton.prototype.Off = function () { this.PowerInfo.Power[0] =  0; }
cButton.prototype.On  = function () {
    p = this.PowerInfo;
    for (var i = 0; i < p.Power.length; i++) { p.Power[i] = gMaxPower; }
    p.Power[p.Power.length - 1] = 0;
}
cButton.prototype.Subtype = function () {
    switch (this.Orientation) {
        case 'S': return '0'; break; // nog controleren
        case 'E': return '1'; break;
        case 'N': return '2'; break;
        case 'W': return '3'; break;
    }
}
cButton.prototype.DrawBlock = function(y,ctx) {
    var lX = xOffset + this.Location.X * xScale + xScale/2;
    var lZ = yOffset + this.Location.Z * zScale + zScale/2;
    if (this.Location.Y == y) {
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
function ClockUnit(pUnitName, pDelay = 4) {
    lCK = new cUnit(pUnitName, gBlocks.length);
    new cRedTorch([0,0,0], 'W');
    new cWir2    ([0,0,1], 'CK', 'N','E');
    new cRepeater([1,0,1], 'E' , pDelay);
    new cWir2    ([2,0,1], '', 'WN');
    new cWir2    ([2,0,0], '', 'WS');
    new cWir2    ([1,1,0], 'CK110', 'e');
    new cBlock   ([1,0,0], 'sandstone',0,'-CK',['CK110']);
    lCK.SetIndexLastBlock(gBlocks.length);
    return lCK;
}
function TclockUnit( pUnitName, nClocks, pStartFrequency = 2) {
    var tCK = new cUnit(pUnitName, gBlocks.length);
    var lFrequency = pStartFrequency;
    for (var i = 0; i < nClocks; i++) {
        new cClockBlock(pUnitName + '.F' + i, lFrequency);
        lFrequency *= 2;
    }
    tCK.SetIndexLastBlock(gBlocks.length);
    return tCK;
}
function ClockSignals() {
    gBlocks = [];
    gSignals = [];
    lCK  = ClockUnit('CK', 4);
    lCK.Move([0,1,0])
    tCK  = TclockUnit('TCK', 5, 5);
    lPU  = PulseUnit('P', 5, 10, 2, [2,6,0,0,0]);
    SetSignalsToShow('CK','TCK.F0','TCK.F1','TCK.F2','TCK.F3','TCK.F4','P.Q0','P.Q1');
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
    new cWir2    ([4,1,0], '', 'WS');
    new cWir2    ([3,1,0], '', 'E', 'W');
    new cRepeater([2,1,0], 'W'   , lDelays[2]        ,' CK.3.r' ,[' CK.2.r' ]);
    new cBlock   ([1,1,0], 'sandstone', 0            ,'-CK'     ,[' CK.3.r' ]);
    new cRedTorch([0,1,0], 'W'                       ,' CK'     ,['-CK'     ]);
    new cWir2    ([0,1,1], '', 'NS', 'E');
    new cRepeater([1,1,1], 'E'   , lDelays[0]        ,' CK.1.r' ,[' CK'     ]);
    new cWir2    ([2,1,1], '', 'WS', 'E');
    new cRepeater([3,1,1], 'E'   , lDelays[1]        ,' CK.2.r' ,[' CK.1.r' ]);
    new cWir2    ([4,1,1], '', 'WNS');
    //  Phi-0 en Phi-1
    new cBlock   ([0,1,2], 'sandstone', 0            ,' CK.0.b', [' CK.1' ]);
    new cBlock   ([2,1,2], 'sandstone', 0            ,' CK.1.b', [' CK.2' ]);
    new cBlock   ([4,1,2], 'sandstone', 0            ,' CK.2.b', [' CK.3' ]);
    new cWir2    ([0,2,2], 'CK.1', 'n', 'ENS');
    new cWir2    ([2,2,2], 'CK.2', 'n', 'EWNS');
    new cWir2    ([4,2,2], 'CK.3', 'n', 'WNS');
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
    new cRedTorch([0,1,3], 'S'                       ,'-CK.0.i' ,[' CK.0.b' ]);
    new cRedTorch([2,1,3], 'S'                       ,'-CK.1.i' ,[' CK.1.b' ]);
    new cRedTorch([4,1,3], 'S'                       ,'-CK.2.i' ,[' CK.2.b' ]);
    new cWire    ([0,1,4], 'EN');
    new cBlock   ([1,1,4], 'sandstone', 0);
    new cWire    ([1,2,4], 'EW' ,u,u,'-Phi-1'  ,['-CK.0.i' ,'-CK.1.i','-CK.2.i']);
    new cWire    ([2,1,4], 'EWN');
    new cWire    ([3,1,4], 'EW');
    new cWire    ([4,1,4], 'WN');
    new cRedTorch([1,1,5], 'S'                       ,' Phi-1'  ,['-Phi-1'  ]);
}
function PhaseClockSignals() {
    PhaseClockInit();
    SetSignalsToShow('CK','Phi-0','Phi-1','CK.1','CK.2','CK.3');
    // SetSignalsToShow('-CK','CK','CK.1.r','CK.2.r','CK.3.r');
    Signaal('PH');
}
// =========================================================================== //
function PhaseClock2Init() {
    gBlocks = [];
    gSignals = [];
    u = undefined;
    //  Base Clock
    new cBlock   ([2,2,2], 'sandstone', 0   ,'-CK'      ,['002002001']);
    new cRedTorch([3,2,2], 'E'              ,' CK'      ,['-CK'     ]);
    new cRepeater([3,2,1], 'N',2);
    new cWire    ([3,2,0], 'WES');
    new cWire    ([2,2,0], 'WE');
    new cRepeater([2,2,1], 'S',2);
    //   Phi-0
    new cWire    ([1,2,0], 'WE');
    new cWire    ([0,2,0], 'ES');
    new cWire    ([0,2,2], 'NS');
    new cWire    ([0,2,1], 'NS');
    new cWire    ([0,2,3], 'N');
    new cBlock   ([0,2,4], 'sandstone', 0, '000002004', ['000002003']);
    new cRedTorch([0,3,4], 'U');
    new cWire    ([2,2,3], 'N');
    new cBlock   ([2,2,4], 'sandstone', 0, '002002004', ['002002003']);
    new cRedTorch([2,3,4], 'U');
    new cWire    ([1,3,4], 'WE');
    new cBlock   ([1,2,4], 'sandstone', 0, '001002004', ['001003004']);

    // new cWire    ([5,3,2], 'WNS');
    // new cWire    ([5,2,1], 'N');
    // new cWire    ([5,2,0], 'WS');
    // new cWire    ([4,2,0], 'WE');

    // new cWire    ([4,2,2], 'W');
    // new cWire    ([5,3,3], 'NS');
    // new cBlock   ([5,2,3], 'sandstone', 0);
    // new cWire    ([5,2,4], 'N');
    // new cWire    ([1,2,5], 'N');
    // new cRepeater([5,2,5], 'S', 2);
    // new cBlock   ([5,2,6], 'sandstone', 0, '005002006', ['005002005']);
    // new cBlock   ([1,2,6], 'sandstone', 0, '001002006', ['001002005']);
    // new cRedTorch([5,2,7], 'S');
    // new cRedTorch([1,2,7], 'S');


    // new cWire    ([0,2,1], 'ENS');
    // new cRepeater([1,2,1], 'E'   , lDelays[0]        ,' CK.1.r' ,[' CK'     ]);
    // new cWire    ([2,2,1], 'EWS');
    // new cRepeater([3,2,1], 'E'   , lDelays[1]        ,' CK.2.r' ,[' CK.1.r' ]);
    // new cWire    ([4,2,1], 'WNS');
}
// =========================================================================== //
function PhaseClock2Signals() {
    PhaseClock2Init();
    // SetSignalsToShow('000002000','001002000','002002000','003002000','CK');
    SetSignalsToShow('-CK','CK','003002001','003002000','002002000','002002001');
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
    // new cLever    ([   0,2,mz-2], 'W'           , ' RST');
    new cButton  ([   0,2,mz-2], 'W'           , ' RST');
    for (var x = 1; x < mx; x++) new cWire    ([ x,2,mz-2], 'WE');
    new cRepeater([mx+2,2,mz-3], 'S'   , 1     ,' IC.RST.L',['-Phi-0']);
    new cRepeater([mx+4,2,mz-1], 'N'   , 1     ,' IC.0.t.L' ,['-Phi-1'     ]);

    new cHighSlab([mx  ,2,mz-2], 'WEN' , u, u  ,' IC.5R'  ,[' IC.5.t',' RST']);
    new cWire    ([mx+1,2,mz-2], 'WE');
    new cRepeater([mx+2,2,mz-2], 'E'   , 1     ,' IC.RST' ,['IC.5R', 'IC.RST.L','IC.0.T']);
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
    SetSignalsToShow('CK','RST','IC.5R','IC.RST.L','IC.0.T','IC.RST','IC.0.T','IC.1.T','IC.2.T','IC.3.T','IC.4.T','IC.5.T');
    Signaal('IC');
}
// ========================================================================== //
function LockedRepeaterInit() {
    lCK  = ClockUnit('CK', 4);
    lCK.Move([0,1,0])
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
    Signaal('LR');
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
}
function FlipFlopUnit(pUnitName, pSourceName) {
    lFF = new cUnit(pUnitName, gBlocks.length);
    new cBlock   ([1,1,0], 'sandstone', 0,' '+ pUnitName + '.CK'     ,[     pSourceName]);
    new cRedTorch([2,1,0], 'E'           ,' '+ pUnitName + '.In'     ,[' '+ pUnitName + '.CK' ]);
    new cRepeater([1,1,1], 'S', 1        ,' '+ pUnitName + '.RR.Lock',[' '+ pUnitName + '.CK' ]);
    new cRepeater([2,1,1], 'S', 1        ,' '+ pUnitName + '.RL.Lock',[' '+ pUnitName + '.In' ]);
    new cRedTorch([3,1,2], 'N'           ,'-'+ pUnitName + '.RR'     ,[' '+ pUnitName + '.RR' ]);
    new cRepeater([2,1,2], 'W', 1        ,' '+ pUnitName + '.RL'     ,['-'+ pUnitName + '.RR' ,' '+ pUnitName + '.RL.Lock']);
    new cRepeater([1,1,2], 'W', 1        ,' '+ pUnitName + '.RR'     ,[' '+ pUnitName + '.RL' ,' '+ pUnitName + '.RR.Lock']);
    new cBlock   ([3,1,3], 'sandstone', 0,' '+ pUnitName + '.Q'      ,[' '+ pUnitName + '.RR' ]);
    new cWir2    ([2,1,3], '', 'W', 'E')
    new cWir2    ([1,1,3], '', 'WE')
    new cWir2    ([0,1,3], '', 'EN')
    new cWir2    ([0,1,2], '', 'ES')
    lFF.SetIndexLastBlock(gBlocks.length);
    return lFF;
}
function FlipFlopSignals() {
    gBlocks = [];
    gSignals = [];
    lCK = ClockUnit('CK', 2);
    lCK.Move([1,0,0])
    FlipFlopInit();
    lFF3 = FlipFlopUnit('FF2','CK')
    lFF3.Move([0,0,2])
    SetSignalsToShow(' CK','FF1.Q','FF2.Q');
    Signaal('FF');
}
// ========================================================================== //
function CarryGatherUnit(pUnitName, pSourceName) {
    lCG = new cUnit(pUnitName, gBlocks.length);
    //  IR1 = Carry van instructie bus, instructies CLC en SEC
    //  ÏD  = 0 = Carry uit instructie
    new cBlock   ([ 1,0,0], 'sandstone', 0, 'IR1', ['TCK.F3']);
    new cWir2    ([ 1,0,1], '', 'N','S')
    new cBlock   ([ 3,0,0], 'sandstone', 0, 'ÏD', ['TCK.F4']);
    new cWir2    ([ 3,0,1], '' , 'NS')
    new cWir2    ([ 3,1,2], '', 'wn')
    new cBloc2   ([ 3,0,2], '', 'N');
    new cWir2    ([ 2,0,2], '', 'F','W' )
    new cHighSlab([ 1,0,2], 'enS');
    new cWir2    ([ 1,1,2], 'IR1|ÏD', 'enS' )
    new cWir2    ([ 1,1,3], '', 'N')
    new cBloc2   ([ 1,0,3], '', 'U');
    new cRedTorch([ 1,0,4], 'S');
    new cWir2    ([ 2,0,4], '-IR1(ÏD=0)', 'W', 'E')
    //  D1  = Carry van databus, instructie PLP
    //  ÏD  = 1 = Carry van databus
    new cBlock   ([ 6,0,0], 'sandstone', 0, 'D1', ['TCK.F2']);
    new cWir2    ([ 6,0,1], 'D1' , 'N', 'S')
    new cRedTorch([ 4,0,2], 'E');
    new cWir2    ([ 5,0,2], '', 'W','E' )
    new cHighSlab([ 6,0,2], 'WNS');
    new cWir2    ([ 6,1,2], 'D1|-ÏD', 'wnS' )
    new cWir2    ([ 6,1,3], '', 'N' )
    new cBloc2   ([ 6,0,3], '', 'U');
    new cRedTorch([ 6,0,4], 'S');
    new cWir2    ([ 5,0,4], '', 'WE')
    new cWir2    ([ 4,0,4], '-D1(ÏD=1)', 'E', 'W')
    //  IR1 of D1, afhankelijk van ÏD
    new cHighSlab([ 3,0,4], 'WES');
    new cWir2    ([ 3,1,4], '-Ins', 'weS')
    new cWir2    ([ 3,1,5], '', 'NS')
    new cWir2    ([ 3,0,6], '', 'EH')
    //  AC = Carry uit berekeningen (ALU)
    //  ÏA = 0 = Carry uit instructie of databus
    new cBlock   ([11,0,0], 'sandstone', 0, 'AC', ['TCK.F1']);
    new cWir2    ([11,0,1], '' , 'NS')
    new cBloc2   ([11,0,2], '', 'N');
    new cRedTorch([11,0,3], 'S');
    new cWir2    ([11,0,4], '', 'NS')
    new cWir2    ([11,0,5], '', 'NS')
    new cHighSlab([11,0,6], 'WNS');
    new cWir2    ([11,1,6], 'AC|-ÏA', 'wnS');
    new cWir2    ([11,1,7], '', 'N');
    new cBloc2   ([11,0,7], '', 'U');
    new cRedTorch([11,0,8], 'S');  gSignals[gSignals.length - 1].SignalName = '-AC|(ÏA=1)';

    new cBlock   ([ 8,0,0], 'sandstone', 0, 'ÏA', ['TCK.F5']);
    new cWir2    ([ 8,0,1], '', 'NS')
    new cWir2    ([ 8,0,2], '', 'NS')
    new cWir2    ([ 8,0,3], '', 'NS')
    new cWir2    ([ 8,0,4], '', 'NS')
    new cWir2    ([ 8,0,5], '', 'NS')
    new cWir2    ([ 8,1,6], '', 'wn');
    new cBloc2   ([ 8,0,6], '', 'WN');
    new cRedTorch([ 9,0,6], 'E');
    new cWir2    ([10,0,6], '', 'W', 'E')

    new cWir2    ([ 4,0,6], '', 'WE' )
    new cWir2    ([ 5,0,6], '', 'W', 'E' )
    new cWir2    ([ 7,0,6], '', 'E', 'W' )
    new cHighSlab([ 6,0,6], 'WES');
    new cWir2    ([ 6,1,6], '', 'weS' )
    new cWir2    ([ 6,1,7], '', 'N');
    new cBloc2   ([ 6,0,7], '', 'U');
    new cRedTorch([ 6,0,8], 'S');   gSignals[gSignals.length - 1].SignalName = '-Ins|(ÏA=0)';

    new cWir2    ([ 7,0,8], '', 'WE' )
    new cWir2    ([ 8,0,8], '', 'WES')
    new cWir2    ([ 9,0,8], '', 'WE')
    new cWir2    ([10,0,8], '', 'WE')
    lCG.SetIndexLastBlock(gBlocks.length);
    return lCG;
}
function CarryFlagUnit(pUnitName, pSourceName) {
    lCY = new cUnit(pUnitName, gBlocks.length);
    new cWir2    ([ 8,0, 9], 'Cin', 'N', 'S')
    new cRepeater([ 8,0,10],'S',1,' CY', ['Cin','CY.R']);
    new cRepeater([ 7,0,10],'E',1,' CY.R', ['P.Q0']);
    lCY.SetIndexLastBlock(gBlocks.length);
    return lCY;
}
function CarryFlagUnit2(pUnitName, pSourceName) {
    lCY = new cUnit(pUnitName, gBlocks.length);
    new cWir2    ([ 8,0, 9], 'Cin', 'NS')
    new cWir2    ([ 8,0,10], '', 'WNS')
    new cWir2    ([ 7,1,10], '', 'e')
    new cBloc2   ([ 7,0,10], '', 'U')
    new cRedTorch([ 6,0,10], 'W');   gSignals[gSignals.length - 1].SignalName = '-Cin';

    new cWir2    ([ 6,0,11], '', 'NS')
    new cWir2    ([ 8,0,11], '', 'NS')
    new cHighSlab([ 6,0,12], 'ENS');
    new cHighSlab([ 8,0,12], 'WNS');
    new cWir2    ([ 6,1,12], '', 'enS')
    new cWir2    ([ 7,0,12], '', 'S', 'WE')
    new cBlock   ([ 7,0,13], 'sandstone', 0, 'CR', ['P.Q0']);
    new cWir2    ([ 8,1,12], '', 'wnS')
    new cWir2    ([ 6,1,13], '', 'N')
    new cBloc2   ([ 6,0,13], '', 'U')
    new cWir2    ([ 8,1,13], '', 'N')
    new cBloc2   ([ 8,0,13], '', 'U')
    new cRedTorch([ 5,0,13], 'W');              gSignals[gSignals.length - 1].SignalName = 'Con';
    new cWir2    ([ 4,0,13], '', 'ES')
    for (var z = 14; z < 18; z++) new cWir2 ([ 4,0,z], '', 'NS')
    new cWir2    ([ 4,0,18], 'Con', 'EN')
    new cWir2    ([ 5,0,18], '', 'W', 'E')
    new cRedTorch([ 8,0,14], 'S');              gSignals[gSignals.length - 1].SignalName = 'Coff';
    new cWir2    ([ 8,0,15], '', 'N', 'S')
    new cBloc2   ([ 8,0,16], 'CLRblock', 'WN')
    new cRedTorch([ 8,0,17], 'S')
    new cWir2    ([ 8,0,18], 'Cout', 'WNS')
    new cWir2    ([ 7,0,18], '', 'E', 'W')
    new cBloc2   ([ 6,0,18], 'SETblock', 'WE')
    new cRedTorch([ 6,0,17], 'N')
    new cWir2    ([ 6,0,16], '', 'ES')
    new cWir2    ([ 7,0,16], '', 'W', 'E')
    lCY.SetIndexLastBlock(gBlocks.length);
    return lCY;
}
// ========================================================================== //
function CarrySignals() {
    gBlocks = [];
    gSignals = [];
    tCK  = TclockUnit('TCK', 6, 2);
    lPU = PulseUnit('P',1,12,10,[1])
    lCG  = CarryGatherUnit('CG')
    lCY  = CarryFlagUnit('CY')
    lCG.Move ([ 0, 1, 0])
    lCY.Move ([ 0, 1, 0])
    SetSignalsToShow
    ('ÏD','ÏA' // ,'-IR1(ÏD=0)','-D1(ÏD=1)','-Ins'
    ,'AC','D1','IR1'
    // ,'-Ins|(ÏA=0)','-AC|(ÏA=1)'
    , 'Cin', '-Cin', 'CR'
    , 'Coff' // ,'CLRblock'
    , 'Con'  // ,'SETblock'
    , 'CY.R', 'CY'
    // ,'TCK.F1', 'P.Q0'
    );
    Signaal('CY');
}
// ========================================================================== //
function SetResetUnit(pUnitName, pSourceName) {
    lSR = new cUnit(pUnitName, gBlocks.length);
    new cBlock   ([0,0,4], 'sandstone', 0, 'SET', ['P.Q1']);
    new cWir2    ([1,0,4], '', 'W', 'E')
    new cBlock   ([4,0,0], 'sandstone', 0, 'CLR', ['P.Q0']);
    new cWir2    ([4,0,1], '', 'NS')
    //
    new cBloc2   ([4,0,2], 'CLRblock', 'WN')
    new cRedTorch([4,0,3], 'S')
    new cWir2    ([4,0,4], 'Q', 'WNS')
    new cWir2    ([3,0,4], '', 'WE')
    new cBloc2   ([2,0,4], 'SETblock', 'WE')
    new cRedTorch([2,0,3], 'N')
    new cWir2    ([2,0,2], '', 'ES')
    new cWir2    ([3,0,2], '', 'WE')
    lSR.SetIndexLastBlock(gBlocks.length);
    return lSR;
}
// ========================================================================== //
function SetResetSignals() {
    gBlocks = [];
    gSignals = [];
    // lPU = PulseUnit('P',2,10,2)
    lPU = PulseUnit('P', 5, 20, 2, [10,20,0,0,0]);
    lSR = SetResetUnit('SR')
    lSR.Move ([ 0, 1, 0])
    SetSignalsToShow
    ('CLR','SET','Q','SETblock','CLRblock'
    );
    Signaal('SR');
}
// ========================================================================== //
function cPulsar(pSignalName, pInterval = 2, pPulseLength = 1, pDelay = 0) {
    var Location;
    var BlockInfo;
    var PowerInfo;
    var Interval;
    var PulseLength;
    var Delay;
    this.Interval    = pInterval;
    this.PulseLength = pPulseLength;
    this.Delay       = pDelay;
    this.Location  = new cLocation([0,0,0]);
    this.BlockInfo = new cBlockInfo('sandstone', 0);
    this.PowerInfo = new cPowerInfo(this, 0, 0, pSignalName);
    this.PowerInfo.Distance = gMaxPower;
    gBlocks.push(this);
}
cPulsar.prototype.DirSourceNames = function () {}
cPulsar.prototype.DrawBlock      = function () {}
cPulsar.prototype.SetInput       = function (t) {
    p = this.PowerInfo;
    if (((t - this.Delay) % this.Interval) == 0               ) p.Power[0] = gMaxPower;
    if (((t - this.Delay) % this.Interval) == this.PulseLength) p.Power[0] = 0;
}
// ========================================================================== //
function PulseUnit( pUnitName, nPulsars = 1, pInterval = 2, pPulseLength = 1, pDelays = []) {
    var lPulse = new cUnit(pUnitName, gBlocks.length);
    var lInterval = pInterval;
    for (var i = 0; i < nPulsars; i++) {
        var lDelay = (i < pDelays.length) ? pDelays[i] : 0;
        new cPulsar(pUnitName + '.Q' + i, lInterval, pPulseLength, lDelay);
        lInterval *= 2;
    }
    lPulse.SetIndexLastBlock(gBlocks.length);
    return lPulse;
}
function ProgramCounterUnit(pUnitName, pSourceName) {
    lPC = new cUnit(pUnitName, gBlocks.length);
    //  Set or Clear
    new cWir2    ([ 1,2,8], '', 'WE');
    new cWir2    ([ 0,2,8], '', 'EN');
    for (var z = 7; z > 2; z--) new cWir2([0,2,z], '', 'NS');
    new cWir2    ([ 0,3,2], '', 'es');
    new cBloc2   ([ 0,2,2], 'C/S', 'U');
    new cRedTorch([ 0,2,1], 'N');
    //  Set on Clock
    new cHighSlab([ 2,2,2], 'weS');
    new cWir2    ([ 1,2,2], '', 'M','E');
    new cWir2    ([ 2,3,2], 'S|PC++', 'weS');
    new cWir2    ([ 2,3,3], '', 'N');
    new cBloc2   ([ 2,2,3], '', 'U');
    new cRedTorch([ 2,2,4], 'S');
    new cWir2    ([ 2,2,5], 'SET', 'NS');
    //  Clear on Clock
    new cHighSlab([ 6,2,1], 'nS');
    new cHighSlab([ 6,2,2], 'eNS');
    new cWir2    ([ 0,2,0], '-C/S', 'ES');
    for (var x = 1; x < 6; x++) new cWir2([ x,2,0], '', 'WE');
    new cWir2    ([ 6,2,0], '', 'WZ');
    new cWir2    ([ 6,3,1], '', 'nS');
    new cWir2    ([ 6,3,2], 'C|PC++', 'eNS');
    new cWir2    ([ 6,3,3], '', 'N');
    new cBloc2   ([ 6,2,3], '', 'U');
    new cRedTorch([ 6,2,4], 'S');
    new cWir2    ([ 6,2,5], '', 'NS');
    new cWir2    ([ 6,2,6], '', 'NS');
    new cWir2    ([ 6,2,7], '', 'NS');
    new cWir2    ([ 6,2,8], '', 'WN');
    new cWir2    ([ 5,2,8], 'CLR', 'WE');
    //  Clear
    new cWir2    ([ 4,2,6], '', 'WS');
    new cWir2    ([ 4,2,7], '', 'NS');
    new cBloc2   ([ 4,2,8], '', 'NE');
    new cRedTorch([ 3,2,8], 'W');
    //  Set
    new cWir2    ([ 2,2,8], 'PC0.Q', 'EN');
    new cWir2    ([ 2,2,7], '', 'NS');
    new cBloc2   ([ 2,2,6], '', 'NS');
    new cRedTorch([ 3,2,6], 'E');
    //  Input
    new cWir2    ([ 3,2,2], '', 'e', 'W');
    new cWir2    ([ 4,1,2], '', 'Me');
    new cWir2    ([ 5,0,2], '', 'MF');
    new cWir2    ([ 6,1,2], '', 'wF');
    new cWir2    ([ 7,2,2], '', 'wE');
    new cBlock   ([ 8,2,2], 'sandstone', 0, 'PC++', ['P.Q2']);
    //
    lPC.SetIndexLastBlock(gBlocks.length);
    return lPC;
}
// ========================================================================== //
function ProgramCounterSignals() {
    gBlocks = [];
    gSignals = [];
    lPulsars = PulseUnit('P', 5, 5, 2);
    lPC  = ProgramCounterUnit('PC');
    lPC.Move ([ 0, 1, 0]);
    SetSignalsToShow('PC++','C/S','-C/S','C|PC++','CLR','S|PC++','SET','PC0.Q');
    Signaal('PC');
}
function NameLastSignal(pName) {
    gSignals[gSignals.length - 1].SignalName = pName;
}
// ========================================================================== //
function FullAdderOutlineA() {
    for (var x =  1; x < 15; x++) new cBlock([x,0,4], 'stained_hardened_clay',  4)
    new cBlock([ 3,0,5], 'stained_hardened_clay',  4);
    new cBlock([10,0,5], 'stained_hardened_clay',  4);
    new cBlock([14,0,5], 'stained_hardened_clay',  4);
}
function FullAdderInputA() {
    new cRepeater([1,1,4], 'E', 1, 'FA.A', ['P.Q0']); //
    for (var x =  1; x < 15; x++) new cBlock([x,0,4], 'stained_hardened_clay',  4)
    for (var x =  2; x <  7; x++) if (x != 3) new cWir3 ([x,1,4], 'WE');
    for (var x = 11; x < 14; x++) new cWir3 ([x,1,4], 'WE'); new cWir3([14,1,4], 'WS');
    new cWir3([3,1,4], 'WES'); new cWir3([7,1,4], 'WE', 'S'); new cWir3([8,1,4], 'W', 'E');
    new cBlock([ 3,0,5], 'stained_hardened_clay',  4); new cWir3([ 3,1,5], 'N', 'S'); NameLastSignal('FA.Aa');
    new cBlock([10,0,5], 'stained_hardened_clay',  4); new cWir3([10,1,5], 'N', 'S'); NameLastSignal('FA.Ac');
    new cBlock([14,0,5], 'stained_hardened_clay',  4); new cWir3([14,1,5], 'N', 'S'); NameLastSignal('FA.Ad');
    new cHighSlab([7,1,5], 'N');                       new cWir3([ 7,2,5], 'n', 'E'); NameLastSignal('FA.Ab');
    new cBloc2([ 9,1,4], 'FA.Ablock', 'W');               new cRedTorch([10,1,4], 'E');
    // new cBlock([ 9,1,4], 'stained_hardened_clay',  4);
}
function FullAdderOutlineB() {
    for (var x = 1; x < 15; x++) new cBlock([x,0,7], 'stained_hardened_clay', 14);
}
function FullAdderInputB() {
    new cRepeater([1,1,7], 'E', 1, 'FA.B', ['P.Q1']);
    for (var x = 1; x < 15; x++) new cBlock([x,0,7], 'stained_hardened_clay', 14);
    for (var x = 2; x < 11; x++) { if (x == 3 || x == 6 || x == 10) {new cWir3([x,1,7],'WE','N') } else {new cWir3([x,1,7],'WE');}}
    new cWir3 ([11,1,7], 'W', 'E');

    new cHighSlab([ 3,1,6], 'NS'); new cWir3([ 3,2, 6], 'ns', 'WE'); NameLastSignal('FA.Ba');
    new cHighSlab([10,1,6], 'NS'); new cWir3([10,2, 6], 'ns', 'E');  NameLastSignal('FA.Bc');
    new cHighSlab([14,1,6], 'NS'); new cWir3([14,2, 6], 'ns', 'WE'); NameLastSignal('FA.Bd');
    new cBloc2([12,1,7], 'FA.Bblock', 'W'); new cRedTorch([13,1,7], 'E'); new cWir3 ([14,1,7], 'WN');
    new cHighSlab([6,1,6],  'S'); new cWir3([6,2,6],  's');
    new cHighSlab([6,2,7], 'NS'); new cWir3([6,3,7], 'nS');
    new cBloc2([ 6,3,8], 'FA.Bhigh', 'N'); new cRedTorch([7,3,8], 'E'); NameLastSignal('FA.Bb');
}
function FullAdderOutlineCinput() {
    //  Outline
    for (var x =  4; x < 14; x++) new cBlock([ x,0, 9], 'stained_hardened_clay', 5);
    for (var z = 10; z < 15; z++) new cBlock([10,0, z], 'stained_hardened_clay', 5);
                                  new cBlock([ 6,0,10], 'stained_hardened_clay', 5);
                                  new cBlock([ 4,0, 8], 'stained_hardened_clay', 5);
                                  new cBlock([13,0, 8], 'stained_hardened_clay', 5);
}
function FullAdderInputC() {
    //  Unit
    new cRepeater([10,1,14], 'N', 1, 'FA.C', ['P.Q2']);
    new cHighSlab([10,0,13], 'NS');  new cWir3    ([10,1,13], 'NS');
    new cHighSlab([10,0,12], 'WNS');  new cWir3    ([10,1,12], 'WNS');
    new cHighSlab([10,0,11], 'ENS');  new cWir3    ([10,1,11], 'ENS');
    new cHighSlab([10,0,10], 'NS');  new cWir3    ([10,1,10], 'NS');
    new cHighSlab([10,1,9], 'WES'); new cWir3([10,2,9], 'Ws', 'E');
    //
    new cBloc2([11,2,9], '', 'W'); new cWir3([11,3,9], 'w', 'N');   NameLastSignal('FA.Cc');
    new cRedTorch([12,2, 9], 'E');
    new cHighSlab([13,0,9], 'WENS');  new cWir3([13,1,9], 'M','N'); NameLastSignal('FA.Cd');
    new cHighSlab([13,1, 8], 'NS'); new cWir3([13,2, 8], 's', 'N');
    //
    new cHighSlab([9,1,9], 'WE' ); new cWir3([9,2,9], 'WE');
    new cHighSlab([8,1,9], 'WEN'); new cWir3([8,2,9], 'WE', 'N');  NameLastSignal('FA.Cb');
    new cHighSlab([7,1,9], 'WE' ); new cWir3([7,2,9], 'WE');
    new cHighSlab([6,1,9], 'WES'); new cWir3([6,2,9], 'ES', 'W');
    new cBloc2([5,2,9], '', 'U'); new cWir3([5,3,9], 'e');
    new cRedTorch([ 4,2, 9], 'W');
    new cBlock([ 4,1,8], 'stained_hardened_clay',  5); new cWir3([4,2,8], 'NS'); NameLastSignal('FA.Ca');
    //  Naar de AND
    new cHighSlab([ 6,1,10], 'NS'); new cWir3([ 6,2,10], 'N', 'S');
}
function FullAdderOutlineCoutput() {
    //  Outline
    for (var z =  8; z < 13; z++) new cBlock([ 2,0, z], 'stained_hardened_clay', 1);
    for (var z =  6; z < 12; z++) new cBlock([15,0, z], 'stained_hardened_clay', 1);
    for (var x =  3; x < 10; x++) new cBlock([ x,0,12], 'stained_hardened_clay', 1);
    for (var x = 11; x < 15; x++) new cBlock([ x,0,11], 'stained_hardened_clay', 1);
                                  new cBlock([ 5,0,11], 'stained_hardened_clay', 1);
}
function FullAdderOutputC() {
    //  A or B
new cRepeater([3,3,6], 'W', 1, 'FA.Co', ['P.Q2']);
new cRepeater([5,2,10], 'S', 1, 'FA.Co2', ['P.Q2']);
    for (var z = 7; z < 12; z++) new cHighSlab([ 2,2,z], 'NS');
    for (var z = 7; z < 12; z++) new cWir3    ([ 2,3,z], 'NS');
    new cHighSlab([ 2,2, 6], 'ES'); new cWir3([ 2,3, 6], 'ES');
    new cHighSlab([ 2,2,12], 'EN'); new cWir3([ 2,3,12], 'EN');
    new cHighSlab([ 3,1,12], 'W'); new cWir3([ 3,2,12], 'M', 'E');
    // //  (A or B) and C
    new cBloc2([ 4,2,12], '', 'W'); // new cBlock([ 4,2,12], 'stained_hardened_clay', 1);
    new cBlock([ 5,2,12], 'stained_hardened_clay', 1);
    new cBloc2([ 5,2,11], '', 'N'); // new cBlock([ 5,2,11], 'stained_hardened_clay', 1);
    new cRedTorch([4,3,12], 'U'); new cRedTorch([5,3,11], 'U'); new cWir3([5,3,12],'WN'); // AND gate
    new cRedTorch([6,3,12], 'E');
    new cHighSlab([7,2,12], 'W'); new cWir3([7,3,12], 'W', 'E');
    new cHighSlab([8,3,12], 'W'); new cWir3([8,4,12], 'w', 'E');
    new cHighSlab([9,4,12], 'W'); new cWir3([9,5,12], 'w', 'E'); NameLastSignal('FA.(A|B).C');
    //  A and B = not (not A or not B)
new cRepeater([15,3,6], 'S', 1, 'FA.Co3', ['P.Q2']);
    for (var z = 7; z < 11; z++) new cHighSlab([15,2,z], 'NS');
    for (var z = 7; z < 11; z++) new cWir3    ([15,3,z], 'NS');
    new cBloc2([15,3,11],  '', 'N'); // new cBlock([15,3,11], 'stained_hardened_clay', 1);
    new cRedTorch([14,3,11],'W' );
    new cHighSlab([13,2,11], 'E'); new cWir3([13,3,11],'WE');
    new cHighSlab([12,2,11],'WE'); new cWir3([12,3,11],'E','W');
    new cHighSlab([11,3,11], 'E'); new cWir3([11,4,11],'e','W');



    //  Carry-out = ((A or B) and C) or (A and B)
}
function FullAdderOutputQ() {
    // A or B or not C
    for (var z = 4; z < 8; z++) {
        if (5 <= z && z <= 6) new cHighSlab([4,2,z], 'NS');
        else                  new cBlock   ([4,2,z], 'stained_hardened_clay', 3);
        new cWir3([4,3,z], 'NS');
    }
    new cRedTorch([ 4,2,3], 'N');
    // // A or not B or C
    new cBlock   ([8,2,4], 'stained_hardened_clay', 3); new cWir3([8,3,4], 'NS');
    new cHighSlab([8,2,5], 'WNS'); new cWir3([8,3,5], 'wNS');
    new cHighSlab([8,2,6], 'NS'); new cWir3([8,3,6], 'NS');
    new cHighSlab([8,2,7], 'NS'); new cWir3([8,3,7], 'NS');
    new cHighSlab([8,2,8], 'WNS'); new cWir3([8,3,8], 'WNs');

    new cRedTorch([ 8,2,3], 'N');
    // not A or B or C
    for (var z = 4; z < 9; z++) {
        if (4 < z) new cHighSlab([11,2,z], 'NS');
        else       new cBlock   ([11,2,z], 'stained_hardened_clay', 3);
        new cWir3([11,3,z], 'NS');
    }
    // (A and B) or not C = not A or not B or not C
    new cRedTorch([11,2,3], 'N');
    for (var z = 4; z < 8; z++) {
        if (4 < z) new cHighSlab([13,2,z], 'NS');
        else       new cBlock   ([13,2,z], 'stained_hardened_clay', 3);
        new cWir3([13,3,z], 'NS');
    }
    new cRedTorch([13,2,3], 'N');
    // Q = A xor B xor C = or van bovenstaande
    for (var x = 4; x < 14; x++) {
        new cBlock([x,1,2], 'stained_hardened_clay', 3);
        var lDir = (x == 4) ? 'ES' : (x == 8) ? 'WENS' : (x == 11) ? 'WES' : (x == 13) ? 'WS' : 'WE';
        new cWir3([x,2,2], lDir);
        }
    new cBlock([8,1,1], 'stained_hardened_clay', 3);
    new cWir3 ([8,2,1],'NS');
}
function FullAdderOutlineQ() {
    var xQbase = [4,8,11,13];
    var zQend  = [8, 9,9, 8];
    for (var i = 0; i < xQbase.length; i++) {
        x = xQbase[i];
        for (var z = 4; z < zQend[i]; z++) {
            new cBlock([x,0,z], 'stained_hardened_clay', 3);
    }}
    for (var x = 4; x < 14; x++) {new cBlock([x,0,2], 'stained_hardened_clay', 3); }
    new cBlock([8,0,1], 'stained_hardened_clay', 3);
}
function FullAdderOutline(pUnitName) {
    lFAoutline = new cUnit(pUnitName + 'ol', gBlocks.length);
    FullAdderOutlineA();
    FullAdderOutlineB();
    FullAdderOutlineCinput();
    FullAdderOutlineCoutput();
    FullAdderOutlineQ();
    lFAoutline.SetIndexLastBlock(gBlocks.length);
    lFAoutline.Move ([ 0, 1, 0]);
}
function FullAdderUnit(pUnitName) {
    lFA = new cUnit(pUnitName, gBlocks.length);
    FullAdderInputA();
    FullAdderInputB();
    // FullAdderInputC();
    // FullAdderOutputC();
    FullAdderOutputQ();
    lFA.SetIndexLastBlock(gBlocks.length);
    return lFA;
}
function FullAdderInit(pUnitName) {
    FullAdderOutline();
    lFA0  = FullAdderUnit('FA0');
    // lFA1  = FullAdderUnit('FA1');
    lFA0.Move ([ 0, 1, 0]);
    // lFA1.Move ([ 0, 5, 0]);
}
function FullAdderSignals() {
    gBlocks = [];
    gSignals = [];
    lPulsars = PulseUnit('P', 5, 5, 2);
    FullAdderInit('FA');
    SetSignalsToShow('P.Q0');
    // SetSignalsToShow('FA.A','FA.B','FA.C');
    // SetSignalsToShow('P.Q0', 'FA.A', 'FA.Ablock', 'FA.Aa', 'FA.Ab', 'FA.Ac', 'FA.Ad');
    // SetSignalsToShow('P.Q1', 'FA.B', 'FA.Bblock', 'FA.Ba', 'FA.Bb', 'FA.Bc', 'FA.Bd');
    // SetSignalsToShow('P.Q2', 'FA.C', 'FA.Cblock', 'FA.Ca', 'FA.Cb', 'FA.Cc', 'FA.Cd');
    // SetSignalsToShow('P.Q2', 'FA.Co', '003003012', 'FA.(A|B).C');
    Signaal('FA');
}
// ========================================================================== //
function DoorInit() {
    gBlocks = [];
    gSignals = [];
    PhaseClockInit(2);
    lDoor = new cUnit('Door', gBlocks.length);
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
function LongInit() {
    gBlocks = [];
    gSignals = [];
    lCK  = ClockUnit('CK', 4);
    lCK.Move([0,1,0])
    new cWir2([0,0,3], '0', '')
    new cRedTorch([ 0,1,4], 'U', 'T.1', '0')
    new cRedTorch([ 3,1,3], 'U', 'T.2', '0')
    new cRedTorch([16,1,3], 'U', 'T.3', ['CK'])
    for (var x = 1; x < 16; x++) {
        new cWir2([x,1,4], '', (x == 3) ? 'WEN' : 'WE')
    }
    new cWir2([16,1,4], '', 'WN')
}
function LongSignals() {
    LongInit();
    SetSignalsToShow('CK', 'T.1', 'T.2', 'T.3'
    ,'001001004'
    ,'005001004'
    ,'007001004'
    ,'009001004'
    ,'010001004'
    ,'012001004'
    ,'014001004'
    ,'015001004'
    ,'016001004'
    // ,'017001001'
    // ,'018001001'
    // ,'019001001'
    );
    Signaal();
}
// ========================================================================== //
function DebugChanged() { InitSignals(); }
// ========================================================================== //
function Signaal(pSchakeling) {
    setCookie('Schakeling', pSchakeling, 365);
    DebugClear();
    initCanvasses();
    for (var i = 0; i < gSignals.length; i++) { gSignals[i].SetSignalName();}
    for (var i = 0; i < gSignals.length; i++) { gSignals[i].SetSources();   }
    if (document.getElementById("debugon").checked)
        for (var i = 0; i < gSignals.length; i++) { gSignals[i].Debug();}
    var lRow = 1;
    for (var i = 0; i < gSigShow.length ; i++) { gSigShow[i].DrawName(lRow); lRow++; }

    for (var y = 1; y < gLayerCanvasses.length - 1; y++) {
        for (var i = 0; i < gBlocks.length ; i++) { gBlocks[i].DrawBlock(y, gLayerCanvasses[y]);}
        for (var i = 0; i < gBlocks.length ; i++) { gBlocks[i].DrawBlock(y, gLayerCanvasses[0]);}
        for (var i = 0; i < gBlocks.length ; i++) { gBlocks[i].DrawBlock(gLayerCanvasses.length - 1 - y, gLayerCanvasses[gLayerCanvasses.length - 1]);}
    }

    for (t = 0; t < 170; t++) {
        var lRow = 1;
        if (t == 14 && SignalIndex('LR' ) > 0) { gSignals[SignalIndex('LR')].SetPower(gMaxPower);}

        for (var i = 0; i < gSignals.length; i++) { if (gSignals[i].Distance == gMaxPower) { gSignals[i].Tick();}}
        for (var i = 0; i < gSignals.length; i++) { if (gSignals[i].Distance != gMaxPower) { gSignals[i].SetPower(0);     }}
        for (var distance = gMaxPower - 1; distance >= 0; distance--) {
        for (var i = 0; i < gSignals.length; i++) { if (gSignals[i].Distance != gMaxPower) { gSignals[i].Block.SetInput(t);}}}
        for (var i = 0; i < gSignals.length; i++) { if (gSignals[i].Distance == gMaxPower) { gSignals[i].Block.SetInput(t);}}
        for (var i = 0; i < gSigShow.length; i++) { lRow = gSigShow[i].DrawSignal(t,lRow);}
        for (var i = 0; i < gSigShow.length; i++) { lRow = gSigShow[i].UpdateLastDraw();}
    }
}
function InitSignals() {
    // initSignalCanvas();
    // initLayerCanvas('Bovenaanzicht');
    // initLayerCanvas('Onderaanzicht');
    // for (var i = 1; i <= 8; i++) { initLayerCanvas('Laag-' + i); }
    var lSchakeling = getCookie('Schakeling');
    switch (lSchakeling) {
        case 'CK': ClockSignals();                  break;
        case 'CY': CarrySignals();                  break;
        case 'FA': FullAdderSignals();              break;
        case 'FF': FlipFlopSignals();               break;
        case 'IC': InstructionClockSignals();       break;
        case 'LR': LockedRepeaterSignals();         break;
        case 'PC': ProgramCounterSignals();         break;
        case 'PH': PhaseClockSignals();             break;
        case 'SR': SetResetSignals();               break;
        default  : ClockSignals();                  break;
    }
}
