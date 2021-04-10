function driverLogin() {
    Swal.fire(
        'Iniciando...'
    );

    let driverDNI = document.querySelector('#inputDriverDNI').value;
    let driverPassword = document.querySelector('#inputDriverPassword').value;

    if (!!driverDNI && !!driverPassword) {
        fetch('/login', {
                method: "POST",
                body: JSON.stringify({
                    driverDNI: driverDNI,
                    driverPassword: driverPassword
                }),
                headers: {
                    "Content-type": "application/json; charset=UTF-8"
                }
            })
            .then(res => res.json())
            .then(res => {
                if (res.ok) {
                    saveSession(res.driver);
                    Swal.fire(
                        'Bienvenido!',
                        `${obtainSession().driverFullname}`,
                        'success'
                    )
                    .then(()=> {
                        location.href = "/home";
                    })
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Oops...',
                        text: res.message
                    })
                }
            })
    } else {
        Swal.fire(
            'Advertencia!',
            'Debe llenar todos los campos antes de continuar',
            'question'
        )
    }
}

function goToPendings() {
    location.href = "/travelPendings/" + obtainSession().driverId;
}

function goToHome() {
    location.href = "/home";
}

function goToAgentsToTravel(tripId) {
    location.href = "/agentsInTravel/" + tripId;
}

function goToDepartures() {
    location.href = "/newdeparture/"+ obtainSession().departmentId;
}

function goToTravelInProgress() {
    location.href = "/tripInProgress/" + obtainSession().driverId;
}

function goToAgentsToTravelInProgress(tripId) {
    location.href = "/agentsTripInProgress/" + tripId;
}

function goToTravelsCompleteds(){
    location.href = "/tripsCompleted/" + obtainSession().driverId;
}

function goToAgentsToTravelCompleteds(tripId) {
    location.href = "/agentsTripCompleted/" + tripId;
}

function setTime(agentId, tripId) {
    let agentTripHour = document.querySelector(`#timeToAboard${agentId}`).value;
    fetch("/registerAgentTripTime", {
        method: "POST",
        body: JSON.stringify({
            agentId: agentId,
            agentTripHour: agentTripHour,
            tripId: tripId
        }),
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    })
    .then( res => res.json())
    .then( resp => {
        if (!resp.ok) {
            Swal.fire({
                icon: resp.type,
                title: resp.title,
                text: resp.message
            })
            .then(() => {
                document.querySelector(`#timeToAboard${agentId}`).value = 0;
            })
        }
    })
}

function passTripToProgress(tripId){
    Swal.fire({
        title: '¿Desea pasar a viaje en proceso?',
        text: 'Cuando este viaje pase a proceso ya no será editable',
        showDenyButton: true,
        confirmButtonText: `Si`,
        denyButtonText: `No`,
    }).then((result) => {
        if (result.isConfirmed){
            fetch('/passTripToProgress/'+tripId)
            .then( response => response.json())
            .then( resp =>{
                if(resp.ok) {
                    Swal.fire(resp.title, resp.message, resp.type)
                    .then(() =>{goToPendings();})
                }else{
                    Swal.fire(resp.title, resp.message, resp.type)
                }
            })
            .catch(err => { Swal.fire('Error!', 'Se ha producido un error en el servidor', 'error') })
        }
    })
}

function checkIn(agentId, tripId){
    let check = document.querySelector(`#agentCheckAboard${agentId}`).checked;
    fetch("/agentCheckIn", {
        method: "POST",
        body: JSON.stringify({
            agentId: agentId,
            tripId: tripId,
            traveled: check
        }),
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    })
    .then(res=> res.json())
    .then(resp => console.log(resp))
    .catch( err =>{
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Parece que algo salió mal, asegurate de tener buena conexión a internet!'
        })
    })
}

let agentToComment = {};

function loadComment(agentId, agentFullname, tripId, commentDriver){
    document.querySelector('#agentCommentShowName').innerHTML = `<i class="fa fa-user"></i> &emsp; ${agentFullname}`;

    getDriverComment(agentId, tripId);

    agentToComment = {
        agentId: agentId,
        tripId: tripId,
        commentDriver: ""
    }
}

