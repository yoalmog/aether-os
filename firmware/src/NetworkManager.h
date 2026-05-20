#ifndef NETWORK_MANAGER_H
#define NETWORK_MANAGER_H

#include <Arduino.h>
#include <WiFi.h>
#include <ESPAsyncWebServer.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>
#include <Update.h>
#include "../include/Config.h"
#include "POVEngine.h"

class NetworkManager {
public:
    void init(POVEngine* engine);
    void loop();

private:
    POVEngine* pov;
    AsyncWebServer* server;
    WebSocketsServer* webSocket;

    void onWebSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length);
    void broadcastTelemetry();
    
    unsigned long lastTelemetryMillis = 0;
};

#endif
