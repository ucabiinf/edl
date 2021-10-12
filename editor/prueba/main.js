var appVersion = '[prueba]';
var fileName = 'derivacion-' + (Date.now() % 100000);
var LastRow = 2;
var LastRowCreated = 2;
var premisasIniciales = true;
var proposicionField = [];
var buttonField = [];
var justificacionField = [];
var conclusionField;
var abrirInput = document.getElementById('archivo');
var selectedBox;
var selectedRow = 1;
var canDelete = false;
var canSave = true;
var contenedor = document.querySelector('.pantalla .contenedor');

var undoButton = document.getElementById('undo');
var redoButton = document.getElementById('redo');
var memory = [];
var cursor = 0;
var activeElement;
var firstLoad = true;

var desarrollo = contenedor.getElementsByClassName('desarrollo');
desarrollo[0].setAttribute('data-version', appVersion);

var botonClaro = document.getElementById('claro');
var botonOscuro = document.getElementById('oscuro');

var botonera = document.querySelector('.buttons');

document.styleSheets[3].disabled = true;

var introScreen = document.querySelector('.overlay');

if (testingMode) {
    introScreen.style.display = 'none';
}

introScreen.querySelector('.version .number').textContent = appVersion;

document.addEventListener('click', () => {
    activeElement = document.activeElement;
});

var teclado = document.querySelector('.keyboard');

function abrirTeclado() {
    teclado.classList.toggle('active');
    botonera.classList.toggle('active');
}

var botonCerrarTeclado = teclado.querySelector('.close');
botonCerrarTeclado.addEventListener('click', () => {
    teclado.classList.toggle('active');
    botonera.classList.toggle('active');
});

var tabs = document.querySelector('.instrucciones .contenedor nav ul');

tabs.addEventListener('click', (e) => {
    tab = e.target;

    if (tab.classList.contains('tab') && !tab.classList.contains('active')) {
        tabs.querySelector('.tab.active').classList.remove('active');
        tab.classList.add('active');
        document.querySelector('.contenido.active').classList.remove('active');
        document.querySelector(tab.getAttribute('data-tab')).classList.add('active');
    }
});

var keyboard = document.querySelector('.keyboard');
var BackspacePressed = new KeyboardEvent('keydown', {
    bubbles: true,
    cancelBubble: false,
    cancelable: true,
    key: 'Backspace',
    code: 'Backspace',
    keyCode: 8,
    which: 8,
});

function borrar() {
    document.activeElement.dispatchEvent(BackspacePressed);
}

function getCurrentPremise() {
    return contenedor.querySelector('[data-fila*="' + selectedRow + '"]').parentElement;
}

function getPremise(row) {
    functionTitle('getPremise');
    testOut('Get row', row);

    let fila = contenedor.querySelector('[data-fila*="' + row + '"]');

    return fila ? fila.parentElement : null;
}

botonOscuro.addEventListener('click', (e) => {
    e.preventDefault();
    botonOscuro.style.display = 'none';
    botonClaro.style.display = 'block';
    document.styleSheets[3].disabled = false;
});

botonClaro.addEventListener('click', (e) => {
    e.preventDefault();
    botonOscuro.style.display = 'block';
    botonClaro.style.display = 'none';
    document.styleSheets[3].disabled = true;
});

