#ifndef POV_ENGINE_H
#define POV_ENGINE_H

#include <Arduino.h>
#include "LEDManager.h"

// Active frame buffer for POV
extern uint16_t activeFrame[POV_SECTORS * LEDS_PER_STRIP];

class POVEngine {
public:
    void init(LEDManager* ledMgr);
    void handleInterrupt(); // Called by ISR
    void loop();            // Main loop interpolator
    
    float getRPM();
    
private:
    LEDManager* leds;
    
    volatile unsigned long lastInterruptTime = 0;
    volatile unsigned long revolutionTime = 0;
    volatile bool newRevolution = false;

    float currentRPM = 0.0f;
    int currentSector = 0;
    unsigned long timePerSector = 0;
    unsigned long lastSectorTime = 0;
};

#endif
