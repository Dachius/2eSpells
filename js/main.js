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
        data:jsonData, // Assign data to table
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

// Draw info box
function drawInfoBox(e, row){
    var data = row.getData();
    document.getElementById("Name").innerHTML = data.name;

    // Level, School, Sphere
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

    // Various
    document.getElementById("CastingTime").innerHTML = "<strong>Casting Time:</strong> " + data.castingTime;
    document.getElementById("Range").innerHTML = "<strong>Range:</strong> " + data.range;
    document.getElementById("AOE").innerHTML = "<strong>Area:</strong> " + data.aoe;
    document.getElementById("Save").innerHTML = "<strong>Save:</strong> " + data.save;

    // Components
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

    // Duration
    duration = document.getElementById("Duration");
    duration.style.borderBottom = "2px solid #d29a38"
    duration.innerHTML = "<strong>Duration:</strong> " + data.duration;

    document.getElementById("Description").innerText = data.description;
}

// Javascript % doesn't work as desired with negative numbers.
function mod(n, m){
    return ((n % m) + m) % m;
}

// Gray/Blue/Red colors
var buttonColorArray = ["rgb(24, 26, 27)", "rgb(51, 122, 183)", "rgb(138, 26, 27)"];

// Sphere Gray/Light-Blue/Blue colors
var sphereColorArray = ["rgb(24, 26, 27)", "rgb(51, 122, 183)", "rgb(147, 168, 184)"];

// Name Filter
var nameFilter = document.getElementById("nameFilter");
nameFilter.addEventListener("keyup", updateFilter);

// Class button listeners
var classButtons = document.getElementsByClassName("classButton");
for(var i = 0; i < classButtons.length; i++){
    classButtons[i].addEventListener("click", function(){
        leftClickBinary(this);
    });

    classButtons[i].addEventListener("contextmenu", function(e){
        rightClickBinary(e, this);
    });
}

// Specialist button listeners
// These buttons activate several other buttons and have semi-complicated logic.
// They generally don't act as their own filter, simply activating other filters.
var specialistButtons = document.getElementsByClassName("specialistButton");
for(var i = 0; i < specialistButtons.length; i++){
    specialistButtons[i].addEventListener("click", function(){
        this.value++;
        this.value = mod(this.value, 2);
        this.style.backgroundColor = buttonColorArray[this.value];

        specialistUpdate(this);
    });

    specialistButtons[i].addEventListener("contextmenu", function(e){
        e.preventDefault();
        this.value--;
        this.value = mod(this.value, 2);
        this.style.backgroundColor = buttonColorArray[this.value];

        specialistUpdate(this);
    });
}

// 0 = don't care, 1 = include, 2 = exclude
// Abjuration/Alteration/Conjuration/Divination/Enchantment/Evocation/Illusion/Necromancy
var specialistFilterArray = [
    [0, 2, 0, 0, 0, 0, 2, 0], // Abjurer
    [0, 0, 0, 2, 0, 2, 0, 0], // Conjurer
    [0, 0, 2, 0, 0, 0, 0, 0], // Diviner
    [0, 0, 0, 0, 0, 2, 0, 2], // Enchanter
    [2, 0, 0, 0, 0, 2, 0, 2], // Illusionist
    [0, 0, 2, 0, 2, 0, 0, 0], // Invoker
    [0, 0, 0, 0, 2, 0, 2, 0], // Necromancer
    [2, 0, 0, 0, 0, 0, 0, 2]  // Transmuter
];

function specialistUpdate(element){

    var index = element.getAttribute("data-index");

    // Unset specialist buttons
    for(var i = 0; i < specialistButtons.length; i++){
        if(i != index){
            specialistButtons[i].value = 0;
            specialistButtons[i].style.backgroundColor = buttonColorArray[0];
        }
    }

    // Unset sphere buttons
    for(var i = 0; i < sphereButtons.length; i++){
        sphereButtons[i].value = 0;
        sphereButtons[i].style.backgroundColor = buttonColorArray[0];
    }

    // Unset god buttons
    for(var i = 0; i < godButtons.length; i++){
        godButtons[i].value = 0;
        godButtons[i].style.backgroundColor = buttonColorArray[0];
    }
    
    if(element.value == 0){
        // Unset class
        classButtons[0].value = 0;
        classButtons[0].style.backgroundColor = buttonColorArray[0];
        classButtons[1].value = 0;
        classButtons[1].style.backgroundColor = buttonColorArray[0];

        for(var i = 0; i < schoolButtons.length; i++){
            schoolButtons[i].value = 0;
            schoolButtons[i].style.backgroundColor = buttonColorArray[0];
        }
    }
    else if(element.value == 1){
        // Set class to wizard
        classButtons[0].value = 0;
        classButtons[0].style.backgroundColor = buttonColorArray[0];
        classButtons[1].value = 1;
        classButtons[1].style.backgroundColor = buttonColorArray[1];

        for(var i = 0; i < schoolButtons.length; i++){
            schoolButtons[i].value = specialistFilterArray[index][i];
            schoolButtons[i].style.backgroundColor = buttonColorArray[schoolButtons[i].value];
        }
    }
    
    updateFilter();
}

