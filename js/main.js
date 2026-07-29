// Make table
let spells = [];

const spellTable = document.getElementById("spell-list");
const spellTableHeader = document.createElement("thead");

// Refresh table on filter
function renderTable() {
  // TODO: Delete all rows in the table

  // TODO: Add rows back to the table
  spells.forEach((spell) => {
    // Filter and organize the spell list and append passing rows in order
  });
}

loadSpells();
async function loadSpells() {
  let wizardData = await (await fetch("json/wizard.json")).json();
  let clericData = await (await fetch("json/cleric.json")).json();

  // Default spell ordering
  spells = wizardData.concat(clericData).sort(function (a, b) {
    if (a.level != b.level) {
      return a.level - b.level;
    } else if (a.name != b.name) {
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    } else if (a.school != b.school) {
      return a.school.localeCompare(b.school);
    } else if (a.class != b.class) {
      return a.class.localeCompare(b.class);
    }
  });

  // Make the rows and attach them to the spell objects
  const spellTableColumns = ["level", "name", "school", "class"];

  spells.forEach((spell) => {
    const spellRow = document.createElement("tr");
    spellTableColumns.forEach((key) => {
      const cell = document.createElement("td");
      cell.textContent = spell[key];
      spellRow.append(cell);
    });

    spell.row = spellRow;
  });

  // TODO: migrate this
  spellTable.addEventListener("click", function (e) {
    const row = e.target.closest("tr");
    drawInfoBox(e, row);
  });

  renderTable(); // Initial render
}

// Draw info box
function drawInfoBox(e, row) {
  let spacing = "&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp";
  let data = row.getData();

  document.getElementById("spell-info-name").innerHTML = data.name;
  document.getElementById("spell-info-source").innerHTML =
    "[" + data.source + "]";

  // Level, School, Sphere
  let sphereString = "";
  let spheres = data.spheres;
  if (spheres != null) {
    sphereString += " [";
    for (let i = 0; i < spheres.length - 1; i++) {
      sphereString += spheres[i] + ", ";
    }
    sphereString += spheres[spheres.length - 1] + "]";
  }

  document.getElementById("Level&School&Sphere").innerHTML =
    "Level " + data.level + " " + data.school + sphereString + spacing;

  // Casting time, Range, AOE, Save
  document.getElementById("CastingTime").innerHTML =
    "<strong>Casting Time:</strong> " + data.castingTime + spacing;
  document.getElementById("Range").innerHTML =
    "<strong>Range:</strong> " + data.range;
  document.getElementById("AOE").innerHTML =
    "<strong>Area:</strong> " + data.aoe + spacing;
  document.getElementById("Save").innerHTML =
    "<strong>Save:</strong> " + data.save;

  // Components
  let componentString = "<strong>Components:</strong> ";
  if (data.verbal) {
    componentString += "V";
    if (data.somatic || data.material) {
      componentString += ", ";
    }
  }
  if (data.somatic) {
    componentString += "S";
    if (data.material) {
      componentString += ", ";
    }
  }
  if (data.material) {
    componentString += "M";
  }
  if (data.materials != "") {
    componentString += " (" + data.materials + ")";
  }

  document.getElementById("Components").innerHTML = componentString + spacing;

  // Duration
  document.getElementById("Duration").innerHTML =
    "<strong>Duration:</strong> " + data.duration;

  // Description
  let description = document.getElementById("Description");
  description.style.borderTop = "2px solid #d29a38";
  description.innerText = data.description;

  // Errata/Rulings
  if (data.errata != null) {
    let errata = document.getElementById("Errata");
    errata.style.borderTop = "2px solid #d29a38";
    errata.innerHTML =
      "<strong>Errata: </strong> " + data.errata.replaceAll("\n", "<br>");
  } else {
    let errata = document.getElementById("Errata");
    errata.style.borderTop = null;
    errata.innerText = null;
  }
}

// Javascript % doesn't work as desired with negative numbers.
function mod(n, m) {
  return ((n % m) + m) % m;
}

// Generating HTML

// Add button to element.
function appendButton(base, type, text) {
  const button = document.createElement("button");
  button.append(document.createTextNode(text));
  button.id = text;
  button.classList.add(type);
  button.classList.add("styledButton");
  base.append(button);

  return button;
}

