//import { put, list } from '@vercel/blob';
import { requestRainRadar } from '@/lib/fmiQueryData';
import { fetchRadarImages } from '@/lib/radarImageUtils/blobHandling';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { timestamps } = req.body;

        if (!timestamps || timestamps.length === 0) {
            return res.status(400).json({ error: 'No timestamps provided' });
        }

        try {
            const urls = timestamps.map((time) => {
                const config = requestRainRadar(time);
                return `${config.url}?${new URLSearchParams(config.params).toString()}`;
            });

            const imagePaths = await fetchRadarImages(urls, timestamps);

            const result = imagePaths;

            res.status(200).json({ imagePaths: result });
        } catch (error) {
            res.status(500).json({ error: 'Failed to process radar images' });
            throw new Error(error);
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}
