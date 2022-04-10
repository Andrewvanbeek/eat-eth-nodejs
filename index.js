var express = require('express'),
  app = express(),
  http = require('http'),
  path = require('path'),
  httpServer = http.Server(app)
var bodyParser = require('body-parser')
var cors = require('cors')
require('dotenv').config()
var fs = require('fs')

app.use(express.static(path.join(__dirname, 'public')))
app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))

const {
  initializeApp,
  applicationDefault,
  cert,
} = require('firebase-admin/app')
const {
  getFirestore,
  Timestamp,
  FieldValue,
} = require('firebase-admin/firestore')

const { getStorage } = require('firebase-admin/storage')
// parse application/json
app.use(bodyParser.json({ limit: '50mb' }))

var admin = require('firebase-admin')

var serviceAccount = require('./firebase.json')

initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'eateth-7ee2d.appspot.com',
})

const db = getFirestore()
const bucket = getStorage().bucket()

const crypto = require('crypto')
const assert = require('assert')

let algorithm = 'aes256' // or any other algorithm supported by OpenSSL
let key = process.env.KEY // or any key from .env
let text = 'I love kittens'
const iv = crypto.randomBytes(16)


var fetchFirestoreAccountInfo = async function(labelFolder) {
  const usersRef = db.collection('users');
  const firestoreQuery = await usersRef.where('imageFolder', '==', labelFolder).get();
  return firestoreQuery
}


const encrypt = async function (text, iv_start) {
  var someEncodedString = Buffer.from(process.env.IV, 'utf-8').toString()
  let cipher = crypto.createCipheriv(algorithm, key, someEncodedString)
  let encrypted = cipher.update(text, 'utf8', 'hex') + cipher.final('hex')
  return encrypted
}

const decrypt = async function (encrypted) {
  var someEncodedString = Buffer.from(process.env.IV, 'utf-8').toString()
  let decipher = crypto.createDecipheriv(algorithm, key, someEncodedString)
  let decrypted =
    decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8')
  return decrypted
}

// assert.equal(decrypted, text);

async function base64_encode(file) {
  // read binary data
  var bitmap = fs.readFileSync(file)
  // convert binary data to base64 encoded string
  const contents = new Buffer.from(bitmap).toString('base64')
  return `data:image/png;base64,${contents}`
}

var loadmodels = async function () {
  await faceapi.nets.tinyFaceDetector.loadFromDisk(__dirname + '/public/models')
  await faceapi.nets.faceLandmark68Net.loadFromDisk(
    __dirname + '/public/models',
  )
  await faceapi.nets.faceRecognitionNet.loadFromDisk(
    __dirname + '/public/models',
  )
  await faceapi.nets.faceExpressionNet.loadFromDisk(
    __dirname + '/public/models',
  )
  await faceapi.nets.faceRecognitionNet.loadFromDisk(
    __dirname + '/public/models',
  )
  await faceapi.nets.faceLandmark68Net.loadFromDisk(
    __dirname + '/public/models',
  )
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(__dirname + '/public/models')
}

async function loadLabeledImages(label = 'morty_smith') {
  const labels = [
    'Black Widow',
    'Captain America',
    'Captain Marvel',
    'Hawkeye',
    'Jim Rhodes',
    'Thor',
    'Tony Stark',
    'Andrew',
  ]
  return Promise.all(
    labels.map(async (label) => {
      const descriptions = []
      for (let i = 1; i <= 2; i++) {
        console.log('I am here')
        try {
          const imagePath = `${__dirname}/public/labeled_images/${label}/${i}.jpg`
          const imageDataUrl = await base64_encode(imagePath)
          const img = await faceapi.fetchImage(imageDataUrl)

          // const img = await faceapi.fetchImage(`http://localhost:3000/image/${label}/${i}`)
          console.log(img)
          const detections = await faceapi
            .detectSingleFace(img)
            .withFaceLandmarks()
            .withFaceDescriptor()
          console.log(detections)
          descriptions.push(detections.descriptor)
          if (label == 'Andrew') {
            console.log(detections.descriptor)
          }
        } catch (e) {
          console.log(e)
        }
      }

      return new faceapi.LabeledFaceDescriptors(label, descriptions)
    }),
  )
}

