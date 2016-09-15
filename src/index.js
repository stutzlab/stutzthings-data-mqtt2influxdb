#!/usr/bin/env node

const logger = require("./logger.js");
logger.level = "debug";

const mqttServerUrl = process.env.MQTT_SERVER_URL || "mqtt://mqtt.stutzthings.com:1883";
const mqttTopicPattern = process.env.MQTT_TOPIC_PATTERN || "#";

const influxdbHost = process.env.INFLUXDB_SERVER_HOST || "influxdb.stutzthings.com";
const influxdbPort = process.env.INFLUXDB_SERVER_PORT || 8086;
const influxdbDatabase = process.env.INFLUXDB_DATABASE || "stutzthings_mqtt";

logger.info("Starting StutzThings MQTT to InfluxDB Bridge");
logger.info("");
logger.info("mqttServerUrl: " + mqttServerUrl);
logger.info("mqttTopicPattern: " + mqttTopicPattern);
logger.info("influxdbHost: " + influxdbHost);
logger.info("influxdbPort: " + influxdbPort);
logger.info("influxdbDatabase: " + influxdbDatabase);
logger.info("");

var mqtt = require('mqtt').connect(mqttServerUrl);

console.log('Connecting to InfluxDB', influxdbHost);
var influx = require('influx')({
    host: influxdbHost,
    port: influxdbPort,
    protocol: 'http',
    username: 'root',
    password: 'root',
    database: influxdbDatabase
});

var buffer = {};
var bufferCount = 0;

var connected = false;
mqtt.on('connect', function () {
    connected = true;
    console.log('mqtt connected to ' + mqttServerUrl);
    mqtt.subscribe(mqttTopicPattern);
});


mqtt.on('close', function () {
    if (connected) {
        connected = false;
        console.log('mqtt closed ' + mqttServerUrl);
    }
});

mqtt.on('error', function () {
    console.error('mqtt error ' + mqttServerUrl);
});


mqtt.on('message', function (topic, payload, msg) {

    var timestamp = (new Date()).getTime();

    payload = payload.toString();

    logger.info("Message received: " + topic + "=" + payload);

    // var seriesName = topic.replace(/^([^\/]+)\/status\/(.+)/, '$1//$2');
    var seriesName = topic;

    var value = payload;

    //TODO create one series per attribute when mqtt payload has JSON contents
    // try {
    //     var tmp = JSON.parse(payload);
    //     value = tmp.val;
    //     timestamp = tmp.ts || timestamp;
    // } catch (e) {
    //     value = payload;
    // }
    var valueFloat = parseFloat(value);

    if (value === true || value === 'true') {
        value = '1.0';
    } else if (value === false || value === 'false') {
        value = '0.0';
    } else if (isNaN(valueFloat)) {
        // return; // FIXME do we need strings? Creating a field as string leads to errors when trying to write float on it. Can we expect topics to be of the same type always?
        value = '"' + value + '"';
    } else {
        value = '' + valueFloat;
        if (!value.match(/\./)) value = value + '.0';
    }

    logger.info("Point received: " + seriesName + " => " + timestamp + ", " + value);
    if (!buffer[seriesName]) buffer[seriesName] = [];
    buffer[seriesName].push([{value: value, time: timestamp}]);
    bufferCount += 1;
    if (bufferCount > 1000) flushToInfluxDB();

});

function flushToInfluxDB() {
    if (!bufferCount) return;
    //console.log('write', bufferCount);
    influx.writeSeries(buffer, {}, function (err, res) {
        if (err) {
          logger.error(err);
        } else {
          logger.info("Flushed " + bufferCount + " points to InfluxDB");
        }
        buffer = {};
        bufferCount = 0;
    });
}

//flush mqtt changes to influxdb
setInterval(flushToInfluxDB, 1000);
