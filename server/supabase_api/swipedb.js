export const insertSwipe = async (
  token,
  tmdbId,
  action,
  movieTitle,
  posterPath
) => {
  const user = await getUserFromToken(token);

  const { error } = await supabase.from("swipes").insert([{
    user_id: user.id,
    tmdb_id: tmdbId,
    action,
    movie_data: {
      title: movieTitle,
      poster_url: posterPath
    }
  }]);

  if (error) throw error;
  return true;
};

export const checkSwipe = async (token, tmdbId) => {
  const user = await getUserFromToken(token);

  const { data, error } = await supabase
    .from("swipes")
    .select("action")
    .eq("tmdb_id", tmdbId)
    .eq("user_id", user.id)
    .single();

  if (error && error.code === "PGRST116") return false;
  if (error) throw error;

  return data.action;
};