export const urlDecode = (string)=>{
    const base64Data = decodeURIComponent(string);
    const decodedBuffer = Buffer.from(base64Data, 'base64');
    return decodedBuffer.toString('utf8');
}