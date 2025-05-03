const http = require('http');

console.log('Running API Gateway connectivity tests...');

// Test vehicle service directly
function testVehicleService() {
  console.log('\n1. Testing direct connection to Vehicle Service');
  
  const vehicleServiceUrl = process.env.VEHICLE_SERVICE_URL || 'http://localhost:3000';
  
  try {
    const url = new URL('/health', vehicleServiceUrl);
    console.log(`Making request to: ${url.toString()}`);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: 'GET',
      timeout: 5000
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}`);
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('✅ DIRECT CONNECTION SUCCESSFUL');
        } else {
          console.log('❌ DIRECT CONNECTION FAILED - Unexpected status code');
        }
        
        // Now test via API Gateway
        testViaApiGateway();
      });
    });
    
    req.on('error', (err) => {
      console.error(`❌ DIRECT CONNECTION ERROR: ${err.message}`);
      // Still try the gateway
      testViaApiGateway();
    });
    
    req.on('timeout', () => {
      console.error('❌ DIRECT CONNECTION TIMEOUT');
      req.destroy();
      // Still try the gateway
      testViaApiGateway();
    });
    
    req.end();
    
  } catch (err) {
    console.error(`❌ DIRECT CONNECTION ERROR: ${err.message}`);
    // Still try the gateway
    testViaApiGateway();
  }
}

// Test via API Gateway
function testViaApiGateway() {
  console.log('\n2. Testing connection via API Gateway');
  
  try {
    const apiGatewayUrl = 'http://localhost:8080';
    
    // Try different endpoints
    const endpoints = [
      '/api/vehicles/health-check',
      '/api/vehicle-health',
      '/api/vehicles',
      '/api/diagnostics'
    ];
    
    let completed = 0;
    
    endpoints.forEach((endpoint, index) => {
      setTimeout(() => {
        const url = new URL(endpoint, apiGatewayUrl);
        console.log(`\nTesting endpoint: ${url.toString()}`);
        
        const options = {
          hostname: url.hostname,
          port: url.port || 80,
          path: url.pathname,
          method: 'GET',
          timeout: 5000
        };
        
        const req = http.request(options, (res) => {
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            console.log(`Status: ${res.statusCode}`);
            console.log(`Response: ${data.substring(0, 500)}${data.length > 500 ? '...' : ''}`);
            
            if (res.statusCode >= 200 && res.statusCode < 300) {
              console.log(`✅ API GATEWAY - ${endpoint} - SUCCESS`);
            } else {
              console.log(`❌ API GATEWAY - ${endpoint} - FAILED (${res.statusCode})`);
            }
            
            completed++;
            if (completed === endpoints.length) {
              console.log('\nConnectivity tests completed.');
            }
          });
        });
        
        req.on('error', (err) => {
          console.error(`❌ API GATEWAY - ${endpoint} - ERROR: ${err.message}`);
          completed++;
          if (completed === endpoints.length) {
            console.log('\nConnectivity tests completed.');
          }
        });
        
        req.on('timeout', () => {
          console.error(`❌ API GATEWAY - ${endpoint} - TIMEOUT`);
          req.destroy();
          completed++;
          if (completed === endpoints.length) {
            console.log('\nConnectivity tests completed.');
          }
        });
        
        req.end();
      }, index * 500); // Stagger requests by 500ms
    });
    
  } catch (err) {
    console.error(`❌ API GATEWAY CONNECTION ERROR: ${err.message}`);
  }
}

// Start tests
testVehicleService(); 