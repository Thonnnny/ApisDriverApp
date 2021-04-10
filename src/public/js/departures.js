let setTemporaryTripAgents = (agentsAddedToTrip) => {
    localStorage.setItem('agentsAddedToTripAgents', JSON.stringify(agentsAddedToTrip))
};
let getTemporaryTripAgents = () => {
    return JSON.parse(localStorage.getItem('agentsAddedToTripAgents'))
}
let deleteTemporaryTripAgents = () => {
    localStorage.removeItem('agentsAddedToTripAgents')
}

let setTemporaryTripData = (tripDepartureData) => {
    localStorage.setItem('tripDepartureData', JSON.stringify(tripDepartureData))
};
let getTemporaryTripData = () => {
    return JSON.parse(localStorage.getItem('tripDepartureData'))
}
let deleteTemporaryTripData = () => {
    localStorage.removeItem('tripDepartureData')
}

let foundedAgent = {};
let actualTripData = {};
let agentToTripList = [];

let html5QrcodeScanner; //qr scanner empty declaration

function drawFoundedCardAlert(agent) {
    let contentString = `<div class="form-row">`;
    if (Object.keys(agent).length > 1) {
        if (!!!agent.hourOut) {
            agent.hourOut = `<span class="text-danger">Dia libre</span>`;
        }
        contentString += `
                <div style="width: 100%;" class="text-small">
                    <h5><b>¿Agregar agente al viaje?</b></h5><br>
                    <div class="row" text-center>
                        <div class="col-sm-12 text-left">
                            <p><i class="fa fa-hashtag"></i> <b>No empleado:</b> ${agent.agentEmployeeId}</p>
                            <p><i class="fa fa-user"></i> <b>Nombre: </b> ${agent.agentFullname}</p>
                            <p><i class="fa fa-clock"></i> <b>Hora Salida:</b> ${agent.hourOut}</p>
                            <p><i class="fa fa-map-marker-alt"></i> <b>Dirección:</b> ${agent.agentReferencePoint}, ${agent.neighborhoodName}, ${agent.districtName}, ${agent.townName}, ${agent.departmentName}</p>
                        </div>
                        <div class="col-sm-12 text-center">
                            <button class="btn btn-sm btn-warning m-2" onclick="Swal.close()">Descartar</button>
                            <button class="btn btn-sm btn-success m-2" onclick="addAgentToTrip()" id="confirmAgentButton">Agregar</button>
                        </div>
                    </div>
                </div>
            </div>
            `;
        foundedAgent = agent;
    } else {
        contentString += `
        <div style="width: 100%;" class="text-center">
            <div class="row text-center">
                <div class="col-sm-12 text-center">
                    <h2 class="text-danger"><i class="fa fa-exclamation-triangle"></i></h2>
                        <p>${agent.msg}</p>
                </div>
                <div class="col-sm-12 text-center">
                    <button class="btn btn-sm btn-primary" onclick="Swal.close()">Entendido</button>
                </div>
            </div>
        </div>
        `;
        foundedAgent = {};
    }
    contentString += `</div>`;

    Swal.fire({
        html: contentString,
        showConfirmButton: false,
        allowOutsideClick: false
    })
}

