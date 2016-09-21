// ========================================================================== //
function B0RegisterInit() {
    lB0 = new cUnit('B0');
    // new cHighSlab([1,0,3], 'ENS');
    // new cHighSlab([7,0,0], 'WES');
    // new cHighSlab([8,0,0], 'WE');
    // new cHighSlab([8,0,4], 'WEN');
    new    cBlock([2,0,3], 'sandstone', 0);
    new cRepeater([0,0,4], 'E', 1, 'B.f0', ['-TCK.F2']);
    new cRepeater([0,0,0], 'E', 1, 'B.d0', ['-TCK.F1']);
    new     cWir3([1,0,0], 'WS');
    new     cWir3([1,0,1], 'N', 'S');
    new     cWir3([1,0,2], 'NS');
    new     cWir3([1,0,4], 'WN');
    // new     cWir3([1,1,3], 'ns', 'E'); NameLastSignal('B.df0');
    // new     cWir3([2,1,3], 'We');
    // new     cWir3([3,0,1], 'HS');
    // new     cWir3([3,0,2], 'NS');
    // new     cWir3([3,0,3], 'MNS');
    new     cWir3([3,1,0], 's');
    new    cBloc2([3,0,0], 'B.f0|d0', 'U');
    new cRedTorch([4,0,0], 'E');
    // new     cWir3([5,0,0], 'WE');
    // new     cWir3([6,0,0], 'WE');
    // new cRepeater([5,0,2], 'E', 1, 'B.f1', ['-TCK.F3']);
    // new     cWir3([6,0,2], 'WE');
    // new    cBloc2([7,0,2], '', 'W');
    // new     cWir3([7,1,2], 'wn');
    // new     cWir3([7,0,1], 'Z', 'N');
    // new     cWir3([7,1,0], 'ws', 'E');
    // new     cWir3([8,1,0], 'WE');
    // new     cWir3([9,1,0], 'W');
    // new    cBloc2([9,0,0], 'B.-df0|f1', 'U');
    // new cRedTorch([10,0,0], 'E'); NameLastSignal('B.df0.-f1');
    // new     cWir3([10,0,1], 'NS');
    new cWir3([3,0,4], 'NE');
    new cWir3([4,0,4], 'WE');
    // new cWir3([5,0,4], 'WE');
    // new cWir3([6,0,4], 'WE');
    // new cWir3([7,0,4], 'W', 'E');
    // new cRedTorch([8,0,2], 'E');
    // new cWir3([8,0,3], 'N', 'S');
    // new cWir3([8,1,4], 'wEn');
    // new cWir3([9,1,4], 'W');
    // new cBloc2([9,0,4], 'B.df0|-f1', 'U');
    // new cRedTorch([10,0,4], 'E'); NameLastSignal('B.-df0.f1');
    // new cWir3([10,0,3], 'NS');
    // new cWir3([10,0,2], 'NSE'); NameLastSignal('B.Q0');
    // BRegisterCommon(0);
    // Bf1(0);
    lB0.SetIndexLastBlock(gBlocks.length);
    return lB0;
}
function BnRegisterInit(pBitnr) {
    lBn = new cUnit('B'+pBitnr);
    // new cHighSlab([ 1,0, 3],'ENS');
    // new cHighSlab([ 7,0, 0],'WES');
    // new cHighSlab([ 8,0, 0],'WE');
    // new cHighSlab([ 8,0, 4],'WEN');
    new    cBlock([ 2,0, 3],'sandstone', 0);
    new cRepeater([ 0,0, 4],'E', 1, 'B.f0', ['-TCK.F2']);
    new cRepeater([ 0,0, 0],'E', 1, 'B.d1', ['-TCK.F1']);
    new    cBloc2([ 1,0, 0],'', 'W');
    new cRedTorch([ 1,0, 1],'S');  NameLastSignal('B.-d1');
    new     cWir3([ 1,0, 2],'N', 'S');
    // new     cWir3([ 1,1, 3],'ns', 'E'); NameLastSignal('B.-d1|f0');
    // new     cWir3([ 2,1, 3],'We');
    new     cWir3([ 1,0, 4],'WN');
    // new     cWir3([ 3,0, 3],'MNS');
    // new     cWir3([ 3,0, 2],'NS');
    // new     cWir3([ 3,0, 1],'NS');
    new     cWir3([ 3,0, 0],'SE');
    new     cWir3([ 4,0, 0],'WE');
    // new     cWir3([ 5,0, 0],'WE');
    // new     cWir3([ 6,0, 0],'WE');
    // new cRepeater([ 5,0, 2],'E', 1, 'B.f1', ['-TCK.F3']);
    // new     cWir3([ 6,0, 2],'WE');
    // new    cBloc2([ 7,0, 2],'', 'W');
    // new     cWir3([ 7,1, 2],'wn');
    // new     cWir3([ 7,0, 1],'Z', 'N');
    // new     cWir3([ 7,1, 0],'ws', 'E');
    // new     cWir3([ 8,1, 0],'WE');
    // new     cWir3([ 9,1, 0],'W');
    // new    cBloc2([ 9,0, 0],'B.-d1f0|f1', 'U');
    // new cRedTorch([10,0, 0],'E'); NameLastSignal('B.d1f0.-f1');
    // new     cWir3([10,0, 1],'NS');
    new     cWir3([ 3,1, 4],'n');
    new    cBloc2([ 3,0, 4],'B.f0|d0', 'U');
    new cRedTorch([ 4,0, 4],'E');
    // new     cWir3([ 5,0, 4],'WE');
    // new     cWir3([ 6,0, 4],'WE');
    // new     cWir3([ 7,0, 4],'W', 'E');
    // new cRedTorch([ 8,0, 2],'E');
    // new     cWir3([ 8,0, 3],'N', 'S');
    // new     cWir3([ 8,1, 4],'wEn');
    // new     cWir3([ 9,1, 4],'W');
    // new    cBloc2([ 9,0, 4],'B.d1f0|-f1', 'U');
    // new cRedTorch([10,0, 4],'E'); NameLastSignal('B.-d1f0.f1');
    // new     cWir3([10,0, 3],'NS');
    // new     cWir3([10,0, 2],'NSE'); NameLastSignal('B.Q1');
    BRegisterCommon(pBitnr);
    lBn.SetIndexLastBlock(gBlocks.length);
    return lBn;
}
function BRegisterCommon(pBitnr) {
    function Bf0dn(pBitnr) {
    new cHighSlab([ 1,0, 3],'ENS');
    new     cWir3([ 1,1, 3],'nsE'); NameLastSignal('B.df0');
    new     cWir3([ 2,1, 3],'We');
    new     cWir3([ 3,0, 1],'HS');
    new     cWir3([ 3,0, 2],'NS');
    new     cWir3([ 3,0, 3],'MNS');
    new     cWir3([ 5,0, 0],'WE');
    new     cWir3([ 5,0, 4],'WE');
    new     cWir3([ 6,0, 0],'W', 'E');
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
        new     cWir3([ 6,2, 5],'Ns'); NameLastSignal('B.f1(' + pBitnr + ')');
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
    // Bf0dn(pBitnr);
    Bf1(pBitnr);
    // Bf1f0dn(pBitnr);
}
function BRegisterSignals() {
    gBlocks = [];
    gSignals = [];
    tCK  = TclockUnit('TCK', 5, 5);
    lB0 = B0RegisterInit();
    lB1 = BnRegisterInit(1);
    lB2 = BnRegisterInit(2);
    lB0.Move([0,1,0]);
    lB1.Move([0,5,0]);
    lB2.Move([0,9,0]);
    // SetSignalsToShow('B.f0', 'B.f1', 'B.d0', 'B.Q0', 'B.d1', 'B.Q1');
    SetSignalsToShow('B.f0', 'B.f1', 'B.d1', 'B.Q1','B.f1-in'
    ,'B.f1(0)','B.f1(1)','B.f1(2)'
    ,'B.-f1(0)','B.-f1(1)','B.-f1(2)');
    Signaal('B');
}
