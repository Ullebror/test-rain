import { list, put } from '@vercel/blob';

const uploadBlobUrl = `/api/uploadBlob`;

export const saveImageToBlob = async (url, timestamp) => {
    const formattedTimestamp = timestamp.replace(/[:?&/\\]/g, '-');
    const fileName = `radar-image-${formattedTimestamp}.png`;

    const blobExistsUrl = await doesBlobExist(fileName);
    if (blobExistsUrl) {
        console.log('image already exists at: ' + blobExistsUrl);
        return blobExistsUrl;
    }

    try {
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(
                `Failed to fetch image from ${url}: ${res.statusText} Status: ${res.status}`
            );
        }

        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const blob = new Blob([buffer], { type: 'image/png' });

        const blobResult = await put(fileName, blob, {
            headers: {
                access: 'public', // Set to 'public' for public access
                contentType: 'blob', // Explicitly set the content type
            },
        });
        console.log(`Image saved to: ${blobResult.url}`);
        return blobResult.url;
    } catch (error) {
        throw new Error(error);
    }
};

// Helper function to check if blob already exists
async function doesBlobExist(fileName) {
    try {
        const response = await list();
        const blobs = response.blobs || [];

        // Find the blob with the specific filename
        const foundBlob = blobs.find((blob) => blob.pathname === `${fileName}`);
        if (foundBlob) {
            return foundBlob.url; // Return the full URL
        }

        return null; // Return null if the blob does not exist
    } catch (error) {
        console.error('Error checking blob existence:', error);
        return null; // Return null in case of an error
    }
}
