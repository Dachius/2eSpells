// Make table
var table;
spellTable();

async function spellTable(){
    const wizard = await fetch('json/wizard.json')
    let wizardData = await wizard.json();
    const cleric = await fetch('json/cleric.json')
    let clericData = await cleric.json();

    // Determines default sort (i.e. initial sort and base for header sorts)
    let jsonData = wizardData.concat(clericData).sort(function(a, b){
        if(a.level != b.level){
            return a.level - b.level;
        }
        if(a.name != b.name){
            return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
        }
        if(a.school != b.school){
            return a.school.localeCompare(b.school)
        }
        if(a.class != b.class){
            return (a.class.localeCompare(b.class));
        }
    });

    table = new Tabulator("#list", {
        data:jsonData, //assign data to table
        height:"100%",
        layout:"fitData",
        columns:[
            {title:"Lvl", field:"level", sorter:"number"},
            {title:"Name", field:"name", sorter:"alphanum"},
            {title:"School", field:"school", sorter:"alphanum"},
            {title:"Class", field:"class", sorter:"alphanum"}
        ]
    });
    
    table.on("rowClick", function(e, row){drawInfoBox(e, row)});
}

//Draw info box
function drawInfoBox(e, row){
    var data = row.getData();
    document.getElementById("Name").innerHTML = data.name;

    var sphereString = "";
    var spheres = data.spheres;
    if(spheres != null){
        sphereString += " ["
        for(var i = 0; i < spheres.length - 1; i++){
            sphereString += (spheres[i] + ", ")
        }
        sphereString += (spheres[spheres.length - 1] + "]");
    }
    

    document.getElementById("Level&School&Sphere").innerHTML = "Level " + data.level + " " + data.school + sphereString;
    document.getElementById("CastingTime").innerHTML = "<strong>Casting Time:</strong> " + data.castingTime;
    document.getElementById("Range").innerHTML = "<strong>Range:</strong> " + data.range;
    document.getElementById("AOE").innerHTML = "<strong>Area:</strong> " + data.aoe;
    document.getElementById("Save").innerHTML = "<strong>Save:</strong> " + data.save;
    //Components
    var componentString = "<strong>Components:</strong> ";
    if(data.verbal){
        componentString += "V";
        if(data.somatic || data.material){
            componentString += ", ";
        }
    }
    if(data.somatic){
        componentString += "S";
        if(data.material){
            componentString += ", ";
        }
    }
    if(data.material){
        componentString += "M";
    }
    if(data.materials != ""){
        componentString += " (" + data.materials + ")"
    }
    document.getElementById("Components").innerHTML = componentString;
    //End Components
    //Duration
    duration = document.getElementById("Duration");
    duration.style.borderBottom = "2px solid #d29a38"
    duration.innerHTML = "<strong>Duration:</strong> " + data.duration;
    //End Duration
    document.getElementById("Description").innerText = data.description;
}

function mod(n, m){
    return ((n % m) + m) % m;
}

// Gray/Blue/Red colors
var buttonColorArray = ["rgb(24, 26, 27)", "rgb(51, 122, 183)", "rgb(138, 26, 27)"];

// Sphere Gray/Light-Blue/Blue colors
var sphereColorArray = ["rgb(24, 26, 27)", "rgb(51, 122, 183)", "rgb(92, 141, 184)"];

// Name Filter
var nameFilter = document.getElementById("nameFilter");
nameFilter.addEventListener("keyup", updateFilter);

// class button listeners
var classButtons = document.getElementsByClassName("classButton");
for(var i = 0; i < classButtons.length; i++){
    classButtons[i].addEventListener("click", function(){
        this.value++;
        this.value = mod(this.value, 2);
        this.style.backgroundColor = buttonColorArray[this.value];
        updateFilter();
    });

    classButtons[i].addEventListener("contextmenu", function(e){
        e.preventDefault();
        this.value--;
        this.value = mod(this.value, 2);
        this.style.backgroundColor = buttonColorArray[this.value];
        updateFilter();
    });
}

