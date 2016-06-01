    // https://www.digminecraft.com/command_blocks/multiple_commands.php
    xScale = 15;
    zScale = 15;
    var canvascontexts= [];
    //
    var gbRepeaterEast;
    var gbRedTorchEast;
    var gbRedTorch;
    //
    var gY = 0;
    var cmd = [];
    var gPassengers = [];
function cPassenger(pBlock, pData, pID, pTime) {
    this.Block = pBlock;
    if (pID   === undefined) { this.ID   = 'FallingSand'; } else { this.ID             = pID  ; }
    if (pTime === undefined) { this.Time =             1; } else { this.Time           = pTime; }
    if (pData === undefined) { this.TileEntityData =  ''; } else { this.TileEntityData = pData; }
}
cPassenger.prototype.PassengerBegin = function () { return ',Passengers:[{'; }
cPassenger.prototype.PassengerClose = function () { return '}]';             }
cPassenger.prototype.PassengerInfo = function () {
    var lInfo = 'id:' + this.ID;
    lInfo += ',Block:' + this.Block;
    lInfo += ',Time:'  + this.Time;
    lInfo += ',Data:1';
    if (this.TileEntityData != '') { lInfo += ',TileEntityData:{Command:' + this.TileEntityData + '}'; }
    return lInfo;
}
function cBlock(pBlock, pKind = '', pX = 0, pY = 0, pZ = 0) {
    this.Block = pBlock;
    if (pKind === undefined) { this.Kind = ''; } else { this.Kind = pKind; }
    if (pX === undefined) { this.X = 0; } else { this.X = pX; }
    if (pY === undefined) { this.Y = 0; } else { this.Y = pY; }
    if (pZ === undefined) { this.Z = 0; } else { this.Z = pZ; }
}
cBlock.prototype.Draw = function () {
    if (0 < this.Y && this.Y < 5) {
        var lColor = 'rgb(64,64,64)';
        var lX = xScale * this.X;
        var lZ = zScale * this.Z;
        var lL = xScale;
        var lW = zScale;
        var y = [this.Y-1, 4];        
        for (var i = 0; i < y.length; i++) {
            canvascontexts[y[i]].strokeStyle = 'rgb(128,128,128)';
            canvascontexts[y[i]].rect(lX, lZ, lL, lW);
            canvascontexts[y[i]].stroke();
        }
        lX += 1; lZ += 1; lL -= 2; lW -= 2;
             if (this.Block == 'unpowered_repeater') { lColor = 'rgb(255,128,128)'; lX += 1; lZ += 1; lL -= 2; lW -= 2;}
        else if (this.Block == 'redstone_torch'    ) { lColor = 'rgb(255, 64, 64)'; lX += 2; lZ += 2; lL -= 4; lW -= 4;}
        switch(this.Block) {
            case 'stained_hardened_clay': switch(this.Kind) {
                case  3: lColor = 'rgb(128,128,255)'; break;
                case  4: lColor = 'rgb(255,255,128)'; break;
                case 14: lColor = 'rgb(255,160,128)'; break;
            } break;
            case 'stone_slab': switch(this.Kind) {
                case  3: lColor = 'rgb(128,128,255)'; break;
                case  8: lColor = 'rgb(160,160,160)'; break;
                case 10: lColor = 'rgb(255,160,128)'; break;
            } break;
            case 'stone_slab2': switch(this.Kind) {
                case  8: lColor = 'rgb(255,192,128)'; break;
            } break;
            case 'planks': switch(this.Kind) {
                case  4: lColor = 'rgb(255,207,128)'; break;
            } break;
            case 'wooden_slab': switch(this.Kind) {
                case 12: lColor = 'rgb(255,207,128)'; break;
            } break;
            case 'red_sandstone': switch(this.Kind) {
                case  0: lColor = 'rgb(255,192,128)'; break;
                case  8: lColor = 'rgb(128,128,128)'; break;
                case 10: lColor = 'rgb(255,192,128)'; break;
            } break;
            case 'redstone_wire': lColor = 'rgb(255,128,128)'; break;
        }
        canvascontexts[this.Y-1].fillStyle = lColor;
        if (this.Block == 'redstone_wire') {canvascontexts[this.Y-1].fillRect(lX+3, lZ+3, lL-6, lW-6);}
        else                               {canvascontexts[this.Y-1].fillRect(lX, lZ, lL, lW);}
        canvascontexts[4].fillStyle = lColor;
        if (this.Block == 'redstone_wire') {canvascontexts[4].fillRect(lX+3, lZ+3, lL-6, lW-6);}
        else                               {canvascontexts[4].fillRect(lX, lZ, lL, lW);}
    }   
}
cBlock.prototype.SetLocation = function (x,y,z) {
    this.X = x;
    this.Y = y;
    this.Z = z;
}
cBlock.prototype.Fill = function (x,y,z,l,b,h) {
    this.SetLocation(x,y,z);
    var lcmd = '/fill';
    lcmd += ' ~' + px;
    lcmd += ' ~' + (py + gY);
    lcmd += ' ~' + pz;
    lcmd += ' ~' + (px + dx - 1);
    lcmd += ' ~' + (py + dy - 1 + gY);
    lcmd += ' ~' + (pz + dz - 1);
    lcmd += ' ' + pBlock;
    if (pKind != '') {lcmd += ' ' + pKind;}
    --gY;
    cmd.push(lcmd);
}
cBlock.prototype.Setblock = function (x,y,z) {
    this.SetLocation(x,y,z);
    this.Draw();
    var lcmd = '/setblock';
    lcmd += ' ~' + this.X;
    lcmd += ' ~' + (this.Y + gY);
    lcmd += ' ~' + this.Z;
    lcmd += ' ' + this.Block;
    lcmd += ' ' + this.Kind;
    --gY;
    cmd.push(lcmd);
}
function cRedTorch() {
    var Direction;
}
cRedTorch.prototype = new cBlock('redstone_torch');
cRedTorch.prototype.SetDirection = function (pDirection) {
    this.Direction = pDirection;
         if (pDirection == 'east' ) { this.Kind = 1; }
    else if (pDirection == 'west' ) { this.Kind = 2; }
    else if (pDirection == 'south') { this.Kind = 3; }
    else if (pDirection == 'north') { this.Kind = 4; }
    else if (pDirection == 'up'   ) { this.Kind = 5; }
}
cRedTorch.prototype.Draw = function () {
    if (0 < this.Y && this.Y < 5) {
        // canvascontexts[this.Y-1].strokeStyle = 'rgb(255, 64, 64)';
        // canvascontexts[this.Y-1].beginPath();
        // canvascontexts[this.Y-1].moveTo(xScale * this.X,zScale * (this.Z + 0.5));
        // canvascontexts[this.Y-1].lineTo(xScale * (this.X +  0.5),zScale * (this.Z + 0.5));
        // canvascontexts[this.Y-1].stroke();   
        var y = [this.Y-1, 4];        
        for (var i = 0; i < y.length; i++) {
            canvascontexts[y[i]].fillStyle = 'rgb(255, 64, 64)';
            canvascontexts[y[i]].strokeStyle = 'rgb(255, 64, 64)';
            canvascontexts[y[i]].fillRect(xScale * (this.X + 0.5) - 2,zScale * (this.Z + 0.5) - 2, 4, 4);
            switch (this.Direction) {
                case 'east'  : canvascontexts[y[i]].fillRect(xScale * this.X, zScale * (this.Z + 0.5)-1, xScale/2, 2);         break; 
                case 'west'  : canvascontexts[y[i]].fillRect(xScale * (this.X + 0.5), zScale * (this.Z + 0.5)-1, xScale/2, 2); break;         
                case 'north' : canvascontexts[y[i]].fillRect(xScale * (this.X + 0.5) - 1, zScale * (this.Z + 0.5), 2, zScale/2); break;         
                case 'up'    : canvascontexts[y[i]].rect(xScale * (this.X + 0.5) - 4,zScale * (this.Z + 0.5) - 4, 8, 8); canvascontexts[this.Y-1].stroke();          
            }
        }       
    }   
}
cRedTorch.prototype.SetDirectionalBlock = function (x,y,z,pDirection) {
    this.SetDirection(pDirection);
    this.Setblock(x,y,z);    
}
function mbRepeater(pDirection) {
    var lKind = 0;
         if (pDirection == 'south') { lKind = 0; }
    else if (pDirection == 'east' ) { lKind = 1; }
    else if (pDirection == 'north') { lKind = 2; }
    else if (pDirection == 'west' ) { lKind = 3; }
    return new cBlock('unpowered_repeater',lKind);
}
function mbRedTorch(pDirection) {
    var lKind = 0;
         if (pDirection == 'up'   ) { lKind = 5; }
    else if (pDirection == 'east' ) { lKind = 1; }
    else if (pDirection == 'west' ) { lKind = 2; }
    else if (pDirection == 'north') { lKind = 4; }
    else if (pDirection == 'south') { lKind = 3; }
    return new cBlock('redstone_torch',lKind);
}
function mcFill(px,py,pz,dx,dy,dz,pBlock,pKind = '') {
    gbBlock.Block = pBlock;
    gbBlock.Kind = pKind;
    for (ix = 0; ix < dx; ix++) {for (iy = 0; iy < dy; iy++) {for (iz = 0; iz < dz; iz++) {
        gbBlock.SetLocation(px+ix,py+iy,pz+iz);
        gbBlock.Draw();
    }}}
    var lcmd = '/fill';
    lcmd += ' ~' + px;
    lcmd += ' ~' + (py + gY);
    lcmd += ' ~' + pz;
    lcmd += ' ~' + (px + dx - 1);
    lcmd += ' ~' + (py + dy - 1 + gY);
    lcmd += ' ~' + (pz + dz - 1);
    lcmd += ' ' + pBlock;
    if (pKind != '') {lcmd += ' ' + pKind;}
    --gY;
    cmd.push(lcmd);
}
function mcSetblock(px,py,pz,pBlock,pKind = '') {
    gbBlock.Block = pBlock;
    gbBlock.Kind = pKind;
    gbBlock.SetLocation(px,py,pz);
    gbBlock.Draw();
    var lcmd = '/setblock';
    lcmd += ' ~' + px;
    lcmd += ' ~' + (py + gY);
    lcmd += ' ~' + pz;
    lcmd += ' ' + pBlock;
    lcmd += ' ' + pKind;
    --gY;
    cmd.push(lcmd);
}
function FAbox() {
    // Doos		x	y	z	x	y	z		
	// fill	2	1	2	15	4	12	air	
	// fill	1	1	1	16	4	13	stained_glass	7
    mcFill(1,1,1,16,4,13,'stained_glass', 7);
    mcFill(2,2,2,14,3,11,'air');
}
function FAinputA() {
    mcFill( 1,1,4,14,1,1,'stained_hardened_clay', 4);  mcFill( 2,2,4,13,1,1,'redstone_wire');
    mcSetblock( 3,1,5,'stained_hardened_clay', 4);     mcSetblock( 3,2,5,'redstone_wire');
    mcSetblock(10,1,5,'stained_hardened_clay', 4);     mcSetblock(10,2,5,'redstone_wire');
    mcSetblock(14,1,5,'stained_hardened_clay', 4);     mcSetblock(14,2,5,'redstone_wire');
    mcSetblock( 9,2,4,'stained_hardened_clay', 4);
    mcSetblock( 7,2,5,'stone_slab'           ,10);     mcSetblock( 7,3,5,'redstone_wire');
    // var lBlock = mbRepeater('east'); lBlock.Setblock(1,2,4);
    gbRepeaterEast.Setblock( 1,2,4);
    gbRedTorch.SetDirectionalBlock(10,2,4,'east');
}
function FAinputB() {
    mcFill( 1,1,7,14,1,1,'stained_hardened_clay', 14); mcFill( 2,2,7,13,1,1,'redstone_wire');
    mcSetblock(12,2,7,'stained_hardened_clay' , 14);    
    mcSetblock( 6,3,7,'stone_slab'            , 10);    mcSetblock(6,4,7,'redstone_wire');
    mcSetblock( 6,4,8,'stained_hardened_clay' , 14);    
    gbRedTorch.SetDirectionalBlock( 7,4,8,'east');
    gbRedTorch.SetDirectionalBlock(13,2,7,'east');
    mcSetblock( 3,2,6,'stone_slab'            , 10); mcSetblock( 3,3,6,'redstone_wire');
    mcSetblock( 6,2,6,'stone_slab'            , 10); mcSetblock( 6,3,6,'redstone_wire');
    mcSetblock(10,2,6,'stone_slab'            , 10); mcSetblock(10,3,6,'redstone_wire');
    mcSetblock(14,2,6,'stone_slab'            , 10); mcSetblock(14,3,6,'redstone_wire');
    // var lBlock = mbRepeater('east'); lBlock.Setblock(1,2,7);
    gbRepeaterEast.Setblock( 1,2,7);
}
function FAinputC() {
    mcSetblock( 4,2, 8      ,'red_sandstone'  , 0); mcSetblock( 4,3, 8      ,'redstone_wire');
    mcSetblock( 5,3, 9      ,'red_sandstone'  , 0); mcSetblock( 5,4, 9      ,'redstone_wire');
    mcSetblock( 5,2,10      ,'red_sandstone'  , 0); mcSetblock( 5,3,10      ,'redstone_wire');
    mcFill    ( 6,2, 9,6,1,1,'red_sandstone'  , 0); mcFill    ( 6,3, 9,6,1,1,'redstone_wire');
    mcSetblock(13,1, 9      ,'red_sandstone'  , 0); mcSetblock(13,2, 9      ,'redstone_wire');
    mcSetblock(13,2, 8      ,'red_sandstone'  , 0); mcSetblock(13,3, 8      ,'redstone_wire');
    mcFill    (10,1,10,1,1,4,'stone_slab2'    , 8); mcFill    (10,2,10,1,1,4,'redstone_wire');
    gbRedTorch.SetDirectionalBlock( 4,3,9,'west');
    gbRedTorch.SetDirectionalBlock(12,2,9,'east');
}
function FAoutputC() {
    //  A or B
    mcSetblock( 2,3,12      ,'planks'        , 4);
    mcFill    ( 2,3, 6,1,1,6,'wooden_slab'   ,12); mcFill    ( 2,4, 6,1,1,7,'redstone_wire');
    mcSetblock( 3,2,12      ,'wooden_slab'   ,12); mcSetblock( 3,3,12      ,'redstone_wire');
    //  A and B = not (not A or not B)
    mcSetblock(15,4,11      ,'planks'        , 4);
    mcFill    (15,3, 6,1,1,5,'wooden_slab'   ,12); mcFill    (15,4, 6,1,1,5,'redstone_wire');
    gbRedTorch.SetDirectionalBlock(14,4,11,'west');
    mcFill    (12,3,11,2,1,1,'wooden_slab'   ,12); mcFill    (12,4,11,2,1,1,'redstone_wire');
    mcSetblock(11,4,11      ,'wooden_slab'   ,12); mcSetblock(11,5,11      ,'redstone_wire');
    //  (A or B) and C
    mcFill    ( 4,3,12,2,1,1,'planks'        , 4);
    mcSetblock( 5,3,11      ,'planks'        , 4);
    gbRedTorch.SetDirectionalBlock( 5,4,11,'up');
    gbRedTorch.SetDirectionalBlock( 4,4,12,'up');
    mcSetblock( 5,4,12      ,'redstone_wire'    );
    gbRedTorch.SetDirectionalBlock( 6,3,12,'east');
    mcSetblock( 7,2,12      ,'wooden_slab'   ,12); mcSetblock( 7,3,12      ,'redstone_wire');
    mcSetblock( 8,3,12      ,'wooden_slab'   ,12); mcSetblock( 8,4,12      ,'redstone_wire');
    mcSetblock( 9,4,12      ,'wooden_slab'   ,12); mcSetblock( 9,5,12      ,'redstone_wire');
    //  Carry-out = ((A or B) and C) or (A and B)
    mcFill    (10,5,10,1,1,3,'stone_slab2'   , 8); mcFill    (10,6,10,1,1,3,'redstone_wire');
}
function FAoutputQ() {
    mcFill(4,2,2,10,1,1,'stained_hardened_clay', 3); mcFill(4,3,2,10,1,1,'redstone_wire');
    mcSetblock( 8,2,1,'stained_hardened_clay', 3);   mcSetblock( 8,3,1,'redstone_wire');  
    
    mcFill( 4,3,4,1,1,4,'stained_hardened_clay', 3);
    mcFill( 4,3,5,1,1,2,'stone_slab'           , 8);
    mcFill( 4,4,4,1,1,4,'redstone_wire'           );  
    gbRedTorch.SetDirectionalBlock( 4,3,3,'north');
    
    mcSetblock( 8,3,4      ,'stained_hardened_clay', 3);
    mcFill    ( 8,3,5,1,1,4,'stone_slab'           , 8);
    mcFill    ( 8,4,4,1,1,5,'redstone_wire'           );  
    gbRedTorch.SetDirectionalBlock( 8,3,3,'north');
    
    mcSetblock(11,3,4      ,'stained_hardened_clay', 3);
    mcFill    (11,3,5,1,1,4,'stone_slab'           , 8);
    mcFill    (11,4,4,1,1,5,'redstone_wire'           );  
    gbRedTorch.SetDirectionalBlock(11,3,3,'north');
    
    mcSetblock(13,3,4      ,'stained_hardened_clay', 3);
    mcFill    (13,3,5,1,1,3,'stone_slab'           , 8);
    mcFill    (13,4,4,1,1,4,'redstone_wire'           );  
    gbRedTorch.SetDirectionalBlock(13,3,3,'north');
}
function mcFullAdder() {
    gbBlock = new cBlock('block',0);
    gbRepeaterEast = mbRepeater('east');
    gbRedTorchEast = mbRedTorch('east');
    gbRedTorch = new cRedTorch();
    // FAbox();
    FAinputA();
    FAinputB();
    FAinputC();
    FAoutputC();
    FAoutputQ();
    mcSummonChain();
}
function mcRedstoneTower() {
    mcFill(1,1,2,1,20,1,'redstone_block');
    var lSummon = '/summon FallingSand ~1 ~1 ~1 ';
    lSummon += '{Block:command_block,Time:1,TileEntityData:{Command:' + cmd[0] + '}';
    var lPassengers = ',Passengers:[{id:FallingSand,Block:redstone_block,Time:1}]';
    document.getElementById("mcCommand").innerHTML = '';
    lSummon += lPassengers;
    lSummon += '}';
    document.getElementById("mcCommand").innerHTML += '<hr><code>' + lSummon + '</code><hr>';
}
function mcSummonChain() {
    //  /summon FallingSand ~2 ~1 ~1 {Block:command_block,Time:1,Data:1,Passengers:[{id:FallingSand,Block:chain_command_block,Time:1,Data:1}]}
    for (var i = 0; i < cmd.length; i++) { gPassengers.push(new cPassenger('chain_command_block', cmd[i])); }
    var lSummon = '/summon FallingSand ~2 ~1 ~1 ';
    lSummon += '{Block:command_block,Time:1,Data:1';
    for (var i = 0; i < gPassengers.length; i++) {
        lSummon += gPassengers[i].PassengerBegin();
        lSummon += gPassengers[i].PassengerInfo();
        document.getElementById("mcCommandLines").innerHTML += '<br />' + gPassengers[i].PassengerBegin();
        document.getElementById("mcCommandLines").innerHTML += gPassengers[i].PassengerInfo();
    }
    for (var i = 0; i < gPassengers.length; i++) { lSummon += gPassengers[i].PassengerClose(); }
    lSummon += '}';
    document.getElementById("mcCommand").innerHTML += '<hr><code>' + lSummon + '</code><hr>';
}
function mcSummon() {
    mcFill(0,0,1,1,cmd.length,1,'redstone_block');
    for (var i = 0; i < cmd.length; i++) { gPassengers.push(new cPassenger('command_block', cmd[i])); }
    gPassengers.push(new cPassenger('redstone_block'));
    var lSummon = '/summon FallingSand ~2 ~1 ~1 ';
    lSummon += '{Block:stone,Time:1';
    for (var i = 0; i < gPassengers.length; i++) {
        lSummon += gPassengers[i].PassengerBegin();
        lSummon += gPassengers[i].PassengerInfo();
    }
    for (var i = 0; i < gPassengers.length; i++) { lSummon += gPassengers[i].PassengerClose(); }
    lSummon += '}';
    // --
    // document.getElementById("mcCommand").innerHTML = '';
    // var lCheck = '/summon FallingSand ~2 ~1 ~1 {Block:stone,Time:1,Passengers:[{id:FallingSand,Block:command_block,Time:1,TileEntityData:{Command:/fill ~5 ~1 ~5 ~10 ~5 ~10 planks 0 hollow},Passengers:[{id:FallingSand,Block:command_block,Time:1,TileEntityData:{Command:/fill ~0 ~-1 ~1 ~0 ~5 ~1 redstone_block},Passengers:[{id:FallingSand,Block:redstone_block,Time:1}]}]}]}';
    // for (var i = 0; i < lSummon.length && lCheck.length; i++) {
        // if (lSummon.charAt(i) != lCheck.charAt(i)) {
            // document.getElementById("mcCommand").innerHTML += '<br />Error at ' + i + ' ' + lSummon.charAt(i) + ' <> ' + lCheck.charAt(i);
        // }
    // }
    document.getElementById("mcCommand").innerHTML += '<hr><code>' + lSummon + '</code><hr>';
}
function mcHouse() {
//  /summon FallingSand ~2 ~1 ~1 
//  {Block:command_block,Time:1,TileEntityData:{Command:/fill ~5 ~1 ~5 ~10 ~5 ~10 planks 0 hollow}
//      ,Passengers:[{id:FallingSand,Block:command_block,Time:1,TileEntityData:{Command:/fill ~0 ~-1 ~1 ~0 ~5 ~1 redstone_block}
//          ,Passengers:[{id:FallingSand,Block:redstone_block,Time:1
//          }]
//       }]
//  }    
    mcFill(5,1,5,6,5,6,'planks 0 hollow'); 
    mcFill(5,7,5,4,1,4,'planks 0'); 
    mcSummonChain();
// /summon FallingSand ~2 ~1 ~1 {Block:stone,Time:1,Passengers:[{id:FallingSand,{Block:command_block,Time:1,TileEntityData:{Command:/fill ~5 ~1 ~5 ~10 ~5 ~10 planks 0 hollow},Passengers:[{id:FallingSand,Block:command_block,Time:1,TileEntityData:{Command:/fill ~0 ~-1 ~1 ~0 ~5 ~1 redstone_block},Passengers:[{id:FallingSand,Block:redstone_block,Time:1}]}]}]}
}
function initCanvas(pCanvasnaam) {
    var canvas = document.getElementById(pCanvasnaam);
    if (canvas.getContext){
        var ctx = canvas.getContext('2d');
        var dx = 0;
        ctx.font="3px Verdana";
        ctx.strokeStyle = 'rgb(199,199,199)';
        // ctx.fillStyle = "rgb(223,223,223)";
        // ctx.fillRect (0,0,20*xScale,20*zScale);
        ctx.fillStyle = "rgb(207,207,207)";
        try { for (var z = 0; z < 20*zScale; z += zScale) {
            for (var x = 0; x < 20*xScale; x += 2 * xScale) {
                dx = z % (2 * zScale);
                // ctx.fillRect (x + dx,z,xScale,zScale);
                ctx.rect(x,z,xScale,zScale);      ctx.stroke();
                ctx.rect(x + xScale,z,xScale,zScale);      ctx.stroke();
                ctx.rect(x + dx,z,xScale,zScale); ctx.stroke();
        }}}   
        catch(err) { alert(err);}
        canvascontexts.push(ctx);
    }
}
function initMCgenerator() {
    initCanvas('Laag-1');
    initCanvas('Laag-2');
    initCanvas('Laag-3');
    initCanvas('Laag-4');
    initCanvas('Alles');
    mcFullAdder();
}
