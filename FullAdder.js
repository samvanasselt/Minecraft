function FullAdderOutlineA() {
    for (var x =  1; x < 15; x++) new cOutline([x,0,4], 'stained_hardened_clay',  4)
    new cOutline([ 3,0,5], 'stained_hardened_clay',  4);
    new cOutline([10,0,5], 'stained_hardened_clay',  4);
    new cOutline([14,0,5], 'stained_hardened_clay',  4);
}
function FullAdderOutlineB() {
    for (var x = 1; x < 15; x++) new cOutline([x,0,7], 'stained_hardened_clay', 14);
}
function FullAdderOutlineCinput() {
    for (var x =  4; x < 14; x++) new cOutline([ x,0, 9], 'stained_hardened_clay', 5);
    for (var z = 10; z < 15; z++) new cOutline([10,0, z], 'stained_hardened_clay', 5);
                                  new cOutline([ 5,0,10], 'stained_hardened_clay', 5);
                                  new cOutline([ 4,0, 8], 'stained_hardened_clay', 5);
                                  new cOutline([13,0, 8], 'stained_hardened_clay', 5);
                                  new cOutline([ 4,1,8], 'stained_hardened_clay',  5);
}
function FullAdderOutlineCoutput() {
    for (var z =  8; z < 13; z++) new cOutline([ 2,0, z], 'stained_hardened_clay', 1);
    for (var z =  6; z < 12; z++) new cOutline([15,0, z], 'stained_hardened_clay', 1);
    for (var x =  3; x <  8; x++) new cOutline([ x,0,12], 'stained_hardened_clay', 1);
    for (var x =  7; x < 10; x++) new cOutline([ x,0,11], 'stained_hardened_clay', 1);
    for (var x = 11; x < 15; x++) new cOutline([ x,0,11], 'stained_hardened_clay', 1);
                                  new cOutline([ 5,0,11], 'stained_hardened_clay', 1);
}
function FullAdderOutlineQ() {
    var xQbase = [4,8,11,13];
    var zQend  = [8, 9,9, 8];
    for (var i = 0; i < xQbase.length; i++) {
        x = xQbase[i];
        for (var z = 4; z < zQend[i]; z++) {
            new cOutline([x,0,z], 'stained_hardened_clay', 3);
    }}
    for (var x = 4; x < 14; x++) {new cOutline([x,0,2], 'stained_hardened_clay', 3); }
    new cOutline([8,0,1], 'stained_hardened_clay', 3);
}
function FullAdderOutline(pUnitName) {
    lFAoutline = new cUnit(pUnitName + 'ol', gBlocks.length);
    FullAdderOutlineA();
    FullAdderOutlineB();
    FullAdderOutlineCinput();
    FullAdderOutlineCoutput();
    FullAdderOutlineQ();
    lFAoutline.SetIndexLastBlock(gBlocks.length);
    lFAoutline.Move ([ 0, 1, 0]);
}
function FullAdderInputA() {
    new cRepeater([1,1,4], 'E', 1, 'A', ['-TCK.F1']); //
    for (var x =  2; x <  7; x++) if (x != 3) new cWir3 ([x,1,4], 'WE');
    for (var x = 11; x < 14; x++) new cWir3 ([x,1,4], 'WE'); new cWir3([14,1,4], 'WS');
    new cWir3([3,1,4], 'WES'); new cWir3([7,1,4], 'WE', 'S'); new cWir3([8,1,4], 'W', 'E');
    new cBlock([ 3,0,5], 'stained_hardened_clay',  4); new cWir3([ 3,1,5], 'N', 'S'); NameLastSignal('FA.Aa');
    new cBlock([10,0,5], 'stained_hardened_clay',  4); new cWir3([10,1,5], 'N', 'S'); NameLastSignal('FA.Ac');
    new cBlock([14,0,5], 'stained_hardened_clay',  4); new cWir3([14,1,5], 'N', 'S'); NameLastSignal('FA.Ad');
    new cHighSlab([7,1,5], 'N');                       new cWir3([ 7,2,5], 'n', 'E'); NameLastSignal('FA.Ab');
    new cBloc2([ 9,1,4], 'FA.Ablock', 'W');               new cRedTorch([10,1,4], 'E');
}
function FullAdderInputB() {
    new cRepeater([1,1,7], 'E', 1, 'B', ['-TCK.F2']);
    for (var x = 2; x < 11; x++) { if (x == 3 || x == 6 || x == 10) {new cWir3([x,1,7],'WE','N') } else {new cWir3([x,1,7],'WE');}}
    new cWir3 ([11,1,7], 'W', 'E');
    new cHighSlab([ 3,1,6], 'NS'); new cWir3([ 3,2, 6], 'ns', 'WE'); NameLastSignal('FA.Ba');
    new cHighSlab([10,1,6], 'NS'); new cWir3([10,2, 6], 'ns', 'E');  NameLastSignal('FA.Bc');
    new cHighSlab([14,1,6], 'NS'); new cWir3([14,2, 6], 'ns', 'WE'); NameLastSignal('FA.Bd');
    new cBloc2([12,1,7], 'FA.Bblock', 'W'); new cRedTorch([13,1,7], 'E'); new cWir3 ([14,1,7], 'WN');
    new cHighSlab([6,1,6],  'S'); new cWir3([6,2,6],  's');
    new cHighSlab([6,2,7], 'NS'); new cWir3([6,3,7], 'nS');
    new cBloc2([ 6,3,8], 'FA.Bhigh', 'N'); new cRedTorch([7,3,8], 'E'); NameLastSignal('FA.Bb');
}
function FullAdderInputC() {
    new cRepeater([10,1,14], 'N', 1, 'C', ['-TCK.F3']);
    new cHighSlab([10,0,13], 'NS');  new cWir3    ([10,1,13], 'NS');
    new cHighSlab([10,0,12], 'WNS');  new cWir3    ([10,1,12], 'WNS');
    new cHighSlab([10,0,11], 'ENS');  new cWir3    ([10,1,11], 'ENS');
    new cHighSlab([10,0,10], 'NS');  new cWir3    ([10,1,10], 'NS');
    new cHighSlab([10,1,9], 'WES'); new cWir3([10,2,9], 'Ws', 'E');
    //
    new cBloc2([11,2,9], '', 'W'); new cWir3([11,3,9], 'w', 'N');   NameLastSignal('FA.Cc');
    new cRedTorch([12,2, 9], 'E');
    new cHighSlab([13,0,9], 'WENS');  new cWir3([13,1,9], 'M','N'); NameLastSignal('FA.Cd');
    new cHighSlab([13,1, 8], 'NS'); new cWir3([13,2, 8], 's', 'N');
    //
    new cHighSlab([9,1,9], 'WE' ); new cWir3([9,2,9], 'WE');
    new cHighSlab([8,1,9], 'WEN'); new cWir3([8,2,9], 'WE', 'N');  NameLastSignal('FA.Cb');
    new cHighSlab([7,1,9], 'WE' ); new cWir3([7,2,9], 'WE');
    new cHighSlab([6,1,9], 'WES'); new cWir3([6,2,9], 'ES', 'W');
    new cBloc2([5,2,9], '', 'U'); new cWir3([5,3,9], 'es');
    new cRedTorch([ 4,2, 9], 'W');
    new cWir3([4,2,8], 'NS'); NameLastSignal('FA.Ca');
    //  Naar de AND
    new cWir3([ 5,2,10], 'H', 'S');
}
function FullAdderOutputC() {
    //  A or B
    for (var z = 7; z < 12; z++) new cHighSlab([ 2,2,z], 'NS');
    for (var z = 7; z < 12; z++) new cWir3    ([ 2,3,z], 'NS');
    new cHighSlab([ 2,2, 6], 'ES'); new cWir3([ 2,3, 6], 'eS');
    new cHighSlab([ 2,2,12], 'EN'); new cWir3([ 2,3,12], 'EN');
    new cHighSlab([ 3,1,12], 'W'); new cWir3([ 3,2,12], 'M', 'E'); NameLastSignal('A+B');
    //  (A or B) and C
    new cBloc2([ 4,2,12], '', 'W');
    new cBlock([ 5,2,12], 'stained_hardened_clay', 1);
    new cBloc2([ 5,2,11], '', 'N');
    new cRedTorch([4,3,12], 'U'); new cRedTorch([5,3,11], 'U'); new cWir3([5,3,12],'WN'); // AND gate
    new cRedTorch([6,3,12], 'E');
    new cHighSlab([7,2,12], 'W'); new cWir3([7,3,12], 'W', 'N');
    new cHighSlab([7,2,11], 'S'); new cWir3([7,3,11], 'S', 'W');
    new cHighSlab([8,3,11], 'W'); new cWir3([8,4,11], 'w', 'E');
    new cHighSlab([9,4,11], 'W'); new cWir3([9,5,11], 'w', 'E'); NameLastSignal('(A+B).C');
    //  A and B = not (not A or not B)
    new cWir3    ([15,3,6], 'wS');
    for (var z = 7; z < 11; z++) new cHighSlab([15,2,z], 'NS');
    for (var z = 7; z < 11; z++) new cWir3    ([15,3,z], 'NS');
    new cBloc2([15,3,11],  '', 'N'); // new cBlock([15,3,11], 'stained_hardened_clay', 1);
    new cRedTorch([14,3,11],'W' );
    new cHighSlab([13,2,11], 'E'); new cWir3([13,3,11],'WE');
    new cHighSlab([12,2,11],'WE'); new cWir3([12,3,11],'E','W');
    new cHighSlab([11,3,11], 'E'); new cWir3([11,4,11],'e','W'); NameLastSignal('AB');
    //  Carry-out = ((A or B) and C) or (A and B)
    new cHighSlab([10,4,11], 'WE'); new cWir3([10,5,11],'We'); NameLastSignal('C-out');

}
function FullAdderOutputQ() {
    // A or B or not C
    var lDir = 'W';
    for (var z = 4; z < 8; z++) {
        if (5 <= z && z <= 6) new cHighSlab([4,2,z], 'NS');
        else                  new cBloc3([4,2,4], 'U'); // new cBlock   ([4,2,z], 'stained_hardened_clay', 3);
        lDir = (z == 6) ? 'wNS' : (z == 7) ? 'Ns' : 'NS';
        new cWir3([4,3,z], lDir);
    }
    new cRedTorch([ 4,2,3], 'N'); NameLastSignal('Q.+A+B-C');
    // // A or not B or C
    new cBloc3   ([8,2,4], 'U'); new cWir3([8,3,4], 'NS');
    new cHighSlab([8,2,5], 'WNS'); new cWir3([8,3,5], 'wNS');
    new cHighSlab([8,2,6], 'NS'); new cWir3([8,3,6], 'NS');
    new cHighSlab([8,2,7], 'NS'); new cWir3([8,3,7], 'NS');
    new cHighSlab([8,2,8], 'WNS'); new cWir3([8,3,8], 'WNs');
    new cRedTorch([8,2,3], 'N'); NameLastSignal('Q.+A-B+C');
    // not A or B or C
    for (var z = 4; z < 9; z++) {
        if (4 < z) new cHighSlab([11,2,z], 'NS');
        else       new cBloc3   ([11,2,z], 'U'); // 'stained_hardened_clay', 3);
        if (z == 6) {lDir = 'wNS'} else {lDir = 'NS'};
        new cWir3([11,3,z], lDir);
    }
    new cRedTorch([11,2,3], 'N'); NameLastSignal('Q.-A+B+C');
    // (A and B) or not C = not A or not B or not C
    for (var z = 4; z < 8; z++) {
        if (4 < z) new cHighSlab([13,2,z], 'NS');
        else       new cBloc3   ([13,2,z], 'U'); // 'stained_hardened_clay', 3);
        lDir = (z == 6) ? 'eNS' : (z == 7) ? 'Ns' : 'NS';
        new cWir3([13,3,z], lDir);
    }
    new cRedTorch([13,2,3], 'N'); NameLastSignal('Q.-A-B-C');
    // Q = A xor B xor C = or van bovenstaande
    for (var x = 4; x < 14; x++) {
        var lDir = (x == 4) ? 'ES' : (x == 8) ? 'WENS' : (x == 11) ? 'WES' : (x == 13) ? 'WS' : 'WE';
        new cWir3([x,2,2], lDir);
        }
    new cWir3 ([8,2,1],'S', 'N');
    new cRepeater([8,2,0], 'N', 1); NameLastSignal('Q');
}