function saveToMemory() {
    functionTitle('saveToMemory');

    if (canSave) {
        canSave = false;
        setTimeout(() => {
            if (!firstLoad) {
                undoButton.classList.remove('disabled');
                redoButton.classList.add('disabled');
            }
            firstLoad = false;

            if (cursor < parseInt(parseInt(memory.length - 1))) {
                memory = memory.slice(0, cursor + 1);
            }

            let clone = contenedor.cloneNode(true);
            let proposiciones = clone.querySelectorAll('.proposicion').forEach((item, i) => {
                var fila = item.getAttribute('data-fila');
                var latex = proposicionField[fila].latex();
                item.setAttribute('class', 'proposicion');
                item.innerHTML = latex;
            });

            let justificaciones = clone.querySelectorAll('.justificacion').forEach((item, i) => {
                var latex = justificacionField[i + 1].latex();
                item.setAttribute('class', 'justificacion');
                item.innerHTML = latex;
            });

            let latex = conclusionField.latex();
            let conclusion = clone.querySelector('.conclusion');
            conclusion.setAttribute('class', 'conclusion');
            conclusion.innerHTML = latex;

            memory.push({
                contenedor: clone.innerHTML,
                premisasIniciales: premisasIniciales,
                selectedRow: selectedRow,
            });

            cursor++;
            saveAnswer(clone.innerHTML);

            if (testingMode) {
                console.log(cursor + ' de ' + parseInt(parseInt(memory.length - 1)));
            }
            canSave = true;
        }, 250);
    }

    function saveAnswer(curr) {
        var saved = saveToIframe(curr);

        if (!saved && questionInput) {
            console.log('guardando en textarea...');
            questionInput.innerText = encodeURIComponent(curr);
        } else {
            console.error('No existe questionInput');
        }
    }
}

function undo() {
    functionTitle('undo');
    if (cursor > 0) {
        cursor--;
        contenedor.innerHTML = memory[cursor].contenedor;
        premisasIniciales = memory[cursor].premisasIniciales;
        selectedRow = memory[cursor].selectedRow;

        if (testingMode) {
            console.log(cursor + ' de ' + parseInt(parseInt(memory.length - 1)));
        }

        setFields(true);
        setJustificaciones();
        setConclusion();

        var deleteButtons = document.querySelectorAll('.deleteRow');
        if (deleteButtons) {
            deleteButtons.forEach((deleteSpan, i) => {
                deleteSpan.addEventListener('click', onClickDeleteSpan);
            });
        }
        redoButton.classList.remove('disabled');

        if (cursor == 0) {
            undoButton.classList.add('disabled');
        }
    }
}

function redo() {
    functionTitle('redo');
    if (cursor < parseInt(memory.length - 1)) {
        cursor++;
        contenedor.innerHTML = memory[cursor].contenedor;
        premisasIniciales = memory[cursor].premisasIniciales;
        selectedRow = memory[cursor].selectedRow;

        if (testingMode) {
            console.log(cursor + ' de ' + parseInt(parseInt(memory.length - 1)));
        }

        setFields(true);
        setJustificaciones();
        setConclusion();

        var deleteButtons = document.querySelectorAll('.deleteRow');

        if (deleteButtons) {
            deleteButtons.forEach((deleteSpan, i) => {
                deleteSpan.addEventListener('click', onClickDeleteSpan);
            });
        }
        undoButton.classList.remove('disabled');

        if (cursor == parseInt(memory.length - 1)) {
            redoButton.classList.add('disabled');
        }
    }
}

function setConclusion() {
    functionTitle('setConclusion');

    var conclusion = document.querySelector('.pantalla .conclusion');

    conclusionField = MQ.StaticMath(conclusion);

    conclusion.addEventListener('click', () => {
        selectedBox = conclusionField;
        selectedRow = LastRow;
    });
}

function setFields(setListeners = false) {
    functionTitle('setFields');
    proposicionField = [];

    var proposiciones = contenedor.querySelectorAll('.proposicion').forEach((item, i) => {
        var fila = item.getAttribute('data-fila');

        if (item.parentElement.parentElement.classList.contains('iniciales')) {
            proposicionField[fila] = MQ.StaticMath(item);
        } else {
            proposicionField[fila] = MQ.MathField(item, {
                spaceBehavesLikeTab: false,
            });
            selectedRow = parseInt(fila);

            if (setListeners) {
                item.addEventListener('click', onClickPropositionSpan);
            }
        }
        proposicionField[fila].reflow();
    });
    LastRow = proposicionField.length - 1;
    selectedBox = proposicionField[selectedRow];

    testOut('LastRowCreated', LastRowCreated);
    testOut('LastRow', LastRow);
    testOut('selectedRow', selectedRow);

    selectedBox.focus();
}

