import http from 'http';
import { BG } from './dist/index.js';

const PORT = process.env.PORT || 8080;

async function generateToken() {
    try {
        const bg = new BG();
        const challenge = await bg.getChallenge();
        
        if (!challenge) {
            throw new Error('Failed to get challenge');
        }
        
        const poToken = await bg.getPoToken(challenge);
        
        return {
            visitorData: challenge.visitorData,
            poToken: poToken
        };
    } catch (error) {
        console.error('Token generation error:', error);
        throw error;
    }
}

const server = http.createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    
    if (req.url === '/token' || req.url === '/') {
        try {
            const token = await generateToken();
            res.writeHead(200);
            res.end(JSON.stringify(token));
        } catch (error) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: error.message }));
        }
    } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`BgUtils server running on port ${PORT}`);
});
