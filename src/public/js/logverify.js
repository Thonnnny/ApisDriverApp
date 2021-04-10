let saveSession = (user) => {
    localStorage.setItem('currentSession', JSON.stringify(user));
};
let obtainSession = () => {
    return JSON.parse(localStorage.getItem('currentSession'))
};
let deleteSession = () => {
    localStorage.removeItem('currentSession')
};


function logVerify() {
    if (obtainSession() === null) {
        location.href = "/";
    }
}

function sessionVerify(){
    if (obtainSession() != null) {
        location.href = "/home";
    }
}

function logOut(){
    Swal.fire({
        title: 'Cerrar Sesión',
        text: '¿Desea abandonar la sesión actual?',
        showDenyButton: true,
        confirmButtonText: `No`,
        denyButtonText: `Si`,
    }).then((result) => {
        if (result.isDenied) {
            Swal.fire(
                'Sesión finalizada!',
                'Gracias por usar smart driver',
                'success'
            )
            .then(() =>{
                deleteSession();
                location.href = "/";
            })
        }
    })
}

function usernameShow() {
    document.querySelector('#userNameShower').innerHTML = obtainSession().driverFullname;
}


// check control
function isChecked( elementId, status ) {
    if(!!status){
        document.querySelector(`#${elementId}`).checked = true;
    }else{
        document.querySelector(`#${elementId}`).checked = false;
    }
}