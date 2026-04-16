import {supabase} from "../config/db.js";
import { getUserFromToken } from "./authHelper.js";

export const insertReview = async (
  token,
  tmdbId,
  rating,
  reviewText,
  movieTitle,
  posterPath
) => {
  const user = await getUserFromToken(token);

  const { error } = await supabase.from("reviews").insert([{
    user_id: user.id,
    tmdb_id: tmdbId,
    rating,
    review_text: reviewText,
    movie_data: {
      title: movieTitle,
      poster_url: posterPath
    }
  }]);

  if (error) throw error;
  return true;
};