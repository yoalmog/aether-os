#include "POVEngine.h"

uint16_t activeFrame[POV_SECTORS * LEDS_PER_STRIP]; // RAM Buffer

void POVEngine::init(LEDManager* ledMgr) {
    leds = ledMgr;
    pinMode(HALL_SENSOR_PIN, INPUT_PULLUP);
    
    // Fallback initialize black
    memset(activeFrame, 0, sizeof(activeFrame));
}

void IRAM_ATTR POVEngine::handleInterrupt() {
    unsigned long now = micros();
    unsigned long timeDiff = now - lastInterruptTime;
    
    // Debounce noise (assuming max 3000 RPM -> ~20ms per rev)
    if (timeDiff > 10000) {
        revolutionTime = timeDiff;
        lastInterruptTime = now;
        newRevolution = true;
    }
}

void POVEngine::loop() {
    if (newRevolution) {
        newRevolution = false;
        
        currentRPM = 60000000.0f / revolutionTime;
        timePerSector = revolutionTime / POV_SECTORS;
        
        currentSector = 0;
        lastSectorTime = lastInterruptTime;
    }

    if (revolutionTime > 0 && currentSector < POV_SECTORS) {
        unsigned long now = micros();
        if (now - lastSectorTime >= timePerSector) {
            // It's time to render the next sector
            leds->renderPolarColumn(currentSector, activeFrame);
            
            // Increment
            currentSector++;
            lastSectorTime += timePerSector; // Keep timing strict
        }
    }
}

float POVEngine::getRPM() {
    // If we haven't seen an interrupt in 1 second, it's stopped.
    if (micros() - lastInterruptTime > 1000000) return 0;
    return currentRPM;
}