function registerComment(){
    agentToComment.commentDriver = document.querySelector('#commentDriverInput').value;
    fetch("/agentTripSetComment", {
        method: "POST",
        body: JSON.stringify(agentToComment),
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    })
    .then(res=> res.json())
    .then(resp => console.log(resp))
    .catch( err =>{
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Parece que algo salió mal, asegurate de tener buena conexión a internet!'
        })
    })
}

function getDriverComment( agentId, tripId){
    fetch("/getDriverComment", {
        method: "POST",
        body: JSON.stringify({agentId: agentId, tripId: tripId}),
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    })
    .then(res=> res.json())
    .then(resp => {
        document.querySelector('#commentDriverInput').value = resp.comment.commentDriver;
    })
    .catch( err =>{
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Parece que algo salió mal, asegurate de tener buena conexión a internet!'
        })
    })
}

function setTripAsCompleted(tripId){
    fetch("/registerTripAsCompleted/"+tripId)
    .then( res => res.json())
    .then( resp => {
        if(resp.ok){
            Swal.fire({
                icon: resp.type,
                title: resp.title,
                text: resp.message
            })
            .then(()=>{
                goToTravelInProgress();
            })
        }else{
            Swal.fire({
                icon: resp.type,
                title: resp.title,
                text: resp.message
            })
        }
    });
}

function markAsEnded(tripId) {
    Swal.fire({
        text: '¿Desea marcar este viaje como completado?',
        showDenyButton: true,
        confirmButtonText: `Si`,
        denyButtonText: `No`,
    }).then((result) => {
        if (result.isConfirmed) {
            setTripAsCompleted(tripId);
        }
    })
}

function workingInThis(){
    Swal.fire({
        icon: 'warning',
        title: 'Espera...',
        text: 'Aún estamos costruyendo esta sección'
    })
}


function loadCommentHistory(agentFullname, commentDriver){
    document.querySelector('#agentCommentShowNameHistory').innerHTML = `<i class="fa fa-user"></i> &emsp; ${agentFullname}`;
    document.querySelector('#commentDriverInputHistory').value = commentDriver;
}


function setTripAsCanceled(tripId){
    fetch("/driverCancelTrip/"+tripId+"/"+obtainSession().driverId)
    .then( res => res.json())
    .then( resp => {
        if(resp.ok){
            Swal.fire({
                icon: 'success',
                title: 'El viaje ha sido marcado como cancelado.',
                text: 'Este viaje ha sido marcado como cancelado, si quieres verlo luego puedes ir a Historial de viajes'
            })
            .then(()=>{
                goToPendings();
            })
        }else{
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Parece que algo salió mal, asegurate de tener buena conexión a internet!'
            })
        }
    })
}

function markAsCanceled(tripId) {
    Swal.fire({
        text: '¿Desea marcar este viaje como cancelado?',
        showDenyButton: true,
        confirmButtonText: `Si`,
        denyButtonText: `No`,
    }).then((result) => {
        if (result.isConfirmed) {
            setTripAsCanceled(tripId);
        }
    })
}

function markAgentAsNotConfirmed(agentId, tripId) {
    fetch('/markAgentAsNotConfirmed', {
        method: "POST",
        body: JSON.stringify({agentId: agentId, tripId: tripId}),
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    })
    .then(res=> res.json())
    .then(resp => {
        if (resp.ok) {
            Swal.fire({
                icon: 'success',
                title: 'Hecho',
                text: 'Agente marcado como no confirmado'
            })
            .then(()=>{
                goToAgentsToTravel(tripId);
            })
        }else{
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Parece que algo salió mal, asegurate de tener buena conexión a internet!'
            })
        }
    })
    .catch( err =>{
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Parece que algo salió mal, asegurate de tener buena conexión a internet!'
        })
    })
}

function notConfirmed(agentId, tripId) {
    Swal.fire({
        icon: 'question',
        text: '¿Desea marcar este agente como no confirmado?',
        showDenyButton: true,
        confirmButtonText: `No`,
        denyButtonText: `Si`,
    }).then((result) => {
        if (result.isDenied) {
            markAgentAsNotConfirmed(agentId, tripId);
        }
    })
}