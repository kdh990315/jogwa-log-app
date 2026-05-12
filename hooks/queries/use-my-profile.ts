import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getMyProfile, updateMyProfile } from "@/api/profiles";
import { profileKeys } from "@/constants/query-keys";
import type { UpdateMyProfileInput } from "@/types/profile";

export function useMyProfile() {
  return useQuery({
    queryFn: getMyProfile,
    queryKey: profileKeys.me(),
  });
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateMyProfileInput) => updateMyProfile(input),
    onSuccess: (profile) => {
      queryClient.setQueryData(profileKeys.me(), profile);
    },
  });
}
