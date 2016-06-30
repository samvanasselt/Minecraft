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
    var gStyleWire = 'rgb(255,64,64)';
// ========================================================================== //
function initSignalCanvas() {
    var canvas = document.getElementById('canvasSignaal');
    if (canvas.getContext){
        gSignalCanvas = canvas.getContext('2d');
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
        ctx.font="3px Verdana";
        ctx.strokeStyle = 'rgb(199,199,199)';
        ctx.fillStyle = "rgb(207,207,207)";
        ctx.translate(0.5, 0.5);
        try { for (var z = 0; z < 20*zScale; z += zScale) {
            for (var x = 0; x < 20*xScale; x += 2 * xScale) {
                dx = z % (2 * zScale);
                // ctx.fillRect (x + dx,z,xScale,zScale);
                ctx.beginPath(); ctx.rect(x,z,xScale,zScale);          ctx.stroke();
                ctx.beginPath(); ctx.rect(x + xScale,z,xScale,zScale); ctx.stroke();
                ctx.beginPath(); ctx.rect(x + dx,z,xScale,zScale);     ctx.stroke();
        }}}   
        catch(err) { alert(err);}
        gLayerCanvasses.push(ctx);
    }
}
// ========================================================================== //
function ShowError(pHTML) {
     document.getElementById("foutmelding").innerHTML += pHTML;
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
cBlockInfo.prototype.CommandTerm = function () { return (this.Subtype == '' ? this.Blocktype : this.Blocktype + this.Subtype) }
cBlockInfo.prototype.DrawBlock = function (pLocation) {
    switch(this.Blocktype) {
        case 'stained_hardened_clay': switch(this.Subtype) {
            case  3: lColor = 'rgb(128,128,255)'; break;
            case  4: lColor = 'rgb(255,255,128)'; break;
            case 14: lColor = 'rgb(255,160,128)'; break;
        } break;
        case 'stone_slab': switch(this.Subtype) {
            case  3: lColor = 'rgb(128,128,255)'; break;
            case  8: lColor = 'rgb(160,160,160)'; break;
            case 10: lColor = 'rgb(255,160,128)'; break;
        } break;
        case 'stone_slab2': switch(this.Subtype) {
            case  8: lColor = 'rgb(255,192,128)'; break;
        } break;
        case 'planks': switch(this.Subtype) {
            case  4: lColor = 'rgb(255,207,128)'; break;
        } break;
        case 'wooden_slab': switch(this.Subtype) {
            case 12: lColor = 'rgb(255,207,128)'; break;
        } break;
        case 'sandstone': switch(this.Subtype) {
            case  0: lColor = 'rgb(255,255,128)'; break;
        } break;
        case 'red_sandstone': switch(this.Subtype) {
            case  0: lColor = 'rgb(255,192,128)'; break;
            case  8: lColor = 'rgb(128,128,128)'; break;
            case 10: lColor = 'rgb(255,192,128)'; break;
        } break;
    }
    if (0 < pLocation.Y && pLocation.Y < 5) {
        var lX = xScale * pLocation.X;
        var lZ = zScale * pLocation.Z;
        var lL = xScale;
        var lW = zScale;
        var y = [pLocation.Y - 1, 4];        
        for (var i = 0; i < y.length; i++) {
            gLayerCanvasses[y[i]].fillStyle = lColor;
            gLayerCanvasses[y[i]].fillRect(lX, lZ, lL, lW);
            gLayerCanvasses[y[i]].strokeStyle = 'rgb(128,128,128)';
            gLayerCanvasses[y[i]].rect(lX, lZ, lL, lW);
            gLayerCanvasses[y[i]].stroke();
        }
    }   
}
// ========================================================================== //
function cPowerInfo(pBlock, pInitialPower = 0, pDelay = 0, pSignalName = undefined, pSourceNames = undefined) {
    var Block;      //  The block whose power info this is
    var SignalName;
    var SourceNames = [];
    var Sources = [];
    var Power = [];
    var PowerLastDraw;
    //  ------------------- //
    this.Block       = pBlock;
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
    for (var i = 0; i < this.SourceNames.length; i++) {
        var lIndex = SignalIndex(this.SourceNames[i]);
        if (lIndex < 0) { ShowError('Geen component ' + this.SourceNames[i]); }
        else            { this.Sources[i] = gSignals[lIndex].Block; }
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
    for (var i = 0; i < this.Power.length; i++) {this.Power[i] = this.Power[i+1];}
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
// -------------------------------  //
function SignalIndex (pSignalName) {
    var lIndex = -1;
    var i = 0;
    while (lIndex == -1 && i < gSignals.length) {
        if (gSignals[i].SignalName == pSignalName) {lIndex = i;}
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
cLocation.prototype.SetLocation = function (pXYZ = [0,0,0]) {
    this.X = pXYZ[0]; this.PK  = ("000" + this.X).substr(-3,3);    
    this.Y = pXYZ[1]; this.PK += ("000" + this.Y).substr(-3,3);    
    this.Z = pXYZ[2]; this.PK += ("000" + this.Z).substr(-3,3);    
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
cBlock.prototype.SetInput = function () { this.PowerInfo.SetInput(); }
cBlock.prototype.DrawBlock = function () {
    switch(this.BlockInfo.Blocktype) {
        case 'stained_hardened_clay': switch(this.BlockInfo.Subtype) {
            case  3: lColor = 'rgb(128,128,255)'; break;
            case  4: lColor = 'rgb(255,255,128)'; break;
            case 14: lColor = 'rgb(255,160,128)'; break;
        } break;
        case 'stone_slab': switch(this.BlockInfo.Subtype) {
            case  3: lColor = 'rgb(128,128,255)'; break;
            case  8: lColor = 'rgb(160,160,160)'; break;
            case 10: lColor = 'rgb(255,160,128)'; break;
        } break;
        case 'stone_slab2': switch(this.BlockInfo.Subtype) {
            case  8: lColor = 'rgb(255,192,128)'; break;
        } break;
        case 'planks': switch(this.BlockInfo.Subtype) {
            case  4: lColor = 'rgb(255,207,128)'; break;
        } break;
        case 'wooden_slab': switch(this.BlockInfo.Subtype) {
            case 12: lColor = 'rgb(255,207,128)'; break;
        } break;
        case 'sandstone': switch(this.BlockInfo.Subtype) {
            case  0: lColor = 'rgb(255,255,128)'; break;
        } break;
        case 'red_sandstone': switch(this.BlockInfo.Subtype) {
            case  0: lColor = 'rgb(255,192,128)'; break;
            case  8: lColor = 'rgb(128,128,128)'; break;
            case 10: lColor = 'rgb(255,192,128)'; break;
        } break;
    }
    if (0 < this.Location.Y && this.Location.Y < 5) {
        var lX = xScale * this.Location.X;
        var lZ = zScale * this.Location.Z;
        var lL = xScale;
        var lW = zScale;
        var y = [this.Location.Y-1, 4];        
        for (var i = 0; i < y.length; i++) {
            gLayerCanvasses[y[i]].fillStyle = lColor;
            gLayerCanvasses[y[i]].fillRect(lX, lZ, lL, lW);
            gLayerCanvasses[y[i]].strokeStyle = 'rgb(128,128,128)';
            gLayerCanvasses[y[i]].rect(lX, lZ, lL, lW);
            gLayerCanvasses[y[i]].stroke();
        }
    }   
}
// ========================================================================== //
function cSignalBlock(pOrientation = 'E', pXYZ, pBlocktype = 'stone', pSubtype = '', pSignal = '', pSourceNames = '', pDelay = 0, pPower = 0) {
    var PK;         // Primary Key = #XXYYZZ
    var Blocktype;      // Blocktype
    var Subtype;       // Subtype (damage)
    var X,Y,Z;      // Location
    var Orientation;
    var Signal;
    var Delay;
    var Power = [];
    var PowerLastDraw;
    var SourceNames = [];
    var Sources = [];
    var Display;    // ### Obsolete ### //
    this.Blocktype = pBlocktype;         this.Subtype  = pSubtype;
    this.Orientation = pOrientation; 
    this.SetLocation(pXYZ); 
    this.Signal = pSignal;       this.SourceNames = (pSourceNames == undefined) ? [] : pSourceNames;
    this.Display = false;        // ### Obsolete ### //
    this.Reset(pDelay, pPower);
}
cSignalBlock.prototype.SetLocation = function (pXYZ = [0,0,0]) {
    this.X = pXYZ[0]; this.PK  = "x" + ("00" + this.X).substr(-2,2);    
    this.Y = pXYZ[1]; this.PK += "y" + ("00" + this.Y).substr(-2,2);    
    this.Z = pXYZ[2]; this.PK += "z" + ("00" + this.Z).substr(-2,2);    
}
cSignalBlock.prototype.DrawBlock = function () {
    if (0 < this.Y && this.Y < 5) {
        var lColor = 'rgb(64,64,64)';
        var lX = xScale * this.X;
        var lZ = zScale * this.Z;
        var lL = xScale;
        var lW = zScale;
        var y = [this.Y-1, 4];        
        for (var i = 0; i < y.length; i++) {
            gLayerCanvasses[y[i]].strokeStyle = 'rgb(128,128,128)';
            gLayerCanvasses[y[i]].rect(lX, lZ, lL, lW);
            gLayerCanvasses[y[i]].stroke();
        }
        lX += 1; lZ += 1; lL -= 2; lW -= 2;
             if (this.Blocktype == 'repeater'          ) { lColor = 'rgb(255,128,128)'; lX += 1; lZ += 1; lL -= 2; lW -= 2;}
        else if (this.Blocktype == 'redstone_torch'    ) { lColor = 'rgb(255, 64, 64)'; lX += 2; lZ += 2; lL -= 4; lW -= 4;}
        switch(this.Blocktype) {
            case 'stained_hardened_clay': switch(this.Subtype) {
                case  3: lColor = 'rgb(128,128,255)'; break;
                case  4: lColor = 'rgb(255,255,128)'; break;
                case 14: lColor = 'rgb(255,160,128)'; break;
            } break;
            case 'stone_slab': switch(this.Subtype) {
                case  3: lColor = 'rgb(128,128,255)'; break;
                case  8: lColor = 'rgb(160,160,160)'; break;
                case 10: lColor = 'rgb(255,160,128)'; break;
            } break;
            case 'stone_slab2': switch(this.Subtype) {
                case  8: lColor = 'rgb(255,192,128)'; break;
            } break;
            case 'planks': switch(this.Subtype) {
                case  4: lColor = 'rgb(255,207,128)'; break;
            } break;
            case 'wooden_slab': switch(this.Subtype) {
                case 12: lColor = 'rgb(255,207,128)'; break;
            } break;
            case 'sandstone': switch(this.Subtype) {
                case  0: lColor = 'rgb(255,255,128)'; break;
            } break;
            case 'red_sandstone': switch(this.Subtype) {
                case  0: lColor = 'rgb(255,192,128)'; break;
                case  8: lColor = 'rgb(128,128,128)'; break;
                case 10: lColor = 'rgb(255,192,128)'; break;
            } break;
            case 'redstone_wire': lColor = 'rgb(255,128,128)'; break;
        }
        gLayerCanvasses[this.Y-1].fillStyle = lColor;
        if (this.Blocktype == 'redstone_wire') {gLayerCanvasses[this.Y-1].fillRect(lX+3, lZ+3, lL-6, lW-6);}
        else                               {gLayerCanvasses[this.Y-1].fillRect(lX, lZ, lL, lW);}
        gLayerCanvasses[4].fillStyle = lColor;
        if (this.Blocktype == 'redstone_wire') {gLayerCanvasses[4].fillRect(lX+3, lZ+3, lL-6, lW-6);}
        else                               {gLayerCanvasses[4].fillRect(lX, lZ, lL, lW);}
    }   
}
cSignalBlock.prototype.Reset = function (pDelay = 0, pPower = 0) {
    this.Delay = pDelay;
    this.Power = [];
    this.PowerLastDraw = pPower;
    for (var i = 0; i <= this.Delay; i++) {this.Power.push(pPower);}
}
cSignalBlock.prototype.SetSources = function () {
    var args = Array.from(arguments);
    this.Sources = [];
    if (args.length > 0) {
        this.SourceNames = [];
        for (var i = 0; i < args.length; i++) { this.SourceNames.push(args[i]); }
    }
    for (var i = 0; i < this.SourceNames.length; i++) {
        var lIndex = ComponentIndex(this.SourceNames[i]);
        if (lIndex < 0) { ShowError('Geen component ' + this.SourceNames[i]); }
        else            { this.Sources.push(gComponents[lIndex]); }
    }
}
cSignalBlock.prototype.SetInput = function () {
    if (this.Sources.length == 0) { this.Power[this.Delay] = 0;                        }
    else                          { this.Power[this.Delay] = this.Sources[0].Power[0]; }
}
cSignalBlock.prototype.Tick = function () {
    for (var i = 0; i < this.Delay; i++) {this.Power[i] = this.Power[i+1];}
}
cSignalBlock.prototype.DrawSignal = function (t, pRow) {
    if (this.Display) {
        var x = 100 + w * t;
        var y = 25 * pRow - this.Power[0];
        gSignalCanvas.strokeStyle = (pRow % 2 == 0) ? 'rgb(0,0,128)' : 'rgb(0,0,0)';
        gSignalCanvas.beginPath();
        gSignalCanvas.moveTo(x     , 25 * pRow - this.PowerLastDraw);
        gSignalCanvas.lineTo(x     , y);
        gSignalCanvas.lineTo(x + w, y);
        // gSignalCanvas.rect(100 + 10 * t, 25 * pRow - this.Power[0],10,1);
        gSignalCanvas.stroke();
        this.PowerLastDraw = this.Power[0];
        return pRow + 1;
    } else {
        return pRow;
    }
}
cSignalBlock.prototype.ToonNaam = function (pRow) {
    gSignalCanvas.fillText(this.Signal, 15, 25 * pRow);
    gSignalCanvas.fillText(this.Blocktype, 50, 25 * pRow);
}
cSignalBlock.prototype.ErrorMessage = function (pError) {
    var lHTML = '';
     if (pError != 'OK') { lHTML += '<br/><b>' + pError + '</b>'; }
     lHTML += '<br/>' + this.Signal;
     lHTML += ' | ' + this.Blocktype;
     lHTML += ' | ' + this.Delay + ' Power: ';
     for (var i = 0; i < this.Delay + 1; i++) { lHTML += ' ' + this.Power[i]; }
     lHTML += ' | ' + this.Sources.length + ' Sources: ';
     for (var i = 0; i < this.Sources.length; i++) { lHTML += ' ' + this.Sources[i].Signal; }
     ShowError(lHTML);
}
// ========================================================================== //
function cRedTorchOld(pOrientation = 'E', pXYZ = [0,0,0], pBlocktype = '', pSubtype = '', pSignal = '', pSourceNames = '') {
    if (pBlocktype == '') { this.Blocktype = 'redstone_torch'; }
    this.SetLocation(pXYZ);
    this.SetOrientation(pOrientation);
    this.Signal = pSignal;
    this.SourceNames = (pSourceNames == undefined) ? [] : pSourceNames;
    this.Reset(1, 15);
}
cRedTorchOld.prototype = new cSignalBlock();
cRedTorchOld.prototype.SetInput = function () {
    this.Power[this.Delay] = (this.Sources[0].Power[0] == 0) ? 15 :  0;
}
cRedTorchOld.prototype.SetOrientation = function (pOrientation) {
    this.Orientation = pOrientation;
         if (pOrientation == 'E' ) { this.Subtype = 1; }
    else if (pOrientation == 'W' ) { this.Subtype = 2; }
    else if (pOrientation == 'S') { this.Subtype = 3; }
    else if (pOrientation == 'N') { this.Subtype = 4; }
    else if (pOrientation == 'U'   ) { this.Subtype = 5; }
}
cRedTorchOld.prototype.DrawBlock = function () {
    var lX = xOffset + this.X * xScale + xScale/2;
    var lZ = yOffset + this.Z * zScale + zScale/2;
    if (0 < this.Y && this.Y < 5) {
        var y = [this.Y-1, 4];        
        for (var i = 0; i < y.length; i++) {
            var ctx = gLayerCanvasses[y[i]];
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
}   }   }
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
    this.PowerInfo = new cPowerInfo(this, 15, 1, pSignalName, pSignalSourceNames);
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
    p.Power[p.Power.length - 1] = (lSourcePower == 0) ? 15 :  0;
}
cRedTorch.prototype.DrawBlock = function () {
    var lX = xOffset + this.Location.X * xScale + xScale/2;
    var lZ = yOffset + this.Location.Z * zScale + zScale/2;
    if (0 < this.Location.Y && this.Location.Y < 5) {
        var y = [this.Location.Y-1, 4];        
        for (var i = 0; i < y.length; i++) {
            var ctx = gLayerCanvasses[y[i]];
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
}   }   }
// ========================================================================== //
function cInverter(pX,pY,pZ, pOrientation = 'E', pBlocktype = 'redstone_torch', pSubtype = '', pSignal = '', pSourceNames = '') {
    this.Signal = pSignal;
    this.SourceNames = (pSourceNames == undefined) ? [] : pSourceNames;
    this.Reset(1, 15);
}
// cInverter.prototype = new cSignalBlock(pX,pY,pZ,pOrientation,'redstone_torch', '',pSignal,pSourceNames,1,15);
cInverter.prototype = new cSignalBlock();
cInverter.prototype.SetInput = function () {
    this.Power[this.Delay] = (this.Sources[0].Power[0] == 0) ? 15 :  0;
}
cInverter.prototype.Dump = function () {
     var lHTML = '';
     lHTML += this.Blocktype;
     lHTML += ' ' + this.Delay;
     lHTML += ' ' + this.Timer;
     for (var i = 0; i < this.Delay + 1; i++) { lHTML += ' ' + this.Power[i]; }
     return lHTML;
}
// ========================================================================== //
function cRepeaterOld(pOrientation = 'E', pXYZ= [0,0,0], pBlocktype = '', pSubtype = '', pSignal = '', pSourceNames = '', pDelay = 1, pPower = 0) {
    if (pBlocktype == '') { this.Blocktype = 'repeater'; }
    this.Signal = pSignal;
    // this.Locked = false;
    this.SetLocation(pXYZ);
    this.SetOrientation(pOrientation);
    this.SourceNames = (pSourceNames == undefined) ? [] : pSourceNames;
    this.Reset(pDelay, pPower);
}
// cRepeaterOld.prototype = new cSignalBlock(pX,pY,pZ,pOrientation,'repeater', '',pSignal,pSourceNames,1,0);
cRepeaterOld.prototype = new cSignalBlock();
cRepeaterOld.prototype.SetOrientation = function (pOrientation) {
    this.Orientation = pOrientation;
         if (pOrientation == 'S') { this.Subtype = 0; }
    else if (pOrientation == 'E') { this.Subtype = 1; }
    else if (pOrientation == 'N') { this.Subtype = 2; }
    else if (pOrientation == 'W') { this.Subtype = 3; }
}
cRepeaterOld.prototype.SetInput = function () {
    try {
        var lLocked = false;
        for (var lLock = 1; lLock <= this.Sources.length - 1; lLock++) {
            for (var s = 0; s <= this.Sources[lLock].Delay; s++) {
                lLocked = lLocked || (this.Sources[lLock].Power[s] > 0);
            }
        }
        if (this.Sources.length > 2) { lLocked = lLocked || (this.Sources[2].Power[this.Sources[2].Delay] > 0);}
        if (this.Sources.length > 1) { lLocked = lLocked || (this.Sources[1].Power[this.Sources[1].Delay] > 0);}
        if (lLocked)     { this.Locked = lLocked; }
        // if (this.Locked) { this.Locked = lLocked; }
        else             { this.Power[this.Delay] = (this.Sources[0].Power[0] == 0) ?  0 : 15; }
    }
    catch (err) { this.ErrorMessage(err); }
}
cRepeaterOld.prototype.DrawBlock = function () {
    var lX = xOffset + this.X * xScale + xScale/2;
    var lZ = yOffset + this.Z * zScale + zScale/2;
    var  inWire = [[-xScale/2,0],[-8,0]];
    var outWire = [[ xScale/2,0],[+8,0]];
    var wires = [inWire,outWire];
    var triangle = [[-7,-8], [-7,+8], [+7, 0]];
    var dots = [];
    switch(this.Delay) {
        case 1: dots = [[-2, 0]                        ]; break;
        case 2: dots = [[-4, 0],        [ 0, 0]        ]; break;
        case 3: dots = [[-4,-2],[-4,+2],[ 0, 0]        ]; break;
        case 4: dots = [[-4,-3],[-4,+3],[-2, 0],[+1, 0]]; break;
    }
    if (0 < this.Y && this.Y < 5) {
        var y = [this.Y-1, 4];        
        for (var iY = 0; iY < y.length; iY++) {
            var ctx = gLayerCanvasses[y[iY]];
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
    }   }   
}
// ========================================================================== //
function cRepeater(pXYZ, pOrientation, pDelay, pSignalName, pSignalSourceNames) {
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
        if (!this.Locked) { 
            lSourcePower = p.Sources[0].PowerInfo.Power[0];
            p.Power[p.Power.length - 1] = (lSourcePower == 0) ?  0 : 15; 
        }
    }
    catch (err) { this.ErrorMessage(err); }
}
cRepeater.prototype.DrawBlock = function () {
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
    if (0 < this.Location.Y && this.Location.Y < 5) {
        var y = [this.Location.Y-1, 4];        
        for (var iY = 0; iY < y.length; iY++) {
            var ctx = gLayerCanvasses[y[iY]];
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
    }   }   
}
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
cHighSlab.prototype.DrawBlock = function() {
    var lX = xOffset + this.Location.X * xScale + xScale/2;
    var lZ = yOffset + this.Location.Z * zScale + zScale/2;
    if (0 < this.Location.Y && this.Location.Y < 5) {
        var y = [this.Location.Y-1, 4];        
        for (var i = 0; i < y.length; i++) {
            var ctx = gLayerCanvasses[y[i]];
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
    }   }   }
    if (0 <= this.Location.Y && this.Location.Y < 4) {
        var y = [this.Location.Y, 4];        
        for (var i = 0; i < y.length; i++) {
            var ctx = gLayerCanvasses[y[i]];
            ctx.strokeStyle = gStyleWire;
            for (var dir = 0; dir < this.Directions.length; dir++) {
                var vector = rotate(this.Directions[dir],[xScale/2-1,0]);
                ctx.beginPath();
                ctx.moveTo(lX,lZ);
                ctx.lineTo(lX + vector[0], lZ + vector[1]);
                ctx.stroke();
    }   }   }
}
// ========================================================================== //
function cWireBlock(pXYZ, pDirectionString = 'EWNS', pBlocktype = 'stone', pSubtype = '0', pSignalName = '', pSignalSourceNames = '') {
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
cWireBlock.prototype.SetInput = function () { this.PowerInfo.SetInput(); }
cWireBlock.prototype.DrawBlock = function() {
    this.BlockInfo.DrawBlock(this.Location);
    var lX = xOffset + this.Location.X * xScale + xScale/2;
    var lZ = yOffset + this.Location.Z * zScale + zScale/2;
    if (0 <= this.Location.Y && this.Location.Y < 4) {
        var y = [this.Location.Y, 4];        
        for (var i = 0; i < y.length; i++) {
            var ctx = gLayerCanvasses[y[i]];
            ctx.strokeStyle = gStyleWire;
            for (var dir = 0; dir < this.Directions.length; dir++) {
                var vector = rotate(this.Directions[dir],[xScale/2-1,0]);
                ctx.beginPath();
                ctx.moveTo(lX,lZ);
                ctx.lineTo(lX + vector[0], lZ + vector[1]);
                ctx.stroke();
    }}}
}
// ========================================================================== //
function cWire(pDirectionString = 'EWNS', pXYZ = [0,0,0], pBlocktype = '', pSubtype = '', pSignal = '', pSourceNames = '', pLength = 1) {
    var Wirelength;
    var Directions;
    // ============ //  
    if (pBlocktype == '') { this.Blocktype = 'redstone_wire'; }
    this.Wirelength = pLength;
    this.Directions = [];
    this.Signal = pSignal;
    this.SetLocation(pXYZ);
    for (var i = 0; i < pDirectionString.length; i++) {
        this.Directions.push(pDirectionString[i]);
    }
    this.Reset(0, 0);
}
cWire.prototype = new cSignalBlock();
cWire.prototype.SetInput = function () {
    if (this.Sources.length > 0) {
        this.Power[this.Delay] = (this.Sources[0].Power[0] > this.Wirelength) ? this.Sources[0].Power[0] - this.Wirelength : 0;
    }
}
cWire.prototype.DrawBlock = function() {
    var lX = xOffset + this.X * xScale + xScale/2;
    var lZ = yOffset + this.Z * zScale + zScale/2;
    if (0 < this.Y && this.Y < 5) {
        var y = [this.Y-1, 4];        
        for (var i = 0; i < y.length; i++) {
            var ctx = gLayerCanvasses[y[i]];
            ctx.strokeStyle = gStyleWire;
            for (var dir = 0; dir < this.Directions.length; dir++) {
                var vector = rotate(this.Directions[dir],[xScale/2-1,0]);
                ctx.beginPath();
                ctx.moveTo(lX,lZ);
                ctx.lineTo(lX + vector[0], lZ + vector[1]);
                ctx.stroke();
    }   }   }
}
// ========================================================================== //
function cOrOld(pDirectionString = 'EWNS', pXYZ = [0,0,0], pBlocktype = '', pSubtype = '', pSignal = '', pSourceNames = '') {
    var Directions; //
    // ============ //
    if (pBlocktype == '') { this.Blocktype = 'stone_slab'; }
    this.Directions = [];
    for (var i = 0; i < pDirectionString.length; i++) { this.Directions.push(pDirectionString[i]); }
    this.SetLocation(pXYZ);
    this.Signal = pSignal;
    this.SourceNames = (pSourceNames == undefined) ? [] : pSourceNames;
    this.Reset(0, 0);
}
cOrOld.prototype = new cSignalBlock();
cOrOld.prototype.SetInput = function () {
    this.Power[this.Delay] = 0;
    for (var i = 0; i < this.Sources.length; i++) {
        if (this.Power[this.Delay] < this.Sources[i].Power[0]) {
            this.Power[this.Delay] = this.Sources[i].Power[0];
    }}
}
cOrOld.prototype.DrawBlock = function() {
    var lX = xOffset + this.X * xScale + xScale/2;
    var lZ = yOffset + this.Z * zScale + zScale/2;
    if (0 < this.Y && this.Y < 5) {
        var y = [this.Y-1, 4];        
        for (var i = 0; i < y.length; i++) {
            var ctx = gLayerCanvasses[y[i]];
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
    }   }   }
    if (0 <= this.Y && this.Y < 4) {
        var y = [this.Y, 4];        
        for (var i = 0; i < y.length; i++) {
            var ctx = gLayerCanvasses[y[i]];
            ctx.strokeStyle = gStyleWire;
            for (var dir = 0; dir < this.Directions.length; dir++) {
                var vector = rotate(this.Directions[dir],[xScale/2-1,0]);
                ctx.beginPath();
                ctx.moveTo(lX,lZ);
                ctx.lineTo(lX + vector[0], lZ + vector[1]);
                ctx.stroke();
    }   }   }
}
// ========================================================================== //
function cLever(pX,pY,pZ, pOrientation = 'E', pBlocktype = 'lever', pSubtype = '', pSignal = '', pSourceNames = '') {
    this.Signal = pSignal;
    this.SourceNames = [];
    this.Reset(0, 0);
}
// cLever.prototype = new cSignalBlock(pX,pY,pZ,pOrientation,'lever', '',pSignal,pSourceNames,0,0);
cLever.prototype = new cSignalBlock();
cLever.prototype.SetInput = function () {}
cLever.prototype.Off = function () { this.Power[0] =  0; }
cLever.prototype.On  = function () { this.Power[0] = 15; }
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
function ClockInit() {
    var lRepeater;
    var lRepname = '';
    var lSource = '';
    addBlockAndComponent(new cSignalBlock   ( '',[2,1,0],'sandstone',0,'-CK',[ 'CK.4.r']));
    addBlockAndComponent(new cRedTorchOld('W',[1,1,0],''         ,0, 'CK',['-CK'    ]));
    var lOrientations = ['S','E','E','N'];
    var lLocations = [[0,1,1],[1,1,2],[3,1,2],[4,1,1]];
    for (var r = 0; r < 4; r++) {
        lRepname = 'CK.' + (r + 1) + '.r';
        lSource = (r == 0) ? 'CK' : 'CK.' + r + '.r';
        addBlockAndComponent(new cRepeaterOld(lOrientations[r],lLocations[r],'',0,     lRepname, [lSource ], 1 ));
        if (r < 3) {
            addBlockAndComponent(new cSignalBlock   (   '',[2*r,1,4],'sandstone',0                                ));
            addBlockAndComponent(new cRedTorchOld(  'S',[2*r,1,5],         '',0, '-' + lRepname, [lRepname]    ));
        }
    }
    var lOrientations = ['ES' , 'WE'  ,'WS'
                        ,'ENS', 'WES' ,'WNS'
                        , 'ENS','WENS','WNS'
                        , 'EN', 'WE'  ,      'WE', 'WN'
                        ];
    var lLocations = [ [0,1,0],                [3,1,0],[4,1,0]
                     , [0,1,2],        [2,1,2]        ,[4,1,2]
                     , [0,1,3],        [2,1,3]        ,[4,1,3]
                     , [0,1,6],[1,1,6],        [3,1,6],[4,1,6]
                     ];
    for (var i = 0; i < lLocations.length; i++) {
        addBlockAndComponent(new cWire (lOrientations[i],lLocations[i],'',0));
    }
    //  Afgeleide clocksignalen
    addBlockAndComponent(new cOrOld('EW',[1,1,3],'',0));
    addBlockAndComponent(new cOrOld('EW',[3,1,3],'',0));
    addBlockAndComponent(new cOrOld('EW',[2,2,3],'',0,'CK.p0'    , [ 'CK.1.r' , 'CK.2.r', 'CK.3.r']));
    addBlockAndComponent(new cRepeaterOld('S',[6,1,5],'',0,'CK.p0+1', ['CK.p0'  ], 1));
    addBlockAndComponent(new cSignalBlock('',[6,1,7],'sandstone',0));
    addBlockAndComponent(new cRedTorchOld('S',[6,1,8],''         ,0, 'Phi-0'  , ['CK.p0+1'  ]   ));
    addBlockAndComponent(new cOrOld('EW',[3,3,3],'',0));
    addBlockAndComponent(new cOrOld('EW',[4,3,3],'',0));
    addBlockAndComponent(new cOrOld('WE',[5,3,3],'',0));
    addBlockAndComponent(new cOrOld('WS',[6,3,3],'',0));
    addBlockAndComponent(new cOrOld('NS',[6,3,4],'',0));
    addBlockAndComponent(new cOrOld('NEWS',[2,0,6],'',0,'CK.p1'    , ['-CK.1.r','-CK.2.r','-CK.3.r']));
    addBlockAndComponent(new cSignalBlock('',[2,1,7],'sandstone',0));
    addBlockAndComponent(new cRedTorchOld('S',[2,1,8],''         ,0, 'Phi-1'  , ['CK.p1'  ]   ));
    
    new cBlock    ([12,1,0], 'sandstone', 0            ,'#-CK'     ,['# CK.4.r' ]);
    new cRedTorch ([11,1,0], 'W'                       ,'# CK'     ,['#-CK'     ]);
    new cRepeater ([10,1,1], 'S'   , 1                 ,'# CK.1.r' ,['# CK'     ]);
    new cRepeater ([11,1,2], 'E'   , 1                 ,'# CK.2.r' ,['# CK.1.r' ]);
    new cRepeater ([13,1,2], 'E'   , 1                 ,'# CK.3.r' ,['# CK.2.r' ]);
    new cRepeater ([14,1,1], 'N'   , 1                 ,'# CK.4.r' ,['# CK.3.r' ]);
    new cHighSlab ([11,1,3], 'EW'  ,undefined,undefined,'# CK.12'  ,['# CK.1.r' ,'# CK.2.r']);
    new cHighSlab ([12,2,3], 'EW'  ,undefined,undefined,'# CK.23'  ,['# CK.2.r' ,'# CK.3.r']);
    new cHighSlab ([13,1,3], 'EW'  ,undefined,undefined,'# CK.p0'  ,['# CK.12'  ,'# CK.23' ]);
    new cRepeater ([ 8,1,5], 'S'   , 1                 ,'# CK.p0+1',['# CK.p0'  ]);
    new cRedTorch ([ 8,1,8], 'S'                       ,'# Phi-0'  ,['# CK.p0+1']);
    new cRedTorch ([10,1,5], 'S'                       ,'#-CK.1.r' ,['# CK.1.r' ]);
    new cRedTorch ([12,1,5], 'S'                       ,'#-CK.2.r' ,['# CK.2.r' ]);
    new cRedTorch ([14,1,5], 'S'                       ,'#-CK.3.r' ,['# CK.3.r' ]);
    new cHighSlab ([12,0,6], 'EWNS',undefined,undefined,'# CK.p1'  ,['#-CK.1.r' ,'#-CK.2.r','#-CK.3.r']);
    new cRedTorch ([12,1,8], 'S'                       ,'# Phi-1'  ,['# CK.p1'  ]);
    new cBlock    ([10,1,4], 'sandstone', 0);
    new cBlock    ([12,1,4], 'sandstone', 0);
    new cBlock    ([14,1,4], 'sandstone', 0);
    new cBlock    ([12,1,7], 'sandstone', 0);
    new cBlock    ([ 8,1,7], 'sandstone', 0);
    new cWireBlock([10,0,0], 'ES');
    new cWireBlock([13,0,0], 'EW');
    new cWireBlock([14,0,0], 'WS');
    new cWireBlock([10,0,2], 'ENS');
    new cWireBlock([12,0,2], 'EWS');
    new cWireBlock([14,0,2], 'WNS');
    new cWireBlock([10,0,3], 'ENS');
    new cWireBlock([12,0,3], 'EWNS');
    new cWireBlock([14,0,3], 'WNS');
    new cWireBlock([ 8,1,3], 'ES');
    new cWireBlock([ 9,2,3], 'EW');
    new cWireBlock([10,2,3], 'EW');
    new cWireBlock([ 8,0,4], 'NS');
    new cWireBlock([ 8,0,6], 'NS');
    new cWireBlock([10,0,6], 'EN');
    new cWireBlock([11,0,6], 'EW');
    new cWireBlock([13,0,6], 'EW');
    new cWireBlock([14,0,6], 'WN');
}
function ClockSignals() {
    gComponents = [];
    ClockInit();
    gDisplay = [ 'CK'];
    // gDisplay = ['CK','Phi-0','Phi-1'];
    SetSignalsToShow('# Phi-0','# Phi-1');
    
    Signaal();
}
// ========================================================================== //
function AddInstructionClockUnit(pUnitnr, pSource = '') {
    var lPrefix =  'IC.' + pUnitnr + '.';
    var nPrefix = '-IC.' + pUnitnr + '.';
    var lSource = pSource;
    if (lSource == '') { lSource = 'IC.' + (pUnitnr - 1) + '.t'; }
    gComponents.push(new cRepeaterOld( lPrefix + 's.Lock', ['-Phi-0'                             ], 1));
    gComponents.push(new cRepeaterOld( lPrefix + 't.Lock', ['-Phi-1'                             ], 1));
    gComponents.push(new cRepeaterOld( lPrefix + 's'     , [lSource          , lPrefix + 's.Lock'], 1));
    gComponents.push(new cInverter( nPrefix + 's'     , [lPrefix + 's'                        ]   ));
    gComponents.push(new cOrOld      ( nPrefix + 't.OR'  , [nPrefix + 's'    , 'RST'             ]   ));
    gComponents.push(new cInverter( lPrefix + 't.AND' , [nPrefix + 't.OR'                     ]   ));
    gComponents.push(new cRepeaterOld( lPrefix + 't'     , [lPrefix + 't.AND', lPrefix + 't.Lock'], 1));
    gComponents.push(new cInverter( nPrefix + 't'     , [lPrefix + 't'                        ]   ));
    gComponents.push(new cOrOld      ( nPrefix + 'T'     , [nPrefix + 't'    ,'CK.4.r'           ]   ));
    gComponents.push(new cInverter( lPrefix + 'T'     , [nPrefix + 'T'                        ]   ));
    gComponents[ComponentIndex(lPrefix + 'T')].Display = true;
}
function InstructionClockInit() {
    ClockInit();
    gComponents.push(new cLever   ( 'RST'));
    gComponents.push(new cInverter('-RST', ['RST']));
    gComponents.push(new cRepeaterOld( 'IC.0.t.Lock', ['-Phi-1'               ], 1));
    gComponents.push(new cRepeaterOld( 'IC.0.t'     , [ 'RST'  , 'IC.0.t.Lock'], 1));
    gComponents.push(new cInverter('-IC.0.t', [ 'IC.0.t'         ]));
    gComponents.push(new cOrOld      ('-IC.0.T', ['-IC.0.t','CK.4.r']));
    gComponents.push(new cInverter( 'IC.0.T', ['-IC.0.T'         ]));
    AddInstructionClockUnit(1);
    AddInstructionClockUnit(2);
    AddInstructionClockUnit(3);
    AddInstructionClockUnit(4);
    AddInstructionClockUnit(5);
    gComponents.push(new cRepeaterOld('IC.PreRST.Lock', ['-Phi-0'] ));
    gComponents.push(new cRepeaterOld('IC.RST.Lock'   , ['-Phi-1'] ));
    gComponents.push(new cOrOld      ('IC.5.t or RST' , ['IC.5.t'       , 'RST'] ));
    gComponents.push(new cRepeaterOld('IC.PreRST'     , ['IC.5.t or RST', 'IC.PreRST.Lock']));
    gComponents.push(new cRepeaterOld('IC.RST'        , ['IC.PreRST'    , 'IC.RST.Lock'   ]));

    gComponents[ComponentIndex('IC.0.t') ].SetSources('IC.PreRST', 'IC.0.t.Lock');
    gComponents[ComponentIndex('RST')].On();
}
function InstructionClockSignals() {
    gComponents = [];
    InstructionClockInit();
    gDisplay = ['CK','Phi-0','Phi-1','RST','IC.RST','IC.0.T','IC.1.T','IC.2.T','IC.3.T','IC.4.T','IC.5.T'];
    Signaal();
}
// ========================================================================== //
function LockedRepeaterInit() {
    gComponents.push(new cRepeaterOld('LR.Lock', ['CK.1.r'           ], 1));
    gComponents.push(new cRepeaterOld('LR'     , ['CK.1.r', 'LR.Lock'], 1));
    gComponents.push(new cRepeaterOld('NR'     , ['CK.2.r'           ], 1));
}
function LockedRepeaterSignals() {
    gComponents = [];
    ClockInit();
    LockedRepeaterInit();
    gDisplay = ['CK','CK.1.r','LR.Lock','LR','NR','CK.2.r'];
    Signaal();
}
// ========================================================================== //
function FlipFlopInit() {
    // FF1
    gComponents.push(new cInverter( 'FF1.In'     , [ 'CK'    ]   ));
    gComponents.push(new cRepeaterOld( 'FF1.R1.Lock', [ 'CK'    ], 1));
    gComponents.push(new cRepeaterOld( 'FF1.R2.Lock', [ 'FF1.In'], 1));
    gComponents.push(new cRepeaterOld( 'FF1.R1'     , ['-FF1.R2', 'FF1.R1.Lock'], 1, 15));
    gComponents.push(new cRepeaterOld( 'FF1.R2'     , [ 'FF1.R1', 'FF1.R2.Lock'], 1));
    gComponents.push(new cInverter('-FF1.R2'     , [ 'FF1.R2']   ));
    // FF2
    gComponents.push(new cInverter( 'FF2.In'     , [ 'CK'    ]   ));
    gComponents.push(new cRepeaterOld( 'FF2.R1.Lock', [ 'CK'    ], 1));
    gComponents.push(new cRepeaterOld( 'FF2.R2.Lock', [ 'FF2.In'], 1));
    gComponents.push(new cInverter('-FF2.R1'     , [ 'FF2.R1']   ));
    gComponents.push(new cRepeaterOld( 'FF2.R1'     , [ 'FF2.R2', 'FF2.R1.Lock'], 1));
    gComponents.push(new cRepeaterOld( 'FF2.R2'     , ['-FF2.R1', 'FF2.R2.Lock'], 1));
}
function FlipFlopSignals() {
    gComponents = [];
    ClockInit();
    FlipFlopInit();
    gDisplay = ['CK','FF1.R2','FF2.R1'
               // , 'FF1.In', 'FF1.R1.Lock', 'FF1.R2.Lock', 'FF1.R1', 'FF1.R2', '-FF1.R2'
               // , 'FF2.In', 'FF2.R1.Lock', 'FF2.R2.Lock', 'FF2.R1', 'FF2.R2', '-FF2.R1'
               ];
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
    initSignalCanvas();
    initLayerCanvas('Laag-1');
    initLayerCanvas('Laag-2');
    initLayerCanvas('Laag-3');
    initLayerCanvas('Laag-4');
    initLayerCanvas('Alles');
    CheckComponentsAndDisplay();
    for (var i = 0; i < gSignals.length; i++) { gSignals[i].SetSources();}
    
    for (var i = 0; i < gDisplay.length; i++) {
        try { gComponents[ComponentIndex(gDisplay[i])].Display = true; }
        catch (err) { console.log(gDisplay[i] + ' ' + err); }
    }
    var lRow = 1;
    for (var i = 0; i < gDisplay.length; i++) {
        gSignalCanvas.fillText(ComponentIndex(gDisplay[i]), 0, 25 * lRow);
        gComponents [ComponentIndex(gDisplay[i])].ToonNaam(lRow);
        lRow++;
    }
    for (var i = 0; i < gSigShow.length ; i++) { gSigShow[i].DrawName(lRow); lRow++; }

    for (var i = 0; i < gBlocksOld.length; i++) { gBlocksOld[i].DrawBlock(); } 
    for (var i = 0; i < gBlocks.length ; i++) { gBlocks[i].DrawBlock();}
    
    for (t = 0; t < 1400/w; t++) {
        var lRow = 1;
        if (t == 10 && ComponentIndex('RST') > 0) { gComponents[ComponentIndex('RST')].Off(); }
        if (t == 14 && ComponentIndex('LR' ) > 0) { gComponents[ComponentIndex('LR')].Reset(1,15); }
        for (var i = 0; i < gComponents.length; i++) {        gComponents[i].SetInput();  }
        for (var i = 0; i < gDisplay.length   ; i++) { lRow = gComponents[ComponentIndex(gDisplay[i])].DrawSignal(t,lRow); }
        for (var i = 0; i < gComponents.length; i++) {        gComponents[i].Tick();      }

        for (var i = 0; i < gSignals.length; i++) {        gSignals[i].Block.SetInput();}
        for (var i = 0; i < gSigShow.length; i++) { lRow = gSigShow[i].DrawSignal(t,lRow);}
        for (var i = 0; i < gSignals.length; i++) {        gSignals[i].Tick();}
    }
}
