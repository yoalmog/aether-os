#include <Arduino.h>
#include "../include/Config.h"
#include "LEDManager.h"
#include "POVEngine.h"
#include "NetworkManager.h"

LEDManager ledManager;
POVEngine povEngine;
NetworkManager networkManager;

// Interrupt Proxy
void IRAM_ATTR isrProxy() {
    povEngine.handleInterrupt();
}

void setup() {
    Serial.begin(115200);
    Serial.println("AETHER OS - ESP32 POV NODE BOOTING...");

    // Initialize Subsystems
    ledManager.init();
    povEngine.init(&ledManager);
    networkManager.init(&povEngine);

    // Attach Hardware Interrupt
    attachInterrupt(digitalPinToInterrupt(HALL_SENSOR_PIN), isrProxy, FALLING);

    Serial.println("SYSTEM_READY");
}

void loop() {
    // Highly time-critical loop interpolator
    povEngine.loop();
    
    // Background networking (Fast enough not to block POV loop significantly)
    networkManager.loop();
}
