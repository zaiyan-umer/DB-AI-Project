import { useQuery } from '@tanstack/react-query'
import { fetchProgressOverview } from '../services/progress.service'

export const useProgress = () =>
  useQuery({
    queryKey: ['progress-overview'],
    queryFn: fetchProgressOverview,
    staleTime: 60 * 1000,
  })
