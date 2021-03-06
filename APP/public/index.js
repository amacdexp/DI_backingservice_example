//********************************** */
// encapsulated javcript for index.html
//********************************** */

function index() {

    jQuery.sap.require("sap.m.MessageToast");
    //var MessageToast = new sap.m.MessageToast();
    // Chat Model
    var oModel = new sap.ui.model.json.JSONModel(),

    names = ['Random User Aaaa','Random User Bbbb','Random User Cccc','Random User Dddd','Random User Eeee','Random User Ffff'];

    oModel.setData({
        user: names[Math.floor(names.length * Math.random())],
        chat: ""
    });
    sap.ui.getCore().setModel(oModel);

    // WS handling
    jQuery.sap.require("sap.ui.core.ws.WebSocket");  
    //var connection = new sap.ui.core.ws.WebSocket('ws://localhost:8080');
    var connection = new sap.ui.core.ws.WebSocket("/asyncDI");

    // connection opened 
    connection.attachOpen(function (oControlEvent) {
    notify('onOpen', 'connection opened...', 'success');
    }); 

    // server messages
    connection.attachMessage(function (oControlEvent) {
    var data = jQuery.parseJSON(oControlEvent.getParameter('data')),
    msg = data.user + ': ' + data.message,
    lastInfo = oModel.oData.chat;

    if (data.message === undefined) {
        msg = data.data.user + ': ' + data.data.message
    }




    if (lastInfo.length > 0) lastInfo += "\r\n";  
    oModel.setData({chat: lastInfo + msg}, true); 
        
    // scroll to textarea bottom to show new messages
    $('#chatInfo').scrollTop($('#chatInfo')[0].scrollHeight);

    notify('onMessage', msg.substring(0,30), 'information');      
    });

    // error handling
    connection.attachError(function (oControlEvent) {
    notify('onError', 'Websocket connection error', 'error');
    }); 

    // onConnectionClose
    connection.attachClose(function (oControlEvent) {
    notify('onClose', 'Websocket connection closed', 'warning');
    });

    // send message
    var sendMsg = function() {
    var msg = oMsg.getValue();
    if (msg.length > 0) {


    //Action in Websocket to use e.g. callDI

    vAction = "Chat" 
    vAction = "callDI"

    connection.send( JSON.stringify(
        {user: oModel.oData.user, message: msg, action: vAction}
    )
    );
    notify('sendMessage', msg, 'alert');
    oMsg.setValue();  // reset textfield
    oMsg.focus();  // focus field       
    }     
    }   

    // notifier 
    function notify(title, text, type) {  

    sap.m.MessageToast.show('['+ type + '] ' + title + '\n\n' + text, { animationDuration : 4000 , my : "center center", at : "center center"} )

    } 

    // UI5 User Interface

    // attach key return handler for textinput
    sap.ui.commons.TextField.prototype.onkeyup = function(oBrowserEvent) {
    if (oBrowserEvent.keyCode === 13) sendMsg();
    }; 

    var oUserField = new sap.m.Text("userName", {
            text: "{/user}",
            tooltip: "Edit me"
    }).placeAt("username");

    //var oIPE1 = new sap.m.Input("IPE1",{
    // value: oUserField,
    //}).placeAt("username"); 

    var oChatInfo = new sap.m.TextArea("chatInfo", {  
    height: "600px",
    width: "1200px",
    editable: false,
    valueState : sap.ui.core.ValueState.Success,
    value: "{/chat}"
    }).placeAt("info");

    var oMsg = new sap.m.Input("chatMsg", {
            width: '20em',
            value: "10"
    }).placeAt("text");

    var oSendBtn = new sap.m.Button("sendBtn", {
            text: "Send # rows from HANA to DI for ML Processing",
            press: function(oEvent) {
            sendMsg();
            } 
    }).placeAt("btn");  

};



index();
