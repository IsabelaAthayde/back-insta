import fetch from "node-fetch";

export default async function handler(req, res) {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: "Missing ?username=" });
  }

  try {
    const response = await fetch(`https://www.instagram.com/${username}/`, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    if (!response.ok) {
      return res.status(500).json({ error: "Instagram returned an error" });
    }

    const text = await response.text();

    // Extrai o JSON gerado pelo Instagram dentro do HTML
    const jsonStr = text.match(/<script type="text\/javascript">window\._sharedData = (.*);<\/script>/);

    if (!jsonStr) {
      return res.status(500).json({ error: "Could not extract Instagram data" });
    }

    const json = JSON.parse(jsonStr[1]);

    // Extrai posts (caminho padrão do Instagram)
    const edges =
      json.entry_data?.ProfilePage?.[0]?.graphql?.user?.edge_owner_to_timeline_media?.edges || [];

    const posts = edges.map((edge) => ({
      id: edge.node.id,
      shortcode: edge.node.shortcode,
      display_url: edge.node.display_url,
      thumbnail_src: edge.node.thumbnail_src,
      is_video: edge.node.is_video,
      caption: edge.node.edge_media_to_caption.edges?.[0]?.node?.text || "",
      comments: edge.node.edge_media_to_comment.count,
      likes: edge.node.edge_liked_by.count
    }));

    return res.status(200).json(posts);

  } catch (error) {
    return res.status(500).json({ error: "Server error", details: error.message });
  }
}
