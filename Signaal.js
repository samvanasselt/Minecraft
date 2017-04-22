    var gSignalCanvas;
    var gLayerCanvasses = [];
    var gSignals = [];
    var gSigShow = [];
    var gDisplay = [];
    var gBlocksOld = [];
    var gBlocks = [];
    var gOutlines = [];
    var gLocations = [];
    var w = 8;
    var xOffset = 0;
    var yOffset = 0;
    var xScale = 20;
    var zScale = 20;
    var gMaxPower = 15;
    var gStyleWire = 'rgb(255,64,64)';
// ========================================================================== //
function cUnit(pUnitName, pIndexFirstBlock = gBlocks.length, pIndexFirstOutline = gOutlines.length) {
    var UnitName;
    var IndexFirstBlock;
    var IndexLastBlock;
    var IndexFirstOutline;
    var IndexLastOutline;
    this.UnitName          = pUnitName;
    this.IndexFirstBlock   = pIndexFirstBlock;
    this.IndexFirstOutline = pIndexFirstOutline;
}
cUnit.prototype.SetIndexLastBlock = function(pIndexLastBlock) {this.IndexLastBlock = pIndexLastBlock;}
cUnit.prototype.Finish = function() {
    this.IndexLastBlock   = gBlocks.length;
    this.IndexLastOutline = gOutlines.length;
}
cUnit.prototype.Move = function(pXYZ) {
    for (var i = this.IndexFirstBlock;   i < this.IndexLastBlock;   i++)   gBlocks[i].Location.Move(pXYZ);
    for (var i = this.IndexFirstOutline; i < this.IndexLastOutline; i++) gOutlines[i].Location.Move(pXYZ);
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
function initLocations() {
    gLocations = [];
    for (var x = 0; x < 20; x++) {
        gLocations.push([]);
        for (var y = 0; y < 20; y++) {
            gLocations[x].push([]);
            for (var z = 0; z < 20; z++) {
                gLocations[x][y].push(-1);
            }
        }
    }
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
function cOutline(pXYZ, pBlocktype, pSubtype) {
    var Location;
    var BlockInfo;
    this.Location  = new cLocation(pXYZ);
    this.BlockInfo = new cBlockInfo(pBlocktype, pSubtype);
    gOutlines.push(this);
}
cOutline.prototype.DrawOutline = function(y, ctx) {
    // if (this.Location.Y == y) {
        var lX = xScale * this.Location.X + 1;
        var lZ = zScale * this.Location.Z + 1;
        var lL = xScale - 2;
        var lW = zScale - 2;
        ctx.strokeStyle = this.BlockInfo.DrawColor().replace('0.5', '1.0');
        ctx.beginPath();
        ctx.rect(lX, lZ, lL, lW);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(192,192,192,0.5)';
        ctx.beginPath();
        ctx.rect(lX + 1, lZ + 1, lL - 2, lW - 2);
        ctx.stroke();
    // }
}
// ========================================================================== //
function cBlockInfo(pBlocktype = 'stone', pSubtype = '') {
    var ID;         // Block ID
    var Blocktype;  // Blocktype = Minecraft block name
    var Subtype;    // Subtype (orientation / color / ...) = Minecraft block damage
    //  ------------------------------------------  //
    this.Blocktype = pBlocktype;
    this.Subtype   = (typeof pSubtype == 'number') ? pSubtype.toString() : pSubtype;
    // this.Subtype   = pSubtype;
}
cBlockInfo.prototype.SetBlock = function(pLocation) {
    var lCommand = '/setblock';
    lCommand += ' ~' +  pLocation.X;
    lCommand += ' ~' + (pLocation.Y + gY); --gY;
    lCommand += ' ~' +  pLocation.Z;
    lCommand += ' '  +  this.Blocktype;
    if (this.Subtype != '') lCommand += ' '  +  this.Subtype;
    // lCommand += ' '  +  this.Subtype;
    return lCommand;
}
cBlockInfo.prototype.DrawColor = function() {
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
    return lColor;
}
cBlockInfo.prototype.DrawBlock = function(y, ctx, pLocation) {
    if (pLocation.Y == y) {
        var lX = xScale * pLocation.X;
        var lZ = zScale * pLocation.Z;
        var lL = xScale;
        var lW = zScale;
        ctx.fillStyle = this.DrawColor();
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
    var lStyle = (this.Power[0] == 0) ? 'rgb(0,0,' : 'rgb(128,0,';
    lStyle = (this.Power[0] == 0) ? 'rgb(0,0,' :'rgb(' + (this.Power[0] * 8 + 128) + ',0,';
    lStyle += (pRow % 2 == 0) ? '128)' : '0)';
    gSignalCanvas.strokeStyle = lStyle;
    // gSignalCanvas.strokeStyle = (pRow % 2 == 0) ? 'rgb(0,0,128)' : 'rgb(0,0,0)';
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
    lBlockInfo = this.Block.BlockInfo.Blocktype;
    if (this.Block.BlockInfo.Subtype != '') lBlockInfo += ' - ' + this.Block.BlockInfo.Subtype;
    lHTML += FixLength(lBlockInfo, 20);
    lHTML += ' (' + FixLength(this.Block.Location.X, 2);
    lHTML += ',' + FixLength(this.Block.Location.Y, 2);
    lHTML += ',' + FixLength(this.Block.Location.Z, 2) + ') ';
    // lHTML += FixLength(this.Block.BlockInfo.SetBlock(this.Block.Location), 40) + ' | ';
    lHTML += FixLength(this.SignalName.trim(), 10);
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
function cBloc2(pXYZ, pSignalName, pSourceDirections = 'WENS', pDestinDirections = '') {
    lBlock = new cBlock(pXYZ, 'sandstone', 0, 'Dir');
    lBlock.SetDirections( pSourceDirections, pDestinDirections);
    if (pSignalName != '') lBlock.PowerInfo.SignalName = pSignalName;
    for (var i = 0; i < pDestinDirections.length; i++) {
        if (lBlock.DestinDirections.indexOf(pDestinDirections[i]) < 0)
            lBlock.DestinDirections.push(pDestinDirections[i]);
    }
}
function cBloc3(pXYZ, pSourceDirections = 'WENS', pDestinDirections = '', pSignalName = '') {
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
    var l = this.Location;
    if (pError != '') { lHTML += '<br/><b>' + pError + '</b>'; }
    lHTML += '<br/>xxx' + this.Signal;
    lHTML += ' | ' + this.Blocktype + this.Subtype;
    lHTML += ' |(' + l.X + ',' + l.Y + ',' + l.Z + ')';
    lHTML += '| ' + this.BlockInfo.Blocktype;
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
    lWire = new cWire(pXYZ, pSourceDirections, 'redstone_wire', '', 'Dir');
    if (pSignalName != '') lWire.PowerInfo.SignalName = pSignalName;
    for (var i = 0; i < pDestinDirections.length; i++) {
        if (lWire.DestinDirections.indexOf(pDestinDirections[i]) < 0)
            lWire.DestinDirections.push(pDestinDirections[i]);
    }
}
// ========================================================================== //
function cWire(pXYZ, pDirectionString = 'wensdWENSUMFHZ', pBlocktype = 'wire', pSubtype = '', pSignalName = 'Auto', pSignalSourceNames = '') {
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
            var lSize = 1;
            switch(this.SourceDirections[dir]) {
                case 'w': lSize = 1; break; case 'W': lSize = 2; break; case 'M': lSize = 3; break;
                case 'e': lSize = 1; break; case 'E': lSize = 2; break; case 'F': lSize = 3; break;
                case 'n': lSize = 1; break; case 'N': lSize = 2; break; case 'H': lSize = 3; break;
                case 's': lSize = 1; break; case 'S': lSize = 2; break; case 'Z': lSize = 3; break;
                case 'd': lSize = 1; break;                             case 'U': lSize = 3; break;
                default : lSize = 1; alert('Onbekende richting ' + this.SourceDirections[dir] + ' voor cWire'); break;
            }

            var apex1 = rotate(this.SourceDirections[dir],[3,+lSize])
            var apex2 = rotate(this.SourceDirections[dir],[3,-lSize])
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
function DoorInit() {
    gBlocks = [];
    gSignals = [];
    lPulsars = PulseUnit('P', 2, 40, 2);
    lDoor = new cUnit('Door', gBlocks.length);
    new cWir3    ([0,1,0], 'ES');
    for (var i=1; i<5; i++) new cWir3([i,1,0], 'EW');
    new cWir3    ([5,1,0], 'WS');

    new cWir3    ([0,2,1], 'EN');
    new cBlock   ([2,3,1], 'sandstone', 0, 'Door.R');
    new cBlock   ([3,3,1], 'sandstone', 0, 'Door.L');
    new cWir3    ([4,3,1], 'EW');
    new cWir3    ([5,2,1], 'WNS');
    //  Button blocks and signals
    new cBlock   ([1,4,1], 'sandstone', 0, 'Knop.R', ['P.Q1']);
    new cWir3    ([1,3,1], 'EWU');

    new cBlock   ([4,4,1], 'sandstone', 0, 'Knop.L', ['P.Q0']);
    //  Pressure plates
    new cBlock   ([2,3,2], 'sandstone', 0, 'Plate.L', ['P.R1']); //  Blocks under pressure plate
    new cBlock   ([3,3,2], 'sandstone', 0, 'Plate.R', ['P.R0']);
    new cWir3    ([2,2,2], 'EW');       //  Wires under pressure plate blocks
    new cWir3    ([3,2,2], 'EWS');
    new cBlock   ([2,1,2], 'sandstone', 0);
    //  Set / Reset unit
    new cBlock   ([3,1,2], 'sandstone', 0);
    new cRedTorch([4,1,2], 'E'  , '006002003', ['P.Q0']);
    new cWir3    ([5,1,2], 'WNS');
    new cWir3    ([5,1,3], 'NS');
    new cBlock   ([5,1,4], 'sandstone', 0);
    new cRedTorch([4,1,4], 'W'  , '006002003', ['P.R0']);
    new cWir3    ([3,1,4], 'EN');
    new cWir3    ([3,1,3], 'NS');
    //
    lDoor.SetIndexLastBlock(gBlocks.length);
}
function DoorSignals() {
    DoorInit();
    SetSignalsToShow
    ( 'P.Q0', 'P.R0', 'Knop.L', 'Knop.R'
    // , '000002000', '005002003'
    );
    Signaal('DR');
}
// ========================================================================== //
function LongInit() {
    gBlocks = [];
    gSignals = [];
    tCK  = TclockUnit('TCK', 5, 5);
    tCK.Move([0,1,0]);
    new cWir2([0,0,3], '0', '');
    new cRedTorch([ 0,1,4], 'U', 'T.1', ['TCK.F0']);
    new cRedTorch([ 3,1,3], 'U', 'T.2', ['TCK.F1']);
    new cRedTorch([16,1,3], 'U', 'T.3', ['TCK.F2']);
    for (var x = 1; x < 16; x++) {
        new cWir2([x,1,4], '', (x == 3) ? 'WEN' : 'WE');
    }
    new cWir2([16,1,4], '', 'WN');
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
    Signaal('LG');
}
// ========================================================================== //
function BnRegisterInit(pBitnr) {
    function Bf0dn(pBitnr) {
        lDir313 = (pBitnr == 0) ? 'Ws' : 'Wn';
        lBd = (pBitnr == 0) ? 'B.d' : 'B.-d';
        new cHighSlab([ 1,0, 3],'ENS');
        new cHighSlab([ 2,0, 3],'WE');
        new cRepeater([ 0,0, 0],'E', 1, 'B.d' + pBitnr, ['-TCK.F1']);
        if (pBitnr == 0) {
            new     cWir3([1,0,0], 'WS');
            new     cWir3([1,0,1], 'N', 'S');
            new     cWir3([1,0,2], 'NS');
        } else {
            new    cBloc2([ 1,0, 0],'', 'W');
            new cRedTorch([ 1,0, 1],'S');  NameLastSignal('B.-d1');
            new     cWir3([ 1,0, 2],'N', 'S');
        }
        new cRepeater([ 1,0, 5],'N', 1, 'B.f0', ['-TCK.F2']);
        new     cWir3([ 1,0, 4],'S','N');
        new     cWir3([ 1,1, 3],'nsE'); NameLastSignal(lBd + pBitnr + '+f0');
        new     cWir3([ 2,1, 3],'WE');
        new     cWir3([ 3,1, 3],lDir313);
        new    cBloc3([ 3,0, 3],'U');
        if (pBitnr == 0) { new cRedTorch([3,0,2], 'N'); new cWir3([3,0,4], 'HE'); }
        else             { new cRedTorch([3,0,4], 'S'); new cWir3([3,0,2], 'ZN'); }
        new     cWir3([ 3,0, 1],'NS');
        // new     cWir3([ 3,0, 2],'NS');
        new     cWir3([ 3,0, 0],'ES');
        new     cWir3([ 4,0, 0],'WE');
        new     cWir3([ 5,0, 0],'WE');
        new     cWir3([ 6,0, 0],'W', 'E');

        new     cWir3([ 4,0, 4],'WE');
        new     cWir3([ 5,0, 4],'WE');
        new     cWir3([ 6,0, 4],'WE');
        new     cWir3([ 7,0, 4],'W' ,'E');
    }
    function Bf1(pBitnr) {
        new cHighSlab([ 6,1, 3],'NS');
        new cHighSlab([ 6,1, 4],'NS');
        new cHighSlab([ 6,1, 5],'Ns');
        new cHighSlab([ 6,2, 6],'nZ');
        new cHighSlab([ 6,0, 6],'Ns');
        new cHighSlab([ 6,3, 7],'n');
        new cHighSlab([ 6,3, 7],'n');
        new    cBlock([ 6,1, 2],'sandstone',0);
        if (pBitnr == 0) { new cRepeater([6,0,8],'N',1,'B.f1-in',['-TCK.F3']); }
        if (pBitnr == 0) { new cWir3([ 6,0, 7],'S','N'); }
        else             { new cWir3([ 6,0, 7],'n'); }
        new     cWir3([ 6,1, 6],'s','N');
        new     cWir3([ 6,2, 5],'s','N'); NameLastSignal('B.f1(' + pBitnr + ')');
        new cRepeater([ 6,2, 4],'N',1);
        new     cWir3([ 6,2, 3],'NS');
        new     cWir3([ 6,2, 2],'eS');
        new     cWir3([ 7,1, 2],'Mn');
        new    cBloc3([ 7,0, 2],'U');
        new     cWir3([ 7,0, 1],'Z' ,'N');
        new cRedTorch([ 8,0, 2],'E'); NameLastSignal('B.-f1(' + pBitnr + ')');
        new     cWir3([ 8,0, 3],'N','S');
        new     cWir3([ 6,3, 6],'n','Z');
    }
    function Bf1f0dn(pBitnr) {
        var not_dn_or_f0_or_f1  = 'B.-d' + pBitnr + 'f0|f1';
        var dn_or_f0_and_not_f1 = 'B.d'  + pBitnr + 'f0.-f1';
        var dn_or_f0_or_not_f1  = 'B.d'  + pBitnr + 'f0|-f1';
        var not_dn_or_f0_and_f1 = 'B.-d' + pBitnr + 'f0.f1';
        var Qn = 'B.Q' + pBitnr
        new cHighSlab([ 7,0, 0],'WES');
        new cHighSlab([ 8,0, 0],'WE');
        new cHighSlab([ 8,0, 4],'WEN');
        new     cWir3([ 7,1, 0],'ws','E');
        new     cWir3([ 8,1, 0],'WE');
        new     cWir3([ 8,1, 4],'wEn');
        new    cBloc3([ 9,0, 0],'U', '', not_dn_or_f0_or_f1);
        new    cBloc3([ 9,0, 4],'U', '', dn_or_f0_or_not_f1);
        new     cWir3([ 9,1, 0],'W');
        new     cWir3([ 9,1, 4],'W');
        new cRedTorch([10,0, 0],'E'  ); NameLastSignal(dn_or_f0_and_not_f1);
        new     cWir3([10,0, 1],'NS' );
        new     cWir3([10,0, 2],'NSE'); NameLastSignal(Qn);
        new     cWir3([10,0, 3],'NS' );
        new cRedTorch([10,0, 4],'E'  ); NameLastSignal(not_dn_or_f0_and_f1);
    }
    lBn = new cUnit('B'+pBitnr);
    Bf0dn(pBitnr);
    Bf1(pBitnr);
    Bf1f0dn(pBitnr);
    lBn.SetIndexLastBlock(gBlocks.length);
    return lBn;
}
function BRegisterSignals() {
    gBlocks = [];
    gSignals = [];
    tCK  = TclockUnit('TCK', 5, 5);
    lB0 = BnRegisterInit(0);     lB0.Move([0,1,0]);
    lB1 = BnRegisterInit(1);     lB1.Move([0,5,0]);
    lB2 = BnRegisterInit(2);     lB2.Move([0,9,0]);
    // SetSignalsToShow('B.f0', 'B.f1', 'B.d0', 'B.Q0', 'B.d1', 'B.Q1');
    SetSignalsToShow
    ('B.f0', 'B.f1', 'B.d1','B.f1-in'
    ,'B.f1(0)','B.f1(1)','B.f1(2)'
    ,'B.-f1(0)','B.-f1(1)','B.-f1(2)'
    , 'B.Q0', 'B.Q1', 'B.Q2'
    );
    Signaal('B');
}
// =========================================================================== //
function VulSupportBlocks() {
    var lNeedsSupport = false;
    for (var i = 0; i < gBlocks.length; i++) {
        var l = gBlocks[i].Location;
        if (l.Y >= 0) gLocations[l.X][l.Y][l.Z] = i;
    }
    var nBlocks = gBlocks.length;
    for (var i = 0; i < nBlocks; i++) {
        var l = gBlocks[i].Location;
        if (l.Y > 0) {
            lNeedsSupport  = gBlocks[i].BlockInfo.Blocktype == 'repeater';
            lNeedsSupport |= gBlocks[i].BlockInfo.Blocktype == 'redstone_wire';
            if (lNeedsSupport) if (gLocations[l.X][l.Y-1][l.Z] < 0) {
                new cBlock([l.X,l.Y-1,l.Z], 'sandstone', '0');
            }
        }
    }
}
// =========================================================================== //
function VulCommand() {
    var lInfo = '';
    var cmd = '';
    for (var y = 0; y <= 16; y++) for (var i = 0; i < gBlocks.length; i++) if (gBlocks[i].Location.Y == y) {
        lInfo  = 'id:'     + 'FallingSand';
        lInfo += ',Block:' + 'chain_command_block';
        lInfo += ',Time:'  + '1';
        lInfo += ',Data:'  + '1';
        lInfo += ',TileEntityData:{Command:' + gBlocks[i].BlockInfo.SetBlock(gBlocks[i].Location) + '}';
        cmd += ',Passengers:[{' + lInfo;
    }
    for (var i = 0; i < gBlocks.length; i++) if (gBlocks[i].Location.Y >= 0) cmd += '}]';
    var lSummon = '/summon FallingSand ~2 ~1 ~1 ';
    lSummon += '{Block:command_block,Time:1,Data:1';
    lSummon += cmd;
    lSummon += '}';
    document.getElementById("command").innerHTML = '<code>' + lSummon + '</code>';
}
// ========================================================================== //
function DebugChanged(pSchakeling = '') { InitSignals(pSchakeling); }
// ========================================================================== //
function SchakelingNaam(pSchakeling) {
    switch (pSchakeling) {
        case 'B' : return 'B-register';
        case 'CK': return 'CK Clock';
        case 'CY': return 'CY Carry';
        case 'DR': return 'DR Door';
        case 'FA': return 'FA Full Adder';
        case 'FF': return 'FF FlipFlop';
        case 'IC': return 'IC Instruction Clock';
        case 'LG': return 'LG Long';
        case 'LR': return 'LR Locked Repeater';
        case 'PC': return 'PC Program Counter';
        case 'PH': return 'PH Phase Clock';
        case 'P2': return 'P2 Phase Clock II';
        case 'SR': return 'SR Set/Reset';
        default  : return '??';
    }
}
function Signaal(pSchakeling) {
    gY = 0;
    setCookie('Schakeling', pSchakeling, 365);
    DebugClear();
    initCanvasses();
    initLocations();
    document.getElementById("schakelingnaam").innerHTML = SchakelingNaam(pSchakeling);
    for (var i = 0; i < gSignals.length; i++) { gSignals[i].SetSignalName();}
    for (var i = 0; i < gSignals.length; i++) { gSignals[i].SetSources();   }
    if (document.getElementById("debugon").checked)
        for (var i = 0; i < gSignals.length; i++) { gSignals[i].Debug();}
    VulSupportBlocks();
    VulCommand();
    var lRow = 1;
    for (var i = 0; i < gSigShow.length ; i++) { gSigShow[i].DrawName(lRow); lRow++; }
    for (var i = 0; i < gOutlines.length ; i++) {
        for (var y = 0; y < gLayerCanvasses.length; y++) {
            gOutlines[i].DrawOutline(y, gLayerCanvasses[y]);
    }}
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
function InitSignals(pSchakeling = '') {
    // initSignalCanvas();
    // initLayerCanvas('Bovenaanzicht');
    // initLayerCanvas('Onderaanzicht');
    // for (var i = 1; i <= 8; i++) { initLayerCanvas('Laag-' + i); }
    var lSchakeling = (pSchakeling == '') ? getCookie('Schakeling') : pSchakeling;
    switch (lSchakeling) {
        case 'B' : BRegisterSignals();              break;
        case 'CK': ClockSignals();                  break;
        case 'CY': CarrySignals();                  break;
        case 'DR': DoorSignals();                   break;
        case 'FA': FullAdderSignals();              break;
        case 'FF': FlipFlopSignals();               break;
        case 'IC': InstructionClockSignals();       break;
        case 'LG': LongSignals();                   break;
        case 'LR': LockedRepeaterSignals();         break;
        case 'PC': ProgramCounterSignals();         break;
        case 'PH': PhaseClockSignals();             break;
        case 'P2': PhaseClock2Signals();            break;
        case 'SR': SetResetSignals();               break;
        default  : ClockSignals();                  break;
    }
}