function moveRowsUp(row) {
    functionTitle('moveRowsUp');

    Propositions = contenedor.querySelectorAll('.proposicion');
    nextProposition = Propositions[row - 1];

    if (selectedRow == LastRow) {
        selectedRow--;
    }

    while (nextProposition) {
        row++;
        currentProposition = nextProposition;
        nextProposition = Propositions[row - 1];

        var fila = currentProposition.previousElementSibling;
        var filaLabel = fila.querySelector('.fila-label');

        currentProposition.setAttribute('data-fila', row - 1);

        if (filaLabel) {
            filaLabel.textContent = row - 1;
        } else {
            let spanDelete = fila.firstElementChild;
            fila.textContent = row - 1;

            if (spanDelete) {
                fila.appendChild(spanDelete);
            }
        }
    }

    setFields();
    setJustificaciones();
    saveToMemory();
}

function moveRowsDown(row) {
    functionTitle('moveRowsDown');

    Propositions = contenedor.querySelectorAll('.proposicion');
    nextProposition = Propositions[row + 1];

    while (nextProposition) {
        row++;
        currentProposition = nextProposition;
        nextProposition = Propositions[row + 1];

        var fila = currentProposition.previousElementSibling;
        var filaLabel = fila.querySelector('.fila-label');

        currentProposition.setAttribute('data-fila', row + 1);

        if (filaLabel) {
            filaLabel.textContent = row + 1;
        }
    }

    setFields();
    setJustificaciones();
    saveToMemory();
}

function deleteRow(row) {
    functionTitle('deleteRow');

    if (!row) {
        row = selectedRow;
    }
    selectedRow = row;

    let premise = getPremise(row);
    let parent = premise.parentElement;
    let premisas = parent ? parent.children : null;

    if (parent.classList.contains('hipotesis') && parent.classList.contains('iniciales')) {
        if (premisas.length == 1) {
            return;
        }
    } else if (parent.classList.contains('derivacion')) {
        if (premisas.length == 2) {
            return;
        } else if (!premise.nextElementSibling && premise.previousElementSibling.classList.contains('derivacion')) {
            return;
        }
    }

    if (parent.getAttribute('class') == 'hipotesis') {
        parent.parentElement.classList.add('slide-out-blurred-top');

        setTimeout(() => {
            parent.parentElement.remove();
            moveRowsUp(row);
        }, 240);
    } else {
        if (parent.classList.contains('iniciales') || parent.classList.contains('derivacion'))
            if (parent.children[parent.children.length - 1] == premise) {
                selectedRow--;
            }

        premise.classList.add('slide-out-blurred-top');

        setTimeout(() => {
            premise.remove();
            moveRowsUp(row);
        }, 240);
    }

    setTimeout(() => {
        if (parent.classList.contains('hipotesis') && parent.classList.contains('iniciales')) {
            testOut('premisas1', premisas);
            if (premisas.length == 1) {
                deleteSpan = premisas[0].querySelector('.deleteRow');
                if (deleteSpan) {
                    deleteSpan.remove();
                }
            }
        }

        premise = getCurrentPremise();
        parent = premise.parentElement;
        premisas = parent ? parent.children : null;

        if (parent.classList.contains('derivacion')) {
            testOut('premisas2', premisas);

            if (premisas.length == 2) {
                deleteSpan = premisas[1].querySelector('.deleteRow');
                if (deleteSpan) {
                    deleteSpan.remove();
                }
            } else if (!premise.nextElementSibling) {
                if (
                    !premise.previousElementSibling ||
                    premise.previousElementSibling.classList.contains('derivacion')
                ) {
                    deleteSpan = premise.querySelector('.deleteRow');
                    if (deleteSpan) {
                        deleteSpan.remove();
                    }
                }
            }
        }
    }, 241);
}