function drawAgentsListCards() {
    let contentString = "";
    if (agentToTripList.length > 0) {
        agentToTripList.forEach(agent => {
            contentString += `
                    <div style="width: 100%;">
                        <div class="card shadow-lg mb-2 p-0">
                            <div class="card-body text-small">
                                <div class="row">
                                    <div class="col-sm-12">
                                        <p><i class="fa fa-hashtag"></i> <b>No empleado:</b> ${agent.agentEmployeeId}</p>
                                        <p><i class="fa fa-user"></i> <b>Nombre: </b> ${agent.agentFullname}</p>
                                        <p><i class="fa fa-clock"></i> <b>Hora Salida:</b> ${agent.hourOut}</p>
                                        <p><i class="fa fa-map-marker-alt"></i> <b>Dirección:</b> ${agent.agentReferencePoint}, ${agent.neighborhoodName}, ${agent.districtName}, ${agent.townName}, ${agent.departmentName}</p>
                                    </div>
                                </div>
                            </div>
                        <div class="card-footer text-right text-small">
                            <button class="btn btn-sm btn-danger" onclick="removeAgentToTrip(${agent.agentId})">Quitar</button>
                        </div>
                    </div>
                </div>
                `;
        });
    } else {
        contentString += `
        <div style="width: 100%;">
            <div class="card shadow-lg mb-2 p-0">
                <div class="card-body text-small text-center">
                    <div class="row">
                        <div class="col-sm-12">
                            <p> No hay agentes </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    document.querySelector('#agentsAddedsToTripDiv').innerHTML = contentString;
    contentString = "";
}

function addAgentToTrip() {
    agentToTripList.push(foundedAgent);
    setTemporaryTripAgents(agentToTripList);
    foundedAgent = {};
    drawAgentsListCards();
    Swal.close();
}

function removeAgentToTrip(agentId) {
    for (let i = 0; i < agentToTripList.length; i++) {
        if (agentToTripList[i].agentId === agentId) {
            agentToTripList.splice(i, 1);
        }
    }
    setTemporaryTripAgents(agentToTripList);
    drawAgentsListCards();
}

function selectNewCompany() {
    foundedAgent = {};
    agentToTripList = [];
    setTemporaryTripAgents(agentToTripList);
    drawAgentsListCards();
    saveActualDepartureData();
}

let isInTrip = (agentEmployeeId) => {
    for (let i = 0; i < agentToTripList.length; i++) {
        if (agentToTripList[i].agentEmployeeId.toUpperCase() === agentEmployeeId.toUpperCase()) {
            return true
        };
    }
    return false;
}

function searchAgent(agentEmployeeId) {
    Swal.fire({
        title: 'Buscando...',
        text: 'Por favor espere',
        showConfirmButton: false,
        allowOutsideClick: false
    });
    if (!isInTrip(agentEmployeeId)) {
        let companyId = document.querySelector('#companyInput').value;
        if (!!agentEmployeeId && !!companyId) {
            fetch('/searchAgent', {
                    method: "POST",
                    body: JSON.stringify({
                        companyId: companyId,
                        agentEmployeeId: agentEmployeeId
                    }),
                    headers: {
                        "Content-type": "application/json; charset=UTF-8"
                    }
                })
                .then(res => res.json())
                .then(resp => {
                    if (resp.ok) {
                        Swal.close();
                        drawFoundedCardAlert(resp.agent);
                        document.querySelector('#reader').innerHTML = '';
                    } else {
                        Swal.fire({
                            title: resp.title,
                            text: resp.message,
                            icon: resp.type
                        })
                    }
                })
        } else {
            Swal.fire(
                '¡Advertencia!',
                'Se requiere del número de empleado para poder realizar la busqueda',
                'warning'
            )
        }
    } else {
        document.querySelector('#reader').innerHTML = '';
        Swal.fire(
            '¡Advertencia!',
            `El agente con número de empleado ${agentEmployeeId} ya está agregado al viaje`,
            'warning'
        )
    }
}

function clearInputEmployeeNumber() {
    document.querySelector('#employeeNumberInput').value = "";
    document.querySelector('#reader').innerHTML = '';
    if (!!html5QrcodeScanner) {
        if (html5QrcodeScanner._isScanning) {
            html5QrcodeScanner.stop();
        }
    }
}

function searchAgentByEmployeeNumber() {
    let agentEmployeeId = document.querySelector('#employeeNumberInput').value;
    searchAgent(agentEmployeeId);
}

function searchAgentByQr(qrCapture) {
    searchAgent(qrCapture);
}


function registerTrip() {
    let companyId = document.querySelector('#companyInput').value;
    let tripHour = document.querySelector('#newDepartureTimeInput').value;
    let tripVehicle = !!(document.querySelector('#newDepartureVehicleInput').value) ? document.querySelector('#newDepartureVehicleInput').value : '';

    if (agentToTripList.length === 0) {
        Swal.fire('¡Viaje vacío!', 'No puede guardar este viaje sin agregar agentes', 'warning');
    } else {
        if (!!tripHour) {
            fetch('/registerDeparture', {
                    method: "POST",
                    body: JSON.stringify({
                        companyId: companyId,
                        tripHour: tripHour,
                        driverId: obtainSession().driverId,
                        tripVehicle: tripVehicle,
                        agentToTripList: agentToTripList
                    }),
                    headers: {
                        "Content-type": "application/json; charset=UTF-8"
                    }
                })
                .then(res => res.json())
                .then(resp => {
                    if (resp.ok) {
                        deleteTemporaryTripAgents();
                        Swal.fire({
                                title: resp.title,
                                icon: resp.type,
                                text: resp.message
                            })
                            .then(() => {
                                goToAgentsToTravelInProgress(resp.tripId)
                            })
                    } else {
                        Swal.fire(
                            resp.title,
                            resp.message,
                            resp.type
                        )
                    }
                })
                .catch(err => {
                    Swal.fire(
                        'Error',
                        'Ha ocurrido un error',
                        'error'
                    )
                })
        } else {
            Swal.fire(
                'Error',
                'No ha asignado una hora a este viaje',
                'error'
            )
        }
    }
}


// QR SCANNER CODE

function onScanSuccess(qrMessage) {
    searchAgentByQr(qrMessage);
    html5QrcodeScanner.stop();
    html5QrcodeScanner.clear();
}

function showQr() {
    html5QrcodeScanner = new Html5Qrcode('reader');
    html5QrcodeScanner.start({
        facingMode: "environment"
    }, {
        fps: 10,
        qrbox: 250
    }, onScanSuccess);
}

function clearTrip() {
    deleteTemporaryTripAgents();
    deleteTemporaryTripData();
    agentToTripList = [];
    drawAgentsListCards();
}

function saveActualDepartureData() {
    actualTripData = {
        companyId: document.querySelector('#companyInput').value,
        departureTime: document.querySelector('#newDepartureTimeInput').value,
        tripVehicle: document.querySelector('#newDepartureVehicleInput').value
    };
    setTemporaryTripData(actualTripData);
}

function setActualTripData() {
    if (!!getTemporaryTripData()) {
        actualTripData = {
            companyId: getTemporaryTripData().companyId,
            departureTime: getTemporaryTripData().departureTime,
            tripVehicle: getTemporaryTripData().tripVehicle
        }
        document.querySelector('#companyInput').value = actualTripData.companyId;
        document.querySelector('#newDepartureTimeInput').value = actualTripData.departureTime;
        document.querySelector('#newDepartureVehicleInput').value = actualTripData.tripVehicle;
    } else {
        document.querySelector('#companyInput').value = 1;
        document.querySelector('#newDepartureTimeInput').value = '00:00';
        document.querySelector('#newDepartureVehicleInput').value = '';
    }
}

window.onload = () => {
    if (!!getTemporaryTripAgents()) {
        agentToTripList = getTemporaryTripAgents();
        drawAgentsListCards();
        setActualTripData();
    }
}