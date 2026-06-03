const { creator: CREATOR } = require("../creator.json");
const cheerio = require("cheerio"); 

async function ttstalk(username) {
  try {
    const url = `https://www.tiktok.com/@${username}?_t=ZS-8tHANz7ieoS&_r=1`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    const scriptData = $('#__UNIVERSAL_DATA_FOR_REHYDRATION__').html();
    if (!scriptData) {
      return {
        status: false,
        message: "User tidak ditemukan atau data tidak tersedia."
      };
    }

    const parsedData = JSON.parse(scriptData);
    const userDetail = parsedData.__DEFAULT_SCOPE__?.["webapp.user-detail"];

    if (!userDetail) {
      return {
        status: false,
        message: "User tidak ditemukan atau data tidak tersedia."
      };
    }

    const userInfo = userDetail.userInfo?.user;
    const stats = userDetail.userInfo?.stats;

    const hasil = {
      id: userInfo?.id || null,
      username: userInfo?.uniqueId || null,
      nama: userInfo?.nickname || null,
      avatar: userInfo?.avatarLarger || null,
      bio: userInfo?.signature || null,
      region: userInfo?.region || "Tidak diketahui",
      verifikasi: userInfo?.verified || false,
      totalfollowers: stats?.followerCount || 0,
      totalmengikuti: stats?.followingCount || 0,
      totaldisukai: stats?.heart || 0,
      totalvideo: stats?.videoCount || 0,
      totalteman: stats?.friendCount || 0
    };

    return {
      status: true,
      creator: CREATOR,
      results: hasil
    };

  } catch (error) {
    return {
      status: false,
      message: error.message || "Terjadi kesalahan saat mengambil data."
    };
  }
}

module.exports = ttstalk;
module.exports.default = ttstalk;
