#!/usr/bin/env node

const logger = require("./logger.js");
logger.level = "debug";

const mqttServerUrl = process.env.MQTT_SERVER_URL || "mqtt://mqtt.stutzthings.com:1883";
const mqttPrefixPath = process.env.MQTT_PREFIX_PATH || "#";

const influxdbServerHost = process.env.INFLUXDB_SERVER_HOST || "influxdb.stutzthings.com";
const influxdbServerPort = process.env.INFLUXDB_SERVER_PORT || "8086";
const influxdbDatabase = process.env.INFLUXDB_DATABASE || "stutzthings_mqtt";

logger.info("Starting StutzThings MQTT to InfluxDB Bridge");
logger.info("");
logger.info("mqttServerUrl: " + mqttServerUrl);
logger.info("mqttPrefixPath: " + mqttPrefixPath);
logger.info("influxdbServerHost: " + influxdbServerHost);
logger.info("influxdbServerPort: " + influxdbServerPort);
logger.info("influxdbDatabase: " + influxdbDatabase);
logger.info("");

