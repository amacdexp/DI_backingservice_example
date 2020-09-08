/*eslint-env node, es6 */
"use strict"
var http = require("http")
const axios = require('axios');
module.exports = {
	callService: (wss, rowcount) => {

		var DI_URL = 'https://vsystem.ingress.dh-rfb408no.di-us-east.shoot.live.k8s-hana.ondemand.com'
		wss.broadcast({user: "DI System", message: "Before HTTP Call\n"})
		try {

			axios.get(DI_URL + '/auth/login', {
				headers: {
				  'Authorization': 'Basic Z='
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
	},
	callServiceExample: (wss) => {
		wss.broadcast({user: "NODEJS", message: "Before HTTP Call\n"})
		try {
			http.get({
				path: "http://www.loc.gov/pictures/search/?fo=json&q=SAP&",
				host: "www.loc.gov",
				port: "80",
				headers: {
					host: "www.loc.gov"
				}
			},
				(response) => {
					response.setEncoding("utf8")
					response.on("data", (data) => {

						var outData = {}
						outData.user = "DI System"
						outData.message = '[RESPONSE]: ' + data.substring(0, 500)
						wss.broadcast(outData)
						//wss.broadcast(data.substring(0, 100))
					})
					response.on("error", wss.broadcast)
				})
		} catch (err) {
			wss.broadcast(err.toString())
		}
		wss.broadcast({user: "NODEJS", message: "After HTTP Call\n"})
	}
}