function setButtons() {
    functionTitle('setButtons');

    var buttons = document.querySelectorAll('.macro').forEach((item, i) => {
        var button = item.getAttribute('data-shortcut');
        buttonField[button] = MQ.StaticMath(item);
    });
}

function setJustificaciones(setListeners = false) {
    functionTitle('setJustificaciones');
    var justificacion = contenedor.querySelectorAll('.justificacion').forEach((item, i) => {
        if (item.parentElement.parentElement.classList.contains('iniciales')) {
            justificacionField[i + 1] = MQ.StaticMath(item);
        } else {
            justificacionField[i + 1] = MQ.MathField(item, {
                spaceBehavesLikeTab: false,
            });
            if (setListeners) {
                item.addEventListener('click', onClickJustificationSpan);
            }
        }
    });
}

function crearDeleteSpan() {
    functionTitle('setJustificaciones');

    var deleteSpan = document.createElement('span');

    deleteSpan.setAttribute('class', 'deleteRow');
    deleteSpan.textContent = 'x';
    deleteSpan.addEventListener('click', onClickDeleteSpan);

    return deleteSpan;
}

function onClickDeleteSpan(e) {
    functionTitle('onClickDeleteSpan');
    deleteSpan = e.target;
    testOut('deleteSpan', deleteSpan);
    filaLabel = deleteSpan.previousElementSibling;

    if (filaLabel && filaLabel.getAttribute('class') == 'fila-label') {
        row = filaLabel.textContent;
    } else {
        row = deleteSpan.parentElement.nextElementSibling.getAttribute('data-fila');
    }
    if (row) {
        deleteRow(parseInt(row));
    }
}

function isCursorFirst(proposicion) {
    cursorMark = proposicion.querySelector('.mq-root-block').firstChild;

    return cursorMark && cursorMark.classList && cursorMark.classList.contains('mq-cursor') ? true : false;
}

function setCanDelete(proposicion) {
    testOut('setCanDelete', proposicion);

    if (isCursorFirst(proposicion) && !proposicion.parentElement.parentElement.classList.contains('iniciales')) {
        canDelete = true;
    } else {
        canDelete = false;
    }
}

function onClickPropositionSpan(e) {
    functionTitle('onClickPropositionSpan');

    var proposicionSpan = e.srcElement.offsetParent;

    testOut('proposicionSpan.parentElement', proposicionSpan.parentElement);
    selectedRow = parseInt(proposicionSpan.getAttribute('data-fila'));
    selectedBox = proposicionField[selectedRow];

    if (selectedBox) {
        testOut('LastRowCreated', LastRowCreated);
        testOut('LastRow', LastRow);
        testOut('selectedRow', selectedRow);
        selectedBox.focus();

        setCanDelete(proposicionSpan);
    }
}

function onClickJustificationSpan(e) {
    functionTitle('onClickJustificationSpan');
    justificacionSpan = e.srcElement.offsetParent;
    proposicionSpan = justificacionSpan.previousElementSibling;

    if (proposicionSpan) {
        selectedRow = parseInt(proposicionSpan.getAttribute('data-fila'));
        selectedBox = justificacionField[selectedRow];

        testOut('LastRowCreated', LastRowCreated);
        testOut('LastRow', LastRow);
        testOut('selectedRow', selectedRow);

        selectedBox.focus();
    }
}

function crearPremisa(j = '') {
    functionTitle('crearPremisa');

    var filaLabel = document.createElement('span');
    filaLabel.setAttribute('class', 'fila-label');
    filaLabel.textContent = selectedRow + 1;

    var filaSpan = document.createElement('div');
    filaSpan.setAttribute('class', 'fila');
    filaSpan.appendChild(filaLabel);

    var proposicionSpan = document.createElement('span');
    proposicionSpan.setAttribute('class', 'proposicion');
    proposicionSpan.setAttribute('data-fila', selectedRow + 1);
    proposicionSpan.addEventListener('click', onClickPropositionSpan);

    var justificacionSpan = document.createElement('span');
    justificacionSpan.setAttribute('class', 'justificacion');
    justificacionSpan.textContent = j;
    justificacionSpan.addEventListener('click', onClickJustificationSpan);

    var premisa = document.createElement('div');
    premisa.setAttribute('class', 'premisa');
    premisa.appendChild(filaSpan);
    premisa.appendChild(proposicionSpan);
    premisa.appendChild(justificacionSpan);

    canDelete = true;
    saveToMemory();

    return premisa;
}

