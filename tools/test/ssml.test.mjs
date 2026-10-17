// Tests for tools/lib/ssml.mjs (prompt §8.3 step 3). Run: node --test tools/test/ssml.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { escapeXml, signedPercent, signedHz, edgeSsml, azureSsml } from '../lib/ssml.mjs';

test('escapeXml escapes the five XML specials', () => {
  assert.equal(escapeXml(`a & b < c > "d" 'e'`), 'a &amp; b &lt; c &gt; &quot;d&quot; &apos;e&apos;');
  assert.equal(escapeXml(null), '');
});

test('rates and pitches get the explicit sign Edge requires', () => {
  assert.equal(signedPercent('0%'), '+0%');
  assert.equal(signedPercent('-5%'), '-5%');
  assert.equal(signedPercent('−5%'), '-5%');
  assert.equal(signedPercent('+10%'), '+10%');
  assert.equal(signedPercent('-0%'), '+0%');
  assert.equal(signedPercent(undefined), '+0%');
  assert.equal(signedHz('0Hz'), '+0Hz');
  assert.equal(signedHz('-2Hz'), '-2Hz');
  assert.throws(() => signedPercent('rápido'), /invalid rate/);
  assert.throws(() => signedHz('5%'), /invalid pitch/);
});

test('edgeSsml is plain voice + prosody with escaped text', () => {
  const ssml = edgeSsml({ voice: 'es-MX-JorgeNeural', text: 'I & D <ya> sube… "bien"', rate: '0%' });
  assert.equal(ssml,
    "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='es-MX'>" +
    "<voice name='es-MX-JorgeNeural'><prosody pitch='+0Hz' rate='+0%' volume='+0%'>" +
    'I &amp; D &lt;ya&gt; sube… &quot;bien&quot;</prosody></voice></speak>');
  assert.doesNotMatch(ssml, /bookmark|break|say-as|<sub/);
  assert.throws(() => edgeSsml({ text: 'hola' }), /voice/);
});

test('azureSsml separates chunks with bookmarks c1, c2… and turns ellipses into breaks', () => {
  const ssml = azureSsml({ voice: 'es-MX-DaliaNeural', chunks: ['Uno, dos…', 'tres & cuatro', 'cinco'], rate: '-5%' });
  assert.match(ssml, /^<speak version="1.0" xmlns="http:\/\/www.w3.org\/2001\/10\/synthesis" xmlns:mstts="https:\/\/www.w3.org\/2001\/mstts" xml:lang="es-MX">/);
  assert.match(ssml, /<voice name="es-MX-DaliaNeural"><prosody rate="-5%" pitch="0%">/);
  assert.match(ssml, /Uno, dos<break time="250ms"\/> <bookmark mark="c1"\/>tres &amp; cuatro <bookmark mark="c2"\/>cinco<\/prosody>/);
  assert.doesNotMatch(ssml, /mark="c0"/);
  const styled = azureSsml({ voice: 'v', chunks: ['hola'], style: 'calm' });
  assert.match(styled, /<mstts:express-as style="calm"><prosody/);
});
