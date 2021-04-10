const express = require('express');
const sql = require("sqlstoreprocedure");
const fetch = require("node-fetch");
const {
    json
} = require('express');
const {
    send
} = require('process');
const router = express.Router();
const pool = new sql(process.env.DB_USER, process.env.DB_HOST, process.env.DB_NAME, process.env.DB_PASSWORD);

//- /*****************************************************************************************/
//- /*Apis POST                                                                              ||
//- /*****************************************************************************************/

//- /*****************************************************************************************/
//- /*Api de Login(Lista)                                                                    ||
//- /*****************************************************************************************/
router.post('/apis/login', async (req, res) => {
    let driver = (await pool.exec('SP_GET_LOGIN_DRIVER', {
        driverDNI: req.body.driverDNI
    })).recordset;
    console.log(driver);
    if (driver.length > 0) {
        if (driver[0].driverPassword === req.body.driverPassword) {
            res.status(200).json({
                ok: true,
                driver: driver[0]
            })
        } else {
            res.status(200).json({
                ok: false,
                message: "Contraseña Incorrecta"
            });
        }
    } else {
        res.status(200).json({
            ok: false,
            message: "Numero de identidad no encontrado"
        });
    }
    res.end();
});

//- /*****************************************************************************************/
//- /*Api Registrar Hora de viaje(sin probar)                                                 ||
//- /*****************************************************************************************/
router.post('/apis/registerAgentTripTime', async (req, res) => {
    try {
        let result = (await pool.exec('SP_REGISTER_HOUR_AGENT_TRIP', req.body));
        if (result.recordset === undefined){
            res.status(200).json({
                ok: true,
                type: 'success',
                title: '!Hecho¡',
                message: 'Hora registrada con exito'
            });
        } else {
            res.status(200).json({
                ok: false,
                type: 'error',
                title: 'Error',
                message: result.recordset[0].msg
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            type: 'error',
            title: 'Error',
            message: 'Ha ocurrido un error en el servidor'
        })
    }
});

//- /*****************************************************************************************/
//- /*Api Agente check In (listo)                                                             ||
//- /*****************************************************************************************/
router.post('/apis/agentCheckIn', async (req, res) => {
    try {
        await pool.exec('SP_AGENT_CHECK_IN', req.body);
        res.json({
            ok: true,
            message: "Completado"
        });
    } catch (err) {
        console.log(err);
        res.json({
            ok: false,
            message: "Ha ocurrido un error"
        });
    }
});

//- /*****************************************************************************************/
//- /*Api Comentario de Motorista (listo)                                                    ||
//- /*****************************************************************************************/
router.post('/apis/getDriverComment', async (req, res) => {
    try {
        let comment = (await pool.exec('SP_GET_AGENT_TRIP_COMMENT', req.body)).recordset[0];
        res.json({
            ok: true,
            message: "Completado",
            comment: comment
        });
    } catch (err) {
        console.log(err);
        res.json({
            ok: false,
            message: "Ha ocurrido un error"
        });
    }
});

//- /*****************************************************************************************/
//- /*Api Comentario hacia el agente(listo)                                                   ||
//- /*****************************************************************************************/
router.post('/apis/agentTripSetComment', async (req, res) => {
    try {
        await pool.exec('SP_AGENT_TRIP_COMMENT', req.body);
        res.json({
            ok: true,
            message: "Completado"
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            ok: false,
            message: "Ha ocurrido un error"
        });
    }
});

//- /*****************************************************************************************/
//- /*Api Check para agentes no confirmados(listo)                                           ||
//- /*****************************************************************************************/
router.post('/apis/markAgentAsNotConfirmed', async (req, res) => {
    try {
        await pool.exec('SP_CANCEL_AGENT_TRIP', {
            tripId: req.body.tripId,
            agentId: req.body.agentId
        });
        res.status(200).json({
            ok: true,
            message: 'Completado'
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            message: 'Ha ocurrido un error'
        });
    }
});

//- /*****************************************************************************************/
//- /*Api Buscar agente(listo)                                                                ||
//- /*****************************************************************************************/
router.post('/apis/searchAgent', async (req, res) => {
    try {
        let agent = (await pool.exec('SP_GET_AGENTS_FOR_TRIP_OUT', {
            companyId: req.body.companyId,
            agentEmployeeId: req.body.agentEmployeeId
        })).recordset[0];
        if (!!agent) {
            res.status(200).json({
                ok: true,
                agent: agent
            });
        } else {
            res.status(200).json({
                ok: false,
                title: '¡No encontrado!',
                message: 'Este agente no se encuentra registrado en el sistema',
                type: 'warning'
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            type: 'error',
            title: 'Error',
            message: 'Ha ocurrido un error en el servidor'
        })
    }
});

//- /*****************************************************************************************/
//- /*Api Registro de viaje de salida para agente(listo)                                      ||
//- /*****************************************************************************************/
router.post('/apis/registerAgentForOutTrip', async (req, res) => {
    try {
        await pool.exec('SP_REGISTER_AGENT_TRIP_OUT', {
            agentId: req.body.agentId,
            tripId: req.body.tripId,
            tripHour: req.body.tripHour
        });
        res.status(200).json({
            ok: true
        });
    } catch (error) {
        console.log(error);
        res.status(200).json({
            ok: false,
            type: 'error',
            title: '¡Error!',
            message: 'Ha ocurrido un error a la hora de crear el viaje'
        });
    }
});

//- /*****************************************************************************************/
//- /*Api Registro Compañia(listo)                                                            ||
//- /*****************************************************************************************/
router.post('/apis/registerDeparture', async (req, res) => {
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
        res.status(200).json({
            ok: true,
            type: 'success',
            title: '¡Hecho!',
            message: 'Viaje creado con éxito',
            tripId: tripId
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            type: 'error',
            title: '¡Error!',
            message: 'No se pudo crear el viaje'
        });
    }
});

//- /*****************************************************************************************/
//- /*Apis GET                                                                                ||
//- /*****************************************************************************************/

//- /*****************************************************************************************/
//- /*Api Trip en Proceso (listo)                                                             ||
//- /*****************************************************************************************/
router.get('/apis/tripInProgress/:driverId', async (req, res) => {
    let results = await pool.exec('SP_GET_TRIPS_IN_PROGRESS', {
        driverId: Number(req.params.driverId)
    });
    let tripsInProgress = results.recordset;
    res.json(tripsInProgress);
});

//- /*****************************************************************************************/
//- /*Api Agentes en Trip en Proceso (listo)                                                 ||
//- /*****************************************************************************************/
router.get('/apis/agentsTripInProgress/:tripId', async (req, res) => {
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
    let agentTripProgress = [{
            tripAgent : agentsInTrip
        },
        {
            actualTravel : actualTrip
        }
    ];
    res.json(agentTripProgress);
});

//- /*****************************************************************************************/
//- /*Api Trip Cancelado (Listo)                                                              ||
//- /*****************************************************************************************/
router.get('/apis/driverCancelTrip/:tripId/:driverId', async (req, res) => {
    try {
        await pool.exec('SP_CANCEL_TRIP_DRIVER', {
            tripId: req.params.tripId,
            driverId: req.params.driverId
        });
        res.status(200).json({
            ok: true,
            message: 'Completado'
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            message: 'Ha ocurrido un error'
        });
    }
});

//- /*****************************************************************************************/
//- /*Api Trip Pendientes(sin probar)                                                         ||
//- /*****************************************************************************************/
router.get('/apis/travelPendings/:driverId', async (req, res) => {
    let results = await pool.exec('SP_GET_TRIPS_FOR_DRIVER', {
        driverId: Number(req.params.driverId)
    });
    let trips = results.recordset;
    res.json(trips);
});

//- /*****************************************************************************************/
//- /*Api Agentes en Viaje(lista)                                                             ||
//- /*****************************************************************************************/
router.get('/apis/agentsInTravel/:tripId', async (req, res) => {
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
        let viewAgentTravel   = [{
                agentes: agents
            },
            {
                noConfirmados: agentsNotConfirmed
            },
            {
                cancelados: agentsCanceled
            },
            {
                viajeActual: actualTrip
            }
        ];
        res.json(viewAgentTravel);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            message: "Ha ocurrido un error"
        });
    }
});

