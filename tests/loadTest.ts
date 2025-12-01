/**
 * Load Tester
 * Simulates concurrent requests to valid the rate limiter throughput.
 * Note: Since we don't have a real Redis running in this environment, this test 
 * might fail to connect or default to mock if we wired it up. 
 * This scripts assumes the server is running.
 */
import http from 'http';

const TOTAL_REQUESTS = 1000;
const CONCURRENCY = 50;
const URL = 'http://localhost:3001/api/resource';
const API_KEY = 'pro_user_loadtest';

let completed = 0;
let success = 0;
let throttled = 0;
let failed = 0;

const start = Date.now();

function makeRequest() {
    const req = http.get(URL, {
        headers: { 'x-api-key': API_KEY }
    }, (res) => {
        res.on('data', () => { }); // Consume stream
        res.on('end', () => {
            if (res.statusCode === 200) success++;
            else if (res.statusCode === 429) throttled++;
            else failed++;

            completed++;
            if (completed === TOTAL_REQUESTS) {
                finish();
            } else if (completed < TOTAL_REQUESTS) {
                // Keep pool busy? 
                // Actually this script just fires one batch. Simple simulation.
            }
        });
    });

    req.on('error', (e) => {
        failed++;
        completed++;
        if (completed === TOTAL_REQUESTS) finish();
    });
}

function finish() {
    const duration = (Date.now() - start) / 1000;
    const rps = TOTAL_REQUESTS / duration;

    console.log(`
Load Test Results:
------------------
Total Requests: ${TOTAL_REQUESTS}
Duration:       ${duration.toFixed(2)}s
RPS:            ${rps.toFixed(2)}
Success (200):  ${success}
Throttled (429): ${throttled}
Failed:         ${failed}
    `);
}

// Start batch
console.log(`Starting load test with ${TOTAL_REQUESTS} requests...`);
for (let i = 0; i < TOTAL_REQUESTS; i++) {
    makeRequest();
}
