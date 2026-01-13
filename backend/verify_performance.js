const http = require('http');

const HOST = '127.0.0.1';
const PORT = 5001;

const log = (msg, type = 'INFO') => {
    const color = type === 'ERROR' ? '\x1b[31m' : type === 'SUCCESS' ? '\x1b[32m' : '\x1b[34m';
    console.log(`${color}[${type}] ${msg}\x1b[0m`);
};

function request(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const options = {
            hostname: HOST,
            port: PORT,
            path: '/api' + path,
            method: method,
            headers: headers
        };

        const req = http.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => { responseData += chunk; });
            res.on('end', () => {
                try {
                    const json = JSON.parse(responseData);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(json);
                    } else {
                        reject(new Error(json.message || `Request failed with status ${res.statusCode}`));
                    }
                } catch (e) {
                    resolve({ data: responseData });
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function verifyPerformance() {
    try {
        log('--- VERIFYING PERFORMANCE ---');

        // 1. Login as Student 1
        log('Logging in as Student 1...');
        const loginRes = await request('POST', '/auth/login', {
            email: 'student1@test.com',
            password: 'password123',
            role: 'STUDENT'
        });
        
        console.log('Login Response:', JSON.stringify(loginRes, null, 2));

        const token = loginRes.data ? loginRes.data.token : loginRes.token;
        const studentId = loginRes.data ? loginRes.data.id : loginRes.id;
        
        if (!token) throw new Error('Login failed, no token');
        // If login response doesn't have id directly, we might need to decode token or check response structure
        // Let's assume login returns { token, id, ... } based on typical implementations
        // If not, we might fail here.
        
        log(`Logged in. ID: ${studentId}`, 'SUCCESS');

        // 2. Get Performance
        log('Fetching Performance Data...');
        const perfRes = await request('GET', `/student-performance/${studentId}`, null, token);
        
        log('Performance Data Received:', 'SUCCESS');
        console.log(JSON.stringify(perfRes, null, 2));

        // 3. Validate Data
        if (!perfRes.data) throw new Error('No performance data found');
        
        const { average, breakdown, subjects } = perfRes.data;
        
        if (typeof average !== 'number') throw new Error('Average is not a number');
        if (breakdown.exams === 0 && breakdown.tasks === 0) log('Warning: Some scores are 0, check seeding', 'ERROR');
        
        log(`Average Score: ${average}%`, 'SUCCESS');
        log('Breakdown verified.', 'SUCCESS');

        // 4. Instructor Verification
        log('\n--- INSTRUCTOR VERIFICATION ---');
        log('Logging in as Instructor...');
        const instLoginRes = await request('POST', '/auth/login', {
            email: 'dhanushsunny11@gmail.com',
            password: 'Sunny@251869',
            role: 'INSTRUCTOR'
        });
        const instToken = instLoginRes.data ? instLoginRes.data.token : instLoginRes.token;
        if (!instToken) throw new Error('Instructor login failed');
        log('Instructor logged in', 'SUCCESS');

        log(`Fetching performance for Student 1 (ID: ${studentId}) as Instructor...`);
        const instPerfRes = await request('GET', `/student-performance/${studentId}`, null, instToken);
        
        if (!instPerfRes.data) throw new Error('Instructor could not fetch student performance');
        if (instPerfRes.data.average !== average) throw new Error(`Mismatch! Student saw ${average}, Instructor saw ${instPerfRes.data.average}`);
        
        log('Instructor view matches Student view', 'SUCCESS');

    } catch (e) {
        log(`FAILED: ${e.message}`, 'ERROR');
        process.exit(1);
    }
}

verifyPerformance();
