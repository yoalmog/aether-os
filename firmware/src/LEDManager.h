#ifndef LED_MANAGER_H
#define LED_MANAGER_H

#include <Arduino.h>
#include <FastLED.h>
#include "../include/Config.h"

// Define 4 arrays for physical LED mapping
extern CRGB leds1[LEDS_PER_STRIP];
extern CRGB leds2[LEDS_PER_STRIP];
extern CRGB leds3[LEDS_PER_STRIP];
extern CRGB leds4[LEDS_PER_STRIP];

class LEDManager {
public:
    void init();
    void renderPolarColumn(int sectorIndex, uint16_t* matrixBuffer);
    void clear();
    void setBrightness(uint8_t b);
private:
    uint8_t brightness = 255;
};

#endif
