const { creator: CREATOR } = require("../creator.json");

async function loli() {
  try {
    const randomPage = Math.floor(Math.random() * 200) + 1;
    const konachanUrl = `https://konachan.com/post.json?tags=loli&limit=50&page=${randomPage}`;

    const proxyList = [
      `https://corsproxy.io/?${encodeURIComponent(konachanUrl)}`,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(konachanUrl)}`,
      `https://cors-anywhere.herokuapp.com/${konachanUrl}`
    ];

    const parsePosts = async (url) => {
      const r = await fetch(url);
      if (!r.ok) throw new Error();
      if (url.includes("codetabs.com")) {
        const t = await r.text();
        return JSON.parse(t);
      }
      return await r.json();
    };

    const posts = await Promise.any(proxyList.map(parsePosts));
    if (!posts || posts.length === 0) {
      return { status: false, creator: CREATOR, images: [] };
    }

    const randomPost = posts[Math.floor(Math.random() * posts.length)];
    const imageUrl = randomPost.file_url;

    const imageProxyList = [
      `https://corsproxy.io/?${encodeURIComponent(imageUrl)}`,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(imageUrl)}`,
      `https://cors-anywhere.herokuapp.com/${imageUrl}`
    ];

    const getImageBuffer = async (url) => {
      const r = await fetch(url);
      if (!r.ok) throw new Error();
      const ab = await r.arrayBuffer();
      return Buffer.from(ab);
    };

    const imageBuffer = await Promise.any(imageProxyList.map(getImageBuffer));

    const formData = new FormData();
    formData.append("reqtype", "fileupload");
    formData.append("fileToUpload", new Blob([imageBuffer]), "image.jpg");

    const uploadRes = await fetch("https://catbox.moe/user/api.php", {
      method: "POST",
      body: formData
    });

    const catboxUrl = (await uploadRes.text()).trim();

    if (!catboxUrl.startsWith("https://")) {
      return { status: false, creator: CREATOR, images: [] };
    }

    return {
      status: true,
      images: [catboxUrl],
      creator: CREATOR
    };

  } catch (err) {
    return {
      status: false,
      creator: CREATOR,
      images: [],
      error: err.message
    };
  }
}

module.exports = loli;
module.exports.default = loli;
