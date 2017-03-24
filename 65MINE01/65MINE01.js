var gCanvas;
var gUnits   = [];
var gBusses  = [];
var gSignals = [];
var gSignalIDs = [];
var gSignalPairs  = [];
var gCycles       = [];
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
{// class cLogic
    function cLogic() {}
    cLogic.NOT = function(pLevel)  { return 1 - pLevel; }
    cLogic.AND = function(pLevels) {
        lLevel = 1;
        pLevels.forEach( function(rLevel) { lLevel *= rLevel; });
        return lLevel;
    }
    cLogic.OR = function(pLevels) {
        lLevel = 0;
        pLevels.forEach( function(rLevel) { lLevel += rLevel; });
        return Math.min(1, lLevel);
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
    cSignal.SignalID  = function(pUnitName, pSignalName) { return pUnitName + '.' +  pSignalName; }
    cSignal.GetSignal = function(pUnitName, pSignalName) {
        lSignalID = cSignal.SignalID(pUnitName, pSignalName);
        try        { return gSignals[lSignalID]; }
        catch(err) { console.log('Signal [\'' + lSignalID + '\'] not found. '); }
    }
    cSignal.prototype.SetLevel = function(pLevel) { this.Level = Math.min(1,pLevel); }
    cSignal.prototype.ID   = function() { return this.UnitName + '.' +  this.SignalName; }
    cSignal.prototype.Tick = function() { gUnits[this.UnitName].Tick(); }
}
function SignalID(pUnitName, pSignalName) {return pUnitName + '.' +  pSignalName; }
{// class cSignalPair
    function cSignalPair(pPairName, pFromName, pToName) {
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
    cSignalPair.prototype.SetActiveBus = function(pActive) {
        var lWB = this.FromName.substr(3,2);
        var lRB = (this.ToName == undefined) ? '' : this.ToName.substr(3,2);
        var lBus = undefined;
        switch (lWB) {
            case 'WA': lBus = 'AB'; break;
            case 'WD': lBus = 'DB'; break;
            case 'WU': lBus = 'UB'; break;
            default  : lBus = undefined; break;
        }
        if (lBus == undefined) switch (lRB) {
            case 'RA': lBus = 'AB'; break;
            case 'RD': lBus = 'DB'; break;
            case 'RU': lBus = 'UB'; break;
            default  : lBus = undefined; break;
        }
        if (lBus != undefined) gBusses[lBus].Active = pActive;
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
    cSignalPair.InitSignalPairs = function() {
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
}
{// class gCycleSignalSet
    function cCycle(pSetName, pSignalPairs) {
        var SetName;
        var SignalPairIDs;
        var Signals;
        this.SetName = pSetName;
        this.SignalPairIDs = (pSignalPairs == undefined) ? [] : pSignalPairs.split(",");
        this.InitSignals();
        gCycles[this.SetName] = this;
    }
    cCycle.prototype.SignalPairs = function() {
        var lPairs = [];
        for (var i = 0; i < this.SignalPairIDs.length; i++) {
            lPairs.push(gSignalPairs[this.SignalPairIDs[i]]);
        }
        return lPairs;
    }
    cCycle.prototype.InitSignals = function() {
        var lPairs;
        var lFromName;
        var lToName;
        this.Signals = [];
        lPairs = this.SignalPairs();
        for (var i = 0; i < lPairs.length; i++) {
            lFromName = lPairs[i].FromName;
            lToName   = lPairs[i].ToName;
            this.Signals.push(gSignals[lFromName]);
            if (lToName != undefined) this.Signals.push(gSignals[lToName]);
        }
    }
    //  Class methods
    cCycle.GetCycle = function(pSetName) {
        try        { return gCycles[pSetName]; }
        catch(err) { console.log('Cycle ID[\'' + SetID + '\'] not found. '); }
    }
    cCycle.InitCycles = function() {
        if (gSignalPairs.length == 0) cSignalPair.InitSignalPairs();
        new cCycle('IR=(PC)'  ,'AD=PC,IR=MM'                );  //  Read instruction register from memory location PC
        new cCycle('PC++'     ,'PC++'                       );  //  Increment program counter
        new cCycle('PC=ML'    ,'PC=ML'                      );  //  Jump to location ML
        new cCycle('PC=AL'    ,'PC=AL'                      );  //  Jump to location calculated by ALU for branch
        new cCycle('PC=(SP)'  ,'AD=SP,PC=MM'                );  //  Read program counter from memory location SP
        new cCycle('AD=ML'    ,'AD=ML'                      );  //  Prepare save to memory location ML
        new cCycle('AD=SP'    ,'AD=SP'                      );  //  Prepare save to memory location SP
        new cCycle('ML=(PC)'  ,'AD=PC,ML=MM'                );  //  Read memory latch from memory location PC
        new cCycle('AL=AC�1'  ,'OA=AC,OB,OC'                );  //  Add to or Subtract 1 from accumulator (for INA en DEA)
        new cCycle('LDA #'    ,      'AC=ML,FL=DB,PC++'     );  //  Load accumulator from memory latch and set N- and Z-flag, PC++
        new cCycle('LDA nn'   ,'AD=ML,AC=MM,FL=DB,PC++'     );  //  Load accumulator from memory location ML and set N,Z-flags, PC++
        new cCycle('AC=AL'    ,'AC=AL,FL=AL'                );  //  Store calculation result in accumulator and set V,N,C,Z-flags
        new cCycle('AC=SH'    ,'AC=SH,FL=SH'                );  //  Store shift result in accumulator and set N,C,Z-flags
        new cCycle('FL=(SP)'  ,'AD=SP,FL=MM'                );  //  Load flags from stack (memory address SP)
        new cCycle('FL=A�ML'  ,      'OB=ML,OC,FL=AL'       );  //  Compare ML with accumulator
        new cCycle('FL=A�(ML)','AD=ML,OB=MM,OC,FL=AL'       );  //  Compare (ML) with accumulator
        new cCycle('AC=A�ML'  ,      'OB=ML,OC,AC=AL,FL=AL' );  //  Add ML to or Subtract ML from accumulator
        new cCycle('AC=A�(ML)','AD=ML,OB=MM,OC,AC=AL,FL=AL' );  //  Add (ML) to or Subtract (ML) from accumulator
        new cCycle('AC=A�(ML)','AD=ML,OB=MM,OC,AC=AL,FL=NZ' );  //  Logical operation between (ML) and accumulator
        new cCycle('AC=A�ML'  ,      'OB=ML,OC,AC=AL,FL=NZ' );  //  Logical operation between ML and accumulator
        new cCycle('AC=(SP)'  ,'AD=SP,AC=MM,FL=DB'          );  //  Load accumulator from memory location SP
        new cCycle('AC=SP'    ,'AC=SP,FL=DB'                );  //  Load accumulator from stack pointer
        new cCycle('(AD)=AC'  ,'MM=AC,FL=DB'                );  //  Store accumulator in memory location AD
        new cCycle('(AD)=FL'  ,'MM=FL'                      );  //  Store flags in memory location AD (PHP)
        new cCycle('(AD)=PC'  ,'MM=PC'                      );  //  Store PC in memory location AD (JSR)
        new cCycle('AL=SP�1'  ,'OA=SP,OB,OC'                );  //  Calculate stack pointer � 1
        new cCycle('A=AC'     ,'OA=AC,OC'                   );  //  Calculate AC + C from instruction
        new cCycle('A=PC'     ,'OA=PC,OC'                   );  //  Calculate PC + C from instruction
        new cCycle('SH=C<AC>C','OA=AC,OC'                   );  //  Shift accumulator from instruction
        new cCycle('CY=i1'    ,'CY=i1'                      );  //  Read Carry from instruction bit 1
        new cCycle('SP=AL'    ,'SP=AL'                      );  //  Load stack pointer from ALU
        new cCycle('SP=AC'    ,'SP=AC,FL=DB'                );  //  Load stack pointer from accumulator
        new cCycle('BRA-3'    ,'AD=PC,OB=ML,OC,PC++,IC.CR'  );  //  B=ML, PC++
        new cCycle('JSR-3'    ,'OA=SP,OB,OC,PC++'           );  //  AL=SP+1, PC++
        new cCycle('NOP'      ,undefined                    );  //  No operation
    }
}
{// class cInstruction
    function cInstruction(pOpcode, pMnemonic, pSignalSetIDstring) {
        var AddressMode; // 00 = Implied, 01 = Immediate, 11 = Direct
        var CT;
        var Operation;
        var Mnemonic;
        var Cycles;
        var SignalPairs;
        var Value;
        var lOpcode = pOpcode.split(",");
        this.AddressMode  = lOpcode[0];
        this.CT           = lOpcode[1];
        this.Operation    = lOpcode[2];
        this.Mnemonic     = pMnemonic;
        this.Cycles       = this.GetCycles(pSignalSetIDstring);
        this.SignalPairs  = this.GetSignalPairs();
        this.Value = parseInt(lOpcode.join(''),2);
        gInstructions[this.Value] = this;
    }
    cInstruction.prototype.NumberOfCycles = function() { return this.Cycles.length; }
    cInstruction.prototype.GetCycles = function(pSignalSetIDstring) {
        var lMnemonic = this.Mnemonic;
        var lSetIDs = [];
        var lCycles = [];
        var lIDstring = 'IR=(PC),PC++';
        if (pSignalSetIDstring != '') lIDstring += ',' + pSignalSetIDstring;
        lSetIDs = lIDstring.split(',');
        lSetIDs.forEach( function(SetID) {
            try        { lCycles.push(cCycle.GetCycle(SetID)); }
            catch(err) { console.log('Error adding cycle ID[\'' + SetID + '\'] to instruction ' + lMnemonic); }
        });
        return lCycles;
    }
    cInstruction.prototype.GetSignalPairs = function() {
        lSignalPairs  = [];
        for (var i = 0; i < this.Cycles.length; i++) {
            lSignalPairs.push(this.Cycles[i].SignalPairs());
            if (i + 1 == this.Cycles.length)
                lSignalPairs.push(gSignalPairs['IC.RS']);
        }
        return lSignalPairs;
    }
    cInstruction.prototype.SetName = function(iCycle) {
        return (iCycle < this.Cycles.length) ? this.SignalSet(iCycle).SetName : '---';
    }
    cInstruction.prototype.SignalSet = function(iCycle) {
        return (iCycle < this.Cycles.length) ? this.Cycles[iCycle] : [];
    }
    cInstruction.InitInstructions = function() {
        if (gCycles.length == 0) cCycle.InitCycles();
        new cInstruction('00,00,0001','INA'   ,'AL=AC�1,AC=AL');
        new cInstruction('00,00,0011','DEA'   ,'AL=AC�1,AC=AL');
        new cInstruction('00,00,0100','ROL'   ,'SH=C<AC>C,AC=SH');      //  SH =    AC<CY
        new cInstruction('00,00,0101','ASL'   ,'SH=C<AC>C,AC=SH');        //  SH =    AC<0
        new cInstruction('00,00,0100','ROR'   ,'SH=C<AC>C,AC=SH');       //  SH = CY>AC
        new cInstruction('00,00,0100','LSR'   ,'SH=C<AC>C,AC=SH');        //  SH =  0>AC
        new cInstruction('00,01,0001','PLA'   ,'AC=(SP),AL=SP�1,SP=AL');
        new cInstruction('00,01,0011','PHA'   ,'AL=SP�1,SP=AL,AD=SP,(AD)=AC');
        new cInstruction('00,01,0100','TSA'   ,'AC=SP');
        new cInstruction('00,01,0101','TAS'   ,'SP=AC');
        new cInstruction('00,01,0111','NOP'   ,'');
        new cInstruction('00,10,0001','RTS'   ,'PC=(SP),AL=SP�1,SP=AL');
        new cInstruction('00,11,0001','PLP'   ,'FL=(SP),AL=SP�1,SP=AL');
        new cInstruction('00,11,0011','PHP'   ,'AL=SP�1,SP=AL,AD=SP,(AD)=FL');
        new cInstruction('00,11,0000','CLC'   ,'CY=i1');
        new cInstruction('00,11,0010','SEC'   ,'CY=i1');
        new cInstruction('01,00,0000','ADC #' ,'ML=(PC),A=AC,AC=A�ML,PC++');
        new cInstruction('01,00,0010','SBC #' ,'ML=(PC),A=AC,AC=A�ML,PC++');
        new cInstruction('01,00,1000','AND #' ,'ML=(PC),A=AC,AC=A�ML,PC++');
        new cInstruction('01,00,1001','ORA #' ,'ML=(PC),A=AC,AC=A�ML,PC++');
        new cInstruction('01,00,1010','EOR #' ,'ML=(PC),A=AC,AC=A�ML,PC++');
        new cInstruction('01,01,0000','LDA #' ,'ML=(PC),LDA #');
        new cInstruction('01,01,0010','CMP #' ,'ML=(PC),A=AC,FL=A�ML,PC++');
        new cInstruction('11,00,0000','ADC nn','ML=(PC),A=AC,AC=A�(ML),PC++');
        new cInstruction('11,00,0010','SBC nn','ML=(PC),A=AC,AC=A�(ML),PC++');
        new cInstruction('11,00,1000','AND #' ,'ML=(PC),A=AC,AC=A�(ML),PC++');
        new cInstruction('11,00,1001','ORA #' ,'ML=(PC),A=AC,AC=A�(ML),PC++');
        new cInstruction('11,00,1010','EOR #' ,'ML=(PC),A=AC,AC=A�(ML),PC++');
        new cInstruction('11,01,0000','LDA nn','ML=(PC),LDA nn');
        new cInstruction('11,01,0001','STA nn','ML=(PC),AD=ML,(AD)=AC,PC++');
        new cInstruction('11,01,0010','CMP nn','ML=(PC),A=AC,FL=A�(ML),PC++');
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
    cUnit.InitUnits();
    cBus.InitBusses();
    cInstruction.InitInstructions();
    Object.keys(gUnits).forEach( function(ID) { gUnits[ ID].Draw(); });
    Object.keys(gBusses).forEach(function(ID) { gBusses[ID].Draw(); });
    ResetCPU();
}
{// class cBox
    function cBox(pX,pY,pW,pH) {
        this.x = pX;
        this.y = pY;
        this.w = pW;
        this.h = pH;
    }
    cBox.prototype.clearRect = function() { gCanvas.clearRect(this.x, this.y, this.w, this.h); }
    cBox.prototype.fillRect = function(pStyle) {
        if (!(pStyle == undefined)) gCanvas.fillStyle = pStyle;
        gCanvas.fillRect(this.x, this.y, this.w, this.h);
    }
    cBox.prototype.rect = function(pStyle, pWidth) {
        var dW = (pWidth == undefined) ? 0 : pWidth - 1;
        if (!(pStyle == undefined)) gCanvas.strokeStyle = pStyle;
        gCanvas.lineWidth = 2*dW +  1;
        gCanvas.beginPath();
        gCanvas.rect(this.x + dW, this.y + dW, this.w - 2*dW, this.h - 2*dW);
        gCanvas.stroke();
        gCanvas.lineWidth = 1;
    }
}
{// class cUnitBox
    function cUnitBox(pNaam) {
        cBox.call(this,0,0,100,40);
        var naam;
        var value;
        // var x,y,w,h;
        this.naam  = pNaam;
        this.value = Math.floor(Math.random() * 256);
        // this.x = 0;
        // this.y = 0;
        // this.w = 100;
        // this.h = 40;
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
    }
    cUnitBox.prototype.DrawBox = function(pValue, pActive) {
        // Zie http://www.w3schools.com/colors/colors_converter.asp
        // Rood  =   0
        // Geel  =  60
        // Groen = 120
        // Cyaan = 180
        // Blauw = 240
        cBox.prototype.fillRect.call(this, 'hsl(120, 100%, 95%)');
        var lStyle = (pActive) ? 'hsl(0, 100%, 75%)' : 'hsl(0, 0%, 25%)';
        var lWidth = (pActive) ? 2 : 1;
        cBox.prototype.rect.call(this, lStyle, lWidth);
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
    cUnit.prototype.IsActive = function() {
        var lSignalID;
        var lIsActive = false;
        switch (this.Naam) {
            case 'AL': lSignalID = SignalID(this.Naam, 'WU'); lIsActive = (gSignals[lSignalID].Level == 1); break;
            case 'SH': lSignalID = SignalID(this.Naam, 'WU'); lIsActive = (gSignals[lSignalID].Level == 1); break;
            case 'OA': lSignalID = SignalID(this.Naam, 'RD'); lIsActive = (gSignals[lSignalID].Level == 1); break;
            case 'OB': lSignalID = SignalID(this.Naam, 'RD'); lIsActive = (gSignals[lSignalID].Level == 1); break;
            case 'OC': lSignalID = SignalID(this.Naam, 'RD'); lIsActive = (gSignals[lSignalID].Level == 1); break;
            default  : for (var i = 0; i < this.Inputs.length; i++) {
                            lSignalID = SignalID(this.Naam, this.Inputs[i]);
                            lIsActive |= (gSignals[lSignalID].Level == 1);
                       }
                       break;
        }
        return lIsActive;
    }
    cUnit.prototype.DrawInputs = function(pBox) {
        var lBox = new cBox(pBox.x, pBox.y + pBox.h, pBox.w, 4);
        if (this.Inputs.length > 0) {
            var n = Math.floor((this.Inputs.length + 2) / 3);
            if (n < 2) n = 2;
            var x = lBox.x + 3 - 32;
            var y;
            var lSignalID;
            for (var i = 0; i < this.Inputs.length; i++) {
                if (i % n == 0) {
                    x += 32;
                    y = lBox.y + 4;
                }
                lSignalID = SignalID(this.Naam, this.Inputs[i]);
                if (gSignals[lSignalID].Level == 1) gCanvas.fillStyle = 'hsl(  0, 100%, 75%)';
                else                                gCanvas.fillStyle = 'hsl(  0,   0%, 50%)';
                gCanvas.beginPath();
                gCanvas.fillRect(x, y, 7, 7);
                gCanvas.stroke();
                gCanvas.font = "normal normal lighter 8px Verdana";
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
            lBox.h = 10 * n + 4;
            lBox.rect('hsl(  0,   0%, 50%)');
        }
        return lBox;
    }
    cUnit.prototype.DrawOutputs = function(pBox) {
        var lBox = new cBox(pBox.x, pBox.y + pBox.h, pBox.w, 4);
        if (this.Outputs.length > 0) {
            var n = Math.floor((this.Outputs.length + 2) / 4);
            if (n < 1) n = 1;
            var x = pBox.x + 3 - 24;
            var y;
            var lSignalID;
            for (var i = 0; i < this.Outputs.length; i++) {
                if (i % n == 0) {
                    x += 24;
                    y = pBox.y + pBox.h + 4;
                }
                lSignalID = SignalID(this.Naam, this.Outputs[i]);
                if (gSignals[lSignalID].Level == 1) gCanvas.fillStyle = 'hsl(  0, 100%, 75%)';
                else                                gCanvas.fillStyle = 'hsl(  0,   0%, 50%)';
                gCanvas.beginPath();
                gCanvas.fillRect(x, y, 7, 7);
                gCanvas.stroke();
                gCanvas.font = "8px Verdana";
                gCanvas.fillText(this.Outputs[i], x + 10, y + 6);
                y += 10;
            }
            lBox.h = 10 * n + 4;
            lBox.rect('hsl(  0,   0%, 50%)');
        }
        return lBox;
    }
    cUnit.prototype.Draw = function() {
        var lInputBox = this.DrawInputs(this.UnitBox);
        var lOutputBox = this.DrawOutputs(lInputBox);
        this.UnitBox.DrawBox(this.Value, this.IsActive());
    }
    cUnit.InitUnits =function() {
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
    }
}
{// class cBusBox
    function cBusBox(pNaam) {
        cBox.call(this,0,0,72,0);
        var naam;
        var value;
        this.naam  = pNaam;
        this.value = Math.floor(Math.random() * 256);
    }
    cBusBox.prototype.SetXYh = function(pX,pY,pH) { this.x = pX; this.y = pY; this.h = pH;}
    cBusBox.prototype.DrawBox = function(pValue, pActive) {
        cBox.prototype.clearRect.call(this);
        cBox.prototype.fillRect.call(this, 'hsl(240, 0%, 95%)');
        var lValue = (pValue == undefined) ? this.value : pValue;
        this.value = lValue;
        for (var i = 0; i < 8; i++) {
            gCanvas.beginPath();
            if (lValue % 2 == 1) gCanvas.fillStyle = 'hsl(120, 50%, 70%)';
            else                 gCanvas.fillStyle = 'hsl(  0,  0%, 80%)';
            lValue = Math.floor(lValue / 2);
            gCanvas.fillRect(this.x + 63 - 8 * i, this.y + 4, 3, this.h - 8);
            gCanvas.stroke();
            gCanvas.fillStyle = 'hsl(0,   0%, 25%)';
            gCanvas.font = "20px Verdana";
        }
        var lStyle = (pActive) ? 'hsl(0, 100%, 75%)' : 'hsl(0, 0%, 25%)';
        var lWidth = (pActive) ? 2 : 1;
        cBox.prototype.rect.call(this, lStyle, lWidth);
    }
}
{// class cBus
    function cBus(pNaam, pX, pY, pH) {
        var Naam;
        var Value;
        var BusBox;
        var Nflag;
        var Zflag;
        var Active;
        this.Naam    = pNaam;
        this.Value   = Math.floor(Math.random() * 256);
        this.UnitBox = new cUnitBox(this.Naam);
        this.BusBox = new cBusBox(this.Naam);
        this.UnitBox.SetXY(pX,pY);
        this.Active = false;
    }
    cBus.prototype.Draw = function() {
        this.BusBox.DrawBox(this.Value, this.Active);
        this.UnitBox.DrawBox(this.Value, this.Active);
    }
    cBus.prototype.Flags = function() {
        var lFlags = 0;
        this.Nflag = (this.Value > 127) ? true : false;
        this.Zflag = (this.Value == 0);
        if ( this.Nflag) lFlags |= 128;
        if (!this.Zflag) lFlags |=   1;
        return lFlags;
    }
    cBus.InitBusses = function() {
        gBusses['DB'] = new cBus('DB', 160-14, 24, 560); gBusses['DB'].BusBox.SetXYh(160, 24+40, 560-40);
        gBusses['UB'] = new cBus('UB', 520-14,110, 474); gBusses['UB'].BusBox.SetXYh(520,110+40, 560-110+24-40);
        gBusses['AB'] = new cBus('AB', 620-14, 24, 260); gBusses['AB'].BusBox.SetXYh(620, 24+40, 260-40);
    }
}
//  ==========================================================================  //
{
    function cPLA() {

    }
}
{// class cCK
    function cCK() {
        cUnit.call(this,'CK',20,132,[],['p0','p1']);
        this.Wires = [1,0,0,0,0];
        gUnits['CK'] = this;
    }
    cCK.Tick = function() { gUnits['CK'].Tick(); }
    cCK.prototype = Object.create(cUnit.prototype);
    cCK.prototype.SetPhi0 = function() {
        //  p0 = not (not 1 or not 2 or not 3)
        var lLevels = [];
        for (i = 0; i < 2; i++) lLevels[i] = cLogic.NOT(this.Wires[i+1]);
        lNOTp0 = cLogic.OR(lLevels);
        return cLogic.NOT(lNOTp0);
    }
    cCK.prototype.SetPhi1 = function() {
        //  p1 = not (1 or 2 or 3)
        var lLevels = [];
        for (i = 0; i < 2; i++) lLevels[i] = this.Wires[i+1];
        lNOTp0 = cLogic.OR(lLevels);
        return cLogic.NOT(lNOTp0);
    }
    cCK.prototype.Tick = function() {
        for (i = 0; i < 4; i++) {
            this.Wires[4-i] = this.Wires[3-i];
        }
        this.Wires[0] = cLogic.NOT(this.Wires[4]);
        cSignal.GetSignal(this.Naam, 'p0').SetLevel(this.SetPhi0());
        cSignal.GetSignal(this.Naam, 'p1').SetLevel(this.SetPhi1());
    }
}
{// class cIC
    function cIC() {
        var RunState = false;
        var InfoQueue;
        this.InfoQueue = [];
        cUnit.call(this,'IC',20,200,['p0','p1','RS','CR'],['t0','t1','t2','t3','t4','t5','t6','t7']);
        gUnits['IC'] = this;
    }
    cIC.prototype = Object.create(cUnit.prototype);
    cIC.prototype.SetValue = function() {
        this.Value = 16 * cIC.Cycle + cPLA.SetIndex;
    }
    cIC.prototype.ResetIC = function(pCycle = 7) {
        this.RunState = false;
        this.RunStateButtons();
        cIC.Cycle = pCycle;
        cPLA.SetName = 'IR=(PC)';
        cPLA.SignalPairs = gCycles[cPLA.SetName].SignalPairs();
    }
    cIC.prototype.ConditionalResetIC = function() {
        var lIR = gUnits['IR'];
        var lFL = gUnits['FL'];
        var lIns   = gInstructions[lIR.Value];
        var lBranch;
        switch (lIns.Mnemonic) {
            case 'BEQ nn' : lBranch = !lFL.Flag('Z'); break;
            case 'BNE nn' : lBranch =  lFL.Flag('Z'); break;
            case 'BCC nn' : lBranch = !lFL.Flag('C'); break;
            case 'BCS nn' : lBranch =  lFL.Flag('C'); break;
            case 'BVC nn' : lBranch = !lFL.Flag('V'); break;
            case 'BVS nn' : lBranch =  lFL.Flag('V'); break;
            case 'BPL nn' : lBranch = !lFL.Flag('N'); break;
            case 'BMI nn' : lBranch =  lFL.Flag('N'); break;
            default: alert('Unexpected conditional reset found for instruction ' + lIns.Mnemonic); break;
        }
        if (!lBranch) this.ResetIC();   //  If branch is not taken, get next instruction
    }
    cIC.prototype.RunStateButtons = function() {
        if (this.RunState) {
            document.getElementById("button-next-pair").style.display = "none";
            document.getElementById("button-process-pair").style.visibility = "visible";
        } else {
            document.getElementById("button-next-pair").style.display = "inline";
            document.getElementById("button-process-pair").style.visibility = "hidden";
        }
    }
    cIC.prototype.ClearRunState = function() { this.RunState = false; this.RunStateButtons(); }
    cIC.prototype.SetRunState   = function() { this.RunState = true;  this.RunStateButtons(); }
    cIC.prototype.CycleShow = function() {
        for (var i = 0; i < this.Outputs.length; i++)
            gSignals[this.Naam + '.' + this.Outputs[i]].Level = (i == cIC.Cycle) ? 1 : 0;
        cUnit.prototype.Draw.call(this);
    }
    cIC.prototype.CycleNext = function() {
        lIR = gUnits['IR'];
        Object.keys(gSignals).forEach(function(ID) { gSignals[ID].Level = 0; });
        cPLA.SetIndex = 0;
        cIC.Cycle++;
        if (cIC.Cycle > 7) cIC.Cycle = 0;
        if (cIC.Cycle > 1)
            if (cIC.Cycle >= lIR.Instruction().NumberOfCycles()) cIC.Cycle = 0;
        cPLA.SetName     = lIR.SetName(cIC.Cycle);
        cPLA.SignalPairs = lIR.SignalPairs(cIC.Cycle);
        cPLA.Signals     = lIR.Signals(cIC.Cycle);
    }
    cIC.prototype.ShowSignalInfo = function (pPair) {
        var lMnemonic = gUnits['IR'].Mnemonic();
        var lCycle    = 'T' + cIC.Cycle + ': ' + cPLA.SetName;
        var lSignals  = pPair.PairName + ': ' + pPair.FromName;
        if (pPair.ToName != undefined) lSignals += ' ' + pPair.ToName;
        if (cIC.Cycle == 0) lMnemonic = '---';
        var lInfo = [lMnemonic,lCycle,lSignals].join(' ');
        lQueueLength = this.InfoQueue.length;
        if (lQueueLength < 16) {
            this.InfoQueue.push(lInfo);
            lQueueLength++;
        }
        else
            for (var i = 0; i < lQueueLength - 1; i++)
                this.InfoQueue[i] = this.InfoQueue[i+1];
            this.InfoQueue[lQueueLength - 1] = lInfo;
        document.getElementById("instruction-info").innerHTML = '';
        for (var i = 0; i < lQueueLength; i++)
            document.getElementById("instruction-info").innerHTML += this.InfoQueue[i] + '<br />';
    }
    cIC.prototype.SignalShow = function() {
        if (cPLA.SetIndex < cPLA.SignalPairs.length) {
            var lPair = cPLA.SignalPairs[cPLA.SetIndex];
            lPair.SetLevel(1);
            lPair.SetActiveBus(true);
            Object.keys(gBusses).forEach(function(ID) { gBusses[ID].Draw(); });
            Object.keys(gUnits).forEach( function(ID) { gUnits[ ID].Draw(); });
            this.ShowSignalInfo(lPair);
        }
        this.SetValue();
    }
    cIC.prototype.SignalRun = function() {
        if (cPLA.SetIndex < cPLA.SignalPairs.length) {
            var lPair = cPLA.SignalPairs[cPLA.SetIndex];
            lPair.Tick();
            gUnits['AL'].Tick();
            gUnits['SH'].Tick();
            Object.keys(gBusses).forEach(function(ID) { gBusses[ID].Draw(); });
            Object.keys(gUnits).forEach( function(ID) { gUnits[ ID].Draw(); });
            // lPair.SetLevel(0);
            lPair.SetActiveBus(false);
        }
        this.ClearRunState();
        this.SetValue();
    }
    cIC.prototype.SignalNext = function() {
        cPLA.SetIndex++;
        if (cPLA.SetIndex >= cPLA.SignalPairs.length) {
            this.CycleNext();
            this.CycleShow();
        }
        this.SetRunState();
    }
    cIC.prototype.NextState = function() {
        if (this.RunState) {
            this.SignalRun();
        } else {
            this.SignalNext();
            this.SignalShow();
        }
        this.SetValue();
    }
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
function NextPair()    { gUnits['IC'].NextState(); }
function ProcessPair() { gUnits['IC'].NextState(); }
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
    cIR.prototype.Bit1        = function() { return this.Opcode().substr(7-1,1); }
    cIR.prototype.Opcode      = function() { return toBin(this.Value); }
    cIR.prototype.Mnemonic    = function() { return this.Instruction().Mnemonic; }
    cIR.prototype.Instruction = function() {
        try        { return gInstructions[this.Value]; }
        catch(err) { alert('Fout ' + err + 'bij het opvragen van instructie ' + toString(this.Value)); }
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
    cIR.prototype.SetName = function(pCycle) { return this.Instruction().SetName(pCycle); }
    cIR.prototype.SignalSet = function(pCycle) {
        return gInstructions[this.Value].SignalSet(pCycle);
    }
    cIR.prototype.SignalPairs = function(pCycle) {
        return gInstructions[this.Value].SignalPairs[pCycle];
    }
    cIR.prototype.Signals = function(pCycle) {
        return gInstructions[this.Value].SignalPairs[pCycle];
    }
    cIR.prototype.SetOutputs = function() {
        var lValue = this.Value;
        for (var i = 0; i < 4; i++) {
            gSignals[this.Naam + '.f' + i].Level = lValue % 2;
            lValue = Math.floor(lValue / 2);
        }
    }
    cIR.prototype.Tick = function() {
        var lSignalID;
        for (var i = 0; i < this.Inputs.length; i++) {
            lSignalID = SignalID('IR',this.Inputs[i]);
            if (gSignals[lSignalID].Level == 1) {
                switch(this.Inputs[i]) {
                    case 'RD' : this.Value = gBusses['DB'].Value; this.SetOutputs(); break;
                }
            }
        }
    }
}
{// class cSP
    function cSP() {
        cUnit.call(this, 'SP',280,220,['RD','WD','WA']);
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
                    case 'WA' : gBusses['AB'].Value = this.Value;                       break;
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
        this.SetSignals();
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
    cFL.prototype.SetSignals = function() {
        gSignals['FL.N'].Level = ((this.Value & 128) == 0) ? 0 : 1;
        gSignals['FL.V'].Level = ((this.Value &  64) == 0) ? 0 : 1;
        gSignals['FL.C'].Level = ((this.Value &   2) == 0) ? 0 : 1;
        gSignals['FL.Z'].Level = ((this.Value &   1) == 0) ? 0 : 1;
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
        this.SetSignals();
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
        cUnit.call(this,'AL',384,320+20,['+','AND','OR','XOR','WU'], ['N','V','C','Z']); //  OC.RD = Set Carry for ALU computation
        this.Value = 0;
        gUnits['AL'] = this;
    }
    cAL.prototype = Object.create(cUnit.prototype);
    cAL.prototype.Flags = function() {
        var lFlags = 0;
        if (this.Nflag) lFlags |= 128;
        if (this.Cflag) lFlags |=   2;
        if (this.Zflag) lFlags |=   1;
        return lFlags;
    }
    cAL.prototype.SetOutputs = function() {
        gSignals['AL.N'].Level = (this.Nflag) ? 1 : 0;
        gSignals['AL.V'].Level = (this.Vflag) ? 1 : 0;
        gSignals['AL.C'].Level = (this.Cflag) ? 1 : 0;
        gSignals['AL.Z'].Level = (this.Zflag) ? 1 : 0;
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
        this.Nflag =  (this.Value > 127) ? true : false;
        this.Zflag = !(this.Value == 0);
        this.SetOutputs();
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
        cUnit.call(this,'SH',384,320+40+24+40,['<','>','WU'],['N','C','Z']);
        gUnits['SH'] = this;
    }
    cSH.prototype = Object.create(cUnit.prototype);
    cSH.prototype.Flags = function() {
        var lFlags = 0;
        if (this.Nflag) lFlags |= 128;
        if (this.Cflag) lFlags |=   2;
        if (this.Zflag) lFlags |=   1;
        return lFlags;
    }
    cSH.prototype.SetOutputs = function() {
        gSignals['SH.N'].Level = (this.Nflag) ? 1 : 0;
        gSignals['SH.C'].Level = (this.Cflag) ? 1 : 0;
        gSignals['SH.Z'].Level = (this.Zflag) ? 1 : 0;
    }
    cSH.prototype.Tick = function() {
        var lSignalID;
        var FlagShiftRight = (gUnits['IR'].Bit1() == '1');
        gSignals['SH.<'].Level = (FlagShiftRight) ? 0 : 1;
        gSignals['SH.>'].Level = (FlagShiftRight) ? 1 : 0;
        var lOA = gUnits['OA'].Value;
        var lOC = gUnits['OC'].Value;
        this.Value =  (FlagShiftRight) ? (256 * lOC + lOA) >> 1 : lOA << 1 + lOC;
        this.Cflag =  (FlagShiftRight) ? lOA % 1 == 1 : lOA > 127;
        this.Nflag =  (this.Value > 127) ? true : false;
        this.Zflag = !(this.Value == 0);
        this.SetOutputs();
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
        this.Values[10]  = parseInt('11111110',2); // Startwaarde van te verhogen waarde
        var lPC = parseInt('10000000',2);
     // this.Values[lPC++] = parseInt('00010101',2); // TAS    instructie
        this.Values[lPC++] = parseInt('11010000',2); // LDA nn instructie
        this.Values[lPC++] = parseInt('00001010',2); //     nn = $0A
        this.Values[lPC++] = parseInt('00000001',2); // INA    instructie
        this.Values[lPC++] = parseInt('11010001',2); // STA nn instructie
        this.Values[lPC++] = parseInt('00001010',2); //     nn = $0A
        this.Values[lPC++] = parseInt('11101011',2); // BNE nn instructie
        this.Values[lPC++] = parseInt('11111001',2); //     nn = $F9
     // this.Values[lPC++] = parseInt('11111000',2); //     nn = $F8
     // this.Values[lPC++] = parseInt('00010100',2); // TSA    instructie
        this.Values[lPC++] = parseInt('11110000',2); // JMP nn instructie
        this.Values[lPC++] = parseInt('10000000',2); //     nn = $80
    }
    cMM.prototype = Object.create(cUnit.prototype);
    cMM.prototype.GetValue = function() { return this.Values[gUnits['AD'].Address()]; }
    cMM.prototype.SetValue = function(pValue) {  this.Values[gUnits['AD'].Address()] = pValue; }
    cMM.prototype.Draw = function() {
        this.Value = this.GetValue();
        cUnit.prototype.Draw.call(this);
        var lID = '';
        for (var i = 0; i < this.Values.length; i++) {
            lID = 'mm' + toHex(i);
            if (i == gUnits['AD'].Address()) {
                document.getElementById(lID).innerHTML = '<b style="font-size:16px;"><font color="red">' + toHex(this.Values[i]) + '</font></b>';
            } else {
                document.getElementById(lID).innerHTML = toHex(this.Values[i]);
            }
        }
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
    gUnits['SH'].Tick();
    Object.keys(gUnits).forEach( function(ID) { gUnits[ ID].Draw(); });
    Object.keys(gBusses).forEach(function(ID) { gBusses[ID].Draw(); });
    if (gSignalIDs != undefined) gSignalIDs.forEach(function(ID) { gSignals[ID].Level = 0 });
}
function HaltCPU() { clearInterval(fRunSignal); }
function RunStates() { gUnits['IC'].NextState(); cCK.Tick(); }
function RunSignals() {
    fRunSignal = setInterval(RunStates, 1000);
}
