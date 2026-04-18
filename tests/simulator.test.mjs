import assert from 'node:assert/strict';
import test from 'node:test';
import { PinState, UnoSimulator } from './uno-simulator.mjs';

test('boot banner is printed on serial', () => {
  const sim = new UnoSimulator().boot();
  assert.ok(sim.lines.includes('HELLO Arduino Uno'));
  assert.equal(sim.builtinLedState(), PinState.Low);
});

test('serial commands respond to PING, HELLO, and ADD', () => {
  const sim = new UnoSimulator().boot();

  let startIndex = sim.lines.length;
  sim.sendLine('PING');
  sim.waitForNewLine('PONG', startIndex);

  startIndex = sim.lines.length;
  sim.sendLine('HELLO');
  sim.waitForNewLine('HELLO Arduino Uno', startIndex);

  startIndex = sim.lines.length;
  sim.sendLine('ADD 2 3');
  sim.waitForNewLine('RESULT 5', startIndex);
});

test('LED commands drive the Arduino Uno builtin LED', () => {
  const sim = new UnoSimulator().boot();

  let startIndex = sim.lines.length;
  sim.sendLine('LED ON');
  sim.waitForNewLine('LED ON', startIndex);
  assert.equal(sim.builtinLedState(), PinState.High);

  startIndex = sim.lines.length;
  sim.sendLine('LED OFF');
  sim.waitForNewLine('LED OFF', startIndex);
  assert.equal(sim.builtinLedState(), PinState.Low);
});
