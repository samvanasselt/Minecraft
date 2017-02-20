var gCanvas;
var gUnits   = [];
var gBusses  = [];
var gSignals = [];
var gSignalIDs = [];
var gSignalPairs  = [];
var gSignalSets       = [];
var gInstructions = [];
var gMnemonicQueue = [];
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
    gUnits['IC'].ResetIC();
    var lResetSignals = [];
    lResetSignals.push(['PC.RST'        ]);
    lResetSignals.push(['PC.WA' ,'AD.RA']);
    lResetSignals.push(['MM.WD' ,'PC.RD']);
    lResetSignals.push([]);
    for (var i = 0; i < lResetSignals.length; i++) {
        gSignalIDs = lResetSignals[i];
        ProcessSignals();
    }
    gUnits['IC'].ResetIC();
    cPLA.SetIndex = 99;
}
{// class cSignalPair
    function cSignalPair(pPairName, pFromName, pToName) { //  = undefined) {
        var PairName;
        var FromName;
        var ToName;
        this.PairName = pPairName;
        this.FromName = pFromName;
        this.ToName   = pToName;
        gSignalPairs[this.PairName] = this;
    }
    cSignalPair.prototype.SetLevel = function(pLevel) {
        gSignals[this.FromName].Level = pLevel;
        if (this.ToName != undefined) gSignals[this.ToName].Level = pLevel;
    }
    cSignalPair.prototype.Tick = function() {
        var lUnitID;
        lUnitID = gSignals[this.FromName].UnitName.substr(0,2);
        gUnits[lUnitID].Tick();
        if (this.ToName != undefined) {
            lUnitID = gSignals[this.ToName].UnitName.substr(0,2);
            gUnits[lUnitID].Tick();
        }
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
    new cSignalPair('FL=SH'        ,'FL.SH');   //  Load N   C Z flags from ALU
    new cSignalPair('FL=AL'        ,'FL.AL');   //  Load N V C Z flags from ALU
    new cSignalPair('FL=NZ'        ,'FL.NZ');   //  Load N     Z flags from ALU
    new cSignalPair('FL=DB'        ,'FL.DB');   //  Load N     Z flags from data bus
    new cSignalPair('CY=i1'        ,'FL.CY');   //  Read Carry from instruction bit 1
    new cSignalPair('IC.RS'        ,'IC.RS');   //  Reset instruction clock
    new cSignalPair('IC.CR'        ,'IC.CR');   //  Conditional reset instruction clock
}
{// class gCycleSignalSet
    function cSignalSet(pSetName, pSignalPairs) {
        var SetName;
        var SignalPairIDs;
        this.SetName = pSetName;
        this.SignalPairIDs = (pSignalPairs == undefined) ? [] : pSignalPairs.split(",");
        gSignalSets[this.SetName] = this;
    }
    cSignalSet.prototype.SignalPairs = function() {
        var lPairs = [];
        for (var i = 0; i < this.SignalPairIDs.length; i++) {
            lPairs.push(gSignalPairs[this.SignalPairIDs[i]]);
        }
        return lPairs;
    }
}
function InitCycles() {
    if (gSignalPairs.length == 0) InitSignalPairs();
    new cSignalSet('IR=(PC)'  ,'AD=PC,IR=MM'                );  //  Read instruction register from memory location PC
    new cSignalSet('PC++'     ,'PC++'                       );  //  Increment program counter
    new cSignalSet('PC=ML'    ,'PC=ML'                      );  //  Jump to location ML
    new cSignalSet('PC=AL'    ,'PC=AL'                      );  //  Jump to location calculated by ALU for branch
    new cSignalSet('PC=(SP)'  ,'AD=SP,PC=MM'                );  //  Read program counter from memory location SP
    new cSignalSet('AD=ML'    ,'AD=ML'                      );  //  Prepare save to memory location ML
    new cSignalSet('AD=SP'    ,'AD=SP'                      );  //  Prepare save to memory location SP
    new cSignalSet('ML=(PC)'  ,'AD=PC,ML=MM'                );  //  Read memory latch from memory location PC
    new cSignalSet('AL=AC±1'  ,'OA=AC,OB,OC'                );  //  Add to or Subtract 1 from accumulator (for INA en DEA)
    new cSignalSet('LDA #'    ,      'AC=ML,FL=DB,PC++'     );  //  Load accumulator from memory latch and set N- and Z-flag, PC++
    new cSignalSet('LDA nn'   ,'AD=ML,AC=MM,FL=DB,PC++'     );  //  Load accumulator from memory location ML and set N,Z-flags, PC++
    new cSignalSet('AC=AL'    ,'AC=AL,FL=AL'                );  //  Store calculation result in accumulator and set V,N,C,Z-flags
    new cSignalSet('AC=SH'    ,'AC=SH,FL=SH'                );  //  Store shift result in accumulator and set N,C,Z-flags
    new cSignalSet('FL=(SP)'  ,'AD=SP,FL=MM'                );  //  Load flags from stack (memory address SP)
    new cSignalSet('FL=A±ML'  ,      'OB=ML,OC,FL=AL'       );  //  Compare ML with accumulator
    new cSignalSet('FL=A±(ML)','AD=ML,OB=MM,OC,FL=AL'       );  //  Compare (ML) with accumulator
    new cSignalSet('AC=A±ML'  ,      'OB=ML,OC,AC=AL,FL=AL' );  //  Add ML to or Subtract ML from accumulator
    new cSignalSet('AC=A±(ML)','AD=ML,OB=MM,OC,AC=AL,FL=AL' );  //  Add (ML) to or Subtract (ML) from accumulator
    new cSignalSet('AC=A·(ML)','AD=ML,OB=MM,OC,AC=AL,FL=NZ' );  //  Logical operation between (ML) and accumulator
    new cSignalSet('AC=A·ML'  ,      'OB=ML,OC,AC=AL,FL=NZ' );  //  Logical operation between ML and accumulator
    new cSignalSet('AC=(SP)'  ,'AD=SP,AC=MM,FL=DB'          );  //  Load accumulator from memory location SP
    new cSignalSet('AC=SP'    ,'AC=SP,FL=DB'                );  //  Load accumulator from stack pointer
    new cSignalSet('(AD)=AC'  ,'MM=AC,FL=DB'                );  //  Store accumulator in memory location AD
    new cSignalSet('(AD)=FL'  ,'MM=FL'                      );  //  Store flags in memory location AD (PHP)
    new cSignalSet('(AD)=PC'  ,'MM=PC'                      );  //  Store PC in memory location AD (JSR)
    new cSignalSet('AL=SP±1'  ,'OA=SP,OB,OC'                );  //  Calculate stack pointer ± 1
    new cSignalSet('A=AC'     ,'OA=AC,OC'                   );  //  Calculate AC + C from instruction
    new cSignalSet('A=PC'     ,'OA=AC,OC'                   );  //  Calculate PC + C from instruction
    new cSignalSet('SH=C<AC>C','OA=AC,OC'                   );  //  Shift accumulator from instruction
    new cSignalSet('CY=i1'    ,'CY=i1'                      );  //  Read Carry from instruction bit 1
    new cSignalSet('SP=AL'    ,'SP=AL'                      );  //  Load stack pointer from ALU
    new cSignalSet('SP=AC'    ,'SP=AC,FL=DB'                );  //  Load stack pointer from accumulator
    new cSignalSet('BRA-3'    ,'AD=PC,OB=ML,OC,PC++,IC.CR'  );  //  B=ML, PC++
    new cSignalSet('JSR-3'    ,'OA=SP,OB,OC,PC++'           );  //  AL=SP+1, PC++
    new cSignalSet('NOP'      ,undefined                    );  //  No operation
}
{// class cInstruction
    function cInstruction(pOpcode, pMnemonic, pSignalSets) {
        var AddressMode; // 00 = Implied, 01 = Immediate, 11 = Direct
        var CT;
        var Operation;
        var Mnemonic;
        var SignalSets;
        var SignalPairs;
        var Value;
        var lOpcode = pOpcode.split(",");
        this.AddressMode  = lOpcode[0];
        this.CT           = lOpcode[1];
        this.Operation    = lOpcode[2];
        this.Mnemonic     = pMnemonic;
        if (pSignalSets == '') { this.SignalSetIDs = [];                     }
        else                   { this.SignalSetIDs = pSignalSets.split(","); }
        this.InitSignalPairs();
        this.Value = parseInt(lOpcode.join(''),2);
        gInstructions[this.Value] = this;
    }
    cInstruction.prototype.InitSignalPairs = function() {
        var iCycle = 0;
        this.SignalPairs  = [];
        this.SignalPairs.push(gSignalSets['IR=(PC)'].SignalPairs()); iCycle++;
        this.SignalPairs.push(gSignalSets['PC++'   ].SignalPairs()); iCycle++;
        for (var i = 0; i < this.SignalSetIDs.length; i++) {
            try {
                this.SignalPairs.push(gSignalSets[this.SignalSetIDs[i]].SignalPairs());
            }
            catch(err) {
                console.log('SignalSet ID[\'' + this.SignalSetIDs[i] + '\'] not found. ');
            }
            if (i == this.SignalSetIDs.length - 1)
                this.SignalPairs[iCycle].push(gSignalPairs['IC.RS']);
            iCycle++;
        }
    }
    cInstruction.prototype.SetName = function(pCycle) {
        if (pCycle - 2 < this.SignalSetIDs.length) {
            return this.SignalSetIDs[pCycle - 2];
        }
        else
            return 'NOP';
    }
    cInstruction.prototype.SignalSet = function(pCycle) {
        if (pCycle - 2 < this.SignalSetIDs.length) {
            var lSetID = this.SignalSetIDs[pCycle - 2];
            return gSignalSets[lSetID];
        }
        else
            return [];
    }
}
function InitInstructions() {
    if (gSignalSets.length == 0) InitCycles();
    new cInstruction('00,00,0001','INA'   ,'AL=AC±1,AC=AL');
    new cInstruction('00,00,0011','DEA'   ,'AL=AC±1,AC=AL');
    new cInstruction('00,00,0100','ROL'   ,'SH=C<AC>C,AC=SH');      //  SH =    AC<CY
    new cInstruction('00,00,0101','ASL'   ,'SH=C<AC>C,AC=SH');        //  SH =    AC<0
    new cInstruction('00,00,0100','ROR'   ,'SH=C<AC>C,AC=SH');       //  SH = CY>AC
    new cInstruction('00,00,0100','LSR'   ,'SH=C<AC>C,AC=SH');        //  SH =  0>AC
    new cInstruction('00,01,0001','PLA'   ,'AC=(SP),AL=SP±1,SP=AL');
    new cInstruction('00,01,0011','PHA'   ,'AL=SP±1,SP=AL,AD=SP,(AD)=AC');
    new cInstruction('00,01,0100','TSA'   ,'AC=SP');
    new cInstruction('00,01,0101','TAS'   ,'SP=AC');
    new cInstruction('00,01,0111','NOP'   ,'');
    new cInstruction('00,10,0001','RTS'   ,'PC=(SP),AL=SP±1,SP=AL');
    new cInstruction('00,11,0001','PLP'   ,'FL=(SP),AL=SP±1,SP=AL');
    new cInstruction('00,11,0011','PHP'   ,'AL=SP±1,SP=AL,AD=SP,(AD)=FL');
    new cInstruction('00,11,0000','CLC'   ,'CY=i1');
    new cInstruction('00,11,0010','SEC'   ,'CY=i1');
    new cInstruction('01,00,0000','ADC #' ,'ML=(PC),A=AC,AC=A±ML,PC++');
    new cInstruction('01,00,0010','SBC #' ,'ML=(PC),A=AC,AC=A±ML,PC++');
    new cInstruction('01,00,1000','AND #' ,'ML=(PC),A=AC,AC=A·ML,PC++');
    new cInstruction('01,00,1001','ORA #' ,'ML=(PC),A=AC,AC=A·ML,PC++');
    new cInstruction('01,00,1010','EOR #' ,'ML=(PC),A=AC,AC=A·ML,PC++');
    new cInstruction('01,01,0000','LDA #' ,'ML=(PC),LDA #');
    new cInstruction('01,01,0010','CMP #' ,'ML=(PC),A=AC,FL=A±ML,PC++');
    new cInstruction('11,00,0000','ADC nn','ML=(PC),A=AC,AC=A±(ML),PC++');
    new cInstruction('11,00,0010','SBC nn','ML=(PC),A=AC,AC=A±(ML),PC++');
    new cInstruction('11,00,1000','AND #' ,'ML=(PC),A=AC,AC=A·(ML),PC++');
    new cInstruction('11,00,1001','ORA #' ,'ML=(PC),A=AC,AC=A·(ML),PC++');
    new cInstruction('11,00,1010','EOR #' ,'ML=(PC),A=AC,AC=A·(ML),PC++');
    new cInstruction('11,01,0000','LDA nn','ML=(PC),LDA nn');
    new cInstruction('11,01,0001','STA nn','ML=(PC),AD=ML,(AD)=AC,PC++');
    new cInstruction('11,01,0010','CMP nn','ML=(PC),A=AC,FL=A±(ML),PC++');
    new cInstruction('11,10,1000','BCC nn','ML=(PC),BRA-3,A=PC,PC=AL');    //  Conditional reset if test fails
    new cInstruction('11,10,1001','BCS nn','ML=(PC),BRA-3,A=PC,PC=AL');    //  Conditional reset if test fails
    new cInstruction('11,10,1010','BEQ nn','ML=(PC),BRA-3,A=PC,PC=AL');    //  Conditional reset if test fails
    new cInstruction('11,10,1011','BNE nn','ML=(PC),BRA-3,A=PC,PC=AL');    //  Conditional reset if test fails
    new cInstruction('11,10,1100','BVC nn','ML=(PC),BRA-3,A=PC,PC=AL');    //  Conditional reset if test fails
    new cInstruction('11,10,1101','BVS nn','ML=(PC),BRA-3,A=PC,PC=AL');    //  Conditional reset if test fails
    new cInstruction('11,10,1110','BPL nn','ML=(PC),BRA-3,A=PC,PC=AL');    //  Conditional reset if test fails
    new cInstruction('11,10,1111','BMI nn','ML=(PC),BRA-3,A=PC,PC=AL');    //  Conditional reset if test fails
    new cInstruction('11,11,0000','JMP nn','ML=(PC),PC=ML');
    new cInstruction('11,11,0011','JSR nn','ML=(PC),JSR-3,SP=AL,AD=SP,(AD)=PC,PC=ML');
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
    InitInstructions();
    ResetClock();
    InitCPUcanvas();
    new cMM();
    new cML();
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
    new cSH();
    new cAC();
    new cAD();
    //
    gBusses['DB'] = new cBus('DB'); gBusses['DB'].BusBox.SetXYh(160, 24, 560);
    gBusses['UB'] = new cBus('UB'); gBusses['UB'].BusBox.SetXYh(520,110, 560-110+24);
    gBusses['AB'] = new cBus('AB'); gBusses['AB'].BusBox.SetXYh(620, 24, 260);
    //
    Object.keys(gUnits).forEach( function(ID) { gUnits[ ID].Draw(); });
    Object.keys(gBusses).forEach(function(ID) { gBusses[ID].Draw(); });
    // var lIF = new cUnit('IF'); lIF.UnitBox.SetXY(140,160);
    // lIF.Draw();
    ResetCPU();
    // document.getElementById("button-next-signals").style.visibility = "visible";
    // document.getElementById("button-process-signals").style.visibility = "hidden";
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
    cUnitBox.prototype.LineToBus = function(pSignalID, pBusID, pRW)  {
        var lBusBox = gBusses[pBusID].BusBox;
        var x = (this.x < lBusBox.x) ? this.x + this.w : lBusBox.x + lBusBox.w;
        var w = (this.x < lBusBox.x) ? lBusBox.x - x   : this.x - x;
        var y = (pRW == 'RD') ? this.y + 32 : this.y + 24;
        if (gSignals[pSignalID].Level == 1) gCanvas.strokeStyle = (pRW == 'RD') ? 'hsl(  0, 100%, 75%)' : 'hsl(120, 100%, 75%)';
        else                                gCanvas.strokeStyle = 'hsl(  0,   0%, 75%)';
        gCanvas.beginPath();
        gCanvas.rect(x, y, w, 3);
        gCanvas.stroke();
        if (gSignals[pSignalID].Level == 1) lBusBox.DrawActiveBus();
    }
    cUnitBox.prototype.DrawBox = function(pValue) { // = undefined) {
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
    // function cUnit(pNaam, pX = undefined, pY = undefined, pInputs = undefined, pOutputs = undefined) {
    function cUnit(pNaam, pX, pY, pInputs, pOutputs) {
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
                switch (this.Inputs[i]) {
                    case 'RD': this.UnitBox.LineToBus(lSignalID,'DB','RD');  break;
                    case 'WD': this.UnitBox.LineToBus(lSignalID,'DB','WD');  break;
                    case 'RU': this.UnitBox.LineToBus(lSignalID,'UB','RD');  break;
                    case 'WU': this.UnitBox.LineToBus(lSignalID,'UB','WD');  break;
                    case 'RA': this.UnitBox.LineToBus(lSignalID,'AB','RD');  break;
                    case 'WA': this.UnitBox.LineToBus(lSignalID,'AB','WD');  break;
                    default:                                                 break;
                }
            }
            gCanvas.strokeStyle = 'hsl(  0,   0%, 50%)';
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
            gCanvas.strokeStyle = 'hsl(  0,   0%, 50%)';
            gCanvas.beginPath();
            gCanvas.rect(this.UnitBox.x, y, this.UnitBox.w, 10 * n + 4);
            gCanvas.stroke();
        }
        this.UnitBox.DrawBox(this.Value);
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
        this.w = 72;
        this.h = 0;
    }
    cBusBox.prototype.SetXYh = function(pX,pY,pH) { this.x = pX; this.y = pY; this.h = pH;}
    cBusBox.prototype.DrawActiveBus = function() {
        gCanvas.strokeStyle = 'hsl(60, 100%, 75%)'; // Geel, Max verzadiging, Driekwart licht.
        gCanvas.beginPath();
        gCanvas.rect(this.x, this.y, this.w, this.h);
        gCanvas.stroke();
    }
    // cBusBox.prototype.DrawBox = function(pValue = undefined) {
    cBusBox.prototype.DrawBox = function(pValue) {
        gCanvas.clearRect(this.x, this.y, this.w, this.h);
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
            gCanvas.fillRect(this.x + 63 - 8 * i, this.y + 28, 2, this.h - 32);
            gCanvas.stroke();
            gCanvas.fillStyle = 'hsl(0,   0%, 25%)';
            gCanvas.font = "20px Verdana";
            gCanvas.fillText(this.naam,  this.x + 3, this.y + 20);
            gCanvas.fillText(toHex(this.value),this.x + 43, this.y + 20);
        }
    }
}
{// class cBus
    function cBus(pNaam) {
        var Naam;
        var Value;
        var BusBox;
        var Nflag;
        var Zflag;
        this.Naam    = pNaam;
        this.Value   = Math.floor(Math.random() * 256);
        this.BusBox = new cBusBox(this.Naam);
    }
    cBus.prototype.Draw = function() { this.BusBox.DrawBox(this.Value); }
    cBus.prototype.Flags = function() {
        var lFlags = 0;
        this.Nflag = (this.Value > 127) ? true : false;
        this.Zflag = (this.Value == 0);
        if ( this.Nflag) lFlags |= 128;
        if (!this.Zflag) lFlags |=   1;
        return lFlags;
    }
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
//  ==========================================================================  //
{
    function cPLA() {

    }
}
{// class cCK
    function cCK() {
        cUnit.call(this,'CK',20,132,['p0','p1']);
        gUnits['CK'] = this;
    }
    cCK.prototype = Object.create(cUnit.prototype);
    cCK.prototype.Tick = function() {
        var lSignalID;
        for (var i = 0; i < this.Inputs.length; i++) {
            lSignalID = SignalID('CK',this.Inputs[i]);
            if (gSignals[lSignalID].Level == 1) {
                switch(this.Inputs[i]) {
                    case 'RA' :                       this.Value = gBusses['AB'].Value; break;
                }
            }
        }
    }
}
{// class cIC
    function cIC() {
        var RunState = false;
        cUnit.call(this,'IC',20,200,['p0','p1','RS','CR'],['t0','t1','t2','t3','t4','t5','t6','t7']);
        gUnits['IC'] = this;
    }
    cIC.prototype = Object.create(cUnit.prototype);
    cIC.prototype.ResetIC = function(pCycle = 7) {
        this.RunState = false;
        cIC.Cycle = pCycle;
        cPLA.SetName = 'IR=(PC)';
    }
    cIC.prototype.ConditionalResetIC = function() {
        var lIR = gUnits['IR'];
        var lFL = gUnits['FL'];
        var lIns   = gInstructions[lIR.Value];
        var lBranch;
        switch (lIns.Mnemonic) {
            case 'BEQ' : lBranch = !lFL.Flag('Z'); break;
            case 'BNE' : lBranch =  lFL.Flag('Z'); break;
            case 'BCC' : lBranch = !lFL.Flag('C'); break;
            case 'BCS' : lBranch =  lFL.Flag('C'); break;
            case 'BVC' : lBranch = !lFL.Flag('V'); break;
            case 'BVS' : lBranch =  lFL.Flag('V'); break;
            case 'BPL' : lBranch = !lFL.Flag('N'); break;
            case 'BMI' : lBranch =  lFL.Flag('N'); break;
            default: alert('Unexpected conditional reset found for instruction ' + lIns.Mnemonic); break;
        }
        if (!lBranch) this.ResetIC();   //  If branch is not taken, get next instruction
    }
    cIC.prototype.ToggleRunState = function() {
        if (this.RunState) {
            document.getElementById("button-next-pair").style.display = "inline";
            document.getElementById("button-process-pair").style.visibility = "hidden";
        } else {
            document.getElementById("button-next-pair").style.display = "none";
            document.getElementById("button-process-pair").style.visibility = "visible";
        }
        this.RunState = !this.RunState;
    }
    cIC.prototype.CycleShow = function() {
        // var lSignalText = '<br />T' + cIC.Cycle + ': ' + cPLA.SetName + '<br />...';
        // for (var i = 0; i < gSignalSets[cPLA.SetName].SignalPairIDs.length; i++)
            // lSignalText += ' ' + gSignalSets[cPLA.SetName].SignalPairIDs[i];
        // document.getElementById("PLA-signals").innerHTML += lSignalText;
        if (cIC.Cycle == 0) {
            // document.getElementById("instruction").innerHTML = '---';
            document.getElementById("PLA-cycle").innerHTML = '';
        }
        document.getElementById("PLA-cycle").innerHTML += '<br />T' + cIC.Cycle + ': ' + cPLA.SetName;
        for (var i = 0; i < this.Outputs.length; i++)
            gSignals[this.Naam + '.' + this.Outputs[i]].Level = (i == cIC.Cycle) ? 1 : 0;
        cUnit.prototype.Draw.call(this);
    }
    cIC.prototype.CycleNext = function() {
        cPLA.SetIndex = 0;
        cIC.Cycle++;
        if (cIC.Cycle > 7) cIC.Cycle = 0;
        if (cIC.Cycle > 1)
            if (cIC.Cycle >= 2 + gInstructions[gUnits['IR'].Value].SignalSetIDs.length) cIC.Cycle = 0;
        switch (cIC.Cycle) {
            case 0: cPLA.SetName = 'IR=(PC)';                         break;
            case 1: cPLA.SetName = 'PC++';                            break;
            case 2: cPLA.SetName = gUnits['IR'].SetName(cIC.Cycle);   break;
            case 3: cPLA.SetName = gUnits['IR'].SetName(cIC.Cycle);   break;
            case 4: cPLA.SetName = gUnits['IR'].SetName(cIC.Cycle);   break;
            case 5: cPLA.SetName = gUnits['IR'].SetName(cIC.Cycle);   break;
            case 6: cPLA.SetName = gUnits['IR'].SetName(cIC.Cycle);   break;
            case 7: cPLA.SetName = gUnits['IR'].SetName(cIC.Cycle);   break;
        }
    }
    cIC.prototype.SignalShow = function() {
        if (cPLA.SetIndex < gSignalSets[cPLA.SetName].SignalPairIDs.length) {
            if (cPLA.SetIndex == 0) {
                document.getElementById("PLA-signal-pair").innerHTML = '';
            }
            var lPairName = gSignalSets[cPLA.SetName].SignalPairIDs[cPLA.SetIndex];
            var lPair = gSignalPairs[lPairName];
            var lElement = document.getElementById("PLA-signal-pair");
            lElement.innerHTML += '<br />' + lPairName;
            lElement.innerHTML += ': ' + lPair.FromName
            if (!(lPair.ToName == undefined)) lElement.innerHTML += ' ' + gSignalPairs[lPairName].ToName;
        }
    }
    cIC.prototype.SignalRun = function() {
        if (cPLA.SetIndex < gSignalSets[cPLA.SetName].SignalPairIDs.length) {
            var lPairName = gSignalSets[cPLA.SetName].SignalPairIDs[cPLA.SetIndex];
            var lSignalPair = gSignalPairs[lPairName];
            lSignalPair.SetLevel(1);
            lSignalPair.Tick();
            gUnits['AL'].Tick();
            gUnits['SH'].Tick();
            Object.keys(gBusses).forEach(function(ID) { gBusses[ID].Draw(); });
            Object.keys(gUnits).forEach( function(ID) { gUnits[ ID].Draw(); });
            lSignalPair.SetLevel(0);
        }
        this.ToggleRunState();
    }
    cIC.prototype.SignalNext = function() {
        cPLA.SetIndex++;
        if (cPLA.SetIndex >= gSignalSets[cPLA.SetName].SignalPairIDs.length) {
            this.CycleNext();
            this.CycleShow();
        }
        this.ToggleRunState();
    }
    cIC.prototype.NextState = function() {
        if (this.RunState) this.SignalRun(); else this.SignalNext();
    }
    // ,'RS','CR'
    cIC.prototype.Tick = function() {
        var lSignalID;
        for (var i = 0; i < this.Inputs.length; i++) {
            lSignalID = SignalID('IC',this.Inputs[i]);
            if (gSignals[lSignalID].Level == 1) {
                switch(this.Inputs[i]) {
                    // case 'p0' : break;
                    // case 'p1' : break;
                    case 'RS' : this.ResetIC(); break;
                    case 'CR' : this.ConditionalResetIC(); break;
                }
            }
        }
    }
}
function NextPair()    { gUnits['IC'].SignalNext(); gUnits['IC'].SignalShow(); }
function ProcessPair() { gUnits['IC'].SignalRun(); }
{// class cPC
    function cPC() {
        cUnit.call(this,'PC',280,140,['RD','WD','RU','WA','++','RST']);
        gUnits['PC'] = this;
    }
    cPC.prototype = Object.create(cUnit.prototype);
    cPC.prototype.Tick = function() {
        var lSignalID;
        for (var i = 0; i < this.Inputs.length; i++) {
            lSignalID = SignalID('PC',this.Inputs[i]);
            if (gSignals[lSignalID].Level == 1) {
                switch(this.Inputs[i]) {
                    case 'RU' :                       this.Value = gBusses['UB'].Value;  break;
                    case 'RD' :                       this.Value = gBusses['DB'].Value;  break;
                    case 'WD' : gBusses['DB'].Value = this.Value;                        break;
                    case 'WA' : gBusses['AB'].Value = this.Value;                        break;
                    case 'RST': this.Value = 255;                                        break;
                    case '++' : this.Value++;  this.Value %= 256;                        break;
                }
            }
        }
    }
}
{// class cIR
    function cIR() {
        cUnit.call(this, 'IR',20,300,['RD'],['f3','f2','f1','f0']);
        this.Value = parseInt('00010111',2);     //  NOP
        gUnits['IR'] = this;
    }
    cIR.prototype = Object.create(cUnit.prototype);
    cIR.prototype.Bit1     = function() { return this.Opcode().substr(7-1,1); }
    cIR.prototype.Opcode   = function() { return toBin(this.Value); }
    cIR.prototype.Mnemonic = function() {
        try {
            return gInstructions[this.Value].Mnemonic;
        }
        catch(err) {
            alert('Fout ' + err + 'bij het opvragen van instructie ' + toString(this.Value));
        }
    }
    cIR.prototype.ShowMnemonic = function() {
        lQueueLength = gMnemonicQueue.length;
        if (lQueueLength < 5) {
            gMnemonicQueue.push(this.Mnemonic());
            lQueueLength = gMnemonicQueue.length;
        }
        else
            for (var i = 0; i < lQueueLength - 1; i++)
                gMnemonicQueue[i] = gMnemonicQueue[i+1];
            gMnemonicQueue[lQueueLength - 1] = this.Mnemonic();
        document.getElementById("instruction").innerHTML = '';
        for (var i = 0; i < lQueueLength; i++)
            document.getElementById("instruction").innerHTML += gMnemonicQueue[i] + '<br />';
    }
    cIR.prototype.SetName = function(pCycle) {
        return gInstructions[this.Value].SetName(pCycle);
    }
    cIR.prototype.SignalSet = function(pCycle) {
        return gInstructions[this.Value].SignalSet(pCycle);
    }
    cIR.prototype.Tick = function() {
        var lSignalID;
        for (var i = 0; i < this.Inputs.length; i++) {
            lSignalID = SignalID('IR',this.Inputs[i]);
            if (gSignals[lSignalID].Level == 1) {
                switch(this.Inputs[i]) {
                    case 'RD' : this.Value = gBusses['DB'].Value; this.ShowMnemonic(); break;
                }
            }
        }
    }
}
{// class cSP
    function cSP() {
        cUnit.call(this, 'SP',280,220,['RD','WD']);
        gUnits['SP'] = this;
    }
    cSP.prototype = Object.create(cUnit.prototype);
    cSP.prototype.Tick = function() {
        var lSignalID;
        for (var i = 0; i < this.Inputs.length; i++) {
            lSignalID = SignalID('SP',this.Inputs[i]);
            if (gSignals[lSignalID].Level == 1) {
                switch(this.Inputs[i]) {
                    case 'RD' :                       this.Value = gBusses['DB'].Value; break;
                    case 'WD' : gBusses['DB'].Value = this.Value;                       break;
                }
            }
        }
    }
}
{// class cAD
    function cAD() {
        cUnit.call(this,'AD',720,120,['RA']);
        gUnits['AD'] = this;
    }
    cAD.prototype = Object.create(cUnit.prototype);
    cAD.prototype.Address = function() { return this.Value; }
    cAD.prototype.Tick = function() {
        var lSignalID;
        for (var i = 0; i < this.Inputs.length; i++) {
            lSignalID = SignalID('AD',this.Inputs[i]);
            if (gSignals[lSignalID].Level == 1) {
                switch(this.Inputs[i]) {
                    case 'RA' :                       this.Value = gBusses['AB'].Value; break;
                }
            }
        }
    }
}
{// class cML
    function cML() {
        cUnit.call(this,'ML',280,50,['RD','WD','WA']);
        gUnits['ML'] = this;
    }
    cML.prototype = Object.create(cUnit.prototype);
    cML.prototype.Tick = function() {
        var lSignalID;
        for (var i = 0; i < this.Inputs.length; i++) {
            lSignalID = SignalID('ML',this.Inputs[i]);
            if (gSignals[lSignalID].Level == 1) {
                switch(this.Inputs[i]) {
                    case 'RD' :                       this.Value = gBusses['DB'].Value; break;
                    case 'WD' : gBusses['DB'].Value = this.Value;                       break;
                    case 'WA' : gBusses['AB'].Value = this.Value;                       break;
                }
            }
        }
    }
}
{// class cAC
    function cAC() {
        cUnit.call(this,'AC',280,520,['RD','WD','RU']);
        gUnits['AC'] = this;
    }
    cAC.prototype = Object.create(cUnit.prototype);
    cAC.prototype.Tick = function() {
        var lSignalID;
        for (var i = 0; i < this.Inputs.length; i++) {
            lSignalID = SignalID('AC',this.Inputs[i]);
            if (gSignals[lSignalID].Level == 1) {
                switch(this.Inputs[i]) {
                    case 'RU' :                       this.Value = gBusses['UB'].Value; break;
                    case 'RD' :                       this.Value = gBusses['DB'].Value; break;
                    case 'WD' : gBusses['DB'].Value = this.Value;                       break;
                }
            }
        }
    }
}
{// class cFL
    function cFL() {
        cUnit.call(this,'FL',20,480,['RD','WD','AL','NZ','SH','DB','CY'],['N','V','C','Z']);
        this.Value &= this.Mask('NV....CZ',false);
        gUnits['FL'] = this;
    }
    cFL.prototype = Object.create(cUnit.prototype);
    cFL.prototype.Mask = function(pFlags, pInvert) {
        var lMask = 0;
        if (pFlags.search('N') >= 0) lMask |= parseInt('10000000',2);
        if (pFlags.search('V') >= 0) lMask |= parseInt('01000000',2);
        if (pFlags.search('C') >= 0) lMask |= parseInt('00000010',2);
        if (pFlags.search('Z') >= 0) lMask |= parseInt('00000001',2);
        return (pInvert) ? 255 - lMask : lMask;
    }
    cFL.prototype.Flag = function(pFlag) { return (this.Mask(pFlag,false) & this.Value) > 0;  }
    cFL.prototype.SetFlags = function(pFlags, pValue) {
        this.Value = (this.Mask(pFlags,false) & pValue) | ( this.Mask(pFlags,true) & this.Value);
    }
    cFL.prototype.Tick = function() {
        var lSignalID;
        for (var i = 0; i < this.Inputs.length; i++) {
            lSignalID = SignalID('FL',this.Inputs[i]);
            if (gSignals[lSignalID].Level == 1) {
                switch(this.Inputs[i]) {
                    case 'RD' :                       this.Value = gBusses['DB'].Value; break;
                    case 'WD' : gBusses['DB'].Value = this.Value;                       break;
                    case 'SH' : this.SetFlags('N.....CZ', gUnits['SH'].Flags());        break;
                    case 'AL' : this.SetFlags('NV....CZ', gUnits['AL'].Flags());        break;
                    case 'NZ' : this.SetFlags('N......Z', gUnits['AL'].Flags());        break;
                    case 'DB' : this.SetFlags('N......Z',gBusses['DB'].Flags());        break;
                    case 'CY' : this.SetFlags('......C.', (gUnits['IR'].Bit1() == '0') ? 0 : 2);    break;
                }
            }
        }
        gSignals['FL.N'].Level = ((this.Value & 128) == 0) ? 0 : 1;
        gSignals['FL.V'].Level = ((this.Value &  64) == 0) ? 0 : 1;
        gSignals['FL.C'].Level = ((this.Value &   2) == 0) ? 0 : 1;
        gSignals['FL.Z'].Level = ((this.Value &   1) == 0) ? 0 : 1;
    }
}
{// class cOA
    function cOA() {
        cUnit.call(this,'OA',280,320+40+24+40+24,['RD']);
        gUnits['OA'] = this;
    }
    cOA.prototype = Object.create(cUnit.prototype);
    cOA.prototype.Tick = function() {
        var lSignalID;
        for (var i = 0; i < this.Inputs.length; i++) {
            lSignalID = SignalID('OA',this.Inputs[i]);
            if (gSignals[lSignalID].Level == 1) {
                switch(this.Inputs[i]) {
                    case 'RD' :                       this.Value = gBusses['DB'].Value; break;
                }
            }
        }
    }
}
{// class cOB
    function cOB() {
        cUnit.call(this,'OB',280,320,['1','-B','RD']);
        gUnits['OB'] = this;
    }
    cOB.prototype = Object.create(cUnit.prototype);
    cOB.prototype.Tick = function() {
        var lSignalID;
        var lIR = gUnits['IR'].Opcode();
        var li3 = lIR.substr(7-3,1) == '1';
        var li1 = lIR.substr(7-1,1) == '1';
        var li0 = lIR.substr(7-0,1) == '1';
        var FlagNegate = !li3 && li1; gSignals['OB.-B'].Level = (FlagNegate) ? 1 : 0;
        var FlagRead1  = !li3 && li0; gSignals['OB.1' ].Level = (FlagRead1 ) ? 1 : 0;
        for (var i = 0; i < this.Inputs.length; i++) {
            lSignalID = SignalID('OB',this.Inputs[i]);
            if (gSignals[lSignalID].Level == 1) {
                switch(this.Inputs[i]) {
                    case 'RD': this.Value = (FlagRead1) ? 1 : gBusses['DB'].Value;
                               if (FlagNegate) this.Value = -this.Value;
                               break;
                }
            }
        }
    }
}
{// class cOC
    function cOC() {
        cUnit.call(this,'OC',280,320+40+24,['0','C','RD']); //  RD = Set Carry for ALU computation
        this.Value = 0;
        gUnits['OC'] = this;
    }
    cOC.prototype = Object.create(cUnit.prototype);
    cOC.prototype.Tick = function() {
        var lSignalID;
        var lIR = gUnits['IR'].Opcode();
        var li5 = lIR.substr(7-5,1) == '1';
        var li0 = lIR.substr(7-0,1) == '1';
        var FlagRead0  = li5 || li0;
        gSignals['OC.0'].Level = ( FlagRead0) ? 1 : 0;
        gSignals['OC.C'].Level = (!FlagRead0) ? 1 : 0;
        for (var i = 0; i < this.Inputs.length; i++) {
            lSignalID = SignalID('OC',this.Inputs[i]);
            if (gSignals[lSignalID].Level == 1) {
                switch(this.Inputs[i]) {
                    case 'RD': this.Value = (FlagRead0) ? 0 : 1; break;
                }
            }
        }
    }
}
{// class cAL
    function cAL() {
        var Nflag;
        var Cflag;
        var Vflag;
        var Zflag;
        cUnit.call(this,'AL',384,320+40,['+','AND','OR','XOR','WU']); //  OC.RD = Set Carry for ALU computation
        this.Value = 0;
        gUnits['AL'] = this;
    }
    cAL.prototype = Object.create(cUnit.prototype);
    cAL.prototype.Flags = function() {
        var lFlags = 0;
        this.Nflag = (this.Value > 127) ? true : false;
        this.Zflag = (this.Value == 0);
        if ( this.Nflag) lFlags |= 128;
        if ( this.Cflag) lFlags |=   2;
        if (!this.Zflag) lFlags |=   1;
        return lFlags;
    }
    cAL.prototype.Tick = function() {
        var lSignalID;
        var lIR = gUnits['IR'].Opcode();
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
        var lOA = gUnits['OA'].Value;
        var lOB = gUnits['OB'].Value;
        var lOC = gUnits['OC'].Value;
        if (!FlagLogical) {
            this.Value = lOA + lOB + lOC;
            this.Cflag = false;
            if (this.Value  > 255) {
                this.Value -= 256;
                this.Cflag  = true;
        }   }
        if (FlagAnd) this.Value = lOA & lOB;
        if (FlagOr ) this.Value = lOA | lOB;
        if (FlagXor) this.Value = lOA ^ lOB;
        for (var i = 0; i < this.Inputs.length; i++) {
            lSignalID = SignalID('AL',this.Inputs[i]);
            if (gSignals[lSignalID].Level == 1) {
                switch(this.Inputs[i]) {
                    case 'WU' : gBusses['UB'].Value = this.Value; break;
                }
            }
        }
    }
}
{// class cSH
    function cSH() {
        var Value;
        var Nflag;
        var Cflag;
        var Zflag;
        cUnit.call(this,'SH',384,320+40+24+40,['<','>','WU']);
        gUnits['SH'] = this;
    }
    cSH.prototype = Object.create(cUnit.prototype);
    cSH.prototype.Flags = function() {
        var lFlags = 0;
        this.Nflag = (this.Value > 127) ? true : false;
        this.Zflag = (this.Value == 0);
        if ( this.Nflag) lFlags |= 128;
        if ( this.Cflag) lFlags |=   2;
        if (!this.Zflag) lFlags |=   1;
        return lFlags;
    }
    cSH.prototype.Tick = function() {
        var lSignalID;
        // var lIR = gUnits['IR'].Opcode();
        // var li1 = lIR.substr(7-1,1) == '1';
        // var FlagShiftRight = li1;
        var FlagShiftRight = (gUnits['IR'].Bit1() == '1');
        gSignals['SH.<'].Level = (FlagShiftRight) ? 0 : 1;
        gSignals['SH.>'].Level = (FlagShiftRight) ? 1 : 0;
        var lOA = gUnits['OA'].Value;
        var lOC = gUnits['OC'].Value;
        this.Cflag = (FlagShiftRight) ? lOA % 1 == 1 : lOA > 127;
        this.Value = (FlagShiftRight) ? (256 * lOC + lOA) >> 1 : lOA << 1 + lOC;
        for (var i = 0; i < this.Inputs.length; i++) {
            lSignalID = SignalID('SH',this.Inputs[i]);
            if (gSignals[lSignalID].Level == 1) {
                switch(this.Inputs[i]) {
                    case 'WU' : gBusses['UB'].Value = this.Value; break;
                }
            }
        }
    }
}
{// class cMM
    function cMM() {
        cUnit.call(this,'MM',20,50,['RD','WD']);
        gUnits['MM'] = this;
        var Values;
        this.Values = [];
        for (var i = 0; i < 256; i++) this.Values.push(Math.floor(Math.random() * 256));
        this.Values[255] = parseInt('10000000',2); // Reset vector naar $80
        this.Values[10]  = parseInt('01001110',2); // Startwaarde van te verhogen waarde
        var lPC = parseInt('10000000',2);
        this.Values[lPC++] = parseInt('00110000',2); // CLC    instructie
        this.Values[lPC++] = parseInt('00110010',2); // SEC    instructie
        this.Values[lPC++] = parseInt('00010101',2); // TAS    instructie
        this.Values[lPC++] = parseInt('11010000',2); // LDA nn instructie
        this.Values[lPC++] = parseInt('00001010',2); //     nn = $0A
        this.Values[lPC++] = parseInt('00000001',2); // INA    instructie
        this.Values[lPC++] = parseInt('11010001',2); // STA nn instructie
        this.Values[lPC++] = parseInt('00001010',2); //     nn = $0A
        this.Values[lPC++] = parseInt('00010100',2); // TSA    instructie
        this.Values[lPC++] = parseInt('11110000',2); // JMP nn instructie
        this.Values[lPC++] = parseInt('10000000',2); //     nn = $80
    }
    cMM.prototype = Object.create(cUnit.prototype);
    cMM.prototype.GetValue = function() { return this.Values[gUnits['AD'].Address()]; }
    cMM.prototype.SetValue = function(pValue) {  this.Values[gUnits['AD'].Address()] = pValue; }
    cMM.prototype.Draw = function() {
        this.Value = this.GetValue();
        cUnit.prototype.Draw.call(this);
    }
    cMM.prototype.Tick = function() {
        var lSignalID;
        for (var i = 0; i < this.Inputs.length; i++) {
            lSignalID = SignalID('MM',this.Inputs[i]);
            if (gSignals[lSignalID].Level == 1) {
                switch(this.Inputs[i]) {
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
        gUnits['IC'].CycleShow();
        if (pPhase == 0) return ['PC.WA','AD.RA','MM.WD','IR.RD'];
        if (pPhase == 1) return ['PC.++'];
        var lIns = gUnits['IR'].Opcode();    //  Instructie
        switch (lIns) {
            case '00000001': return PLA_INA   (pPhase); break;   // INA
            case '11010000': return PLA_LDA_nn(pPhase); break;   // LDA nn
            case '11010001': return PLA_STA_nn(pPhase); break;   // STA nn
            case '00010101': return PLA_TAS   (pPhase); break;   // TAS
            case '11110000': return PLA_JMP_nn(pPhase); break;   // JMP nn
        }
    }
}
function NextInstruction() {
    NextTick.Cycle = 0;
    NextTick.Time++;
    gUnits['IC'].ResetIC(7);
}
function ResetClock() {
    NextTick.Cycle = 0;
    NextTick.Time  = 0;
}
function NextTick() {}
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
        // document.getElementById("button-next-signals").style.visibility = "hidden";
        // document.getElementById("button-process-signals").style.visibility = "visible";
    }
}
function ProcessSignals() {
    // gUnits['IC'].CycleNext();
    if (gSignalIDs != undefined) {
        gSignalIDs.forEach(function(ID) { gSignals[ID].Level = 1 });
        gSignalIDs.forEach(function(ID) {
            var lUnitID = gSignals[ID].UnitName.substr(0,2);
            gUnits[lUnitID].Tick();
        });
    }
    gUnits['AL'].Tick();
    gUnits['SH'].Tick();
    Object.keys(gUnits).forEach( function(ID) { gUnits[ ID].Draw(); });
    Object.keys(gBusses).forEach(function(ID) { gBusses[ID].Draw(); });
    if (gSignalIDs != undefined) gSignalIDs.forEach(function(ID) { gSignals[ID].Level = 0 });
    // document.getElementById("button-next-signals").style.visibility = "visible";
    // document.getElementById("button-process-signals").style.visibility = "hidden";
}
function HaltCPU() { clearInterval(fRunSignal); }
// function RunSignal() {
    // NextSignals();
    // ProcessSignals();
// }
function RunStates() { gUnits['IC'].NextState(); }
function RunSignals() {
    // fRunSignal = setInterval(RunSignal, 1000);
    fRunSignal = setInterval(RunStates, 1000);
}
