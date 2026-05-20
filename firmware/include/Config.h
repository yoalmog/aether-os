#ifndef CONFIG_H
#define CONFIG_H

// Hardware Pins
#define HALL_SENSOR_PIN 34
#define MIC_ADC_PIN 35

// LED Arms (4 Arms symmetric)
#define NUM_STRIPS 4
#define LEDS_PER_STRIP 64
#define TOTAL_LEDS (NUM_STRIPS * LEDS_PER_STRIP)

#define STRIP_PIN_1 13
#define STRIP_PIN_2 12
#define STRIP_PIN_3 14
#define STRIP_PIN_4 27

// SD/SPI
#define SD_CS_PIN 5
#define SPI_MOSI_PIN 23
#define SPI_MISO_PIN 19
#define SPI_SCK_PIN 18

// POV Mechanics
#define POV_SECTORS 90
#define POV_MAX_RPM 2400

// Network
#define AP_SSID "HOLOSPIN_X"
#define AP_PASSWORD "12345678"
#define WS_PORT 81
#define HTTP_PORT 80

#endif // CONFIG_H
