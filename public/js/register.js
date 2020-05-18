//  ----------- Declare variables ---------------------
let nm = document.getElementById('nm');
let lName = document.getElementById('lName');
let email = document.getElementById('email');
let phone = document.getElementById('phone');
let registerButton = document.getElementById('registerButton');
let userAgreementText = document.getElementById("userAgreementText");
let mailingSubscriptionText = document.getElementById("mailingSubscriptionText");
let userAgreementTextCloseButton = document.getElementsByClassName("close")[0];
let mailingSubscriptionTextCloseButton= document.getElementsByClassName("close")[1];

//  ----------- Initialise Flags ---------------------
let emailOk = false;
let nameOk = false; 
let lastNameOk = false;
let phoneOk = false;
let subscribed = 0; //audi server receives this flag as 0/1 instead of true/false


// ---------------- Buttons interaction ----------------
function chkUserAgreement(item){
    console.log(item.checked);
    registerButton.disabled = !item.checked;
}

function chkMailingSubscription(item){
    if(item.checked){
        subscribed = 1;
    } else{
        subscribed = 0;
    }
}

function cancel(){
    // go to home page
    window.location.pathname = '/';
}

function sbmt(){
    if(nameOk && lastNameOk && emailOk && phoneOk){
        // message to pass to the server
        let msg = `name=${nm.value}&lName=${lName.value}&email=${email.value}&phone=${phone.value}&subscribed=${subscribed}`;
        
        sendMsg('/api/register', msg)
            .then(()=> window.location.pathname = '/photo') // go to the next page after message is sent
            .catch(err => console.log(err));
    } else {
        // check and highlight empty/wrong field
        validateName(nm);
        validateLastName(lName);
        validateEmail(email);
        validatePhone(phone);
    }
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


//  --------------- Modal window open/close ----------------------------
function openModal(modal){
    if(modal === 1){
        userAgreementText.style.display = "block";
        mailingSubscriptionText.style.display = "none";
    } else if(modal === 2){
        mailingSubscriptionText.style.display = "block";
        userAgreementText.style.display = "none";
    }
}

userAgreementTextCloseButton.onclick = function() {
    userAgreementText.style.display = "none";
};

mailingSubscriptionTextCloseButton.onclick = function() {
    mailingSubscriptionText.style.display = "none";
};
  
window.onclick = function(event) {
    // When the user clicks anywhere outside of the popup windows, close it
    if (event.target == userAgreementText) {
      userAgreementText.style.display = "none";
    } else if(event.target == mailingSubscriptionText){
        mailingSubscriptionText.style.display = "none";
    }
};


// --------------- Validation functions ---------------------------
function validateEmail(caller) {
    let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(!re.test(String(email.value).toLowerCase())){
        caller.style.borderColor = 'lightcoral';
        emailOk = false;
    } else {
        caller.style.borderColor = 'greenyellow';
        emailOk = true;  
    }
}

function validateName(caller){
    if(nm.value.length < 2){
        caller.style.borderColor = 'lightcoral';
        nameOk = false;
    }else{
        caller.style.borderColor = 'greenyellow';
        nameOk = true;
    }
}

function validateLastName(caller){
    if(lName.value.length < 1){
        caller.style.borderColor = 'lightcoral';
        lastNameOk = false;
    }else{
        caller.style.borderColor = 'greenyellow';
        lastNameOk = true;
    }
}

function validatePhone(caller){
    const regex = /^[0-9]\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    phoneOk = regex.test(phone.value)
    if(!phoneOk){
        caller.style.borderColor = 'lightcoral';
        phoneOk = false;
    }else{
        caller.style.borderColor = 'greenyellow';
        phoneOk = true;
    }
}