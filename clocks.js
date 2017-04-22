// ========================================================================== //
function cClockBlock(pSignalName, pFrequency = 2, pPower = 0) {
    var Location;
    var BlockInfo;
    var PowerInfo;
    var Frequency;
    this.Frequency = pFrequency;
    this.Location  = new cLocation([-1,-1,-1]);
    this.BlockInfo = new cBlockInfo('sandstone', 0);
    this.PowerInfo = new cPowerInfo(this, pPower, 0, pSignalName);
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
        new cClockBlock(      pUnitName + '.F' + i, lFrequency);
        new cClockBlock('-' + pUnitName + '.F' + i, lFrequency, gMaxPower);
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
    Signaal('CK');
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
    Signaal('P2');
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
    this.Location  = new cLocation([-1,-1,-1]);
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
    var lInterval = pInterval;
    for (var i = 0; i < nPulsars; i++) {
        var lDelay = (i < pDelays.length) ? pDelays[i] : 0;
        new cPulsar(pUnitName + '.R' + i, lInterval, pPulseLength, lInterval / 2 + lDelay);
        lInterval *= 2;
    }
    lPulse.SetIndexLastBlock(gBlocks.length);
    return lPulse;
}
