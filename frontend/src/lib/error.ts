export function getErrorMessage(err: any): string {
  if (!err) return "Bilinmeyen hata";

  if (typeof err === "string") return err;

  if (err.message) return err.message;

  if (err.error) return err.error;

  return "Beklenmeyen bir hata oluştu.";
}