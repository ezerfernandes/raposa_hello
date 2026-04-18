# Arduino Uno hello world

A small Arduino Uno project with:

- a hello-world style sketch
- serial-command based firmware tests
- a `make test` command for terminal automation
- `make size` and `make benchmark` commands to inspect firmware footprint and timing
- `diagram.json` and `wokwi.toml` so the project is ready for the Wokwi VS Code extension

## What is in the sketch?

The firmware prints a boot banner and then accepts a few serial commands:

- `PING` -> `PONG`
- `HELLO` -> `HELLO Arduino Uno`
- `ADD 2 3` -> `RESULT 5`
- `LED ON` / `LED OFF` -> toggles the Uno builtin LED on pin 13

## Quick start

```bash
make test
```

That command will:

1. install a local copy of `arduino-cli` into `.tools/`
2. install the Arduino AVR core if needed
3. install npm dependencies
4. compile the sketch for `arduino:avr:uno`
5. run automated simulator tests from the terminal

## Available targets

```bash
make setup
make build
make test
make size
make benchmark
make timing
make clean
make distclean
```

## Project layout

- `arduino/hello_uno/hello_uno.ino` - Arduino Uno sketch
- `tests/simulator.test.mjs` - automated simulator tests
- `tests/benchmark.mjs` - simulator timing benchmark for boot and command latency
- `tests/uno-simulator.mjs` - shared AVR simulator harness used by tests and benchmarks
- `diagram.json` - Wokwi circuit diagram
- `wokwi.toml` - Wokwi firmware configuration
- `scripts/install-arduino-cli.sh` - local tool bootstrapper

## How the tests work

The repository is configured for the Wokwi VS Code extension, but the automated CLI tests are run locally with `avr8js`, the open-source AVR simulator used for Arduino Uno-class simulation.

The tests verify that:

- the boot message is printed
- serial commands work correctly
- the builtin LED really changes state inside the simulator

## Measuring size and runtime

To inspect flash and RAM usage:

```bash
make size
```

That reports AVR memory usage from `build/hello_uno.ino.elf`, including:

- program storage used in flash
- global/static memory used in SRAM
- a section-by-section size breakdown

To benchmark the firmware in the local simulator:

```bash
make benchmark
```

Or equivalently:

```bash
make timing
```

Because this firmware runs forever inside `loop()`, the timing benchmark reports representative simulated runtime metrics instead of a total "program finished" time. It measures:

- boot time until the sketch prints `READY`
- round-trip latency for the serial commands exercised by the tests

The timing output is reported in AVR CPU cycles and simulated time at 16 MHz, and includes UART receive/transmit time at 115200 baud.

## Using it with Wokwi in VS Code

1. Open the repository in VS Code.
2. Install the recommended `Wokwi Simulator` extension.
3. Run `make build` once so `build/hello_uno.ino.hex` and `build/hello_uno.ino.elf` exist.
4. Start the simulator with `Wokwi: Start Simulator`.

The extension will use `diagram.json` and `wokwi.toml` from this repo.

## Notes

- `make test` is the validated terminal command for automation.
- The Wokwi VS Code extension may require its own Wokwi license depending on your setup; the local terminal tests in this repo do not.
- If you want fully headless cloud execution with official Wokwi infrastructure, use Wokwi's separate `wokwi-cli` with your own API token.
