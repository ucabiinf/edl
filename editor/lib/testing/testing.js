var testingMode = false;

var changingColor = false;
var ActiveColor = 1;
var color = '';

function changeColor(){
    let color1 = "background: #222; color: #bada55";
    let color2 = "background: #32275a ; color: #6fd0c2"
    if(!changingColor){
        changingColor = true;

        if (ActiveColor == 1){
            ActiveColor = 2;
            color = color2;
        }else{
            ActiveColor = 1;
            color = color1;
        };

        setTimeout(() => {        
            changingColor = false;   
        }, 200);
    }  
}

function functionTitle(title = ""){
    changeColor();
    if(testingMode){
        console.log("%c function:" + title, color);
    }
};

function testOut(name = "", subject){
    if(testingMode){
        console.log(name + ":");
        console.log(subject);
    }
};
