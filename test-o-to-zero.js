// Test file for 'o' to '0' conversion
// Run this in browser console or Node.js to test

import { correctSentence, correctWord, convertOToZero } from "./wordCorrection";

console.log("=== Testing O to 0 Conversion ===\n");

// Test 1: Standalone 'o'
console.log('Test 1: Standalone "o"');
console.log('Input:  "I have o apples"');
console.log("Output:", correctSentence("I have o apples"));
console.log('Expected: "I have 0 apples"\n');

// Test 2: 'o' in numbers
console.log("Test 2: O in numbers");
console.log('Input:  "Call 5o5-1o23"');
console.log("Output:", correctSentence("Call 5o5-1o23"));
console.log('Expected: "Call 505-1023"\n');

// Test 3: Mixed
console.log("Test 3: Mixed scenario");
console.log('Input:  "Room 1o1 has o people"');
console.log("Output:", correctSentence("Room 1o1 has o people"));
console.log('Expected: "Room 101 has 0 people"\n');

// Test 4: Words should NOT change
console.log("Test 4: Words (should NOT change)");
console.log('Input:  "hello go home"');
console.log("Output:", correctSentence("hello go home"));
console.log('Expected: "hello go home"\n');

// Test 5: Multiple o's in numbers
console.log("Test 5: Multiple Os in numbers");
console.log('Input:  "1oo2"');
console.log("Output:", correctWord("1oo2"));
console.log('Expected: "1002"\n');

// Test 6: Phone number
console.log("Test 6: Phone number");
console.log('Input:  "My number is 5o5-1o23-4o56"');
console.log("Output:", correctSentence("My number is 5o5-1o23-4o56"));
console.log('Expected: "My number is 505-1023-4056"\n');

// Test 7: Count from 0 to 10
console.log("Test 7: Count from o to 1o");
console.log('Input:  "Count from o to 1o"');
console.log("Output:", correctSentence("Count from o to 1o"));
console.log('Expected: "Count from 0 to 10"\n');

// Test 8: Room numbers
console.log("Test 8: Room numbers");
console.log('Input:  "Room o1 Room 1o Room 1o1"');
console.log("Output:", correctSentence("Room o1 Room 1o Room 1o1"));
console.log('Expected: "Room 01 Room 10 Room 101"\n');

// Test 9: Case insensitive
console.log("Test 9: Uppercase O");
console.log('Input:  "I have O apples and 5O5 oranges"');
console.log("Output:", correctSentence("I have O apples and 5O5 oranges"));
console.log('Expected: "I have 0 apples and 505 oranges"\n');

// Test 10: Real world scenario
console.log("Test 10: Real world mixed");
console.log('Input:  "go to room 1o1 and call o or 5o5"');
console.log("Output:", correctSentence("go to room 1o1 and call o or 5o5"));
console.log('Expected: "go to room 101 and call 0 or 505"\n');

console.log("=== Tests Complete ===");