// Lvl button listeners
var lvlButtons = document.getElementsByClassName("lvlButton");
for(var i = 0; i < lvlButtons.length; i++){
    lvlButtons[i].addEventListener("click", function(){
        leftClickBinary(this);
    });

    lvlButtons[i].addEventListener("contextmenu", function(e){
        rightClickBinary(e, this);
    });
}

// School button listeners
var schoolButtons = document.getElementsByClassName("schoolButton");
for(var i = 0; i < schoolButtons.length; i++){
    schoolButtons[i].addEventListener("click", function(){
        leftClickTrinary(this);
    });

    schoolButtons[i].addEventListener("contextmenu", function(e){
        rightClickTrinary(e, this);
    });
}

// Sphere button listeners
var sphereButtons = document.getElementsByClassName("sphereButton");
for(var i = 0; i < sphereButtons.length; i++){
    sphereButtons[i].addEventListener("click", function(){
        leftClickGradient(this);
    });

    sphereButtons[i].addEventListener("contextmenu", function(e){
        rightClickGradient(e, this);
    });
}

// God button listeners
// These buttons activate several other buttons and have semi-complicated logic.
var godButtons = document.getElementsByClassName("godButton");
for(var i = 0; i < godButtons.length; i++){
    godButtons[i].addEventListener("click", function(){
        this.value++;
        this.value = mod(this.value, 2);
        this.style.backgroundColor = buttonColorArray[this.value];
        
        godUpdate(this);
    });

    godButtons[i].addEventListener("contextmenu", function(e){
        e.preventDefault();
        this.value--;
        this.value = mod(this.value, 2);
        this.style.backgroundColor = buttonColorArray[this.value];
        
        godUpdate(this);
    });
}

// 0 = don't care, 1 = major, 2 = minor
// All/Animal/Astral/Chaos/Charm/Combat/Creation/Divination/Air/Earth/Fire/Water/Guardian/Healing/Law/Necromantic/Numbers/Plant/Protection/Summoning/Sun/Thought/Time/Travelers/War/Wards/Weather
var specialistFilterArray = [
    [1, 0, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0, 2, 1, 1, 2, 1, 0, 2, 2, 0, 1, 0, 0, 2, 2, 0], // Astair
    [1, 1, 0, 0, 0, 2, 1, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 0, 1, 0, 0, 2], // Martha
    [1, 0, 1, 2, 1, 1, 0, 2, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0], // Voraci
    [1, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 2, 0, 1, 0, 1, 0, 0, 1, 0, 0], // Malkis -
    [1, 0, 1, 0, 0, 0, 0, 2, 1, 1, 1, 1, 0, 2, 0, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1], // Tempos
    [1, 1, 1, 0, 0, 2, 2, 0, 1, 1, 1, 1, 0, 1, 0, 0, 0, 1, 0, 2, 1, 0, 1, 0, 0, 0, 1], // Nadinis
    [1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1], // Felumbra -
    [1, 1, 1, 0, 0, 0, 2, 0, 1, 1, 1, 1, 0, 1, 0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 0, 1], // Illumis
    [1, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1], // Relkor -
    [1, 1, 0, 0, 0, 1, 0, 2, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 1, 0, 1, 1, 0, 0, 1], // Agepa
    [1, 0, 1, 1, 0, 0, 0, 1, 2, 2, 2, 2, 1, 1, 1, 0, 0, 2, 1, 0, 0, 1, 0, 0, 0, 0, 1], // Aaris
    [1, 0, 0, 2, 2, 1, 0, 1, 0, 0, 0, 0, 2, 1, 2, 1, 2, 0, 1, 0, 0, 0, 0, 1, 1, 0, 1], // Bellum
    [1, 2, 0, 0, 1, 0, 0, 2, 1, 1, 1, 1, 0, 1, 0, 1, 0, 2, 1, 0, 0, 1, 1, 0, 0, 2, 0], // Chis
    [1, 2, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 2, 0, 0, 1, 0, 0, 0, 0, 1, 1, 2, 0, 2, 0], // Dorbaff/Guam
    [1, 1, 1, 0, 1, 0, 1, 2, 2, 2, 2, 2, 0, 0, 2, 1, 1, 1, 0, 0, 2, 1, 0, 0, 0, 0, 0], // Efra
    [1, 2, 0, 1, 1, 0, 0, 2, 2, 2, 2, 2, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 0, 0], // Jexel
    [1, 0, 1, 0, 2, 2, 1, 1, 0, 0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 2, 1, 0], // Matrigal
    [1, 2, 0, 2, 1, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 1, 0, 2, 1, 0, 1, 0, 0, 1, 0, 1, 0], // Nerual
    [1, 0, 1, 0, 1, 1, 0, 2, 1, 1, 1, 1, 0, 0, 2, 1, 0, 0, 2, 1, 0, 1, 0, 0, 1, 0, 0], // Ponos
    [1, 0, 1, 0, 0, 2, 2, 1, 2, 2, 2, 2, 0, 0, 1, 0, 1, 0, 2, 0, 0, 1, 0, 1, 0, 1, 1], // Quantarious
    [1, 0, 1, 1, 1, 1, 0, 2, 0, 0, 0, 0, 2, 1, 1, 0, 0, 0, 2, 0, 0, 1, 0, 2, 2, 0, 1], // Reluna
    [1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0, 1, 0], // Sayor
    [1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1, 0, 1, 1, 0, 1, 0, 1], // Solt
    [1, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 2, 2, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 1, 0, 1], // Terrasa
    [1, 1, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 2, 0, 2, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 1], // Terrin
    [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1, 1, 2, 1, 0, 0, 0, 0, 0], // Velmontarious
    [1, 2, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0, 2, 2, 0, 1, 0, 2, 2, 1, 0, 2, 1, 0, 0, 0, 0], // Velthara
    [1, 1, 0, 0, 1, 0, 1, 0, 2, 2, 2, 2, 0, 1, 0, 2, 0, 2, 0, 0, 1, 2, 1, 1, 0, 1, 0], // Womaatoar
];

