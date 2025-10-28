import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async () => {
  console.log('🔍 DEBUG: Test endpoint called');
  
  const testData = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'API is working'
  };
  
  const json = JSON.stringify(testData);
  console.log('🔍 DEBUG: Returning JSON:', json);
  
  return new Response(json, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
};
