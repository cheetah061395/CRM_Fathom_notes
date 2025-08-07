// Vercel serverless function to get pending summaries
import fs from 'fs/promises';

const SUMMARIES_FILE = '/tmp/pending-summaries.json';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        let summaries = [];
        try {
            const data = await fs.readFile(SUMMARIES_FILE, 'utf8');
            summaries = JSON.parse(data);
        } catch (error) {
            // File doesn't exist yet
        }

        // Return only unprocessed summaries
        const pending = summaries.filter(s => !s.processed);
        res.status(200).json(pending);
    } catch (error) {
        console.error('Error fetching summaries:', error);
        res.status(500).json({ error: 'Failed to fetch summaries' });
    }
}