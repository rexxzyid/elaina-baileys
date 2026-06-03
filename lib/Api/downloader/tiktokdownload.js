const { creator: CREATOR } = require("../creator.json");

// === Proxy download file ===
async function proxyFile(fileUrl, filename, mimeType) {
  const resp = await fetch(fileUrl);
  const buffer = Buffer.from(await resp.arrayBuffer());

  return {
    statusCode: 200,
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": buffer.length
    },
    body: buffer.toString("base64"),
    isBase64Encoded: true
  };
}

// === Ambil image slide ===
async function fetchImages(url) {
  try {
    const apiUrl = `https://tikwm.com/api/?url=${encodeURIComponent(url)}`;
    const res = await fetch(apiUrl).then(r => r.json());

    if (res.code !== 0 || !res.data?.images || res.data.images.length === 0) {
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: false,
          message: "Gambar tidak ditemukan",
          creator: CREATOR
        }, null, 2)
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: true,
        mode: "image",
        creator: CREATOR,
        images: res.data.images
      }, null, 2)
    };

  } catch (e) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: false,
        message: "Terjadi kesalahan saat mengambil data",
        creator: CREATOR,
        error: e.message
      }, null, 2)
    };
  }
}

async function tiktokdownload(params = {}) {
  try {
    const { url, download } = params;

    if (!url) {
      return {
        status: false,
        message: "Masukkan parameter ?url=",
        creator: CREATOR
      };
    }

    const apiRes = await fetch(
      `https://www.tikwm.com/api?url=${encodeURIComponent(url)}&hd=1`,
      { method: "POST" }
    );

    const json = await apiRes.json();
    const result = json?.data;

    // === Download langsung
    if (download && result) {
      if (download === "video" && (result.hdplay || result.play)) {
        return await proxyFile(result.hdplay || result.play, "tiktok.mp4", "video/mp4");
      }
      if (download === "audio" && result.music) {
        return await proxyFile(result.music, "tiktok.mp3", "audio/mpeg");
      }
    }

    // Video atau slide
    if (result?.play || result?.hdplay) {
      // Jika slide
      if (Array.isArray(result.images) && result.images.length > 0) {
        return await fetchImages(url);
      }

      return {
        status: true,
        mode: "video",
        creator: CREATOR,
        author: {
          unique_id: result.author.unique_id,
          nickname: result.author.nickname
        },
        duration: result.duration,
        cover: result.cover,
        music: result.music,
        play: result.play,
        wmplay: result.wmplay,
        hdplay: result.hdplay
      };
    }

    // fallback slide
    return await fetchImages(url);

  } catch (err) {
    return {
      status: false,
      message: "Server error",
      creator: CREATOR,
      error: String(err)
    };
  }
}

// *** FIX EKSPOR ***
module.exports = tiktokdownload;
module.exports.default = tiktokdownload;
