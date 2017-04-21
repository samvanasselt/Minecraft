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
{// class cInfoQueue
    cInfoQueue = function() {}
    cInfoQueue.ClearQueue = function() { cInfoQueue.Queue = []; }
    cInfoQueue.AddInfo = function(pInfo) {
        if (cInfoQueue.Queue.length >= 16) cInfoQueue.Queue.shift();
        cInfoQueue.Queue.push(pInfo);
        document.getElementById("instruction-info").innerHTML = cInfoQueue.Queue.join('<br />');
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
    cSignal.prototype.ProcessSignal = function() { gUnits[this.UnitName].Tick(this); }
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
    cSignalPair.GetPair = function(pPairName) {
        if (gSignalPairs[pPairName] == undefined) {
            console.log('Signal Pair ID[\'' + pPairName + '\'] not found. ');
            return gSignalPairs['sim-error'];
        } else {
            try        { return gSignalPairs[pPairName]; }
            catch(err) { console.log('Signal Pair ID[\'' + pPairName + '\'] not found. '); }
        }
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
        new cSignalPair('AD=AL','AL.WU','AD.RU');   //  Load address register from ALU
        new cSignalPair('ML=MM','MM.WD','ML.RD');   //  Load memory latch from memory address AD
        new cSignalPair('IF=MM','MM.WD','IF.RD');   //  Load instruction fetch from memory address AD
        new cSignalPair('IR=IF','IF.WI','IR.RI');   //  Load instruction register from instruction fetch
        new cSignalPair('PC++' ,'PC.++'        );   //  Increment program counter
        new cSignalPair('PC=MM','MM.WD','PC.RD');   //  Load program counter from memory address AD
        new cSignalPair('PC=ML','ML.WD','PC.RD');   //  Load program counter from memory latch
        new cSignalPair('PC=AL','AL.WU','PC.RU');   //  Load program counter from ALU
        new cSignalPair('SP=AL','AL.WU','SP.RU');   //  Load stack pointer from ALU
        new cSignalPair('SP=AC','AC.WD','SP.RD');   //  Load stack pointer from accumulator
        new cSignalPair('OA=AC','AC.WD','OA.RD');   //  Load operand A from accumulator
        new cSignalPair('OA=XR','XR.WD','OA.RD');   //  Load operand A from X-register
        new cSignalPair('OA=PC','PC.WD','OA.RD');   //  Load operand A from program counter
        new cSignalPair('OA=SP','SP.WD','OA.RD');   //  Load operand A from stack pointer
        new cSignalPair('OB=MM','MM.WD','OB.RD');   //  Load operand B from memory address AD  or  Load with 1
        new cSignalPair('OB=ML','ML.WD','OB.RD');   //  Load operand B from memory latch  or  Load with 1
        new cSignalPair('OB'           ,'OB.RD');   //  Load operand B from data bus  or  Load with 1
        new cSignalPair('OC'           ,'OC.RD');   //  Load operand C from carry flag  or  with 0  or  with 1
        new cSignalPair('AC=MM','MM.WD','AC.RD');   //  Load accumulator from memory address AD
        new cSignalPair('AC=ML','ML.WD','AC.RD');   //  Load accumulator from memory latch
        new cSignalPair('AC=SP','SP.WD','AC.RD');   //  Load accumulator from stack pointer
        new cSignalPair('AC=XR','XR.WD','AC.RD');   //  Load accumulator from X-register
        new cSignalPair('AC=AL','AL.WU','AC.RU');   //  Load accumulator from ALU
        new cSignalPair('AC=SH','SH.WU','AC.RU');   //  Load accumulator from shift register
        new cSignalPair('XR=MM','MM.WD','XR.RD');   //  Load X-register from memory address AD
        new cSignalPair('XR=ML','ML.WD','XR.RD');   //  Load X-register from memory latch
        new cSignalPair('XR=SP','SP.WD','XR.RD');   //  Load X-register from stack pointer
        new cSignalPair('XR=AC','AC.WD','XR.RD');   //  Load X-register from accumulator
        new cSignalPair('XR=AL','AL.WU','XR.RU');   //  Load X-register from ALU
        new cSignalPair('MM=AC','AC.WD','MM.RD');   //  Load memory address AD from accumulator     (write to memory)
        new cSignalPair('MM=XR','XR.WD','MM.RD');   //  Load memory address AD from X-register      (write to memory)
        new cSignalPair('MM=PC','PC.WD','MM.RD');   //  Load memory address AD from program counter (write to memory)
        new cSignalPair('MM=FL','FL.WD','MM.RD');   //  Load memory address AD from flags           (write to memory)
        new cSignalPair('FL=MM','MM.WD','FL.RD');   //  Load flags from memory address AD
        new cSignalPair('FL=SH'        ,'FL.SH');   //  Load N   C Z flags from shift register
        new cSignalPair('FL=AL'        ,'FL.AL');   //  Load N V C Z flags from ALU
        new cSignalPair('FL=NZ'        ,'FL.NZ');   //  Load N     Z flags from ALU
        new cSignalPair('FL=DB'        ,'FL.DB');   //  Load N     Z flags from data bus
        new cSignalPair('CY=i1'        ,'FL.CY');   //  Read Carry from instruction bit 1
        new cSignalPair('IC.RS'        ,'IC.RS');   //  Reset instruction clock
        new cSignalPair('sim-error','sim-error');   //  Simulator error, not an actual signal pair
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
            lPairs.push(cSignalPair.GetPair(this.SignalPairIDs[i]));
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
        if (gCycles[pSetName] == undefined) {
            console.log('Cycle ID[\'' + pSetName + '\'] not found. ');
            return gCycles['sim-error'];
        } else {
            try        { return gCycles[pSetName]; }
            catch(err) { console.log('Cycle ID[\'' + pSetName + '\'] not found. '); }
        }
    }
    cCycle.InitCycles = function() {
        if (gSignalPairs.length == 0) cSignalPair.InitSignalPairs();
        new cCycle('IF=(PC)'  ,'AD=PC,IF=MM'                );  //  Read instruction fetch from memory location PC
        new cCycle('NEXT'     ,'PC++,IC.RS,IR=IF'           );  //  Increment program counter, reset instruction clock, fetch instruction
        new cCycle('PC++'     ,'PC++'                       );  //  Increment program counter
        new cCycle('PC=ML'    ,'PC=ML'                      );  //  Jump to location ML
        new cCycle('PC=AL'    ,'PC=AL'                      );  //  Jump to location calculated by ALU for branch
        new cCycle('PC=(SP)'  ,'AD=SP,PC=MM'                );  //  Read program counter from memory location SP
        new cCycle('AD=AL'    ,'AD=AL'                      );  //  Prepare save to memory location AL
        new cCycle('AD=ML'    ,'AD=ML'                      );  //  Prepare save to memory location ML
        new cCycle('AD=SP'    ,'AD=SP'                      );  //  Prepare save to memory location SP
        new cCycle('ML=(PC)'  ,'AD=PC,ML=MM'                );  //  Read memory latch from memory location PC
        new cCycle('AL=AC±1'  ,'OA=AC,OB,OC'                );  //  Add to or Subtract 1 from accumulator (for INA en DEA)
        new cCycle('AL=XR±1'  ,'OA=XR,OB,OC'                );  //  Add to or Subtract 1 from X-register  (for INX en DEX)
        new cCycle('LDA #'    ,      'AC=ML,FL=DB,PC++'     );  //  Load accumulator from memory latch and set N- and Z-flag, PC++
        new cCycle('LDA $'    ,'AD=ML,AC=MM,FL=DB,PC++'     );  //  Load accumulator from memory location ML and set N,Z-flags, PC++
        new cCycle('AC=AL'    ,'AC=AL,FL=AL'                );  //  Store calculation result in accumulator and set V,N,C,Z-flags
        new cCycle('AC=SH'    ,'AC=SH,FL=SH'                );  //  Store shift result in accumulator and set N,C,Z-flags
        new cCycle('LDX #'    ,      'XR=ML,FL=DB,PC++'     );  //  Load X-register from memory latch and set N- and Z-flag, PC++
        new cCycle('LDX $'    ,'AD=ML,XR=MM,FL=DB,PC++'     );  //  Load X-register from memory location ML and set N,Z-flags, PC++
        new cCycle('FL=(SP)'  ,'AD=SP,FL=MM'                );  //  Load flags from stack (memory address SP)
        new cCycle('FL=A±ML'  ,      'OB=ML,OC,FL=AL'       );  //  Compare ML with accumulator
        new cCycle('FL=A±(ML)','AD=ML,OB=MM,OC,FL=AL'       );  //  Compare (ML) with accumulator
        new cCycle('AC=A±ML'  ,      'OB=ML,OC,AC=AL,FL=AL' );  //  Add ML to or Subtract ML from accumulator
        new cCycle('AC=A±(ML)','AD=ML,OB=MM,OC,AC=AL,FL=AL' );  //  Add (ML) to or Subtract (ML) from accumulator
        new cCycle('AC=A·(ML)','AD=ML,OB=MM,OC,AC=AL,FL=NZ' );  //  Logical operation between (ML) and accumulator
        new cCycle('AC=A·ML'  ,      'OB=ML,OC,AC=AL,FL=NZ' );  //  Logical operation between ML and accumulator
        new cCycle('AC=(SP)'  ,'AD=SP,AC=MM,FL=DB'          );  //  Load accumulator from memory location SP
        new cCycle('AC=(AL)'  ,'AD=AL,AC=MM,FL=DB'          );  //  Load accumulator from memory location AL
        new cCycle('AC=SP'    ,'AC=SP,FL=DB'                );  //  Load accumulator from stack pointer
        new cCycle('AC=XR'    ,'AC=XR,FL=DB'                );  //  Load accumulator from X-register
        new cCycle('XR=AC'    ,'XR=AC,FL=DB'                );  //  Load X-register from accumulator
        new cCycle('XR=AL'    ,'XR=AL,FL=AL'                );  //  Store calculation result in X-register and set V,N,C,Z-flags
        new cCycle('(AD)=XR'  ,'MM=XR,FL=DB'                );  //  Store X-register  in memory location AD
        new cCycle('(AD)=AC'  ,'MM=AC,FL=DB'                );  //  Store accumulator in memory location AD
        new cCycle('(AD)=FL'  ,'MM=FL'                      );  //  Store flags in memory location AD (PHP)
        new cCycle('(AD)=PC'  ,'MM=PC'                      );  //  Store PC in memory location AD (JSR)
        new cCycle('AL=SP±1'  ,'OA=SP,OB,OC'                );  //  Calculate stack pointer ± 1
        new cCycle('A=XR|PC++','OA=XR,OC,PC++'              );  //  Calculate AC + C from instruction + increment PC
        new cCycle('A=AC'     ,'OA=AC,OC'                   );  //  Calculate AC + C from instruction
        new cCycle('A=XR'     ,'OA=XR,OC'                   );  //  Calculate AC + C from instruction
        new cCycle('A=PC'     ,'OA=PC,OC'                   );  //  Calculate PC + C from instruction
        new cCycle('B=ML'     ,'OB=ML,OC'                   );  //  Calculate A + B + C from instruction
        new cCycle('SH=C<AC>C','OA=AC,OC'                   );  //  Shift accumulator from instruction
        new cCycle('CY=i1'    ,'CY=i1'                      );  //  Read Carry from instruction bit 1
        new cCycle('SP=AL'    ,'SP=AL'                      );  //  Load stack pointer from ALU
        new cCycle('SP=AC'    ,'SP=AC,FL=DB'                );  //  Load stack pointer from accumulator
        new cCycle('BRA-1'    ,'AD=PC,OB=ML,OC,PC++'        );  //  B=ML, PC++
        new cCycle('JSR-1'    ,'OA=SP,OB,OC,PC++'           );  //  AL=SP+1, PC++
        new cCycle('NOP'      ,undefined                    );  //  No operation
        new cCycle('sim-error',undefined                    );  //  Simulator error, not an actual cycle
    }
}
{// class cInstruction
    function cInstruction(pOpcode, pMnemonic, pSignalSetIDstring) {
        var lOpcode = pOpcode.split(",");
        this.AddressMode  = lOpcode[0]; // 00 = Implied, 01 = Immediate, 11 = Direct
        this.CT           = lOpcode[1];
        this.Operation    = lOpcode[2];
        this.Mnemonic     = pMnemonic;
        this.Cycles       = this.GetCycles(pSignalSetIDstring);
        this.SignalPairs  = this.GetSignalPairs();
        this.Value = parseInt(lOpcode.join(''),2);
        gInstructions[this.Value] = this;
    }
    cInstruction.InitInstructions = function() {
        if (gCycles.length == 0) cCycle.InitCycles();
        new cInstruction('00,00,0001','INA'   ,'AL=AC±1,AC=AL');
        new cInstruction('00,00,0011','DEA'   ,'AL=AC±1,AC=AL');
        new cInstruction('00,00,0100','ROL'   ,'SH=C<AC>C,AC=SH');  //  SH = AC<CY
        new cInstruction('00,00,0101','ASL'   ,'SH=C<AC>C,AC=SH');  //  SH = AC<0
        new cInstruction('00,00,0110','ROR'   ,'SH=C<AC>C,AC=SH');  //  SH = CY>AC
        new cInstruction('00,00,0111','LSR'   ,'SH=C<AC>C,AC=SH');  //  SH =  0>AC
        new cInstruction('00,01,0001','PLA'   ,'AC=(SP),AL=SP±1,SP=AL');
        new cInstruction('00,01,0011','PHA'   ,'AL=SP±1,SP=AL,AD=SP,(AD)=AC');
        new cInstruction('00,01,0100','TXA'   ,'AC=XR');
        new cInstruction('00,01,0101','INX'   ,'AL=XR±1,XR=AL');
        new cInstruction('00,01,0110','TAX'   ,'XR=AC');
        new cInstruction('00,01,0111','DEX'   ,'AL=XR±1,XR=AL');
        new cInstruction('00,10,0100','TSA'   ,'AC=SP');
        new cInstruction('00,10,0110','TAS'   ,'SP=AC');
        new cInstruction('00,10,0111','NOP'   ,'');
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
        new cInstruction('01,01,1000','LDX #' ,'ML=(PC),LDX #');
        new cInstruction('01,01,1010','CPX #' ,'ML=(PC),A=XR,FL=A±ML,PC++');
        new cInstruction('11,00,0000','ADC $','ML=(PC),A=AC,AC=A±(ML),PC++');
        new cInstruction('11,00,0010','SBC $','ML=(PC),A=AC,AC=A±(ML),PC++');
        new cInstruction('11,00,0100','LDA $+X','ML=(PC),A=XR|PC++,B=ML,AC=(AL)');
        new cInstruction('11,00,0101','STA $+X','ML=(PC),A=XR|PC++,B=ML,AD=AL,(AD)=AC');
        new cInstruction('11,00,1000','AND $','ML=(PC),A=AC,AC=A·(ML),PC++');
        new cInstruction('11,00,1001','ORA $','ML=(PC),A=AC,AC=A·(ML),PC++');
        new cInstruction('11,00,1010','EOR $','ML=(PC),A=AC,AC=A·(ML),PC++');
        new cInstruction('11,01,0000','LDA $','ML=(PC),LDA $');
        new cInstruction('11,01,0001','STA $','ML=(PC),AD=ML,(AD)=AC,PC++');
        new cInstruction('11,01,0010','CMP $','ML=(PC),A=AC,FL=A±(ML),PC++');
        new cInstruction('11,01,1000','LDX $','ML=(PC),LDX $');
        new cInstruction('11,01,1001','STX $','ML=(PC),AD=ML,(AD)=XR,PC++');
        new cInstruction('11,01,1010','CPX $','ML=(PC),A=XR,FL=A±(ML),PC++');
        new cInstruction('11,10,1000','BCC $','ML=(PC),BRA-1,A=PC,PC=AL');    //  Conditional reset if test fails
        new cInstruction('11,10,1001','BCS $','ML=(PC),BRA-1,A=PC,PC=AL');    //  Conditional reset if test fails
        new cInstruction('11,10,1010','BEQ $','ML=(PC),BRA-1,A=PC,PC=AL');    //  Conditional reset if test fails
        new cInstruction('11,10,1011','BNE $','ML=(PC),BRA-1,A=PC,PC=AL');    //  Conditional reset if test fails
        new cInstruction('11,10,1100','BVC $','ML=(PC),BRA-1,A=PC,PC=AL');    //  Conditional reset if test fails
        new cInstruction('11,10,1101','BVS $','ML=(PC),BRA-1,A=PC,PC=AL');    //  Conditional reset if test fails
        new cInstruction('11,10,1110','BPL $','ML=(PC),BRA-1,A=PC,PC=AL');    //  Conditional reset if test fails
        new cInstruction('11,10,1111','BMI $','ML=(PC),BRA-1,A=PC,PC=AL');    //  Conditional reset if test fails
        new cInstruction('11,11,0000','JMP $','ML=(PC),PC=ML');
        new cInstruction('11,11,0011','JSR $','ML=(PC),JSR-1,SP=AL,AD=SP,(AD)=PC,PC=ML');
    }
    cInstruction.GetInstructionFromMnemonic = function(pMnemonic) {
        var lIns = undefined;
        Object.keys(gInstructions).forEach( function(insID) {
            lInstruction = gInstructions[insID];
            if (lInstruction.Mnemonic == pMnemonic) lIns = lInstruction;
        });
        return lIns;
        // for (var i=0; i < gInstructions.length; i++)
            // if (gInstructions[i].Mnemonic == pMnemonic) return gInstructions[i];
    }
    cInstruction.CycleList = function() {
        Object.keys(gInstructions).forEach( function(insID) {
            lInstruction = gInstructions[insID];
            Object.keys(lInstruction.Cycles).forEach( function(iCycle) {
                lCycle = lInstruction.Cycles[iCycle];
                try {
                    Object.keys(lCycle.Signals).forEach( function(iSignal) {
                        lSignal = lCycle.Signals[iSignal];
                        console.log(lInstruction.Opcode(), iCycle, lCycle.SetName, lSignal.ID());
                    });
                }
                catch(err) { console.log(err, lInstruction.Opcode(), iCycle, lCycle.SetName); }
            });
        });
    }
    cInstruction.prototype.Opcode         = function() { return toBin(this.Value); }
    cInstruction.prototype.NumberOfCycles = function() { return this.Cycles.length; }
    cInstruction.prototype.GetCycles = function(pSignalSetIDstring) {
        var lMnemonic = this.Mnemonic;
        var lSetIDs = [];
        var lCycles = [];
        var lIDstring = (pSignalSetIDstring + ',IF=(PC),NEXT').replace(/^,/,"");    // replace = Verwijder beginkomma
        lSetIDs = lIDstring.split(',');
        lSetIDs.forEach( function(SetID) {
            try        { lCycles.push(cCycle.GetCycle(SetID)); }
            catch(err) { console.log('Instruction ' + lMnemonic + ' Cycle ' + lSetIDs[SetID] + ' ontbreekt' ); }
        });
        return lCycles;
    }
    cInstruction.prototype.GetSignalPairs = function() {
        var lSignalPairs = [];
        for (var i = 0; i < this.Cycles.length; i++) {
            try        { lSignalPairs.push(this.Cycles[i].SignalPairs()); }
            catch(err) {
                console.log(err);
                console.log('Instruction ' + this.Mnemonic + ' Cycle [' + i + '] is missing' );
                console.log(this);
                console.log(this.Cycles);
                console.log('Instruction ' + this.Mnemonic + ' Cycle ' + this.Cycles[i].SetName + ' is missing a SignalPairs' );
                console.log(this.Cycles[i].SignalPairs());
            }
            if (i + 1 == this.Cycles.length)
                lSignalPairs.push(gSignalPairs['IC.RS']);
        }
        return lSignalPairs;
    }
    cInstruction.prototype.SetName = function(iCycle) {
        return (iCycle < this.Cycles.length) ? this.SignalSet(iCycle).SetName : 'NOP';
    }
    cInstruction.prototype.SignalSet = function(iCycle) {
        return (iCycle < this.Cycles.length) ? this.Cycles[iCycle] : [];
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
    InitCPUcanvas();
    cUnit.InitUnits();
    cBus.InitBusses();
    cInstruction.InitInstructions();
    CPU.Reset();
    Object.keys(gUnits).forEach( function(ID) { gUnits[ ID].Draw(); });
    Object.keys(gBusses).forEach(function(ID) { gBusses[ID].Draw(); });
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
        this.naam  = pNaam;
        this.value = Math.floor(Math.random() * 256);
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
        // var Naam;
        // var Value;
        // var Inputs;
        // var Outputs;
        // var UnitBox;
        this.Naam    = pNaam;
        this.Value   = Math.floor(Math.random() * 256);
        this.UnitBox = new cUnitBox(this.Naam);
        this.Bits    = [0,0,0,0,0,0,0,0];
        this.SetBits();
        if (!(pX == undefined || pY == undefined)) this.UnitBox.SetXY(pX,pY);
        this.Inputs  = (pInputs  == undefined) ? [] : pInputs;
        this.Outputs = (pOutputs == undefined) ? [] : pOutputs;
        for (var i = 0; i < this.Inputs.length ; i++) { new cSignal(this.Naam, this.Inputs[i] ); }
        for (var i = 0; i < this.Outputs.length; i++) { new cSignal(this.Naam, this.Outputs[i]); }
    }
    cUnit.InitUnits = function() {
        CPU.IF = new cIF(20,30);
        CPU.IR = new cIR( 20,180);
        CPU.CK = new cCK( 20,300);
        CPU.IC = new cIC( 20,370);
        CPU.FL = new cFL( 20,480);
        CPU.ML = new cML(280,100);
        CPU.PC = new cPC(280,170);
        CPU.SP = new cSP(280,250);
        CPU.OC = new cOC(280,320+40+24);
        CPU.OB = new cOB(280,320);
        CPU.OA = new cOA(280,320+40+24+40+24);
        CPU.AL = new cAL(384,320+20);
        CPU.SH = new cSH(384,320+40+24+40);
        CPU.AC = new cAC(280,520);
        CPU.XR = new cXR(280,600);
        CPU.YR = new cYR(280,680);
        CPU.MM = new cMM(720, 30);
        CPU.AD = new cAD(720,264);
    }
    cUnit.DrawUnits = function() { Object.keys(gUnits).forEach( function(ID) { gUnits[ID].Draw(); }); }
    cUnit.prototype.SetValue = function(pValue) { this.Value = pValue; this.SetBits(); }
    cUnit.prototype.SetBits = function() {
        var lValue = this.Value;
        for (var i = 0; i < 8; i++) {
            this.Bits[i] = lValue % 2;
            lValue >>>= 1;
        }
    }
    cUnit.prototype.Bit = function(pBitnr) { return this.Bits[pBitnr]; }
    cUnit.prototype.Address = function() { return this.Value; } // For AD, PC, SP
    cUnit.prototype.Tick = function() {
        var lSignal;
        var lPhi1 = cSignal.GetSignal('CK', 'p1').Level;  // 1 if read  phase
        var lPhi2 = cSignal.GetSignal('CK', 'p2').Level;  // 1 if write phase
        for (var i = 0; i < this.Inputs.length; i++) {
            lSignal = cSignal.GetSignal( this.Naam, this.Inputs[i]);
            if (lSignal.Level == 1) this.ProcessInput(lSignal, lPhi1, lPhi2);
        }
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
        this.BusBox.SetXYh( pX+14, pY+40, pH-40);
        this.Active = false;
    }
    cBus.InitBusses = function() {
        gBusses['AB'] = new cBus('AB', 620-14, 74, 210);
        gBusses['DB'] = new cBus('DB', 160-14,  4, 580);
        gBusses['IB'] = new cBus('IB',     20,100,  80);
        gBusses['UB'] = new cBus('UB', 510-14,140, 444);
    }
    cBus.DrawBusses = function() { Object.keys(gBusses).forEach(function(ID) { gBusses[ID].Draw(); }); }
    AB = function() { return gBusses['AB']; }
    DB = function() { return gBusses['DB']; }
    UB = function() { return gBusses['UB']; }
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
    cBus.prototype.WriteToBus  = function(pValue) { this.Active = true;        this.Value = pValue; }
    cBus.prototype.ReadFromBus = function()       { this.Active = true; return this.Value;          }
}
//  ==========================================================================  //
{
    PLA = function() {}
    PLA.Prepare = function() {
        var iCycle;
        var lSetName;
        if (cSignal.GetSignal('CK', 'p1').Level == 1 && PLA.PREP.Level < 1) {
            PLA.PREP.Level = 1;
            PLA.AllSignals(0);
            iCycle = CPU.IC.Cycle();
            PLA.Cycle = CPU.IR.Cycle(iCycle);
            // lSetName = IR.Instruction().SetName(CPU.IC.Cycle());
            // PLA.Cycle = cCycle.GetCycle(lSetName);
            // PLA.Cycle = IR.Cycle(CPU.IC.Cycle());
            PLA.AllSignals(1);
            PLA.ShowSignalInfo();
        }
        if (cSignal.GetSignal('CK', 'p2').Level == 1) { PLA.PREP.Level = 0; }
    }
    PLA.SetSignal = function(iSignal, pLevel) { PLA.Cycle.Signals[iSignal].SetLevel(pLevel); }
    PLA.AllSignals = function(pLevel) {
        try {
            for (var i = 0; i < PLA.Cycle.Signals.length; i++)
                PLA.Cycle.Signals[i].SetLevel(pLevel);
        }
        catch(err) {}
    }
    PLA.ShowSignalInfo = function() {
        var lMnemonic = gUnits['IR'].Mnemonic();
        var lCycle    = 'T' + CPU.IC.Cycle();
        var lSignals = [];
        try { for (var i = 0; i < PLA.Cycle.Signals.length; i++)
                lSignals.push(PLA.Cycle.Signals[i].ID());
        }
        catch(err) {}
        var lInfo = [lMnemonic,lCycle,lSignals.join(', ')].join(' ');
        cInfoQueue.AddInfo(lInfo);
    }
    PLA.Tick = function() {
        if (PLA.Cycle != undefined) {
            for (var i = 0; i < PLA.Cycle.Signals.length; i++)
                PLA.Cycle.Signals[i].ProcessSignal();
            gUnits['AL'].Tick();
            gUnits['SH'].Tick();
        }
    }
}
{// class cCK
    // http://lateblt.livejournal.com/88105.html
    CK = function() {}
    CK.Tick = function() { gUnits['CK'].Tick(); }
    function cCK(pX,pY) {
        cUnit.call(this,'CK',pX,pY,[],['p1','p2']);
        this.Wires = [1,0,0,0,0];
        gUnits['CK'] = this;
    }
    cCK.prototype = Object.create(cUnit.prototype);
    cCK.prototype.SetValue = function() {
        var lPower2 = 1;
        var lValue = 0;
        this.Wires.forEach( function(Level) { lValue += lPower2 * Level; lPower2 *= 2; });
        this.Value = lValue;
    }
    cCK.prototype.Phi1 = function() {
        //  p1 = not (not 1 or not 2 or not 3)
        var lLevels = [];
        for (i = 0; i < 2; i++) lLevels[i] = cLogic.NOT(this.Wires[i+1]);
        lNOTp0 = cLogic.OR(lLevels);
        return cLogic.NOT(lNOTp0);
    }
    cCK.prototype.Phi2 = function() {
        //  p2 = not (1 or 2 or 3)
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
        // cSignal.GetSignal(this.Naam, 'p1').SetLevel(this.Phi1());
        // cSignal.GetSignal(this.Naam, 'p2').SetLevel(this.Phi2());
        var lPhi1 = this.Phi1();
        var lPhi2 = this.Phi2();
        var lUnitsToSet;
        lUnitsToSet = 'IC,PC'.split(',');
        lUnitsToSet.push(this.Naam);
        lUnitsToSet.forEach( function(UnitID) {
            cSignal.GetSignal(UnitID, 'p1').SetLevel(lPhi1);
            cSignal.GetSignal(UnitID, 'p2').SetLevel(lPhi2);
        });
        // cSignal.GetSignal('IC', 'p1').SetLevel(this.Phi1());
        // cSignal.GetSignal('IC', 'p2').SetLevel(this.Phi2());
        this.SetValue();
    }
}
{// class cIC
    function cIC(pX,pY) {
        cUnit.call(this,'IC',pX,pY,['p1','p2','RS'],['t0','t1','t2','t3','t4','t5','t6','t7']);
        gUnits['IC'] = this;
    }
    cIC.prototype = Object.create(cUnit.prototype);
    cIC.prototype.Reset = function() {
        CPU.IC.CurrentCycle = -1;
        this.Cycles = [1,0,0,0,0,0,0,0];
        this.Buffer = [0,0,0,0,0,0,0,0];
        this.SetValue();
    }
    cIC.prototype.Cycle = function() {
        for (var i=0; i < this.Cycles.length; i++)
            if (this.Cycles[i] == 1) return i;
    }
    cIC.prototype.SetValue = function() {
        var lPower2 = 1;
        var lValue = 0;
        this.Cycles.forEach( function(Level) { lValue += lPower2 * Level; lPower2 *= 2; });
        this.Value = lValue;
        for (i = 0; i < this.Cycles.length; i++)
            cSignal.GetSignal(this.Naam, 't' + i).SetLevel(this.Cycles[i]);
        CPU.IC.CycleChanged = !(CPU.IC.CurrentCycle == this.Cycle());
        CPU.IC.CurrentCycle = this.Cycle();
    }
    cIC.prototype.Show = function() {
        for (var i = 0; i < this.Outputs.length; i++)
            gSignals[this.Naam + '.' + this.Outputs[i]].Level = this.Cycles[i];
        this.SetValue();
        cUnit.prototype.Draw.call(this);
    }
    cIC.prototype.ProcessInput = function(pSignal) {
        switch(pSignal.SignalName) {
            case 'p1' : for (var i=1; i<9; i++) this.Buffer[i % 8] = this.Cycles[i-1]; this.SetValue(); break;
            case 'p2' : for (var i=0; i<8; i++) this.Cycles[i]     = this.Buffer[i]  ; this.SetValue(); break;
            case 'RS' : this.Reset(); break;
            // case 'CR' : this.ConditionalResetIC(); break;
        }
    }
    // cIC.prototype.ConditionalResetIC = function() {
        // var lIR = gUnits['IR'];
        // var lFL = gUnits['FL'];
        // var lIns   = gInstructions[lIR.Value];
        // var lBranch;
        // switch (lIns.Mnemonic) {
            // case 'BEQ $' : lBranch = !lFL.Flag('Z'); break;
            // case 'BNE $' : lBranch =  lFL.Flag('Z'); break;
            // case 'BCC $' : lBranch = !lFL.Flag('C'); break;
            // case 'BCS $' : lBranch =  lFL.Flag('C'); break;
            // case 'BVC $' : lBranch = !lFL.Flag('V'); break;
            // case 'BVS $' : lBranch =  lFL.Flag('V'); break;
            // case 'BPL $' : lBranch = !lFL.Flag('N'); break;
            // case 'BMI $' : lBranch =  lFL.Flag('N'); break;
            // default: alert('Unexpected conditional reset found for instruction ' + lIns.Mnemonic); break;
        // }
        // if (!lBranch) this.Reset();   //  If branch is not taken, get next instruction
    // }
}
{// class cPC
    function cPC(pX,pY) {
        cUnit.call(this,'PC',pX,pY,['RD','WD','RU','WA','<+','++','p1','p2','RST']);
        gUnits['PC'] = this;
        this.INC = new cSignal(this.Naam, '<+');
    }
    cPC.prototype = Object.create(cUnit.prototype);
    cPC.prototype.Reset = function() { this.ProcessInput(cSignal.GetSignal(this.Naam, 'RST')); }
    cPC.prototype.Increment = function() {
        if (cSignal.GetSignal(this.Naam, 'p1').Level == 1 && this.INC.Level < 1) this.Value++;
        this.Value %= 256;
        this.INC.SetLevel(1);
    }
    cPC.prototype.ProcessInput = function(pSignal) {
        switch(pSignal.SignalName) {
            case 'RU' :                       this.Value = gBusses['UB'].Value;  break;
            case 'RD' :                       this.Value = gBusses['DB'].Value;  break;
            case 'WD' : gBusses['DB'].Value = this.Value;                        break;
            case 'WA' : gBusses['AB'].Value = this.Value;                        break;
            case '++' :                       this.Increment();                  break;
            case 'p1' :                                                          break;
            case 'p2' :                       this.INC.SetLevel(0);              break;
            case 'RST':                       this.Value = 255;                  break;
        }
    }
}
{// Instruction Fetch
    function cIF(pX,pY) {
        cUnit.call(this,'IF',pX,pY,['RD','WI']);
        this.Value = parseInt('00010111',2);     //  NOP
        gUnits[this.Naam] = this;
    }
    cIF.prototype = Object.create(cUnit.prototype);
    cIF.prototype.ProcessInput = function(pSignal) {
        switch(pSignal.SignalName) {
            case 'RD' :                       this.Value = gBusses['DB'].Value;  break;
            case 'WI' : gBusses['IB'].Value = this.Value;                        break;
        }
    }
}
{// Random Logic
    RandomLogic = function() {}
    RandomLogic.Carry = function() {
        var lValue;
        var b0 = CPU.IR.Bit(0);
        var b3 = CPU.IR.Bit(3);
        var b5 = CPU.IR.Bit(5);
        if (cLogic.OR([b5,b3,b0]) == 1) {
            // b5 or b3 or b0 == 1  =>  0 / 1
            var b1 = CPU.IR.Bit(1);
            var b4 = CPU.IR.Bit(4);
            // b4 == 0 or  b1 == 0  =>  0
            if (cLogic.AND([b4,b1]) == 0) {
                gSignals['OC.0'].Level = 1;
                gSignals['OC.1'].Level = 0;
                gSignals['OC.C'].Level = 0;
                lValue = 0;
            } else {
                // b4 == 1 and b1 == 1  =>  1
                gSignals['OC.0'].Level = 0;
                gSignals['OC.1'].Level = 1;
                gSignals['OC.C'].Level = 0;
                lValue = 1;
            }
        } else {
            // b5 and b3 and b0 == 0 => Value from Carry flag
            gSignals['OC.0'].Level = 0;
            gSignals['OC.1'].Level = 0;
            gSignals['OC.C'].Level = 1;
            lValue = (CPU.FL.Flag('C')) ? 1 : 0;
        }
        return lValue;
    }
}
{// class cIR
    function IR() {}
    IR.Reset = function() { gUnits['IR'].Value = parseInt('11110000',2); } // gInstructions['JMP $'].Opcode()
    IR.Instruction = function() { return gUnits['IR'].Instruction(); }
    function cIR(pX,pY) {
        cUnit.call(this,'IR',pX,pY,['RI'],['f3','f2','f1','f0']);
        this.Value = parseInt('00010111',2);     //  NOP
        gUnits['IR'] = this;
    }
    cIR.prototype = Object.create(cUnit.prototype);
    cIR.prototype.Bit1        = function() { return this.Opcode().substr(7-1,1); }
    cIR.prototype.Opcode      = function() { return toBin(this.Value); }
    cIR.prototype.Mnemonic    = function() { return this.Instruction().Mnemonic; }
    cIR.prototype.Instruction = function() {
        try        { return gInstructions[this.Value]; }
        catch(err) { alert('Fout ' + err + 'bij het opvragen van instructie ' + toBin(this.Value)); }
    }
    cIR.prototype.Cycle = function(pCycle) {
        var lSetName;
        var iCycle = pCycle;
        var lIns = this.Instruction();
        if (iCycle > 1) {
            switch (lIns.Mnemonic) {
                case 'BEQ $' : if ( CPU.FL.Flag('Z')) iCycle += 2; break; // Skip branch cycles if non-zero
                case 'BNE $' : if (!CPU.FL.Flag('Z')) iCycle += 2; break; // Skip branch cycles if     zero
                case 'BCC $' : if ( CPU.FL.Flag('C')) iCycle += 2; break; // Skip branch cycles if    carry
                case 'BCS $' : if (!CPU.FL.Flag('C')) iCycle += 2; break; // Skip branch cycles if no carry
                case 'BVC $' : if ( CPU.FL.Flag('V')) iCycle += 2; break; // Skip branch cycles if    overflow
                case 'BVS $' : if (!CPU.FL.Flag('V')) iCycle += 2; break; // Skip branch cycles if no overflow
                case 'BPL $' : if ( CPU.FL.Flag('N')) iCycle += 2; break; // Skip branch cycles if negative
                case 'BMI $' : if (!CPU.FL.Flag('N')) iCycle += 2; break; // Skip branch cycles if positive
                default:                                            break; // Ignore for other instructions
            }
        }
        lSetName = lIns.SetName(iCycle);
        return cCycle.GetCycle(lSetName);
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
    cIR.prototype.CheckValue = function() {
        try {
            var lInstruction = gInstructions[this.Value];
        } catch(err) {
            lInstruction = undefined;
            alert('Fout ' + err + 'bij het opvragen van instructie ' + toBin(this.Value));
        }
        if (lInstruction == undefined) {
            alert('Onbekende instructie ' + toBin(this.Value));
            CPU.Halt();
        }
    }
    cIR.prototype.ProcessInput = function(pSignal) {
        switch(pSignal.SignalName) {
            case 'RI' :
                this.SetValue(gBusses['IB'].Value);
                this.SetOutputs();
                this.CheckValue();
                break;
        }
    }
}
{// class cSP
    function cSP(pX,pY) {
        cUnit.call(this,'SP',pX,pY,['RD','WD','RU','WA']);
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
                    case 'RU' :                       this.Value = gBusses['UB'].Value; break;
                    case 'WD' : gBusses['DB'].Value = this.Value;                       break;
                    case 'WA' : gBusses['AB'].Value = this.Value;                       break;
                }
            }
        }
    }
}
{// class cAD
    function cAD(pX,pY) {
        cUnit.call(this,'AD',pX,pY,['RA','RU']);
        gUnits['AD'] = this;
    }
    cAD.prototype = Object.create(cUnit.prototype);
    cAD.prototype.ProcessInput = function(pSignal, pPhi1, pPhi2) {
        if (pPhi1 == 1) switch(pSignal.SignalName) {    //  Calculate and Write to Bus phase
            case 'RA' : this.Value = gBusses['AB'].Value; break;
            case 'RU' : this.Value = gBusses['UB'].Value; break;
        }
        if (pPhi2 == 1) switch(pSignal.SignalName) {    //  Read from Bus phase
            case 'RA' : this.Value = gBusses['AB'].Value; break;
            case 'RU' : this.Value = gBusses['UB'].Value; break;
        }
    }
}
{// class cML
    function cML(pX,pY) {
        cUnit.call(this,'ML',pX,pY,['RD','WD','WA']);
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
    function cAC(pX,pY) {
        cUnit.call(this,'AC',pX,pY,['RD','WD','RU']);
        gUnits['AC'] = this;
    }
    cAC.prototype = Object.create(cUnit.prototype);
    cAC.prototype.ProcessInput = function(pSignal, pPhi1, pPhi2) {
        if (pPhi1 == 1) switch(pSignal.SignalName) {    //  Write to bus phase
            case 'WD' : gBusses['DB'].Value = this.Value; break;
        }
        if (pPhi2 == 1) switch(pSignal.SignalName) {    //  Read from bus phase
            case 'RD' : this.Value = gBusses['DB'].Value; break;
            case 'RU' : this.Value = gBusses['UB'].Value; break;
        }
    }
}
{// class X-register
    function cXR(pX,pY) {
        cUnit.call(this,'XR',pX,pY,['RD','WD','RU']);
        gUnits['XR'] = this;
    }
    cXR.prototype = Object.create(cUnit.prototype);
    cXR.prototype.ProcessInput = function(pSignal, pPhi1, pPhi2) {
        if (pPhi1 == 1) switch(pSignal.SignalName) {    //  Write to bus phase
            case 'WD' : gBusses['DB'].Value = this.Value; break;
        }
        if (pPhi2 == 1) switch(pSignal.SignalName) {    //  Read from bus phase
            case 'RD' : this.Value = gBusses['DB'].Value; break;
            case 'RU' : this.Value = gBusses['UB'].Value; break;
        }
    }
}
{// class Y-register
    function cYR(pX,pY) {
        cUnit.call(this,'YR',pX,pY,['RD','WD','RU']);
        gUnits['YR'] = this;
    }
    cYR.prototype = Object.create(cUnit.prototype);
    cYR.prototype.ProcessInput = function(pSignal, pPhi1, pPhi2) {
        if (pPhi1 == 1) switch(pSignal.SignalName) {    //  Write to bus phase
            case 'WD' : gBusses['DB'].Value = this.Value; break;
        }
        if (pPhi2 == 1) switch(pSignal.SignalName) {    //  Read from bus phase
            case 'RD' : this.Value = gBusses['DB'].Value; break;
            case 'RU' : this.Value = gBusses['UB'].Value; break;
        }
    }
}
{// class cFL
    function cFL(pX,pY) {
        cUnit.call(this,'FL',pX,pY,['RD','WD','AL','NZ','SH','DB','CY'],['N','V','C','Z']);
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
    // cFL.prototype.Tick = function() {
        // var lSignalID;
        // for (var i = 0; i < this.Inputs.length; i++) {
            // lSignalID = SignalID('FL',this.Inputs[i]);
            // if (gSignals[lSignalID].Level == 1) {
                // switch(this.Inputs[i]) {
                    // case 'RD' :                       this.Value = gBusses['DB'].Value; break;
                    // case 'WD' : gBusses['DB'].Value = this.Value;                       break;
                    // case 'SH' : this.SetFlags('N.....CZ', gUnits['SH'].Flags());        break;
                    // case 'AL' : this.SetFlags('NV....CZ', gUnits['AL'].Flags());        break;
                    // case 'NZ' : this.SetFlags('N......Z', gUnits['AL'].Flags());        break;
                    // case 'DB' : this.SetFlags('N......Z',gBusses['DB'].Flags());        break;
                    // case 'CY' : this.SetFlags('......C.', (gUnits['IR'].Bit1() == '0') ? 0 : 2);    break;
                // }
            // }
        // }
        // this.SetSignals();
    // }
    cFL.prototype.ProcessInput = function(pSignal, pPhi1, pPhi2) {
        if (pPhi1 == 1) switch(pSignal.SignalName) {
            case 'WD' : gBusses['DB'].Value = this.Value; break;
        }
        if (pPhi2 == 1) switch(pSignal.SignalName) {
            case 'RD' : this.Value = gBusses['DB'].Value;                break;
            case 'SH' : this.SetFlags('N.....CZ', gUnits['SH'].Flags()); break;
            case 'AL' : this.SetFlags('NV....CZ', gUnits['AL'].Flags()); break;
            case 'NZ' : this.SetFlags('N......Z', gUnits['AL'].Flags()); break;
            case 'DB' : this.SetFlags('N......Z',gBusses['DB'].Flags()); break;
            case 'CY' : this.SetFlags('......C.', (gUnits['IR'].Bit1() == '0') ? 0 : 2);    break;
        }
        this.SetSignals();
    }
}
{// class cOA
    function cOA(pX,pY) {
        cUnit.call(this,'OA',pX,pY,['RD']);
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
    function cOB(pX,pY) {
        cUnit.call(this,'OB',pX,pY,['1','-B','RD']);
        gUnits['OB'] = this;
    }
    cOB.prototype = Object.create(cUnit.prototype);
    cOB.prototype.ProcessInput = function(pSignal, pPhi1, pPhi2) {
        if (pPhi1 == 1) switch(pSignal.SignalName) {    //  Write to bus and calculate phase
            case 'RD': {
                var lIR = gUnits['IR'].Opcode();
                var li3 = lIR.substr(7-3,1) == '1';
                var li1 = lIR.substr(7-1,1) == '1';
                var li0 = lIR.substr(7-0,1) == '1';
                var FlagNegate = !li3 && li1; gSignals['OB.-B'].Level = (FlagNegate) ? 1 : 0;
                var FlagRead1  = !li3 && li0; gSignals['OB.1' ].Level = (FlagRead1 ) ? 1 : 0;
                this.Value = (FlagRead1) ? 1 : gBusses['DB'].Value;
                if (FlagNegate) this.Value = 255 - this.Value;
                break;
            }
        }
        if (pPhi2 == 1) switch(pSignal.SignalName) {    //  Read from bus phase
            default: break;
        }
    }
    // cOB.prototype.Tick = function() {
        // var lSignalID;
        // var lIR = gUnits['IR'].Opcode();
        // var li3 = lIR.substr(7-3,1) == '1';
        // var li1 = lIR.substr(7-1,1) == '1';
        // var li0 = lIR.substr(7-0,1) == '1';
        // var FlagNegate = !li3 && li1; gSignals['OB.-B'].Level = (FlagNegate) ? 1 : 0;
        // var FlagRead1  = !li3 && li0; gSignals['OB.1' ].Level = (FlagRead1 ) ? 1 : 0;
        // for (var i = 0; i < this.Inputs.length; i++) {
            // lSignalID = SignalID('OB',this.Inputs[i]);
            // if (gSignals[lSignalID].Level == 1) {
                // switch(this.Inputs[i]) {
                    // case 'RD': this.Value = (FlagRead1) ? 1 : gBusses['DB'].Value;
                               // if (FlagNegate) this.Value = 256 - this.Value;
                               // break;
                // }
            // }
        // }
    // }
}
{// class cOC
    function cOC(pX,pY) {
        cUnit.call(this,'OC',pX,pY,['0','1','C','RD']); //  RD = Set Carry for ALU computation
        this.Value = 0;
        gUnits['OC'] = this;
    }
    cOC.prototype = Object.create(cUnit.prototype);
    cOC.prototype.ProcessInput = function(pSignal, pPhi1, pPhi2) {
        if (pPhi1 == 1) switch(pSignal.SignalName) {    //  Write to bus phase, exception for operand C!
            case 'RD': {
                // var lSignalID;
                // var lIR = gUnits['IR'].Opcode();
                // var li5 = lIR.substr(7-5,1) == '1';
                // var li0 = lIR.substr(7-0,1) == '1';
                // var FlagRead0  = li5 || li0;
                // gSignals['OC.0'].Level = ( FlagRead0) ? 1 : 0;
                // gSignals['OC.C'].Level = (!FlagRead0) ? 1 : 0;
                // this.Value = (FlagRead0) ? 0 : (CPU.FL.Flag('C')) ? 1 : 0;
                this.SetValue(RandomLogic.Carry());
                break;
            }
            default: break;
        }
        if (pPhi2 == 1) switch(pSignal.SignalName) {    //  Read from bus phase
            default: break;
        }
    }
    // cOC.prototype.Tick = function() {
        // var lSignalID;
        // var lIR = gUnits['IR'].Opcode();
        // var li5 = lIR.substr(7-5,1) == '1';
        // var li0 = lIR.substr(7-0,1) == '1';
        // var FlagRead0  = li5 || li0;
        // gSignals['OC.0'].Level = ( FlagRead0) ? 1 : 0;
        // gSignals['OC.C'].Level = (!FlagRead0) ? 1 : 0;
        // for (var i = 0; i < this.Inputs.length; i++) {
            // lSignalID = SignalID('OC',this.Inputs[i]);
            // if (gSignals[lSignalID].Level == 1) {
                // switch(this.Inputs[i]) {
                    // case 'RD': this.Value = (FlagRead0) ? 0 : (CPU.FL.Flag('C')) ? 1 : 0; break;
                // }
            // }
        // }
    // }
}
{// class cAL
    function cAL(pX,pY) {
        var Nflag;
        var Cflag;
        var Vflag;
        var Zflag;
        cUnit.call(this,'AL',pX,pY,['+','AND','OR','XOR','WU'], ['N','V','C','Z']); //  OC.RD = Set Carry for ALU computation
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
    function cSH(pX,pY) {
        var Value;
        var Nflag;
        var Cflag;
        var Zflag;
        cUnit.call(this,'SH',pX,pY,['<','>','WU'],['N','C','Z']);
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

        // if (CPU.IR.Instruction().Mnemonic == 'ROR')
            // var lBreakpoint = true;

        var lSignalID;
        var FlagShiftRight = (gUnits['IR'].Bit1() == '1');
        gSignals['SH.<'].Level = (FlagShiftRight) ? 0 : 1;
        gSignals['SH.>'].Level = (FlagShiftRight) ? 1 : 0;
        var lOA = gUnits['OA'].Value;
        var lOC = gUnits['OC'].Value;
        this.Value =  (FlagShiftRight) ? (256 * lOC + lOA) >>> 1 : (lOA << 1) + lOC;
        this.Cflag =  (FlagShiftRight) ? (lOA % 2) == 1 : lOA > 127;
        this.Nflag =  (this.Value > 127) ? true : false;
        this.Zflag = !(this.Value == 0);
        this.Value %= 256;
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
    function cMM(pX,pY) {
        cUnit.call(this,'MM',pX,pY,['RD','WD']);
        gUnits['MM'] = this;
        var Values;
        this.Values = [];
        this.Mnemonics = [];
        for (var i = 0; i < 256; i++) this.Values.push(Math.floor(Math.random() * 256));
        for (var i = 0; i < 256; i++) this.Mnemonics.push('');
        this.Values[255] = parseInt('10000000',2); // Reset vector naar $80
        this.Values[10]  = parseInt('01001110',2); // Startwaarde van te verhogen waarde
        this.Values[10]  = parseInt('11111110',2); // Startwaarde van te verhogen waarde
        var lPC = parseInt('10000000',2);
     // this.Values[lPC++] = parseInt('00010101',2); // TAS    instructie
        this.Values[lPC++] = parseInt('11010000',2); // LDA $ instructie
        this.Values[lPC++] = parseInt('00001010',2); //     $ = $0A
        this.Values[lPC++] = parseInt('00000001',2); // INA    instructie
        this.Values[lPC++] = parseInt('11010001',2); // STA $ instructie
        this.Values[lPC++] = parseInt('00001010',2); //     $ = $0A
        this.Values[lPC++] = parseInt('11101011',2); // BNE $ instructie
        this.Values[lPC++] = parseInt('11111001',2); //     $ = $F9
     // this.Values[lPC++] = parseInt('11111000',2); //     $ = $F8
     // this.Values[lPC++] = parseInt('00010100',2); // TSA    instructie
        this.Values[lPC++] = parseInt('11110000',2); // JMP $ instructie
        this.Values[lPC++] = parseInt('10000000',2); //     $ = $80
    }
    cMM.prototype = Object.create(cUnit.prototype);
    cMM.prototype.GetValue = function() { return this.Values[gUnits['AD'].Address()]; }
    cMM.prototype.SetValue = function(pValue) {  this.Values[gUnits['AD'].Address()] = pValue; }
    cMM.prototype.HighlightAddress = function(pUnitName, pColor) {
        var i = gUnits[pUnitName].Address();
        var lID = 'mm' + toHex(i);
        var lHTML = '<b style="font-size:16px;"><font color="' +  pColor + '">';
        lHTML += toHex(this.Values[i]);
        lHTML += '</font></b>';
        document.getElementById(lID).innerHTML = lHTML;
    }
    cMM.prototype.Draw = function() {
        this.Value = this.GetValue();
        cUnit.prototype.Draw.call(this);
        var lID   = '';
        var lHTML = '';
        for (var i = 0; i < this.Values.length; i++) {
            lID = 'mm' + toHex(i);
            lHTML = toHex(this.Values[i]);
            if (this.Mnemonics[i] != '') lHTML += '<br /><span class="mnemonic">' + this.Mnemonics[i] + '</span>'
            document.getElementById(lID).innerHTML = lHTML;
        }
        this.HighlightAddress('SP', 'green');
        this.HighlightAddress('PC', 'blue' );
        this.HighlightAddress('AD', 'red'  );
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
    cMM.prototype.Program = function(lInstructionString) {
        var lMnemonic;
        var lOperand;
        var lIns;
        var lPC = parseInt('10000000',2);
        var lBytes = lInstructionString.split(',');
        for (var i = 0; i < 256; i++) this.Mnemonics.push('');
        for (var i=0; i < lBytes.length; i++) {
            if (lBytes[i].substring(4,5) == '#') {
                lMnemonic = lBytes[i].substring(0,5);
                lOperand  = lBytes[i].substring(5,7);
            } else if (lBytes[i].substring(4,5) == '$') {
                if (lBytes[i].substring(7,8) == '+') { lMnemonic = lBytes[i].substring(0,5) + lBytes[i].substring(7,9); }
                else                                 { lMnemonic = lBytes[i].substring(0,5); }
                lOperand  = lBytes[i].substring(5,7);
            } else {
                lMnemonic = lBytes[i];
                lOperand  = '';
            }
            lIns = cInstruction.GetInstructionFromMnemonic(lMnemonic);
            if (lIns == undefined) {
                this.Values[lPC++] = parseInt(lBytes[i],16);
            } else {
                this.Mnemonics[lPC] = lMnemonic;
                this.Values[lPC++]  = lIns.Value;
                if (lOperand != '') {
                    this.Values[lPC++] = parseInt(lOperand,16);
                }
            }
        }
        CPU.Reset();
        CPU.MM.Draw();
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
UNITTEST = function(pMnemonic) {
    switch (pMnemonic) {
        case 'INA'    : CPU.MM.Program('LDA #,00,INA,JMP $,82'); break;
        case 'DEA'    : CPU.MM.Program('LDA #,00,DEA,JMP $,82'); break;
        case 'ROL'    : CPU.MM.Program('SEC,LDA #,00,ROL,JMP $,83'); break;
        case 'ASL'    : CPU.MM.Program('SEC,LDA #,01,ASL,JMP $,83'); break;
        case 'ROR'    : CPU.MM.Program('SEC,LDA #,04,ROR,JMP $,83'); break;
        case 'LSR'    : CPU.MM.Program('SEC,LDA #,80,LSR,JMP $,83'); break;
        case 'PLA'    : CPU.MM.Program('LDA #,FE,TAS,LDA #,01,PHA,TSA,PLA,JMP $,83'); break;
        case 'PHA'    : CPU.MM.Program('LDA #,FE,TAS,LDA #,01,PHA,TSA,PLA,JMP $,83'); break;
        case 'TSA'    : CPU.MM.Program('LDA #,FE,TAS,LDA #,01,PHA,TSA,PLA,JMP $,83'); break;
        case 'TAS'    : CPU.MM.Program('LDA #,FE,TAS,LDA #,01,PHA,TSA,PLA,JMP $,83'); break;
        case 'NOP'    : CPU.MM.Program('NOP,JMP $,80'); break;
        case 'RTS'    : CPU.MM.Program('LDA #,FE,TAS,JSR $,87,JMP $,83,RTS'); break;
        case 'PLP'    : CPU.MM.Program('LDA #,FE,TAS,CLC,LDA #,00,PHP,SEC,LDA #,01,PLP,JMP $,83'); break;
        case 'PHP'    : CPU.MM.Program('LDA #,FE,TAS,CLC,LDA #,00,PHP,SEC,LDA #,01,PLP,JMP $,83'); break;
        case 'CLC'    : CPU.MM.Program('LDA #,FE,TAS,CLC,LDA #,00,PHP,SEC,LDA #,01,PLP,JMP $,83'); break;
        case 'SEC'    : CPU.MM.Program('LDA #,FE,TAS,CLC,LDA #,00,PHP,SEC,LDA #,01,PLP,JMP $,83'); break;
        case 'ADC #'  : CPU.MM.Program('LDA #,00,CLC,ADC #,01,SEC,ADC #,0F,JMP $,82'); break;
        case 'SBC #'  : CPU.MM.Program('LDA #,00,SEC,SBC #,01,CLC,SBC #,0F,JMP $,82'); break;
        case 'AND #'  : CPU.MM.Program('LDA #,FF,AND #,AA,JMP $,80'); break;
        case 'ORA #'  : CPU.MM.Program('LDA #,88,ORA #,22,JMP $,80'); break;
        case 'EOR #'  : CPU.MM.Program('LDA #,AA,EOR #,F0,JMP $,80'); break;
        case 'LDA #'  : CPU.MM.Program('LDA #,00,LDA #,01,LDA #,80,JMP $,80'); break;
        case 'LDX #'  : CPU.MM.Program('LDX #00,STX $00,STX $01,LDX $00,INX,STX $00,LDX $01,DEX,STX $01,JMP $86'); break;
        case 'LDA,X'  : CPU.MM.Program('LDX #00,LDA #00,STA $00+X,INX,JMP $84'); break;
        case 'Illegal': CPU.MM.Program('00,JMP $,80'); break;
        // case 'CMP #' : CPU.MM.Program('CMP #'
        // case 'ADC $': CPU.MM.Program('ADC $'
        // case 'SBC $': CPU.MM.Program('SBC $'
        // case 'AND $': CPU.MM.Program('AND $'
        // case 'ORA $': CPU.MM.Program('ORA $'
        // case 'EOR $': CPU.MM.Program('EOR $'
        // case 'LDA $': CPU.MM.Program('LDA $'
        // case 'STA $': CPU.MM.Program('STA $'
        // case 'CMP $': CPU.MM.Program('CMP $'
        // case 'BCC $': CPU.MM.Program('BCC $'
        // case 'BCS $': CPU.MM.Program('BCS $'
        // case 'BEQ $': CPU.MM.Program('BEQ $'
        // case 'BNE $': CPU.MM.Program('BNE $'
        // case 'BVC $': CPU.MM.Program('BVC $'
        // case 'BVS $': CPU.MM.Program('BVS $'
        // case 'BPL $': CPU.MM.Program('BPL $'
        // case 'BMI $': CPU.MM.Program('BMI $'
        case 'JMP $': CPU.MM.Program('JMP $,80'); break;
        case 'JSR $': CPU.MM.Program('LDA #,FE,TAS,JSR $,87,JMP $,83,RTS'); break;
    }
}
{// 3n+1
    Collatz = function() {}
    Collatz.Init = function() {
        var lProgram = '';
        // lProgram += 'LDA #,00,STA $,X,JSR $,STA X,JSR $,INC X,INA,BPL,84,JMP $,00';
        // STA X = 8D
        //     X = 8E
        // INC X = 90
        lProgram += 'LDA #,FF,TAS';
        lProgram += ',LDA #,00,STA $,91,JSR $,90,JSR $,93,INA,BPL $,F7,JMP $,83';
        lProgram += ',STA $,FF,RTS';
        lProgram += ',PHA,LDA $,91,INA,STA $,91,PLA,RTS';
        CPU.MM.Program(lProgram);
    }
}
{// CPU
    CPU = function() {}
    CPU.Reset = function() {
        cInfoQueue.ClearQueue();
        CPU.PC.Reset();
        IR.Reset();
        CPU.IC.Reset();
        PLA.PREP = new cSignal('PLA','PR')
    }
    CPU.Run  = function() { fRunSignal = setInterval(CPU.fRun, 100); }
    CPU.Halt = function() {              clearInterval(fRunSignal);   }
    CPU.Show = function() {
        cBus.DrawBusses();
        cUnit.DrawUnits();
    }
    CPU.Next = function() { CPU.Prepare(); CPU.Show(); }
    CPU.fRun = function() { CPU.Next(); CPU.Process(); }
    CPU.Prepare = function() {
        PLA.Prepare();
        CPU.SetRunState(true);
    }
    CPU.Process = function() {
        PLA.Tick();
        CPU.Show();
        CK.Tick();
        CPU.IC.Tick();
        CPU.SetRunState(false);
    }
    CPU.RunStateButtons = function() {
        if (CPU.RunState) {
            document.getElementById("button-next").style.display = "none";
            document.getElementById("button-process").style.visibility = "visible";
        } else {
            document.getElementById("button-next").style.display = "inline";
            document.getElementById("button-process").style.visibility = "hidden";
        }
    }
    CPU.SetRunState = function(pRunState) {
        CPU.RunState = pRunState;
        CPU.RunStateButtons();
    }
}