const express = require('express');
const sql = require("sqlstoreprocedure");
const fetch = require("node-fetch");
const router = express.Router();

const pool = new sql(process.env.DB_USER, process.env.DB_HOST, process.env.DB_NAME, process.env.DB_PASSWORD);

router.get('/', (req, res) => {
    res.render('auth/login');
})

router.post('/login', async (req, res) => {
    let driver = (await pool.exec('SP_GET_LOGIN_DRIVER', {
        driverDNI: req.body.driverDNI
    })).recordset;
    if (driver.length > 0) {
        if (driver[0].driverPassword === req.body.driverPassword) {
            res.status(200).send({
                ok: true,
                driver: driver[0]
            });
        } else {
            res.status(200).send({
                ok: false,
                message: "Contraseña Incorrecta"
            });
        }
    } else {
        res.status(200).send({
            ok: false,
            message: "Numero de identidad no encontrado"
        });
    }
    res.end();
});

router.get('/home', (req, res) => {
    res.render('home');
});

router.get('/travelPendings/:driverId', async (req, res) => {
    let results = await pool.exec('SP_GET_TRIPS_FOR_DRIVER', {
        driverId: Number(req.params.driverId)
    });
    let trips = results.recordset;
    res.render('travels/travelsToAssignHour', {
        trips
    });
});

router.get('/agentsInTravel/:tripId', async (req, res) => {
    try {
        let agents = (await pool.exec('SP_GET_AGENTS_TRIP_DRIVER', {
            tripId: req.params.tripId
        })).recordset;
        let agentsNotConfirmed = (await pool.exec('SP_GET_AGENTS_NOT_CONFIRMED_TRIP_DRIVER', {
            tripId: req.params.tripId
        })).recordset;
        let agentsCanceled = (await pool.exec('SP_GET_AGENTS_CANCELED_TRIP_DRIVER', {
            tripId: req.params.tripId
        })).recordset;

        let actualTrip = (await pool.exec("SP_GET_TRIP", {
            tripId: req.params.tripId
        })).recordset[0];

        if (!!actualTrip.tripType) {
            actualTrip.tripType = "Entrada";
        } else {
            actualTrip.tripType = "Salida";
        }

        res.render('travels/agentsInTravel', {
            agents,
            agentsNotConfirmed,
            agentsCanceled,
            actualTrip
        });
        
    } catch (error) {
        console.log(error);
        res.status(500).send({
            ok: false,
            message: "Ha ocurrido un error"
        });
    }
})

