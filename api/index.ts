import app from '../server.js'; // Ensure the .js extension is included for ESM

export default async function handler(req: any, res: any) {
  const app = await appPromise;
  return app(req, res);
}
