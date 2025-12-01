import express from 'express';
import { rateLimitMiddleware } from './middleware';

const app = express();
const PORT = 3001;

app.use(express.json());

// Public health check
app.get('/health', (req, res) => {
    res.send('OK');
});

// Protected route
app.get('/api/resource', rateLimitMiddleware, (req, res) => {
    res.json({
        data: 'Protected Resource Accessed',
        timestamp: new Date().toISOString()
    });
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Rate Limiter Demo running on http://localhost:${PORT}`);
    });
}

export default app;
