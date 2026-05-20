#include "NetworkManager.h"

void NetworkManager::init(POVEngine* engine) {
    pov = engine;
    
    // Setup SoftAP
    WiFi.softAP(AP_SSID, AP_PASSWORD);
    
    server = new AsyncWebServer(HTTP_PORT);
    webSocket = new WebSocketsServer(WS_PORT);

    // OTA Upload Endpoint
    server->on("/update", HTTP_POST, [](AsyncWebServerRequest *request){
        request->send(200, "text/plain", (Update.hasError()) ? "FAIL" : "OK");
    }, [](AsyncWebServerRequest *request, String filename, size_t index, uint8_t *data, size_t len, bool final) {
        if (!index) {
            if (!Update.begin(UPDATE_SIZE_UNKNOWN)) {
                Update.printError(Serial);
            }
        }
        if (Update.write(data, len) != len) {
            Update.printError(Serial);
        }
        if (final) {
            if (Update.end(true)) {
                ESP.restart();
            }
        }
    });

    server->begin();

    // WebSocket Init
    webSocket->begin();
    webSocket->onEvent([this](uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
        this->onWebSocketEvent(num, type, payload, length);
    });
}

void NetworkManager::loop() {
    webSocket->loop();

    // Broadcast telemetry at ~10Hz
    if (millis() - lastTelemetryMillis > 100) {
        broadcastTelemetry();
        lastTelemetryMillis = millis();
    }
}

void NetworkManager::broadcastTelemetry() {
    StaticJsonDocument<256> doc;
    doc["type"] = "telemetry";
    doc["rpm"] = pov->getRPM();
    doc["wifi"] = WiFi.RSSI();
    // Assuming we have a sensor read
    doc["temp"] = temperatureRead(); 
    
    String output;
    serializeJson(doc, output);
    webSocket->broadcastTXT(output);
}

void NetworkManager::onWebSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
    if (type == WStype_BIN) {
        // Direct Frame Injection for Active RAM array via Binary WS
        if (length == sizeof(activeFrame)) {
            memcpy(activeFrame, payload, length);
        }
    }
}
