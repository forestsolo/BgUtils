import http from 'http';
import { BG } from './dist/index.js';
import { Innertube } from 'youtubei.js';

const PORT = process.env.PORT || 8080;

async function generateToken() {
    try {
        const innertube = await Innertube.create({ retrieve_player: false });
        const visitorData = innertube.session.context.client.visitorData;
        
        // Decode visitorData from base64 URL-safe format
        let decodedVisitorData = visitorData;
        try {
            // visitorData is base64 encoded, decode to get the raw ID
            const decoded = Buffer.from(visitorData.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
            // Extract just the visitor ID part (usually first 11-20 chars)
            decodedVisitorData = decoded.substring(0, 20);
        } catch (e) {
            // Use first 20 chars if decode fails
            decodedVisitorData = visitorData.substring(0, 20);
        }
        
        // Generate a placeholder/cold-start token
        const placeholderPoToken = BG.PoToken.generatePlaceholder(decodedVisitorData);
        
        return {
            visitorData: visitorData,
            poToken: placeholderPoToken
        };
    } catch (error) {
        console.error('Token generation error:', error);
        throw error;
    }
}

const server = http.createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.url === '/token' || req.url === '/') {
        try {
            const token = await generateToken();
            res.writeHead(200);
            res.end(JSON.stringify(token));
        } catch (error) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: error.message }));
        }
    } else if (req.url === '/health') {
        res.writeHead(200);
        res.end(JSON.stringify({ status: 'ok' }));
    } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`BgUtils server running on port ${PORT}`);
});
