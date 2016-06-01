<?php
    class cSolidBlock {
        var $Name;
        function __construct($pName) {
            $this->Name  = $pName ;
        }
    }
    class cLocation {
        var $x; var $y; var $z; 
        function __construct($px, $py, $pz) {
            $this->x = $px;
            $this->y = $py;
            $this->z = $pz;
        }
    }
    class cBlock  {
        var $BlockObject;
        var $Location;
        function __construct($pObject, $pLocation) {
            $this->BlockObject = $pObject;
            $this->Location    = $pLocation;
        }
    }
    class cRedstone {
        var $Name;
        var $Delay; // Power Transmit Time in clock ticks
        var $Decrm; // Delay Decrement Counter (output = input after delay)
        var $Power; // Power Output
        var $Input; // Power Input 
        function __construct($pName, $pDelay, $pPower) {
            $this->Name  = $pName ;
            $this->Delay = $pDelay;
            $this->Decrm = $pDelay;
            $this->Power = $pPower;
            $this->Input = 0; // Unpowered
        }
        function ClockTick() {
            if (--$this->Decrm <= 0) {$this->Decrm = $this->Delay; $this->Power = $this->Input;}
        }
    }
    class cDust extends cRedstone {
        function __construct() { parent::__construct('Dust', 0, 0); }
        function ClockTick()   { if (--$this->Decrm <= 0) {$this->Decrm = $this->Delay; $this->Power = max(0, $this->Input - 1);}}
    }
    class cTorch extends cRedstone {
        function __construct() {
            parent::__construct('Torch', 1, 15);
        }
    }
    class cRepeater extends cRedstone {
        var $Locked;
        function __construct() {
            parent::__construct('Repeater', 1, 0);
            $this->Locked = false;
        }
    }
    class cInverter {
        var $Block;
        var $Torch;
        function __construct() {
            $this->Block = new cBlock();
            $this->Torch = new cTorch();
        }
    }
    class cWire {
        var $WireSegments;
        function __construct($n) {
            $this->WireSegments = array();
            for ($i=0;$i++;$i<$n) $this->WireSegments[] = new cDust();
        }
    }
    echo '<html>';
    echo '<head>';
    echo '<title>';
    echo 'Minecraft Redstone Simulator';
    echo '</title>';
    echo '<style>';
    echo 'table, th, td {';
    echo '    border: 1px dotted #C0C0C0;';
    echo '    border-collapse: collapse;';
    echo '    padding: 0 5 px;';
    echo '}';
    echo '</style>';
    echo '<script src ="minecraft.js"  type="text/javascript" ></script>';
    echo '</head>';
    // echo '<body>';
    echo '<body onload="initMCgenerator()">';
    // echo '<body onload="mcFullAdder()">';
    echo '<hr>';
    echo '<button type="button" onclick="mcFullAdder()">Full Adder</button>';
    echo '<button type="button" onclick="mcRedstoneTower()">Redstone Tower</button>';
    echo '<button type="button" onclick="mcHouse()">House</button>';
    echo '<hr>';
    echo '<canvas id="Laag-1" width="300" height="300">Canvas wordt niet ondersteund door deze browser</canvas> ';
    echo '<canvas id="Laag-2" width="300" height="300">Canvas wordt niet ondersteund door deze browser</canvas> ';
    echo '<canvas id="Laag-3" width="300" height="300">Canvas wordt niet ondersteund door deze browser</canvas> ';
    echo '<canvas id="Laag-4" width="300" height="300">Canvas wordt niet ondersteund door deze browser</canvas> ';
    echo '<canvas id="Alles"  width="300" height="300">Canvas wordt niet ondersteund door deze browser</canvas> ';
    echo '<p id="mcCommand"></p>';
    echo '<p id="mcCommandLines"></p>';
    echo '</body>';
    echo '</html>';
?>