function FullAdderUnit(pUnitName) {
    lFA = new cUnit(pUnitName);
    FullAdderInputA();
    FullAdderInputB();
    FullAdderInputC();
    FullAdderOutputC();
    FullAdderOutputQ();
    lFA.Finish();
    return lFA;
}
function FullAdderInit(pUnitName) {
    lFAoutline = new cUnit('FA-Outline');
    FullAdderOutline();
    lFAoutline.Finish();
    lFA0  = FullAdderUnit('FA0');
    // lFA1  = FullAdderUnit('FA1');
    lFAoutline.Move ([ 0, 1, 0]);
    lFA0.Move ([ 0, 1, 0]);
    // lFA1.Move ([ 0, 5, 0]);
}
function FullAdderSignals() {
    gBlocks = [];
    gSignals = [];
    gBlocks = [];
    gSignals = [];
    tCK  = TclockUnit('TCK', 5, 5);
    FullAdderInit('FA');
    SetSignalsToShow('A','B','C','Q','C-out','Q.+A+B-C','Q.+A-B+C','Q.-A+B+C','Q.-A-B-C','008003001','A+B','(A+B).C','AB','C-out');
    // SetSignalsToShow('FA.A','FA.B','FA.C');
    // SetSignalsToShow('P.Q0', 'FA.A', 'FA.Ablock', 'FA.Aa', 'FA.Ab', 'FA.Ac', 'FA.Ad');
    // SetSignalsToShow('P.Q1', 'FA.B', 'FA.Bblock', 'FA.Ba', 'FA.Bb', 'FA.Bc', 'FA.Bd');
    // SetSignalsToShow('P.Q2', 'FA.C', 'FA.Cblock', 'FA.Ca', 'FA.Cb', 'FA.Cc', 'FA.Cd');
    // SetSignalsToShow('P.Q2', 'FA.Co', '003003012', 'FA.(A|B).C');
    Signaal('FA');
}
