// This function adds the recorded audio to the page so you can listen to it
function addAudioPlayer(blob){
    var url = URL.createObjectURL(blob);
    var log = document.getElementById('log');

    var audio = document.querySelector('#replay');
    if(audio != null){audio.parentNode.removeChild(audio);}

    audio = document.createElement('audio');
    audio.setAttribute('id', 'replay');
    audio.setAttribute('controls', 'controls');

    var source = document.createElement('source');
    source.src = url;

    audio.appendChild(source)
    log.parentNode.insertBefore(audio, log);
}

//Speaker Recognition API profile configuration
var Profile = class { constructor(name, profileId){this.name = name; this.profileId = profileId;}};
var profileIds = [];

(function(){
    //cross browser sound recording using the web audio API
    navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);

    //dump console logs onto the page
    var old = console.log;
    var logger = document.getElementById('log');
    var isScrolledToBottom = logger.scrollHeight - logger.clientHeight <= logger.scrollTop + 1;

    console.log = function(){
        for(var i = 0; i < arguments.length; i++){
            if(typeof arguments[i] == 'object'){
                logger.innerHTML += (JSON && JSON.stringify ? JSON.stringify(arguments[i], undefined, 2) : arguments[i]) + '<br/>';
            }
            else{
                logger.innerHTML += arguments[i] + '<br/>';
            }
            if(isScrolledToBottom) logger.scrollTop = logger.scrollHeight - logger.clientHeight;
        }
        old(...arguments);
    }
    console.error = console.log;
})();