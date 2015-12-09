var fs = require('fs');
//var ms = require('ms');
var net = require('net');
var path = require('path');
var arDrone = require('ar-drone');
var spawn = require('child_process').spawn;
var debug = require('debug')('drone-video');
var PaVEParser = require('./node_modules/ar-drone/lib/video/PaVEParser.js');

function record(client, options) {

    var videoFolder = options.videoFolder;

	try {
		fs.accessSync(`${videoFolder}/video.h264`, fs.F_OK);
		fs.unlink(`${videoFolder}/video.h264`);
		fs.accessSync(`${videoFolder}/video.PaVE`, fs.F_OK);
		fs.unlink(`${videoFolder}/video.PaVE`);
		fs.accessSync(`${videoFolder}/video.m4v`, fs.F_OK);
		fs.unlink(`${videoFolder}/video.m4v`);
	} catch(err) {}

	var videoStream = client.getVideoStream();

	var parser = new PaVEParser();

	videoStream.on('data', function(rawData) {

	    parser.write(rawData);

	});

	parser.on('data', function (frame) {
	  // set the "width" and "height"
	  width = frame.display_width;
	  height = frame.display_height;

	  // write to the h264 video file and the mp4 encoder
	  videoH264.write(frame.payload);
	  //ffplay.stdin.write(frame.payload);
	  videoEncoder.stdin.write(frame.payload);
	});

	var videoRaw = fs.createWriteStream(`${videoFolder}/video.PaVE`);
	//socket.pipe(videoRaw);

	/**
	 * Save the parsed h264 stream as "video.h264".
	 * See the `parser` "data" event.
	 */

	var videoH264File = `${videoFolder}/video.h264`;
	var videoH264 = fs.createWriteStream(`${videoFolder}/video.h264`);



	/**
	 * Spawn "ffplay" to play the h264 stream.
	 */
/*
	var ffplay = spawn('ffplay', [
	    '-f', 'h264',
	    '-analyzeduration', '0',
	    '-autoexit',
	    '-'
	  ]
	);
	ffplay.on('exit', function (code, signal) {
	  if (0 == code) shutdown();
	});
*/
	/**
	 * Encode the "video.m4v" file.
	 * See the `parser` "data" event.
	 *
	 * See: https://gist.github.com/4403443
	 */

	var videoEncoderStderr = -1;
	var videoEncoder = spawn('ffmpeg', [
	    '-f', 'h264',
	    '-analyzeduration', '0',
	    '-r', '29.97', // force 30fps?
	    '-i', '-',
	    '-an',
	    `${videoFolder}/video.m4v`
	  ],
	  { stdio: [ -1, -1, videoEncoderStderr ] }
	);
}

module.exports = {
	record: record
};