router.post('/registerAgentTripTime', async (req, res) => {
    try {
        let result = (await pool.exec('SP_REGISTER_HOUR_AGENT_TRIP', req.body));
        if (result.recordset === undefined){
            res.status(200).send({
                ok: true,
                type: 'success',
                title: '!Hecho¡',
                message: 'Hora registrada con exito'
            });
        } else {
            res.status(200).send({
                ok: false,
                type: 'error',
                title: 'Error',
                message: result.recordset[0].msg
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({
            ok: false,
            type: 'error',
            title: 'Error',
            message: 'Ha ocurrido un error en el servidor'
        })
    }
});

router.get('/tripInProgress/:driverId', async (req, res) => {
    let results = await pool.exec('SP_GET_TRIPS_IN_PROGRESS', {
        driverId: Number(req.params.driverId)
    });
    let tripsInProgress = results.recordset;
    res.render('travels/travelsInProgress', {
        tripsInProgress
    });
});

router.get('/agentsTripInProgress/:tripId', async (req, res) => {
    let agentsInTrip = (await pool.exec('SP_GET_AGENTS_TRIP_IN_PROGRESS', {
        tripId: req.params.tripId
    })).recordset;

    let actualTrip = (await pool.exec("SP_GET_TRIP", {
        tripId: req.params.tripId
    })).recordset[0];

    if (!!actualTrip.tripType) {
        actualTrip.tripType = "Entrada";
    } else {
        actualTrip.tripType = "Salida";
    }

    res.render('travels/agentsInTrip', {
        agentsInTrip,
        actualTrip
    });
});

router.post('/agentCheckIn', async (req, res) => {
    try {
        await pool.exec('SP_AGENT_CHECK_IN', req.body);
        res.send({
            ok: true,
            message: "Completado"
        });
    } catch (err) {
        console.log(err);
        res.send({
            ok: false,
            message: "Ha ocurrido un error"
        });
    }
});

router.post('/getDriverComment', async (req, res) => {
    try {
        let comment = (await pool.exec('SP_GET_AGENT_TRIP_COMMENT', req.body)).recordset[0];
        res.send({
            ok: true,
            message: "Completado",
            comment: comment
        });
    } catch (err) {
        console.log(err);
        res.send({
            ok: false,
            message: "Ha ocurrido un error"
        });
    }
});

router.post('/agentTripSetComment', async (req, res) => {
    try {
        await pool.exec('SP_AGENT_TRIP_COMMENT', req.body);
        res.send({
            ok: true,
            message: "Completado"
        });
    } catch (err) {
        console.log(err);
        res.status(500).send({
            ok: false,
            message: "Ha ocurrido un error"
        });
    }
})

router.get('/registerTripAsCompleted/:tripId', async (req, res) => {
    try {
        let allow = (await pool.exec('SP_VALIDATE_TRIP_AS_COMPLETED', {
            tripId: req.params.tripId
        })).recordset[0].allow;

        if (allow === 1) {
            await pool.exec('SP_REGISTER_TRIP_AS_COMPLETED', {
                tripId: req.params.tripId
            });
            res.status(200).send({
                ok: true,
                type: 'success',
                title: 'Genial! has completado un viaje.',
                message: 'Este viaje ha sido marcado como completo, si quieres verlo luego puedes ir a Historial de viajes'
            });
        } else {
            res.status(200).send({
                ok: false,
                type: 'error',
                title: '¡Error!',
                message: '¡Hay agentes que no abordaron y están sin observación!'
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({
            ok: false,
            message: "Ha ocurrido un error"
        });
    }
});

router.get('/tripsCompleted/:driverId', async (req, res) => {
    let tripsCompleteds = (await pool.exec('SP_GET_TRIPS_COMPLETED', {
        driverId: Number(req.params.driverId)
    })).recordset;
    res.render('travels/travelsCompleted', {
        tripsCompleteds
    });
});

router.get('/agentsTripCompleted/:tripId', async (req, res) => {
    let agentsInTrip = (await pool.exec('SP_GET_AGENTS_TRIP_IN_PROGRESS', {
        tripId: req.params.tripId
    })).recordset;
    let agentsCanceled = (await pool.exec('SP_GET_AGENTS_CANCELED_TRIP_DRIVER', {
        tripId: req.params.tripId
    })).recordset;

    let actualTrip = (await pool.exec("SP_GET_TRIP", {
        tripId: req.params.tripId
    })).recordset[0];

    if (!!actualTrip.tripType) {
        actualTrip.tripType = "Entrada";
    } else {
        actualTrip.tripType = "Salida";
    }
    res.render('travels/agentsInCompleted', {
        agentsInTrip,
        agentsCanceled,
        actualTrip
    });
});

router.get('/driverCancelTrip/:tripId/:driverId', async (req, res) => {
    try {
        await pool.exec('SP_CANCEL_TRIP_DRIVER', {
            tripId: req.params.tripId,
            driverId: req.params.driverId
        });
        res.status(200).send({
            ok: true,
            message: 'Completado'
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            ok: false,
            message: 'Ha ocurrido un error'
        });
    }
});

router.get('/passTripToProgress/:tripId', async (req, res) => {
    try {
        let allowPassTrip = (await pool.exec('SP_VALIDATE_AGENT_TRIP_HOUR', {
            tripId: req.params.tripId
        })).recordset[0].allow;
        if (allowPassTrip === 1) {
            await pool.exec('SP_PASS_TRIP_TO_PROGRESS', {
                tripId: req.params.tripId
            });
            res.status(200).send({
                ok: true,
                type: 'success',
                title: '¡Viaje en proceso!',
                message: 'Podrá ver este viaje en la pestaña viajes en proceso'
            });
        } else {
            res.status(200).send({
                ok: false,
                type: 'error',
                title: '¡Error!',
                message: 'No se puede procesar este viaje, hay agentes sin hora asignada.'
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({
            ok: false,
            message: 'Ha ocurrido un error en el servidor'
        });
    }
});

router.post('/markAgentAsNotConfirmed', async (req, res) => {
    try {
        await pool.exec('SP_CANCEL_AGENT_TRIP', {
            tripId: req.body.tripId,
            agentId: req.body.agentId
        });
        res.status(200).send({
            ok: true,
            message: 'Completado'
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            ok: false,
            message: 'Ha ocurrido un error'
        });
    }
});

// Departures module

router.get('/newdeparture/:departmentId', async (req, res) => {
    let companies = (await pool.exec('SP_GET_COMPANIES_DRIVER', {
        departmentId: req.params.departmentId
    })).recordset;
    res.render('departures/newDeparture', {
        companies
    });
});

router.post('/searchAgent', async (req, res) => {
    try {
        let agent = (await pool.exec('SP_GET_AGENTS_FOR_TRIP_OUT', {
            companyId: req.body.companyId,
            agentEmployeeId: req.body.agentEmployeeId
        })).recordset[0];
        if (!!agent) {
            res.status(200).send({
                ok: true,
                agent: agent
            });
        } else {
            res.status(200).send({
                ok: false,
                title: '¡No encontrado!',
                message: 'Este agente no se encuentra registrado en el sistema',
                type: 'warning'
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({
            ok: false,
            type: 'error',
            title: 'Error',
            message: 'Ha ocurrido un error en el servidor'
        })
    }
});

router.post('/registerAgentForOutTrip', async (req, res) => {
    try {
        await pool.exec('SP_REGISTER_AGENT_TRIP_OUT', {
            agentId: req.body.agentId,
            tripId: req.body.tripId,
            tripHour: req.body.tripHour
        });
        res.status(200).send({
            ok: true
        });
    } catch (error) {
        console.log(error);
        res.status(200).send({
            ok: false,
            type: 'error',
            title: '¡Error!',
            message: 'Ha ocurrido un error a la hora de crear el viaje'
        });
    }
});

router.post('/registerDeparture', async (req, res) => {
    try {
        let tripId = (await pool.exec('SP_REGISTER_TRIP_OUT', {
            companyId: req.body.companyId,
            tripHour: req.body.tripHour,
            driverId: req.body.driverId,
            tripVehicle: req.body.tripVehicle
        })).recordset[0].tripId;

        req.body.agentToTripList.forEach(agent => {
            fetch('http://127.0.0.1:5000/registerAgentForOutTrip', {
                method: "POST",
                body: JSON.stringify({
                    agentId: agent.agentId,
                    tripId: tripId,
                    tripHour: req.body.tripHour
                }),
                headers: {
                    "Content-type": "application/json; charset=UTF-8"
                }
            })
        });

        res.status(200).send({
            ok: true,
            type: 'success',
            title: '¡Hecho!',
            message: 'Viaje creado con éxito',
            tripId: tripId
        });

    } catch (error) {
        console.log(error);
        res.status(500).send({
            ok: false,
            type: 'error',
            title: '¡Error!',
            message: 'No se pudo crear el viaje'
        });
    }
});

module.exports = router;

//trip : companyId, tripHour, tripDate, driverId, tripVehicle