// Gray/Blue/Red colors
let buttonColors = ["rgb(24, 26, 27)", "rgb(51, 122, 183)", "rgb(138, 26, 27)"];

// Sphere Gray/Light-Blue/Blue colors
let sphereColors = [
  "rgb(24, 26, 27)",
  "rgb(51, 122, 183)",
  "rgb(147, 168, 184)",
];

// Name filter
document.getElementById("name-filter").addEventListener("keyup", updateFilter);

// Class button listeners
let classButtons = document.getElementsByClassName("classButton");
for (let i = 0; i < classButtons.length; i++) {
  classButtons[i].addEventListener("click", function () {
    leftClickBinary(this);
  });
  classButtons[i].addEventListener("contextmenu", function (e) {
    rightClickBinary(e, this);
  });
}

// Specialist buttons
let specialistButtons = [];
let specialistNames = [
  "Abjurer",
  "Conjurer",
  "Diviner",
  "Enchanter",
  "Illusionist",
  "Invoker",
  "Necromancer",
  "Transmuter",
];
let row = document.getElementById("specialists");
for (let i = 0; i < specialistNames.length; i++) {
  specialistButtons[i] = appendButton(
    row,
    "specialistButton",
    specialistNames[i],
  );

  specialistButtons[i].addEventListener("click", function () {
    this.value++;
    this.value = mod(this.value, 2);
    this.style.backgroundColor = buttonColors[this.value];

    specialistUpdate(this);
  });

  specialistButtons[i].addEventListener("contextmenu", function (e) {
    e.preventDefault();
    this.value--;
    this.value = mod(this.value, 2);
    this.style.backgroundColor = buttonColors[this.value];

    specialistUpdate(this);
  });
}

// 0 = don't care, 1 = include, 2 = exclude
// Abjuration/Alteration/Conjuration/Divination/Enchantment/Evocation/Illusion/Necromancy
let specialistFilterArray = [
  [0, 2, 0, 0, 0, 0, 2, 0], // Abjurer
  [0, 0, 0, 2, 0, 2, 0, 0], // Conjurer
  [0, 0, 2, 0, 0, 0, 0, 0], // Diviner
  [0, 0, 0, 0, 0, 2, 0, 2], // Enchanter
  [2, 0, 0, 0, 0, 2, 0, 2], // Illusionist
  [0, 0, 2, 0, 2, 0, 0, 0], // Invoker
  [0, 0, 0, 0, 2, 0, 2, 0], // Necromancer
  [2, 0, 0, 0, 0, 0, 0, 2], // Transmuter
];

function specialistUpdate(element) {
  let value = element.value;
  clearButtons();
  setButton(element, buttonColors, value);
  setButton(classButtons[1], buttonColors, value);

  let index = specialistNames.indexOf(element.id);
  if (value == 1) {
    for (let i = 0; i < schoolButtons.length; i++) {
      schoolButtons[i].value = specialistFilterArray[index][i];
      schoolButtons[i].style.backgroundColor =
        buttonColors[schoolButtons[i].value];
    }
  }

  updateFilter();
}

// Source buttons
let sourceButtons = [];
let sourceNames = ["PHB", "ToM", "S&M", "Koibu", "Divan"];
row = document.getElementById("sources");
for (let i = 0; i < sourceNames.length; i++) {
  sourceButtons[i] = appendButton(row, "sourceButton", sourceNames[i]);

  sourceButtons[i].addEventListener("click", function () {
    leftClickTrinary(this);
  });
  sourceButtons[i].addEventListener("contextmenu", function (e) {
    rightClickTrinary(e, this);
  });
}

// Level buttons
let lvlButtons = [];
row = document.getElementById("lvls");
for (let i = 1; i <= 9; i++) {
  lvlButtons[i - 1] = appendButton(row, "lvlButton", i);

  lvlButtons[i - 1].addEventListener("click", function () {
    leftClickBinary(this);
  });
  lvlButtons[i - 1].addEventListener("contextmenu", function (e) {
    rightClickBinary(e, this);
  });
}

