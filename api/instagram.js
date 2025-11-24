import fetch from "node-fetch";

export default async function handler(req, res) {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: "Missing ?username=" });
  }

  try {
    const response = await fetch(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "application/json",
        }
      }
    );

    if (!response.ok) {
      return res.status(500).json({ error: "Instagram returned an error" });
    }

    const data = await response.json();

    const edges =
      data?.data?.user?.edge_owner_to_timeline_media?.edges || [];

    const posts = edges.map((edge) => {
      const n = edge.node;
      return {
        id: n.id,
        shortcode: n.shortcode,
        display_url: n.display_url,
        thumbnail_src: n.thumbnail_src,
        is_video: n.is_video,
        caption: n.edge_media_to_caption.edges?.[0]?.node.text || "",
        comments: n.edge_media_to_parent_comment?.count || 0,
        likes: n.edge_liked_by?.count || 0
      };
    });

    return res.status(200).json(posts);

  } catch (error) {
    return res.status(500).json({ error: "Server error", details: error.message });
  }
}