// specialist button listeners


// lvl button listeners
var lvlButtons = document.getElementsByClassName("lvlButton");
for(var i = 0; i < lvlButtons.length; i++){
    lvlButtons[i].addEventListener("click", function(){
        this.value++;
        this.value = mod(this.value, 2);
        this.style.backgroundColor = buttonColorArray[this.value];
        updateFilter();
    });

    lvlButtons[i].addEventListener("contextmenu", function(e){
        e.preventDefault();
        this.value--;
        this.value = mod(this.value, 2);
        this.style.backgroundColor = buttonColorArray[this.value];
        updateFilter();
    });
}

// school button listeners
var schoolButtons = document.getElementsByClassName("schoolButton");
for(var i = 0; i < schoolButtons.length; i++){
    schoolButtons[i].addEventListener("click", function(){
        this.value++;
        this.value = mod(this.value, 3);
        this.style.backgroundColor = buttonColorArray[this.value];
        updateFilter();
    });

    schoolButtons[i].addEventListener("contextmenu", function(e){
        e.preventDefault();
        this.value--;
        this.value = mod(this.value, 3);
        this.style.backgroundColor = buttonColorArray[this.value];
        updateFilter();
    });
}

// sphere button listeners
var sphereButtons = document.getElementsByClassName("sphereButton");
for(var i = 0; i < sphereButtons.length; i++){
    sphereButtons[i].addEventListener("click", function(){
        this.value++;
        this.value = mod(this.value, 3);
        this.style.backgroundColor = sphereColorArray[this.value];
        updateFilter();
    });

    sphereButtons[i].addEventListener("contextmenu", function(e){
        e.preventDefault();
        this.value--;
        this.value = mod(this.value, 3);
        this.style.backgroundColor = sphereColorArray[this.value];
        updateFilter();
    });
}

function updateFilter(){
    table.setFilter(customFilter);
}

function customFilter(data){
    // Filter by name
    if(!data.name.toLowerCase().includes(nameFilter.value.toLowerCase())){
        return false;
    }

    // Filter by class
    let passes = false;
    let blank = true;
    for(var i = 0; i < classButtons.length; i++){
        if(classButtons[i].value == 1){
            blank = false;
            if(data.class == classButtons[i].id){
                passes = true;
            }
        }
    }
    if(!passes && !blank){
        return false;
    }

    // Filter by level
    passes = false;
    blank = true;
    for(var i = 0; i < lvlButtons.length; i++){
        if(lvlButtons[i].value == 1){
            blank = false;
            if(data.level == (i + 1)){
                passes = true;
            }
        }
    }
    if(!passes && !blank){
        return false;
    }

    // Filter by school
    passes = false;
    blank = true;
    for(var i = 0; i < schoolButtons.length; i++){
        if(schoolButtons[i].value == 1){
            blank = false;
            if(data.school == schoolButtons[i].id){
                passes = true;
            }
        }
        else if(schoolButtons[i].value == 2){
            if(data.school == schoolButtons[i].id){
                return false;
            }
        }
    }
    if(!passes && !blank){
        return false;
    }

    //Filter by sphere
    passes = false;
    blank = true;
    for(var i = 0; i < sphereButtons.length; i++){
        if(sphereButtons[i].value == 1){
            blank = false;
            if(data.spheres != null){
                for(var j = 0; j < data.spheres.length; j++){
                    if(data.spheres[j] == sphereButtons[i].id){
                        passes = true;
                    }
                }
            }
        }
        else if(sphereButtons[i].value == 2){
            blank = false;
            if(data.spheres != null){
                for(var j = 0; j < data.spheres.length; j++){
                    if(data.spheres[j] == sphereButtons[i].id && data.level <= 3){
                        passes = true;
                    }
                }
            }
        }
    }
    if(!passes && !blank){
        return false;
    }

    // If subfilters pass, let through filter
    return true;
}