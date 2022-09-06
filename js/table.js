var _table_ = document.createElement('table'),
_tr_ = document.createElement('tr'),
_th_ = document.createElement('th'),
_td_ = document.createElement('td');

wizardTable();

async function wizardTable(){
    const response = await fetch('json/wizard.json')
    var data = await response.json();
    realTable = buildHtmlTable(data);
    realTable.classList.add("sortable");
    document.body.appendChild(realTable);
    sorttable.makeSortable(realTable);
}


function buildHtmlTable(arr) {
    var table = _table_.cloneNode(false),
    columns = addAllColumnHeaders(arr, table);
    tb = document.createElement('tbody');

    for (var i = 0; i < arr.length; i++) {
        var tr = _tr_.cloneNode(false);
        for (var j = 0; j < columns.length; j++) {
            var td = _td_.cloneNode(false);
            var cellValue = arr[i][columns[j]];
            td.appendChild(document.createTextNode(arr[i][columns[j]] || ''));
            tr.appendChild(td);
        }
        tb.appendChild(tr);
    }
    table.appendChild(tb);
    _thead_ = document.createElement('thead');
    _thead_.appendChild(table.rows[0]);
    table.insertBefore(_thead_,table.firstChild);

    return table;
}


// remove key != stuff for full table
function addAllColumnHeaders(arr, table) {
    var columnSet = [],
    tr = _tr_.cloneNode(false);

    for (var i = 0, l = arr.length; i < l; i++) {
        for (var key in arr[i]) {
            if (arr[i].hasOwnProperty(key) && columnSet.indexOf(key) === -1 && (key != "verbal" && key != "somatic" && key != "material" && key != "damage" && key != "description" && key != "class")) {
                columnSet.push(key);
                var th = _th_.cloneNode(false);
                th.appendChild(document.createTextNode(key));
                tr.appendChild(th);
            }
        }
    }

    table.appendChild(tr);

    return columnSet;
}