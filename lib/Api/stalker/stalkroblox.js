const { creator: CREATOR } = require("../creator.json");

const postJson = async (url, body) => {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
};

const safeFetchJson = async (url) => {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
};

const stalkroblox = async (username) => {
  if (!username) {
    return {
      error: "Missing parameter ?username=",
      creator: CREATOR
    };
  }

  const searchData = await postJson(
    "https://users.roblox.com/v1/usernames/users",
    { usernames: [username], excludeBannedUsers: true }
  );

  const userData = searchData?.data?.[0];
  if (!userData) {
    return {
      error: `User "${username}" not found`,
      creator: CREATOR
    };
  }

  const userId = userData.id;

  const [
    thumbnail,
    info,
    friends,
    followers,
    following,
    groups,
    badges
  ] = await Promise.all([
    safeFetchJson(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=420x420&format=Png&isCircular=false`),
    safeFetchJson(`https://users.roblox.com/v1/users/${userId}`),
    safeFetchJson(`https://friends.roblox.com/v1/users/${userId}/friends/count`),
    safeFetchJson(`https://friends.roblox.com/v1/users/${userId}/followers/count`),
    safeFetchJson(`https://friends.roblox.com/v1/users/${userId}/followings/count`),
    safeFetchJson(`https://groups.roblox.com/v1/users/${userId}/groups/roles`),
    safeFetchJson(`https://badges.roblox.com/v1/users/${userId}/badges?limit=25&sortOrder=Asc`)
  ]);

  const data = {
    username: userData.name,
    displayName: userData.displayName,
    userId,
    profilePicUrl: thumbnail?.data?.[0]?.imageUrl || null,
    description: info?.description || null,
    joinDate: info?.created || null,
    friendsCount: friends?.count ?? 0,
    followersCount: followers?.count ?? 0,
    followingCount: following?.count ?? 0,
    groups: Array.isArray(groups?.data)
      ? groups.data.map(g => g.group?.name).filter(Boolean)
      : [],
    badges: Array.isArray(badges?.data)
      ? badges.data.map(b => b.name)
      : []
  };

  return {
    success: true,
    data,
    creator: CREATOR
  };
};

module.exports = stalkroblox;
module.exports.default = stalkroblox;