// School buttons
let schoolButtons = [];
let schoolNames = [
  "Abjuration",
  "Alteration",
  "Conjuration",
  "Divination",
  "Enchantment",
  "Evocation",
  "Illusion",
  "Necromancy",
];
row = document.getElementById("schools");
for (let i = 0; i < schoolNames.length; i++) {
  schoolButtons[i] = appendButton(row, "schoolButton", schoolNames[i]);

  schoolButtons[i].addEventListener("click", function () {
    leftClickTrinary(this);
  });
  schoolButtons[i].addEventListener("contextmenu", function (e) {
    rightClickTrinary(e, this);
  });
}

// Sphere buttons
let sphereNames = [
  "All",
  "Animal",
  "Astral",
  "Chaos",
  "Charm",
  "Combat",
  "Creation",
  "Divination",
  "Air",
  "Earth",
  "Fire",
  "Water",
  "Guardian",
  "Healing",
  "Law",
  "Necromantic",
  "Numbers",
  "Plant",
  "Protection",
  "Summoning",
  "Sun",
  "Thought",
  "Time",
  "Travelers",
  "War",
  "Wards",
  "Weather",
];
row = document.getElementById("spheres");
for (let i = 0; i < sphereNames.length; i++) {
  appendButton(row, "sphereButton", sphereNames[i]);
}

// Sphere button listeners
let sphereButtons = document.getElementsByClassName("sphereButton");
for (let i = 0; i < sphereButtons.length; i++) {
  sphereButtons[i].addEventListener("click", function () {
    leftClickGradient(this);
  });
  sphereButtons[i].addEventListener("contextmenu", function (e) {
    rightClickGradient(e, this);
  });
}

// God buttons
let godNames = [
  "Astair",
  "Martha",
  "Voraci",
  "Malkis",
  "Tempos",
  "Nadinis",
  "Felumbra",
  "Illumis",
  "Relkor",
  "Agepa",
  "Aaris",
  "Bellum",
  "Chis",
  "Mathis/Safia",
  "Efra",
  "Jexel",
  "Matrigal",
  "Nerual",
  "Ponos",
  "Quantarious",
  "Reluna",
  "Sayor",
  "Solt",
  "Terrasa",
  "Terrin",
  "Velmontarious",
  "Velthara",
  "Womaatoar",
];

row = document.getElementById("koibu-gods");
for (let i = 0; i < 28; i++) {
  appendButton(row, "godButton", godNames[i]);
}

// God button listeners
let godButtons = document.getElementsByClassName("godButton");
for (let i = 0; i < godButtons.length; i++) {
  godButtons[i].addEventListener("click", function () {
    this.value++;
    this.value = mod(this.value, 2);
    this.style.backgroundColor = buttonColors[this.value];

    godUpdate(this);
  });

  godButtons[i].addEventListener("contextmenu", function (e) {
    e.preventDefault();
    this.value--;
    this.value = mod(this.value, 2);
    this.style.backgroundColor = buttonColors[this.value];

    godUpdate(this);
  });
}