function añadirPremisa(before = false) {
    functionTitle('añadirPremisa');

    let arg = '';
    selectedPremise = getCurrentPremise();
    selectedParent = selectedPremise.parentElement;

    addDelete(selectedPremise);

    if (selectedParent.classList.contains('iniciales')) {
        arg = 'H';
    } else if (selectedParent.classList.contains('hipotesis') && !before) {
        selectedRow++;
        selectedBox = proposicionField[selectedRow];
        selectedBox.focus();

        return;
    }

    var premisa = crearPremisa(arg);

    if (before && selectedParent.getAttribute('class') == 'hipotesis') {
        //selectedRow--;
        selectedParent.parentElement.before(premisa);
        addDelete(premisa);

        LastRowCreated = selectedRow;
        selectedRow = selectedRow - 2;
        moveRowsDown(selectedRow);
    } else if (before) {
        selectedPremise.before(premisa);
        addDelete(premisa);

        LastRowCreated = selectedRow;
        selectedRow = selectedRow - 2;
        moveRowsDown(selectedRow);
    } else {
        selectedPremise.after(premisa);
        addDelete(premisa);

        testOut('selectedPremise', selectedPremise);
        LastRowCreated = selectedRow + 1;
        moveRowsDown(selectedRow);
    }

    selectedRow = LastRowCreated;
    setFields();
    setJustificaciones();
}

function añadirSubderivacion() {
    functionTitle('añadirSubderivacion');

    // Crear una subderivación
    var hipotesis = document.createElement('div');
    hipotesis.setAttribute('class', 'hipotesis');

    var derivacion = document.createElement('div');
    derivacion.setAttribute('class', 'derivacion cerrada');
    derivacion.appendChild(hipotesis);

    let currentPremise = getCurrentPremise();
    let currentProposition = currentPremise.querySelector('.proposicion');

    if (currentPremise.parentElement.classList.contains('hipotesis')) {
        currentPremise.parentElement.after(derivacion);
    } else {
        let currentField = MQ(currentProposition);
        if (
            currentField.latex() == '' &&
            (!currentPremise.previousElementSibling ||
                !currentPremise.previousElementSibling.classList.contains('derivacion'))
        ) {
            currentPremise.replaceWith(derivacion);
            selectedRow--;
            LastRowCreated--;
        } else {
            currentPremise.after(derivacion);
        }
    }

    testOut('derivacion.nextElementSibling', derivacion.nextElementSibling);

    if (!derivacion.nextElementSibling || derivacion.nextElementSibling.classList.contains('derivacion')) {
        let result = crearPremisa();
        derivacion.after(result);
        LastRowCreated++;

        if (result.nextElementSibling) {
            addDelete(result);
        }
    } else if (!derivacion.nextElementSibling.nextElementSibling) {
        let deleteSpan = derivacion.nextElementSibling.querySelector('.deleteRow');
        if (deleteSpan) {
            deleteSpan.remove();
        }
    }
    añadirHipotesis(hipotesis);
}

function añadirHipotesis(hipotesis) {
    functionTitle('añadirHipotesis');

    let h = crearPremisa('H');
    hipotesis.appendChild(h);
    addDelete(h);

    LastRowCreated++;

    hipotesis.after(crearPremisa());
    LastRowCreated++;

    moveRowsDown(selectedRow);
    selectedRow++;
    saveToMemory();
    setFields();
    setJustificaciones();
}

contenedor.onkeypress = (e) => {
    if (!e.ctrlKey && e.keyCode != 13) {
        saveToMemory();
    }
};

