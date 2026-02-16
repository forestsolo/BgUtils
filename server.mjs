import http from 'http';
import { BG, default as BgDefault } from './dist/index.js';
import { JSDOM } from 'jsdom';
import { Innertube } from 'youtubei.js';

const PORT = process.env.PORT || 8080;

// Log what BG actually is
console.log('BG type:', typeof BG);
console.log('BG:', BG);
console.log('BgDefault:', BgDefault);

async function generateToken() {
    try {
        const dom = new JSDOM();
        Object.assign(globalThis, {
            window: dom.window,
            document: dom.window.document
        });

        const innertube = await Innertube.create({ retrieve_player: false });
        const visitorData = innertube.session.context.client.visitorData;
        
        // Try different ways to use BG
        let poToken;
        if (typeof BG === 'function') {
            const bg = new BG(innertube);
            poToken = await bg.getPoToken();
        } else if (BG.create) {
            const bg = await BG.create(innertube);
            poToken = await bg.getPoToken();
        } else if (BG.getPoToken) {
            poToken = await BG.getPoToken(innertube);
        } else {
            // Just return what we have
            poToken = 'check_logs';
        }
        
        return {
            visitorData: visitorData,
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
