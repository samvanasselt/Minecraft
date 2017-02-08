var gCanvas;
var gUnits   = [];
var gBusses  = [];
var gSignals = [];
var gSignalIDs = [];
var gPSigs = [];
var gSignalPairs = [];
var gSignalSets = [];
var gInstructions = [];
function toBin(pValue) {
    var lBin = '00000000' + pValue.toString(2);
    lBin = lBin.substr(lBin.length - 8);
    return lBin.toUpperCase();
}
function toHex(pValue) {
    var lHex = '00' + pValue.toString(16);
    lHex = lHex.substr(lHex.length - 2);
    return lHex.toUpperCase();
}
function ResetCPU() {
    var lResetSignals = [];
    lResetSignals.push(['PC.RST'        ]);
    lResetSignals.push(['PC.WA' ,'AD.RA']);
    lResetSignals.push(['MM.WD' ,'PC.RD']);
    lResetSignals.push([]);
    for (var i = 0; i < lResetSignals.length; i++) {
        gSignalIDs = lResetSignals[i];
        ProcessSignals();
    }
}
{// class cSignalPair
    function cSignalPair(pPairName, pFromName, pToName = undefined) {
        var PairName;
        var FromName;
        var ToName;
        this.PairName = pPairName;
        this.FromName = pFromName;
        this.ToName   = pToName;
        gSignalPairs[this.PairName] = this;
    }
}
function InitSignalPairs() {
    new cSignalPair('AD=PC','PC.WA','AD.RA');   //  Load address register from program counter
    new cSignalPair('AD=ML','ML.WA','AD.RA');   //  Load address register from memory latch
    new cSignalPair('AD=SP','SP.WA','AD.RA');   //  Load address register from stack pointer
    new cSignalPair('ML=MM','MM.WD','ML.RD');   //  Load memory latch from memory address AD
    new cSignalPair('IR=MM','MM.WD','IR.RD');   //  Load instruction register from memory address AD
    new cSignalPair('PC++' ,'PC.++'        );   //  Increment program counter
    new cSignalPair('PC=MM','MM.WD','PC.RD');   //  Load program counter from memory address AD
    new cSignalPair('PC=ML','ML.WD','PC.RD');   //  Load program counter from memory latch
    new cSignalPair('PC=AL','AL.WU','PC.RU');   //  Load program counter from ALU
    new cSignalPair('SP=AL','AL.WU','SP.RU');   //  Load stack pointer from ALU
    new cSignalPair('SP=AC','AC.WD','SP.RD');   //  Load stack pointer from accumulator
    new cSignalPair('OA=AC','AC.WD','OA.RD');   //  Load operand A from accumulator
    new cSignalPair('OA=PC','PC.WD','OA.RD');   //  Load operand A from program counter
    new cSignalPair('OA=SP','SP.WD','OA.RD');   //  Load operand A from stack pointer
    new cSignalPair('OB=MM','MM.WD','OB.RD');   //  Load operand B from memory address AD  or  Load with 1
    new cSignalPair('OB=ML','ML.WD','OB.RD');   //  Load operand B from memory latch  or  Load with 1
    new cSignalPair('OB'           ,'OB.RD');   //  Load operand B from data bus  or  Load with 1
    new cSignalPair('OC'           ,'OC.RD');   //  Load operand C from carry flag  or  with 0  or  with 1
    new cSignalPair('AC=MM','MM.WD','AC.RD');   //  Load accumulator from memory address AD
    new cSignalPair('AC=ML','ML.WD','AC.RD');   //  Load accumulator from memory latch
    new cSignalPair('AC=SP','SP.WD','AC.RD');   //  Load accumulator from stack pointer
    new cSignalPair('AC=AL','AL.WU','AC.RU');   //  Load accumulator from ALU
    new cSignalPair('AC=SH','SH.WU','AC.RU');   //  Load accumulator from shift register
    new cSignalPair('MM=AC','AC.WD','MM.RD');   //  Load memory address AD from accumulator     (write to memory)
    new cSignalPair('MM=PC','PC.WD','MM.RD');   //  Load memory address AD from program counter (write to memory)
    new cSignalPair('MM=FL','FL.WD','MM.RD');   //  Load memory address AD from flags           (write to memory)
    new cSignalPair('FL=MM','MM.WD','FL.RD');   //  Load flags from memory address AD
}
{// class cSignalSet
    function cSignalSet(pSetName, pSignalPairs) {
        var SetName;
        var SignalPairs;
        this.SetName = pSetName;
        this.SignalPairs = pSignalPairs;
        gSignalSets[this.SetName] = this;
    }
}
function InitSignalSets() {
    new cSignalSets('PC++'     ,['PC++']                         );   //  Increment program counter
    new cSignalSets('ML=(PC)'  ,['AD=PC','ML=MM']);   //  Read memory latch from memory location PC
    new cSignalSets('AC+-1'    ,['OA=AC','OB','OC']);   //  Add to or Subtract 1 from accumulator (for INA en DEA)
    new cSignalSets('AC=AL'    ,['AC=AL']                );   //  Store calculation result in accumulator
    new cSignalSets('AC=SH'    ,['AC=SH']                );   //  Store shift result in accumulator
    new cSignalSets('PC=ML'    ,['PC=ML']                );   //  Jump to location ML
    new cSignalSets('AD=ML'    ,['AD=ML']                );   //  Prepare save to memory location ML
    new cSignalSets('(AD)=AC'  ,['MM=AC']                );   //  Store accumulator in memory location AD
    new cSignalSets('(AD)=FL'  ,['MM=FL']                );   //  Store flags in memory location AD (PHP)
    new cSignalSets('(AD)=PC'  ,['MM=PC']                );   //  Store PC in memory location AD (JSR)
    new cSignalSets('LDA nn'   ,['AD=ML','AC=MM','PC++']);   // ML=(PC); AC=(ML), PC++
    new cSignalSets('A=AC'     ,['OA=AC']                );   //  Read operand A from accumulator
    new cSignalSets('AC=A+(ML)',['AD=ML','OB=MM','OC','AC=AL']); //  Add (ML) to or Subtract (ML) from accumulator
}
{// class cInstruction
    function cInstruction(pAM, pCT, pOperation, pMnemonic, pSignalSets) {
        var AddressMode; // 00 = Implied, 01 = Immediate, 11 = Direct
        var CT;
        var Operation;
        var Mnemonic;
        var SignalSets;
        var Value;
        this.AddressMode = pAM;
        this.CT          = pCT;
        this.Operation   = pOperation;
        this.Mnemonic    = pMnemonic;
        this.SignalSets  = pSignalSets;
        this.Value = parseInt(pAM + pCT + pOperation,2);
        gInstructions[this.Value] = this;
    }
}
function InitInstructions() {
    new cInstruction('00','00','0001','INA'   ,['AC+-1','AC=UB']);
    new cInstruction('00','00','0011','DEA'   ,['AC+-1','AC=UB']);
    new cInstruction('11','01','0000','LDA nn',['LDA nn']);
    new cInstruction('11','00','0000','ADC nn',['A=AC','AC=A+(ML)','PC++']);
    new cInstruction('11','10','0000','SBC nn',['A=AC','AC=A+(ML)','PC++']);
    new cInstruction('11','01','0001','STA nn',['RA=ML','(AD)=AC','PC++']);
    new cInstruction('11','11','0000','JMP nn',['PC=ML']);
}
function InitProgramSignals() {
    gPSigs.push(['PC.RST'        ]);
    gPSigs.push(['PC.RST'        ]);
    gPSigs.push(['PC.WA' ,'AD.RA']);
    gPSigs.push(['MM.WD' ,'PC.RD']);
}
function InitCPUcanvas() {
    var canvas = document.getElementById('cpu');
    if (canvas.getContext){
        gCanvas = canvas.getContext('2d');
        gCanvas.clearRect(0, 0, canvas.width, canvas.height);
        gCanvas.font="10px Verdana";
        gCanvas.strokeStyle = 'rgb(192,192,192)';
        gCanvas.beginPath();
        gCanvas.rect(0, 0, canvas.width, canvas.height);
        gCanvas.stroke();
        var img=document.getElementById("65MINE01-schema");
        // gCanvas.drawImage(img,10,10);
    }
}
function Init65MINE01() {
    ResetClock();
    InitCPUcanvas();
    InitProgramSignals();
    new cMM();
    new cML();
    // var lIC = new cUnit('IC'); lIC.UnitBox.SetXY( 20,240);
    new cIC();
    new cCK();
    new cIR();
    new cFL();
    new cPC();
    new cSP();
    new cOC();
    new cOB();
    new cOA();
    new cAL();
    new cSR();
    new cAC();
    new cAD();
    //
    gBusses['DB'] = new cBus('DB'); gBusses['DB'].BusBox.SetXYh(280, 24, 560);
    gBusses['UB'] = new cBus('UB'); gBusses['UB'].BusBox.SetXYh(580,120, 400);
    gBusses['AB'] = new cBus('AB'); gBusses['AB'].BusBox.SetXYh(640, 24, 280);
    //
    // lCK.Draw();
    // lIC.Draw();
    Object.keys(gUnits).forEach( function(ID) { gUnits[ ID].Draw(); });
    Object.keys(gBusses).forEach(function(ID) { gBusses[ID].Draw(); });
    // var lIF = new cUnit('IF'); lIF.UnitBox.SetXY(140,160);
    // var lML = new cUnit('ML'); lML.UnitBox.SetXY(360, 24);
    // lIF.Draw();
    // lML.Draw();
    ResetCPU();
    document.getElementById("button-next-signals").style.visibility = "visible";
    document.getElementById("button-process-signals").style.visibility = "hidden";
}
{// class cUnitBox
    function cUnitBox(pNaam) {
        var naam;
        var value;
        var x,y,w,h;
        this.naam  = pNaam;
        this.value = Math.floor(Math.random() * 256);
        this.x = 0;
        this.y = 0;
        this.w = 100;
        this.h = 40;
    }
    cUnitBox.prototype.SetXY = function(pX,pY) { this.x = pX; this.y = pY; }
    cUnitBox.prototype.DrawBox = function(pValue = undefined) {
        // Zie http://www.w3schools.com/colors/colors_converter.asp
        // Rood  =   0
        // Geel  =  60
        // Groen = 120
        // Cyaan = 180
        // Blauw = 240
        gCanvas.fillStyle = 'hsl(120, 100%, 95%)';
        gCanvas.fillRect(this.x, this.y, this.w, this.h);
        gCanvas.strokeStyle = 'hsl(0, 0%, 25%)'; // Rood, Geen kleur, Kwart licht.
        gCanvas.beginPath();
        gCanvas.rect(this.x, this.y, this.w, this.h);
        gCanvas.stroke();
        var lValue = (pValue == undefined) ? this.value : pValue;
        this.value = lValue;
        for (var i = 0; i < 8; i++) {
            if (lValue % 2 == 1) gCanvas.fillStyle = 'hsl(120, 50%, 50%)'; // 'rgb(255,128,128)';
            else                 gCanvas.fillStyle = 'hsl(0,   0%,  95%)';
            gCanvas.fillRect(this.x + 87 - 12 * i, this.y + 25, 9, 9);
            gCanvas.strokeStyle = 'hsl(0,   0%, 50%)';
            gCanvas.beginPath();
            gCanvas.rect(this.x + 87 - 12 * i, this.y + 25, 9, 9);
            gCanvas.stroke();
            lValue = Math.floor(lValue / 2);
            // yourNumber = parseInt(hexString, 16)
            gCanvas.fillStyle = 'hsl(0,   0%, 25%)';
            gCanvas.font = "20px Verdana";
            gCanvas.fillText(this.naam,  this.x + 3, this.y + 20);
            gCanvas.fillText(toHex(this.value),this.x + 67,this.y + 20);
        }
    }
}
{// class cUnit
    function cUnit(pNaam, pX = undefined, pY = undefined, pInputs = undefined, pOutputs = undefined) {
        var Naam;
        var Value;
        var Inputs;
        var Outputs;
        var UnitBox;
        this.Naam    = pNaam;
        this.Value   = Math.floor(Math.random() * 256);
        this.UnitBox = new cUnitBox(this.Naam);
        if (!(pX == undefined || pY == undefined)) this.UnitBox.SetXY(pX,pY);
        this.Inputs  = (pInputs  == undefined) ? [] : pInputs;
        this.Outputs = (pOutputs == undefined) ? [] : pOutputs;
        for (var i = 0; i < this.Inputs.length ; i++) { new cSignal(this.Naam, this.Inputs[i] ); }
        for (var i = 0; i < this.Outputs.length; i++) { new cSignal(this.Naam, this.Outputs[i]); }
    }
    cUnit.prototype.Draw = function() {
        this.UnitBox.DrawBox(this.Value);
        var ni = 0;
        if (this.Inputs.length > 0) {
            var n = Math.floor((this.Inputs.length + 2) / 3);
            if (n < 2) n = 2;
            ni = n;
            var x = this.UnitBox.x + 3 - 32;
            var y;
            var lSignalID;
            for (var i = 0; i < this.Inputs.length; i++) {
                if (i % n == 0) {
                    x += 32;
                    y = this.UnitBox.y + 44;
                }
                lSignalID = SignalID(this.Naam, this.Inputs[i]);
                if (gSignals[lSignalID].Level == 1) gCanvas.fillStyle = 'hsl(  0, 100%, 75%)';
                else                                gCanvas.fillStyle = 'hsl(  0,   0%, 50%)';
                gCanvas.beginPath();
                gCanvas.fillRect(x, y, 7, 7);
                gCanvas.stroke();
                // gCanvas.fillStyle = 'hsl(0,   0%, 25%)';
                gCanvas.font = "8px Verdana";
                gCanvas.fillText(this.Inputs[i], x + 10, y + 6);
                y += 10;
            }
            gCanvas.beginPath();
            gCanvas.rect(this.UnitBox.x, this.UnitBox.y + 40, this.UnitBox.w, 10 * n + 4);
            gCanvas.stroke();
        }
        if (this.Outputs.length > 0) {
            var n = Math.floor((this.Outputs.length + 2) / 4);
            if (n < 1) n = 1;
            var x = this.UnitBox.x + 3 - 24;
            var y;
            var lSignalID;
            for (var i = 0; i < this.Outputs.length; i++) {
                if (i % n == 0) {
                    x += 24;
                    y = this.UnitBox.y + 44 + 10 * ni + 4;
                }
                lSignalID = SignalID(this.Naam, this.Outputs[i]);
                if (gSignals[lSignalID].Level == 1) gCanvas.fillStyle = 'hsl(  0, 100%, 75%)';
                else                                gCanvas.fillStyle = 'hsl(  0,   0%, 50%)';
                gCanvas.beginPath();
                gCanvas.fillRect(x, y, 7, 7);
                gCanvas.stroke();
                // gCanvas.fillStyle = 'hsl(0,   0%, 25%)';
                gCanvas.font = "8px Verdana";
                gCanvas.fillText(this.Outputs[i], x + 10, y + 6);
                y += 10;
            }
            y = this.UnitBox.y + 40 + 10 * ni + 4;
            gCanvas.beginPath();
            gCanvas.rect(this.UnitBox.x, y, this.UnitBox.w, 10 * n + 4);
            gCanvas.stroke();
        }
    }
}
{// class cBusBox
    function cBusBox(pNaam) {
        var naam;
        var value;
        var x,y,w,h;
        this.naam  = pNaam;
        this.value = Math.floor(Math.random() * 256);
        this.x = 0;
        this.y = 0;
        this.w = 40;
        this.h = 0;
    }
    cBusBox.prototype.SetXYh = function(pX,pY,pH) { this.x = pX; this.y = pY; this.h = pH;}
    cBusBox.prototype.DrawBox = function(pValue = undefined) {
        gCanvas.fillStyle = 'hsl(240, 100%, 95%)';
        gCanvas.fillRect(this.x, this.y, this.w, this.h);
        gCanvas.strokeStyle = 'hsl(0, 0%, 25%)'; // Rood, Geen kleur, Kwart licht.
        gCanvas.beginPath();
        gCanvas.rect(this.x, this.y, this.w, this.h);
        gCanvas.stroke();
        var lValue = (pValue == undefined) ? this.value : pValue;
        this.value = lValue;
        for (var i = 0; i < 8; i++) {
            gCanvas.beginPath();
            if (lValue % 2 == 1) gCanvas.fillStyle = 'hsl(120, 100%, 80%)';
            else                 gCanvas.fillStyle = 'hsl(  0,   0%, 80%)';
            lValue = Math.floor(lValue / 2);
            gCanvas.fillRect(this.x + 33 - 4 * i, this.y + 4, 2, this.h - 8);
            gCanvas.stroke();
            gCanvas.fillStyle = 'hsl(0,   0%, 25%)';
            gCanvas.font = "20px Verdana";
            gCanvas.fillText(this.naam,  this.x + 3, this.y + 20);
            gCanvas.fillText(toHex(this.value),this.x + 3,this.y + 40);
        }
    }
}
{// class cBus
    function cBus(pNaam) {
        var Naam;
        var Value;
        var BusBox;
        this.Naam    = pNaam;
        this.Value   = Math.floor(Math.random() * 256);
        this.BusBox = new cBusBox(this.Naam);
    }
    cBus.prototype.Draw = function() { this.BusBox.DrawBox(this.Value); }
}
{// class cSignal
    function cSignal(pUnitName, pSignalName) {
        var UnitName;
        var SignalName;
        var Level;
        this.UnitName   = pUnitName;
        this.SignalName = pSignalName;
        this.Level      = 0;
        gSignals[this.ID()] = this;
    }
    cSignal.prototype.ID = function() { return this.UnitName + '.' +  this.SignalName; }
}
function SignalID(pUnitName, pSignalName) {return pUnitName + '.' +  pSignalName; }
{// class cPC
    function cPC() {
        var PCunit;
        this.PCunit = new cUnit('PC',360,120,['RD','WD','RU','WA','++','RST']);
        gUnits['PC'] = this;
    }
    cPC.prototype.Draw = function() {
        this.PCunit.Draw();
    }
    cPC.prototype.Tick = function() {
        var lSignalID;
        for (var i = 0; i < this.PCunit.Inputs.length; i++) {
            lSignalID = SignalID('PC',this.PCunit.Inputs[i]);
            if (gSignals[lSignalID].Level == 1) {
                switch(this.PCunit.Inputs[i]) {
                    case 'RU' :                       this.PCunit.Value = gBusses['UB'].Value;  break;
                    case 'RD' :                       this.PCunit.Value = gBusses['DB'].Value;  break;
                    case 'WD' : gBusses['DB'].Value = this.PCunit.Value;                        break;
                    case 'WA' : gBusses['AB'].Value = this.PCunit.Value;                        break;
                    case 'RST': this.PCunit.Value = 255;                                        break;
                    case '++' : this.PCunit.Value++;  this.PCunit.Value %= 256;                 break;
                }
            }
        }
    }
}
{// class cIR
    function cIR() {
        var IRunit;
        this.IRunit = new cUnit('IR',140,240,['RD'],['f3','f2','f1','f0']);
        gUnits['IR'] = this;
    }
    cIR.prototype.Draw = function() {
        this.IRunit.Draw();
    }
    cIR.prototype.Tick = function() {
        var lSignalID;
        for (var i = 0; i < this.IRunit.Inputs.length; i++) {
            lSignalID = SignalID('IR',this.IRunit.Inputs[i]);
            if (gSignals[lSignalID].Level == 1) {
                switch(this.IRunit.Inputs[i]) {
                    case 'RD' : this.IRunit.Value = gBusses['DB'].Value; break;
                }
            }
        }
    }
}
{// class cSP
    function cSP() {
        var SPunit;
        this.SPunit = new cUnit('SP',360,200,['RD','WD']);
        gUnits['SP'] = this;
    }
    cSP.prototype.Draw = function() {
        this.SPunit.Draw();
    }
    cSP.prototype.Tick = function() {
        var lSignalID;
        for (var i = 0; i < this.SPunit.Inputs.length; i++) {
            lSignalID = SignalID('SP',this.SPunit.Inputs[i]);
            if (gSignals[lSignalID].Level == 1) {
                switch(this.SPunit.Inputs[i]) {
                    case 'RD' :                       this.SPunit.Value = gBusses['DB'].Value; break;
                    case 'WD' : gBusses['DB'].Value = this.SPunit.Value;                       break;
                }
            }
        }
    }
}
{// class cAD
    function cAD() {
        var ADunit;
        this.ADunit = new cUnit('AD',720,120,['RA']);
        gUnits['AD'] = this;
    }
    cAD.prototype.Draw = function() {
        this.ADunit.Draw();
    }
    cAD.prototype.Tick = function() {
        var lSignalID;
        for (var i = 0; i < this.ADunit.Inputs.length; i++) {
            lSignalID = SignalID('AD',this.ADunit.Inputs[i]);
            if (gSignals[lSignalID].Level == 1) {
                switch(this.ADunit.Inputs[i]) {
                    case 'RA' :                       this.ADunit.Value = gBusses['AB'].Value; break;
                }
            }
        }
    }
}
{// class cML
    function cML() {
        var MLunit;
        this.MLunit = new cUnit('ML',360,24,['RD','WD','WA']);
        gUnits['ML'] = this;
    }
    cML.prototype.Draw = function() {
        this.MLunit.Draw();
    }
    cML.prototype.Tick = function() {
        var lSignalID;
        for (var i = 0; i < this.MLunit.Inputs.length; i++) {
            lSignalID = SignalID('ML',this.MLunit.Inputs[i]);
            if (gSignals[lSignalID].Level == 1) {
                switch(this.MLunit.Inputs[i]) {
                    case 'RD' :                       this.MLunit.Value = gBusses['DB'].Value; break;
                    case 'WD' : gBusses['DB'].Value = this.MLunit.Value;                       break;
                    case 'WA' : gBusses['AB'].Value = this.MLunit.Value;                       break;
                }
            }
        }
    }
}
{// class cAC
    function cAC() {
        var ACunit;
        this.ACunit = new cUnit('AC',360,560,['RD','WD','RU']);
        gUnits['AC'] = this;
    }
    cAC.prototype.Draw = function() {
        this.ACunit.Draw();
    }
    cAC.prototype.Tick = function() {
        var lSignalID;
        for (var i = 0; i < this.ACunit.Inputs.length; i++) {
            lSignalID = SignalID('AC',this.ACunit.Inputs[i]);
            if (gSignals[lSignalID].Level == 1) {
                switch(this.ACunit.Inputs[i]) {
                    case 'RU' :                       this.ACunit.Value = gBusses['UB'].Value; break;
                    case 'RD' :                       this.ACunit.Value = gBusses['DB'].Value; break;
                    case 'WD' : gBusses['DB'].Value = this.ACunit.Value;                       break;
                }
            }
        }
    }
}
{// class cFL
    function cFL() {
        var FLunit;
        this.FLunit = new cUnit('FL',140,480,['RD','WD'],['N','V','C','Z']);
        gUnits['FL'] = this;
    }
    cFL.prototype.Draw = function() {
        this.FLunit.Draw();
    }
    cFL.prototype.Tick = function() {
        var lSignalID;
        for (var i = 0; i < this.FLunit.Inputs.length; i++) {
            lSignalID = SignalID('FL',this.FLunit.Inputs[i]);
            if (gSignals[lSignalID].Level == 1) {
                switch(this.FLunit.Inputs[i]) {
                    case 'RA' :                       this.FLunit.Value = gBusses['AB'].Value; break;
                }
            }
        }
    }
}
{// class cOA
    function cOA() {
        var OAunit;
        this.OAunit = new cUnit('OA',360,480,['RD']);
        gUnits['OA'] = this;
    }
    cOA.prototype.Draw = function() {
        this.OAunit.Draw();
    }
    cOA.prototype.Tick = function() {
        var lSignalID;
        for (var i = 0; i < this.OAunit.Inputs.length; i++) {
            lSignalID = SignalID('OA',this.OAunit.Inputs[i]);
            if (gSignals[lSignalID].Level == 1) {
                switch(this.OAunit.Inputs[i]) {
                    case 'RD' :                       this.OAunit.Value = gBusses['DB'].Value; break;
                }
            }
        }
    }
}
{// class cOB
    function cOB() {
        var OBunit;
        this.OBunit = new cUnit('OB',360,320,['1','-B','RD']);
        gUnits['OB'] = this;
    }
    cOB.prototype.Draw = function() {
        this.OBunit.Draw();
    }
    cOB.prototype.Tick = function() {
        var lSignalID;
        var lIR = toBin(gUnits['IR'].IRunit.Value);
        var li3 = lIR.substr(7-3,1) == '1';
        var li1 = lIR.substr(7-1,1) == '1';
        var li0 = lIR.substr(7-0,1) == '1';
        var FlagNegate = !li3 && li1; gSignals['OB.-B'].Level = (FlagNegate) ? 1 : 0;
        var FlagRead1  = !li3 && li0; gSignals['OB.1' ].Level = (FlagRead1 ) ? 1 : 0;
        for (var i = 0; i < this.OBunit.Inputs.length; i++) {
            lSignalID = SignalID('OB',this.OBunit.Inputs[i]);
            if (gSignals[lSignalID].Level == 1) {
                switch(this.OBunit.Inputs[i]) {
                    case 'RD': this.OBunit.Value = (FlagRead1) ? 1 : gBusses['DB'].Value;
                               if (FlagNegate) this.OBunit.Value = -this.OBunit.Value;
                               break;
                }
            }
        }
    }
}
{// class cOC
    function cOC() {
        var OCunit;
        this.OCunit = new cUnit('OC',360,400,['0','C','SC']); //  SC = Set Carry for ALU computation
        this.OCunit.Value = 0;
        gUnits['OC'] = this;
    }
    cOC.prototype.Draw = function() {
        this.OCunit.Draw();
    }
    cOC.prototype.Tick = function() {
        var lSignalID;
        var lIR = toBin(gUnits['IR'].IRunit.Value);
        var li5 = lIR.substr(7-5,1) == '1';
        var li0 = lIR.substr(7-0,1) == '1';
        var FlagRead0  = li5 || li0;
        gSignals['OC.0'].Level = ( FlagRead0) ? 1 : 0;
        gSignals['OC.C'].Level = (!FlagRead0) ? 1 : 0;
        for (var i = 0; i < this.OCunit.Inputs.length; i++) {
            lSignalID = SignalID('OC',this.OCunit.Inputs[i]);
            if (gSignals[lSignalID].Level == 1) {
                switch(this.OCunit.Inputs[i]) {
                    case 'SC': this.OCunit.Value = (FlagRead0) ? 0 : 1; break;
                }
            }
        }
    }
}
{// class cAL
    function cAL() {
        var ALunit;
        this.ALunit = new cUnit('AL',460,320,['+','AND','OR','XOR','WU']); //  SC = Set Carry for ALU computation
        this.ALunit.Value = 0;
        gUnits['AL'] = this;
    }
    cAL.prototype.Draw = function() {
        this.ALunit.Draw();
    }
    cAL.prototype.Tick = function() {
        var lSignalID;
        var lIR = toBin(gUnits['IR'].IRunit.Value);
        var li5 = lIR.substr(7-5,1) == '1';
        var li3 = lIR.substr(7-3,1) == '1';
        var li1 = lIR.substr(7-1,1) == '1';
        var li0 = lIR.substr(7-0,1) == '1';
        var FlagLogical = !li5 && li3;
        var FlagAnd     = FlagLogical && !li1 && !li0;
        var FlagOr      = FlagLogical && !li1 &&  li0;
        var FlagXor     = FlagLogical &&  li1 && !li0;
        gSignals['AL.+'  ].Level = (!FlagLogical) ? 1 : 0;
        gSignals['AL.AND'].Level = (FlagAnd     ) ? 1 : 0;
        gSignals['AL.OR' ].Level = (FlagOr      ) ? 1 : 0;
        gSignals['AL.XOR'].Level = (FlagXor     ) ? 1 : 0;
        var lOA = gUnits['OA'].OAunit.Value;
        var lOB = gUnits['OB'].OBunit.Value;
        var lOC = gUnits['OC'].OCunit.Value;
        if (!FlagLogical) this.ALunit.Value = lOA + lOB + lOC;
        if (FlagAnd     ) this.ALunit.Value = lOA & lOB;
        if (FlagOr      ) this.ALunit.Value = lOA | lOB;
        if (FlagXor     ) this.ALunit.Value = lOA ^ lOB;
        for (var i = 0; i < this.ALunit.Inputs.length; i++) {
            lSignalID = SignalID('AL',this.ALunit.Inputs[i]);
            if (gSignals[lSignalID].Level == 1) {
                switch(this.ALunit.Inputs[i]) {
                    case 'WU' : gBusses['UB'].Value = this.ALunit.Value; break;
                }
            }
        }
    }
}
{// class cSR
    function cSR() {
        var SRunit;
        this.SRunit = new cUnit('SR',460,480,['<','>','WU']);
        gUnits['SR'] = this;
    }
    cSR.prototype.Draw = function() {
        this.SRunit.Draw();
    }
    cSR.prototype.Tick = function() {
        var lSignalID;
        var lIR = toBin(gUnits['IR'].IRunit.Value);
        var li1 = lIR.substr(7-1,1) == '1';
        var FlagShiftRight = li1;
        gSignals['SR.<'].Level = (FlagShiftRight) ? 0 : 1;
        gSignals['SR.>'].Level = (FlagShiftRight) ? 1 : 0;
        var lOA = gUnits['OA'].OAunit.Value;
        var lOC = gUnits['OC'].OCunit.Value;
        this.SRunit.Value = (FlagShiftRight) ? (256 * lOC + lOA) >> 1 : lOA << 1 + lOC;
        for (var i = 0; i < this.SRunit.Inputs.length; i++) {
            lSignalID = SignalID('SR',this.SRunit.Inputs[i]);
            if (gSignals[lSignalID].Level == 1) {
                switch(this.SRunit.Inputs[i]) {
                    case 'WU' : gBusses['UB'].Value = this.SRunit.Value; break;
                }
            }
        }
    }
}
{// class cCK
    function cCK() {
        var CKunit;
        this.CKunit = new cUnit('CK',20,160,['p0','p1']);
        gUnits['CK'] = this;
    }
    cCK.prototype.Draw = function() {
        this.CKunit.Draw();
    }
    cCK.prototype.Tick = function() {
        var lSignalID;
        for (var i = 0; i < this.CKunit.Inputs.length; i++) {
            lSignalID = SignalID('CK',this.CKunit.Inputs[i]);
            if (gSignals[lSignalID].Level == 1) {
                switch(this.CKunit.Inputs[i]) {
                    case 'RA' :                       this.CKunit.Value = gBusses['AB'].Value; break;
                }
            }
        }
    }
}
{// class cIC
    function cIC() {
        var ICunit;
        this.ICunit = new cUnit('IC',20,240,['p0','p1'],['t0','t1','t2','t3','t4','t5','t6','t7']);
        gUnits['IC'] = this;
    }
    cIC.prototype.Draw = function() {
        this.ICunit.Draw();
    }
    cIC.prototype.Tick = function() {
        var lSignalID;
        for (var i = 0; i < this.ICunit.Inputs.length; i++) {
            lSignalID = SignalID('IC',this.ICunit.Inputs[i]);
            if (gSignals[lSignalID].Level == 1) {
                switch(this.ICunit.Inputs[i]) {
                    case 'RA' :                       this.ICunit.Value = gBusses['AB'].Value; break;
                }
            }
        }
    }
}
{// class cMM
    function cMM() {
        var MMunit;
        var Values;
        this.Values = [];
        for (var i = 0; i < 256; i++) this.Values.push(Math.floor(Math.random() * 256));
        this.Values[255] = parseInt('10000000',2); // Reset vector naar $80
        this.Values[10]  = parseInt('01001110',2); // Startwaarde van te verhogen waarde
        var lPC = parseInt('10000000',2);
        this.Values[lPC++] = parseInt('11010000',2); // LDA nn instructie
        this.Values[lPC++] = parseInt('00001010',2); //     nn = $0A
        this.Values[lPC++] = parseInt('00000001',2); // INA    instructie
        this.Values[lPC++] = parseInt('11010001',2); // STA nn instructie
        this.Values[lPC++] = parseInt('00001010',2); //     nn = $0A
        this.Values[lPC++] = parseInt('00010101',2); // TAS    instructie
        this.Values[lPC++] = parseInt('11110000',2); // JMP nn instructie
        this.Values[lPC++] = parseInt('10000000',2); //     nn = $80
        this.MMunit = new cUnit('MM',140,24,['RD','WD']);
        gUnits['MM'] = this;
    }
    cMM.prototype.GetValue = function() { return this.Values[gUnits['AD'].ADunit.Value]; }
    cMM.prototype.SetValue = function(pValue) {  this.Values[gUnits['AD'].ADunit.Value] = pValue; }
    cMM.prototype.Draw = function() {
        this.MMunit.Value = this.GetValue();
        this.MMunit.Draw();
    }
    cMM.prototype.Tick = function() {
        var lSignalID;
        for (var i = 0; i < this.MMunit.Inputs.length; i++) {
            lSignalID = SignalID('MM',this.MMunit.Inputs[i]);
            if (gSignals[lSignalID].Level == 1) {
                switch(this.MMunit.Inputs[i]) {
                    case 'RD' :                       this.SetValue(gBusses['DB'].Value); break;
                    case 'WD' : gBusses['DB'].Value = this.GetValue();                    break;
                }
            }
        }
    }
}
{// PLA
    function PLA_INA(pPhase) {   //  INA    Increment accumulator
        if (pPhase == 2) { document.getElementById("tick-signals").innerHTML += '<br />INA'; }
        if (pPhase == 3) { NextInstruction(); NextTick.Cycle--; }
        switch (pPhase) {
            case 2: return ['AC.WD','OA.RD','OB.RD','OC.RD']; break; // OA=AC, OB=1 Zet de accu in operand A van de ALU, zet operand B op 1
            case 3: return ['AL.WU','AC.RU'];                 break; // AC=ALU
        }
    }
    function PLA_LDA_nn(pPhase) {   //  LDA nn  Load accumulator from memory address
        if (pPhase == 2) { document.getElementById("tick-signals").innerHTML += '<br />LDA nn'; }
        if (pPhase == 3) { NextInstruction(); NextTick.Cycle--; }
        switch (pPhase) {
            case 2: return ['PC.WA','AD.RA','MM.WD','ML.RD'];         break; // ML=(PC) Haal het adres vanwaar AC geladen moet worden
            case 3: return ['ML.WA','AD.RA','MM.WD','AC.RD','PC.++']; break; // AC=(ML), PC++  Laad AC uit geheugen, verhoog PC
        }
    }
    function PLA_STA_nn(pPhase) {   //  STA nn  Store accumulator in memory address
        if (pPhase == 2) { document.getElementById("tick-signals").innerHTML += '<br />STA nn'; }
        if (pPhase == 3) { NextInstruction(); NextTick.Cycle--; }
        switch (pPhase) {
            case 2: return ['PC.WA','AD.RA','MM.WD','ML.RD'];         break; // ML=(PC) Haal het adres waar AC in opgeslagen moet worden
            case 3: return ['ML.WA','AD.RA','AC.WD','MM.RD','PC.++']; break; // (ML)=AC, PC++  Zet AC in geheugen, verhoog PC
        }
    }
    function PLA_TAS(pPhase) {   //  TAS    Load stack pointer from accumulator
        if (pPhase == 2) {
            document.getElementById("tick-signals").innerHTML += '<br />TAS';
            NextInstruction();
            NextTick.Cycle--;
        }
        switch (pPhase) {
            case 2: return ['AC.WD','SP.RD']; break; // SP=AC
        }
    }
    function PLA_JMP_nn(pPhase) {   //  JMP nn  Jump to location nn
        if (pPhase == 2) { document.getElementById("tick-signals").innerHTML += '<br />JMP nn'; }
        if (pPhase == 3) { NextInstruction(); NextTick.Cycle--; }
        switch (pPhase) {
            case 2: return ['PC.WA','AD.RA','MM.WD','ML.RD'];   break; // ML=(PC) Haal het adres vanwaar PC geladen moet worden
            case 3: return ['ML.WD','PC.RD'];                   break; // PC=(ML) Laad PC uit geheugen
        }
    }
    function PLA(pPhase) {
        if (pPhase == 0) return ['PC.WA','AD.RA','MM.WD','IR.RD'];
        if (pPhase == 1) return ['PC.++'];
        var lIns = gUnits['IR'].IRunit.Value;    //  Instructie
        switch (lIns) {
            case parseInt('00000001',2): return PLA_INA   (pPhase); break;   // INA
            case parseInt('11010000',2): return PLA_LDA_nn(pPhase); break;   // LDA nn
            case parseInt('11010001',2): return PLA_STA_nn(pPhase); break;   // STA nn
            case parseInt('00010101',2): return PLA_TAS   (pPhase); break;   // TAS
            case parseInt('11110000',2): return PLA_JMP_nn(pPhase); break;   // JMP nn
        }
    }
}
function NextInstruction() {
    NextTick.Cycle = 0;
    NextTick.Time++;
}
function ResetClock() {
    NextTick.Cycle = 0;
    NextTick.Time  = 0;
}
function NextTick() {
    var lSignalIDs = [];
    var lNextIDs   = [];
    lSignalIDs = (NextTick.Time < gPSigs.length) ? gPSigs[NextTick.Time] : [];
    NextTick.Time++;
    lNextIDs = (NextTick.Time < gPSigs.length) ? gPSigs[NextTick.Time] : [];
    console.log(lSignalIDs);
    document.getElementById("tick-signals").innerHTML += '<br />' + lNextIDs;
    if (lSignalIDs.length > 0) {
        lSignalIDs.forEach(function(ID) { gSignals[ID].Level = 1 });
        lSignalIDs.forEach(function(ID) {
            var lUnitID = gSignals[ID].UnitName.substr(0,2);
            gUnits[lUnitID].Tick();
        });
    }
    Object.keys(gUnits).forEach( function(ID) { gUnits[ ID].Draw(); });
    Object.keys(gBusses).forEach(function(ID) { gBusses[ID].Draw(); });
    if (lSignalIDs.length > 0) lSignalIDs.forEach(function(ID) { gSignals[ID].Level = 0 });
}
function NextSignals() {
    gSignalIDs = PLA(NextTick.Cycle);
    document.getElementById("tick-signals").innerHTML += '<br />' + gSignalIDs;
    if (gSignalIDs == undefined) {
        clearInterval(fRunSignal);
    } else {
        NextTick.Cycle++;
        if (NextTick.Cycle > 7) { NextInstruction(); }
        gSignalIDs.forEach(function(ID) { gSignals[ID].Level = 1 });
        Object.keys(gUnits).forEach( function(ID) { gUnits[ ID].Draw(); });
        Object.keys(gBusses).forEach(function(ID) { gBusses[ID].Draw(); });
        document.getElementById("button-next-signals").style.visibility = "hidden";
        document.getElementById("button-process-signals").style.visibility = "visible";
    }
}
function ProcessSignals() {
    if (gSignalIDs != undefined) {
        gSignalIDs.forEach(function(ID) { gSignals[ID].Level = 1 });
        gSignalIDs.forEach(function(ID) {
            var lUnitID = gSignals[ID].UnitName.substr(0,2);
            gUnits[lUnitID].Tick();
        });
    }
    gUnits['AL'].Tick();
    gUnits['SR'].Tick();
    Object.keys(gUnits).forEach( function(ID) { gUnits[ ID].Draw(); });
    Object.keys(gBusses).forEach(function(ID) { gBusses[ID].Draw(); });
    if (gSignalIDs != undefined) gSignalIDs.forEach(function(ID) { gSignals[ID].Level = 0 });
    document.getElementById("button-next-signals").style.visibility = "visible";
    document.getElementById("button-process-signals").style.visibility = "hidden";
}
function HaltCPU() { clearInterval(fRunSignal); }
function RunSignal() {
    NextSignals();
    ProcessSignals();
}
function RunSignals() {
    fRunSignal = setInterval(RunSignal, 1000);
}