document.onkeydown = (e) => {
    var key = parseInt(e.key);

    testOut('event', e);

    if (e.keyCode == 13 && !e.shiftKey) {
        if (
            isCursorFirst(getCurrentPremise().querySelector('.proposicion')) &&
            selectedRow != 1 &&
            selectedBox.latex() != ''
        ) {
            añadirPremisa(true);
        } else {
            añadirPremisa();
        }
        canDelete = true;
    }

    if (e.keyCode == 8) {
        if (canDelete) {
            deleteRow(selectedRow);
            canDelete = false;
        }

        setTimeout(() => {
            setCanDelete(getCurrentPremise().querySelector('.proposicion'));
        }, 250);
    } else if (e.keyCode != 13) {
        canDelete = false;
    }

    if (e.keyCode == 8 || e.keyCode == 46) {
        saveToMemory();
    }

    if (e.keyCode == 38) {
        if (selectedRow != 1) {
            selectedRow--;
            selectedBox = proposicionField[selectedRow];

            if (selectedBox) {
                testOut('LastRowCreated', LastRowCreated);
                testOut('LastRow', LastRow);
                testOut('selectedRow', selectedRow);
                selectedBox.focus();
                setCanDelete(getCurrentPremise());
            }
        }
    }

    if (e.keyCode == 40) {
        if (selectedRow != LastRow) {
            selectedRow++;
            selectedBox = proposicionField[selectedRow];

            if (selectedBox) {
                testOut('LastRowCreated', LastRowCreated);
                testOut('LastRow', LastRow);
                testOut('selectedRow', selectedRow);
                selectedBox.focus();
                setCanDelete(getCurrentPremise());
            }
        }
    }

    if (e.ctrlKey) {
        if (e.keyCode == 90) {
            undo();
        }

        if (e.keyCode == 89) {
            redo();
        }

        if (e.keyCode == 86 || e.keyCode == 88) {
            saveToMemory();
        }

        if (e.keyCode == 65) {
            e.preventDefault();
            open();
        }

        if (e.keyCode == 83) {
            e.preventDefault();
            download();
        }
    }

    if (e.shiftKey) {
        if (e.keyCode == 13) {
            if (selectedRow != 1) {
                añadirPremisa(true);
            }
        }

        if (e.keyCode == 46) {
            if (selectedBox != conclusionField) {
                deleteRow(selectedRow);
            }
        }
    }

    if (e.altKey) {
        e.preventDefault();
        if (key >= 1 && key <= 9) {
            selectedBox.write(botones[key - 1].getAttribute('data-macro'));
            testOut('LastRowCreated', LastRowCreated);
            testOut('LastRow', LastRow);
            testOut('selectedRow', selectedRow);
            selectedBox.focus();
        }

        if (e.keyCode == 83) {
            añadirSubderivacion();
        }

        if (e.keyCode == 69) {
            saveToMemory();
            deleteLastRow();
        }
    }
};

var botones = document.querySelectorAll('.btn.simbolos');
botones.forEach((item, i) => {
    item.addEventListener('click', () => {
        saveToMemory();
        selectedBox.write(item.getAttribute('data-macro'));
        testOut('LastRowCreated', LastRowCreated);
        testOut('LastRow', LastRow);
        testOut('selectedRow', selectedRow);
        selectedBox.focus();
    });
});

var acciones = document.querySelectorAll('.btn.accion').forEach((item, i) => {
    item.addEventListener('mousedown', (e) => {
        e.preventDefault();
        if (!item.classList.contains('disabled')) {
            window[item.getAttribute('data-function')]();
        }
    });
});

function changeTitle(title, version) {
    functionTitle('changeTitle');
    document.title = title + ' - EDL ' + version;
}

