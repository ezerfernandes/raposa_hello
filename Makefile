SHELL := /usr/bin/env bash
.DEFAULT_GOAL := help

TOOLS_DIR := .tools
ARDUINO_CLI := $(TOOLS_DIR)/arduino-cli/arduino-cli
FQBN := arduino:avr:uno
SKETCH_DIR := arduino/hello_uno
BUILD_DIR := build
HEX := $(BUILD_DIR)/hello_uno.ino.hex
ELF := $(BUILD_DIR)/hello_uno.ino.elf

.PHONY: help setup build test size benchmark timing clean distclean

help:
	@echo "Targets:"
	@echo "  make setup      Install Arduino CLI, AVR core, and npm dependencies"
	@echo "  make build      Compile the Arduino Uno sketch into $(BUILD_DIR)/"
	@echo "  make test       Compile the sketch and run automated simulator tests"
	@echo "  make size       Report flash/RAM usage for the built firmware"
	@echo "  make benchmark  Measure boot and command latency in the simulator"
	@echo "  make timing     Alias for make benchmark"
	@echo "  make clean      Remove compiled firmware artifacts"
	@echo "  make distclean  Remove build artifacts, npm dependencies, and local tools"

setup: $(ARDUINO_CLI) package-lock.json
	@if [ ! -d node_modules ]; then npm ci; fi
	@if ! $(ARDUINO_CLI) core list | grep -q '^arduino:avr'; then \
		echo 'Installing Arduino AVR core...'; \
		$(ARDUINO_CLI) core update-index; \
		$(ARDUINO_CLI) core install arduino:avr; \
	fi

$(ARDUINO_CLI):
	@bash scripts/install-arduino-cli.sh $(ARDUINO_CLI)

build: setup
	@mkdir -p $(BUILD_DIR)
	@$(ARDUINO_CLI) compile --fqbn $(FQBN) --output-dir $(BUILD_DIR) $(SKETCH_DIR)
	@echo "Built $(HEX) and $(ELF)"

test: build
	@npm test

size: build
	@bash scripts/report-size.sh $(ARDUINO_CLI) $(FQBN) $(SKETCH_DIR) $(ELF)

benchmark: build
	@npm run benchmark

timing: benchmark

clean:
	@rm -rf $(BUILD_DIR)

distclean: clean
	@rm -rf node_modules $(TOOLS_DIR)
