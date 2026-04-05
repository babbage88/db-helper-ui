import { toast } from "sonner";

export function showSuccessToast(message: string, description?: string) {
  toast.success(message, {
    description,
  });
}

export function showErrorToast(message: string, description?: string) {
  toast.error(message, {
    description,
  });
}

export function showInfoToast(message: string, description?: string) {
  toast.info(message, {
    description,
  });
}

export function showWarningToast(message: string, description?: string) {
  toast.warning(message, {
    description,
  });
}

export function showLoadingToast(message: string, id?: string) {
  return toast.loading(message, { id });
}

export function updateToast(
  id: string,
  message: string,
  type: "success" | "error" | "info" = "success"
) {
  if (type === "success") {
    toast.success(message, { id });
  } else if (type === "error") {
    toast.error(message, { id });
  } else {
    toast.info(message, { id });
  }
}