function addDelete(premisas) {
    functionTitle('addDelete');
    let fila;

    if (premisas.classList && premisas.classList.contains('premisa')) {
        premisas = premisas.querySelector('.fila');

        let deleteSpan = premisas.querySelector('.deleteRow');

        if (!deleteSpan) {
            premisas.appendChild(crearDeleteSpan());
        } else {
            deleteSpan.addEventListener('click', onClickDeleteSpan);
        }
    } else if (premisas) {
        for (i = 0; i < premisas.length; ++i) {
            fila = premisas[i].querySelector('.fila');
            testOut('fila', fila);

            let deleteSpan = fila.querySelector('.deleteRow');

            if (!deleteSpan) {
                fila.appendChild(crearDeleteSpan());
            } else {
                deleteSpan.addEventListener('click', onClickDeleteSpan);
            }
        }
    } else {
        testOut('Error:', "La variable premisas no existe en la función 'addDelete'");
    }
}

function cerrarInstrucciones() {
    functionTitle('cerrarInstrucciones');
    document.querySelector('.instrucciones').classList.remove('slide-in-right');
    document.querySelector('.instrucciones').classList.add('slide-out-right');
    document.querySelector('#instructions').classList.remove('active');
    testOut('LastRowCreated', LastRowCreated);
    testOut('LastRow', LastRow);
    testOut('selectedRow', selectedRow);
    selectedBox.focus();
}

function abrirInstrucciones() {
    functionTitle('abrirInstrucciones');
    document.querySelector('.instrucciones').classList.add('slide-in-right');
    document.querySelector('.instrucciones').classList.remove('slide-out-right');
    document.querySelector('#instructions').classList.add('active');
    testOut('LastRowCreated', LastRowCreated);
    testOut('LastRow', LastRow);
    testOut('selectedRow', selectedRow);
    selectedBox.focus();
}

//--Teclado--//

//Funciones mover

var tabPressed = new KeyboardEvent('keydown', {
    bubbles: true,
    cancelBubble: false,
    cancelable: true,
    key: 'Tab',
    code: 'Tab',
    keyCode: 9,
    which: 9,
});

var shiftTabPressed = new KeyboardEvent('keydown', {
    bubbles: true,
    cancelBubble: false,
    cancelable: true,
    key: 'Tab',
    code: 'Tab',
    keyCode: 9,
    which: 9,
    shiftKey: true,
});
var desarrollo = contenedor.querySelector('.desarrollo');
var focusable = desarrollo.querySelectorAll('textarea');

function moverDer() {
    let selected = selectedBox.__controller.container[0];
    testOut('selected.classList', selected.classList);

    if (selected.classList.contains('justificacion') && selectedRow < LastRow) {
        selectedRow++;
        selectedBox = proposicionField[selectedRow];
    } else if (selected.classList.contains('proposicion')) {
        selectedBox = justificacionField[selectedRow];
    }

    selectedBox.focus();
    setCanDelete(getCurrentPremise().firstElementChild.nextElementSibling);
}

function moverIzq() {
    let selected = selectedBox.__controller.container[0];

    if (selected.classList.contains('justificacion')) {
        selectedBox = proposicionField[selectedRow];
    }

    if (selected.classList.contains('proposicion') && selectedRow > 1) {
        selectedRow--;
        selectedBox = justificacionField[selectedRow];
    }

    selectedBox.focus();
    setCanDelete(getCurrentPremise().firstElementChild.nextElementSibling);
}

function moverAb() {
    let selected = selectedBox.__controller.container[0];
    if (selectedRow < LastRow) {
        selectedRow++;

        if (selected.classList.contains('justificacion')) {
            selectedBox = justificacionField[selectedRow];
        } else if (selected.classList.contains('proposicion')) {
            selectedBox = proposicionField[selectedRow];
        }

        selectedBox.focus();
        setCanDelete(getCurrentPremise().firstElementChild.nextElementSibling);
    }
}

