var QRAR = require('qrar');
var drone = require('ar-drone');
var Parser = require('ar-drone/lib/video/PaVEParser.js');
var ardrondeConstants = require('ar-drone/lib/constants');

var fs = require('fs');

var _ = require('lodash');

var videoRecord = require('./video.js');
var commands = require('./command.js');

// TODO Read from command line
var videoFolder = './video';
var logFolder = './log';

// Cliente para acceder al dron
client = drone.createClient();
client.config('general:navdata_demo', 'TRUE');
client.config('video:video_channel', 0); // La camara 0 es la frontal, la 3 es la de abajo
client.config('general:navdata_options', 1 << ardrondeConstants.options.MAGNETO); // Abilita la recopilación de los datos del magnetometro

// Crea las variables para guardar los datos de vuelo
var fligthName = new Date(Date.now()).toISOString();
var navdataHistoryStream = fs.createWriteStream(`${logFolder}/history-navdata-${fligthName}.csv`, {flags: 'a'});
var navdataMagnetoStream = fs.createWriteStream(`${logFolder}//history-magneto-${fligthName}.csv`, {flags: 'a'});
// Imprime las cabeceras de los ficheros csv con los datos de vuelo
navdataHistoryStream.write('timestamp,navdata\n');
navdataMagnetoStream.write('time,mx,my,mz,rawx,rawy,rawz\n');

// Cuando hay datos de navegación, se guardan en los ficheros
client.on('navdata', function(data) {

    var time = Date.now();
    var navdatatxt = JSON.stringify(data);

    var csvRowHistory = `${time},${navdatatxt}\n`;
    navdataHistoryStream.write(csvRowHistory);

    // Check if magneto data is available
    if( data.magneto ) {
        var csvRowMagneto = `${time},${data.magneto.mx},${data.magneto.my},${data.magneto.mz},${data.magneto.raw.x},${data.magneto.raw.y},${data.magneto.raw.z}\n`;
        navdataMagnetoStream.write(csvRowMagneto);
    }

});

// Empezar a grabar
videoRecord.record(client, {
    videoFolder: videoFolder
});

// Programa que escanea los codigos QR
var codes = new QRAR(client);

var lastExecutedCode = '';
var isFirstQRDetected = true;
var isReady = true;

function iterateArrayPausable(array, cb) {

    let i = 0;

    function loop () {
        let value = arr[i];
        let wait = _.startsWith(value, 'wait') ? parseInt(value.replace('wait(', '').replace(')', '')) : 0;
        let operation = _.startsWith(value, 'wait') ? ()=>{} : console.log;
        setTimeout(function () {
            operation.call(null, value);
            i++;
            if (i < arr.length) {
                myLoop();
            } else {
                _.defer(cb.bind(null));
            }
        }, wait);
    }

    loop();

}

function executeCodeAfter(code, time, cb) {

    setTimeout(() => {

        if( ! commands.isValidCode(code) ) {
            throw new Error('Code not valid: ' + code);
            return;
        }

        var selectedCommands = commands.getCommand(code);

        iterateArrayPausable(selectedCommands, cb);

    }, time);

}


// Cuando se detecta un QR se procesa

codes.on('qrcode', function (code) {

    if( isReady ) {

        //console.log("Code:", code);

        isReady = false;

        // Check if it is a configurable code
        if( ! commands.isDefaultCode(code) ) {
            // This is a configurable code and is 1 char repeated N times
            // It separate the code char by char, groups by equals char, sorts them and take the char with most occurences
            code = _.chain(code)
                        .words(/./g)
                        .groupBy()
                        .sortBy((el) => el.length * -1) // Descending
                        .first().first()
                        .value();

        }

        // Check if the code is different from the previous one. Executing the same code twice is not allowed
        if( lastExecutedCode === code ) {

            isReady = true;
            return;

        }

        if( ! commands.isValidCode(code) ) {

            isReady = true;
            return;

        }

        //console.log("--- Code:", code);

        // Is start code
        if( isFirstQRDetected && commands.isStartCode(code) ) {

            executeCodeAfter('takeoff', 0, function() {

                executeCodeAfter('stop', 3000, function() {

                    executeCodeAfter('calibrate', 5000, function() {

                        executeCodeAfter('enable-bottom-camera', 2000);
                        executeCodeAfter('initiator', 2000, function() {

                            isReady = true;
                            isFirstQRDetected = false;
                            lastExecutedCode = code;

                        });

                    });

                });

            });

            return;

        }

        if( ! isFirstQRDetected ) {

            executeCodeAfter('stop', 0, function() {

                executeCodeAfter(code, 2000, function() {

                    // Check if it is final code
                    if( commands.isFinalCode(code) ) {

                        isFirstQRDetected = true;
                        executeCodeAfter('enable-front-camera', 0);

                    }

                    isReady = true;
                    lastExecutedCode = code;

                });

            });

            return;

        }

        // Nothing
        isReady = true;
        return;

    }

});

// Empezar a detectar QR
codes.start();
