export function fetchPositions(url) {
  return fetch(url)
    .then(async res => {
      const reader = res.body?.getReader();

      let receivedLength = 0;
      let chunks = [];
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();

          if (value) {
            chunks.push(value);
            receivedLength += value.length;
          }

          if (done) {
            break;
          }
        }

        let chunksAll = new Uint8Array(receivedLength);
        let position = 0;
        for (let chunk of chunks) {
          chunksAll.set(chunk, position);
          position += chunk.length;
        }

        const buffer = chunksAll.buffer;

        return new Float32Array(buffer.slice(0, 432));
      }
    })
}