//- /*****************************************************************************************/
//- /*Api Registro de viaje completado(listo y en flutter)                                                 ||
//- /*****************************************************************************************/
router.get('/apis/registerTripAsCompleted/:tripId', async (req, res) => {
    try {
        let allow = (await pool.exec('SP_VALIDATE_TRIP_AS_COMPLETED', {
            tripId: req.params.tripId
        })).recordset[0].allow;
        if (allow === 1) {
            await pool.exec('SP_REGISTER_TRIP_AS_COMPLETED', {
                tripId: req.params.tripId
            });
            res.status(200).json({
                ok: true,
                type: 'success',
                title: 'Genial! has completado un viaje.',
                message: 'Este viaje ha sido marcado como completo, si quieres verlo luego puedes ir a Historial de viajes'
            });
        } else {
            res.status(200).json({
                ok: false,
                type: 'error',
                title: '¡Error!',
                message: '¡Hay agentes que no abordaron y están sin observación!'
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            message: "Ha ocurrido un error"
        });
    }
});

//- /*****************************************************************************************/
//- /*Api Registro de viaje completado(listo)                                                 ||
//- /*****************************************************************************************/
router.get('/apis/tripsCompleted/:driverId', async (req, res) => {
    let tripsCompleteds = (await pool.exec('SP_GET_TRIPS_COMPLETED', {
        driverId: Number(req.params.driverId)
    })).recordset;
    res.json(tripsCompleteds);
});

//- /*****************************************************************************************/
//- /*Api Registro de agentes en viaje completado(listo)                                      ||
//- /*****************************************************************************************/
router.get('/apis/agentsTripCompleted/:tripId', async (req, res) => {
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
    let agentCompletTrip =[
        {
            inTrip: agentsInTrip
        },
        {
            CancelAgent: agentsCanceled
        },
        {
            tripActual : actualTrip
        }
    ]
    res.json(agentCompletTrip);
});

//- /*****************************************************************************************/
//- /*Api Motorista cancelando viaje (listo)                                                  ||
//- /*****************************************************************************************/
router.get('/apis/driverCancelTrip/:tripId/:driverId', async (req, res) => {
    try {
        await pool.exec('SP_CANCEL_TRIP_DRIVER', {
            tripId: req.params.tripId,
            driverId: req.params.driverId
        });
        res.status(200).json({
            ok: true,
            message: 'Completado'
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            message: 'Ha ocurrido un error'
        });
    }
});
//- /*****************************************************************************************/
//- /*Api Viaje pasa a viaje en progreso (listo)                                              ||
//- /*****************************************************************************************/
router.get('/apis/passTripToProgress/:tripId', async (req, res) => {
    try {
        let allowPassTrip = (await pool.exec('SP_VALIDATE_AGENT_TRIP_HOUR', {
            tripId: req.params.tripId
        })).recordset[0].allow;
        if (allowPassTrip === 1) {
            await pool.exec('SP_PASS_TRIP_TO_PROGRESS', {
                tripId: req.params.tripId
            });
            res.status(200).json({
                ok: true,
                type: 'success',
                title: '¡Viaje en proceso!',
                message: 'Podrá ver este viaje en la pestaña viajes en proceso'
            });
        } else {
            res.status(200).json({
                ok: false,
                type: 'error',
                title: '¡Error!',
                message: 'No se puede procesar este viaje, hay agentes sin hora asignada.'
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            message: 'Ha ocurrido un error en el servidor'
        });
    }
});

//- /*****************************************************************************************/
//- /*Api nuevo departamento (listo)                                                          ||
//- /*****************************************************************************************/
router.get('/apis/newdeparture/:departmentId', async (req, res) => {
    let companies = (await pool.exec('SP_GET_COMPANIES_DRIVER', {
        departmentId: req.params.departmentId
    })).recordset;
    res.json(companies);
});


module.exports = router;