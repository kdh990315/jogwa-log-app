import { useMutation, useQueryClient } from "@tanstack/react-query";

import { signOut } from "@/api/auth";

export function useSignOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await signOut();
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