function moverAr() {
    let selected = selectedBox.__controller.container[0];
    let firstRow = parseInt(
        contenedor.querySelector('.hipotesis.iniciales').lastElementChild.querySelector('.fila-label').textContent,
    );

    if (selectedRow > firstRow) {
        selectedRow--;

        if (selected.classList.contains('justificacion')) {
            selectedBox = justificacionField[selectedRow];
        } else if (selected.classList.contains('proposicion')) {
            selectedBox = proposicionField[selectedRow];
        }

        selectedBox.focus();
        setCanDelete(getCurrentPremise().firstElementChild.nextElementSibling);
    }
}

function batchAddDelete(fromRow = 1, clean = false) {
    let row = fromRow;
    let premisa = getPremise(fromRow);
    let nextProposition = premisa;

    while (nextProposition) {
        row++;

        if (clean) {
            let deleteSpan = nextProposition.querySelector('.deleteRow');
            testOut('deleteSpan', deleteSpan);

            if (deleteSpan) {
                deleteSpan.remove();
            }
            testOut('nextProposition', nextProposition);
        }

        let currentProposition = nextProposition;
        let currentParent = currentProposition.parentElement;

        testOut('currentParent', currentParent);

        if (currentParent.classList.contains('hipotesis')) {
            if (!currentParent.classList.contains('iniciales')) {
                let hipotesis = currentParent.querySelectorAll('.premisa');
                addDelete(hipotesis);
            }
        } else if (
            currentProposition.nextElementSibling ||
            (currentProposition.previousElementSibling &&
                !currentProposition.previousElementSibling.classList.contains('derivacion'))
        ) {
            addDelete(currentProposition);
        }
        nextProposition = getPremise(row);
    }
}

//Manejo de archivos

/* function download() {
    functionTitle("download");
    let fileSaveName = fileName;
    let clone = contenedor.cloneNode(true);
    let proposiciones = clone.querySelectorAll('.proposicion').forEach( (item,i)=>{
        var fila = parseInt(item.getAttribute('data-fila'));
        var latex = proposicionField[fila].latex();
        item.setAttribute('class','proposicion');
        item.innerHTML = latex;
    });

    let justificaciones = clone.querySelectorAll('.justificacion').forEach( (item,i)=>{
        var latex = justificacionField[i+1].latex();
        item.setAttribute('class','justificacion');
        item.innerHTML = latex;
    });

    let latex = conclusionField.latex();
    let conclusion = clone.querySelector('.conclusion');
        conclusion.setAttribute('class','conclusion');
        conclusion.innerHTML = latex;

    var file = new Blob([clone.innerHTML], {type: 'text/plain'});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, fileSaveName + '.dv');
    else { // Others
        let url = URL.createObjectURL(file);
        let a = document.createElement("a");
            a.href = url;
            a.download = fileSaveName + '.dv';
            document.body.appendChild(a);
            a.click();
            setTimeout(function() {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 0);
    }
}

function open(){
    functionTitle("open");
    if (abrirInput) {
        abrirInput.click();
      }
} */

/* function handleFile(file){
    functionTitle("handleFile");
    var reader = new FileReader();
       reader.readAsText(file[0], "UTF-8");
       reader.onload = function (e) {
        contenedor.firstChild.remove();
        contenedor.innerHTML = e.target.result;
        premisasIniciales = (document.querySelectorAll('.hipotesis')[0].nextElementSibling) ? true : false;
        setFields(true);
        setJustificaciones(true);
        setConclusion();
        var desarrollo = contenedor.getElementsByClassName('desarrollo');
            if(testingMode) console.log(desarrollo[0]);
            var fileAppVersion = desarrollo[0].getAttribute('data-version');
            if(fileAppVersion != appVersion){
                alert('Este arcivo fue creado en una versión anterior de EDL esto podría generar conflictos en la ejecución de la aplicación. Si esto ocurre, use una versión anterior de EDL para abrir el archivo.');
                batchAddDelete(1, true);
            }else{
                batchAddDelete();
            }
            saveToMemory();
        changeTitle(file[0].name.split('.')[0], (fileAppVersion) ? fileAppVersion : '1.0.x');
    }
    reader.onerror = function (e) {
        alert("Error leyendo el archivo");
    }
} */
