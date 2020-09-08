//var hdbext = require("@sap/hdbext");
//var hana = require("@sap/hana-client");
var express = require("express");
var WebSocketServer = require("ws").Server

var stringifyObj = require("stringify-object");
var path = require('path');

//**************************** Libraries for enabling authentication *****************************
var passport = require('passport');
var xsenv = require('@sap/xsenv');
var JWTStrategy = require('@sap/xssec').JWTStrategy;





var app = express();

//enable files in public folder to be read
app.use(express.static('./public'));


//*******************************Setup Application logging *******************************
let logging = require('@sap/logging')
let appContext = logging.createAppContext({})
app.logger = appContext.createLogContext().getLogger('/Application')




var server = require("http").createServer();
var port = process.env.PORT || 3000;


var client = null;

const DI_BackendService = require("./DI_BackendService.js")

//***********************************************************************************************
//**Try to Enable authorization
try {
    var services = xsenv.getServices({ uaa: { tag: 'xsuaa' } }); //Get the XSUAA service
    passport.use(new JWTStrategy(services.uaa));
    app.use(passport.initialize());
    app.use(passport.authenticate('JWT', { session: false })); //Authenticate using JWT strategy
  }
  catch(err) {
    app.logger.info("[CUSTOM] No xsuaa service bound to app.... NO Secuirty applied")
    //console.log("[CUSTOM] No xsuaa service bound to app.... NO Secuirty applied")
  }



//***********************************************************************************************
//** Base URL response  


app.get("/", function (req, res) {
    output = '<H1>NodeJS Express Server running</H1></br>'
    output += '<a href="/asyncDI">/asyncDI</a> - Example Async DI Calls</br>'
    res.type("text/html").send(output);

});


//***********************************************************************************************
//** Websocket Async call to DI     
//***********************************************************************************************                                           
app.use('/asyncDI', (req, res) => {
    var output =
    `<H1>Asynchronous DI Example</H1></br> 
    <a href="/DI_test">/DI_test</a> - Test Framework for Async Examples</br>`
    res.type("text/html").status(200).send(output)
})


try {
    var wss = new WebSocketServer({
        //server: server
        noServer: true,
        path: "/asyncDI"
    })

    server.on("upgrade", (request, socket, head) => {
        const url = require("url")
        const pathname = url.parse(request.url).pathname
        
        app.logger.info("[CUSTOM] " + pathname );


        if (pathname === "/asyncDI") {
            wss.handleUpgrade(request, socket, head, (ws) => {
                wss.emit("connection", ws, request)
            })
        }
    })

    wss.broadcast = (data) => {
        
        var message = JSON.stringify({
            data
        })

        //app.logger.info("[CUSTOM] " + message );

        wss.clients.forEach((client) => {
            app.logger.info("[CUSTOM] " + client );
            try {
                client.send(message, (error) => {
                    if (typeof error !== "undefined") {
                        app.logger.error(`Send Error: ${error.toString()}`)
                    }
                })
            } catch (e) {
                app.logger.error(`Broadcast Error: ${e.toString()}`)
            }
        })
        app.logger.info(`Sent: ${message}`)
    }

    wss.on("error", (error) => {
        app.logger.error(`Web Socket Server Error: ${error.toString()}`)
    })

    wss.on("connection", (ws) => {
        app.logger.info("Connected")

        ws.on("message", (message) => {
            app.logger.info(`Received: ${message}`)
            var data = JSON.parse(message)
            switch (data.action) {
            case "Chat":
                //app.logger.info("[CUSTOM] " + stringifyObj(message));
                wss.broadcast(message);
                break
            case "callDI":
                DI_BackendService.callService(wss, '20000000')
                break
            default:
                wss.broadcast(`Error: Undefined Action: ${data.action}`)
                break
            }
        })

        ws.on("close", () => {
            app.logger.info("Closed")
        })

        ws.on("error", (error) => {
            app.logger.error(`Web Socket Error: ${error.toString()}`)
        })

        ws.send(JSON.stringify({
            user: 'NODEJS',
            message: "Connected to WebSocket"
        }), (error) => {
            if (typeof error !== "undefined") {
                app.logger.error(`Send Error: ${error.toString()}`)
            }
        })
    })
} catch (e) {
    //console.log(`General Error: ${e.toString()}`)
    app.logger.error(`General Error: ${e.toString()}`)


}






server.on("request", app);

server.listen(port, function () {
    console.info("HTTP Server: " + server.address().port);
    console.log("WS Server: " + wss.port);

});

