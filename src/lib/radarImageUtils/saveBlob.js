import { list, put } from '@vercel/blob';

export const saveImageToBlob = async (url, timestamp) => {
    console.log('Timestamp from input: ', timestamp);
    console.log('URL from input: ', url);
    const formattedTimestamp = timestamp.replace(/[:?&/\\]/g, '-');
    const fileName = `radar-image-${formattedTimestamp}.png`;
    console.log('fileName: ', fileName);

    const blobExistsUrl = await doesBlobExist(fileName);
    if (blobExistsUrl) {
        console.log('Image already exists at:', blobExistsUrl);
        return blobExistsUrl;
    }

    const timeout = 10000; // 10 seconds
    const fetchPromise = fetch(url, {
        method: 'GET',
        headers: { Accept: 'image/png' },
    });

    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out')), timeout)
    );

    try {
        const res = await Promise.race([fetchPromise, timeoutPromise]);

        console.log('Response Content-Type:', res.headers.get('Content-Type'));

        const arrayBuffer = await res.arrayBuffer();
        console.log('ArrayBuffer length:', arrayBuffer.byteLength);

        const buffer = Buffer.from(arrayBuffer);

        const blobResult = await put(fileName, buffer, {
            access: 'public',
            contentType: 'image/png',
        });
        console.log('Blob result from put: ', blobResult);

        console.log(`Image saved to: ${blobResult.url}`);
        return blobResult.url;
    } catch (error) {
        throw new Error(`Error saving image to blob: ${error.message}`);
    }
};

async function doesBlobExist(fileName) {
    try {
        let cursor = null;
        do {
            const response = await list({ cursor });
            const blobs = response.blobs || [];
            // Find the blob with the specific filename
            const foundBlob = blobs.find((blob) =>
                blob.pathname.includes(fileName)
            );
            if (foundBlob) {
                return foundBlob.url; // Return the full URL
            }
            cursor = response.cursor;
        } while (cursor); // Continue until no more pages

        return null; // Return null if the blob does not exist
    } catch (error) {
        console.error('Error checking blob existence:', error);
        return null; // Return null in case of an error
    }
}
