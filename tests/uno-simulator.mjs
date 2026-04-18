import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  AVRIOPort,
  AVRUSART,
  CPU,
  PinState,
  avrInstruction,
  portBConfig,
  usart0Config,
} from 'avr8js';

export const HEX_PATH = process.env.HEX_PATH || path.join(process.cwd(), 'build', 'hello_uno.ino.hex');
export const FLASH_SIZE_BYTES = 32 * 1024;
export const CPU_FREQUENCY_HZ = 16_000_000;

export function loadIntelHex(filePath, flashSizeBytes = FLASH_SIZE_BYTES) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing firmware hex file: ${filePath}. Run "make build" first.`);
  }

  const program = new Uint16Array(flashSizeBytes / 2);
  const programBytes = new Uint8Array(program.buffer);
  programBytes.fill(0xff);

  const lines = fs.readFileSync(filePath, 'utf8').trim().split(/\r?\n/);
  let baseAddress = 0;

  for (const line of lines) {
    if (!line.startsWith(':')) {
      continue;
    }

    const byteCount = Number.parseInt(line.slice(1, 3), 16);
    const address = Number.parseInt(line.slice(3, 7), 16);
    const recordType = Number.parseInt(line.slice(7, 9), 16);
    const data = line.slice(9, 9 + byteCount * 2);

    if (recordType === 0x00) {
      const absoluteAddress = baseAddress + address;
      for (let index = 0; index < byteCount; index += 1) {
        const value = Number.parseInt(data.slice(index * 2, index * 2 + 2), 16);
        programBytes[absoluteAddress + index] = value;
      }
    } else if (recordType === 0x01) {
      break;
    } else if (recordType === 0x04) {
      baseAddress = Number.parseInt(data, 16) << 16;
    }
  }

  return program;
}

export class UnoSimulator {
  constructor(hexPath = HEX_PATH) {
    this.lines = [];
    this.cpu = new CPU(loadIntelHex(hexPath));
    this.usart = new AVRUSART(this.cpu, usart0Config, CPU_FREQUENCY_HZ);
    this.portB = new AVRIOPort(this.cpu, portBConfig);
    this.usart.onLineTransmit = (line) => {
      this.lines.push(line.replace(/\r$/, ''));
    };
  }

  step(instructionCount = 1) {
    for (let index = 0; index < instructionCount; index += 1) {
      avrInstruction(this.cpu);
      this.cpu.tick();
    }
  }

  runUntil(predicate, maxInstructions = 5_000_000) {
    for (let index = 0; index < maxInstructions; index += 1) {
      if (predicate()) {
        return true;
      }
      avrInstruction(this.cpu);
      this.cpu.tick();
    }
    return false;
  }

  boot() {
    assert.ok(this.runUntil(() => this.lines.includes('READY')), 'Simulator never reached READY');
    return this;
  }

  waitForNewLine(expected, startIndex, maxInstructions = 2_000_000) {
    assert.ok(
      this.runUntil(() => this.lines.slice(startIndex).includes(expected), maxInstructions),
      `Timed out waiting for new serial line: ${expected}`,
    );
    return expected;
  }

  sendLine(text) {
    for (const character of `${text}\n`) {
      let accepted = false;

      for (let retry = 0; retry < 100_000 && !accepted; retry += 1) {
        accepted = this.usart.writeByte(character.charCodeAt(0)) === true;
        this.step(10);
      }

      assert.ok(accepted, `UART did not accept byte: ${JSON.stringify(character)}`);
      assert.ok(this.runUntil(() => !this.usart.rxBusy, 100_000), 'UART receiver stayed busy');
    }
  }

  builtinLedState() {
    return this.portB.pinState(5);
  }
}

export function cyclesToMicroseconds(cycles) {
  return (cycles / CPU_FREQUENCY_HZ) * 1_000_000;
}

export { PinState };
