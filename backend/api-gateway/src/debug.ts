import axios, { AxiosError } from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const vehicleServiceUrl = process.env.VEHICLE_SERVICE_URL || 'http://localhost:3000';
const apiGatewayUrl = 'http://localhost:8080';

async function testConnectivity() {
  console.log('⚙️ Testing API Gateway and Vehicle Service connectivity...');
  
  try {
    console.log(`Testing API Gateway health at: ${apiGatewayUrl}/api/gateway/health`);
    const gatewayResponse = await axios.get(`${apiGatewayUrl}/api/gateway/health`);
    console.log('✅ API Gateway health check successful:');
    console.log(gatewayResponse.data);
  } catch (error: unknown) {
    const axiosError = error as AxiosError;
    console.error('❌ API Gateway health check failed:', axiosError.message);
  }

  try {
    console.log(`Testing API Gateway debug endpoint at: ${apiGatewayUrl}/api/debug`);
    const debugResponse = await axios.get(`${apiGatewayUrl}/api/debug`);
    console.log('✅ API Gateway debug endpoint successful:');
    console.log(debugResponse.data);
  } catch (error: unknown) {
    const axiosError = error as AxiosError;
    console.error('❌ API Gateway debug endpoint failed:', axiosError.message);
  }

  try {
    console.log(`Testing direct Vehicle Service connection at: ${vehicleServiceUrl}/health`);
    const vehicleResponse = await axios.get(`${vehicleServiceUrl}/health`);
    console.log('✅ Direct Vehicle Service connection successful:');
    console.log(vehicleResponse.data);
  } catch (error: unknown) {
    const axiosError = error as AxiosError;
    console.error('❌ Direct Vehicle Service connection failed:', axiosError.message);
  }
  
  try {
    console.log(`Testing Vehicle Service through API Gateway at: ${apiGatewayUrl}/api/vehicles`);
    const proxyResponse = await axios.get(`${apiGatewayUrl}/api/vehicles`);
    console.log('✅ Vehicle Service through API Gateway successful:');
    console.log(proxyResponse.data);
  } catch (error: unknown) {
    const axiosError = error as AxiosError;
    console.error('❌ Vehicle Service through API Gateway failed:', axiosError.message);
    if (axiosError.response) {
      console.error('Response status:', axiosError.response.status);
      console.error('Response data:', axiosError.response.data);
    }
  }
}

testConnectivity().catch((err: unknown) => {
  console.error('Unhandled error during connectivity testing:', (err as Error).message);
}); 