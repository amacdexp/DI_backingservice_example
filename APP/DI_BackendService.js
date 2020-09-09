//Call DI Backing Service
//Use local environment variables for ADMIN Credentials if running locally
require('dotenv').config();

//console.log(`process.env.DI_SERVICEUSER_CREDENTIALS: ${process.env.DI_SERVICEUSER_CREDENTIALS}`);
var di_service_user = process.env.DI_SERVICEUSER_CREDENTIALS;
var di_url = process.env.DI_URL;


"use strict"
const axios = require('axios');
module.exports = {
	callService: (wss, rowcount) => {

		//wss.broadcast({user: "NODEJS", message: "Before HTTP Call\n"})
		try {

			axios.get(di_url + '/auth/login', {
				headers: {
				  'Authorization': di_service_user
				}
			  })
			.then(response => { 

			  var cookieInfo = response.headers['set-cookie'];	 
			  //console.log(cookieInfo);

			  var outData = {}
			  outData.user = "DI SERVICE USER"
			  outData.message = '[AUTH INFO RESPONSE]: ' + "\n" + response.headers['set-cookie'] + "\n" + "\n"
			  wss.broadcast(outData)


              //Get RESPONSE from Pipeline model OPENAPI 
			  axios.get(di_url + '/app/pipeline-modeler/openapi/service/accenture/hanaml/v1/pyml1/' + rowcount, {
					headers: {
					'cookie': cookieInfo
					}
				})
				.then(response => { 
					

					var responseStr = JSON.stringify(response.data.Body)
					//console.log(response.data.Body);

					var outData = {}
					outData.user = "DI SERVICE USER"
					outData.message = '[OPENAPI RESPONSE]: ' + "\n" + responseStr + "\n" + "\n"
					wss.broadcast(outData)
				})
				.catch(error => {
					//console.log(error);
					wss.broadcast({user: "DI SERVICE USER", message: error.toString() + "\n" } )
				})



			})
			.catch(error => {
			  //console.log(error);
			  wss.broadcast({user: "NODEJS", message: error.toString() } )
			})

		} catch (error) {
			wss.broadcast({user: "NODEJS", message: error.toString() } )
		}

		//wss.broadcast({user: "NODEJS", message: "After HTTP Call\n"})
	}
}