import http from 'http';
import * as BgUtils from './dist/index.js';
import { JSDOM } from 'jsdom';
import { Innertube } from 'youtubei.js';

const PORT = process.env.PORT || 8080;

// Log available exports on startup
console.log('BgUtils exports:', Object.keys(BgUtils));

async function generateToken() {
    try {
        const innertube = await Innertube.create({ retrieve_player: false });
        
        const requestKey = 'O43z0dpjhgX20SCx4KAo';
        
        const bgChallenge = await innertube.getAttestationChallenge(requestKey);
        
        if (!bgChallenge) {
            throw new Error('Failed to get attestation challenge');
        }
        
        const dom = new JSDOM();
        Object.assign(globalThis, {
            window: dom.window,
            document: dom.window.document
        });
        
        const bgClient = new BgUtils.BgClient({
            program: bgChallenge.program,
            globalName: bgChallenge.globalName,
            bgConfig: bgChallenge.bgConfig
        });
        
        await bgClient.load();
        
        const poToken = await bgClient.snapshot({ webPoSignalOutput: true });
        
        return {
            visitorData: innertube.session.context.client.visitorData,
            poToken: poToken
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