function godUpdate(element){
    var index = element.getAttribute("data-index");

    // Unset god buttons
    for(var i = 0; i < godButtons.length; i++){
        if(i != index){
            godButtons[i].value = 0;
            godButtons[i].style.backgroundColor = buttonColorArray[0];
        }
    }

    // Unset school buttons
    for(var i = 0; i < schoolButtons.length; i++){
        schoolButtons[i].value = 0;
        schoolButtons[i].style.backgroundColor = buttonColorArray[0];
    }

    // Unset specialist buttons
    for(var i = 0; i < specialistButtons.length; i++){
        specialistButtons[i].value = 0;
        specialistButtons[i].style.backgroundColor = buttonColorArray[0];
    }
    
    if(element.value == 0){
        // Unset class
        classButtons[0].value = 0;
        classButtons[0].style.backgroundColor = buttonColorArray[0];
        classButtons[1].value = 0;
        classButtons[1].style.backgroundColor = buttonColorArray[0];

        for(var i = 0; i < sphereButtons.length; i++){
            sphereButtons[i].value = 0;
            sphereButtons[i].style.backgroundColor = buttonColorArray[0];
        }
    }
    else if(element.value == 1){
        // Set class to cleric
        classButtons[0].value = 1;
        classButtons[0].style.backgroundColor = buttonColorArray[1];
        classButtons[1].value = 0;
        classButtons[1].style.backgroundColor = buttonColorArray[0];

        for(var i = 0; i < sphereButtons.length; i++){
            sphereButtons[i].value = specialistFilterArray[index][i];
            sphereButtons[i].style.backgroundColor = sphereColorArray[sphereButtons[i].value];
        }
    }
    
    updateFilter();
}

// gray, blue
function leftClickBinary(element){
    element.value++;
    element.value = mod(element.value, 2);
    element.style.backgroundColor = buttonColorArray[element.value];
    updateFilter();
}

function rightClickBinary(e, element){
    e.preventDefault();
    element.value--;
    element.value = mod(element.value, 2);
    element.style.backgroundColor = buttonColorArray[element.value];
    updateFilter();
}

// gray, blue, red
function leftClickTrinary(element){
    element.value++;
    element.value = mod(element.value, 3);
    element.style.backgroundColor = buttonColorArray[element.value];
    updateFilter();
}
function rightClickTrinary(e, element){
    e.preventDefault();
    element.value--;
    element.value = mod(element.value, 3);
    element.style.backgroundColor = buttonColorArray[element.value];
    updateFilter();
}

// gray, blue, light blue
function leftClickGradient(element){
    element.value++;
    element.value = mod(element.value, 3);
    element.style.backgroundColor = sphereColorArray[element.value];
    updateFilter();
}
function rightClickGradient(e, element){
    e.preventDefault();
    element.value--;
    element.value = mod(element.value, 3);
    element.style.backgroundColor = sphereColorArray[element.value];
    updateFilter();
}

// Vestigial?
function updateFilter(){
    table.setFilter(customFilter);
}

// Filter logic
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
            // Allow school of "minor divination" for conjurers.
            // Really? Conjurers get divination spells up to... level 4? 
            // That's like 75% of divination spells!
            if(specialistButtons[1].value == 1 && data.school == "Divination" && data.level <= 4){
                passes = true;
            }
            else if(data.school == schoolButtons[i].id){
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