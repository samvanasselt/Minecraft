    var ctx;
    var gComponents = [];
    var gDisplay = [];
function initCanvas() {
    var canvas = document.getElementById('canvasSignaal');
    if (canvas.getContext){
        ctx = canvas.getContext('2d');
        var w = 10;
        var h = 16;
        var dx = 0;
        ctx.font="10px Verdana";
        try { for (var y = 10; y < 600; y += 25) {
            for (var x = 100; x < 1500; x += w) {
                ctx.strokeStyle = 'rgb(224,224,224)';
                ctx.beginPath();
                ctx.rect(x,y,w,h);
                ctx.stroke();
                if (x % (10 * w) == 0) {
                    ctx.strokeStyle = 'rgb(192,192,192)';
                    ctx.beginPath();
                    ctx.rect(x,y,1,25);
                    ctx.stroke();
                }
        }}}
        catch(err) { alert(err);}
    }
}
// ========================================================================== //
function ShowError(pHTML) {
     document.getElementById("foutmelding").innerHTML += pHTML;
}
// ========================================================================== //
function cComponent(pKind, pDelay = 0, pPower = 0) {
    var Name;
    var Kind;
    var Delay;
    var PowerLastDisplay;
    var Display;
    var Power = [];
    var SourceNames = [];
    var Sources = [];

    this.Kind = pKind;
    this.Display = false;
    this.PowerLastDisplay = 0;
    this.Reset(pDelay, pPower);
}
cComponent.prototype.Reset = function (pDelay = 0, pPower = 0) {
    this.Delay = pDelay;
    this.Power = [];
    for (var i = 0; i < this.Delay + 1; i++) {this.Power.push(pPower);}
}
cComponent.prototype.SetSources = function () {
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
cComponent.prototype.Tick = function () {
    for (var i = 0; i < this.Delay; i++) {this.Power[i] = this.Power[i+1];}
}
cComponent.prototype.Draw = function (t, pRow) {
    if (this.Display) {
        var x = 100 + 10 * t;
        var y = 25 * pRow - this.Power[0];
        ctx.strokeStyle = (pRow % 2 == 0) ? 'rgb(0,0,128)' : 'rgb(0,0,0)';
        ctx.beginPath();
        ctx.moveTo(x     , 25 * pRow - this.PowerLastDisplay);
        ctx.lineTo(x     , y);
        ctx.lineTo(x + 10, y);
        // ctx.rect(100 + 10 * t, 25 * pRow - this.Power[0],10,1);
        ctx.stroke();
        this.PowerLastDisplay = this.Power[0];
        return pRow + 1;
    } else {
        return pRow;
    }
}
cComponent.prototype.ToonNaam = function (pRow) {
    ctx.fillText(this.Name, 15, 25 * pRow);
    ctx.fillText(this.Kind, 50, 25 * pRow);
}
cComponent.prototype.ErrorMessage = function (pError) {
    var lHTML = '';
     if (pError != 'OK') { lHTML += '<br/><b>' + pError + '</b>'; }
     lHTML += '<br/>' + this.Name;
     lHTML += ' | ' + this.Kind;
     lHTML += ' | ' + this.Delay + ' Power: ';
     for (var i = 0; i < this.Delay + 1; i++) { lHTML += ' ' + this.Power[i]; }
     lHTML += ' | ' + this.Sources.length + ' Sources: ';
     for (var i = 0; i < this.Sources.length; i++) { lHTML += ' ' + this.Sources[i].Name; }
     ShowError(lHTML);
}
// ========================================================================== //
function cInverter(pName, pSourceNames) {
    this.Name = pName;
    this.SourceNames = (pSourceNames == undefined) ? [] : pSourceNames;
    this.Reset(1, 15);
}
cInverter.prototype = new cComponent('inverter', 1, 15);
cInverter.prototype.SetInput = function () {
    this.Power[this.Delay] = (this.Sources[0].Power[0] == 0) ? 15 :  0;
}
cInverter.prototype.Dump = function () {
     var lHTML = '';
     lHTML += this.Kind;
     lHTML += ' ' + this.Delay;
     lHTML += ' ' + this.Timer;
     for (var i = 0; i < this.Delay + 1; i++) { lHTML += ' ' + this.Power[i]; }
     return lHTML;
}
// ========================================================================== //
function cRepeater(pName, pSourceNames, pDelay) {
    this.Name = pName;
    // this.Locked = false;
    this.SourceNames = (pSourceNames == undefined) ? [] : pSourceNames;
    this.Reset(pDelay, 0);
}
cRepeater.prototype = new cComponent('repeater', 1, 0);
cRepeater.prototype.SetInput = function () {
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
// ========================================================================== //
function cWire(pName, pLength = 1) {
    var Wirelength;
    this.Wirelength = pLength;
    this.Name = pName;
    this.Reset(0, 0);
}
cWire.prototype = new cComponent('wire', 0, 0);
cWire.prototype.SetInput = function () {
    this.Power[this.Delay] = (this.Sources[0].Power[0] > this.Wirelength) ? this.Sources[0].Power[0] - this.Wirelength : 0;
}
// ========================================================================== //
function cOr(pName, pSourceNames) {
    this.Name = pName;
    this.SourceNames = (pSourceNames == undefined) ? [] : pSourceNames;
    this.Reset(0, 0);
}
cOr.prototype = new cComponent('or', 0, 0);
cOr.prototype.SetInput = function () {
    this.Power[this.Delay] = 0;
    for (var i = 0; i < this.Sources.length; i++) {
        if (this.Power[this.Delay] < this.Sources[i].Power[0]) {
            this.Power[this.Delay] = this.Sources[i].Power[0];
    }}
}
// ========================================================================== //
function cLever(pName) {
    this.Name = pName;
    this.SourceNames = [];
    this.Reset(0, 0);
}
cLever.prototype = new cComponent('lever', 0, 0);
cLever.prototype.SetInput = function () {}
cLever.prototype.Off = function () { this.Power[0] =  0; }
cLever.prototype.On  = function () { this.Power[0] = 15; }
// ========================================================================== //
function ComponentIndex (pName) {
    var lIndex = -1;
    var i = 0;
    while (lIndex == -1 && i < gComponents.length) {
        if (gComponents[i].Name == pName) {lIndex = i;}
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
function ClockInit() {
    var lRepname = '';
    var lSource = '';
    gComponents.push(new cInverter('CK',['CK.4.r']));
    for (var r = 1; r <= 4; r++) {
        lRepname = 'CK.' + r + '.r';
        lSource = (r == 1) ? 'CK' : 'CK.' + (r-1) + '.r';
        gComponents.push(new cRepeater(      lRepname, [lSource ], 1 ));
        gComponents.push(new cInverter('-' + lRepname, [lRepname]    ));
    }
    //  Afgeleide clocksignalen
    gComponents.push(new cOr(      'CK.p0'  , [ 'CK.1.r', 'CK.2.r', 'CK.3.r']));
    gComponents.push(new cOr(      'CK.p1'  , ['-CK.1.r','-CK.2.r','-CK.3.r']));
    gComponents.push(new cRepeater('CK.p0+1', ['CK.p0'  ], 1));
    gComponents.push(new cInverter('Phi-0'  , ['CK.p0+1']   ));
    gComponents.push(new cInverter('Phi-1'  , ['CK.p1'  ]   ));
    gComponents.push(new cInverter('-Phi-0' , ['Phi-0'  ]   ));
    gComponents.push(new cInverter('-Phi-1' , ['Phi-1'  ]   ));
}
function ClockSignals() {
    gComponents = [];
    ClockInit();
    gDisplay = ['CK','Phi-0','Phi-1'];
    Signaal();
}
// ========================================================================== //
function AddInstructionClockUnit(pUnitnr, pSource = '') {
    var lPrefix =  'IC.' + pUnitnr + '.';
    var nPrefix = '-IC.' + pUnitnr + '.';
    var lSource = pSource;
    if (lSource == '') { lSource = 'IC.' + (pUnitnr - 1) + '.t'; }
    gComponents.push(new cRepeater( lPrefix + 's.Lock', ['-Phi-0'                             ], 1));
    gComponents.push(new cRepeater( lPrefix + 't.Lock', ['-Phi-1'                             ], 1));
    gComponents.push(new cRepeater( lPrefix + 's'     , [lSource          , lPrefix + 's.Lock'], 1));
    gComponents.push(new cInverter( nPrefix + 's'     , [lPrefix + 's'                        ]   ));
    gComponents.push(new cOr      ( nPrefix + 't.OR'  , [nPrefix + 's'    , 'RST'             ]   ));
    gComponents.push(new cInverter( lPrefix + 't.AND' , [nPrefix + 't.OR'                     ]   ));
    gComponents.push(new cRepeater( lPrefix + 't'     , [lPrefix + 't.AND', lPrefix + 't.Lock'], 1));
    gComponents.push(new cInverter( nPrefix + 't'     , [lPrefix + 't'                        ]   ));
    gComponents.push(new cOr      ( nPrefix + 'T'     , [nPrefix + 't'    ,'CK.4.r'           ]   ));
    gComponents.push(new cInverter( lPrefix + 'T'     , [nPrefix + 'T'                        ]   ));
    gComponents[ComponentIndex(lPrefix + 'T')].Display = true;
}
function InstructionClockInit() {
    ClockInit();
    gComponents.push(new cLever   ( 'RST'));
    gComponents.push(new cInverter('-RST', ['RST']));
    gComponents.push(new cRepeater( 'IC.0.t.Lock', ['-Phi-1'               ], 1));
    gComponents.push(new cRepeater( 'IC.0.t'     , [ 'RST'  , 'IC.0.t.Lock'], 1));
    gComponents.push(new cInverter('-IC.0.t', [ 'IC.0.t'         ]));
    gComponents.push(new cOr      ('-IC.0.T', ['-IC.0.t','CK.4.r']));
    gComponents.push(new cInverter( 'IC.0.T', ['-IC.0.T'         ]));
    AddInstructionClockUnit(1);
    AddInstructionClockUnit(2);
    AddInstructionClockUnit(3);
    AddInstructionClockUnit(4);
    AddInstructionClockUnit(5);
    gComponents.push(new cRepeater('IC.PreRST.Lock', ['-Phi-0'] ));
    gComponents.push(new cRepeater('IC.RST.Lock'   , ['-Phi-1'] ));
    gComponents.push(new cOr      ('IC.5.t or RST' , ['IC.5.t'       , 'RST'] ));
    gComponents.push(new cRepeater('IC.PreRST'     , ['IC.5.t or RST', 'IC.PreRST.Lock']));
    gComponents.push(new cRepeater('IC.RST'        , ['IC.PreRST'    , 'IC.RST.Lock'   ]));

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
    gComponents.push(new cRepeater('LR.Lock', ['CK.1.r'           ], 1));
    gComponents.push(new cRepeater('LR'     , ['CK.1.r', 'LR.Lock'], 1));
    gComponents.push(new cRepeater('NR'     , ['CK.2.r'           ], 1));
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
    gComponents.push(new cInverter( 'FF.In'     , [ 'CK'   ]   ));
    gComponents.push(new cRepeater( 'FF.R1.Lock', [ 'CK'   ], 1));
    gComponents.push(new cRepeater( 'FF.R2.Lock', [ 'FF.In'], 1));
    gComponents.push(new cRepeater( 'FF.R1'     , ['-FF.R2', 'FF.R1.Lock'], 1));
    gComponents.push(new cRepeater( 'FF.R2'     , [ 'FF.R1', 'FF.R2.Lock'], 1));
    gComponents.push(new cInverter('-FF.R2'     , [ 'FF.R2']   ));
}
function FlipFlopSignals() {
    gComponents = [];
    ClockInit();
    FlipFlopInit();
    gDisplay = ['CK', 'FF.In', 'FF.R1.Lock', 'FF.R2.Lock', 'FF.R1', 'FF.R2', '-FF.R2'];
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
    initCanvas();
    CheckComponentsAndDisplay();
    for (var i = 0; i < gDisplay.length; i++) {
        try { gComponents[ComponentIndex(gDisplay[i])].Display = true; }
        catch (err) { console.log(gDisplay[i] + ' ' + err); }
    }
    var lRow = 1;
    for (var i = 0; i < gDisplay.length; i++) {
        ctx.fillText(ComponentIndex(gDisplay[i]), 0, 25 * lRow);
        gComponents [ComponentIndex(gDisplay[i])].ToonNaam(lRow);
        lRow++;
    }
    for (t = 0; t < 140; t++) {
        var lRow = 1;
        if (t == 10 && ComponentIndex('RST') > 0) { gComponents[ComponentIndex('RST')].Off(); }
        if (t == 14 && ComponentIndex('LR' ) > 0) { gComponents[ComponentIndex('LR')].Reset(1,15); }
        for (var i = 0; i < gComponents.length; i++) { gComponents[i].SetInput();  }
        for (var i = 0; i < gDisplay.length; i++) { lRow = gComponents[ComponentIndex(gDisplay[i])].Draw(t,lRow); }
        for (var i = 0; i < gComponents.length; i++) { gComponents[i].Tick();      }
    }
}


