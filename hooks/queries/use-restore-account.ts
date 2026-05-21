import { useMutation, useQueryClient } from "@tanstack/react-query";

import { restoreAccount } from "@/api/auth";
import { profileKeys } from "@/constants/query-keys";

export function useRestoreAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await restoreAccount();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: profileKeys.me() });
    },
  });
}
