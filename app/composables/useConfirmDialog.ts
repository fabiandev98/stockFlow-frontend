import { useOverlay } from "#imports";
import TheConfirmDialog from "~/components/TheConfirmDialog.vue";

export default function useConfirmDialog() {
  const overlay = useOverlay();
  const confirmDialog = overlay.create(TheConfirmDialog);

  return confirmDialog;
}
