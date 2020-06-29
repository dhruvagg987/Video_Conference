let divSelectRoom = document.getElementById("selectRoom")
let divConsultingRoom = document.getElementById("consultingRoom")
let inputRoomNumber = document.getElementById("roomNumber")
let btnGoRoom = document.getElementById("goRoom")
let localVideo = document.getElementById("localVideo")
let remoteVideo = document.getElementById("remoteVideo")

let roomNumber, localStream, remoteStream, rtcPeerConnection, isCaller

const iceServers = {
    'iceServer':[
        {'urls': 'stun:stun.services.mozilla.com'},
        {'urls': 'stun:stun.l.google.com:19302'}
    ]
}

const streamConstraints = {
    audio : true,
    video : true
}

const socket = io()

btnGoRoom.onclick = () => {
    if(inputRoomNumber.value === ''){
        alert("please type a room name")
    }else{
        roomNumber = inputRoomNumber.value
        socket.emit('create or join',roomNumber)
        divSelectRoom.style = "display: none"
        divConsultingRoom.style = "display: block"
    }
}

socket.on('created',room =>{
    navigator.mediaDevices.getUserMedia(streamConstraints)
            .then(stream => {
                localStream = stream
                localVideo.srcObject = stream
                isCaller = true
            })
            .catch(err =>{
                console.log("an error occured",err)
            })
})

socket.on('join',room =>{
    navigator.mediaDevices.getUserMedia(streamConstraints)
            .then(stream => {
                localStream = stream
                localVideo.srcObject = stream
                socket.emit('ready',roomNumber)
            })
            .catch(err =>{
                console.log("an error occured",err)
            })
})

socket.on('ready', () => {
    if(isCaller){
        rtcPeerConnection = new RTCPeerConnection(iceServers)
        rtcPeerConnection.onicecandidate = onicecandidate
        rtcPeerConnection.ontrack = onAddStream
        rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream)
        rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream)
        rtcPeerConnection.createOffer()
            .then(sessionDescription => {
                rtcPeerConnection.setLocalDescription(sessionDescription)
                socket.emit('offer', {
                    type: 'offer',
                    sdp: sessionDescription,
                    room: roomNumber
                })
            })
            .catch(err => {
                console.log(err)
            })
    }
})

socket.on('offer', (event) => {
    if(!isCaller){
        rtcPeerConnection = new RTCPeerConnection(iceServers)
        rtcPeerConnection.onicecandidate = onicecandidate
        rtcPeerConnection.ontrack = onAddStream
        rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream)
        rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream)
        rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event))
        rtcPeerConnection.createAnswer()
            .then(sessionDescription => {
                rtcPeerConnection.setLocalDescription(sessionDescription)
                socket.emit('answer', {
                    type: 'answer',
                    sdp: sessionDescription,
                    room: roomNumber
                })
            })
            .catch(err => {
                console.log(err)
            })
    }
})

socket.on('answer',event => {
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event))
})

function onAddStream(event) {
    remoteVideo.srcObject = event.strams[0]
    remoteStream = event.stream[0]
}