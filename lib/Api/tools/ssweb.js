async function ssweb(url = "", full = false, type = "desktop") {
  type = type.toLowerCase();
  if (!["desktop", "tablet", "phone"].includes(type)) type = "desktop";

  const form = new URLSearchParams();
  form.append("url", url);
  form.append("device", type);
  if (!!full) form.append("full", "on");
  form.append("cacheLimit", 0);
  
  const res = await fetch("https://www.screenshotmachine.com/capture.php", {
    method: "POST",
    body: form,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  const cookies = res.headers.get("set-cookie");
  const json = await res.json();

  if (!json.link) {
    throw new Error("Gagal mendapatkan link screenshot.");
  }


  const imgRes = await fetch("https://www.screenshotmachine.com/" + json.link, {
    headers: {
      cookie: cookies || "",
    },
  });

  const arrayBuf = await imgRes.arrayBuffer();
  return Buffer.from(arrayBuf);
}

module.exports = ssweb;
module.exports.default = ssweb;
