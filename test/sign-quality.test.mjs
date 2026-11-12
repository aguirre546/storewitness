import {test} from 'node:test';import assert from 'node:assert/strict';
import {signConfidence,enhanceContrast} from '../src/sign-quality.mjs';
const blocks=words=>[{paragraphs:[{lines:[{words}]}]}];
test('Sign-word confidence is not diluted by unrelated low-quality background words',()=>{assert.equal(signConfidence({confidence:40,blocks:blocks([{text:'CLOSE',confidence:95},{text:'noise',confidence:20}])}),95);});
test('Conflicting sign words retain the lower confidence and partial words do not match',()=>{assert.equal(signConfidence({confidence:42,blocks:blocks([{text:'OPEN',confidence:99},{text:'CLOSED',confidence:85}])}),85);assert.equal(signConfidence({confidence:42,blocks:blocks([{text:'ENCLOSED',confidence:99}])}),42);});
test('Dim but distinguishable pixels expand contrast without changing dimensions or alpha',()=>{const image={width:2,height:1,data:new Uint8ClampedArray([80,80,80,255,120,120,120,255])};enhanceContrast(image);assert.deepEqual([...image.data],[0,0,0,255,255,255,255,255]);assert.equal(image.width,2);});
test('Uniform darkness and missing pixels remain unchanged, not fabricated text',()=>{const image={width:1,height:1,data:new Uint8ClampedArray([0,0,0,255])};assert.equal(enhanceContrast(image),image);assert.equal(signConfidence({}),0);const missing={width:0};assert.equal(enhanceContrast(missing),missing);});