// 0 = don't care, 1 = major, 2 = minor
// All/Animal/Astral/Chaos/Charm/Combat/Creation/Divination/Air/Earth/Fire/Water/Guardian/Healing/Law/Necromantic/Numbers/Plant/Protection/Summoning/Sun/Thought/Time/Travelers/War/Wards/Weather
let godFilterArray = [
  [
    1, 0, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0, 2, 1, 1, 2, 1, 0, 2, 2, 0, 1, 0, 0, 2,
    2, 0,
  ], // Astair
  [
    1, 1, 0, 0, 0, 2, 1, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 0, 1, 0,
    0, 2,
  ], // Martha
  [
    1, 0, 1, 2, 1, 1, 0, 2, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1,
    0, 0,
  ], // Voraci
  [
    1, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 2, 0, 1, 0, 1, 0, 0, 1,
    0, 0,
  ], // Malkis -
  [
    1, 0, 1, 0, 0, 0, 0, 2, 1, 1, 1, 1, 0, 2, 0, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0,
    0, 1,
  ], // Tempos
  [
    1, 1, 1, 0, 0, 2, 2, 0, 1, 1, 1, 1, 0, 1, 0, 0, 0, 1, 0, 2, 1, 0, 1, 0, 0,
    0, 1,
  ], // Nadinis
  [
    1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0,
    0, 1,
  ], // Felumbra -
  [
    1, 1, 1, 0, 0, 0, 2, 0, 1, 1, 1, 1, 0, 1, 0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0,
    0, 1,
  ], // Illumis
  [
    1, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1,
    0, 1,
  ], // Relkor -
  [
    1, 1, 0, 0, 0, 1, 0, 2, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 1, 0, 1, 1, 0,
    0, 1,
  ], // Agepa
  [
    1, 0, 1, 1, 0, 0, 0, 1, 2, 2, 2, 2, 1, 1, 1, 0, 0, 2, 1, 0, 0, 1, 0, 0, 0,
    0, 1,
  ], // Aaris
  [
    1, 0, 0, 2, 2, 1, 0, 1, 0, 0, 0, 0, 2, 1, 2, 1, 2, 0, 1, 0, 0, 0, 0, 1, 1,
    0, 1,
  ], // Bellum
  [
    1, 2, 0, 0, 1, 0, 0, 2, 1, 1, 1, 1, 0, 1, 0, 1, 0, 2, 1, 0, 0, 1, 1, 0, 0,
    2, 0,
  ], // Chis
  [
    1, 2, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 2, 0, 0, 1, 0, 0, 0, 0, 1, 1, 2, 0,
    2, 0,
  ], // Dorbaff/Guam
  [
    1, 1, 1, 0, 1, 0, 1, 2, 2, 2, 2, 2, 0, 0, 2, 1, 1, 1, 0, 0, 2, 1, 0, 0, 0,
    0, 0,
  ], // Efra
  [
    1, 2, 0, 1, 1, 0, 0, 2, 2, 2, 2, 2, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0,
    0, 0,
  ], // Jexel
  [
    1, 0, 1, 0, 2, 2, 1, 1, 0, 0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 2,
    1, 0,
  ], // Matrigal
  [
    1, 2, 0, 2, 1, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 1, 0, 2, 1, 0, 1, 0, 0, 1, 0,
    1, 0,
  ], // Nerual
  [
    1, 0, 1, 0, 1, 1, 0, 2, 1, 1, 1, 1, 0, 0, 2, 1, 0, 0, 2, 1, 0, 1, 0, 0, 1,
    0, 0,
  ], // Ponos
  [
    1, 0, 1, 0, 0, 2, 2, 1, 2, 2, 2, 2, 0, 0, 1, 0, 1, 0, 2, 0, 0, 1, 0, 1, 0,
    1, 1,
  ], // Quantarious
  [
    1, 0, 1, 1, 1, 1, 0, 2, 0, 0, 0, 0, 2, 1, 1, 0, 0, 0, 2, 0, 0, 1, 0, 2, 2,
    0, 1,
  ], // Reluna
  [
    1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0,
    1, 0,
  ], // Sayor
  [
    1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1, 0, 1, 1, 0, 1,
    0, 1,
  ], // Solt
  [
    1, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 2, 2, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 1,
    0, 1,
  ], // Terrasa
  [
    1, 1, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 2, 0, 2, 0, 1, 0, 0, 1, 0, 0, 0, 0,
    1, 1,
  ], // Terrin
  [
    1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1, 1, 2, 1, 0, 0, 0,
    0, 0,
  ], // Velmontarious
  [
    1, 2, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0, 2, 2, 0, 1, 0, 2, 2, 1, 0, 2, 1, 0, 0,
    0, 0,
  ], // Velthara
  [
    1, 1, 0, 0, 1, 0, 1, 0, 2, 2, 2, 2, 0, 1, 0, 2, 0, 2, 0, 0, 1, 2, 1, 1, 0,
    1, 0,
  ], // Womaatoar
];

function godUpdate(element) {
  let value = element.value;
  clearButtons();
  setButton(element, buttonColors, value);
  setButton(classButtons[0], buttonColors, value);

  let index = godNames.indexOf(element.id);
  if (value == 1) {
    for (let i = 0; i < sphereButtons.length; i++) {
      sphereButtons[i].value = godFilterArray[index][i];
      sphereButtons[i].style.backgroundColor =
        sphereColors[sphereButtons[i].value];
    }
  }

  updateFilter();
}

