import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteAccount } from "@/api/auth";

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await deleteAccount();
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
