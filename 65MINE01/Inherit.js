//  https://www.sitepoint.com/simple-inheritance-javascript/
//  https://developer.mozilla.org/nl/docs/Web/JavaScript/Reference/Global_Objects/Object/create
//  http://www.htmlgoodies.com/beyond/javascript/object.create-the-new-way-to-create-objects-in-javascript.html
{
    function ClassA() {
        this.name = "class A";
    }
    ClassA.prototype.print = function() {
        console.log(this.name);
    }
}
{
    function ClassAB() {
        this.name = "class A-B";
        this.surname = "I'm the child";
        this.prototype = Object.create(ClassA.prototype);
    }
    ClassAB.prototype.print = function() {
        ClassA.prototype.print.call(this);
        console.log(this.surname);
    }
}
{
    function Class20(pName) {
        this.name = 'Class2 - ' + pName;
    }
    Class20.prototype.print = function() {
        console.log(this.name);
    }
}
    // function Male(name) {
        // Human.call(this, true, "Something to say"); //notice the call and the arguments
        // this.name = name || "No name";
    // }

    // Male.prototype = Object.create(Human.prototype);
{
    function Class21(pName) {
        Class20.call(this, 'Class 2-1 - ' + pName);
        this.surname = "I'm the child";
        // var lValue = 'Class 2-1 - ' + pName;
        // this.prototype = Object.create(Class20.prototype, {'name':{writable:true,configurable:true,value:lValue}});
        // this.prototype = Object.create(Class20.prototype, {'name':{writable:true,configurable:true,value:'Class 2-1 - ' + pName}});
    }
    Class21.prototype = Object.create(Class20.prototype);
    Class21.prototype.print = function() {
        Class20.prototype.print.call(this);
        console.log(this.surname);
    }
}
function ShowInheritance()
{
    var a = new ClassA();
    var b = new ClassAB();
    var v20 = new Class20('var 2 ');
    var v21 = new Class21('var 21');
    a.print();
    b.print();
    v20.print();
    v21.print();
}
