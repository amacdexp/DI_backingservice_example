//Call DI Backing Service
//Use local environment variables for ADMIN Credentials if running locally
require('dotenv').config();

console.log(`process.env.DI_SERVICEUSER_CREDENTIALS: ${process.env.DI_SERVICEUSER_CREDENTIALS}`);
var di_service_user = process.env.DI_SERVICEUSER_CREDENTIALS;
console.log(di_service_user);

"use strict"
const axios = require('axios');
module.exports = {
	callService: (wss, rowcount) => {

		var DI_URL = 'https://vsystem.ingress.dh-rfb408no.di-us-east.shoot.live.k8s-hana.ondemand.com'
		wss.broadcast({user: "DI System", message: "Before HTTP Call\n"})
		try {

			axios.get(DI_URL + '/auth/login', {
				headers: {
				  'Authorization': di_service_user
				}
			  })
			.then(response => { 

			  var cookieInfo = response.headers['set-cookie'];	 
			  //console.log(cookieInfo);

			  var outData = {}
			  outData.user = "DI System"
			  outData.message = '[AUTH INFO RESPONSE]: ' + response.headers['set-cookie']
			  wss.broadcast(outData)


              //Get RESPONSE from Pipeline model OPENAPI 
			  axios.get(DI_URL + '/app/pipeline-modeler/openapi/service/accenture/hanaml/v1/pyml1/' + rowcount, {
					headers: {
					'cookie': cookieInfo
					}
				})
				.then(response => { 
					

					var responseStr = JSON.stringify(response.data.Body)
					//console.log(response.data.Body);

					var outData = {}
					outData.user = "DI System"
					outData.message = '[OPENAPI RESPONSE]: ' + responseStr
					wss.broadcast(outData)
				})
				.catch(error => {
					console.log(error);
					wss.broadcast({user: "DI System", message: error.toString() } )
				})



			})
			.catch(error => {
			  console.log(error);
			  wss.broadcast({user: "DI System", message: error.toString() } )
			})

		} catch (error) {
			wss.broadcast({user: "NODEJS", message: error.toString() } )
		}

		wss.broadcast({user: "NODEJS", message: "After HTTP Call\n"})
	}
}