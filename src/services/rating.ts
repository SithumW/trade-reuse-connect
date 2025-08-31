import { apiClient } from './api';
import { 
  Rating,
  RatingCreate,
  RatingStats 
} from '@/types/api';

class RatingService {
  // Create new rating
  async createRating(data: RatingCreate): Promise<Rating> {
    const response = await apiClient.post<Rating>('/ratings', data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to create rating');
  }

  // Update existing rating (reviewer only)
  async updateRating(ratingId: string, data: Partial<RatingCreate>): Promise<Rating> {
    const response = await apiClient.put<Rating>(`/ratings/${ratingId}`, data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to update rating');
  }

  // Delete rating (reviewer only)
  async deleteRating(ratingId: string): Promise<void> {
    const response = await apiClient.delete(`/ratings/${ratingId}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete rating');
    }
  }

  // Get ratings for specific user
  async getUserRatings(userId: string): Promise<Rating[]> {
    const response = await apiClient.get<Rating[]>(`/ratings/user/${userId}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get user ratings');
  }

  // Get user's rating statistics
  async getUserRatingStats(userId: string): Promise<RatingStats> {
    const response = await apiClient.get<RatingStats>(`/ratings/stats/${userId}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get rating statistics');
  }
}

export const ratingService = new RatingService();
export default ratingService;
