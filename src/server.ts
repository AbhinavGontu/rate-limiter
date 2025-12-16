import express from 'express';
import { rateLimitMiddleware } from './middleware';

const app = express();
const PORT = 3001;

app.use(express.json());

// Public health check
app.get('/health', (req, res) => {
    res.status(200).json({status: "UP", redis: "CONNECTED"});
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

app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});
