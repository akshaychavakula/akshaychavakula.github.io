const createIdentificationProfileEndpoint = `https://westus.api.cognitive.microsoft.com/speaker/identification/v2.0/text-independent/profiles`;
const enrollIdentificationProfileEndpoint = (profileId) => `https://westus.api.cognitive.microsoft.com/speaker/identification/v2.0/text-independent/profiles/${profileId}/enrollments?ignoreMinLength=true`;
const enrollIdentificationProfileStatusEndpoint = (profileId) => `https://westus.api.cognitive.microsoft.com/speaker/identification/v2.0/text-independent/profiles/${profileId}`;
const identifyProfileEndpoint = (Ids) => `https://westus.api.cognitive.microsoft.com/speaker/identification/v2.0/text-independent/profiles/identifySingleSpeaker?profileIds=${Ids}&ignoreMinLength=true`;

//Step 1: start the browser listening, listen for 15 seconds, pass the audio stream to createProfile
function enrollNewProfile(){
    navigator.getUserMedia({audio: true}, function(stream){
        console.log("I am listening...just start talking for a few seconds...");
        onMediaSuccess(stream, createProfile, 30);
    }, onMediaError);
}

//enroll via file upload
function enrollNewProfileViaFU(){
    
}

//createProfile calls the profile endpoint to get a profile Id, then calls enrollProfileAudio
function createProfile(blob){
    addAudioPlayer(blob);

    var request = new XMLHttpRequest();
    request.open("POST", createIdentificationProfileEndpoint, true);

    request.setRequestHeader('Content-Type', 'application/json');
    request.setRequestHeader('Ocp-Apim-Subscription-Key', '0dfb08f3236b4a91bcc991aa0e9bdbf3');

    request.onload = function () {
        console.log('creating profile');
        var json = JSON.parse(request.responseText);
        console.log(json);

        var profileId = json.profileId;

        enrollProfileAudio(blob, profileId);
    };

    request.send(JSON.stringify({'locale' : 'en-us'}));
}

// enrollProfileAudio enrolls the recorded audio with the new profile Id, polling the status
function enrollProfileAudio(blob, profileId){

    var request = new XMLHttpRequest();
    request.open("POST", enrollIdentificationProfileEndpoint(profileId), true);
    request.setRequestHeader('Ocp-Apim-Subscription-Key', '0dfb08f3236b4a91bcc991aa0e9bdbf3');
    request.onload = function () {
        console.log('enrolling');

        if(request.status == 200 || request.status == 201){
            var json = JSON.parse(request.responseText);
            console.log(json);

            const location = enrollIdentificationProfileStatusEndpoint(profileId);
            pollForEnrollment(location, profileId);
        }
        else{
            console.log(`Failed to submit for enrollment: got a ${request.status} response code`);
            var json = JSON.parse(request.responseText);
            console.log(`${json.error.code}: ${json.error.message}`);
        }
    };
    request.send(blob);
}

//ping the status endpoint to see if enrollment for identification is done
function pollForEnrollment(location, profileId){
    var enrolledInterval;

    //hit the endpoint every few seconds
    enrolledInterval = setInterval(function(){
        var request = new XMLHttpRequest();
        request.open("GET", location, true);
        request.setRequestHeader('Ocp-Apim-Subscription-Key', '0dfb08f3236b4a91bcc991aa0e9bdbf3');
        request.onload = function(){
            console.log('getting status');
            var json = JSON.parse(request.responseText);
            console.log(json);

            if(json.enrollmentStatus == 'Enrolled'){
                //audio was enrolled successfully
                //stop polling
                clearInterval(enrolledInterval);
                console.log('enrollment complete');

                //ask for a name to assosciated with the ID to make the identification nicer
                var name = window.prompt('Who was talking?');
                profileIds.push(new Profile(name, profileId));
                console.log(profileId + ' is now mapped to ' + name);
            }
            else{
                //keep polling
                console.log('Not done yet..');
            }
        };
        request.send();
    }, 1000);
}

//Step 2: start the browser listening, listen for 10 seconds, pass the audio stream to "identifyProfile"
function startListeningForIdentification(){
    if(profileIds.length > 0){
        console.log("I am listening.. start talking for a few seconds...");
        navigator.getUserMedia({audio: true}, function(stream){onMediaSuccess(stream, identifyProfile, 10)}, onMediaError);
    }
    else{
        console.log('No profiles enrolled yet');
    }
}

//Step 3: take the audio and send it to the identification endpoint
function identifyProfile(blob){
    addAudioPlayer(blob);

    //comma delimited list of profile Ids we are interested in comparing against
    var Ids = profileIds.map(x => x.profileId).join();

    var request = new XMLHttpRequest();
    request.open("POST", identifyProfileEndpoint(Ids), true);
    request.setRequestHeader('Ocp-Apim-Subscription-Key', '0dfb08f3236b4a91bcc991aa0e9bdbf3');
    request.onload = function(){
        console.log('identifying profile');
        var json = JSON.parse(request.responseText);
        console.log(json);

        if(request.status == 200){
            var speaker = profileIds.filter(function(p){return p.profileId == json.identifiedProfile.profileId});

            if(speaker != null && speaker.length > 0){
                console.log('I think ' + speaker[0].name + ' was talking');
            }
            else{
                console.log('I could not tell who was talking');
            }
        }
        else{
            console.log(`Failed to submit for identification: got a ${request.status} response code`);
            console.log(`${json.error.code}: ${json.error.message}`);
        }
    };

    request.send(blob);
}