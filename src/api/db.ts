
import { Client } from 'pg';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, params } = req.body;
  const client = new Client({
    connectionString: process.env.DATABASE_URL || import.meta.env.VITE_DATABASE_URL,
  });

  try {
    await client.connect();
    const result = await client.query(query, params);
    res.status(200).json(result);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: (error as Error).message });
  } finally {
    await client.end();
  }
}
