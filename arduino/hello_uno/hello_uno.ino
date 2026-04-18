#include <Arduino.h>
#include <stdlib.h>
#include <string.h>

namespace {
constexpr unsigned long kBaudRate = 115200;
constexpr size_t kInputBufferSize = 32;
char inputBuffer[kInputBufferSize];
size_t inputLength = 0;

void resetInput() {
  inputLength = 0;
  inputBuffer[0] = '\0';
}

bool parseAddCommand(const char* line, long& left, long& right) {
  if (strncmp(line, "ADD ", 4) != 0) {
    return false;
  }

  char* end = nullptr;
  left = strtol(line + 4, &end, 10);
  if (end == nullptr || *end != ' ') {
    return false;
  }

  right = strtol(end + 1, &end, 10);
  return end != nullptr && *end == '\0';
}

void handleCommand(const char* line) {
  long left = 0;
  long right = 0;

  if (strcmp(line, "PING") == 0) {
    Serial.println(F("PONG"));
  } else if (strcmp(line, "HELLO") == 0) {
    Serial.println(F("HELLO Arduino Uno"));
  } else if (parseAddCommand(line, left, right)) {
    Serial.print(F("RESULT "));
    Serial.println(left + right);
  } else if (strcmp(line, "LED ON") == 0) {
    digitalWrite(LED_BUILTIN, HIGH);
    Serial.println(F("LED ON"));
  } else if (strcmp(line, "LED OFF") == 0) {
    digitalWrite(LED_BUILTIN, LOW);
    Serial.println(F("LED OFF"));
  } else {
    Serial.println(F("ERR"));
  }
}

void ingestSerial() {
  while (Serial.available() > 0) {
    const char c = static_cast<char>(Serial.read());

    if (c == '\r') {
      continue;
    }

    if (c == '\n') {
      inputBuffer[inputLength] = '\0';
      handleCommand(inputBuffer);
      resetInput();
      continue;
    }

    if (inputLength < kInputBufferSize - 1) {
      inputBuffer[inputLength++] = c;
      inputBuffer[inputLength] = '\0';
    } else {
      resetInput();
      Serial.println(F("ERR overflow"));
    }
  }
}
}  // namespace

void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, LOW);

  resetInput();
  Serial.begin(kBaudRate);
  Serial.println(F("HELLO Arduino Uno"));
  Serial.println(F("READY"));
}

void loop() {
  ingestSerial();
}
