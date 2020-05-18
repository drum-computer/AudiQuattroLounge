let sendBtn = document.getElementById("sendBtn");
let triggerStatus = 1; // 1 = first photo, 2 = retake photo
let timerHandler = 0;

function trigger(btn){

    if (triggerStatus === 1){
        btn.innerHTML = 'Переснять <i class="material-icons md-dark">refresh</i>';
        sendMsg('/api/trigger', 'trigger=2'); 
        timer('start');
        triggerStatus = 2;

    } else if(triggerStatus === 2){
        btn.innerHTML = 'Сделать фото <i class="material-icons md-dark">photo_camera</i>';
        sendMsg('/api/trigger', 'trigger=1');
        sendBtn.disabled = true; 
        timer('stop');
        triggerStatus = 1; 
    }
};

function changeButtonState(){
    sendBtn.disabled = false;
}

function timer(command){
    // since there is no feedback from the photoserver we use 3 seconds
    // as a guaranteed time for which photo would become ready for sending
    if (command === 'start'){
        timerHandler = setTimeout(changeButtonState, 3000);
    } else {
        clearTimeout(timerHandler);
    }   
}

function send(){
    sendMsg('/api/endSession', 'closed=true')
        .then(()=> window.location.pathname = '/goodbye') // go to the next page after message is sent
        .catch(err => console.log(err));
}

function cancel(){
    // go to home page
    sendMsg('/api/endSession', 'closed=false')
        .then(()=> window.location.pathname = '/') // go to the next page after message is sent
        .catch(err => console.log(err));
}

// this function passes user's data to the server
function sendMsg(apiEndPoint, msg){
    return new Promise((resolve, reject) => {
        let xmlHttp = new XMLHttpRequest();
        xmlHttp.open("POST", apiEndPoint, true); // true for asynchronous 
        xmlHttp.onreadystatechange = function(){
            if(xmlHttp.readyState === XMLHttpRequest.DONE){
                let status = xmlHttp.status;
                if (status === 0 || (status >= 200 && status < 400)) {
                    resolve();
                } else {
                    // Oh no! There has been an error with the request!
                    reject(xmlHttp.responseText);
                }
            }
        };

        xmlHttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xmlHttp.send(msg);
    });
}