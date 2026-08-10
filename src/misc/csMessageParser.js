// Pure parser for crop steering (CSLOG) log messages.
// Used by the Crop Steering dashboard to turn LogForClient event messages
// into structured data (phase, shots, VWC, targets, dryback, ...).

export const PHASE_INFO = {
  p0: { name: 'Monitor', description: 'Waiting for dryback signal' },
  p1: { name: 'Saturate', description: 'Block saturation in progress' },
  p2: { name: 'Maintain', description: 'Maintaining moisture level' },
  p3: { name: 'Night', description: 'Night dryback phase' },
};

// True when a LogForClient message belongs to crop steering (CSLOG, shots,
// emergency irrigation, VWC/dryback updates, phase chatter, ...).
// Used to route events into the Crop Steering dashboard and GrowLogs card.
export const isCropSteeringMessage = (msg = '') =>
  /CropSteering|CSLOG|Shot\s+\d+\/\d+|VWC\s*:\s*\d+\.?\d*%|Emergency irrigation|irrigation\s*\(\d+\/\d+\)|dryback|saturat/i.test(msg);

export const parseCSMessage = (msg = '') => {
  const result = {
    phase: null,
    type: 'info',
    shotNumber: null,
    maxShots: null,
    vwc: null,
    vwcTarget: null,
    duration: null,
    nextInterval: null,
    dryback: null,
    fromPhase: null,
    toPhase: null,
  };

  if (!msg) return result;

  if (/P0|p0/.test(msg)) result.phase = 'p0';
  else if (/P1|p1/.test(msg)) result.phase = 'p1';
  else if (/P2|p2/.test(msg)) result.phase = 'p2';
  else if (/P3|p3/.test(msg)) result.phase = 'p3';

  if (/emergency/i.test(msg)) result.type = 'emergency';
  else if (/WARNING|stuck/i.test(msg)) result.type = 'warning';
  else if (/ERROR|failed/i.test(msg)) result.type = 'error';
  else if (/Started|started/i.test(msg)) result.type = 'success';
  else if (msg.includes('->') || msg.includes('→')) result.type = 'transition';
  else if (/Shot\s+\d+\/\d+/i.test(msg)) result.type = 'shot';

  const shotMatch = msg.match(/Shot\s+(\d+)\/(\d+)/i);
  if (shotMatch) {
    result.shotNumber = parseInt(shotMatch[1]);
    result.maxShots = parseInt(shotMatch[2]);
  } else {
    // Fallback for messages like "Emergency irrigation (2/10)" without the "Shot" keyword
    const parenMatch = msg.match(/\((\d+)\/(\d+)\)/);
    if (parenMatch) {
      result.shotNumber = parseInt(parenMatch[1]);
      result.maxShots = parseInt(parenMatch[2]);
    } else {
      // Fallback for older emergency messages like "Emergency irrigation 1/5"
      const irrigationMatch = msg.match(/(?:emergency\s+)?irrigation\s+(\d+)\/(\d+)/i);
      if (irrigationMatch) {
        result.shotNumber = parseInt(irrigationMatch[1]);
        result.maxShots = parseInt(irrigationMatch[2]);
      }
    }
  }

  const vwcMatch = msg.match(/VWC[:\s]+(\d+\.?\d*)%/i);
  if (vwcMatch) result.vwc = parseFloat(vwcMatch[1]);

  // For shot messages like "VWC: 54.2% → 55.1%", use the post-shot value (after the arrow).
  const arrowVwcMatch = msg.match(/[→\->]+\s*(\d+\.?\d*)%/i);
  if (arrowVwcMatch) result.vwc = parseFloat(arrowVwcMatch[1]);

  const targetMatch = msg.match(/target[:\s]+(\d+\.?\d*)%/i);
  if (targetMatch) result.vwcTarget = parseFloat(targetMatch[1]);

  const durationMatch = msg.match(/Duration[:\s]+(\d+)s|\((\d+)s\)/i);
  if (durationMatch) result.duration = parseInt(durationMatch[1] || durationMatch[2]);

  const intervalMatch = msg.match(/Next\s+in[:\s]+(\d+)min/i);
  if (intervalMatch) result.nextInterval = parseInt(intervalMatch[1]);

  const drybackMatch = msg.match(/[Dd]ryback[:\s]+was?\s*(\d+\.?\d*)%?/i);
  if (drybackMatch) result.dryback = parseFloat(drybackMatch[1]);

  const transitionMatch = msg.match(/([Pp][0-3])\s*[→\->]+\s*([Pp][0-3])/);
  if (transitionMatch) {
    result.fromPhase = transitionMatch[1].toLowerCase();
    result.toPhase = transitionMatch[2].toLowerCase();
    result.type = 'transition';
  }

  return result;
};

export default parseCSMessage;
