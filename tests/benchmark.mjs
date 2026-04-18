import { CPU_FREQUENCY_HZ, UnoSimulator, cyclesToMicroseconds } from './uno-simulator.mjs';

function formatCycles(cycles) {
  return `${Math.round(cycles).toLocaleString('en-US')} cycles`;
}

function formatDuration(microseconds) {
  if (microseconds >= 1_000) {
    return `${(microseconds / 1_000).toFixed(3)} ms`;
  }

  return `${microseconds.toFixed(1)} µs`;
}

function measureBoot() {
  const sim = new UnoSimulator();
  const startCycles = sim.cpu.cycles;
  sim.boot();
  const cycles = sim.cpu.cycles - startCycles;

  return {
    sim,
    cycles,
    microseconds: cyclesToMicroseconds(cycles),
  };
}

function measureCommand(sim, input, expected) {
  const startCycles = sim.cpu.cycles;
  const startIndex = sim.lines.length;
  sim.sendLine(input);
  sim.waitForNewLine(expected, startIndex);
  const cycles = sim.cpu.cycles - startCycles;

  return {
    input,
    expected,
    cycles,
    microseconds: cyclesToMicroseconds(cycles),
  };
}

const boot = measureBoot();
const commandBenchmarks = [
  ['PING', 'PONG'],
  ['HELLO', 'HELLO Arduino Uno'],
  ['ADD 2 3', 'RESULT 5'],
  ['LED ON', 'LED ON'],
  ['LED OFF', 'LED OFF'],
].map(([input, expected]) => measureCommand(boot.sim, input, expected));

console.log(`Firmware timing benchmark (simulated Arduino Uno @ ${(CPU_FREQUENCY_HZ / 1_000_000).toFixed(2)} MHz)`);
console.log('');
console.log('These timings include UART receive/transmit time at 115200 baud.');
console.log('');
console.log(`Boot to READY: ${formatCycles(boot.cycles)} (${formatDuration(boot.microseconds)})`);
console.log('');
console.log('Serial command round-trip latency:');
for (const result of commandBenchmarks) {
  console.log(
    `  ${result.input.padEnd(7)} -> ${result.expected.padEnd(18)} ${formatCycles(result.cycles).padEnd(18)} ${formatDuration(result.microseconds)}`,
  );
}
console.log('');
console.log('Machine-readable metrics:');
console.log(`METRIC boot_us=${Math.round(boot.microseconds)}`);
for (const result of commandBenchmarks) {
  const metricName = result.input.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  console.log(`METRIC ${metricName}_us=${Math.round(result.microseconds)}`);
}