// Button updates

function setButton(button, colors, value) {
  button.value = value;
  button.style.backgroundColor = colors[value];
}

function setButtons(buttons, colors, value) {
  for (let i = 0; i < buttons.length; i++) {
    setButton(buttons[i], colors, value);
  }
}

function clearButtons() {
  setButtons(specialistButtons, buttonColors, 0);
  setButtons(sphereButtons, sphereColors, 0);
  setButtons(godButtons, buttonColors, 0);
  setButtons(classButtons, buttonColors, 0);
  setButtons(schoolButtons, buttonColors, 0);
}

// gray, blue
function leftClickBinary(element) {
  element.value++;
  element.value = mod(element.value, 2);
  element.style.backgroundColor = buttonColors[element.value];
  updateFilter();
}

function rightClickBinary(e, element) {
  e.preventDefault();
  element.value--;
  element.value = mod(element.value, 2);
  element.style.backgroundColor = buttonColors[element.value];
  updateFilter();
}

// gray, blue, red
function leftClickTrinary(element) {
  element.value++;
  element.value = mod(element.value, 3);
  element.style.backgroundColor = buttonColors[element.value];
  updateFilter();
}
function rightClickTrinary(e, element) {
  e.preventDefault();
  element.value--;
  element.value = mod(element.value, 3);
  element.style.backgroundColor = buttonColors[element.value];
  updateFilter();
}

// gray, blue, light blue
function leftClickGradient(element) {
  element.value++;
  element.value = mod(element.value, 3);
  element.style.backgroundColor = sphereColors[element.value];
  updateFilter();
}
function rightClickGradient(e, element) {
  e.preventDefault();
  element.value--;
  element.value = mod(element.value, 3);
  element.style.backgroundColor = sphereColors[element.value];
  updateFilter();
}

// ==== FILTER ====

function updateFilter() {
  table.setFilter(customFilter);
}

function customFilter(data) {
  // Filter by name
  if (
    !data.name
      .toLowerCase()
      .includes(document.getElementById("name-filter").value.toLowerCase())
  )
    return false;

  // Filter by class
  let passes = true;
  for (let i = 0; i < classButtons.length; i++)
    if (
      classButtons[i].value == 1 &&
      (passes = data.class == classButtons[i].id)
    )
      break;

  if (!passes) return false;

  // Filter by source
  for (let i = 0; i < sourceButtons.length; i++) {
    if (sourceButtons[i].value == 1) {
      if ((passes = data.source == sourceNames[i])) break;
    } else if (sourceButtons[i].value == 2) {
      if (data.source == sourceNames[i]) return false;
    }
  }

  if (!passes) return false;

  // Filter by level
  for (let i = 0; i < lvlButtons.length; i++)
    if (lvlButtons[i].value == 1 && (passes = data.level == i + 1)) break;

  if (!passes) return false;

  // Filter by school
  for (let i = 0; i < schoolButtons.length; i++) {
    if (schoolButtons[i].value == 1) {
      if ((passes = data.school == schoolNames[i])) break;
    } else if (schoolButtons[i].value == 2) {
      // Allow school of "minor divination" for conjurers.
      if (
        specialistButtons[1].value == 1 &&
        data.school == "Divination" &&
        data.level <= 4
      ) {
        passes = true;
        break;
      } else if (data.school == schoolNames[i]) {
        return false;
      }
    }
  }

  if (!passes) return false;

  // Filter by sphere
  passes = false;
  let blank = true;
  for (let i = 0; i < sphereButtons.length; i++) {
    if (sphereButtons[i].value == 1) {
      blank = false;
      if (data.spheres != null) {
        for (let j = 0; j < data.spheres.length; j++) {
          if (data.spheres[j] == sphereNames[i]) {
            passes = true;
          }
        }
      }
    } else if (sphereButtons[i].value == 2) {
      blank = false;
      if (data.spheres != null) {
        for (let j = 0; j < data.spheres.length; j++) {
          if (data.spheres[j] == sphereNames[i] && data.level <= 3) {
            passes = true;
          }
        }
      }
    }
  }

  if (!passes && !blank) return false;

  // If subfilters pass, let through filter
  return true;
}
