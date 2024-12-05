import { list, del } from '@vercel/blob';

export default async function handler(req, res) {
    try {
        if (req.method !== 'DELETE') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const currentTime = Date.now();
        const threeHoursAgo = currentTime - 3 * 60 * 60 * 1000; // 3 hours in milliseconds

        // List all blobs
        const { blobs } = await list();
        //console.log('blobs: ', blobs);

        // Filter blobs based on the timestamp in their names
        const blobsToDelete = blobs.filter((blob) => {
            if (!blob.pathname) {
                console.warn('Blob has no name:', blob); // Log blobs without names
                return false; // Skip blobs without names
            }
            console.log(blob.pathname);

            const match = blob.pathname.match(
                /radar-image-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.\d{3}Z)\.png/
            );

            if (!match) return false; // Skip if the naming format doesn't match

            const blobTimestamp = new Date(
                match[1].replace(/-(\d{2}-\d{2}\.\d{3}Z)$/, ':$1')
            ).getTime();
            console.log(
                `Blob: ${blob.name}, Timestamp: ${blobTimestamp}, Current Time: ${currentTime}`
            );
            return blobTimestamp < threeHoursAgo;
        });

        // Sends a message that blobs were not deleted
        if (blobsToDelete.length === 0) {
            return res.status(200).json({
                message: 'No blobs to delete.',
            });
        }

        // Delete each old blob
        for (const blob of blobsToDelete) {
            console.log('Deleting blob: ', blob.url);
            await del(blob.url);
        }

        return res.status(200).json({
            message: `Deleted ${blobsToDelete.length} blobs.`,
        });
    } catch (error) {
        console.error('Error during blob cleanup:', error);
        return res.status(500).json({ error: 'Failed to delete old blobs' });
    }
}