async function loadLabeledImagesFromData(label = 'morty_smith') {
  const descriptions = []
  const metadata = await bucket.getFiles({
    directory: `labeled_images/${label}`,
  })
  // console.log("this is the metadata", metadata[0])
  const folder = metadata[0]
  console.log('these are the files', metadata)
  for (const jpg of folder) {
    const file = await jpg.getSignedUrl({
      action: 'read',
      expires: '09-01-2023',
    })
    console.log('the file', file)
    //const img = await faceapi.fetchImage(file[0])
    const img = await canvas.loadImage(file[0])
    //console.log("this is the img", image)
    const detections = await faceapi
      .detectSingleFace(img)
      .withFaceLandmarks()
      .withFaceDescriptor()
    console.log(detections)
    descriptions.push(detections.descriptor)
  }
  return new faceapi.LabeledFaceDescriptors(label, descriptions)
}

//import '@tensorflow/tfjs-node';
const tf = require('@tensorflow/tfjs-node')

const fetch = require('node-fetch')
// implements nodejs wrappers for HTMLCanvasElement, HTMLImageElement, ImageData
const canvas = require('canvas')

const faceapi = require('face-api.js')
const { storage } = require('firebase-admin')

// patch nodejs environment, we need to provide an implementation of
// HTMLCanvasElement and HTMLImageElement
const { Canvas, Image, ImageData } = canvas
faceapi.env.monkeyPatch({ Canvas, Image, ImageData, fetch: fetch })


const buy = async function(body) {
  var axios = require('axios')
  const walletData = JSON.stringify(body)
  var config = {
    method: 'post',
    url: 'http://localhost:4000/buy',
    headers: { 'Content-Type': 'application/json' },
    data: walletData,
  }

  try {
    var result = await axios(config)
    console.log('DATA', result.data)
    return result.data
  } catch (e) {
    console.log(e)
    return e
  }
}

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html')
})

app.get('/image/:label/:number', function (req, res) {
  try {
    res.sendFile(
      `${__dirname}/public/labeled_images/${req.params.label}/${req.params.number}.jpg`,
    )
  } catch (e) {
    console.log(e)
    res.send(e)
  }
})

app.get('/buckets', async function (req, res) {
  const metadata = await bucket.getFiles({
    directory: 'labeled_images/morty_smith',
  })
  // console.log("this is the metadata", metadata[0])
  const folder = metadata[0]
  console.log('these are the files', metadata)
  const file = await folder[0].getSignedUrl({
    action: 'read',
    expires: '09-01-2023',
  })
  console.log('the file', file)
  const image = await canvas.loadImage(file[0])
  console.log(image)
  res.send({ message: 'check console' })
})

app.post('/register', async function (req, res) {
  var axios = require('axios')
  const walletData = JSON.stringify(req.body)
  var config = {
    method: 'post',
    url: 'http://localhost:4000/createWallet',
    headers: { 'Content-Type': 'application/json' },
    data: walletData,
  }

  try {
    var result = await axios(config)
    console.log('DATA', result.data)
    const { wallet, privateKey } = result.data
    const encryptedKey = await encrypt(privateKey, req.body.guardians_name)
    const newUserData = {
      account_address: wallet.address,
      private_wallet_key: encryptedKey,
      ...req.body,
    }
    const addedData = await db.collection('users').add(newUserData)
    res.send({ message: 'new user registered' })
  } catch (e) {
    console.log(e)
    res.send({ message: 'there was an error' })
  }
})


app.post('/authenticate', async function (req, res) {
  await loadmodels()
  const imageBuffer = req.body.image_buffer

  const labeledFaceDescriptors = await loadLabeledImagesFromData(req.body.label)
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6)
  // console.log('is the image?')
  // console.log(imageBuffer)
  const image = await canvas.loadImage(imageBuffer)
  // console.log('is the image?')
  // console.log('this is the image', image)
  const detections = await faceapi
    .detectAllFaces(image)
    .withFaceLandmarks()
    .withFaceDescriptors()
  //console.log("this is the detections", detections)
  const resizedDetections = faceapi.resizeResults(detections, {
    width: 200,
    height: 200,
  })
  const results = resizedDetections.map((d) =>
    faceMatcher.findBestMatch(d.descriptor),
  )
    const realResults = results.map(function(item){ return item.label})
  console.log("the real resuts#######", realResults)
  if(realResults.includes(req.body.label)) {
    //send items here
    //fetch the ethereum account
    var userAccount  = await fetchFirestoreAccountInfo(`labeled_images/${req.body.label}`)
    console.log("this is the user account", userAccount.docs[0].data())
    var user = userAccount.docs[0].data()
    //user["decrypted_key"] = await decrypt(user.private_wallet_key)
    console.log("new user data", user)
    var receipt = await buy(user)
    res.send({ authenticated: true, receipt: receipt })
  } else {
    res.send({ authenticated: false })
  }
  
})

app.listen(3000)
