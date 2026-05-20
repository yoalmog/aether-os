#include "LEDManager.h"

CRGB leds1[LEDS_PER_STRIP];
CRGB leds2[LEDS_PER_STRIP];
CRGB leds3[LEDS_PER_STRIP];
CRGB leds4[LEDS_PER_STRIP];

void LEDManager::init() {
    FastLED.addLeds<WS2812B, STRIP_PIN_1, GRB>(leds1, LEDS_PER_STRIP);
    FastLED.addLeds<WS2812B, STRIP_PIN_2, GRB>(leds2, LEDS_PER_STRIP);
    FastLED.addLeds<WS2812B, STRIP_PIN_3, GRB>(leds3, LEDS_PER_STRIP);
    FastLED.addLeds<WS2812B, STRIP_PIN_4, GRB>(leds4, LEDS_PER_STRIP);
    
    FastLED.setBrightness(brightness);
    clear();
}

void LEDManager::clear() {
    fill_solid(leds1, LEDS_PER_STRIP, CRGB::Black);
    fill_solid(leds2, LEDS_PER_STRIP, CRGB::Black);
    fill_solid(leds3, LEDS_PER_STRIP, CRGB::Black);
    fill_solid(leds4, LEDS_PER_STRIP, CRGB::Black);
    FastLED.show();
}

void LEDManager::setBrightness(uint8_t b) {
    brightness = b;
    FastLED.setBrightness(brightness);
}

// Render the multi-arm POV slices from the shared memory buffer.
// Assuming arms are physically 90 degrees apart (sectorCount/4 offsets).
void LEDManager::renderPolarColumn(int sectorIndex, uint16_t* matrixBuffer) {
    // 4 arms, separated by 90 degrees.
    int s1 = sectorIndex;
    int s2 = (sectorIndex + POV_SECTORS / 4) % POV_SECTORS;
    int s3 = (sectorIndex + 2 * POV_SECTORS / 4) % POV_SECTORS;
    int s4 = (sectorIndex + 3 * POV_SECTORS / 4) % POV_SECTORS;

    for (int i = 0; i < LEDS_PER_STRIP; i++) {
        // RGB565 conversion from buffer to FastLED CRGB
        uint16_t pix1 = matrixBuffer[s1 * LEDS_PER_STRIP + i];
        uint16_t pix2 = matrixBuffer[s2 * LEDS_PER_STRIP + i];
        uint16_t pix3 = matrixBuffer[s3 * LEDS_PER_STRIP + i];
        uint16_t pix4 = matrixBuffer[s4 * LEDS_PER_STRIP + i];

        leds1[i] = CRGB(
            (pix1 >> 8) & 0xF8,
            (pix1 >> 3) & 0xFC,
            (pix1 << 3) & 0xF8
        );
        leds2[i] = CRGB(
            (pix2 >> 8) & 0xF8,
            (pix2 >> 3) & 0xFC,
            (pix2 << 3) & 0xF8
        );
        leds3[i] = CRGB(
            (pix3 >> 8) & 0xF8,
            (pix3 >> 3) & 0xFC,
            (pix3 << 3) & 0xF8
        );
        leds4[i] = CRGB(
            (pix4 >> 8) & 0xF8,
            (pix4 >> 3) & 0xFC,
            (pix4 << 3) & 0xF8
        );
    }
    
    // Fast parallel trigger
    FastLED.show();
}
